import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../utils'

/**
 * Button component with multiple variants and sizes
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant (default, destructive, success, warning, outline, secondary, ghost, link, brand)
 * @param {string} props.size - Button size (default, sm, lg, icon)
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional CSS classes
 */
export const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'default', disabled, children, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion()
    
    // Base styles - consistent typography and structure with touch-friendly defaults
    const baseStyles = 'inline-flex items-center justify-center rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background relative overflow-hidden group select-none touch-action-manipulation active:scale-[0.98]'
    
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md hover:shadow-primary/20',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md',
      success: 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 shadow-sm hover:shadow-md hover:shadow-green-500/20',
      warning: 'bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 shadow-sm hover:shadow-md hover:shadow-yellow-500/20',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'underline-offset-4 hover:underline text-primary',
      brand: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-brand-500/20',
    }
    
    // Mobile-friendly sizes with minimum tap targets (44px)
    const sizes = {
      default: 'h-11 sm:h-10 px-4 sm:px-5 py-2.5 min-h-[44px]',
      sm: 'h-11 sm:h-9 px-3 sm:px-4 text-xs min-h-[44px] sm:min-h-[36px]',
      lg: 'h-12 sm:h-12 px-6 sm:px-8 text-sm sm:text-base min-h-[44px]',
      icon: 'h-11 w-11 sm:h-10 sm:w-10 min-h-[44px] min-w-[44px]',
    }

    const MotionButton = motion.button

    return (
      <MotionButton
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled}
        whileHover={disabled || shouldReduceMotion ? {} : { scale: 1.01 }}
        whileTap={disabled || shouldReduceMotion ? {} : { scale: 0.98 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.1 }}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </MotionButton>
    )
  }
)

Button.displayName = 'Button'
