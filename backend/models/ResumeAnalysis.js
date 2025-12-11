const mongoose = require('mongoose');

const strengthSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  examples: [{
    type: String,
  }],
}, { _id: false });

const weaknessSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  impact: {
    type: String,
  },
  suggestions: [{
    type: String,
  }],
}, { _id: false });

const recommendationSchema = new mongoose.Schema({
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  actionItems: [{
    type: String,
  }],
}, { _id: false });

const sectionScoresSchema = new mongoose.Schema({
  contactInfo: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  summary: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  experience: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  education: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  skills: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  achievements: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  formatting: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  atsOptimization: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
}, { _id: false });

const skillsAnalysisSchema = new mongoose.Schema({
  detected: [{
    type: String,
    trim: true,
  }],
  missing: [{
    type: String,
    trim: true,
  }],
  recommendations: [{
    type: String,
  }],
  categorized: {
    technical: [String],
    soft: [String],
    industry: [String],
    other: [String],
  },
}, { _id: false });

const experienceAnalysisSchema = new mongoose.Schema({
  gaps: [{
    startDate: Date,
    endDate: Date,
    duration: Number, // in months
    explanation: String,
  }],
  achievements: [{
    company: String,
    position: String,
    achievement: String,
    impact: String,
  }],
  recommendations: [String],
  progression: {
    type: String,
    enum: ['positive', 'stable', 'regressive', 'inconclusive'],
  },
}, { _id: false });

const atsAnalysisSchema = new mongoose.Schema({
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  issues: [{
    type: {
      type: String,
      enum: ['keyword', 'formatting', 'structure', 'content'],
    },
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
    },
    description: String,
    location: String,
    fix: String,
  }],
  optimizations: [{
    category: String,
    suggestion: String,
    impact: String,
  }],
  keywords: {
    found: [String],
    missing: [String],
    density: Number,
  },
}, { _id: false });

const resumeAnalysisSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: [true, 'Resume ID is required'],
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true,
  },
  analysisType: {
    type: String,
    enum: ['general', 'ats', 'jd_match'],
    required: [true, 'Analysis type is required'],
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true,
  },
  
  // Overall Scores
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  sectionScores: {
    type: sectionScoresSchema,
    default: {},
  },
  
  // Detailed Analysis
  strengths: [strengthSchema],
  weaknesses: [weaknessSchema],
  recommendations: [recommendationSchema],
  
  // Specific Analysis Data
  skillsAnalysis: {
    type: skillsAnalysisSchema,
    default: {},
  },
  experienceAnalysis: {
    type: experienceAnalysisSchema,
    default: {},
  },
  atsAnalysis: {
    type: atsAnalysisSchema,
    default: {},
  },
  
  // JD Matching (if analysisType is 'jd_match')
  jobDescription: {
    type: String,
    default: null,
  },
  jobDescriptionMatch: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    skillsMatch: {
      matched: [String],
      missing: [String],
      percentage: Number,
    },
    requirementsMatch: {
      met: [String],
      unmet: [String],
      percentage: Number,
    },
    recommendations: [String],
  },
  
  // AI Response Metadata
  aiModel: {
    type: String,
    default: 'gpt-4',
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0,
  },
  tokensUsed: {
    type: Number,
    default: 0,
  },
  analysisDate: {
    type: Date,
    default: Date.now,
  },
  
  errorMessage: {
    type: String,
    default: null,
  },
  rawResponse: {
    type: mongoose.Schema.Types.Mixed, // Store raw AI response for debugging
    default: null,
    select: false, // Don't include in queries by default
  },
}, {
  timestamps: true,
});

// Indexes for performance
resumeAnalysisSchema.index({ resumeId: 1, analysisDate: -1 }); // For resume's analysis history
resumeAnalysisSchema.index({ userId: 1, analysisDate: -1 }); // For user's analyses
resumeAnalysisSchema.index({ resumeId: 1, analysisType: 1, status: 1 }); // For querying specific analysis
resumeAnalysisSchema.index({ status: 1, createdAt: -1 }); // For processing queue

// Critical indexes for dashboard performance
resumeAnalysisSchema.index({ userId: 1, status: 1, createdAt: -1 }); // For dashboard date range queries
resumeAnalysisSchema.index({ userId: 1, status: 1, overallScore: 1 }); // For score aggregations
resumeAnalysisSchema.index({ userId: 1, status: 1, createdAt: -1, overallScore: 1 }); // Compound for trends
resumeAnalysisSchema.index({ userId: 1, status: 1, sectionScores: 1 }); // For section scores
resumeAnalysisSchema.index({ userId: 1, status: 1, analysisType: 1 }); // For analysis type distribution
resumeAnalysisSchema.index({ userId: 1, status: 1, recommendations: 1 }); // For top recommendations

// Virtual for average section score
resumeAnalysisSchema.virtual('averageSectionScore').get(function() {
  if (!this.sectionScores) return 0;
  const scores = Object.values(this.sectionScores);
  const validScores = scores.filter(score => typeof score === 'number' && !isNaN(score));
  if (validScores.length === 0) return 0;
  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / validScores.length);
});

// Method to get analysis summary
resumeAnalysisSchema.methods.getSummary = function() {
  return {
    _id: this._id,
    resumeId: this.resumeId,
    analysisType: this.analysisType,
    status: this.status,
    overallScore: this.overallScore,
    sectionScores: this.sectionScores,
    analysisDate: this.analysisDate,
    strengthsCount: this.strengths?.length || 0,
    weaknessesCount: this.weaknesses?.length || 0,
    recommendationsCount: this.recommendations?.length || 0,
  };
};

// Ensure virtual fields are serialized
resumeAnalysisSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);

