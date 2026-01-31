const { redisClient } = require("../services/redisService");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const trackPresence = async (req, res, next) => {
  if (req.user && req.user.id) {
    const userId = req.user.id;
    const presenceKey = `presence:${userId}`;
    try {
      await redisClient.set(presenceKey, "active", { EX: 300 });
      if (req.user.isActive === false) {
        await prisma.user.update({
          where: { id: userId },
          data: { isActive: true },
        });
      }
    } catch (err) {
      console.error("Error in presence tracking:", err);
    }
  }
  next();
};

module.exports = { trackPresence };
