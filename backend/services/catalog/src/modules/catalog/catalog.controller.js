const express = require("express");
const crypto = require("crypto");
const { Movie, Event } = require("./catalog.model");
const Showtime = require("./showtime.model");
const { requireAdmin } = require("../../middleware/auth");

function createCatalogRouter(env) {
  const router = express.Router();

  router.get("/movies", async (_req, res) => {
    const items = await Movie.find({ active: true }).sort({ createdAt: 1 }).lean();
    res.json({ items });
  });

  router.get("/events", async (_req, res) => {
    const items = await Event.find({ active: true }).sort({ createdAt: 1 }).lean();
    res.json({ items });
  });

  router.get("/showtimes", async (req, res) => {
    const filter = { active: true };
    if (req.query.movieId) filter.movieId = req.query.movieId;
    const items = await Showtime.find(filter).sort({ startsAt: 1 }).lean();
    res.json({ items });
  });

  const admin = requireAdmin(env);

  router.post("/admin/movies", admin, async (req, res) => {
    try {
      const movie = await Movie.create({
        ...req.body,
        movieId: req.body.movieId || crypto.randomUUID(),
      });
      return res.status(201).json(movie);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.patch("/admin/movies/:movieId", admin, async (req, res) => {
    const movie = await Movie.findOneAndUpdate(
      { movieId: req.params.movieId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!movie) return res.status(404).json({ error: "MOVIE_NOT_FOUND" });
    return res.json(movie);
  });

  router.delete("/admin/movies/:movieId", admin, async (req, res) => {
    const movie = await Movie.findOneAndUpdate(
      { movieId: req.params.movieId },
      { active: false },
      { new: true }
    );
    if (!movie) return res.status(404).json({ error: "MOVIE_NOT_FOUND" });
    return res.json(movie);
  });

  router.post("/admin/showtimes", admin, async (req, res) => {
    try {
      const movie = await Movie.findOne({ movieId: req.body.movieId, active: true }).lean();
      if (!movie) return res.status(404).json({ error: "MOVIE_NOT_FOUND" });

      const showtime = await Showtime.create({
        ...req.body,
        movieTitle: movie.title,
      });
      return res.status(201).json(showtime);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  router.patch("/admin/showtimes/:showtimeId", admin, async (req, res) => {
    const showtime = await Showtime.findOneAndUpdate(
      { showtimeId: req.params.showtimeId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!showtime) return res.status(404).json({ error: "SHOWTIME_NOT_FOUND" });
    return res.json(showtime);
  });

  router.delete("/admin/showtimes/:showtimeId", admin, async (req, res) => {
    const showtime = await Showtime.findOneAndUpdate(
      { showtimeId: req.params.showtimeId },
      { active: false },
      { new: true }
    );
    if (!showtime) return res.status(404).json({ error: "SHOWTIME_NOT_FOUND" });
    return res.json(showtime);
  });

  return router;
}

module.exports = { createCatalogRouter };