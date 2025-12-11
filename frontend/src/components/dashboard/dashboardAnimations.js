// Custom elegant animation variants for dashboard
export const cardHover = {
  scale: 1.02,
  y: -4,
  transition: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1]
  }
}

export const cardTap = {
  scale: 0.98,
  transition: {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1]
  }
}

export const elegantFadeIn = {
  initial: { opacity: 0, y: 20, scale: 0.96 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1]
    }
  }
}

export const staggerFadeIn = {
  initial: { opacity: 0, y: 30 },
  animate: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1]
    }
  })
}

export const smoothScale = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  }
}

