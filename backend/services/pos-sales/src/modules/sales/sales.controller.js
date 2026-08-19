const express = require("express");
const crypto = require("crypto");
const { holdSeat, confirmSeat } = require("./sales.service");

function createSalesRouter(env) {
  const router = express.Router();

  router.post("/hold", async (req, res) => {
    try {
      const { showtimeId, seatId, userId } = req.body;
      const requestKey = req.headers["idempotency-key"] || crypto.randomUUID();

      const result = await holdSeat({
        baseUrl: env.seatServiceBaseUrl,
        showtimeId,
        seatId,
        userId,
        requestKey,
      });

      res.status(201).json(result);
    } catch (error) {
      const status = error.response?.status || 500;
      res.status(status).json({ error: error.response?.data || error.message });
    }
  });

  router.post("/confirm", async (req, res) => {
    try {
      const { holdId, userId } = req.body;
      const result = await confirmSeat({
        baseUrl: env.seatServiceBaseUrl,
        holdId,
        userId,
      });
      res.json(result);
    } catch (error) {
      const status = error.response?.status || 500;
      res.status(status).json({ error: error.response?.data || error.message });
    }
  });

  return router;
}

module.exports = { createSalesRouter };
