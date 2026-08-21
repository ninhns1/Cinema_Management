const mongoose = require("mongoose");

const RefreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema);
