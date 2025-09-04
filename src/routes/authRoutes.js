const express = require('express');
const router = express.Router();
const { registerUser, loginUser, refreshTokens, logoutUser } = require('../services/authService');
const { authenticateToken } = require('../middleware/authMiddleware');
const BaseResponse = require('../utils/BaseResponse');

router.post('/register', async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json(BaseResponse.error("Request Body Empty"));
    }
    
    const { firstName, lastName, email, password } = req.body;
    const response = await registerUser({ email, password, firstName, lastName });
    const statusCode = response.isSuccess ? 201 : 400;
    res.status(statusCode).json(response);
    
  } catch (e) {
    res.status(500).json(BaseResponse.error("Registration Failed"));
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const response = await loginUser({ email, password });
    const statusCode = response.isSuccess ? 200 : 400;
    res.status(statusCode).json(response);
    
  } catch (e) {
    res.status(500).json(BaseResponse.error("Login Failed"));
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const response = await refreshTokens(refreshToken);
    const statusCode = response.isSuccess ? 200 : 400;
    res.status(statusCode).json(response);
    
  } catch (e) {
    res.status(500).json(BaseResponse.error("Refresh Failed"));
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const result = await logoutUser(req.token);
    res.status(200).json(result);
    
  } catch (e) {
    res.status(500).json(BaseResponse.error("Logout Failed"));
  }
});

module.exports = router;