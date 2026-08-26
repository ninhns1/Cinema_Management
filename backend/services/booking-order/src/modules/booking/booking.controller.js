const express = require("express");
const { verifyToken } = require("../auth.service");
const {
  createBooking,
  payBooking,
  listBookings,
} = require("./booking.service");

function getAuthenticatedUserId(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  try {
    const payload = verifyToken(token);
    return payload.sub || null;
  } catch (_error) {
    return null;
  }
}

function createBookingRouter(env) {
  const router = express.Router();

  router.post("/create", async (req, res) => {
    try {
      const authUserId = getAuthenticatedUserId(req);
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

      const effectiveUserId = userId || authUserId;
      if (!effectiveUserId) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const result = await createBooking({
        env,
        userId: effectiveUserId,
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
      const authUserId = getAuthenticatedUserId(req);
      const { bookingId, userId } = req.body;
      const effectiveUserId = userId || authUserId;

      if (!effectiveUserId) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const result = await payBooking({
        env,
        bookingId,
        userId: effectiveUserId,
      });
      res.json(result);
    } catch (error) {
      const status = error.response?.status || 500;
      res.status(status).json({ error: error.response?.data || error.message });
    }
  });

  router.get("/", async (req, res) => {
    try {
      const authUserId = getAuthenticatedUserId(req);
      const { userId } = req.query;
      const effectiveUserId = userId || authUserId;

      if (!effectiveUserId) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      const items = await listBookings({ userId: effectiveUserId });
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createBookingRouter };
