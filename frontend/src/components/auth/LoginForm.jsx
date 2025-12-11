import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button, Input, FormField, Card, CardHeader, CardTitle, CardContent } from '../ui'
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react'
import { useOAuthProviders } from '../../hooks/useOAuthProviders'
import { OAuthButtons } from './OAuthButtons'

export const LoginForm = () => {
  const { login, loading, error, resendVerification, rememberMe, setRememberMe } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(null)
  const [resendStatus, setResendStatus] = useState({ loading: false, message: '', error: '' })
  const [localRememberMe, setLocalRememberMe] = useState(rememberMe)
  const { providers: oauthProviders, loading: providersLoading, error: providersError } = useOAuthProviders()

  useEffect(() => {
    setLocalRememberMe(rememberMe)
  }, [rememberMe])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Real-time validation
    const fieldError = validateField(name, value)
    setFormErrors(prev => ({
      ...prev,
      [name]: fieldError,
      general: prev.general && name !== 'email' ? prev.general : '' // Keep general error unless email changes
    }))

    if (name === 'email') {
      setPendingVerificationEmail(null)
      setResendStatus({ loading: false, message: '', error: '' })
    }
  }

  const handleRememberMeChange = (e) => {
    const { checked } = e.target
    setLocalRememberMe(checked)
    setRememberMe(checked)
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.email) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    
    return errors
  }
  
  // Real-time validation
  const validateField = (name, value) => {
    switch (name) {
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

    setPendingVerificationEmail(null)
    setResendStatus({ loading: false, message: '', error: '' })

    const result = await login({ ...formData, rememberMe: localRememberMe })
    if (!result.success) {
      setFormErrors({ general: result.error })
      if (result.requiresVerification) {
        setPendingVerificationEmail(result.email || formData.email)
      }
    }
  }

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail || resendStatus.loading) return

    setResendStatus({ loading: true, message: '', error: '' })
    const response = await resendVerification(pendingVerificationEmail)

    if (response.success) {
      setResendStatus({ loading: false, message: response.message || 'Verification email sent.', error: '' })
    } else {
      setResendStatus({ loading: false, message: '', error: response.error || 'Unable to send verification email.' })
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
      className="w-full max-w-sm sm:max-w-md mx-auto px-4 sm:px-0"
    >
      <Card className="relative overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] backdrop-blur-2xl border-slate-200/60 dark:border-white/5 bg-white/70 dark:bg-slate-900/70">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white/50 to-slate-100/50 dark:from-slate-50/10 dark:via-white/5 dark:to-slate-100/5 pointer-events-none" />
        
        <CardHeader className="relative z-10 p-4 sm:p-6">
          <motion.div
            variants={itemVariants}
            className="text-center"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg border border-slate-200 dark:border-white/10">
              <User className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-4">
              Welcome Back
            </CardTitle>
            <p className="text-slate-500 dark:text-slate-400 mt-1 sm:mt-2 text-sm sm:text-base">Sign in to your account</p>
          </motion.div>
        </CardHeader>
        
        <CardContent className="relative z-10 p-4 sm:p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {(error || formErrors.general) && (
              <motion.div 
                className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {formErrors.general || error}
              </motion.div>
            )}

            {pendingVerificationEmail && (
              <motion.div
                className="p-4 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl backdrop-blur-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-blue-700 dark:text-blue-200">
                  Your account isn&apos;t verified yet. We&apos;ve emailed a confirmation link to <strong>{pendingVerificationEmail}</strong>.
                  Click the button below if you need us to resend it.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleResendVerification}
                    disabled={resendStatus.loading}
                  >
                    {resendStatus.loading ? 'Sending...' : 'Resend verification email'}
                  </Button>
                  {resendStatus.message && (
                    <span className="text-green-600 dark:text-green-300 text-xs sm:text-sm">{resendStatus.message}</span>
                  )}
                  {resendStatus.error && (
                    <span className="text-red-600 dark:text-red-300 text-xs sm:text-sm">{resendStatus.error}</span>
                  )}
                </div>
              </motion.div>
            )}
            
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
                    layoutId="emailGlow"
                  />
                </div>
              </FormField>
            </motion.div>

            <motion.div variants={itemVariants}>
              <FormField
                label="Password"
                required
                error={formErrors.password}
              >
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-white/80 group-focus-within:text-primary transition-colors duration-200" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    disabled={loading}
                    error={formErrors.password}
                    valid={formData.password && !formErrors.password && formData.password.length >= 8}
                    className="pl-10 pr-12 h-10 sm:h-12 text-sm sm:text-base bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-[rgba(255,255,255,0.08)] focus:border-primary focus:ring-1 focus:ring-ring focus:shadow-[0_0_0_1px_hsl(var(--ring)/0.1)] transition-all duration-[120ms] ease-out text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 rounded-lg"
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
                    layoutId="passwordGlow"
                  />
                </div>
              </FormField>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-muted-foreground"
            >
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localRememberMe}
                  onChange={handleRememberMeChange}
                  disabled={loading}
                  className="h-4 w-4 accent-blue-600"
                />
                <span>Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:text-blue-500 transition-colors duration-200"
              >
                Forgot your password?
              </Link>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                type="submit"
                className="w-full h-10 sm:h-12 text-base sm:text-lg font-medium relative overflow-hidden group bg-gradient-to-r from-primary to-primary/80 hover:-translate-y-[2px] hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 text-primary-foreground border-none"
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
                    <span className="relative z-10">Sign In</span>
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
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200">
                  Sign up
                </Link>
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

