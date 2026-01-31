const { PrismaClient } = require("@prisma/client");

const BaseResponse = require("../utils/BaseResponse");
const prisma = new PrismaClient();


async function getUserById(userId) {
  if (!userId || typeof userId !== "number") {
    return BaseResponse.error("Invalid user ID");
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return BaseResponse.error("User not found");
    }
    const { password: _, ...userWithoutPassword } = user;
    return BaseResponse.success(
      "User retrieved successfully",
      userWithoutPassword,
    );
  } catch (error) {
    console.error("Error retrieving user:", error);
    return BaseResponse.error("An error occurred while retrieving the user");
  }
}

module.exports = {
  getUserById,
};
