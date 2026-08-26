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
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    throw new Error("SEATS_REQUIRED");
  }

  const bookingId = crypto.randomUUID();
  const holdIds = [];

  for (const seatId of seatIds) {
    const hold = await axios.post(
      `${env.seatServiceBaseUrl}/api/seats/hold`,
      {
        showtimeId,
        seatId,
        userId,
      },
      {
        headers: {
          "Idempotency-Key": buildIdempotencyKey({ bookingId, seatId, userId }),
        },
      }
    );

    holdIds.push(hold.data.holdId);
  }

  const totalAmount = seatIds.length * seatPrice;

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
    totalAmount,
    holdIds,
    bookingStatus: "PENDING_PAYMENT",
    paymentStatus: "UNPAID",
  });

  return booking;
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
    const payment = await axios.post(`${env.paymentServiceBaseUrl}/api/payments/charge`, {
      bookingId,
      amount: booking.totalAmount,
      userId,
    });

    for (const holdId of booking.holdIds) {
      await axios.post(`${env.seatServiceBaseUrl}/api/seats/confirm`, {
        holdId,
        userId,
      });
    }

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

module.exports = { createBooking, payBooking, listBookings };
