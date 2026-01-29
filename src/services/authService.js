const { PrismaClient } = require("@prisma/client");
const { hashPassword, verifyPassword } = require("../utils/passwords");
const BaseResponse = require("../utils/BaseResponse");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwtUtils");
const { user } = require("../config/database");

const prisma = new PrismaClient();

async function createSession(userId, accessToken, refreshToken) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);
  return await prisma.userSession.create({
    data: {
      userId,
      accessToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
      isActive: true,
    },
  });
}

async function loginUser(phoneNumber, plainTextPassword) {
  if (!phoneNumber || !plainTextPassword) {
    return BaseResponse.error("Phone number and password are required");
  }
  if (
    typeof phoneNumber !== "string" ||
    typeof plainTextPassword !== "string"
  ) {
    return BaseResponse.error("Invalid input types");
  }
  try {
    const user = await prisma.user.findUnique({ where: { phoneNumber } });
    if (!user) {
      const newUser = await prisma.user.create({
        data: {
          phoneNumber,
          password: await hashPassword(plainTextPassword),
          isProfileComplete: false,
        },
      });
      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);
      await createSession(newUser.id, accessToken, refreshToken);
      const { password: _, ...userWithoutPassword } = newUser;
      return BaseResponse.success("New user created, proceed to setup", {
        exists: false,
        isProfileComplete: false,
        needsName: true,
        user: userWithoutPassword,
        needsPhone: false,
        accessToken,
        refreshToken,
      });
    }

    const isPasswordValid = await verifyPassword(
      plainTextPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return BaseResponse.error("Invalid password");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await createSession(user.id, accessToken, refreshToken);

    const { password: _, ...userWithoutPassword } = user;
    if (!user.isProfileComplete) {
      return BaseResponse.success("Profile incomplete, proceed to setup", {
        exists: true,
        isProfileComplete: false,
        user,
        needsName: true,
        needsPhone: false,
        accessToken,
        refreshToken,
      });
    }

    return BaseResponse.success("Login successful", {
      exists: true,
      isProfileComplete: true,
      user: userWithoutPassword,
      needsName: false,
      needsPhone: false,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    return BaseResponse.error("An error occurred while logging in");
  }
}

async function loginWithProvider(provider, providerId, email, details) {
  try {
    const user = await prisma.user.findUnique({
      where: { [provider === "apple" ? "appleId" : "googleId"]: providerId },
    });

    if (user && user.isProfileComplete) {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      await createSession(user.id, accessToken, refreshToken);

      return BaseResponse.success("Login successful", {
        exists: true,
        user,
        accessToken,
        refreshToken,
      });
    } else if (!user) {
      const newUser = await prisma.user.create({
        data: {
          email,
          firstName: details.firstName || "",
          lastName: details.lastName || "",
          [provider === "apple" ? "appleId" : "googleId"]: providerId,
          isProfileComplete: false,
        },
      });
      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);
      await createSession(newUser.id, accessToken, refreshToken);
      return BaseResponse.success("New user created, proceed to setup", {
        exists: false,
        isProfileComplete: false,
        user: newUser,
        needsPhone: true,
        accessToken,
        refreshToken,
      });
    } else {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      await createSession(user.id, accessToken, refreshToken);
      return BaseResponse.success("Profile incomplete, proceed to setup", {
        exists: true,
        isProfileComplete: false,
        user,
        needsPhone: true,
        accessToken,
        refreshToken,
      });
    }
  } catch (error) {
    console.error("Provider Login Error:", error);
    return BaseResponse.error("An error occurred during social login");
  }
}

async function completeProfile(userId, { firstName, lastName, phoneNumber }) {
  try {
    const updateData = { isProfileComplete: true };
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    const { password: _, ...userWithoutPassword } = updatedUser;
    return BaseResponse.success("Profile completed successfully", {
      user: userWithoutPassword,
      isProfileComplete: true,
    });
  } catch (error) {
    console.error("Error completing profile:", error);

    if (error.code === "P2002") {
      return BaseResponse.error(
        "Phone number already associated with another account",
        { phoneNumberExists: true },
      );
    }
    return BaseResponse.error("An error occurred while completing the profile");
  }
}

async function logoutUser(token) {
  try {
    await prisma.userSession.updateMany({
      where: {
        OR: [{ accessToken: token }, { refreshToken: token }],
      },
      data: { isActive: false },
    });

    return BaseResponse.success("Logged out successfully");
  } catch (error) {
    return BaseResponse.error("Logout failed", error.message);
  }
}

async function refreshTokens(refreshToken) {
  try {
    // Verifica il refresh token JWT
    const decoded = verifyRefreshToken(refreshToken);

    // Verifica che la sessione esista e sia attiva
    const session = await prisma.userSession.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (
      !session ||
      !session.isActive ||
      session.refreshExpiresAt < new Date()
    ) {
      return BaseResponse.error("Invalid refresh token");
    }

    // Genera nuovi token
    const newAccessToken = generateAccessToken(session.user);
    const newRefreshToken = generateRefreshToken(session.user);

    // Aggiorna la sessione
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
        refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 giorni
      },
    });

    return BaseResponse.success("Tokens refreshed", {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return BaseResponse.error("Token refresh failed", error.message);
  }
}

async function validateSession(accessToken) {
  try {
    const session = await prisma.userSession.findUnique({
      where: { accessToken },
      include: { user: true },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return null;
    }

    return session.user;
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}

module.exports = {
  loginUser,
  loginWithProvider,
  completeProfile,
  logoutUser,
  refreshTokens,
  validateSession,
};
