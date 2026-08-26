const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: Number(process.env.PORT || 4004),
  fraudDetectionUrl:
    process.env.FRAUD_DETECTION_URL || "http://localhost:8000",
  fraudDetectionRequired: process.env.FRAUD_DETECTION_REQUIRED !== "false",
  fraudThreshold: Number(process.env.FRAUD_THRESHOLD || 0.5),
};
