import React from 'react'
import { motion } from 'framer-motion'
import { Button } from './Button'
import { Card, CardContent } from './Card'
import { cn } from '../../utils'

export const EmptyState = ({
  icon = '📋',
  title,
  description,
  action,
  actionLabel,
  secondaryAction,
  secondaryActionLabel,
  className,
  variant = 'default' // default, minimal, card
}) => {
  const variants = {
    default: 'border-dashed border-2',
    minimal: '',
    card: 'border shadow-sm'
  }

  const content = (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center',
        variants[variant],
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="mb-4 flex items-center justify-center"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        {typeof icon === 'string' ? (
          <span className="text-6xl sm:text-7xl" aria-hidden="true">{icon}</span>
        ) : React.isValidElement(icon) ? (
          <div className="flex items-center justify-center">
            {icon}
          </div>
        ) : icon && typeof icon === 'function' ? (
          <div className="w-16 h-16 text-slate-400 dark:text-slate-600 mb-4">
            {React.createElement(icon, { className: "w-full h-full" })}
          </div>
        ) : null}
      </motion.div>
      
      {title && (
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-muted-foreground max-w-md mb-6 text-sm sm:text-base">
          {description}
        </p>
      )}

      {action && (
        <div className="flex flex-col sm:flex-row gap-3">
          {React.isValidElement(action) ? action : (
            <Button onClick={action} size="lg">
              {actionLabel || 'Get Started'}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction} variant="outline" size="lg">
              {secondaryActionLabel || 'Learn More'}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  )

  if (variant === 'card') {
    return (
      <Card className="border-dashed">
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    )
  }

  return content
}

export default EmptyState

