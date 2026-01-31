const { createClient } = require("redis");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", (err) => console.error("❌ Redis Error:", err));

const initRedis = async () => {
  await redisClient.connect();
  console.log("🚀 Redis Connected");

  await redisClient.configSet("notify-keyspace-events", "Ex");

  setupExpirationListener();
};

const setupExpirationListener = async () => {
  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  await subscriber.subscribe("__keyevent@0__:expired", async (message) => {
    if (message.startsWith("presence:")) {
      const userId = message.split(":")[1];
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { isActive: false, lastActivity: new Date() },
        });
        console.log(`📡 User ${userId} offline.`);
      } catch (err) {
        console.error("Error during user offline process:", err);
      }
    }
  });
};

// Esportazione in stile CommonJS
module.exports = { redisClient, initRedis };
