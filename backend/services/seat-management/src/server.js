const { connectDb } = require("./config/db");
const { createRedisClients } = require("./config/redis");
const env = require("./config/env");
const { buildApp } = require("./app");
const { releaseExpiredHolds } = require("./modules/hold/hold.service");

async function start() {
  await connectDb(env.mongoUri);
  const redis = createRedisClients(env.redisUri);
  const { server, realtimePublisher } = buildApp({ env, redis });

  await realtimePublisher.init();

  setInterval(async () => {
    try {
      await releaseExpiredHolds({
        lockTtlMs: env.lockTtlMs,
        redisClient: redis.commandClient,
        realtimePublisher,
      });
    } catch (error) {
      console.error("releaseExpiredHolds error:", error.message);
    }
  }, 15_000);

  server.listen(env.port, () => {
    console.log(`seat-management running on ${env.port}`);
  });
}

start().catch((error) => {
  console.error("seat-management failed to start:", error);
  process.exit(1);
});
