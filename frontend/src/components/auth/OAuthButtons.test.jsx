import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OAuthButtons } from './OAuthButtons'

// Mock ProviderIcon component
vi.mock('./ProviderIcon', () => ({
  ProviderIcon: ({ name }) => <div data-testid={`provider-icon-${name}`}>{name}</div>
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    a: ({ children, href, className, ...props }) => (
      <a href={href} className={className} {...props}>
        {children}
      </a>
    ),
  },
}))

describe('OAuthButtons', () => {
  const mockProviders = [
    {
      id: 'google',
      name: 'Google',
      authUrl: '/api/auth/google',
      icon: 'google',
    },
    {
      id: 'github',
      name: 'GitHub',
      authUrl: '/api/auth/github',
      icon: 'github',
    },
  ]

  it('returns null when no providers and not loading and no error', () => {
    const { container } = render(
      <OAuthButtons providers={[]} loading={false} error={null} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders loading state', () => {
    render(<OAuthButtons providers={[]} loading={true} error={null} />)
    expect(screen.getByText('Loading options…')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(
      <OAuthButtons
        providers={[]}
        loading={false}
        error="Failed to load OAuth providers"
      />
    )
    expect(screen.getByText('Failed to load OAuth providers')).toBeInTheDocument()
  })

  it('renders OAuth provider buttons', () => {
    render(
      <OAuthButtons providers={mockProviders} loading={false} error={null} />
    )
    
    expect(screen.getByText('Or continue with')).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
    expect(screen.getByText('Continue with GitHub')).toBeInTheDocument()
    
    const googleLink = screen.getByText('Continue with Google').closest('a')
    expect(googleLink).toHaveAttribute('href', '/api/auth/google')
    
    const githubLink = screen.getByText('Continue with GitHub').closest('a')
    expect(githubLink).toHaveAttribute('href', '/api/auth/github')
  })

  it('does not render divider when loading', () => {
    render(<OAuthButtons providers={mockProviders} loading={true} error={null} />)
    expect(screen.queryByText('Or continue with')).not.toBeInTheDocument()
  })

  it('does not render divider when error', () => {
    render(
      <OAuthButtons
        providers={mockProviders}
        loading={false}
        error="Error loading providers"
      />
    )
    expect(screen.queryByText('Or continue with')).not.toBeInTheDocument()
  })
})

