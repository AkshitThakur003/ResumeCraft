import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock tokenStorage
const mockTokenStorage = {
  getStoredAccessToken: vi.fn(),
  storeAccessToken: vi.fn(),
  clearStoredToken: vi.fn(),
  decodeTokenExpiry: vi.fn(),
  setRememberPreference: vi.fn(),
}

vi.mock('../tokenStorage', () => ({
  getStoredAccessToken: (...args) => mockTokenStorage.getStoredAccessToken(...args),
  storeAccessToken: (...args) => mockTokenStorage.storeAccessToken(...args),
  clearStoredToken: (...args) => mockTokenStorage.clearStoredToken(...args),
  decodeTokenExpiry: (...args) => mockTokenStorage.decodeTokenExpiry(...args),
  setRememberPreference: (...args) => mockTokenStorage.setRememberPreference(...args),
}))

// Import after mocking - use dynamic import in test
let tokenManagement

describe('api/tokenManagement', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    tokenManagement = await import('./tokenManagement')
  })

  describe('constants', () => {
    it('exports correct constants', () => {
      expect(tokenManagement.ACCESS_TOKEN_KEY).toBe('accessToken')
      expect(tokenManagement.ACCESS_TOKEN_EXP_KEY).toBe('accessTokenExpiresAt')
      expect(tokenManagement.REMEMBER_ME_KEY).toBe('rememberMe')
      expect(tokenManagement.TOKEN_REFRESHED_EVENT).toBe('tokenRefreshed')
    })
  })

  describe('getStoredAccessToken', () => {
    it('returns token string from full token object', () => {
      mockTokenStorage.getStoredAccessToken.mockReturnValue({
        token: 'test-token-123',
        expiresAt: 1234567890,
        rememberMe: true,
      })

      const result = tokenManagement.getStoredAccessToken()

      expect(result).toBe('test-token-123')
      expect(mockTokenStorage.getStoredAccessToken).toHaveBeenCalledOnce()
    })

    it('returns null when token is not found', () => {
      mockTokenStorage.getStoredAccessToken.mockReturnValue({
        token: null,
        expiresAt: null,
        rememberMe: false,
      })

      const result = tokenManagement.getStoredAccessToken()

      expect(result).toBeNull()
    })

    it('returns null when result is undefined', () => {
      mockTokenStorage.getStoredAccessToken.mockReturnValue(undefined)

      const result = tokenManagement.getStoredAccessToken()

      expect(result).toBeNull()
    })
  })

  describe('storeAccessToken', () => {
    it('delegates to tokenStorage.storeAccessToken', () => {
      const token = 'test-token'
      const expiresAt = 1234567890
      const remember = true

      tokenManagement.storeAccessToken(token, expiresAt, remember)

      expect(mockTokenStorage.storeAccessToken).toHaveBeenCalledWith(
        token,
        expiresAt,
        remember
      )
    })
  })

  describe('clearStoredAccessToken', () => {
    it('delegates to tokenStorage.clearStoredToken', () => {
      tokenManagement.clearStoredAccessToken()

      expect(mockTokenStorage.clearStoredToken).toHaveBeenCalledOnce()
    })
  })

  describe('decodeTokenExpiry', () => {
    it('delegates to tokenStorage.decodeTokenExpiry', () => {
      const token = 'test.token.here'
      const expectedExpiry = 1234567890000

      mockTokenStorage.decodeTokenExpiry.mockReturnValue(expectedExpiry)

      const result = tokenManagement.decodeTokenExpiry(token)

      expect(result).toBe(expectedExpiry)
      expect(mockTokenStorage.decodeTokenExpiry).toHaveBeenCalledWith(token)
    })
  })

  describe('setRememberPreference', () => {
    it('delegates to tokenStorage.setRememberPreference', () => {
      tokenManagement.setRememberPreference(true)

      expect(mockTokenStorage.setRememberPreference).toHaveBeenCalledWith(true)
    })
  })
})

