const express = require("express");
const crypto = require("crypto");

function createPaymentRouter() {
  const router = express.Router();
  const payments = new Map();
  const refunds = new Map();

  router.post("/charge", (req, res) => {
    const { bookingId, amount, paymentMethod = "CARD" } = req.body || {};
    if (!bookingId || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "INVALID_PAYMENT_DETAILS" });
    }
    if (!["CARD", "E_WALLET", "CASH"].includes(paymentMethod)) {
      return res.status(400).json({ error: "INVALID_PAYMENT_METHOD" });
    }

    const existing = payments.get(bookingId);
    if (existing) return res.status(200).json(existing);

    const payment = {
      bookingId,
      amount,
      paymentMethod,
      paymentRef: `PAY-${crypto.randomUUID()}`,
      status: "SUCCESS",
      paidAt: new Date().toISOString(),
    };
    payments.set(bookingId, payment);
    return res.status(201).json(payment);
  });

  router.post("/refund", (req, res) => {
    const { bookingId, paymentRef, amount } = req.body || {};
    if (!bookingId || !paymentRef || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "INVALID_REFUND_DETAILS" });
    }
    if (!/^PAY-[a-f0-9-]+$/.test(paymentRef)) {
      return res.status(400).json({ error: "INVALID_PAYMENT_REFERENCE" });
    }
    const existing = refunds.get(bookingId);
    if (existing) return res.status(200).json(existing);

    const refund = {
      bookingId,
      paymentRef,
      refundRef: `REF-${crypto.randomUUID()}`,
      amount,
      status: "REFUNDED",
      refundedAt: new Date().toISOString(),
    };
    refunds.set(bookingId, refund);
    return res.status(201).json(refund);
  });

  return router;
}

module.exports = { createPaymentRouter };
