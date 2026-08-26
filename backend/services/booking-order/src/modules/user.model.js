const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
    passwordResetTokenHash: { type: String, default: "" },
    passwordResetExpiresAt: { type: Date, default: null },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["CUSTOMER", "ADMIN"],
      default: "CUSTOMER",
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
