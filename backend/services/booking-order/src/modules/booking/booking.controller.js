const express = require("express");
const { createBooking, payBooking, listBookings, cancelBooking, getAdminStats } = require("./booking.service");
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
        userId: req.user.sub,
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
      const { bookingId, paymentMethod } = req.body;
      const result = await payBooking({ env, bookingId, paymentMethod, userId: req.user.sub });
      res.json(result);
    } catch (error) {
      const status = error.response?.status || 500;
      res.status(status).json({ error: error.response?.data || error.message });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const items = await listBookings({ userId: req.user.sub });
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete("/:bookingId", async (req, res) => {
    try {
      const booking = await cancelBooking({ env, bookingId: req.params.bookingId, userId: req.user.sub });
      return res.json(booking);
    } catch (error) {
      const status = error.message === "BOOKING_NOT_FOUND" ? 404 : error.message === "PAYMENT_REFERENCE_MISSING" ? 409 : error.response?.status || 500;
      return res.status(status).json({ error: error.message });
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
