import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, FormField } from '../components/ui'
import { Mail } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useGlobalToast } from '../contexts/ToastContext'

export const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const { forgotPassword } = useAuth()
  const { addToast } = useGlobalToast()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ loading: false, message: '', error: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      setStatus({ loading: false, message: '', error: 'Email is required.' })
      return
    }

    setStatus({ loading: true, message: '', error: '' })

    const response = await forgotPassword(email)
    if (response.success) {
      const message = response.message || 'If an account exists for this email, a password reset link has been sent.'
      setStatus({ loading: false, message, error: '' })
      addToast('Check your email! We\'ve sent you a password reset link. 📧', 'success')
    } else {
      setStatus({ loading: false, message: '', error: response.error })
      addToast(response.error || 'Hmm, couldn\'t send the reset link. Mind checking the email address?', 'error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <Card className="max-w-lg w-full shadow-lg border border-gray-100 dark:border-gray-800">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold">Reset your password</CardTitle>
          <p className="text-muted-foreground">Enter your email address and we&apos;ll send you a link to reset your password.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField label="Email address" required>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (status.error) {
                      setStatus((prev) => ({ ...prev, error: '' }))
                    }
                  }}
                  placeholder="you@example.com"
                  disabled={status.loading}
                  className="pl-10"
                />
              </div>
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

            <Button type="submit" disabled={status.loading} className="w-full">
              {status.loading ? 'Sending reset link...' : 'Send reset link'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => navigate('/login')}>
              Back to login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

