import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProfileAnalytics } from './ProfileAnalytics'

// Mock the UI components
vi.mock('../ui', () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }) => <h2 data-testid="card-title">{children}</h2>,
  CardContent: ({ children }) => <div data-testid="card-content">{children}</div>,
  LoadingWrapper: ({ children, loading }) => loading ? <div>Loading...</div> : children,
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  BarChart3: () => <div data-testid="icon-bar-chart" />,
  Award: () => <div data-testid="icon-award" />,
  FileText: () => <div data-testid="icon-file-text" />,
  Briefcase: () => <div data-testid="icon-briefcase" />,
  Calendar: () => <div data-testid="icon-calendar" />,
  Sparkles: () => <div data-testid="icon-sparkles" />,
}))

describe('ProfileAnalytics', () => {
  const mockData = {
    overview: {
      totalResumes: 5,
      profileCompletion: 75,
    },
    resumeMetrics: {
      averageScore: 85,
      bestScore: 95,
    },
    highlights: {
      recentResumes: [
        {
          id: '1',
          fileName: 'resume.pdf',
          createdAt: '2025-01-01',
          score: 90,
        },
      ],
      topResumes: [
        {
          id: '2',
          fileName: 'resume-v2.pdf',
          version: 2,
          createdAt: '2025-01-15',
          score: 95,
        },
      ],
    },
  }

  it('renders loading state', () => {
    render(<ProfileAnalytics loading={true} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders error state with retry button', () => {
    const onRetry = vi.fn()
    render(<ProfileAnalytics error="Something went wrong" onRetry={onRetry} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('renders analytics data correctly', () => {
    render(<ProfileAnalytics data={mockData} loading={false} />)
    
    expect(screen.getByText('5')).toBeInTheDocument() // Total Resumes
    expect(screen.getByText('85%')).toBeInTheDocument() // Average Score
    // Use getAllByText since 95% appears multiple times (Best Score and Top Resume score)
    const bestScoreElements = screen.getAllByText('95%')
    expect(bestScoreElements.length).toBeGreaterThan(0)
  })

  it('renders empty state when no data', () => {
    render(<ProfileAnalytics data={null} loading={false} />)
    expect(screen.getByText('0')).toBeInTheDocument() // Default values
  })
})

