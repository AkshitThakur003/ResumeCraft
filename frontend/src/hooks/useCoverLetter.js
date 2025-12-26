/**
 * Custom hook for cover letter management
 * Handles all cover letter operations: loading, generating, saving, deleting, etc.
 * @module hooks/useCoverLetter
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { logger } from '../utils/logger'
import { 
  generateCoverLetterStream,
  getCoverLetter, 
  updateCoverLetter, 
  deleteCoverLetter,
  createVersion,
  regenerateVersion,
  getTemplates,
  exportCoverLetter
} from '../utils/coverLetterAPI'
import { listResumes } from '../utils/resumeAPI'
import { useGlobalToast } from '../contexts/ToastContext'

const DEFAULT_TEMPLATES = [
  { id: 'traditional', name: 'Traditional', description: 'Classic business format' },
  { id: 'modern', name: 'Modern', description: 'Contemporary style' },
  { id: 'creative', name: 'Creative', description: 'Stand out approach' },
  { id: 'technical', name: 'Technical', description: 'For technical roles' },
  { id: 'executive', name: 'Executive', description: 'For senior roles' },
]

export const useCoverLetter = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { showToast } = useGlobalToast()
  
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [coverLetter, setCoverLetter] = useState(null)
  const [resumes, setResumes] = useState([])
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES)
  const [content, setContent] = useState('')
  const [cancelStream, setCancelStream] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    resumeId: '',
    jobTitle: '',
    companyName: '',
    jobDescription: '',
    tone: 'professional',
    template: 'traditional',
    generateMultiple: false,
    versionCount: 2,
  })

  // Load templates
  const loadTemplates = useCallback(async () => {
    try {
      const response = await getTemplates()
      if (response.data.success && response.data.data) {
        setTemplates(response.data.data)
      }
    } catch (error) {
      logger.error('Error loading templates:', error)
      // Keep default templates
    }
  }, [])

  // Load resumes
  const loadResumes = useCallback(async () => {
    try {
      const response = await listResumes()
      if (response.data.success) {
        setResumes(response.data.data.resumes || [])
        if (response.data.data.resumes.length > 0 && !formData.resumeId) {
          setFormData(prev => ({ ...prev, resumeId: response.data.data.resumes[0]._id }))
        }
      }
    } catch (error) {
      logger.error('Error loading resumes:', error)
    }
  }, [formData.resumeId])

  // Load cover letter
  const loadCoverLetter = useCallback(async () => {
    if (!id) return
    
    try {
      setLoading(true)
      const response = await getCoverLetter(id)
      if (response.data.success) {
        const cl = response.data.data
        setCoverLetter(cl)
        setContent(cl.content)
        setFormData({
          resumeId: cl.resumeId._id || cl.resumeId,
          jobTitle: cl.jobTitle,
          companyName: cl.companyName,
          jobDescription: cl.jobDescription,
          tone: cl.tone,
          template: cl.metadata?.template || cl.template || 'traditional',
        })
      }
    } catch (error) {
      showToast('Failed to load cover letter', 'error')
      navigate('/cover-letters')
    } finally {
      setLoading(false)
    }
  }, [id, navigate, showToast])

  // Initialize data
  useEffect(() => {
    loadResumes()
    loadTemplates()
    if (id) {
      loadCoverLetter()
    }
  }, [id, loadResumes, loadTemplates, loadCoverLetter])

  // Cleanup SSE stream on unmount
  useEffect(() => {
    return () => {
      if (cancelStream) {
        cancelStream()
      }
    }
  }, [cancelStream])

  // Generate cover letter
  const handleGenerate = useCallback(async () => {
    if (!formData.resumeId || !formData.jobTitle || !formData.companyName || !formData.jobDescription) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    // Cancel any existing stream
    if (cancelStream) {
      cancelStream()
    }

    try {
      setGenerating(true)
      setGenerationProgress(0)
      setProgressMessage('Initializing...')
      
      const cancelFn = generateCoverLetterStream(
        formData,
        {
          onProgress: (progress, message) => {
            setGenerationProgress(progress)
            setProgressMessage(message || 'Processing...')
          },
          onComplete: (result) => {
            setGenerationProgress(100)
            setProgressMessage('Complete!')
            
            if (result.versions) {
              showToast(`${result.count} cover letter versions generated successfully!`, 'success')
              navigate('/cover-letters')
            } else {
              const newCoverLetter = result
              setCoverLetter(newCoverLetter)
              setContent(newCoverLetter.content)
              showToast('Cover letter generated successfully!', 'success')
              navigate(`/cover-letters/${newCoverLetter._id}`)
            }
            
            setGenerating(false)
            setGenerationProgress(0)
            setProgressMessage('')
            setCancelStream(null)
          },
          onError: (error) => {
            showToast(
              error.message || 'Failed to generate cover letter. Please try again.',
              'error'
            )
            setGenerating(false)
            setGenerationProgress(0)
            setProgressMessage('')
            setCancelStream(null)
          },
        }
      )
      
      setCancelStream(() => cancelFn)
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Failed to start generation. Please try again.',
        'error'
      )
      setGenerating(false)
      setGenerationProgress(0)
      setProgressMessage('')
    }
  }, [formData, cancelStream, showToast, navigate])

  // Save cover letter
  const handleSave = useCallback(async () => {
    if (!coverLetter) return

    try {
      setLoading(true)
      await updateCoverLetter(coverLetter._id, { content })
      showToast('Cover letter saved successfully!', 'success')
      await loadCoverLetter()
    } catch (error) {
      showToast('Failed to save cover letter', 'error')
    } finally {
      setLoading(false)
    }
  }, [coverLetter, content, loadCoverLetter, showToast])

  // Delete cover letter
  const handleDelete = useCallback(async () => {
    if (!coverLetter || !window.confirm('Are you sure you want to delete this cover letter?')) {
      return
    }

    try {
      setLoading(true)
      await deleteCoverLetter(coverLetter._id)
      showToast('Cover letter deleted successfully', 'success')
      navigate('/cover-letters')
    } catch (error) {
      showToast('Failed to delete cover letter', 'error')
    } finally {
      setLoading(false)
    }
  }, [coverLetter, navigate, showToast])

  // Copy to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content)
    showToast('Cover letter copied to clipboard!', 'success')
  }, [content, showToast])

  // Download/Export
  const handleDownload = useCallback(async (format = 'txt') => {
    if (!coverLetter) return
    
    try {
      if (format === 'txt') {
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cover-letter-${coverLetter?.jobTitle || 'letter'}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showToast('Cover letter downloaded!', 'success')
      } else {
        const response = await exportCoverLetter(coverLetter._id, format)
        const blob = new Blob([response.data], { 
          type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cover-letter-${coverLetter?.jobTitle || 'letter'}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showToast(`Cover letter exported as ${format.toUpperCase()}!`, 'success')
      }
    } catch (error) {
      showToast('Failed to export cover letter', 'error')
    }
  }, [coverLetter, content, showToast])

  // Toggle favorite
  const handleToggleFavorite = useCallback(async () => {
    if (!coverLetter) return

    try {
      await updateCoverLetter(coverLetter._id, { isFavorite: !coverLetter.isFavorite })
      setCoverLetter(prev => ({ ...prev, isFavorite: !prev.isFavorite }))
      showToast(
        coverLetter.isFavorite ? 'Removed from favorites' : 'Added to favorites',
        'success'
      )
    } catch (error) {
      showToast('Failed to update favorite status', 'error')
    }
  }, [coverLetter, showToast])

  // Create version
  const handleCreateVersion = useCallback(async () => {
    if (!coverLetter) return

    try {
      setLoading(true)
      const response = await createVersion(coverLetter._id, { content, tone: formData.tone })
      if (response.data.success) {
        showToast('New version created!', 'success')
        navigate(`/cover-letters/${response.data.data._id}`)
      }
    } catch (error) {
      showToast('Failed to create new version', 'error')
    } finally {
      setLoading(false)
    }
  }, [coverLetter, content, formData.tone, navigate, showToast])

  // Regenerate
  const handleRegenerate = useCallback(async () => {
    if (!coverLetter) return

    try {
      setGenerating(true)
      const response = await regenerateVersion(coverLetter._id, { 
        tone: formData.tone,
        template: formData.template 
      })
      if (response.data.success) {
        showToast('Cover letter regenerated with AI!', 'success')
        navigate(`/cover-letters/${response.data.data._id}`)
      }
    } catch (error) {
      showToast('Failed to regenerate cover letter', 'error')
    } finally {
      setGenerating(false)
    }
  }, [coverLetter, formData.tone, formData.template, navigate, showToast])

  return {
    // State
    loading,
    generating,
    generationProgress,
    progressMessage,
    coverLetter,
    resumes,
    templates,
    content,
    formData,
    
    // Setters
    setContent,
    setFormData,
    
    // Actions
    handleGenerate,
    handleSave,
    handleDelete,
    handleCopy,
    handleDownload,
    handleToggleFavorite,
    handleCreateVersion,
    handleRegenerate,
    loadCoverLetter,
  }
}

