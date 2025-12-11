import { Variants, Transition } from 'framer-motion'

/**
 * Motion helper utilities shared across UI components.
 * These variants keep animations consistent and respect reduced–motion preferences.
 */

const easePremium: Transition['ease'] = [0.4, 0, 0.2, 1]

// Standard Transitions
export const transitionFast: Transition = {
  duration: 0.2,
  ease: easePremium,
}

export const transitionMedium: Transition = {
  duration: 0.4,
  ease: easePremium,
}

export const transitionSlow: Transition = {
  duration: 0.6,
  ease: easePremium,
}

// Standard Variants

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: transitionMedium
  },
  exit: { 
    opacity: 0,
    transition: transitionFast
  },
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: transitionMedium
  },
  exit: { 
    opacity: 0, 
    y: 20,
    transition: transitionFast
  },
}

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: transitionMedium
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: transitionFast
  },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: transitionMedium
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: transitionFast
  },
}

export const slideInRight: Variants = {
  initial: { x: 20, opacity: 0 },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: transitionMedium
  },
  exit: { 
    x: 20, 
    opacity: 0,
    transition: transitionFast
  },
}

export const slideInLeft: Variants = {
  initial: { x: -20, opacity: 0 },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: transitionMedium
  },
  exit: { 
    x: -20, 
    opacity: 0,
    transition: transitionFast
  },
}

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
}

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: easePremium,
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: {
      duration: 0.3,
      ease: easePremium
    }
  },
}

// Complex / Specialized Variants

export const createSidebarPulseVariants = (prefersReducedMotion: boolean) => {
  if (prefersReducedMotion) {
    return {
      initial: { opacity: 0.35, scale: 1, boxShadow: '0 0 0 0 rgba(56,189,248,0)' },
      animate: { opacity: 0.4, scale: 1, boxShadow: '0 0 0 0 rgba(56,189,248,0)' },
    }
  }

  return {
    initial: {
      opacity: 0.25,
      scale: 0.97,
      boxShadow: '0 0 0 0 rgba(56,189,248,0)',
    },
    animate: {
      opacity: [0.25, 0.6, 0.4, 0.52, 0.35],
      scale: [0.97, 1.035, 1, 1.015, 1],
      boxShadow: [
        '0 0 0 0 rgba(56,189,248,0)',
        '0 0 18px 4px rgba(56,189,248,0.28)',
        '0 0 6px 2px rgba(56,189,248,0.18)',
        '0 0 16px 3px rgba(14,165,233,0.22)',
        '0 0 6px 2px rgba(56,189,248,0.15)',
      ],
      transition: {
        duration: 4,
        ease: easePremium,
        repeat: Infinity,
        repeatDelay: 1.6,
      },
    },
  }
}

export const createIconEntranceVariants = (prefersReducedMotion: boolean) => {
  if (prefersReducedMotion) {
    return {
      initial: { rotate: 0, scale: 1, opacity: 1 },
      animate: { rotate: 0, scale: 1, opacity: 1 },
    }
  }

  return {
    initial: { rotate: -12, scale: 0.92, opacity: 0 },
    animate: {
      rotate: [ -12, 4, 0 ],
      scale: [0.92, 1.04, 1],
      opacity: 1,
      transition: {
        duration: 0.45,
        ease: easePremium,
      },
    },
  }
}

export const createDeepDiveChipVariants = (prefersReducedMotion: boolean) => {
  if (prefersReducedMotion) {
    return {
      off: { scale: 1, boxShadow: '0 0 0 0 rgba(34,197,94,0)', opacity: 0.85 },
      on: { scale: 1, boxShadow: '0 0 0 0 rgba(34,197,94,0.35)', opacity: 1 },
    }
  }

  return {
    off: {
      scale: 1,
      boxShadow: '0 0 0 0 rgba(34,197,94,0)',
      opacity: 0.85,
    },
    on: {
      scale: [1, 1.05, 1],
      boxShadow: [
        '0 0 0 0 rgba(34,197,94,0)',
        '0 0 16px 3px rgba(34,197,94,0.28)',
        '0 0 10px 2px rgba(34,197,94,0.2)',
      ],
      opacity: 1,
      transition: {
        duration: 0.32,
        ease: easePremium,
      },
    },
  }
}

export type VariantFactory = ReturnType<typeof createSidebarPulseVariants>

export const motionTransitionFast: Transition = transitionFast

export const motionTransitionMedium: Transition = transitionMedium
