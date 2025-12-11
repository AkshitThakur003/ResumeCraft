import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useGlobalToast } from '../contexts/ToastContext'
import { Card, CardContent, CardHeader, CardTitle, Button } from '../components/ui'

export const VerifyEmailPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { verifyEmail } = useAuth()
  const { addToast } = useGlobalToast()

  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [message, setMessage] = useState('We are confirming your email. This will only take a moment...')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Missing verification token. Please use the link from your email or request a new one.')
      return
    }

    let timeoutId

    const runVerification = async () => {
      const result = await verifyEmail(token)

      if (result.success) {
        setStatus('success')
        setMessage('Your email has been verified! Redirecting you to your dashboard...')
        addToast('Email verified! Welcome aboard! 🎉', 'success')

        timeoutId = setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1500)
      } else {
        setStatus('error')
        const errorMsg = result.error || 'We could not verify your email. The link may have expired.'
        setMessage(errorMsg)
        addToast(errorMsg || 'Hmm, couldn\'t verify your email. The link might have expired.', 'error')
      }
    }

    runVerification()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [navigate, searchParams, addToast, verifyEmail])

  const handleBackToLogin = () => {
    navigate('/login', { replace: true })
  }

  const isVerifying = status === 'verifying'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <Card className="max-w-lg w-full text-center shadow-lg border border-gray-100 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            {isVerifying ? 'Verifying your email' : status === 'success' ? 'Email verified' : 'Verification issue'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">{message}</p>

          {isVerifying && (
            <div className="flex justify-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {status === 'success' && (
            <Button onClick={() => navigate('/dashboard')}>
              Go to dashboard
            </Button>
          )}

          {status === 'error' && (
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <Button onClick={handleBackToLogin} variant="secondary">
                Back to login
              </Button>
              <Button onClick={() => navigate('/register')} variant="ghost">
                Create a new account
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

