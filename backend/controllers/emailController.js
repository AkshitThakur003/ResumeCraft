const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { hashToken } = require('../utils/hash.util');
const { generateTokens, setRefreshTokenCookie } = require('../utils/authUtils');
const { sendVerificationEmail } = require('../utils/authUtils');

/**
 * @desc    Verify email with token
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Verification token is required',
    });
  }

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    emailVerificationTokenHash: hashedToken,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationTokenHash +emailVerificationExpires');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification token',
    });
  }

  user.isEmailVerified = true;
  user.emailVerifiedAt = new Date();
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpires = undefined;

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshTokenHash = await hashToken(refreshToken);
  await user.save();

  setRefreshTokenCookie(res, refreshToken);
  res.json({
    success: true,
    message: 'Email verified successfully',
    data: {
      user: user.getPublicProfile(),
      accessToken,
    },
  });
});

/**
 * @desc    Resend email verification link
 * @route   POST /api/auth/verify-email/resend
 * @access  Public
 */
const resendEmailVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  const user = await User.findOne({ email }).select('+emailVerificationTokenHash +emailVerificationExpires');

  if (!user) {
    return res.json({
      success: true,
      message: 'If an account exists for this email, a verification link has been sent.',
    });
  }

  if (user.isEmailVerified) {
    return res.json({
      success: true,
      message: 'Email is already verified. You can log in.',
    });
  }

  try {
    await sendVerificationEmail(user);
  } catch (error) {
    console.error('Verification email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email. Please try again later.',
    });
  }

  res.json({
    success: true,
    message: 'Verification email sent successfully.',
  });
});

module.exports = {
  verifyEmail,
  resendEmailVerification,
};

