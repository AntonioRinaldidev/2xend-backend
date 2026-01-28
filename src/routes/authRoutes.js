const express = require("express");
const router = express.Router();
const {
  loginWithProvider,
  completeProfile,
  loginUser,
  refreshTokens,
  logoutUser,
} = require("../services/authService");
const { authenticateToken } = require("../middleware/authMiddleware");
const BaseResponse = require("../utils/BaseResponse");

router.post("/login", async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const response = await loginUser({ phoneNumber, password });
    const statusCode = response.isSuccess ? 200 : 400;
    res.status(statusCode).json(response);
  } catch (e) {
    res.status(500).json(BaseResponse.error("Login Failed"));
  }
});

router.post("/login_provider", async (req, res) => {
  try {
    const { provider, providerId, email, details } = req.body;
    const response = await loginWithProvider(
      provider,
      providerId,
      email,
      details,
    );
    const statusCode = response.isSuccess ? 200 : 400;
    res.status(statusCode).json(response);
  } catch (e) {
    res.status(500).json(BaseResponse.error("Login Failed"));
  }
});

router.post("/complete_profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phoneNumber } = req.body;

    const response = await completeProfile(userId, {
      firstName,
      lastName,
      phoneNumber,
    });
    const statusCode = response.isSuccess ? 200 : 400;

    res.status(statusCode).json(response);
  } catch (e) {
    res.status(500).json(BaseResponse.error("Profile completion failed"));
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const response = await refreshTokens(refreshToken);
    const statusCode = response.isSuccess ? 200 : 400;
    res.status(statusCode).json(response);
  } catch (e) {
    res.status(500).json(BaseResponse.error("Refresh Failed"));
  }
});

router.post("/logout", authenticateToken, async (req, res) => {
  try {
    const result = await logoutUser(req.token);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json(BaseResponse.error("Logout Failed"));
  }
});

module.exports = router;
