const { Movie, Event } = require("./catalog.model");

const movies = [
  ["movie-1", "Maa", "Fantasy/Horror/Thriller", "7.2 - 2.7K votes", "/assets/posters/maa.svg", "maa-2026-08-19"],
  ["movie-2", "Kannappa", "Action/Drama/Fantasy", "7.3 - 10.7K votes", "/assets/posters/kannappa.svg", "kannappa-2026-08-19"],
  ["movie-3", "Mission: Impossible", "Action/Adventure/Thriller", "8.6 - 84.1K votes", "/assets/posters/mission.svg", "mi-2026-08-19"],
  ["movie-4", "F1: The Movie", "Action/Drama/Sports", "9.5 - 6.8K votes", "/assets/posters/f1.svg", "f1-2026-08-19"],
  ["movie-5", "Ballerina", "Action/Thriller", "8.7 - 15.2K votes", "/assets/posters/ballerina.svg", "ballerina-2026-08-19"],
].map(([movieId, title, genre, rating, poster, showtimeKey]) => ({
  movieId,
  title,
  genre,
  rating,
  poster,
  showtimeKey,
}));

const events = [
  ["event-1", "Comedy Shows", "205+ Events", "/assets/events/comedy.svg"],
  ["event-2", "Amusement Park", "20+ Events", "/assets/events/amusement.svg"],
  ["event-3", "Theatre Shows", "80+ Events", "/assets/events/theatre.svg"],
  ["event-4", "Kids", "25+ Events", "/assets/events/kids.svg"],
  ["event-5", "Music Shows", "10+ Events", "/assets/events/music.svg"],
].map(([eventId, title, count, banner]) => ({ eventId, title, count, banner }));

async function seedCatalog() {
  if ((await Movie.countDocuments()) === 0) await Movie.insertMany(movies);
  if ((await Event.countDocuments()) === 0) await Event.insertMany(events);
}

module.exports = { seedCatalog };