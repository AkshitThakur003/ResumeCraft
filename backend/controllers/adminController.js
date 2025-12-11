const mongoose = require('mongoose');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Resume = require('../models/Resume');
const { asyncHandler } = require('../middleware/errorHandler');
const { logAdminAction, getClientIp, getUserAgent } = require('../utils/auditLogger');

const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const user = userDoc.toObject({ virtuals: true });

  delete user.password;
  delete user.refreshTokenHash;
  delete user.passwordResetTokenHash;
  delete user.passwordResetExpires;
  delete user.emailVerificationTokenHash;
  delete user.emailVerificationExpires;

  return user;
};

const buildSearchFilter = (search) => {
  if (!search) return undefined;
  const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return {
    $or: [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
    ],
  };
};

const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.status === 'active') {
    filter.isActive = true;
  } else if (req.query.status === 'inactive') {
    filter.isActive = false;
  }

  if (req.query.role) {
    filter.role = req.query.role;
  }

  const searchFilter = buildSearchFilter(req.query.search);
  if (searchFilter) {
    Object.assign(filter, searchFilter);
  }

  // Sorting
  let sort = { createdAt: -1 }; // Default sort
  if (req.query.sortBy) {
    const sortField = req.query.sortBy;
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    // Validate sort field to prevent injection
    const allowedSortFields = ['createdAt', 'firstName', 'lastName', 'email', 'lastLogin', 'role'];
    if (allowedSortFields.includes(sortField)) {
      sort = { [sortField]: sortOrder };
    }
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -refreshTokenHash -passwordResetTokenHash -passwordResetExpires -emailVerificationTokenHash -emailVerificationExpires')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      users: users.map((doc) => sanitizeUser(doc)),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit) || 1,
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    },
  });
});

const getUserDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id)
    .select('-password -refreshTokenHash -passwordResetTokenHash -passwordResetExpires -emailVerificationTokenHash -emailVerificationExpires');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    data: {
      user: sanitizeUser(user),
    },
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isActive must be a boolean',
    });
  }

  if (req.user._id.equals(id) && !isActive) {
    return res.status(400).json({
      success: false,
      message: 'You cannot deactivate your own account',
    });
  }

  const user = await User.findById(id).select('+refreshTokenHash');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const previousStatus = user.isActive;
  user.isActive = isActive;
  user.deactivatedAt = isActive ? null : new Date();

  if (!isActive) {
    user.refreshTokenHash = undefined;
  }

  await user.save();

  // Log audit action
  await logAdminAction({
    adminId: req.user._id.toString(),
    action: 'user.status_changed',
    description: `User ${user.email} ${isActive ? 'activated' : 'deactivated'}`,
    targetUserId: id,
    metadata: {
      previousStatus,
      newStatus: isActive,
    },
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    success: true,
  });

  res.json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: {
      user: sanitizeUser(user),
    },
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const allowedRoles = ['user', 'recruiter', 'admin'];

  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role provided',
    });
  }

  if (req.user._id.equals(id) && role !== req.user.role) {
    return res.status(400).json({
      success: false,
      message: 'You cannot change your own role',
    });
  }

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const previousRole = user.role;
  user.role = role;
  await user.save();

  const sanitizedUser = sanitizeUser(user);

  // Log audit action
  await logAdminAction({
    adminId: req.user._id.toString(),
    action: 'user.role_changed',
    description: `User ${user.email} role changed from ${previousRole} to ${role}`,
    targetUserId: id,
    metadata: {
      previousRole,
      newRole: role,
    },
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    success: true,
  });

  res.json({
    success: true,
    message: 'User role updated successfully',
    data: {
      user: sanitizedUser,
    },
  });
});

const getAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.userId) {
    filter.$or = [
      { userId: req.query.userId },
      { targetUserId: req.query.userId },
    ];
  }

  if (req.query.action) {
    filter.action = req.query.action;
  }

  try {
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('userId', 'firstName lastName email')
        .populate('adminId', 'firstName lastName email')
        .populate('targetUserId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      AuditLog.countDocuments(filter).exec(),
    ]);

    // Clean up logs to handle null populated fields gracefully
    const cleanedLogs = logs.map(log => ({
      ...log,
      userId: log.userId || null,
      adminId: log.adminId || null,
      targetUserId: log.targetUserId || null,
    }));

    res.json({
      success: true,
      data: {
        logs: cleanedLogs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit) || 1,
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    // If there's an error (e.g., collection doesn't exist), return empty results
    if (process.env.NODE_ENV === 'development') {
      console.error('[Audit Logs Error]', error.message);
    }
    res.json({
      success: true,
      data: {
        logs: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalItems: 0,
          hasNext: false,
          hasPrev: false,
        },
      },
    });
  }
});

const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    usersByRole,
    totalResumes,
    recentUsers,
    recentLogs,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false }),
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]),
    Resume.countDocuments(),
    User.find()
      .select('firstName lastName email createdAt role isActive')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    AuditLog.find()
      .populate('adminId', 'firstName lastName email')
      .populate('targetUserId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const roleDistribution = {};
  usersByRole.forEach((item) => {
    roleDistribution[item._id] = item.count;
  });

  // Calculate user growth (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newUsersLast30Days = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleDistribution,
      totalResumes,
      newUsersLast30Days,
      recentUsers: recentUsers.map((u) => ({
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
      recentLogs,
    },
  });
});

