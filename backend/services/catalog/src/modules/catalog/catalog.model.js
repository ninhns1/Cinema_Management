const mongoose = require("mongoose");

const MovieSchema = new mongoose.Schema(
  {
    movieId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    genre: { type: String, required: true },
    rating: { type: String, required: true },
    poster: { type: String, required: true },
    showtimeKey: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const EventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    count: { type: String, required: true },
    banner: { type: String, required: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = {
  Movie: mongoose.model("Movie", MovieSchema),
  Event: mongoose.model("Event", EventSchema),
};