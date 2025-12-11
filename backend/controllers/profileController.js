const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const logger = require('../utils/logger');

/**
 * @desc    Get user profile
 * @route   GET /api/user/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    data: {
      user: user.getPublicProfile(),
    },
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/user/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    phone,
    location,
    bio,
    experience,
    education,
  } = req.body;

  const user = await User.findById(req.user._id);
  const updatedFields = {};

  // Update fields if provided
  if (firstName !== undefined) { user.firstName = firstName; updatedFields.firstName = firstName; }
  if (lastName !== undefined) { user.lastName = lastName; updatedFields.lastName = lastName; }
  if (phone !== undefined) { user.phone = phone; updatedFields.phone = phone; }
  if (location !== undefined) { user.location = location; updatedFields.location = location; }
  if (bio !== undefined) { user.bio = bio; updatedFields.bio = bio; }
  if (experience !== undefined) { user.experience = experience; updatedFields.experience = experience; }
  if (education !== undefined) { user.education = education; updatedFields.education = education; }

  await user.save();

  if (Object.keys(updatedFields).length > 0) {
  }

  res.json({
    success: true,
    data: {
      user: user.getPublicProfile(),
    },
  });
});

/**
 * @desc    Upload profile picture
 * @route   POST /api/user/profile/picture
 * @access  Private
 */
const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const user = await User.findById(req.user._id);

  // Delete existing profile picture if it exists
  if (user.profilePicture && user.profilePicture.publicId) {
    try {
      await deleteFromCloudinary(user.profilePicture.publicId);
    } catch (error) {
      logger.warn('Error deleting old profile picture:', { error: error.message, userId: user._id, publicId: user.profilePicture.publicId });
    }
  }

  // Upload new picture
  const result = await uploadToCloudinary(req.file.buffer, 'resumecraft/profiles', 'image');

  user.profilePicture = {
    url: result.secure_url,
    publicId: result.public_id,
  };

  await user.save();

  res.json({
    success: true,
    data: {
      user: user.getPublicProfile(),
    },
  });
});

/**
 * @desc    Delete profile picture
 * @route   DELETE /api/user/profile/picture
 * @access  Private
 */
const deleteProfilePicture = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user.profilePicture || !user.profilePicture.publicId) {
    return res.status(400).json({
      success: false,
      message: 'No profile picture to delete',
    });
  }

  // Delete from Cloudinary
  await deleteFromCloudinary(user.profilePicture.publicId);

  // Remove from user document
  user.profilePicture = undefined;
  await user.save();

  res.json({
    success: true,
    message: 'Profile picture deleted successfully',
  });
});

/**
 * @desc    Get user preferences
 * @route   GET /api/user/preferences
 * @access  Private
 */
const getPreferences = asyncHandler(async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    data: {
      preferences: user.preferences || {
        emailNotifications: true,
        pushNotifications: true,
        dataSharing: false,
        profileVisibility: 'private',
      },
    },
  });
});

/**
 * @desc    Update user preferences
 * @route   PUT /api/user/preferences
 * @access  Private
 */
const updatePreferences = asyncHandler(async (req, res) => {
  const {
    emailNotifications,
    pushNotifications,
    dataSharing,
    profileVisibility,
  } = req.body;

  const user = await User.findById(req.user._id);

  // Update preferences if provided
  if (emailNotifications !== undefined) user.preferences.emailNotifications = emailNotifications;
  if (pushNotifications !== undefined) user.preferences.pushNotifications = pushNotifications;
  if (dataSharing !== undefined) user.preferences.dataSharing = dataSharing;
  if (profileVisibility !== undefined) user.preferences.profileVisibility = profileVisibility;

  await user.save();
  res.json({
    success: true,
    data: {
      preferences: user.preferences,
    },
  });
});

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getPreferences,
  updatePreferences,
};

