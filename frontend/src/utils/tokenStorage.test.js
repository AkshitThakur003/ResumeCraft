import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {}
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Import after mocking
const {
  storeAccessToken,
  getStoredAccessToken,
  setRememberPreference,
  clearStoredToken,
  decodeTokenExpiry,
} = await import('./tokenStorage')

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorageMock.clear()
    sessionStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('storeAccessToken', () => {
    it('stores access token in localStorage when remember is true', () => {
      const token = 'test-token'
      const expiresAt = new Date('2025-12-31').getTime()

      storeAccessToken(token, expiresAt, true)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'accessToken',
        token
      )
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'accessTokenExpiresAt',
        expiresAt.toString()
      )
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'rememberMe',
        'true'
      )
    })

    it('stores token in sessionStorage when remember is false', () => {
      const token = 'test-token'
      const expiresAt = new Date('2025-12-31').getTime()

      storeAccessToken(token, expiresAt, false)

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'accessToken',
        token
      )
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'accessTokenExpiresAt',
        expiresAt.toString()
      )
    })
  })

  describe('getStoredAccessToken', () => {
    it('returns token info from localStorage when available', () => {
      const token = 'test-token'
      const expiresAt = '1234567890'
      localStorageMock.getItem
        .mockReturnValueOnce('true') // rememberMe
        .mockReturnValueOnce(token) // accessToken
        .mockReturnValueOnce(expiresAt) // expiresAt

      const result = getStoredAccessToken()

      expect(result.token).toBe(token)
      expect(result.expiresAt).toBe(parseInt(expiresAt, 10))
      expect(result.rememberMe).toBe(true)
    })

    it('returns token info from sessionStorage when localStorage is empty', () => {
      const token = 'session-token'
      localStorageMock.getItem
        .mockReturnValueOnce('false') // rememberMe
        .mockReturnValueOnce(null) // accessToken from localStorage
        .mockReturnValueOnce(null) // expiresAt from localStorage
      sessionStorage.getItem
        .mockReturnValueOnce(token) // accessToken from sessionStorage
        .mockReturnValueOnce('1234567890') // expiresAt from sessionStorage

      const result = getStoredAccessToken()

      expect(result.token).toBe(token)
      expect(result.rememberMe).toBe(false)
    })

    it('returns null token when no token is stored', () => {
      // Clear the store and reset mocks
      localStorageMock.clear()
      sessionStorageMock.clear()
      
      // Use mockImplementation to return specific values based on key
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'rememberMe') return null // null means default to true
        if (key === 'accessToken') return null
        if (key === 'accessTokenExpiresAt') return null
        return null
      })
      
      sessionStorageMock.getItem.mockImplementation(() => null)

      const result = getStoredAccessToken()

      expect(result.token).toBeNull()
      expect(result.expiresAt).toBeNull()
      expect(result.rememberMe).toBe(true) // null defaults to true
    })
  })

  describe('setRememberPreference', () => {
    it('stores remember me preference as true', () => {
      setRememberPreference(true)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'rememberMe',
        'true'
      )
    })

    it('stores remember me preference as false', () => {
      setRememberPreference(false)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'rememberMe',
        'false'
      )
    })
  })

  describe('clearStoredToken', () => {
    it('removes all token-related items from localStorage and sessionStorage', () => {
      clearStoredToken()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'accessTokenExpiresAt'
      )
      expect(sessionStorage.removeItem).toHaveBeenCalledWith('accessToken')
      expect(sessionStorage.removeItem).toHaveBeenCalledWith(
        'accessTokenExpiresAt'
      )
    })
  })

  describe('decodeTokenExpiry', () => {
    it('decodes JWT token and returns expiration timestamp', () => {
      // Create a mock JWT token with exp: 1234567890
      const payload = { exp: 1234567890 }
      const encodedPayload = btoa(JSON.stringify(payload))
      const token = `header.${encodedPayload}.signature`

      const result = decodeTokenExpiry(token)

      expect(result).toBe(1234567890 * 1000) // Converted to milliseconds
    })

    it('returns null for invalid token', () => {
      const result = decodeTokenExpiry('invalid-token')

      expect(result).toBeNull()
    })

    it('returns null for empty token', () => {
      const result = decodeTokenExpiry('')

      expect(result).toBeNull()
    })

    it('returns null for null token', () => {
      const result = decodeTokenExpiry(null)

      expect(result).toBeNull()
    })
  })
})

