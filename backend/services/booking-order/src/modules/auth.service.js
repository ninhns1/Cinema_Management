const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const env = require("../config/env");
const User = require("./user.model");
const RefreshToken = require("./refresh.model");

function createMailTransport() {
  if (!env.smtpUser || !env.smtpPass) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtAccessExpiresIn }
  );
}

function sha256(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

function buildRefreshTokenString() {
  // random UUID + random bytes for extra entropy
  return crypto.randomUUID() + "." + crypto.randomBytes(32).toString("hex");
}

async function createRefreshTokenRecord(userId) {
  const token = buildRefreshTokenString();
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + env.jwtRefreshExpiresDays * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ tokenHash, userId, expiresAt, revoked: false });
  return { token, expiresAt };
}

async function verifyRefreshToken(token) {
  if (!token) throw new Error("MISSING_REFRESH_TOKEN");
  const tokenHash = sha256(token);
  const record = await RefreshToken.findOne({ tokenHash });
  if (!record) throw new Error("REFRESH_NOT_FOUND");
  if (record.revoked) throw new Error("REFRESH_REVOKED");
  if (record.expiresAt < new Date()) throw new Error("REFRESH_EXPIRED");
  return record;
}

async function revokeRefreshToken(token) {
  if (!token) return;
  const tokenHash = sha256(token);
  await RefreshToken.findOneAndUpdate({ tokenHash }, { revoked: true });
}

async function registerUser({ fullName, email, phone, password, adminSecret }) {
  console.log("[registerUser] Received payload:", { fullName, email, phone, adminSecret });
  
  if (!fullName || !email || !password) {
    const error = new Error("Full name, email and password are required.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = String(password).trim();

  if (trimmedPassword.length < 6) {
    const error = new Error("Password must be at least 6 characters long.");
    error.statusCode = 400;
    throw error;
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    console.log("[registerUser] Email already exists:", normalizedEmail);
    const error = new Error("Email is already registered.");
    error.statusCode = 409;
    throw error;
  }

  console.log("[registerUser] Creating user with email:", normalizedEmail);
  const passwordHash = await bcrypt.hash(trimmedPassword, 12);
  
  let role = "CUSTOMER";
  if (adminSecret && adminSecret === env.adminRegistrationSecret && env.adminRegistrationSecret) {
    role = "ADMIN";
  }

  const user = await User.create({
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    phone: phone ? String(phone).trim() : "",
    passwordHash,
    role,
  });

  console.log("[registerUser] User created:", user._id, role);

  const { token: refreshToken } = await createRefreshTokenRecord(user._id.toString());

  return {
    user: sanitizeUser(user),
    accessToken: createAccessToken(user),
    refreshToken,
  };
}

async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = String(password || "").trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const isValid = await bcrypt.compare(trimmedPassword, user.passwordHash);
  if (!isValid) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const { token: refreshToken } = await createRefreshTokenRecord(user._id.toString());

  return {
    user: sanitizeUser(user),
    accessToken: createAccessToken(user),
    refreshToken,
  };
}

async function changePassword({ userId, currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    const error = new Error("Current password and new password are required.");
    error.statusCode = 400;
    throw error;
  }

  const trimmedPassword = String(newPassword).trim();
  if (trimmedPassword.length < 6) {
    const error = new Error("Password must be at least 6 characters long.");
    error.statusCode = 400;
    throw error;
  }

  if (String(currentPassword) === trimmedPassword) {
    const error = new Error("New password must be different from the current password.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  if (!(await bcrypt.compare(String(currentPassword), user.passwordHash))) {
    const error = new Error("Current password is incorrect.");
    error.statusCode = 400;
    throw error;
  }

  user.passwordHash = await bcrypt.hash(trimmedPassword, 12);
  await user.save();
  return { user: sanitizeUser(user), accessToken: createAccessToken(user) };
}

async function updateAvatar({ userId, avatarUrl }) {
  if (typeof avatarUrl !== "string" || avatarUrl.length > 700000) {
    const error = new Error("Invalid avatar.");
    error.statusCode = 400;
    throw error;
  }
  if (avatarUrl && !/^data:image\/(jpeg|png|webp);base64,/.test(avatarUrl)) {
    const error = new Error("Invalid avatar.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(userId, { avatarUrl }, { new: true });
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }
  return { user: sanitizeUser(user), accessToken: createAccessToken(user) };
}

async function updateProfile({ userId, fullName, phone }) {
  const normalizedName = String(fullName || "").trim();
  const normalizedPhone = String(phone || "").trim();
  if (normalizedName.length < 2 || normalizedName.length > 100) {
    const error = new Error("Full name must be between 2 and 100 characters.");
    error.statusCode = 400;
    throw error;
  }
  if (normalizedPhone && !/^[0-9+() .-]{8,20}$/.test(normalizedPhone)) {
    const error = new Error("Invalid phone number.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { fullName: normalizedName, phone: normalizedPhone },
    { new: true, runValidators: true },
  );
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }
  return { user: sanitizeUser(user), accessToken: createAccessToken(user) };
}

async function requestPasswordReset(email) {
  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) return { message: "If the email exists, a reset code has been created." };

  const resetToken = crypto.randomBytes(24).toString("hex");
  user.passwordResetTokenHash = sha256(resetToken);
  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
  await createMailTransport().sendMail({
    from: env.smtpFrom,
    to: user.email,
    subject: "Cinema Management - Password reset code",
    text: `Your password reset code is:\n\n${resetToken}\n\nThis code expires in 15 minutes. If you did not request this, ignore this email.`,
  });
  return {
    message: "If the email exists, a reset code has been sent.",
  };
}

async function resetPassword({ resetToken, newPassword }) {
  const trimmedPassword = String(newPassword || "").trim();
  if (!resetToken || trimmedPassword.length < 6) {
    const error = new Error("Reset code and a password of at least 6 characters are required.");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({
    passwordResetTokenHash: sha256(resetToken),
    passwordResetExpiresAt: { $gt: new Date() },
  });
  if (!user) {
    const error = new Error("Reset code is invalid or expired.");
    error.statusCode = 400;
    throw error;
  }

  user.passwordHash = await bcrypt.hash(trimmedPassword, 12);
  user.passwordResetTokenHash = "";
  user.passwordResetExpiresAt = null;
  await user.save();
  return { user: sanitizeUser(user), accessToken: createAccessToken(user) };
}

async function refreshTokens({ refreshToken }) {
  const record = await verifyRefreshToken(refreshToken);
  // rotate: revoke old and create new
  await RefreshToken.findByIdAndUpdate(record._id, { revoked: true });
  const newRec = await createRefreshTokenRecord(record.userId);

  const user = await User.findById(record.userId);
  if (!user) throw new Error("USER_NOT_FOUND");

  return {
    user: sanitizeUser(user),
    accessToken: createAccessToken(user),
    refreshToken: newRec.token,
  };
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  updateAvatar,
  updateProfile,
  requestPasswordReset,
  resetPassword,
  refreshTokens,
  revokeRefreshToken,
  sanitizeUser,
  verifyToken,
};
