import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
  },
  useReducedMotion: () => false,
}))

// Mock cn utility
vi.mock('../../utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}))

describe('Button', () => {
  it('renders button with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders as disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    // The button element is the parent, not the span with text
    const button = screen.getByText('Disabled').closest('button')
    expect(button).toBeDisabled()
  })

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button disabled onClick={handleClick}>Disabled</Button>)
    
    await user.click(screen.getByText('Disabled'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('renders with different variants', () => {
    const { rerender, container } = render(<Button variant="default">Default</Button>)
    expect(screen.getByText('Default')).toBeInTheDocument()
    
    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByText('Secondary')).toBeInTheDocument()
    
    rerender(<Button variant="destructive">Destructive</Button>)
    expect(screen.getByText('Destructive')).toBeInTheDocument()
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByText('Small')).toBeInTheDocument()
    
    rerender(<Button size="default">Default</Button>)
    expect(screen.getByText('Default')).toBeInTheDocument()
    
    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByText('Large')).toBeInTheDocument()
    
    rerender(<Button size="icon">Icon</Button>)
    expect(screen.getByText('Icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Button className="custom-class">Button</Button>)
    expect(container.firstChild.className).toContain('custom-class')
  })
})

