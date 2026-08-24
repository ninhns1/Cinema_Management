const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    movieTitle: { type: String, required: true },
    showtimeId: { type: String, required: true, index: true },
    showtimeLabel: { type: String, required: true },
    showDate: { type: Number, required: true },
    showMonth: { type: Number, required: true },
    showYear: { type: Number, required: true },
    seatIds: { type: [String], required: true },
    seatPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    holdIds: { type: [String], default: [] },
    holdExpiresAt: { type: Date, default: null },
    bookingStatus: {
      type: String,
      enum: ["PENDING_PAYMENT", "BOOKED", "FAILED", "CANCELLED"],
      default: "PENDING_PAYMENT",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "REFUNDED"],
      default: "UNPAID",
      index: true,
    },
    paymentRef: { type: String, default: null },
    paymentMethod: { type: String, enum: ["CARD", "E_WALLET", "CASH"], default: null },
    refundRef: { type: String, default: null },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);
