/**
 * Register Form Component
 * Main registration form
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Card, CardContent, Button } from '../ui'
import { useOAuthProviders } from '../../hooks/useOAuthProviders'
import { OAuthButtons } from './OAuthButtons'
import { useRegisterForm } from '../../hooks/useRegisterForm'
import {
  RegisterFormHeader,
  RegisterFormFields,
  RegisterFormMessages
} from './registerForm/index.js'

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

export const RegisterForm = () => {
  const {
    formData,
    formErrors,
    showPassword,
    showConfirmPassword,
    successMessage,
    loading,
    error,
    setShowPassword,
    setShowConfirmPassword,
    handleChange,
    handleSubmit,
  } = useRegisterForm()

  const { providers: oauthProviders, loading: providersLoading, error: providersError } = useOAuthProviders()

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
        
        <RegisterFormHeader />
        
        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <RegisterFormMessages
              error={error}
              generalError={formErrors.general}
              successMessage={successMessage}
            />
            
            <RegisterFormFields
              formData={formData}
              formErrors={formErrors}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              loading={loading}
              onFieldChange={handleChange}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
            />

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
