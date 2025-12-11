import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

// Mock dependencies
vi.mock('../hooks/useAuthReducer', () => ({
  useAuthReducer: () => [
    {
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      rememberMe: false,
      sessionExpiresAt: null,
    },
    vi.fn(), // dispatch
  ],
}))

vi.mock('../hooks/useAuthActions', () => ({
  useAuthActions: () => ({
    checkAuth: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    updateProfile: vi.fn(),
  }),
}))

vi.mock('../hooks/useSessionManagement', () => ({
  useSessionManagement: vi.fn(),
}))

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AuthProvider', () => {
    it('should provide auth context', () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current).toBeDefined()
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.loading).toBe(false)
    })

    it('should provide auth state properties', () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.user).toBeDefined()
      expect(result.current.isAuthenticated).toBeDefined()
      expect(result.current.loading).toBeDefined()
      expect(result.current.error).toBeDefined()
      expect(result.current.rememberMe).toBeDefined()
      expect(result.current.sessionExpiresAt).toBeDefined()
    })

    it('should provide auth actions', () => {
      const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(typeof result.current.checkAuth).toBe('function')
      expect(typeof result.current.login).toBe('function')
      expect(typeof result.current.logout).toBe('function')
      expect(typeof result.current.register).toBe('function')
      expect(typeof result.current.updateProfile).toBe('function')
    })
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })
  })
})

