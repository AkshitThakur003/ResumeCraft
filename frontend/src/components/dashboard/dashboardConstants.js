/**
 * Chart color constants
 * Note: These are used for chart libraries that require hex colors
 * For UI components, use design tokens (primary, secondary, etc.)
 */
export const CHART_COLORS = {
  // Use brand-500 for primary (matches design system)
  primary: '#3b82f6', // brand-500
  secondary: '#8b5cf6', // purple-500
  success: '#10b981', // green-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  info: '#06b6d4' // cyan-500
}

export const PIE_COLORS = [
  CHART_COLORS.primary, 
  CHART_COLORS.secondary, 
  CHART_COLORS.success, 
  CHART_COLORS.warning, 
  CHART_COLORS.danger
]

