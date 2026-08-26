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

  router.post("/charge", async (req, res) => {
    const { bookingId, amount } = req.body;

    if (!bookingId || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "INVALID_PAYMENT" });
    }

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

    return res.status(201).json({
      bookingId,
      amount,
      paymentRef: `PAY-${crypto.randomUUID()}`,
      status: "SUCCESS",
      fraud,
    });
  });

  return router;
}

module.exports = { createPaymentRouter };
