const BaseResponse = require("../utils/BaseResponse");
const { verifyAccessToken } = require("../utils/jwtUtils");
const { validateSession } = require("../services/authService");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res
        .status(404)
        .json(BaseResponse.error("Authorization header is missing"));
    }

    const token = authHeader.split(" ")[1].trim();
    if (!token) {
      return res.status(404).json(BaseResponse.error("Token is missing"));
    }
    

    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json(BaseResponse.error("Invalid access token"));
    }

    // Validate session
    const sessionValid = await validateSession(token);
    if (!sessionValid) {
      return res
        .status(401)
        .json(BaseResponse.error("Session is invalid or expired"));
    }

    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json(BaseResponse.error("Internal server error"));
  }
};

const checkProfileComplete = (req, res, next) => {
  if (req.user && !req.user.isProfileComplete) {
    return res
      .status(403)
      .json(
        BaseResponse.error("Profile incomplete. Please provide phone number."),
      );
  }
  next();
};

module.exports = {
  authenticateToken,
  checkProfileComplete,
};
