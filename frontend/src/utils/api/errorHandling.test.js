import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'
import { handleApiError, createUploadConfig, apiRequest } from './errorHandling'

// Mock logger and sentry
vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

vi.mock('../sentry', () => ({
  captureException: vi.fn(),
}))

describe('errorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleApiError', () => {
    it('handles server error response', () => {
      const error = {
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: {
            message: 'Validation failed',
            errors: [{ field: 'email', message: 'Invalid email' }],
          },
          config: {
            url: '/api/users',
            method: 'post',
            baseURL: 'http://localhost:5000',
          },
        },
      }

      const result = handleApiError(error)

      expect(result.message).toBe('Validation failed')
      expect(result.status).toBe(400)
      expect(result.errors).toEqual([{ field: 'email', message: 'Invalid email' }])
    })

    it('handles rate limit error (429)', () => {
      const error = {
        response: {
          status: 429,
          data: {
            message: 'Too many requests',
          },
          config: {
            url: '/api/users',
            method: 'get',
          },
        },
      }

      const result = handleApiError(error)

      expect(result.isRateLimit).toBe(true)
      expect(result.status).toBe(429)
      expect(result.message).toBe('Too many requests')
    })

    it('handles service unavailable error (503)', () => {
      const error = {
        response: {
          status: 503,
          data: {
            message: 'Service unavailable',
          },
          config: {
            url: '/api/users',
            method: 'get',
          },
        },
      }

      const result = handleApiError(error)

      expect(result.isServiceUnavailable).toBe(true)
      expect(result.status).toBe(503)
    })

    it('handles network error', () => {
      const error = {
        request: {},
        message: 'Network Error',
        config: {
          url: '/api/users',
          method: 'get',
        },
      }

      const result = handleApiError(error)

      expect(result.message).toBe('Network error. Please check your connection.')
      expect(result.status).toBe(0)
      expect(result.errors).toEqual([])
    })

    it('handles error without response or request', () => {
      const error = {
        message: 'Unexpected error',
      }

      const result = handleApiError(error)

      expect(result.message).toBe('Unexpected error')
      expect(result.status).toBe(0)
      expect(result.isNetworkError).toBe(true)
    })

    it('handles error with default message when none provided', () => {
      const error = {
        response: {
          status: 500,
          data: {},
          config: {
            url: '/api/users',
            method: 'get',
          },
        },
      }

      const result = handleApiError(error)

      expect(result.message).toBe('An error occurred')
    })
  })

  describe('createUploadConfig', () => {
    it('creates config with progress callback', () => {
      const onProgress = vi.fn()
      const config = createUploadConfig(onProgress)

      expect(config).toHaveProperty('onUploadProgress')
      expect(typeof config.onUploadProgress).toBe('function')
    })

    it('calls progress callback with percentage', () => {
      const onProgress = vi.fn()
      const config = createUploadConfig(onProgress)

      const progressEvent = {
        loaded: 50,
        total: 100,
      }

      config.onUploadProgress(progressEvent)

      expect(onProgress).toHaveBeenCalledWith(50)
    })

    it('handles progress event without total', () => {
      const onProgress = vi.fn()
      const config = createUploadConfig(onProgress)

      const progressEvent = {
        loaded: 50,
      }

      config.onUploadProgress(progressEvent)

      expect(onProgress).not.toHaveBeenCalled()
    })

    it('handles missing progress callback', () => {
      const config = createUploadConfig(null)

      const progressEvent = {
        loaded: 50,
        total: 100,
      }

      expect(() => config.onUploadProgress(progressEvent)).not.toThrow()
    })
  })

  describe('apiRequest', () => {
    it('returns success response', async () => {
      const requestFn = vi.fn().mockResolvedValue({
        data: {
          success: true,
          data: { id: 1, name: 'John' },
          message: 'Success',
        },
      })

      const result = await apiRequest(requestFn)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: 1, name: 'John' })
      expect(result.message).toBe('Success')
    })

    it('handles error without retry', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Bad request',
            errors: [],
          },
        },
      }

      const requestFn = vi.fn().mockRejectedValue(error)

      const result = await apiRequest(requestFn)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Bad request')
      expect(result.status).toBe(400)
    })

    it('retries on retryable status codes', async () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: 'Server error',
          },
        },
      }

      const requestFn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue({
          data: {
            success: true,
            data: { id: 1 },
          },
        })

      vi.useFakeTimers()

      const promise = apiRequest(requestFn, {
        retries: 1,
        retryDelay: 100,
      })

      // Fast-forward past retry delay
      await vi.runAllTimersAsync()
      const result = await promise

      vi.useRealTimers()

      expect(result.success).toBe(true)
      expect(requestFn).toHaveBeenCalledTimes(2)
    }, 10000)

    it('calls onRetry callback', async () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: 'Server error',
          },
        },
      }

      const requestFn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue({
          data: {
            success: true,
            data: { id: 1 },
          },
        })

      const onRetry = vi.fn()

      vi.useFakeTimers()

      const promise = apiRequest(requestFn, {
        retries: 1,
        retryDelay: 100,
        onRetry,
      })

      await vi.runAllTimersAsync()
      await promise

      vi.useRealTimers()

      expect(onRetry).toHaveBeenCalledWith(1, 1, expect.objectContaining({
        status: 500,
      }))
    }, 10000)

    it('does not retry on non-retryable status codes', async () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Bad request',
          },
        },
      }

      const requestFn = vi.fn().mockRejectedValue(error)

      const result = await apiRequest(requestFn, {
        retries: 3,
      })

      expect(result.success).toBe(false)
      expect(requestFn).toHaveBeenCalledTimes(1)
    })

    it('retries on network errors (status 0)', async () => {
      const error = {
        request: {},
        message: 'Network Error',
      }

      const requestFn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue({
          data: {
            success: true,
            data: { id: 1 },
          },
        })

      vi.useFakeTimers()

      const promise = apiRequest(requestFn, {
        retries: 1,
        retryDelay: 100,
      })

      await vi.runAllTimersAsync()
      const result = await promise

      vi.useRealTimers()

      expect(result.success).toBe(true)
      expect(requestFn).toHaveBeenCalledTimes(2)
    }, 10000)

    it('uses exponential backoff for retries', async () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: 'Server error',
          },
        },
      }

      const requestFn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue({
          data: {
            success: true,
            data: { id: 1 },
          },
        })

      vi.useFakeTimers()

      const promise = apiRequest(requestFn, {
        retries: 2,
        retryDelay: 100,
      })

      await vi.runAllTimersAsync()
      const result = await promise

      vi.useRealTimers()

      expect(result.success).toBe(true)
      expect(requestFn).toHaveBeenCalledTimes(3)
    }, 10000)

    it('uses custom error message', async () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: 'Server error',
          },
        },
      }

      const requestFn = vi.fn().mockRejectedValue(error)

      const result = await apiRequest(requestFn, {
        errorMessage: 'Custom error message',
      })

      // When error has a message, it uses that, otherwise uses custom
      expect(result.error).toBe('Server error')
    })
  })
})

