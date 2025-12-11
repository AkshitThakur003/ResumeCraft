/**
 * @fileoverview Server-Sent Events (SSE) Controller
 * @module controllers/sseController
 * @description Handles SSE connections for real-time progress updates
 */

const logger = require('../utils/logger');

/**
 * Send SSE event to client
 * @param {Object} res - Express response object
 * @param {string} event - Event type
 * @param {Object} data - Event data
 */
const sendSSE = (res, event, data) => {
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (error) {
    logger.error('Error sending SSE event:', { error: error.message, event });
  }
};

/**
 * Setup SSE connection headers
 * @param {Object} res - Express response object
 */
const setupSSEHeaders = (res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  
  // CORS headers for SSE
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
  
  // Send initial connection message
  res.write(': connected\n\n');
};

/**
 * Handle SSE connection cleanup
 * @param {Object} res - Express response object
 * @param {Function} cleanup - Optional cleanup function
 */
const handleSSECleanup = (res, cleanup = null) => {
  const cleanupAndClose = () => {
    if (cleanup && typeof cleanup === 'function') {
      try {
        cleanup();
      } catch (error) {
        logger.error('Error in SSE cleanup function:', error);
      }
    }
    
    if (!res.headersSent) {
      res.end();
    }
  };

  // Handle client disconnect
  res.on('close', () => {
    logger.info('SSE connection closed by client');
    cleanupAndClose();
  });

  // Handle errors
  res.on('error', (error) => {
    logger.error('SSE connection error:', error);
    cleanupAndClose();
  });

  // Handle timeout (optional)
  res.setTimeout(0); // Disable timeout for long-running connections
};

module.exports = {
  sendSSE,
  setupSSEHeaders,
  handleSSECleanup,
};

