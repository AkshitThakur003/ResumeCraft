import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ThemeProvider, useTheme, THEMES } from './ThemeContext'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock matchMedia
const matchMediaMock = vi.fn((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: matchMediaMock,
})

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null)
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ThemeProvider', () => {
    it('should provide default theme state', () => {
      const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      const { result } = renderHook(() => useTheme(), { wrapper })

      expect(result.current.theme).toBe(THEMES.SYSTEM)
      expect(result.current.resolvedTheme).toBeDefined()
      expect(result.current.systemTheme).toBeDefined()
    })

    it('should load saved theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(THEMES.DARK)
      
      const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      const { result } = renderHook(() => useTheme(), { wrapper })

      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme')
    })

    it('should detect system theme', () => {
      matchMediaMock.mockReturnValue({
        matches: true, // dark mode
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })

      const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      const { result } = renderHook(() => useTheme(), { wrapper })

      expect(matchMediaMock).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    })

    it('should set theme and save to localStorage', () => {
      const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      const { result } = renderHook(() => useTheme(), { wrapper })

      act(() => {
        result.current.setTheme(THEMES.DARK)
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', THEMES.DARK)
      expect(result.current.theme).toBe(THEMES.DARK)
    })

    it('should toggle between light and dark themes', () => {
      const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      const { result } = renderHook(() => useTheme(), { wrapper })

      // Set initial theme to light
      act(() => {
        result.current.setTheme(THEMES.LIGHT)
      })

      // Toggle to dark
      act(() => {
        result.current.toggleTheme()
      })

      expect(result.current.theme).toBe(THEMES.DARK)
    })

    it('should cycle through themes', () => {
      const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      const { result } = renderHook(() => useTheme(), { wrapper })

      // Start with system
      expect(result.current.theme).toBe(THEMES.SYSTEM)

      // Cycle to light
      act(() => {
        result.current.cycleTheme()
      })
      expect(result.current.theme).toBe(THEMES.LIGHT)

      // Cycle to dark
      act(() => {
        result.current.cycleTheme()
      })
      expect(result.current.theme).toBe(THEMES.DARK)

      // Cycle back to system
      act(() => {
        result.current.cycleTheme()
      })
      expect(result.current.theme).toBe(THEMES.SYSTEM)
    })

    it('should provide computed values', () => {
      const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      const { result } = renderHook(() => useTheme(), { wrapper })

      act(() => {
        result.current.setTheme(THEMES.DARK)
      })

      expect(typeof result.current.isDark).toBe('boolean')
      expect(typeof result.current.isLight).toBe('boolean')
      expect(typeof result.current.isSystem).toBe('boolean')
    })

    it('should provide theme utilities', () => {
      const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      const { result } = renderHook(() => useTheme(), { wrapper })

      expect(typeof result.current.getThemeIcon).toBe('function')
      expect(typeof result.current.getThemeLabel).toBe('function')
      
      act(() => {
        result.current.setTheme(THEMES.DARK)
        const icon = result.current.getThemeIcon()
        const label = result.current.getThemeLabel()
        
        expect(icon).toBeDefined()
        expect(label).toBe('Dark')
      })
    })

    it('should not set invalid theme', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      const { result } = renderHook(() => useTheme(), { wrapper })

      const initialTheme = result.current.theme

      act(() => {
        result.current.setTheme('invalid-theme')
      })

      expect(result.current.theme).toBe(initialTheme)
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should provide THEMES constant', () => {
      const wrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>
      const { result } = renderHook(() => useTheme(), { wrapper })

      expect(result.current.THEMES).toBeDefined()
      expect(result.current.THEMES.LIGHT).toBe(THEMES.LIGHT)
      expect(result.current.THEMES.DARK).toBe(THEMES.DARK)
      expect(result.current.THEMES.SYSTEM).toBe(THEMES.SYSTEM)
    })
  })

  describe('useTheme hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useTheme())
      }).toThrow('useTheme must be used within a ThemeProvider')

      consoleSpy.mockRestore()
    })
  })
})

