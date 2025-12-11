import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils'
import * as AvatarPrimitive from '@radix-ui/react-avatar'

/**
 * Avatar component for displaying user profile pictures or initials
 * @param {Object} props - Component props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for the image
 * @param {string} props.fallback - Fallback text (usually initials)
 * @param {string} props.size - Avatar size (sm, default, lg, xl)
 * @param {string} props.className - Additional CSS classes
 */
export const Avatar = React.forwardRef(
  ({ className, src, alt, fallback, size = 'default', ...props }, ref) => {
    const sizes = {
      sm: 'h-8 w-8 text-xs',
      default: 'h-10 w-10 text-sm',
      lg: 'h-12 w-12 text-base',
      xl: 'h-16 w-16 text-lg',
    }

    return (
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full bg-muted',
          sizes[size],
          className
        )}
        {...props}
      >
        <AvatarPrimitive.Image
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
        <AvatarPrimitive.Fallback
          className={cn(
            'flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-semibold',
            sizes[size]
          )}
        >
          {fallback || '?'}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
    )
  }
)

Avatar.displayName = 'Avatar'

/**
 * Avatar group component for displaying multiple avatars
 */
export const AvatarGroup = ({ children, max = 3, className, ...props }) => {
  const avatars = React.Children.toArray(children)
  const visible = avatars.slice(0, max)
  const remaining = avatars.length - max

  return (
    <div className={cn('flex -space-x-2', className)} {...props}>
      {visible.map((avatar, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="ring-2 ring-background"
        >
          {avatar}
        </motion.div>
      ))}
      {remaining > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: visible.length * 0.1 }}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-semibold ring-2 ring-background'
          )}
        >
          +{remaining}
        </motion.div>
      )}
    </div>
  )
}

AvatarGroup.displayName = 'AvatarGroup'

