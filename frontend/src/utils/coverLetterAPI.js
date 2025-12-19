/**
 * Cover Letter API Client Module
 * API functions for cover letter management
 * @module utils/coverLetterAPI
 */

import api from './api';
import { createSSEConnectionPOST } from './sse';

/**
 * Generate a new cover letter
 * @param {Object} data - Cover letter generation data
 * @param {string} data.resumeId - Resume ID
 * @param {string} data.jobTitle - Job title
 * @param {string} data.companyName - Company name
 * @param {string} data.jobDescription - Job description
 * @param {string} data.tone - Tone (professional, friendly, formal, enthusiastic)
 * @returns {Promise} API response
 */
export const generateCoverLetter = (data) => {
  return api.post('/cover-letter/generate', data);
};

/**
 * Get list of user's cover letters
 * @param {Object} params - Query parameters (page, limit, sort, order, search, resumeId)
 * @returns {Promise} API response
 */
export const listCoverLetters = (params = {}) => {
  return api.get('/cover-letter/list', { params });
};

/**
 * Get a single cover letter by ID
 * @param {string} id - Cover letter ID
 * @returns {Promise} API response
 */
export const getCoverLetter = (id) => {
  return api.get(`/cover-letter/${id}`);
};

/**
 * Update a cover letter
 * @param {string} id - Cover letter ID
 * @param {Object} data - Update data (content, isFavorite, tags, jobTitle, companyName)
 * @returns {Promise} API response
 */
export const updateCoverLetter = (id, data) => {
  return api.put(`/cover-letter/${id}`, data);
};

/**
 * Delete a cover letter
 * @param {string} id - Cover letter ID
 * @returns {Promise} API response
 */
export const deleteCoverLetter = (id) => {
  return api.delete(`/cover-letter/${id}`);
};

/**
 * Create a new version of a cover letter
 * @param {string} id - Cover letter ID
 * @param {Object} data - Version data (content, tone)
 * @returns {Promise} API response
 */
export const createVersion = (id, data = {}) => {
  return api.post(`/cover-letter/${id}/version`, data);
};

/**
 * Regenerate a cover letter version with AI
 * @param {string} id - Cover letter ID
 * @param {Object} data - Regeneration data (tone, template)
 * @returns {Promise} API response
 */
export const regenerateVersion = (id, data = {}) => {
  return api.post(`/cover-letter/${id}/regenerate`, data);
};

/**
 * Get available templates
 * @returns {Promise} API response
 */
export const getTemplates = () => {
  return api.get('/cover-letter/templates');
};

/**
 * Export cover letter
 * @param {string} id - Cover letter ID
 * @param {string} format - Export format (pdf, docx, txt)
 * @returns {Promise} API response
 */
export const exportCoverLetter = (id, format = 'txt') => {
  return api.get(`/cover-letter/${id}/export`, {
    params: { format },
    responseType: format === 'txt' ? 'text' : 'blob',
  });
};

/**
 * Get cost analytics
 * @param {Object} params - Query parameters (startDate, endDate)
 * @returns {Promise} API response
 */
export const getCostAnalytics = (params = {}) => {
  return api.get('/cover-letter/analytics/costs', { params });
};

/**
 * Get quality analytics
 * @returns {Promise} API response
 */
export const getQualityAnalytics = () => {
  return api.get('/cover-letter/analytics/quality');
};

/**
 * Generate cover letter with SSE stream for progress updates
 * @param {Object} data - Cover letter generation data
 * @param {Object} callbacks - Progress callbacks
 * @param {Function} callbacks.onProgress - Progress callback (progress: number, message: string)
 * @param {Function} callbacks.onComplete - Completion callback (coverLetter: Object)
 * @param {Function} callbacks.onError - Error callback (error: Error)
 * @returns {Function} Function to cancel the stream
 */
export const generateCoverLetterStream = (data, callbacks = {}) => {
  const { onProgress = () => {}, onComplete = () => {}, onError = () => {} } = callbacks;

  return createSSEConnectionPOST('/cover-letter/generate-stream', data, {
    onMessage: (message) => {
      if (message.progress !== undefined) {
        onProgress(message.progress, message.message || 'Processing...');
      }
    },
    onComplete: (result) => {
      onComplete(result);
    },
    onError: (error) => {
      onError(error);
    },
  });
};

export default {
  generateCoverLetter,
  generateCoverLetterStream,
  listCoverLetters,
  getCoverLetter,
  updateCoverLetter,
  deleteCoverLetter,
  createVersion,
  regenerateVersion,
  getTemplates,
  exportCoverLetter,
  getCostAnalytics,
  getQualityAnalytics,
};

