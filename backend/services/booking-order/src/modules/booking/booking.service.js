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

async function payBooking({ env, bookingId, userId }) {
  const booking = await Booking.findOne({ bookingId, userId });
  if (!booking) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  if (booking.paymentStatus === "PAID") {
    return booking;
  }

  try {
    for (const holdId of booking.holdIds) {
      await axios.post(`${env.seatServiceBaseUrl}/api/seats/confirm`, {
        holdId,
        userId,
      });
    }

    const payment = await axios.post(`${env.paymentServiceBaseUrl}/api/payments/charge`, {
      bookingId,
      amount: booking.totalAmount,
      userId,
    });

    booking.bookingStatus = "BOOKED";
    booking.paymentStatus = "PAID";
    booking.paymentRef = payment.data.paymentRef;
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

module.exports = { createBooking, payBooking, listBookings, getAdminStats };
