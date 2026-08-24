const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./user.model");

function publicUser(user) {
  return {
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || "",
  };
}

function issueToken(user, env) {
  return jwt.sign(publicUser(user), env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

async function register({ name, email, password, env }) {
  if (!name || !email || !password) throw new Error("AUTH_FIELDS_REQUIRED");
  if (password.length < 8) throw new Error("PASSWORD_TOO_SHORT");

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new Error("EMAIL_ALREADY_REGISTERED");

  const user = await User.create({
    userId: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 12),
  });

  return { token: issueToken(user, env), user: publicUser(user) };
}

async function login({ email, password, env }) {
  if (!email || !password) throw new Error("AUTH_FIELDS_REQUIRED");

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new Error("INVALID_CREDENTIALS");
  }

  return { token: issueToken(user, env), user: publicUser(user) };
}

async function ensureAdmin(env) {
  if (!env.adminEmail || !env.adminPassword) return;

  const email = env.adminEmail.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) return;

  await User.create({
    userId: crypto.randomUUID(),
    name: env.adminName,
    email,
    passwordHash: await bcrypt.hash(env.adminPassword, 12),
    role: "ADMIN",
  });
}

async function updateAvatar({ token, avatarUrl, env }) {
  const payload = verifyToken(token, env);
  if (typeof avatarUrl !== "string" || avatarUrl.length > 700000) {
    throw new Error("AVATAR_INVALID");
  }
  if (avatarUrl && !/^data:image\/(jpeg|png|webp);base64,/.test(avatarUrl)) {
    throw new Error("AVATAR_INVALID");
  }

  const user = await User.findOneAndUpdate(
    { userId: payload.userId },
    { avatarUrl },
    { new: true },
  );
  if (!user) throw new Error("USER_NOT_FOUND");
  return { user: publicUser(user), accessToken: issueToken(user, env) };
}

function verifyToken(token, env) {
  return jwt.verify(token, env.jwtSecret);
}

module.exports = { register, login, verifyToken, ensureAdmin, updateAvatar };