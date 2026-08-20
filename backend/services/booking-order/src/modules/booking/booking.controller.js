const express = require("express");
const { createBooking, payBooking, listBookings, getAdminStats } = require("./booking.service");
const { requireAuth, requireAdmin } = require("../../middleware/auth");

function createBookingRouter(env) {
  const router = express.Router();
  router.use(requireAuth(env));

  router.post("/create", async (req, res) => {
    try {
      const {
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
        userId: req.user.userId,
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
      const { bookingId } = req.body;
      const result = await payBooking({ env, bookingId, userId: req.user.userId });
      res.json(result);
    } catch (error) {
      const status = error.response?.status || 500;
      res.status(status).json({ error: error.response?.data || error.message });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const items = await listBookings({ userId: req.user.userId });
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get("/admin/stats", requireAdmin(env), async (_req, res) => {
    try {
      res.json(await getAdminStats());
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createBookingRouter };
