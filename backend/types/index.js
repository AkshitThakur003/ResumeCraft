/**
 * JSDoc Type Definitions for ResumeCraft Backend
 * This file provides type documentation for complex data structures used throughout the application.
 * Import types using: const { Types } = require('./types');
 * @module types
 */

/**
 * @typedef {Object} User
 * @property {string} _id - MongoDB ObjectId
 * @property {string} email - User email address
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} password - Hashed password
 * @property {'user'|'admin'} role - User role
 * @property {boolean} isVerified - Email verification status
 * @property {boolean} isActive - Account active status
 * @property {Date} createdAt - Account creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} Resume
 * @property {string} _id - MongoDB ObjectId
 * @property {string} user - User ObjectId reference
 * @property {string} fileName - Original file name
 * @property {string} fileType - File extension (pdf, docx)
 * @property {number} fileSize - File size in bytes
 * @property {string} storagePath - Path to stored file
 * @property {string} extractedText - Parsed text content
 * @property {string} contentHash - Hash of content for deduplication
 * @property {ResumeAnalysis} analysis - AI analysis results
 * @property {JDAnalysis[]} jdAnalyses - Job description analyses
 * @property {ResumeComparison[]} comparisons - JD comparison history
 * @property {ResumeRewrite[]} rewrites - AI rewrite history
 * @property {ResumeChunk[]} chunks - Vector search chunks
 * @property {EmbeddingMetadata} embeddings - Embedding metadata
 * @property {number} version - Resume version number
 * @property {string} [parentResume] - Parent resume ObjectId for versions
 * @property {boolean} isActive - Active status
 * @property {Date} uploadDate - Upload timestamp
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} ResumeAnalysis
 * @property {number} resume_score - Overall resume score (0-100)
 * @property {ScoringBreakdown} scoring_breakdown - Score breakdown by category
 * @property {string[]} skills - Identified skills
 * @property {ExperienceItem[]} experience - Work experience items
 * @property {EducationItem[]} education - Education items
 * @property {Recommendation[]} recommendations - Improvement recommendations
 * @property {string} summary - AI-generated summary
 * @property {string} explanation - Analysis explanation
 * @property {string} source - AI model used
 * @property {string} schema_version - Analysis schema version
 * @property {Date} createdAt - Analysis timestamp
 */

/**
 * @typedef {Object} ScoringBreakdown
 * @property {number} skills - Skills score (0-100)
 * @property {number} formatting - Formatting score (0-100)
 * @property {number} grammar - Grammar score (0-100)
 * @property {number} tone - Tone score (0-100)
 * @property {number} achievements - Achievements score (0-100)
 */

/**
 * @typedef {Object} JDAnalysis
 * @property {string} jdId - Job Description ObjectId reference
 * @property {number} resume_score - Resume score (0-100)
 * @property {number} jd_match_score - JD match score (0-100)
 * @property {ScoringBreakdown} scoring_breakdown - Score breakdown
 * @property {string[]} skills_matched - Skills that match JD
 * @property {string[]} skills_missing - Skills missing from resume
 * @property {number} skills_matched_count - Count of matched skills
 * @property {string[]} relevant_experience - Relevant experience highlights
 * @property {string[]} gaps - Identified gaps
 * @property {Recommendation[]} recommendations - Tailored recommendations
 * @property {string} explanation - Analysis explanation
 * @property {string} analysisHash - Hash for deduplication
 * @property {string} source - AI model used
 * @property {string} type - Analysis type ('jd')
 * @property {Date} createdAt - Analysis timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Recommendation
 * @property {string} text - Recommendation text
 * @property {number} [confidence] - Confidence score (0-1)
 * @property {string} [category] - Recommendation category
 */

/**
 * @typedef {Object} ExperienceItem
 * @property {string} title - Job title
 * @property {string} company - Company name
 * @property {string} duration - Employment duration
 * @property {string[]} highlights - Key achievements
 */

/**
 * @typedef {Object} EducationItem
 * @property {string} degree - Degree name
 * @property {string} institution - School/University name
 * @property {string} year - Graduation year
 */

/**
 * @typedef {Object} ResumeComparison
 * @property {string} jobDescription - JD text compared against
 * @property {number} matchScore - Match score (0-100)
 * @property {number} score - Overall score
 * @property {string[]} skillsMissing - Missing skills
 * @property {string[]} skillsMatched - Matched skills
 * @property {string[]} recommendations - Recommendations
 * @property {string} feedback - AI feedback
 * @property {string} requestId - AI request ID for tracking
 * @property {Date} analysisDate - Comparison timestamp
 */

/**
 * @typedef {Object} ResumeRewrite
 * @property {string} summary - Rewrite summary
 * @property {string} rewrittenResume - Full rewritten text
 * @property {string[]} improvements - List of improvements made
 * @property {string[]} skills - Highlighted skills
 * @property {ExperienceItem[]} experience - Rewritten experience
 * @property {string} requestId - AI request ID
 * @property {Date} rewriteDate - Rewrite timestamp
 */

