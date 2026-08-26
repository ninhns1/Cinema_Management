const express = require("express");
const {
  holdSeat,
  confirmHeldSeat,
  releaseHeldSeat,
  releaseBookedSeat,
  releaseExpiredHolds,
} = require("../hold/hold.service");

function createSeatRouter(ctx) {
  const router = express.Router();

  router.get("/:showtimeId", async (req, res) => {
    const seats = await ctx.Seat.find({ showtimeId: req.params.showtimeId }).lean();
    res.json({ items: seats });
  });

  router.post("/hold", async (req, res) => {
    try {
      const { showtimeId, seatId, userId } = req.body;
      const requestKey = req.headers["idempotency-key"];
      const result = await holdSeat({
        showtimeId,
        seatId,
        userId,
        requestKey,
        holdMinutes: ctx.env.seatHoldMinutes,
        lockTtlMs: ctx.env.lockTtlMs,
        redisClient: ctx.redis.commandClient,
        realtimePublisher: ctx.realtimePublisher,
      });
      res.status(201).json(result);
    } catch (error) {
      res.status(409).json({ error: error.message });
    }
  });

  router.post("/confirm", async (req, res) => {
    try {
      const { holdId, userId } = req.body;
      const result = await confirmHeldSeat({
        holdId,
        userId,
        lockTtlMs: ctx.env.lockTtlMs,
        redisClient: ctx.redis.commandClient,
        realtimePublisher: ctx.realtimePublisher,
      });
      res.json(result);
    } catch (error) {
      res.status(409).json({ error: error.message });
    }
  });

  router.post("/release", async (req, res) => {
    try {
      const { holdId, userId } = req.body;
      if (!holdId || !userId) {
        return res.status(400).json({ error: "HOLD_ID_AND_USER_ID_REQUIRED" });
      }

      const result = await releaseHeldSeat({
        holdId,
        userId,
        lockTtlMs: ctx.env.lockTtlMs,
        redisClient: ctx.redis.commandClient,
        realtimePublisher: ctx.realtimePublisher,
      });
      return res.json(result);
    } catch (error) {
      return res.status(409).json({ error: error.message });
    }
  });

  router.post("/release-booked", async (req, res) => {
    try {
      const { showtimeId, seatId, userId } = req.body;
      if (!showtimeId || !seatId || !userId) return res.status(400).json({ error: "SEAT_DETAILS_REQUIRED" });
      const result = await releaseBookedSeat({
        showtimeId,
        seatId,
        userId,
        lockTtlMs: ctx.env.lockTtlMs,
        redisClient: ctx.redis.commandClient,
        realtimePublisher: ctx.realtimePublisher,
      });
      return res.json(result);
    } catch (error) {
      return res.status(409).json({ error: error.message });
    }
  });

  router.post("/release-expired", async (_req, res) => {
    await releaseExpiredHolds({
      lockTtlMs: ctx.env.lockTtlMs,
      redisClient: ctx.redis.commandClient,
      realtimePublisher: ctx.realtimePublisher,
    });
    res.json({ status: "ok" });
  });

  return router;
}

module.exports = { createSeatRouter };
