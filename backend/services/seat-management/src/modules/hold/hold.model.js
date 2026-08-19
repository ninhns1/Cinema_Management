const mongoose = require("mongoose");

const HoldSchema = new mongoose.Schema(
  {
    holdId: { type: String, required: true, unique: true, index: true },
    showtimeId: { type: String, required: true, index: true },
    seatId: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["ACTIVE", "CONFIRMED", "EXPIRED", "RELEASED"],
      default: "ACTIVE",
      index: true,
    },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

HoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Hold", HoldSchema);
