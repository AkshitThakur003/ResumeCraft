import React from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import { Button } from '../ui'
import { useTheme } from '../../contexts/ThemeContext'
import { useReducedMotion } from 'framer-motion'

export const ThemeToggle = () => {
  const { toggleTheme, getThemeLabel, isDark } = useTheme()
  const shouldReduceMotion = useReducedMotion()

  const getInteractiveMotion = (hoverScale = 1.05, tapScale = 0.95) => {
    if (shouldReduceMotion) return {}
    const props = { whileHover: { scale: hoverScale } }
    if (typeof tapScale === 'number') {
      props.whileTap = { scale: tapScale }
    }
    return props
  }

  return (
    <motion.div
      {...getInteractiveMotion(1.05, 0.95)}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        title={`Switch to ${getThemeLabel()} theme`}
        aria-label={`Switch to ${getThemeLabel()} theme`}
        className="h-10 w-10 rounded-xl bg-background/50 backdrop-blur-sm hover:bg-primary/10 border border-border/50 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <motion.div
          initial={false}
          animate={{ 
            rotate: isDark ? 180 : 0,
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: shouldReduceMotion ? 0 : 0.5,
            scale: { duration: 0.3 }
          }}
          className="relative w-5 h-5"
        >
          {isDark ? (
            <Moon className="w-5 h-5 text-slate-700 dark:text-slate-300" fill="currentColor" />
          ) : (
            <Sun className="w-5 h-5 text-amber-500" fill="currentColor" />
          )}
        </motion.div>
      </Button>
    </motion.div>
  )
}

