const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { hashToken } = require('../utils/hash.util');
const { generateTokens, setRefreshTokenCookie } = require('../utils/authUtils');

/**
 * @desc    Exchange OAuth authorization code for tokens
 * @route   POST /api/auth/oauth/exchange
 * @access  Public
 */
const exchangeOAuthCode = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      success: false,
      message: 'Authorization code is required',
    });
  }

  try {
    const payload = jwt.verify(code, process.env.JWT_OAUTH_CODE_SECRET);
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact support.',
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshTokenHash = await hashToken(refreshToken);
    user.lastLogin = new Date();
    await user.save();

    setRefreshTokenCookie(res, refreshToken);
    res.json({
      success: true,
      message: 'OAuth login successful',
      data: {
        user: user.getPublicProfile(),
        accessToken,
      },
    });
  } catch (error) {
    console.error('OAuth code exchange error:', error.message);
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired authorization code',
    });
  }
});

module.exports = {
  exchangeOAuthCode,
};

