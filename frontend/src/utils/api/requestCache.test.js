import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getRequestKey,
  dedupeRequest,
  invalidateCache,
  clearCache,
} from './requestCache'

describe('requestCache', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache()
    vi.useFakeTimers()
  })


  describe('getRequestKey', () => {
    it('generates unique key for GET request with URL', () => {
      const key = getRequestKey('GET', '/api/users')
      expect(key).toBe('GET:/api/users::')
    })

    it('generates unique key with params', () => {
      const key = getRequestKey('GET', '/api/users', { page: 1, limit: 10 })
      expect(key).toBe('GET:/api/users:{"page":1,"limit":10}:')
    })

    it('generates unique key with data', () => {
      const key = getRequestKey('POST', '/api/users', null, { name: 'John' })
      expect(key).toBe('POST:/api/users::{"name":"John"}')
    })

    it('generates unique key with params and data', () => {
      const key = getRequestKey('PUT', '/api/users/1', { id: 1 }, { name: 'John' })
      expect(key).toContain('PUT:/api/users/1')
      expect(key).toContain('{"id":1}')
      expect(key).toContain('{"name":"John"}')
    })

    it('uppercases method', () => {
      const key = getRequestKey('get', '/api/users')
      expect(key).toBe('GET:/api/users::')
    })
  })

  describe('dedupeRequest', () => {
    it('returns cached response for GET requests', async () => {
      const requestFn = vi.fn().mockResolvedValue({ data: 'cached' })
      
      // First call - should make request
      const promise1 = dedupeRequest(requestFn, 'GET', '/api/users')
      await promise1
      
      // Second call - should return cached
      const promise2 = dedupeRequest(requestFn, 'GET', '/api/users')
      const result2 = await promise2
      
      expect(requestFn).toHaveBeenCalledTimes(1)
      expect(result2).toEqual({ data: 'cached' })
    })

    it('prevents duplicate concurrent requests', async () => {
      let resolveRequest
      const requestFn = vi.fn(() => {
        return new Promise((resolve) => {
          resolveRequest = () => resolve({ data: 'result' })
        })
      })
      
      const promise1 = dedupeRequest(requestFn, 'GET', '/api/users')
      const promise2 = dedupeRequest(requestFn, 'GET', '/api/users')
      
      resolveRequest()
      
      const result1 = await promise1
      const result2 = await promise2
      
      expect(requestFn).toHaveBeenCalledTimes(1)
      expect(result1).toEqual({ data: 'result' })
      expect(result2).toEqual({ data: 'result' })
    })

    it('does not cache non-GET requests', async () => {
      const requestFn = vi.fn().mockResolvedValue({ data: 'result' })
      
      await dedupeRequest(requestFn, 'POST', '/api/users', { data: { name: 'John' } })
      await dedupeRequest(requestFn, 'POST', '/api/users', { data: { name: 'John' } })
      
      expect(requestFn).toHaveBeenCalledTimes(2)
    })

    it('respects skipCache option', async () => {
      const requestFn = vi.fn().mockResolvedValue({ data: 'result' })
      
      await dedupeRequest(requestFn, 'GET', '/api/users')
      await dedupeRequest(requestFn, 'GET', '/api/users', { skipCache: true })
      
      expect(requestFn).toHaveBeenCalledTimes(2)
    })

    it('removes expired cache entries', async () => {
      const requestFn = vi.fn().mockResolvedValue({ data: 'result' })
      
      // First call
      await dedupeRequest(requestFn, 'GET', '/api/users')
      
      // Fast-forward time past cache TTL (30 seconds)
      vi.advanceTimersByTime(31000)
      
      // Second call should make new request
      await dedupeRequest(requestFn, 'GET', '/api/users')
      
      expect(requestFn).toHaveBeenCalledTimes(2)
    })

    it('removes pending request on error', async () => {
      const requestFn = vi.fn().mockRejectedValue(new Error('Request failed'))
      
      try {
        await dedupeRequest(requestFn, 'GET', '/api/users')
      } catch (error) {
        expect(error.message).toBe('Request failed')
      }
      
      // Should be able to make new request after error
      requestFn.mockResolvedValue({ data: 'success' })
      const result = await dedupeRequest(requestFn, 'GET', '/api/users')
      
      expect(result).toEqual({ data: 'success' })
    })
  })

  describe('invalidateCache', () => {
    it('removes cached entries matching pattern', async () => {
      const requestFn1 = vi.fn().mockResolvedValue({ data: 'users' })
      const requestFn2 = vi.fn().mockResolvedValue({ data: 'posts' })
      
      await dedupeRequest(requestFn1, 'GET', '/api/users')
      await dedupeRequest(requestFn2, 'GET', '/api/posts')
      
      invalidateCache('/api/users')
      
      // Should make new request after invalidation
      await dedupeRequest(requestFn1, 'GET', '/api/users')
      
      expect(requestFn1).toHaveBeenCalledTimes(2)
      expect(requestFn2).toHaveBeenCalledTimes(1)
    })

    it('does not remove non-matching entries', async () => {
      const requestFn = vi.fn().mockResolvedValue({ data: 'result' })
      
      await dedupeRequest(requestFn, 'GET', '/api/users')
      
      invalidateCache('/api/posts')
      
      // Should return cached
      await dedupeRequest(requestFn, 'GET', '/api/users')
      
      expect(requestFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('clearCache', () => {
    it('clears all cached responses', async () => {
      const requestFn = vi.fn().mockResolvedValue({ data: 'result' })
      
      await dedupeRequest(requestFn, 'GET', '/api/users')
      await dedupeRequest(requestFn, 'GET', '/api/posts')
      
      clearCache()
      
      // Should make new requests after clear
      await dedupeRequest(requestFn, 'GET', '/api/users')
      await dedupeRequest(requestFn, 'GET', '/api/posts')
      
      expect(requestFn).toHaveBeenCalledTimes(4)
    })

    it('clears pending requests', async () => {
      const requestFn = vi.fn()
        .mockResolvedValueOnce({ data: 'result' })
        .mockResolvedValueOnce({ data: 'new' })
      
      // First request
      await dedupeRequest(requestFn, 'GET', '/api/users')
      
      clearCache()
      
      // Should be able to make new request (not cached)
      const result = await dedupeRequest(requestFn, 'GET', '/api/users')
      
      expect(result).toEqual({ data: 'new' })
      expect(requestFn).toHaveBeenCalledTimes(2)
    })
  })
})

