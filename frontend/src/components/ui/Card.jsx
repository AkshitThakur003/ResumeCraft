import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../utils'
import Tooltip from './Tooltip'
import { fadeIn, transitionMedium } from './motionVariants'

/**
 * Base Card component with optional gradient, glow, and hover effects
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Card content
 * @param {boolean} props.gradient - Enable gradient background
 * @param {boolean} props.glow - Enable glow effect on hover
 * @param {boolean} props.hover - Enable hover lift effect
 */
export const Card = React.forwardRef(({ className, children, gradient = false, glow = false, hover = false, ...props }, ref) => {
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
      className={cn(
        'rounded-2xl border transition-all duration-300',
        // Standard Backgrounds
        'bg-white dark:bg-neutral-900 text-card-foreground',
        // Gradient / Glass Effect - Keeping existing logic but ensuring it fits the theme
        gradient && 'bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-800',
        // Shadows & Borders
        'shadow-sm border-neutral-200 dark:border-neutral-700',
        // Glow Effect
        glow && 'hover:shadow-md hover:border-blue-300/50 dark:hover:border-blue-700/50',
        // Simple Hover Lift
        hover && 'hover:-translate-y-1 hover:shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
})
Card.displayName = 'Card'

export const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6 md:p-8', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-foreground',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground leading-relaxed', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 md:p-8 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

/**
 * Enhanced Stats Card component for displaying statistics
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Stat value to display
 * @param {string} props.change - Change indicator (e.g., "+5%")
 * @param {React.ComponentType} props.icon - Icon component
 * @param {string} props.trend - Trend direction (positive, negative, neutral)
 * @param {boolean} props.gradient - Enable gradient background
 * @param {string} props.tooltip - Tooltip text
 * @param {Function} props.onClick - Click handler
 */
/**
 * Memoized StatsCard component for performance
 * Prevents unnecessary re-renders when parent updates
 */
export const StatsCard = React.memo(({ 
  title, 
  value, 
  change, 
  icon: IconComponent, 
  trend = 'neutral', 
  gradient = true, 
  tooltip,
  className,
  contentClassName,
  footer,
  zeroMessage,
  zeroActionLabel = 'View',
  onZeroAction,
  onClick,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion()
  
  const trendColors = {
    positive: 'text-green-600 dark:text-green-400 bg-green-500/10',
    negative: 'text-destructive dark:text-destructive/80 bg-destructive/10',
    neutral: 'text-muted-foreground bg-muted/50',
  }

  const trendIcons = {
    positive: '↑',
    negative: '↓',
    neutral: '→',
  }

  const showZeroState = zeroMessage && (value === 0 || value === '0')

  const changeNode = change ? (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', trendColors[trend])}>
      <span aria-hidden="true">{trendIcons[trend]}</span>
      {change}
    </span>
  ) : null

  const zeroMessageNode = showZeroState ? (
    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-2 py-1.5">
      <span className="truncate">{zeroMessage}</span>
      {onZeroAction && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onZeroAction()
          }}
          className="shrink-0 font-semibold text-primary hover:underline"
        >
          {zeroActionLabel}
        </button>
      )}
    </div>
  ) : null

  const content = (
    <div className={cn('flex h-full flex-col justify-between gap-4', contentClassName)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <motion.div 
            className="text-3xl font-bold tracking-tight text-foreground"
            layout={!shouldReduceMotion}
          >
            {value}
          </motion.div>
        </div>
        {IconComponent && (
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary",
            "transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          )}>
            <IconComponent className="h-5 w-5" />
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-2 space-y-2">
        {changeNode}
        {zeroMessageNode}
        {footer}
      </div>
    </div>
  )

  const card = (
    <Card
      gradient={gradient}
      glow={!!onClick}
      hover={!!onClick}
      className={cn(
        'relative h-full group', 
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      <CardContent className="p-5 h-full">
        {content}
      </CardContent>
    </Card>
  )

  if (tooltip) {
    return (
      <Tooltip content={tooltip} position="top" wrapperClassName="block h-full">
        {card}
      </Tooltip>
    )
  }

  return card
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if props that affect display change
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.change === nextProps.change &&
    prevProps.trend === nextProps.trend &&
    prevProps.onClick === nextProps.onClick
  )
})

StatsCard.displayName = 'StatsCard'

// Enhanced Quick Action Card
export const QuickActionCard = ({ title, description, icon: IconComponent, onClick, disabled, gradient = true }) => {
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'w-full h-full text-left outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl',
        disabled && 'opacity-60 cursor-not-allowed'
      )}
    >
      <Card
        gradient={gradient}
        glow={!disabled}
        hover={!disabled}
        className="h-full min-h-[140px] group overflow-hidden relative"
      >
        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardContent className="p-6 flex flex-col h-full justify-between relative z-10">
          <div className="space-y-4">
            {IconComponent && (
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
                <IconComponent className="h-6 w-6" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors duration-300">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}
