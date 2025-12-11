const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { hashToken } = require('../utils/hash.util');
const { clearRefreshTokenCookie, generateTokens, setRefreshTokenCookie, sendPasswordResetEmail } = require('../utils/authUtils');

/**
 * @desc    Change user password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect',
    });
  }

  // Update password (this will trigger pre-save hook to hash it)
  user.password = newPassword;
  
  // Invalidate all refresh tokens for security when password changes
  // Force user to re-authenticate on all devices
  user.refreshTokenHash = undefined;
  
  await user.save();

  // Clear refresh token cookie
  clearRefreshTokenCookie(res);
  res.json({
    success: true,
    message: 'Password changed successfully. Please log in again.',
    data: {
      requiresReauth: true,
    },
  });
});

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpires');

  if (!user) {
    return res.json({
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.',
    });
  }

  if (!user.password) {
    return res.json({
      success: true,
      message: 'This account uses social login. Password reset is not required.',
    });
  }

  try {
    await sendPasswordResetEmail(user);
  } catch (error) {
    console.error('Password reset email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send password reset email. Please try again later.',
    });
  }

  res.json({
    success: true,
    message: 'If an account exists for this email, a password reset link has been sent.',
  });
});

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: 'Token and new password are required',
    });
  }

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    passwordResetTokenHash: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password +passwordResetTokenHash +passwordResetExpires');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token',
    });
  }

  user.password = password;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;

  if (!user.isEmailVerified) {
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpires = undefined;
  }

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshTokenHash = await hashToken(refreshToken);
  await user.save();

  setRefreshTokenCookie(res, refreshToken);
  res.json({
    success: true,
    message: 'Password reset successful',
    data: {
      user: user.getPublicProfile(),
      accessToken,
    },
  });
});

/**
 * @desc    Delete user account
 * @route   DELETE /api/auth/delete-account
 * @access  Private
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id).select('+password');

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Password is incorrect',
    });
  }

  // Delete related data (if any)

  // Delete user account
  await User.findByIdAndDelete(user._id);
  res.json({
    success: true,
    message: 'Account deleted successfully',
  });
});

module.exports = {
  changePassword,
  forgotPassword,
  resetPassword,
  deleteAccount,
};

