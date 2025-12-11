/**
 * Design token color constants
 * Use these instead of hardcoded color values
 */

// Primary brand colors (use primary design token)
export const BRAND_COLORS = {
  primary: 'hsl(var(--primary))',
  primaryForeground: 'hsl(var(--primary-foreground))',
}

// Semantic colors (use design tokens)
export const SEMANTIC_COLORS = {
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
}

// Background colors (use design tokens)
export const BACKGROUND_COLORS = {
  default: 'bg-background',
  card: 'bg-card',
  muted: 'bg-muted',
  accent: 'bg-accent',
}

// Text colors (use design tokens)
export const TEXT_COLORS = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary-foreground',
}

// Border colors (use design tokens)
export const BORDER_COLORS = {
  default: 'border-border',
  input: 'border-input',
  ring: 'border-ring',
}

// Focus ring colors (use design tokens)
export const FOCUS_RING = {
  default: 'focus-visible:ring-ring',
  primary: 'focus-visible:ring-primary',
}

// Hardcoded colors that should be replaced (for reference)
export const DEPRECATED_COLORS = {
  // These should be replaced with design tokens
  blue500: '#3b82f6', // Use primary instead
  blue600: '#2563eb', // Use primary-600 instead
  focusBlue: '#4F8DFF', // Use ring color instead
  gradientStart: '#3E7BFF', // Use primary gradient
  gradientEnd: '#83BAFF', // Use primary-400 gradient
}

