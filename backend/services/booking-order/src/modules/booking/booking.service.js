const crypto = require("crypto");
const axios = require("axios");
const Booking = require("./booking.model");

function buildIdempotencyKey({ bookingId, seatId, userId }) {
  return `${bookingId}-${seatId}-${userId}-${crypto.randomUUID()}`;
}

async function createBooking({
  env,
  userId,
  movieTitle,
  showtimeId,
  showtimeLabel,
  showDate,
  showMonth,
  showYear,
  seatIds,
  seatPrice,
}) {
  if (!userId || !movieTitle || !showtimeId || !showtimeLabel) {
    throw new Error("BOOKING_DETAILS_REQUIRED");
  }

  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw new Error("SEATS_REQUIRED");
  }

  if (new Set(seatIds).size !== seatIds.length) {
    throw new Error("DUPLICATE_SEATS");
  }

  if (!Number.isFinite(seatPrice) || seatPrice <= 0) {
    throw new Error("INVALID_SEAT_PRICE");
  }

  const bookingId = crypto.randomUUID();
  const holdIds = [];
  let holdExpiresAt = null;

  try {
    for (const seatId of seatIds) {
      const hold = await axios.post(
        `${env.seatServiceBaseUrl}/api/seats/hold`,
        { showtimeId, seatId, userId },
        {
          headers: {
            "Idempotency-Key": buildIdempotencyKey({ bookingId, seatId, userId }),
          },
        }
      );

      holdIds.push(hold.data.holdId);
      if (!holdExpiresAt || new Date(hold.data.expiresAt) < holdExpiresAt) {
        holdExpiresAt = new Date(hold.data.expiresAt);
      }
    }

    const booking = await Booking.create({
      bookingId,
      userId,
      movieTitle,
      showtimeId,
      showtimeLabel,
      showDate,
      showMonth,
      showYear,
      seatIds,
      seatPrice,
      totalAmount: seatIds.length * seatPrice,
      holdIds,
      holdExpiresAt,
      bookingStatus: "PENDING_PAYMENT",
      paymentStatus: "UNPAID",
    });

    return booking;
  } catch (error) {
    await Promise.allSettled(
      holdIds.map((holdId) =>
        axios.post(`${env.seatServiceBaseUrl}/api/seats/release`, { holdId, userId })
      )
    );
    throw error;
  }
}

async function payBooking({ env, bookingId, userId, paymentMethod }) {
  const booking = await Booking.findOne({ bookingId, userId });
  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  if (booking.paymentStatus === "PAID") {
    return booking;
  }

  try {
    const payment = await axios.post(`${env.paymentServiceBaseUrl}/api/payments/charge`, {
      bookingId,
      amount: booking.totalAmount,
      userId,
      paymentMethod,
    });

    booking.paymentRef = payment.data.paymentRef;
    booking.paymentMethod = payment.data.paymentMethod;
    if (payment.data.status === "PENDING") {
      await booking.save();
      return { ...booking.toObject(), paymentUrl: payment.data.paymentUrl };
    }

    for (const holdId of booking.holdIds) {
      await axios.post(`${env.seatServiceBaseUrl}/api/seats/confirm`, {
        holdId,
        userId,
      });
    }

    booking.bookingStatus = "BOOKED";
    booking.paymentStatus = "PAID";
    booking.paymentRef = payment.data.paymentRef;
    booking.paymentMethod = payment.data.paymentMethod;
    await booking.save();

    return booking;
  } catch (error) {
    booking.bookingStatus = "FAILED";
    await booking.save();
    throw error;
  }
}

async function listBookings({ userId }) {
  return Booking.find({ userId }).sort({ createdAt: -1 }).lean();
}

async function confirmVnpayPayment({ env, bookingId, paymentRef, paymentMethod }) {
  const booking = await Booking.findOne({ bookingId });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (booking.paymentStatus === "PAID") return booking;
  if (booking.paymentRef !== paymentRef) throw new Error("PAYMENT_REFERENCE_MISMATCH");

  for (const holdId of booking.holdIds) {
    await axios.post(`${env.seatServiceBaseUrl}/api/seats/confirm`, {
      holdId,
      userId: booking.userId,
    });
  }

  booking.bookingStatus = "BOOKED";
  booking.paymentStatus = "PAID";
  booking.paymentMethod = paymentMethod || booking.paymentMethod;
  await booking.save();
  return booking;
}

async function cancelBooking({ env, bookingId, userId }) {
  const booking = await Booking.findOne({ bookingId, userId });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (booking.bookingStatus === "CANCELLED") return booking;

  if (booking.paymentStatus === "PAID") {
    if (!booking.paymentRef) throw new Error("PAYMENT_REFERENCE_MISSING");
    const refund = await axios.post(`${env.paymentServiceBaseUrl}/api/payments/refund`, {
      bookingId,
      paymentRef: booking.paymentRef,
      amount: booking.totalAmount,
    });
    booking.paymentStatus = "REFUNDED";
    booking.refundRef = refund.data.refundRef;
    booking.refundedAt = refund.data.refundedAt;
  }

  if (booking.paymentStatus === "REFUNDED") {
    await Promise.all(booking.seatIds.map((seatId) =>
      axios.post(`${env.seatServiceBaseUrl}/api/seats/release-booked`, {
        showtimeId: booking.showtimeId,
        seatId,
        userId,
      }),
    ));
  } else {
    await Promise.all(booking.holdIds.map((holdId) =>
      axios.post(`${env.seatServiceBaseUrl}/api/seats/release`, { holdId, userId }),
    ));
  }
  booking.bookingStatus = "CANCELLED";
  booking.holdIds = [];
  booking.holdExpiresAt = null;
  await booking.save();
  return booking;
}

async function getAdminStats() {
  const [summary] = await Booking.aggregate([
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        paidBookings: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "PAID"] }, 1, 0] },
        },
        revenue: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$totalAmount", 0] },
        },
      },
    },
  ]);

  return summary || { totalBookings: 0, paidBookings: 0, revenue: 0 };
}

module.exports = {
  createBooking,
  payBooking,
  confirmVnpayPayment,
  listBookings,
  cancelBooking,
  getAdminStats,
};
