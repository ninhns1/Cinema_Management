const mongoose = require("mongoose");

const ShowtimeSchema = new mongoose.Schema(
  {
    showtimeId: { type: String, required: true, unique: true, index: true },
    movieId: { type: String, required: true, index: true },
    movieTitle: { type: String, required: true },
    showtimeKey: { type: String, required: true },
    label: { type: String, required: true },
    startsAt: { type: Date, required: true, index: true },
    seatPrice: { type: Number, required: true, min: 1 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Showtime", ShowtimeSchema);