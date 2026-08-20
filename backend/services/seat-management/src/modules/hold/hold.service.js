const crypto = require("crypto");
const Hold = require("./hold.model");
const {
  findOrCreateSeat,
  updateSeatWithVersion,
} = require("../seat/seat.repository");

function buildLockValue() {
  return crypto.randomUUID();
}

function lockKey(showtimeId, seatId) {
  return `seat:${showtimeId}:${seatId}`;
}

function idempotencyKey(showtimeId, seatId, requestKey) {
  return `idempotency:hold:${showtimeId}:${seatId}:${requestKey}`;
}

async function acquireLock(redisClient, key, value, ttlMs) {
  const result = await redisClient.set(key, value, "PX", ttlMs, "NX");
  return result === "OK";
}

async function releaseLock(redisClient, key, value) {
  const releaseScript = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end`;
  await redisClient.eval(releaseScript, 1, key, value);
}

async function holdSeat({
  showtimeId,
  seatId,
  userId,
  requestKey,
  holdMinutes,
  lockTtlMs,
  redisClient,
  realtimePublisher,
}) {
  const idemKey = requestKey ? idempotencyKey(showtimeId, seatId, requestKey) : null;
  if (idemKey) {
    const cached = await redisClient.get(idemKey);
    if (cached) return JSON.parse(cached);
  }

  const key = lockKey(showtimeId, seatId);
  const value = buildLockValue();
  const locked = await acquireLock(redisClient, key, value, lockTtlMs);
  if (!locked) {
    throw new Error("SEAT_BUSY");
  }

  try {
    const seat = await findOrCreateSeat(showtimeId, seatId);
    if (seat.status !== "AVAILABLE") {
      throw new Error("SEAT_UNAVAILABLE");
    }

    const holdId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);

    const updated = await updateSeatWithVersion({
      showtimeId,
      seatId,
      expectedVersion: seat.version,
      patch: {
        status: "HELD",
        holdId,
        heldBy: userId,
        holdExpiresAt: expiresAt,
      },
    });

    if (!updated) {
      throw new Error("SEAT_RACE_CONDITION");
    }

    await Hold.create({
      holdId,
      showtimeId,
      seatId,
      userId,
      status: "ACTIVE",
      expiresAt,
    });

    const payload = {
      action: "HELD",
      showtimeId,
      seatId,
      status: "HELD",
      holdId,
      expiresAt,
    };

    await realtimePublisher.broadcast(payload);

    const response = { holdId, showtimeId, seatId, status: "HELD", expiresAt };
    if (idemKey) {
      await redisClient.set(idemKey, JSON.stringify(response), "EX", 600);
    }
    return response;
  } finally {
    await releaseLock(redisClient, key, value);
  }
}

async function confirmHeldSeat({
  holdId,
  userId,
  lockTtlMs,
  redisClient,
  realtimePublisher,
}) {
  const hold = await Hold.findOne({ holdId, userId, status: "ACTIVE" });
  if (!hold) throw new Error("HOLD_NOT_FOUND");
  if (hold.expiresAt < new Date()) throw new Error("HOLD_EXPIRED");

  const key = lockKey(hold.showtimeId, hold.seatId);
  const value = buildLockValue();
  const locked = await acquireLock(redisClient, key, value, lockTtlMs);
  if (!locked) throw new Error("SEAT_BUSY");

  try {
    const seat = await findOrCreateSeat(hold.showtimeId, hold.seatId);
    if (seat.status !== "HELD" || seat.holdId !== holdId) {
      throw new Error("SEAT_STATE_INVALID");
    }

    const updated = await updateSeatWithVersion({
      showtimeId: hold.showtimeId,
      seatId: hold.seatId,
      expectedVersion: seat.version,
      patch: {
        status: "BOOKED",
      },
    });

    if (!updated) throw new Error("SEAT_RACE_CONDITION");

    hold.status = "CONFIRMED";
    await hold.save();

    const payload = {
      action: "BOOKED",
      showtimeId: hold.showtimeId,
      seatId: hold.seatId,
      status: "BOOKED",
      holdId,
    };
    await realtimePublisher.broadcast(payload);

    return {
      holdId,
      showtimeId: hold.showtimeId,
      seatId: hold.seatId,
      status: "BOOKED",
    };
  } finally {
    await releaseLock(redisClient, key, value);
  }
}

async function releaseHeldSeat({
  holdId,
  userId,
  lockTtlMs,
  redisClient,
  realtimePublisher,
}) {
  const hold = await Hold.findOne({ holdId, userId, status: "ACTIVE" });
  if (!hold) throw new Error("HOLD_NOT_FOUND");

  const key = lockKey(hold.showtimeId, hold.seatId);
  const value = buildLockValue();
  const locked = await acquireLock(redisClient, key, value, lockTtlMs);
  if (!locked) throw new Error("SEAT_BUSY");

  try {
    const seat = await findOrCreateSeat(hold.showtimeId, hold.seatId);
    if (seat.status !== "HELD" || seat.holdId !== holdId) {
      throw new Error("SEAT_STATE_INVALID");
    }

    const updated = await updateSeatWithVersion({
      showtimeId: hold.showtimeId,
      seatId: hold.seatId,
      expectedVersion: seat.version,
      patch: {
        status: "AVAILABLE",
        holdId: null,
        heldBy: null,
        holdExpiresAt: null,
      },
    });

    if (!updated) throw new Error("SEAT_RACE_CONDITION");

    hold.status = "RELEASED";
    await hold.save();
    await realtimePublisher.broadcast({
      action: "RELEASED",
      showtimeId: hold.showtimeId,
      seatId: hold.seatId,
      status: "AVAILABLE",
      holdId,
    });

    return {
      holdId,
      showtimeId: hold.showtimeId,
      seatId: hold.seatId,
      status: "AVAILABLE",
    };
  } finally {
    await releaseLock(redisClient, key, value);
  }
}

async function releaseExpiredHolds({ lockTtlMs, redisClient, realtimePublisher }) {
  const expiredHolds = await Hold.find({
    status: "ACTIVE",
    expiresAt: { $lte: new Date() },
  }).limit(100);

  for (const hold of expiredHolds) {
    const key = lockKey(hold.showtimeId, hold.seatId);
    const value = buildLockValue();
    const locked = await acquireLock(redisClient, key, value, lockTtlMs);
    if (!locked) continue;

    try {
      const seat = await findOrCreateSeat(hold.showtimeId, hold.seatId);
      if (seat.status === "HELD" && seat.holdId === hold.holdId) {
        const updated = await updateSeatWithVersion({
          showtimeId: hold.showtimeId,
          seatId: hold.seatId,
          expectedVersion: seat.version,
          patch: {
            status: "AVAILABLE",
            holdId: null,
            heldBy: null,
            holdExpiresAt: null,
          },
        });

        if (updated) {
          await realtimePublisher.broadcast({
            action: "RELEASED",
            showtimeId: hold.showtimeId,
            seatId: hold.seatId,
            status: "AVAILABLE",
          });
        }
      }

      hold.status = "EXPIRED";
      await hold.save();
    } finally {
      await releaseLock(redisClient, key, value);
    }
  }
}

module.exports = {
  holdSeat,
  confirmHeldSeat,
  releaseHeldSeat,
  releaseExpiredHolds,
};
