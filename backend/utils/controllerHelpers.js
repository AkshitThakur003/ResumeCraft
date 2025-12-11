/**
 * Controller Helper Utilities
 * Provides reusable patterns for controllers to reduce code duplication
 * @module utils/controllerHelpers
 */

/**
 * @typedef {Object} AppError
 * @property {string} message - Error message
 * @property {number} statusCode - HTTP status code
 * @property {Object} [meta] - Additional error metadata
 */

/**
 * Creates a standardized application error with status code
 * Use this instead of manually creating Error objects with statusCode
 * 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} [meta] - Additional metadata to attach to error
 * @returns {Error} Error object with statusCode property
 * 
 * @example
 * throw createAppError('Resume not found', 404);
 * throw createAppError('Invalid input', 400, { field: 'email' });
 */
const createAppError = (message, statusCode = 500, meta = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (meta) {
    error.meta = meta;
  }
  return error;
};

/**
 * Wraps a notification call to prevent it from failing the main request
 * Logs errors but doesn't throw them
 * 
 * @param {Function} notificationFn - Async function that sends notification
 * @param {string} context - Description of what triggered the notification (for logging)
 * @returns {Promise<void>}
 * 
 * @example
 * await safeNotify(
 *   () => notifyResumeAnalysisComplete(userId, resumeId, fileName),
 *   'resume analysis completion'
 * );
 */
const safeNotify = async (notificationFn, context = 'notification') => {
  try {
    await notificationFn();
  } catch (error) {
    console.error(`Failed to create ${context} notification:`, error.message);
  }
};

/**
 * Standard 404 response for resource not found
 * Throws an error that will be caught by asyncHandler
 * 
 * @param {string} resourceName - Name of the resource (e.g., 'Resume', 'Job')
 * @throws {Error} Error with 404 status code
 * 
 * @example
 * if (!resume) throwNotFound('Resume');
 */
const throwNotFound = (resourceName = 'Resource') => {
  throw createAppError(`${resourceName} not found`, 404);
};

/**
 * Standard 400 response for bad request
 * Throws an error that will be caught by asyncHandler
 * 
 * @param {string} message - Error message
 * @param {Object} [meta] - Additional metadata
 * @throws {Error} Error with 400 status code
 * 
 * @example
 * if (!email) throwBadRequest('Email is required');
 */
const throwBadRequest = (message, meta = null) => {
  throw createAppError(message, 400, meta);
};

/**
 * Validates that a required field meets minimum length
 * Throws standardized error if validation fails
 * 
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field (for error message)
 * @param {number} minLength - Minimum required length
 * @throws {Error} Error with 400 status code if validation fails
 * 
 * @example
 * validateMinLength(jdText, 'Job description', 50);
 */
const validateMinLength = (value, fieldName, minLength) => {
  if (!value || value.trim().length < minLength) {
    throw createAppError(
      `${fieldName} must be at least ${minLength} characters long`,
      400
    );
  }
};

/**
 * Finds a document owned by a user, throws 404 if not found
 * Reduces boilerplate for common "find by id and user" pattern
 * 
 * @param {Object} Model - Mongoose model
 * @param {string} id - Document ID
 * @param {string} userId - User ID (owner)
 * @param {string} resourceName - Name for error message
 * @param {Object} [options] - Additional options
 * @param {string} [options.populate] - Fields to populate
 * @param {boolean} [options.lean] - Whether to use lean() for read-only
 * @returns {Promise<Object>} Found document
 * @throws {Error} 404 error if not found
 * 
 * @example
 * const resume = await findUserDocument(Resume, id, userId, 'Resume', { lean: true });
 */
const findUserDocument = async (Model, id, userId, resourceName, options = {}) => {
  let query = Model.findOne({ _id: id, user: userId });
  
  if (options.populate) {
    query = query.populate(options.populate);
  }
  
  if (options.lean) {
    query = query.lean();
  }
  
  const doc = await query;
  
  if (!doc) {
    throwNotFound(resourceName);
  }
  
  return doc;
};

