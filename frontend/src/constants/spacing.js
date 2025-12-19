/**
 * Spacing scale constants
 * Based on 4px (0.25rem) base unit for consistent spacing
 */

export const SPACING = {
  // Padding
  padding: {
    xs: 'p-2',      // 8px
    sm: 'p-4',      // 16px
    md: 'p-6',      // 24px
    lg: 'p-8',      // 32px
    xl: 'p-12',     // 48px
    '2xl': 'p-16',  // 64px
  },
  // Padding X (horizontal)
  paddingX: {
    xs: 'px-2',
    sm: 'px-4',
    md: 'px-6',
    lg: 'px-8',
    xl: 'px-12',
    '2xl': 'px-16',
  },
  // Padding Y (vertical)
  paddingY: {
    xs: 'py-2',
    sm: 'py-4',
    md: 'py-6',
    lg: 'py-8',
    xl: 'py-12',
    '2xl': 'py-16',
  },
  // Margin
  margin: {
    xs: 'm-2',
    sm: 'm-4',
    md: 'm-6',
    lg: 'm-8',
    xl: 'm-12',
    '2xl': 'm-16',
  },
  // Gap
  gap: {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
    xl: 'gap-12',
    '2xl': 'gap-16',
  },
  // Space between (for flex/grid children)
  space: {
    xs: 'space-y-2 space-x-2',
    sm: 'space-y-4 space-x-4',
    md: 'space-y-6 space-x-6',
    lg: 'space-y-8 space-x-8',
    xl: 'space-y-12 space-x-12',
  },
}

/**
 * Component-specific spacing presets
 */
export const COMPONENT_SPACING = {
  // Container padding
  container: 'px-4 sm:px-6 lg:px-8',
  containerSm: 'px-4 sm:px-6',
  containerLg: 'px-6 sm:px-8 lg:px-12',
  
  // Section padding
  section: 'py-6 sm:py-8 lg:py-12',
  sectionSm: 'py-4 sm:py-6',
  sectionLg: 'py-12 sm:py-16 lg:py-20',
  
  // Card padding
  card: 'p-4 sm:p-6',
  cardSm: 'p-3 sm:p-4',
  cardLg: 'p-6 sm:p-8',
  
  // Button padding
  button: 'px-4 sm:px-5 py-2.5',
  buttonSm: 'px-3 sm:px-4 py-2',
  buttonLg: 'px-6 sm:px-8 py-3',
  
  // Input padding
  input: 'px-3 py-2',
  inputSm: 'px-2 py-1.5',
  inputLg: 'px-4 py-3',
  
  // Header/Footer
  header: 'px-4 sm:px-6 py-3',
  footer: 'px-4 sm:px-6 py-6',
}

