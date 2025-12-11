const mongoose = require('mongoose');

const coverLetterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: [true, 'Resume ID is required'],
    index: true,
  },
  jobTitle: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Job title cannot exceed 200 characters'],
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters'],
  },
  jobDescription: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [10000, 'Job description cannot exceed 10000 characters'],
  },
  tone: {
    type: String,
    enum: ['professional', 'friendly', 'formal', 'enthusiastic'],
    default: 'professional',
  },
  template: {
    type: String,
    enum: ['traditional', 'modern', 'creative', 'technical', 'executive'],
    default: 'traditional',
  },
  content: {
    type: String,
    required: [true, 'Cover letter content is required'],
  },
  version: {
    type: Number,
    default: 1,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters'],
  }],
  metadata: {
    wordCount: {
      type: Number,
      default: 0,
    },
    characterCount: {
      type: Number,
      default: 0,
    },
    aiModel: {
      type: String,
      default: 'gpt-4o-mini',
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    estimatedTokens: {
      type: Number,
      default: 0,
    },
    cached: {
      type: Boolean,
      default: false,
    },
    warnings: [{
      type: String,
    }],
    processingTime: {
      type: Number,
      default: 0,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for performance
coverLetterSchema.index({ userId: 1, createdAt: -1 });
coverLetterSchema.index({ userId: 1, resumeId: 1 });
coverLetterSchema.index({ userId: 1, isFavorite: 1 });

// Method to get cover letter summary
coverLetterSchema.methods.getSummary = function() {
  return {
    _id: this._id,
    jobTitle: this.jobTitle,
    companyName: this.companyName,
    tone: this.tone,
    version: this.version,
    isFavorite: this.isFavorite,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    metadata: this.metadata,
  };
};

module.exports = mongoose.model('CoverLetter', coverLetterSchema);

