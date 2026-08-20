const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["CUSTOMER", "ADMIN"], default: "CUSTOMER", index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);