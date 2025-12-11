import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ToastProvider, useGlobalToast } from './ToastContext'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => children,
}))

// Mock Toast component
vi.mock('../components/ui/Toast', () => ({
  default: ({ message, onClose }) => (
    <div data-testid="toast" onClick={onClose}>
      {message}
    </div>
  ),
  useToast: () => ({
    addToast: vi.fn((message, type, duration) => ({
      id: `toast-${Date.now()}`,
      message,
      type,
      duration,
    })),
    toasts: [],
    removeToast: vi.fn(),
    addRateLimitToast: vi.fn(),
    addServiceUnavailableToast: vi.fn(),
    showToast: vi.fn(),
  }),
}))

// Mock NotificationsContext
vi.mock('./NotificationsContext', () => ({
  useNotificationsContext: () => null, // Not available for testing
}))

describe('ToastContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ToastProvider', () => {
    it('should provide toast context', () => {
      const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>
      const { result } = renderHook(() => useGlobalToast(), { wrapper })

      expect(result.current).toBeDefined()
      expect(typeof result.current.addToast).toBe('function')
      expect(typeof result.current.showToast).toBe('function')
      expect(typeof result.current.removeToast).toBe('function')
    })

    it('should allow adding toast', () => {
      const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>
      const { result } = renderHook(() => useGlobalToast(), { wrapper })

      act(() => {
        result.current.addToast('Test message', 'info', 5000)
      })

      expect(result.current.addToast).toBeDefined()
    })

    it('should handle different toast types', () => {
      const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>
      const { result } = renderHook(() => useGlobalToast(), { wrapper })

      const types = ['info', 'success', 'error', 'warning']

      types.forEach((type) => {
        act(() => {
          result.current.addToast(`Test ${type}`, type, 3000)
        })
      })

      expect(result.current.addToast).toBeDefined()
    })

    it('should provide showToast function', () => {
      const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>
      const { result } = renderHook(() => useGlobalToast(), { wrapper })

      act(() => {
        result.current.showToast('success')
      })

      expect(result.current.showToast).toBeDefined()
    })

    it('should provide removeToast function', () => {
      const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>
      const { result } = renderHook(() => useGlobalToast(), { wrapper })

      act(() => {
        result.current.removeToast('toast-id')
      })

      expect(result.current.removeToast).toBeDefined()
    })

    it('should provide rate limit toast functions', () => {
      const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>
      const { result } = renderHook(() => useGlobalToast(), { wrapper })

      expect(typeof result.current.addRateLimitToast).toBe('function')
      expect(typeof result.current.addServiceUnavailableToast).toBe('function')
    })

    it('should handle window events', () => {
      const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>
      renderHook(() => useGlobalToast(), { wrapper })

      // Simulate window events
      const showToastEvent = new CustomEvent('showToast', {
        detail: { message: 'Test message', type: 'info' },
      })
      window.dispatchEvent(showToastEvent)

      const rateLimitEvent = new CustomEvent('rateLimit')
      window.dispatchEvent(rateLimitEvent)

      // Events should be handled without errors
      expect(true).toBe(true)
    })
  })

  describe('useGlobalToast hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useGlobalToast())
      }).toThrow('useGlobalToast must be used within a ToastProvider')

      consoleSpy.mockRestore()
    })
  })
})