/**
 * @typedef {Object} ResumeChunk
 * @property {string} content - Chunk text content
 * @property {string} section - Section name (summary, experience, etc.)
 * @property {number} startIndex - Start position in original text
 * @property {number} endIndex - End position in original text
 * @property {number[]} embedding - Vector embedding (1536 dimensions)
 * @property {number} tokenCount - Token count for chunk
 */

/**
 * @typedef {Object} EmbeddingMetadata
 * @property {string} model - Embedding model used
 * @property {number} dimensions - Vector dimensions
 * @property {number} chunkCount - Number of chunks
 * @property {Date} lastUpdated - Last embedding update
 * @property {boolean} isComplete - Whether all chunks have embeddings
 */

/**
 * @typedef {Object} Job
 * @property {string} _id - MongoDB ObjectId
 * @property {string} user - User ObjectId reference
 * @property {string} company - Company name
 * @property {string} position - Job title/position
 * @property {string} [location] - Job location
 * @property {string} [description] - Job description
 * @property {string} [url] - Job posting URL
 * @property {number} [salary] - Salary amount
 * @property {'Applied'|'Interview'|'Offer'|'Rejected'|'Withdrawn'} status - Application status
 * @property {'Wishlist'|'Applied'|'Interview'|'Offer'|'Rejected'} stage - Pipeline stage
 * @property {'low'|'medium'|'high'} priority - Priority level
 * @property {string} [notes] - User notes
 * @property {string[]} tags - Custom tags
 * @property {Date} [deadline] - Application deadline
 * @property {Date} [followUpDate] - Follow-up reminder date
 * @property {Date} [interviewDate] - Scheduled interview date
 * @property {JobAttachment[]} attachments - File attachments
 * @property {JobActivity[]} activityLog - Activity history
 * @property {boolean} isArchived - Archive status
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} JobAttachment
 * @property {string} id - Unique attachment ID
 * @property {string} url - File URL
 * @property {string} fileName - Original file name
 * @property {string} fileType - MIME type
 * @property {string} [publicId] - Cloudinary public ID
 * @property {Date} uploadedAt - Upload timestamp
 * @property {'cloudinary'|'local'} source - Storage source
 */

/**
 * @typedef {Object} JobActivity
 * @property {string} type - Activity type
 * @property {string} summary - Activity summary
 * @property {Object} [metadata] - Additional metadata
 * @property {string} actor - User who performed action
 * @property {Date} timestamp - Activity timestamp
 */

/**
 * @typedef {Object} Note
 * @property {string} _id - MongoDB ObjectId
 * @property {string} user - User ObjectId reference
 * @property {string} [job] - Associated Job ObjectId
 * @property {string} title - Note title
 * @property {string} content - Note content
 * @property {'note'|'task'|'reminder'} type - Note type
 * @property {boolean} isCompleted - Completion status (for tasks)
 * @property {Date} [reminderDate] - Reminder date/time
 * @property {boolean} reminderSent - Whether reminder was sent
 * @property {string[]} tags - Custom tags
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} Notification
 * @property {string} _id - MongoDB ObjectId
 * @property {string} user - User ObjectId reference
 * @property {'info'|'success'|'warning'|'error'|'default'} type - Notification type
 * @property {string} title - Notification title
 * @property {string} [message] - Notification message
 * @property {Object} metadata - Additional metadata
 * @property {boolean} read - Read status
 * @property {Date} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} JD
 * @property {string} _id - MongoDB ObjectId
 * @property {string} user - User ObjectId reference
 * @property {string} title - Job title
 * @property {string} company - Company name
 * @property {string} jdText - Full job description text
 * @property {string} contentHash - Hash for deduplication
 * @property {string[]} [skills] - Extracted skills
 * @property {number} usageCount - Times used for analysis
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} AIAnalysisResponse
 * @property {Object} result - Analysis result object
 * @property {string} requestId - Unique request ID for tracking
 * @property {boolean} cacheHit - Whether result was from cache
 * @property {string} source - AI model/source used
 */

/**
 * @typedef {Object} PaginationParams
 * @property {number} [page=1] - Page number (1-indexed)
 * @property {number} [limit=10] - Items per page
 * @property {string} [sortBy] - Field to sort by
 * @property {'asc'|'desc'} [sortOrder='desc'] - Sort direction
 */

/**
 * @typedef {Object} PaginationResult
 * @property {number} currentPage - Current page number
 * @property {number} totalPages - Total number of pages
 * @property {number} totalItems - Total number of items
 * @property {boolean} hasNext - Whether next page exists
 * @property {boolean} hasPrev - Whether previous page exists
 */

/**
 * @typedef {Object} APIResponse
 * @property {boolean} success - Whether request succeeded
 * @property {string} [message] - Response message
 * @property {Object} [data] - Response data
 * @property {Object[]} [errors] - Validation errors
 */

// Export empty object - types are accessed via JSDoc
module.exports = {};

