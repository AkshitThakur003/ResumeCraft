import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CoverLetterForm } from './CoverLetterForm'

// Mock dependencies
const mockOnGenerate = vi.fn()
const mockResumes = [
  { _id: '1', title: 'Software Engineer Resume', isPrimary: true },
  { _id: '2', title: 'Product Manager Resume', isPrimary: false },
]

const defaultProps = {
  formData: {
    resumeId: '1',
    jobTitle: '',
    companyName: '',
    jobDescription: '',
    tone: 'professional',
    template: 'standard',
    generateMultiple: false,
  },
  setFormData: vi.fn(),
  resumes: mockResumes,
  templates: [],
  generating: false,
  generationProgress: 0,
  progressMessage: '',
  onGenerate: mockOnGenerate,
}

describe('CoverLetterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders form fields', () => {
      render(<CoverLetterForm {...defaultProps} />)

      expect(screen.getByLabelText(/job title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/job description/i)).toBeInTheDocument()
    })

    it('renders resume selector', () => {
      render(<CoverLetterForm {...defaultProps} />)

      expect(screen.getByText(/select resume/i)).toBeInTheDocument()
    })

    it('shows loading state', () => {
      render(<CoverLetterForm {...defaultProps} generating={true} />)

      expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled()
    })
  })

  describe('form submission', () => {
    it('calls onGenerate with form data', async () => {
      const setFormData = vi.fn()
      const props = {
        ...defaultProps,
        formData: {
          ...defaultProps.formData,
          jobTitle: 'Software Engineer',
          companyName: 'Tech Corp',
          jobDescription: 'Job description here',
        },
        setFormData,
      }
      render(<CoverLetterForm {...props} />)

      fireEvent.click(screen.getByRole('button', { name: /generate/i }))

      await waitFor(() => {
        expect(mockOnGenerate).toHaveBeenCalled()
      })
    })

    it('validates required fields', async () => {
      render(<CoverLetterForm {...defaultProps} />)

      const button = screen.getByRole('button', { name: /generate/i })
      expect(button).toBeDisabled()
      
      expect(mockOnGenerate).not.toHaveBeenCalled()
    })
  })

  describe('resume selection', () => {
    it('allows selecting a resume', () => {
      const setFormData = vi.fn()
      render(<CoverLetterForm {...defaultProps} setFormData={setFormData} />)

      const resumeSelect = screen.getByRole('combobox')
      fireEvent.change(resumeSelect, { target: { value: '2' } })

      expect(setFormData).toHaveBeenCalled()
    })

    it('preselects primary resume', () => {
      render(<CoverLetterForm {...defaultProps} />)

      const resumeSelect = screen.getByRole('combobox')
      expect(resumeSelect.value).toBe('1')
    })
  })
})

