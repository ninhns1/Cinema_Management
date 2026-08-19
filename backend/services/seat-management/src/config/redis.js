const Redis = require("ioredis");

function createRedisClients(redisUri) {
  const commandClient = new Redis(redisUri);
  const pubClient = new Redis(redisUri);
  const subClient = new Redis(redisUri);

  return { commandClient, pubClient, subClient };
}

module.exports = { createRedisClients };
