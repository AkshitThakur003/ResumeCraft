const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { hashToken } = require('../utils/hash.util');
const logger = require('../utils/logger');
const {
  generateTokens,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  sendVerificationEmail,
} = require('../utils/authUtils');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email',
    });
  }

  // Create user
  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
  });

  try {
    await sendVerificationEmail(user);
  } catch (error) {
    logger.error('Verification email error:', { error: error.message, userId: user._id });
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email. Please try again later.',
    });
  }
  res.status(201).json({
    success: true,
    message: 'Account created. Please verify your email to continue.',
    data: {
      user: user.getPublicProfile(),
      requiresVerification: true,
    },
  });
});

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email and include password
  const user = await User.findOne({ email }).select('+password +emailVerificationTokenHash +emailVerificationExpires');
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'This account has been deactivated. Please contact support.',
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  if (!user.isEmailVerified) {
    const tokenExpired = !user.emailVerificationExpires || user.emailVerificationExpires < new Date();

    if (!user.emailVerificationTokenHash || tokenExpired) {
      try {
        await sendVerificationEmail(user);
      } catch (error) {
        logger.error('Verification email error during login:', { error: error.message, userId: user._id });
      }
    }

    return res.status(403).json({
      success: false,
      message: 'Email not verified. Please check your inbox for a verification link.',
      data: {
        requiresVerification: true,
        email: user.email,
      },
    });
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token and update last login
  user.refreshTokenHash = hashToken(refreshToken);
  user.lastLogin = new Date();
  await user.save();

  setRefreshTokenCookie(res, refreshToken);
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.getPublicProfile(),
      accessToken,
    },
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 * 
 * Security Note: This implements refresh token rotation with optimistic locking.
 * When a refresh token is used, it is immediately invalidated and replaced with a new token.
 * This ensures that if a refresh token is stolen, it can only be used once before becoming invalid.
 * Optimistic locking prevents race conditions from concurrent refresh requests.
 */
const refresh = asyncHandler(async (req, res) => {
  // User is already validated by verifyRefreshToken middleware
  const user = await User.findById(req.user._id).select('+refreshTokenHash refreshTokenVersion');

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

  // Store current version for optimistic locking
  const currentVersion = user.refreshTokenVersion || 0;

  // Generate new tokens (access and refresh)
  const { accessToken, refreshToken } = generateTokens(user._id);
  const hashedToken = hashToken(refreshToken);

  // Atomic update with version check (optimistic locking)
  // This prevents race conditions from concurrent refresh requests
  const updated = await User.findOneAndUpdate(
    { 
      _id: user._id, 
      refreshTokenVersion: currentVersion // Only update if version matches
    },
    {
      $set: { refreshTokenHash: hashedToken },
      $inc: { refreshTokenVersion: 1 }
    },
    { new: true }
  );

  if (!updated) {
    return res.status(401).json({
      success: false,
      message: 'Token refresh failed due to concurrent request. Please try again.',
    });
  }

  setRefreshTokenCookie(res, refreshToken);

  // Audit log token refresh for security monitoring
  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken,
    },
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: { refreshTokenHash: '' },
  });

  clearRefreshTokenCookie(res);
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    data: {
      user: user.getPublicProfile(),
    },
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  generateTokens, // Export for OAuth routes
};

