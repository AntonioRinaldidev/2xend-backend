const express = require("express");
const router = express.Router();

const { getUserById } = require("../services/userService");
const { authenticateToken } = require("../middleware/authMiddleware");
const BaseResponse = require("../utils/BaseResponse");

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const response = await getUserById(userId);
    const statusCode = response.isSuccess ? 200 : 400;
    res.status(statusCode).json(response);
  } catch (e) {
    res.status(500).json(BaseResponse.error("Failed to retrieve user"));
  }
});
