const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true,
  },
  originalFilename: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true,
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
  },
  publicId: {
    type: String,
    required: true, // Cloudinary public ID for deletion
  },
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'doc', 'txt'],
    required: [true, 'File type is required'],
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative'],
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  lastAnalyzed: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true,
  },
  extractedText: {
    type: String,
    default: '',
  },
  metadata: {
    pages: {
      type: Number,
      default: 0,
    },
    sections: [{
      type: String,
    }],
    wordCount: {
      type: Number,
      default: 0,
    },
    characterCount: {
      type: Number,
      default: 0,
    },
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters'],
  }],
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  isPrimary: {
    type: Boolean,
    default: false,
    index: true,
  },
  version: {
    type: Number,
    default: 1,
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null,
  },
  errorMessage: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for performance
resumeSchema.index({ userId: 1, uploadDate: -1 }); // For user's resume list queries
resumeSchema.index({ userId: 1, isPrimary: 1 }); // For primary resume queries
resumeSchema.index({ userId: 1, status: 1 }); // For status filtering
resumeSchema.index({ tags: 1 }); // For tag-based searches

// Critical indexes for dashboard performance
resumeSchema.index({ userId: 1, uploadDate: -1, status: 1 }); // Compound for dashboard queries

// Virtual to check if resume has been analyzed
resumeSchema.virtual('hasAnalysis').get(function() {
  return !!this.lastAnalyzed;
});

// Method to get resume summary
resumeSchema.methods.getSummary = function() {
  return {
    _id: this._id,
    title: this.title || this.originalFilename,
    filename: this.filename,
    fileType: this.fileType,
    fileSize: this.fileSize,
    uploadDate: this.uploadDate,
    lastAnalyzed: this.lastAnalyzed,
    status: this.status,
    tags: this.tags,
    isPrimary: this.isPrimary,
    version: this.version,
    metadata: this.metadata,
  };
};

// Ensure virtual fields are serialized
resumeSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Resume', resumeSchema);

