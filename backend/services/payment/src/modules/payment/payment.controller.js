const express = require("express");
const crypto = require("crypto");
const axios = require("axios");

function buildFraudFeatures({ amount }) {
  const features = Array(30).fill(0);
  features[0] = amount / 100000;
  features[1] = Date.now() / 1000;
  return features;
}

function createPaymentRouter({ env }) {
  const router = express.Router();
  const payments = new Map();
  const refunds = new Map();

  router.post("/charge", async (req, res) => {
    const { bookingId, amount, paymentMethod = "CARD" } = req.body || {};
    if (!bookingId || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "INVALID_PAYMENT_DETAILS" });
    }
    if (!["CARD", "E_WALLET", "CASH"].includes(paymentMethod)) {
      return res.status(400).json({ error: "INVALID_PAYMENT_METHOD" });
    }

    const existing = payments.get(bookingId);
    if (existing) return res.status(200).json(existing);

    let fraud = { status: "SKIPPED", isFraud: false, riskScore: null };
    try {
      const prediction = await axios.post(
        `${env.fraudDetectionUrl}/predict`,
        { features: buildFraudFeatures({ amount }) },
        { timeout: 3000 }
      );
      fraud = {
        status: prediction.data.status,
        isFraud: prediction.data.is_fraud,
        riskScore: prediction.data.risk_score,
      };
    } catch (error) {
      if (env.fraudDetectionRequired) {
        return res.status(503).json({
          error: "FRAUD_SERVICE_UNAVAILABLE",
          message: "Payment risk screening is temporarily unavailable.",
        });
      }
    }

    if (fraud.isFraud || fraud.riskScore >= env.fraudThreshold) {
      return res.status(402).json({
        error: "PAYMENT_REJECTED_BY_FRAUD_SCREENING",
        fraud,
      });
    }

    const payment = {
      bookingId,
      amount,
      paymentMethod,
      paymentRef: `PAY-${crypto.randomUUID()}`,
      status: "SUCCESS",
      fraud,
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
