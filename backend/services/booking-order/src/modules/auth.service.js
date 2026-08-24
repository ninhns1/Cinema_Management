const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");
const User = require("./user.model");
const RefreshToken = require("./refresh.model");

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
  refreshTokens,
  revokeRefreshToken,
  sanitizeUser,
  verifyToken,
};
