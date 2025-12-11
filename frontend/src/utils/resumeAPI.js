/**
 * Resume API Client Module
 * API functions for resume management and analysis
 * @module utils/resumeAPI
 */

import api from './api';
import { createSSEConnectionPOST } from './sse';

/**
 * Upload a new resume
 * @param {File} file - Resume file to upload
 * @param {Object} metadata - Optional metadata (title, tags)
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise} API response
 */
export const uploadResume = (file, metadata = {}, onProgress = null) => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (metadata.title) {
    formData.append('title', metadata.title);
  }
  
  if (metadata.tags) {
    if (Array.isArray(metadata.tags)) {
      formData.append('tags', metadata.tags.join(','));
    } else {
      formData.append('tags', metadata.tags);
    }
  }

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };

  if (onProgress) {
    config.onUploadProgress = (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      onProgress(percentCompleted);
    };
  }

  return api.post('/resume/upload', formData, config);
};

/**
 * Get list of user's resumes
 * @param {Object} params - Query parameters (status, sort, limit, page, search)
 * @returns {Promise} API response
 */
export const listResumes = (params = {}) => {
  return api.get('/resume/list', { params });
};

/**
 * Get a single resume by ID
 * @param {string} id - Resume ID
 * @returns {Promise} API response
 */
export const getResume = (id) => {
  return api.get(`/resume/${id}`);
};

/**
 * Update resume metadata
 * @param {string} id - Resume ID
 * @param {Object} data - Update data (title, tags, isPrimary)
 * @returns {Promise} API response
 */
export const updateResume = (id, data) => {
  return api.put(`/resume/${id}`, data);
};

/**
 * Delete a resume
 * @param {string} id - Resume ID
 * @returns {Promise} API response
 */
export const deleteResume = (id) => {
  return api.delete(`/resume/${id}`);
};

/**
 * Start resume analysis
 * @param {string} id - Resume ID
 * @param {Object} options - Analysis options (analysisType, jobDescription)
 * @returns {Promise} API response
 */
export const analyzeResume = (id, options = {}) => {
  return api.post(`/resume/${id}/analyze`, {
    analysisType: options.analysisType || 'general',
    jobDescription: options.jobDescription || null,
  });
};

/**
 * Get analysis results
 * @param {string} resumeId - Resume ID
 * @param {string} analysisId - Analysis ID
 * @returns {Promise} API response
 */
export const getAnalysis = (resumeId, analysisId) => {
  return api.get(`/resume/${resumeId}/analysis/${analysisId}`);
};

/**
 * Get all analyses for a resume
 * @param {string} id - Resume ID
 * @param {Object} params - Query parameters (type, limit)
 * @returns {Promise} API response
 */
export const listAnalyses = (id, params = {}) => {
  return api.get(`/resume/${id}/analyses`, { params });
};

/**
 * Check analysis status by polling
 * @param {string} resumeId - Resume ID
 * @param {string} analysisId - Analysis ID
 * @param {Function} onComplete - Callback when analysis completes
 * @param {Function} onError - Error callback
 * @param {number} pollInterval - Polling interval in ms (default 2000)
 * @param {number} maxAttempts - Maximum polling attempts (default 30)
 * @returns {Function} Function to stop polling
 */
export const pollAnalysisStatus = (
  resumeId,
  analysisId,
  onComplete,
  onError,
  pollInterval = 2000,
  maxAttempts = 30
) => {
  let attempts = 0;
  let isCancelled = false;
  let timeoutId = null; // Store timeout ID for cleanup

  const poll = async () => {
    if (isCancelled || attempts >= maxAttempts) {
      if (!isCancelled && attempts >= maxAttempts) {
        onError(new Error('Analysis timeout - maximum polling attempts reached'));
      }
      return;
    }

    attempts++;

    try {
      const response = await getAnalysis(resumeId, analysisId);
      const analysis = response.data.data?.analysis;

      if (!analysis) {
        onError(new Error('Analysis not found'));
        return;
      }

      if (analysis.status === 'completed') {
        onComplete(analysis);
      } else if (analysis.status === 'failed') {
        onError(new Error(analysis.errorMessage || 'Analysis failed'));
      } else {
        // Still processing, continue polling - store timeout ID
        timeoutId = setTimeout(poll, pollInterval);
      }
    } catch (error) {
      onError(error);
    }
  };

  // Start polling
  poll();

  // Return cancel function with proper cleanup (FIX #3: Memory Leak)
  return () => {
    isCancelled = true;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
};

/**
 * Analyze resume with SSE stream for progress updates
 * @param {string} id - Resume ID
 * @param {Object} options - Analysis options (analysisType, jobDescription)
 * @param {Object} callbacks - Progress callbacks
 * @param {Function} callbacks.onProgress - Progress callback (progress: number, message: string)
 * @param {Function} callbacks.onAnalysisId - Callback when analysis ID is received
 * @param {Function} callbacks.onComplete - Completion callback (analysis: Object)
 * @param {Function} callbacks.onError - Error callback (error: Error)
 * @returns {Function} Function to cancel the stream
 */
export const analyzeResumeStream = (id, options = {}, callbacks = {}) => {
  const { onProgress = () => {}, onAnalysisId = () => {}, onComplete = () => {}, onError = () => {} } = callbacks;
  
  return createSSEConnectionPOST(`/api/resume/${id}/analyze-stream`, {
    analysisType: options.analysisType || 'general',
    jobDescription: options.jobDescription || null,
  }, {
    onMessage: (message) => {
      if (message.type === 'analysis_id' || message.analysisId) {
        onAnalysisId(message.analysisId);
      } else if (message.progress !== undefined) {
        onProgress(message.progress, message.message || 'Processing...');
      }
    },
    onComplete: (result) => {
      if (result.analysis) {
        onComplete(result.analysis);
      } else {
        onComplete(result);
      }
    },
    onError: (error) => {
      onError(error);
    },
  });
};

/**
 * Compare two resumes
 * @param {string[]} resumeIds - Array of two resume IDs
 * @returns {Promise} API response
 */
export const compareResumes = (resumeIds) => {
  return api.post('/resume/compare', { resumeIds });
};

export default {
  uploadResume,
  listResumes,
  getResume,
  updateResume,
  deleteResume,
  analyzeResume,
  analyzeResumeStream,
  getAnalysis,
  listAnalyses,
  pollAnalysisStatus,
  compareResumes,
};

