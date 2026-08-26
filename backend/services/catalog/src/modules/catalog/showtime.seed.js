const crypto = require("crypto");
const { Movie } = require("./catalog.model");
const Showtime = require("./showtime.model");

const slots = ["09:00 AM", "12:30 PM", "04:00 PM", "07:30 PM", "10:30 PM"];

async function seedShowtimes() {
  if ((await Showtime.countDocuments()) > 0) return;

  const movies = await Movie.find({ active: true }).lean();
  const showtimes = movies.flatMap((movie) =>
    slots.map((label, index) => ({
      showtimeId: crypto.randomUUID(),
      movieId: movie.movieId,
      movieTitle: movie.title,
      showtimeKey: movie.showtimeKey,
      label,
      startsAt: new Date(Date.now() + index * 60 * 60 * 1000),
      seatPrice: 120000,
    }))
  );

  if (showtimes.length) await Showtime.insertMany(showtimes);
}

module.exports = { seedShowtimes };