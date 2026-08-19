const express = require("express");
const { createBooking, payBooking, listBookings } = require("./booking.service");

function createBookingRouter(env) {
  const router = express.Router();

  router.post("/create", async (req, res) => {
    try {
      const {
        userId,
        movieTitle,
        showtimeId,
        showtimeLabel,
        showDate,
        showMonth,
        showYear,
        seatIds,
        seatPrice,
      } = req.body;

      const result = await createBooking({
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
      });

      res.status(201).json(result);
    } catch (error) {
      const status = error.response?.status || 500;
      res.status(status).json({ error: error.response?.data || error.message });
    }
  });

  router.post("/pay", async (req, res) => {
    try {
      const { bookingId, userId } = req.body;
      const result = await payBooking({ env, bookingId, userId });
      res.json(result);
    } catch (error) {
      const status = error.response?.status || 500;
      res.status(status).json({ error: error.response?.data || error.message });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const { userId } = req.query;
      const items = await listBookings({ userId });
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createBookingRouter };
