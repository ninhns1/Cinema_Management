const mongoose = require("mongoose");

const SeatSchema = new mongoose.Schema(
  {
    showtimeId: { type: String, required: true, index: true },
    seatId: { type: String, required: true },
    status: {
      type: String,
      enum: ["AVAILABLE", "HELD", "BOOKED"],
      default: "AVAILABLE",
      index: true,
    },
    holdId: { type: String, default: null },
    heldBy: { type: String, default: null },
    holdExpiresAt: { type: Date, default: null, index: true },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SeatSchema.index({ showtimeId: 1, seatId: 1 }, { unique: true });

module.exports = mongoose.model("Seat", SeatSchema);
