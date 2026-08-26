const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: Number(process.env.PORT || 4004),
  fraudDetectionUrl:
    process.env.FRAUD_DETECTION_URL || "http://localhost:8000",
  fraudDetectionRequired: process.env.FRAUD_DETECTION_REQUIRED !== "false",
  fraudThreshold: Number(process.env.FRAUD_THRESHOLD || 0.5),
  vnpayTmnCode: process.env.VNP_TMN_CODE || "",
  vnpayHashSecret: process.env.VNP_HASH_SECRET || "",
  vnpayUrl:
    process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  vnpayReturnUrl: process.env.VNP_RETURN_URL || "http://localhost:4004/api/payments/vnpay-return",
  vnpayIpnUrl: process.env.VNP_IPN_URL || "http://localhost:4004/api/payments/vnpay-ipn",
  frontendReturnUrl: process.env.FRONTEND_RETURN_URL || "http://localhost:5173/payment-result",
  bookingServiceBaseUrl: process.env.BOOKING_SERVICE_BASE_URL || "http://localhost:4003",
  internalCallbackSecret: process.env.INTERNAL_CALLBACK_SECRET || "development-only-secret",
};
