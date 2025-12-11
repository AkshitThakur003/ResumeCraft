/**
 * @fileoverview Input Sanitization Utilities
 * @module utils/inputSanitizer
 * @description Sanitize user inputs to prevent XSS and injection attacks
 */

const xss = require('xss');

/**
 * XSS filter configuration
 */
const xssOptions = {
  whiteList: {}, // No HTML tags allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script'],
};

/**
 * Sanitize string input
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') return '';
  return xss(input.trim(), xssOptions);
};

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Sanitize resume text
 * @param {string} text - Resume text
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized resume text
 */
const sanitizeResumeText = (text, maxLength = 50000) => {
  if (!text || typeof text !== 'string') return '';
  const sanitized = sanitizeString(text);
  return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
};

/**
 * Sanitize job description
 * @param {string} description - Job description
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized job description
 */
const sanitizeJobDescription = (description, maxLength = 10000) => {
  if (!description || typeof description !== 'string') return '';
  const sanitized = sanitizeString(description);
  return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
};

/**
 * Validate and sanitize email
 * @param {string} email - Email address
 * @returns {string|null} Sanitized email or null if invalid
 */
const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : null;
};

/**
 * Validate and sanitize URL
 * @param {string} url - URL
 * @returns {string|null} Sanitized URL or null if invalid
 */
const sanitizeURL = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  try {
    const urlObj = new URL(trimmed);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
};

/**
 * Sanitize phone number
 * @param {string} phone - Phone number
 * @returns {string} Sanitized phone number
 */
const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  // Remove all non-digit characters except +, -, spaces, parentheses
  return phone.replace(/[^\d\s\-\+\(\)]/g, '').trim();
};

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizeResumeText,
  sanitizeJobDescription,
  sanitizeEmail,
  sanitizeURL,
  sanitizePhone,
};
