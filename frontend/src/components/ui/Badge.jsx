import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils'

/**
 * Badge component for displaying labels, tags, or status indicators
 * @param {Object} props - Component props
 * @param {string} props.variant - Badge variant (default, primary, secondary, success, warning, destructive, outline)
 * @param {string} props.size - Badge size (sm, default, lg)
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.className - Additional CSS classes
 */
export const Badge = React.forwardRef(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-secondary text-secondary-foreground',
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      success: 'bg-green-600 text-white dark:bg-green-500',
      warning: 'bg-yellow-600 text-white dark:bg-yellow-500',
      destructive: 'bg-destructive text-destructive-foreground',
      outline: 'border border-input bg-background text-foreground',
    }

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      default: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium transition-colors',
          variants[variant],
          sizes[size],
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.1 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Badge.displayName = 'Badge'

