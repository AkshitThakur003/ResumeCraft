const jwt = require('jsonwebtoken');
const { hashToken } = require('./hash.util');
const { sendEmail } = require('../config/email');
const { buildVerificationEmail, buildPasswordResetEmail } = require('./emailTemplates');

const isProduction = process.env.NODE_ENV === 'production';
const refreshCookieMaxAge = parseInt(process.env.JWT_REFRESH_COOKIE_MAX_AGE || (7 * 24 * 60 * 60 * 1000), 10);
const { REFRESH_TOKEN_COOKIE } = require('../config/constants');

const verificationBaseUrl = process.env.EMAIL_VERIFICATION_URL
  || `${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email`;

const passwordResetBaseUrl = process.env.PASSWORD_RESET_URL
  || `${process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password`;

/**
 * Set refresh token cookie
 */
const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: refreshCookieMaxAge,
  });
};

/**
 * Clear refresh token cookie
 */
const clearRefreshTokenCookie = (res) => {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
};

/**
 * Generate JWT tokens
 * @param {string} userId - User ID
 * @returns {Object} Access and refresh tokens
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

/**
 * Send verification email
 */
const sendVerificationEmail = async (user) => {
  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${verificationBaseUrl}?token=${verificationToken}`;
  const { subject, text, html } = buildVerificationEmail({
    firstName: user.firstName,
    verifyUrl,
  });

  await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user) => {
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${passwordResetBaseUrl}?token=${resetToken}`;
  const { subject, text, html } = buildPasswordResetEmail({
    firstName: user.firstName,
    resetUrl,
  });

  await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
};

module.exports = {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  generateTokens,
  sendVerificationEmail,
  sendPasswordResetEmail,
};

