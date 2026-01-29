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
if (!jwtConfig.accesstoken.secret) {
  throw new Error("JWT secret is not set in environment variables.");
}
if (!jwtConfig.accesstoken.expiresIn) {
  throw new Error("JWT expiration time is not set in environment variables.");
}
if (!jwtConfig.accesstoken.algorithm) {
  throw new Error("JWT algorithm is not set in environment variables.");
}
if (!jwtConfig.refreshtoken.secret) {
  throw new Error(
    "JWT refresh token secret is not set in environment variables.",
  );
}
if (!jwtConfig.refreshtoken.expiresIn) {
  throw new Error(
    "JWT refresh token expiration time is not set in environment variables.",
  );
}
if (!jwtConfig.refreshtoken.algorithm) {
  throw new Error(
    "JWT refresh token algorithm is not set in environment variables.",
  );
}
module.exports = jwtConfig;
