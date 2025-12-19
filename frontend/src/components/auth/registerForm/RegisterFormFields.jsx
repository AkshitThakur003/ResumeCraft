/**
 * Register Form Fields Component
 * All form input fields for registration
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Input, FormField } from '../../ui'
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
}

export const RegisterFormFields = ({
  formData,
  formErrors,
  showPassword,
  showConfirmPassword,
  loading,
  onFieldChange,
  onTogglePassword,
  onToggleConfirmPassword,
}) => {
  return (
    <>
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-2 gap-4"
      >
        <FormField
          label="First Name"
          required
          error={formErrors.firstName}
        >
          <div className="relative group">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-white/80 group-focus-within:text-primary transition-colors duration-200" />
            <Input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={onFieldChange}
              placeholder="First name"
              disabled={loading}
              error={formErrors.firstName}
              valid={formData.firstName && !formErrors.firstName && formData.firstName.trim().length >= 2}
              className="pl-10 h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-[rgba(255,255,255,0.08)] focus:border-primary focus:ring-1 focus:ring-ring focus:shadow-[0_0_0_1px_hsl(var(--ring)/0.1)] transition-all duration-[120ms] ease-out text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 rounded-lg"
            />
          </div>
        </FormField>

        <FormField
          label="Last Name"
          required
          error={formErrors.lastName}
        >
          <div className="relative group">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-white/80 group-focus-within:text-primary transition-colors duration-200" />
            <Input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={onFieldChange}
              placeholder="Last name"
              disabled={loading}
              error={formErrors.lastName}
              valid={formData.lastName && !formErrors.lastName && formData.lastName.trim().length >= 2}
              className="pl-10 h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-[rgba(255,255,255,0.08)] focus:border-primary focus:ring-1 focus:ring-ring focus:shadow-[0_0_0_1px_hsl(var(--ring)/0.1)] transition-all duration-[120ms] ease-out text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 rounded-lg"
            />
          </div>
        </FormField>
      </motion.div>

      <motion.div variants={itemVariants}>
        <FormField
          label="Email Address"
          required
          error={formErrors.email}
        >
          <div className="relative group">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-white/80 group-focus-within:text-primary transition-colors duration-200" />
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={onFieldChange}
              placeholder="Enter your email"
              disabled={loading}
              error={formErrors.email}
              valid={formData.email && !formErrors.email && /\S+@\S+\.\S+/.test(formData.email)}
              className="pl-10 h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-[rgba(255,255,255,0.08)] focus:border-primary focus:ring-1 focus:ring-ring focus:shadow-[0_0_0_1px_hsl(var(--ring)/0.1)] transition-all duration-[120ms] ease-out text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 rounded-lg"
            />
          </div>
        </FormField>
      </motion.div>

      <motion.div variants={itemVariants}>
        <FormField
          label="Password"
          required
          error={formErrors.password}
          helpText={<PasswordStrengthIndicator password={formData.password} />}
        >
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-white/80 group-focus-within:text-primary transition-colors duration-200" />
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={onFieldChange}
              placeholder="Create a password"
              disabled={loading}
              error={formErrors.password}
              valid={formData.password && !formErrors.password && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)}
              className="pl-10 pr-12 h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-[rgba(255,255,255,0.08)] focus:border-primary focus:ring-1 focus:ring-ring focus:shadow-[0_0_0_1px_hsl(var(--ring)/0.1)] transition-all duration-[120ms] ease-out text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 rounded-lg"
            />
            <motion.button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white/50 dark:hover:text-white transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </motion.button>
          </div>
        </FormField>
      </motion.div>

      <motion.div variants={itemVariants}>
        <FormField
          label="Confirm Password"
          required
          error={formErrors.confirmPassword}
        >
          <div className="relative group">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-white/80 group-focus-within:text-primary transition-colors duration-200" />
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={onFieldChange}
              placeholder="Confirm your password"
              disabled={loading}
              error={formErrors.confirmPassword}
              valid={formData.confirmPassword && !formErrors.confirmPassword && formData.password === formData.confirmPassword}
              className="pl-10 pr-12 h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-[rgba(255,255,255,0.08)] focus:border-primary focus:ring-1 focus:ring-ring focus:shadow-[0_0_0_1px_hsl(var(--ring)/0.1)] transition-all duration-[120ms] ease-out text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 rounded-lg"
            />
            <motion.button
              type="button"
              onClick={onToggleConfirmPassword}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white/50 dark:hover:text-white transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </motion.button>
          </div>
        </FormField>
      </motion.div>
    </>
  )
}

