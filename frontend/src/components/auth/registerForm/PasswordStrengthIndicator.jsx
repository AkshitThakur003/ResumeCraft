/**
 * Password Strength Indicator Component
 * Shows password validation requirements
 */

import React from 'react'

export const PasswordStrengthIndicator = ({ password }) => {
  if (!password) return null

  const checks = [
    { label: '8+ characters', test: password.length >= 8 },
    { label: 'Lowercase letter', test: /(?=.*[a-z])/.test(password) },
    { label: 'Uppercase letter', test: /(?=.*[A-Z])/.test(password) },
    { label: 'Number', test: /(?=.*\d)/.test(password) },
    { label: 'Special char (@$!%*?&)', test: /(?=.*[@$!%*?&])/.test(password) },
  ]

  return (
    <div className="text-xs space-y-1 mt-1">
      {checks.map((check, index) => (
        <div key={index} className={check.test ? 'text-green-600' : 'text-slate-500'}>
          {check.test ? '✓' : '○'} {check.label}
        </div>
      ))}
    </div>
  )
}

