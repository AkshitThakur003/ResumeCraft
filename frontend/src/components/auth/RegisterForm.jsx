import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useGlobalToast } from '../../contexts/ToastContext'
import { Button, Input, FormField, Card, CardHeader, CardTitle, CardContent } from '../ui'
import { Eye, EyeOff, Mail, Lock, User, UserPlus } from 'lucide-react'
import { useOAuthProviders } from '../../hooks/useOAuthProviders'
import { OAuthButtons } from './OAuthButtons'

export const RegisterForm = () => {
  const { register, loading, error } = useAuth()
  const { addToast } = useGlobalToast()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const { providers: oauthProviders, loading: providersLoading, error: providersError } = useOAuthProviders()

  const handleChange = (e) => {
    const { name, value } = e.target
    const newFormData = {
      ...formData,
      [name]: value
    }
    setFormData(newFormData)
    
    // Real-time validation
    const fieldError = validateField(name, value, newFormData)
    setFormErrors(prev => ({
      ...prev,
      [name]: fieldError,
      general: prev.general && !['password', 'confirmPassword'].includes(name) ? prev.general : ''
    }))

    if (successMessage) {
      setSuccessMessage('')
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }
    
    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      errors.password = 'Password is required'
    } else {
      // Match backend validation: 8+ chars, uppercase, lowercase, number, special char
      if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters'
      } else if (!/(?=.*[a-z])/.test(formData.password)) {
        errors.password = 'Password must contain at least one lowercase letter'
      } else if (!/(?=.*[A-Z])/.test(formData.password)) {
        errors.password = 'Password must contain at least one uppercase letter'
      } else if (!/(?=.*\d)/.test(formData.password)) {
        errors.password = 'Password must contain at least one number'
      } else if (!/(?=.*[@$!%*?&])/.test(formData.password)) {
        errors.password = 'Password must contain at least one special character (@$!%*?&)'
      }
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    return errors
  }
  
  // Real-time validation
  const validateField = (name, value, allValues = formData) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value?.trim()) return ''
        if (value.trim().length < 2) {
          return 'Name must be at least 2 characters'
        }
        return ''
      case 'email':
        if (!value) return ''
        if (!/\S+@\S+\.\S+/.test(value)) {
          return 'Please enter a valid email address'
        }
        return ''
      case 'password':
        if (!value) return ''
        if (value.length < 8) {
          return 'Password must be at least 8 characters'
        }
        if (!/(?=.*[a-z])/.test(value)) {
          return 'Must contain lowercase letter'
        }
        if (!/(?=.*[A-Z])/.test(value)) {
          return 'Must contain uppercase letter'
        }
        if (!/(?=.*\d)/.test(value)) {
          return 'Must contain a number'
        }
        if (!/(?=.*[@$!%*?&])/.test(value)) {
          return 'Must contain special character (@$!%*?&)'
        }
        return ''
      case 'confirmPassword':
        if (!value) return ''
        if (value !== allValues.password) {
          return 'Passwords do not match'
        }
        return ''
      default:
        return ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const result = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
    })
    
    if (!result.success) {
      // Handle validation errors from backend
      const backendErrors = {}
      if (result.errors && Array.isArray(result.errors)) {
        // Map backend validation errors to form fields
        // Backend returns: { field: 'password', message: '...', value: '...' }
        result.errors.forEach(err => {
          const fieldName = err.field || err.param || err.path
          if (fieldName) {
            backendErrors[fieldName] = err.message || err.msg
          }
        })
      }
      
      setFormErrors({ 
        general: result.error,
        ...backendErrors
      })
      setSuccessMessage('')
      addToast(result.error || 'Oops! Couldn\'t create your account. Mind checking the details?', 'error')
    } else {
      const message = result.message || 'Account created. Please check your email to verify your account.'
      setSuccessMessage(message)
      setFormErrors({})
      addToast('Account created! Check your email to verify - we\'ll see you soon! 🎉', 'success')
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-md mx-auto"
    >
      <Card className="relative overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] backdrop-blur-2xl border-slate-200/60 dark:border-white/5 bg-white/70 dark:bg-slate-900/70">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white/50 to-slate-100/50 dark:from-slate-50/10 dark:via-white/5 dark:to-slate-100/5 pointer-events-none" />
        
        <CardHeader className="relative z-10">
          <motion.div
            variants={itemVariants}
            className="text-center"
          >
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-slate-200 dark:border-white/10">
              <UserPlus className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white mt-4">
              Create Account
            </CardTitle>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Start your journey with us</p>
          </motion.div>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {error}
              </motion.div>
            )}

            {formErrors.general && (
              <motion.div 
                className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {formErrors.general}
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                className="p-4 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-xl backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {successMessage}
              </motion.div>
            )}
            
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
                    onChange={handleChange}
                    placeholder="First name"
                    disabled={loading}
                    error={formErrors.firstName}
                    valid={formData.firstName && !formErrors.firstName && formData.firstName.trim().length >= 2}
                    className="pl-10 h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-[rgba(255,255,255,0.08)] focus:border-primary focus:ring-1 focus:ring-ring focus:shadow-[0_0_0_1px_hsl(var(--ring)/0.1)] transition-all duration-[120ms] ease-out text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 rounded-lg"
                  />
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"
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
                    onChange={handleChange}
                    placeholder="Last name"
                    disabled={loading}
                    error={formErrors.lastName}
                    valid={formData.lastName && !formErrors.lastName && formData.lastName.trim().length >= 2}
                    className="pl-10 h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-[rgba(255,255,255,0.08)] focus:border-primary focus:ring-1 focus:ring-ring focus:shadow-[0_0_0_1px_hsl(var(--ring)/0.1)] transition-all duration-[120ms] ease-out text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 rounded-lg"
                  />
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"
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
                    onChange={handleChange}
                    placeholder="Enter your email"
                    disabled={loading}
                    error={formErrors.email}
                    valid={formData.email && !formErrors.email && /\S+@\S+\.\S+/.test(formData.email)}
                    className="pl-10 h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-[rgba(255,255,255,0.08)] focus:border-primary focus:ring-1 focus:ring-ring focus:shadow-[0_0_0_1px_hsl(var(--ring)/0.1)] transition-all duration-[120ms] ease-out text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 rounded-lg"
                  />
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"
                  />
                </div>
              </FormField>
            </motion.div>

            <motion.div variants={itemVariants}>
              <FormField
                label="Password"
                required
                error={formErrors.password}
                helpText={formData.password ? (
                  <div className="text-xs space-y-1 mt-1">
                    <div className={formData.password.length >= 8 ? 'text-green-600' : 'text-slate-500'}>
                      {formData.password.length >= 8 ? '✓' : '○'} 8+ characters
                    </div>
                    <div className={/(?=.*[a-z])/.test(formData.password) ? 'text-green-600' : 'text-slate-500'}>
                      {/(?=.*[a-z])/.test(formData.password) ? '✓' : '○'} Lowercase letter
                    </div>
                    <div className={/(?=.*[A-Z])/.test(formData.password) ? 'text-green-600' : 'text-slate-500'}>
                      {/(?=.*[A-Z])/.test(formData.password) ? '✓' : '○'} Uppercase letter
                    </div>
                    <div className={/(?=.*\d)/.test(formData.password) ? 'text-green-600' : 'text-slate-500'}>
                      {/(?=.*\d)/.test(formData.password) ? '✓' : '○'} Number
                    </div>
                    <div className={/(?=.*[@$!%*?&])/.test(formData.password) ? 'text-green-600' : 'text-slate-500'}>
                      {/(?=.*[@$!%*?&])/.test(formData.password) ? '✓' : '○'} Special char (@$!%*?&)
                    </div>
                  </div>
                ) : ''}
              >
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-white/80 group-focus-within:text-primary transition-colors duration-200" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    disabled={loading}
                    error={formErrors.password}
                    valid={formData.password && !formErrors.password && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)}
                    className="pl-10 pr-12 h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-[rgba(255,255,255,0.08)] focus:border-primary focus:ring-1 focus:ring-ring focus:shadow-[0_0_0_1px_hsl(var(--ring)/0.1)] transition-all duration-[120ms] ease-out text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 rounded-lg"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white/50 dark:hover:text-white transition-colors duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                  </motion.button>
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"
                  />
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
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    disabled={loading}
                    error={formErrors.confirmPassword}
                    valid={formData.confirmPassword && !formErrors.confirmPassword && formData.password === formData.confirmPassword}
                    className="pl-10 pr-12 h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-[rgba(255,255,255,0.08)] focus:border-primary focus:ring-1 focus:ring-ring focus:shadow-[0_0_0_1px_hsl(var(--ring)/0.1)] transition-all duration-[120ms] ease-out text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 rounded-lg"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white/50 dark:hover:text-white transition-colors duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                  </motion.button>
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none"
                  />
                </div>
              </FormField>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                type="submit"
                className="w-full h-12 text-lg font-medium relative overflow-hidden group bg-gradient-to-r from-primary to-primary/80 hover:-translate-y-[2px] hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 text-primary-foreground border-none"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <span className="relative z-10">Create Account</span>
                    <motion.div
                      className="absolute inset-0 bg-white/20 skew-x-12 group-hover:translate-x-full transition-transform duration-700"
                      initial={{ translateX: '-100%' }}
                      animate={{ translateX: '-100%' }}
                      whileHover={{ translateX: '100%' }}
                    />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div 
            className="mt-8 space-y-4"
            variants={itemVariants}
          >
            <OAuthButtons providers={oauthProviders} loading={providersLoading} error={providersError} />

            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-violet-600 hover:text-violet-500 font-medium transition-colors duration-200">
                  Sign in
                </Link>
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

