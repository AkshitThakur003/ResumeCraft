import React from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { pageVariants } from '../ui/motionVariants'

export const PageTransition = ({ children, className }) => {
  const location = useLocation()
  
  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default PageTransition

