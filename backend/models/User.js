const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { hashToken } = require('../utils/hash.util');
const { validatePassword } = require('../utils/validators');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  level: {
    type: Number,
    min: 1,
    max: 10,
    default: 5,
  },
});

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email',
    ],
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if not using OAuth
      return !this.oauthProvider;
    },
    validate: {
      validator: function(value) {
        // Skip validation if password is not being set (OAuth users)
        if (!value && this.oauthProvider) return true;
        const result = validatePassword(value);
        return result.valid;
      },
      message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)'
    },
    select: false, // Don't include password in queries by default
  },
  // 🟡 OAuth integration
  oauthProvider: {
    type: String,
    enum: ['google', 'linkedin'],
    sparse: true, // Allows multiple null values
  },
  oauthId: {
    type: String,
    sparse: true, // Allows multiple null values
  },
  role: {
    type: String,
    enum: ['user', 'recruiter', 'admin'],
    default: 'user',
  },
  profilePicture: {
    url: String,
    publicId: String,
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters'],
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters'],
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
  },
  skills: [skillSchema],
  experience: {
    type: String,
    trim: true,
  },
  education: {
    type: String,
    trim: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerifiedAt: {
    type: Date,
  },
  emailVerificationTokenHash: {
    type: String,
    select: false,
  },
  emailVerificationExpires: {
    type: Date,
  },
  refreshTokenHash: {
    type: String,
    select: false,
  },
  refreshTokenVersion: {
    type: Number,
    default: 0,
  },
  passwordResetTokenHash: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
  },
  rateLimits: {
    type: {
      reanalysis: {
        date: {
          type: String,
        },
        count: {
          type: Number,
          default: 0,
        },
      },
    },
    default: {},
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  deactivatedAt: {
    type: Date,
  },
  profileCompletionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  lastLogin: {
    type: Date,
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    dataSharing: {
      type: Boolean,
      default: false,
    },
    profileVisibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'private',
    },
  },
}, {
  timestamps: true,
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's been modified and password exists
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to calculate profile completion
userSchema.pre('save', function(next) {
  const fields = [
    'firstName', 'lastName', 'email', 'phone', 'location', 
    'bio', 'experience', 'education'
  ];
  
  let completedFields = 0;
  fields.forEach(field => {
    if (this[field] && this[field].toString().trim()) {
      completedFields++;
    }
  });
  
  // Add bonus for profile picture and skills
  if (this.profilePicture && this.profilePicture.url) completedFields += 0.5;
  if (this.skills && this.skills.length > 0) completedFields += 0.5;
  
  this.profileCompletionPercentage = Math.round((completedFields / fields.length) * 100);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  // Return false if no password is set (OAuth users)
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshTokenHash;
  delete userObject.emailVerificationTokenHash;
  delete userObject.passwordResetTokenHash;
  return userObject;
};

userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationTokenHash = hashToken(token);
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

userSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetTokenHash = hashToken(token);
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

// Additional indexes for performance
userSchema.index({ email: 1, isActive: 1 }); // For login queries
userSchema.index({ oauthProvider: 1, oauthId: 1 }, { sparse: true, unique: true }); // For OAuth queries
userSchema.index({ lastLogin: -1 }); // For analytics
userSchema.index({ refreshTokenHash: 1 }, { sparse: true }); // For token refresh queries

module.exports = mongoose.model('User', userSchema);
