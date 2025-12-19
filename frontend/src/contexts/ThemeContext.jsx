import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react'

// Theme types
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
}

// Initial state
const initialState = {
  theme: THEMES.SYSTEM,
  resolvedTheme: THEMES.LIGHT, // The actual theme being used
  systemTheme: THEMES.LIGHT,
}

// Action types
const THEME_ACTIONS = {
  SET_THEME: 'SET_THEME',
  SET_RESOLVED_THEME: 'SET_RESOLVED_THEME',
  SET_SYSTEM_THEME: 'SET_SYSTEM_THEME',
}

// Reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case THEME_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload,
      }
    
    case THEME_ACTIONS.SET_RESOLVED_THEME:
      return {
        ...state,
        resolvedTheme: action.payload,
      }
    
    case THEME_ACTIONS.SET_SYSTEM_THEME:
      return {
        ...state,
        systemTheme: action.payload,
      }
    
    default:
      return state
  }
}

// Create context
const ThemeContext = createContext()

// ThemeProvider component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState)
  const isInitialized = useRef(false)
  const isApplyingTheme = useRef(false)
  const stateRef = useRef(state)
  
  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Get system theme preference
  const getSystemTheme = () => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? THEMES.DARK
        : THEMES.LIGHT
    }
    return THEMES.LIGHT
  }

  // Calculate resolved theme
  const getResolvedTheme = (theme, systemTheme) => {
    if (theme === THEMES.SYSTEM) {
      return systemTheme
    }
    return theme
  }

  // Apply theme to document with smooth transition
  const applyTheme = useCallback((theme) => {
    if (typeof document === 'undefined' || isApplyingTheme.current) return
    
    isApplyingTheme.current = true
    const root = document.documentElement
    
    // Batch all DOM reads first
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    
    // Add transition class BEFORE making changes
    root.classList.add('theme-transition')
    
    // Use immediate synchronous update for instant response
    // Then let CSS handle the smooth transition
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    root.style.colorScheme = theme
    
    // Update meta theme-color synchronously
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        theme === THEMES.DARK ? '#1f2937' : '#ffffff'
      )
    }
    
    // Remove transition class after transition completes
    setTimeout(() => {
      root.classList.remove('theme-transition')
      isApplyingTheme.current = false
    }, 100) // Ultra-fast 100ms transition
  }, [])

  // Initialize theme on mount
  useEffect(() => {
    if (isInitialized.current) return
    
    // Check if theme was already set by blocking script
    const root = document.documentElement
    const alreadySet = root.classList.contains('light') || root.classList.contains('dark')
    
    // Get saved theme or default to system
    const savedTheme = localStorage.getItem('theme') || THEMES.SYSTEM
    const systemTheme = getSystemTheme()
    const resolvedTheme = getResolvedTheme(savedTheme, systemTheme)

    dispatch({ type: THEME_ACTIONS.SET_THEME, payload: savedTheme })
    dispatch({ type: THEME_ACTIONS.SET_SYSTEM_THEME, payload: systemTheme })
    dispatch({ type: THEME_ACTIONS.SET_RESOLVED_THEME, payload: resolvedTheme })

    // Only apply if not already set by blocking script
    if (!alreadySet) {
      applyTheme(resolvedTheme)
    }
    
    isInitialized.current = true
  }, [applyTheme])

  // Single effect to handle both theme and system theme changes
  useEffect(() => {
    if (!isInitialized.current) return

    const newResolvedTheme = getResolvedTheme(state.theme, state.systemTheme)
    
    // Only update if resolved theme actually changed
    if (newResolvedTheme !== state.resolvedTheme) {
      dispatch({ type: THEME_ACTIONS.SET_RESOLVED_THEME, payload: newResolvedTheme })
      applyTheme(newResolvedTheme)
    }
  }, [state.theme, state.systemTheme, applyTheme])

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized.current) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      const newSystemTheme = e.matches ? THEMES.DARK : THEMES.LIGHT
      dispatch({ type: THEME_ACTIONS.SET_SYSTEM_THEME, payload: newSystemTheme })
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Set theme
  const setTheme = useCallback((newTheme) => {
    if (!Object.values(THEMES).includes(newTheme)) {
      console.warn(`Invalid theme: ${newTheme}`)
      return
    }

    dispatch({ type: THEME_ACTIONS.SET_THEME, payload: newTheme })
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme)
  }, [])

  // Toggle between light and dark (skipping system)
  const toggleTheme = useCallback(() => {
    // Use ref to get latest resolved theme (avoids stale closure)
    const currentResolved = stateRef.current.resolvedTheme
    const newTheme = currentResolved === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK
    setTheme(newTheme)
  }, [setTheme])


  // Cycle through all themes
  const cycleTheme = () => {
    const themes = [THEMES.LIGHT, THEMES.DARK, THEMES.SYSTEM]
    const currentIndex = themes.indexOf(state.theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  // Theme utilities
  const isDark = state.resolvedTheme === THEMES.DARK
  const isLight = state.resolvedTheme === THEMES.LIGHT
  const isSystem = state.theme === THEMES.SYSTEM

  // Get theme icon
  const getThemeIcon = () => {
    switch (state.theme) {
      case THEMES.LIGHT:
        return '☀️'
      case THEMES.DARK:
        return '🌙'
      case THEMES.SYSTEM:
        return '💻'
      default:
        return '☀️'
    }
  }

  // Get theme label
  const getThemeLabel = () => {
    switch (state.theme) {
      case THEMES.LIGHT:
        return 'Light'
      case THEMES.DARK:
        return 'Dark'
      case THEMES.SYSTEM:
        return 'System'
      default:
        return 'Light'
    }
  }

  // Context value
  const value = {
    // State
    theme: state.theme,
    resolvedTheme: state.resolvedTheme,
    systemTheme: state.systemTheme,
    
    // Computed
    isDark,
    isLight,
    isSystem,
    
    // Actions
    setTheme,
    toggleTheme,
    cycleTheme,
    
    // Utilities
    getThemeIcon,
    getThemeLabel,
    
    // Constants
    THEMES,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Hook for theme-aware styling
export const useThemeStyles = () => {
  const { isDark, isLight, resolvedTheme } = useTheme()
  
  return {
    isDark,
    isLight,
    resolvedTheme,
    
    // Common theme-aware classes using CSS variables
    bg: 'bg-background',
    text: 'text-foreground',
    border: 'border-border',
    card: 'bg-card text-card-foreground',
    input: 'bg-background border-input',
    button: {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    },
    
    // CSS custom properties for dynamic theming (using HSL variables)
    cssVars: {
      '--color-bg-primary': isDark ? 'hsl(222.2, 84%, 4.9%)' : 'hsl(0, 0%, 100%)',
      '--color-bg-secondary': isDark ? 'hsl(217.2, 32.6%, 17.5%)' : 'hsl(210, 40%, 96%)',
      '--color-text-primary': isDark ? 'hsl(210, 40%, 98%)' : 'hsl(222.2, 84%, 4.9%)',
      '--color-text-secondary': isDark ? 'hsl(215, 20.2%, 65.1%)' : 'hsl(215.4, 16.3%, 46.9%)',
      '--color-border': isDark ? 'hsl(217.2, 32.6%, 17.5%)' : 'hsl(214.3, 31.8%, 91.4%)',
    },
  }
}

// Higher-order component for theme-aware components
export const withTheme = (Component) => {
  return function ThemedComponent(props) {
    const themeProps = useTheme()
    return <Component {...props} theme={themeProps} />
  }
}

// Hook for media query theme detection
export const useMediaTheme = () => {
  const [systemTheme, setSystemTheme] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? THEMES.DARK
        : THEMES.LIGHT
    }
    return THEMES.LIGHT
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      setSystemTheme(e.matches ? THEMES.DARK : THEMES.LIGHT)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return systemTheme
}

export { THEMES }
export default ThemeContext
