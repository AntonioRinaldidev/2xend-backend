require("dotenv").config();

const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: "15m",
    algorithm: "HS256",
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: "7d",
    algorithm: "HS256",
  },
};
if (!jwtConfig.accessToken.secret) {
  throw new Error("JWT secret is not set in environment variables.");
}
if (!jwtConfig.accessToken.expiresIn) {
  throw new Error("JWT expiration time is not set in environment variables.");
}
if (!jwtConfig.accessToken.algorithm) {
  throw new Error("JWT algorithm is not set in environment variables.");
}
if (!jwtConfig.refreshToken.secret) {
  throw new Error(
    "JWT refresh token secret is not set in environment variables.",
  );
}
if (!jwtConfig.refreshToken.expiresIn) {
  throw new Error(
    "JWT refresh token expiration time is not set in environment variables.",
  );
}
if (!jwtConfig.refreshToken.algorithm) {
  throw new Error(
    "JWT refresh token algorithm is not set in environment variables.",
  );
}
module.exports = jwtConfig;
