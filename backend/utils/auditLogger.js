const AuditLog = require('../models/AuditLog');

/**
 * Log admin actions for audit trail
 * @param {Object} options - Logging options
 * @param {String} options.adminId - ID of admin performing action
 * @param {String} options.action - Action type (enum from AuditLog schema)
 * @param {String} options.description - Human-readable description
 * @param {String} options.targetUserId - ID of user being acted upon (if applicable)
 * @param {Object} options.metadata - Additional metadata
 * @param {String} options.ipAddress - IP address of admin
 * @param {String} options.userAgent - User agent string
 * @param {Boolean} options.success - Whether action succeeded
 * @param {String} options.errorMessage - Error message if failed
 */
const logAdminAction = async ({
  adminId,
  action,
  description,
  targetUserId = null,
  metadata = {},
  ipAddress = null,
  userAgent = null,
  success = true,
  errorMessage = null,
}) => {
  try {
    // Validate required fields
    if (!adminId || !action || !description) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Audit Log Warning] Missing required fields:', { adminId, action, description });
      }
      return;
    }

    // Validate adminId is a valid ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Audit Log Warning] Invalid adminId:', adminId);
      }
      return;
    }

    await AuditLog.create({
      userId: adminId,
      adminId,
      action,
      targetUserId: targetUserId && mongoose.Types.ObjectId.isValid(targetUserId) ? targetUserId : null,
      description: description.substring(0, 500), // Limit description length
      metadata: typeof metadata === 'object' ? metadata : {},
      ipAddress: ipAddress ? ipAddress.substring(0, 45) : null, // Limit IP length
      userAgent: userAgent ? userAgent.substring(0, 200) : null, // Limit user agent length
      success,
      errorMessage: errorMessage ? errorMessage.substring(0, 500) : null,
    });
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    // But log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Audit Log Error]', error.message);
    }
    // Silently fail in production
  }
};

/**
 * Get client IP address from request
 */
const getClientIp = (req) => {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    'unknown'
  );
};

/**
 * Get user agent from request
 */
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'unknown';
};

module.exports = {
  logAdminAction,
  getClientIp,
  getUserAgent,
};

