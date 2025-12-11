import React from 'react'
import { motion } from 'framer-motion'
import { Button } from './Button'
import { Card, CardContent } from './Card'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '../../utils'

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this content.',
  onRetry,
  retryLabel = 'Try Again',
  className,
  variant = 'default' // default, card, minimal
}) => {
  const variants = {
    default: 'border-dashed border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20',
    card: 'border shadow-sm border-red-200 dark:border-red-800',
    minimal: ''
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
      role="alert"
      aria-live="assertive"
    >
      <motion.div
        className="mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring' }}
      >
        <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" aria-hidden="true" />
      </motion.div>
      
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      
      <p className="text-muted-foreground max-w-md mb-6 text-sm sm:text-base">
        {message}
      </p>

      {onRetry && (
        <Button 
          onClick={onRetry} 
          variant="outline"
          size="lg"
          className="gap-2"
          aria-label={retryLabel}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          {retryLabel}
        </Button>
      )}
    </motion.div>
  )

  if (variant === 'card') {
    return (
      <Card className="border-dashed border-red-200 dark:border-red-800">
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    )
  }

  return content
}

export default ErrorState

