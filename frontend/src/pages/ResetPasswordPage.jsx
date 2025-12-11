import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, FormField } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import { useGlobalToast } from '../contexts/ToastContext'

export const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { resetPassword } = useAuth()
  const { addToast } = useGlobalToast()
  const [token, setToken] = useState('')
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [status, setStatus] = useState({ loading: false, message: '', error: '' })

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setStatus({ loading: false, message: '', error: 'Invalid or missing password reset token.' })
      // Redirect to forgot password page after showing error briefly
      setTimeout(() => {
        navigate('/forgot-password', { replace: true })
      }, 3000)
    } else {
      setToken(tokenParam)
    }
  }, [searchParams, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (status.error) {
      setStatus((prev) => ({ ...prev, error: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!token) {
      setStatus({ loading: false, message: '', error: 'Reset token is missing. Please request a new reset email.' })
      return
    }

    if (!formData.password || formData.password.length < 6) {
      setStatus({ loading: false, message: '', error: 'Password must be at least 6 characters long.' })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setStatus({ loading: false, message: '', error: 'Passwords do not match.' })
      return
    }

    setStatus({ loading: true, message: '', error: '' })

    const response = await resetPassword(token, formData.password)
    if (response.success) {
      const message = response.message || 'Password reset successfully. Redirecting to dashboard...'
      setStatus({
        loading: false,
        message,
        error: '',
      })
      addToast('Password reset! You\'re all set - redirecting you now! 🔐', 'success')

      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 1500)
    } else {
      setStatus({ loading: false, message: '', error: response.error })
      addToast(response.error || 'Couldn\'t reset your password. The link might have expired.', 'error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <Card className="max-w-lg w-full shadow-lg border border-gray-100 dark:border-gray-800">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold">Create a new password</CardTitle>
          <p className="text-muted-foreground">Choose a strong password to secure your account.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="New password" required>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                disabled={status.loading}
              />
            </FormField>

            <FormField label="Confirm password" required>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                disabled={status.loading}
              />
            </FormField>

            {status.error && (
              <div className="p-3 rounded-md border border-red-200 bg-red-50 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                {status.error}
              </div>
            )}

            {status.message && (
              <div className="p-3 rounded-md border border-green-200 bg-green-50 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200">
                {status.message}
              </div>
            )}

            <Button type="submit" disabled={status.loading || !token} className="w-full">
              {status.loading ? 'Updating password...' : 'Update password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => navigate('/login')}>
              Return to login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

