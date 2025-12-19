/**
 * Server-Sent Events (SSE) Client Utility
 * @module utils/sse
 * @description Handles SSE connections for real-time progress updates
 */

import api from './api';
import { getStoredAccessToken } from './tokenStorage';
import { logger } from './logger';

/**
 * Create an SSE connection to a stream endpoint
 * @param {string} url - SSE endpoint URL
 * @param {Object} options - Configuration options
 * @param {Object} options.headers - Custom headers (should include auth token)
 * @param {Function} options.onMessage - Callback for progress messages
 * @param {Function} options.onComplete - Callback when stream completes
 * @param {Function} options.onError - Callback for errors
 * @returns {Function} Function to close the SSE connection
 */
export const createSSEConnection = (url, options = {}) => {
  const {
    headers = {},
    onMessage = () => {},
    onComplete = () => {},
    onError = () => {},
  } = options;

  // Get auth token using centralized token storage utility
  const { token } = getStoredAccessToken();
  const authToken = token || headers.authorization?.replace('Bearer ', '');
  
  // Build full URL with base URL
  // VITE_API_URL already includes /api, so use it as-is
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const fullURL = url.startsWith('http') ? url : `${baseURL}${url.startsWith('/') ? url : `/${url}`}`;

  // Create EventSource with token in query params or use fetch for custom headers
  // Note: EventSource doesn't support custom headers, so we'll use fetch with streaming
  let abortController = new AbortController();
  let isClosed = false;

  const connect = async () => {
    try {
      // For SSE with authentication, we need to use fetch API
      const response = await fetch(fullURL, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          ...headers,
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            let event = 'message';
            let data = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                event = line.substring(6).trim();
              } else if (line.startsWith('data:')) {
                data += line.substring(5).trim() + '\n';
              } else if (line === '') {
                // Empty line indicates end of event
                if (data) {
                  try {
                    const parsedData = JSON.parse(data.trim());
                    handleEvent(event, parsedData);
                  } catch (parseError) {
                    logger.error('Error parsing SSE data:', parseError, data);
                  }
                  data = '';
                  event = 'message';
                }
              }
            }
          }

          // Process any remaining data
          if (buffer.trim()) {
            try {
              const parsedData = JSON.parse(buffer.trim());
              handleEvent('message', parsedData);
            } catch (parseError) {
              logger.error('Error parsing final SSE data:', parseError);
            }
          }
        } catch (streamError) {
          if (!isClosed && streamError.name !== 'AbortError') {
            onError(streamError);
          }
        }
      };

      processStream();
    } catch (error) {
      if (!isClosed && error.name !== 'AbortError') {
        onError(error);
      }
    }
  };

  const handleEvent = (event, data) => {
    switch (event) {
      case 'progress':
        onMessage(data);
        break;
      case 'complete':
        onComplete(data);
        break;
      case 'error':
        onError(new Error(data.message || 'Unknown error'));
        break;
      case 'notification':
      case 'initial':
      case 'connected':
        // Pass notification events to onMessage handler
        onMessage({ event, ...data });
        break;
      default:
        onMessage({ event, ...data });
    }
  };

  // Start connection
  connect();

  // Return close function
  return () => {
    isClosed = true;
    abortController.abort();
  };
};

/**
 * Create SSE connection for POST requests using fetch with streaming
 * @param {string} url - SSE endpoint URL
 * @param {Object} body - Request body data
 * @param {Object} options - Configuration options
 * @returns {Function} Function to close the SSE connection
 */
export const createSSEConnectionPOST = (url, body, options = {}) => {
  const {
    headers = {},
    onMessage = () => {},
    onComplete = () => {},
    onError = () => {},
  } = options;

  // Get auth token using centralized token storage utility
  const { token: authToken } = getStoredAccessToken();
  
  // Build full URL
  // VITE_API_URL already includes /api, so use it as-is
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const fullURL = url.startsWith('http') ? url : `${baseURL}${url.startsWith('/') ? url : `/${url}`}`;

  let abortController = new AbortController();
  let isClosed = false;

  const connect = async () => {
    try {
      const response = await fetch(fullURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          ...headers,
        },
        body: JSON.stringify(body),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `SSE connection failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            let event = 'message';
            let data = '';

            for (const line of lines) {
              if (line.startsWith('event:')) {
                event = line.substring(6).trim();
              } else if (line.startsWith('data:')) {
                data += line.substring(5).trim() + '\n';
              } else if (line === '') {
                if (data) {
                  try {
                    const parsedData = JSON.parse(data.trim());
                    handleEvent(event, parsedData);
                  } catch (parseError) {
                    logger.error('Error parsing SSE data:', parseError, data);
                  }
                  data = '';
                  event = 'message';
                }
              } else if (line.startsWith(':')) {
                // Comment line, ignore
                continue;
              }
            }
          }

          if (buffer.trim()) {
            try {
              const parsedData = JSON.parse(buffer.trim());
              handleEvent('message', parsedData);
            } catch (parseError) {
              logger.error('Error parsing final SSE data:', parseError);
            }
          }
        } catch (streamError) {
          if (!isClosed && streamError.name !== 'AbortError') {
            onError(streamError);
          }
        }
      };

      processStream();
    } catch (error) {
      if (!isClosed && error.name !== 'AbortError') {
        onError(error);
      }
    }
  };

  const handleEvent = (event, data) => {
    switch (event) {
      case 'progress':
        onMessage(data);
        break;
      case 'complete':
        onComplete(data);
        break;
      case 'analysis_id':
        onMessage({ type: 'analysis_id', ...data });
        break;
      case 'error':
        onError(new Error(data.message || 'Unknown error'));
        break;
      default:
        onMessage({ event, ...data });
    }
  };

  // Start connection
  connect();

  // Return close function
  return () => {
    isClosed = true;
    abortController.abort();
  };
};

export default {
  createSSEConnection,
  createSSEConnectionPOST,
};

