const express = require("express");
const crypto = require("crypto");
const axios = require("axios");

function buildFraudFeatures({ amount }) {
  const features = Array(30).fill(0);
  features[0] = amount / 100000;
  features[1] = Date.now() / 1000;
  return features;
}

function sortQuery(params) {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join("&");
}

function signQuery(query, secret) {
  return crypto.createHmac("sha512", secret).update(query, "utf8").digest("hex");
}

function createVnpayUrl({ env, bookingId, amount, ipAddress = "127.0.0.1" }) {
  const now = new Date();
  const createDate = now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: env.vnpayTmnCode,
    vnp_Amount: Math.round(amount * 100),
    vnp_CreateDate: createDate,
    vnp_CurrCode: "VND",
    vnp_IpAddr: ipAddress,
    vnp_Locale: "vn",
    vnp_OrderInfo: `Thanh toan ve xem phim ${bookingId}`,
    vnp_OrderType: "other",
    vnp_ReturnUrl: env.vnpayReturnUrl,
    vnp_TxnRef: bookingId,
  };
  const query = sortQuery(params);
  return `${env.vnpayUrl}?${query}&vnp_SecureHash=${signQuery(query, env.vnpayHashSecret)}`;
}

function verifyVnpayResponse(query, secret) {
  const received = String(query.vnp_SecureHash || "").toLowerCase();
  const params = { ...query };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;
  const expected = signQuery(sortQuery(params), secret);
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
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

    if (paymentMethod !== "CASH") {
      if (!env.vnpayTmnCode || !env.vnpayHashSecret) {
        return res.status(503).json({
          error: "VNPAY_NOT_CONFIGURED",
          message: "VNPay merchant configuration is missing.",
        });
      }

      const payment = {
        bookingId,
        amount,
        paymentMethod,
        paymentRef: `PAY-${bookingId}`,
        status: "PENDING",
        fraud,
        paymentUrl: createVnpayUrl({
          env,
          bookingId,
          amount,
          ipAddress: req.ip,
        }),
        createdAt: new Date().toISOString(),
      };
      payments.set(bookingId, payment);
      return res.status(201).json(payment);
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

  async function processVnpayCallback(query, res) {
    if (!verifyVnpayResponse(query, env.vnpayHashSecret)) {
      return res.status(400).json({ error: "INVALID_VNPAY_SIGNATURE" });
    }

    const bookingId = query.vnp_TxnRef;
    const responseCode = query.vnp_ResponseCode;
    const payment = payments.get(bookingId);
    if (responseCode === "00" && payment) {
      payment.status = "SUCCESS";
      payment.paidAt = new Date().toISOString();
      payments.set(bookingId, payment);
      await axios.post(
        `${env.bookingServiceBaseUrl}/api/bookings/payment/vnpay-confirm`,
        {
          bookingId,
          paymentRef: payment.paymentRef,
          paymentMethod: payment.paymentMethod,
        },
        { headers: { "X-Internal-Secret": env.internalCallbackSecret } }
      );
    }

    return res.json({ RspCode: "00", Message: "Confirm Success" });
  }

  router.get("/vnpay-ipn", async (req, res) => {
    try {
      await processVnpayCallback(req.query, res);
    } catch (error) {
      res.status(500).json({ error: "VNPAY_CONFIRMATION_FAILED" });
    }
  });

  router.get("/vnpay-return", async (req, res) => {
    const valid = verifyVnpayResponse(req.query, env.vnpayHashSecret);
    const status = valid && req.query.vnp_ResponseCode === "00" ? "success" : "failed";
    return res.redirect(
      `${env.frontendReturnUrl}?status=${status}&bookingId=${encodeURIComponent(req.query.vnp_TxnRef || "")}`
    );
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
