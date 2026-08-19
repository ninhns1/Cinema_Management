const express = require("express");
const crypto = require("crypto");

function createPaymentRouter() {
  const router = express.Router();

  router.post("/charge", (req, res) => {
    const { bookingId, amount } = req.body;

    res.status(201).json({
      bookingId,
      amount,
      paymentRef: `PAY-${crypto.randomUUID()}`,
      status: "SUCCESS",
    });
  });

  return router;
}

module.exports = { createPaymentRouter };