const bulkUpdateUsers = asyncHandler(async (req, res) => {
  const { userIds, action, value } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'userIds must be a non-empty array',
    });
  }

  if (!['status', 'role'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Action must be either "status" or "role"',
    });
  }

  if (action === 'status' && typeof value !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'Value must be a boolean for status action',
    });
  }

  if (action === 'role' && !['user', 'recruiter', 'admin'].includes(value)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role value',
    });
  }

  // Prevent self-modification
  const filteredUserIds = userIds.filter((id) => !req.user._id.equals(id));

  if (filteredUserIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot perform bulk operation on yourself',
    });
  }

  const update = {};
  if (action === 'status') {
    update.isActive = value;
    if (!value) {
      update.deactivatedAt = new Date();
    } else {
      update.deactivatedAt = null;
    }
  } else {
    update.role = value;
  }

  const result = await User.updateMany(
    { _id: { $in: filteredUserIds } },
    update,
  );

  // Log bulk action
  await logAdminAction({
    adminId: req.user._id.toString(),
    action: 'bulk.operation',
    description: `Bulk ${action} update: ${result.modifiedCount} users updated`,
    metadata: {
      action,
      value,
      userIds: filteredUserIds,
      modifiedCount: result.modifiedCount,
    },
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    success: true,
  });

  res.json({
    success: true,
    message: `Successfully updated ${result.modifiedCount} users`,
    data: {
      modifiedCount: result.modifiedCount,
    },
  });
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sendPasswordResetEmail } = require('../utils/authUtils');

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (user.oauthProvider) {
    return res.status(400).json({
      success: false,
      message: 'Cannot reset password for OAuth users',
    });
  }

  try {
    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send password reset email
    await sendPasswordResetEmail(user);

    // Log audit action
    await logAdminAction({
      adminId: req.user._id.toString(),
      action: 'user.password_reset',
      description: `Password reset initiated for user ${user.email}`,
      targetUserId: id,
      metadata: {},
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      success: true,
    });

    res.json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    // Log failed attempt
    await logAdminAction({
      adminId: req.user._id.toString(),
      action: 'user.password_reset',
      description: `Failed to send password reset for user ${user.email}`,
      targetUserId: id,
      metadata: { error: error.message },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      success: false,
      errorMessage: error.message,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to send password reset email',
    });
  }
});

const getUserActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  const filter = {
    $or: [
      { userId: id },
      { targetUserId: id },
    ],
  };

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('adminId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit) || 1,
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    },
  });
});

const impersonateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const targetUser = await User.findById(id);
  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (!targetUser.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Cannot impersonate inactive users',
    });
  }

  // Generate tokens for the target user
  const { generateTokens } = require('../utils/authUtils');
  const { accessToken, refreshToken } = generateTokens(targetUser._id);

  // Log audit action
  await logAdminAction({
    adminId: req.user._id.toString(),
    action: 'user.updated',
    description: `Admin ${req.user.email} impersonated user ${targetUser.email}`,
    targetUserId: id,
    metadata: {
      impersonated: true,
      originalAdminId: req.user._id.toString(),
    },
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
    success: true,
  });

  res.json({
    success: true,
    message: 'Impersonation successful',
    data: {
      user: sanitizeUser(targetUser),
      accessToken,
      refreshToken,
      impersonated: true,
      originalAdminId: req.user._id.toString(),
    },
  });
});

const sendEmailToUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'Subject and message are required',
    });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  try {
    const { sendEmail } = require('../config/email');
    const adminUser = req.user;

    await sendEmail({
      to: user.email,
      subject: `[ResumeCraft Admin] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">Message from ResumeCraft Admin</h2>
          <p>Hello ${user.firstName || user.email},</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            This message was sent by ${adminUser.firstName || adminUser.email} (Admin)
          </p>
        </div>
      `,
      text: `Message from ResumeCraft Admin\n\nHello ${user.firstName || user.email},\n\n${message}\n\nThis message was sent by ${adminUser.firstName || adminUser.email} (Admin)`,
    });

    // Log audit action
    await logAdminAction({
      adminId: req.user._id.toString(),
      action: 'user.updated',
      description: `Email sent to user ${user.email}: ${subject}`,
      targetUserId: id,
      metadata: { subject },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      success: true,
    });

    res.json({
      success: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    // Log failed attempt
    await logAdminAction({
      adminId: req.user._id.toString(),
      action: 'user.updated',
      description: `Failed to send email to user ${user.email}`,
      targetUserId: id,
      metadata: { error: error.message },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
      success: false,
      errorMessage: error.message,
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to send email',
    });
  }
});

module.exports = {
  getUsers,
  getUserDetails,
  updateUserStatus,
  updateUserRole,
  getAuditLogs,
  getStats,
  bulkUpdateUsers,
  resetUserPassword,
  getUserActivity,
  sendEmailToUser,
  impersonateUser,
};