/**
 * Wraps a controller action with standardized error handling
 * Use this for complex operations that need custom error handling beyond asyncHandler
 * 
 * @param {Function} action - Async function to execute
 * @param {Object} options - Options
 * @param {Function} [options.onError] - Custom error handler
 * @param {Function} [options.cleanup] - Cleanup function to run on error
 * @returns {Promise<any>} Result of action
 * 
 * @example
 * const result = await withErrorHandling(
 *   () => analyzeResume(text),
 *   { cleanup: () => cleanupTempFile(path) }
 * );
 */
const withErrorHandling = async (action, options = {}) => {
  try {
    return await action();
  } catch (error) {
    if (options.cleanup) {
      try {
        await options.cleanup();
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError.message);
      }
    }
    
    if (options.onError) {
      return options.onError(error);
    }
    
    throw error;
  }
};

/**
 * Standardized success response helper
 * Ensures consistent response format across all endpoints
 * 
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {any} data - Response data
 * @param {string} [message] - Optional success message
 * @returns {Object} Express response
 * 
 * @example
 * return sendSuccess(res, 201, { resume }, 'Resume created successfully');
 */
const sendSuccess = (res, statusCode = 200, data = null, message = null) => {
  const response = {
    success: true,
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (message) {
    response.message = message;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Standardized paginated response helper
 * Ensures consistent pagination format across all endpoints
 * 
 * @param {Object} res - Express response object
 * @param {Array} items - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} [itemName] - Name of items (e.g., 'resumes', 'jobs')
 * @returns {Object} Express response
 * 
 * @example
 * return sendPaginated(res, resumes, page, limit, total, 'resumes');
 */
const sendPaginated = (res, items, page, limit, total, itemName = 'items') => {
  return sendSuccess(res, 200, {
    [itemName]: items,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
};

/**
 * Parses tags from string or array format
 * Handles comma-separated strings and arrays, trims whitespace
 * 
 * @param {string|Array<string>|undefined} tags - Tags in string or array format
 * @returns {Array<string>} Array of trimmed tag strings
 * 
 * @example
 * parseTags('tag1, tag2, tag3') // ['tag1', 'tag2', 'tag3']
 * parseTags(['tag1', 'tag2']) // ['tag1', 'tag2']
 * parseTags(undefined) // []
 */
const parseTags = (tags) => {
  if (!tags) return [];
  if (typeof tags === 'string') {
    return tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }
  if (Array.isArray(tags)) {
    return tags.map(t => typeof t === 'string' ? t.trim() : String(t).trim()).filter(t => t.length > 0);
  }
  return [];
};

/**
 * Calculates pagination parameters with validation
 * Ensures page and limit are within valid ranges
 * 
 * @param {string|number} page - Page number
 * @param {string|number} limit - Items per page
 * @param {number} defaultLimit - Default limit if not provided
 * @param {number} maxLimit - Maximum allowed limit
 * @returns {Object} Object with pageSize and skip values
 * 
 * @example
 * const { pageSize, skip } = calculatePagination(req.query.page, req.query.limit, 10, 100);
 */
const calculatePagination = (page, limit, defaultLimit = 10, maxLimit = 100) => {
  const pageSize = Math.min(Math.max(parseInt(limit) || defaultLimit, 1), maxLimit);
  const pageNum = Math.max(parseInt(page) || 1, 1);
  const skip = (pageNum - 1) * pageSize;
  
  return { pageSize, skip, pageNum };
};

/**
 * Creates a standardized success response object
 * @param {any} data - Response data
 * @param {string} [message] - Optional success message
 * @returns {Object} Success response object
 */
const createSuccessResponse = (data, message = null) => {
  const response = {
    success: true,
  };
  
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  
  if (message) {
    response.message = message;
  }
  
  return response;
};

/**
 * Creates a standardized error response object
 * @param {string} message - Error message
 * @returns {Object} Error response object
 */
const createErrorResponse = (message) => {
  return {
    success: false,
    message,
  };
};

module.exports = {
  createAppError,
  safeNotify,
  throwNotFound,
  throwBadRequest,
  validateMinLength,
  findUserDocument,
  withErrorHandling,
  sendSuccess,
  sendPaginated,
  parseTags,
  calculatePagination,
  createSuccessResponse,
  createErrorResponse,
};

