const express = require("express");
const {
  holdSeat,
  confirmHeldSeat,
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
