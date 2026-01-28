const { PrismaClient } = require("@prisma/client");
const { hashPassword, verifyPassword } = require("../utils/passwords");
const BaseResponse = require("../utils/BaseResponse");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwtUtils");

const prisma = new PrismaClient();

async function createSession(userId, accessToken, refreshToken) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  const refreshExipiresAt = new Date();
  refreshExipiresAt.setDate(refreshExipiresAt.getDate() + 7);
  return await prisma.UserSession.create({
    data: {
      userId,
      accessToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
    },
  });
}

async function registerUser(email, plainTextPassword, firstName, lastName) {
  try {
    // Validate input
    if (!email || !plainTextPassword || !firstName || !lastName) {
      return BaseResponse.error("All fields are required");
    }
    if (
      typeof email !== "string" ||
      typeof plainTextPassword !== "string" ||
      typeof firstName !== "string" ||
      typeof lastName !== "string"
    ) {
      return BaseResponse.error("Invalid input types");
    }
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return BaseResponse.error("User already exists with this email");
    }
    // Hash the password before storing it
    const hashedPassword = await hashPassword(plainTextPassword);
    // Create the user in the database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await createSession(user.id, accessToken, refreshToken);

    // Exclude password from the returned user object
    const { password: _, ...userWithoutPassword } = user;
    return BaseResponse.success("User registered successfully", {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return BaseResponse.error("An error occurred while registering the user");
  }
}

async function loginUser(email, plainTextPassword) {
  if (!email || !plainTextPassword) {
    return BaseResponse.error("Email and password are required");
  }
  if (typeof email !== "string" || typeof plainTextPassword !== "string") {
    return BaseResponse.error("Invalid input types");
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return BaseResponse.error("User not found");
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

    return BaseResponse.success("Login successful", {
      user: userWithoutPassword,
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

    if (user) {
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      await createSession(user.id, accessToken, refreshToken);

      return BaseResponse.success("Login successful", {
        user,
        accessToken,
        refreshToken,
        needsPhone: !user.phoneNumber,
      });
    } else {
      const newUser = await prisma.user.create({
        data: {
          [provider === "apple" ? "appleId" : "googleId"]: providerId,
          email,
          firstName: details.firstName,
          lastName: details.lastName,
          isProfileComplete: false,
        },
      });

      const accessToken = generateAccessToken(newUser);
      const refreshToken = generateRefreshToken(newUser);
      await createSession(newUser.id, accessToken, refreshToken);

      return BaseResponse.success("User registered, phone required", {
        user: newUser,
        accessToken,
        refreshToken,
        needsPhone: true,
      });
    }
  } catch (error) {
    console.error("Provider Login Error:", error);
    return BaseResponse.error("An error occurred during social login");
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
    return null;
  }
}

module.exports = {
  registerUser,
  loginUser,
  loginWithProvider,
  refreshTokens,
  logoutUser,
  validateSession,
};
