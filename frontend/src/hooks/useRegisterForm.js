/**
 * Custom hook for registration form logic
 * Handles form state, validation, and submission
 */

import { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useGlobalToast } from '../contexts/ToastContext'

/**
 * Validate a single field
 */
const validateField = (name, value, allValues) => {
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

/**
 * Validate entire form
 */
const validateForm = (formData) => {
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

export const useRegisterForm = () => {
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

  const handleChange = useCallback((e) => {
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
  }, [formData, successMessage])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    
    const errors = validateForm(formData)
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
  }, [formData, register, addToast])

  return {
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
  }
}

