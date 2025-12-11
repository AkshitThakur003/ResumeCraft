import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  generateCoverLetter,
  generateCoverLetterStream,
  getCoverLetter, 
  updateCoverLetter, 
  deleteCoverLetter,
  createVersion,
  regenerateVersion,
  getTemplates,
  exportCoverLetter,
  listCoverLetters 
} from '../utils/coverLetterAPI';
import { listResumes } from '../utils/resumeAPI';
import { useGlobalToast } from '../contexts/ToastContext';
import { Button, Card, CardHeader, CardTitle, CardContent, LoadingWrapper, Input, Textarea, Select } from '../components/ui';
import { 
  FileText, 
  Sparkles, 
  Save, 
  Trash2, 
  Copy, 
  Download, 
  Star,
  Edit3,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { fadeInUp } from '../components/ui/motionVariants';

export const CoverLetterPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useGlobalToast();
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [coverLetter, setCoverLetter] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [cancelStream, setCancelStream] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    resumeId: '',
    jobTitle: '',
    companyName: '',
    jobDescription: '',
    tone: 'professional',
    template: 'traditional',
    generateMultiple: false,
    versionCount: 2, // Fixed to 2 versions
  });
  
  const [templates, setTemplates] = useState([
    { id: 'traditional', name: 'Traditional', description: 'Classic business format' },
    { id: 'modern', name: 'Modern', description: 'Contemporary style' },
    { id: 'creative', name: 'Creative', description: 'Stand out approach' },
    { id: 'technical', name: 'Technical', description: 'For technical roles' },
    { id: 'executive', name: 'Executive', description: 'For senior roles' },
  ]);
  
  const [content, setContent] = useState('');

  useEffect(() => {
    loadResumes();
    loadTemplates();
    if (id) {
      loadCoverLetter();
    }
  }, [id]);

  // Cleanup SSE stream on unmount
  useEffect(() => {
    return () => {
      if (cancelStream) {
        cancelStream();
      }
    };
  }, [cancelStream]);
  
  const loadTemplates = async () => {
    try {
      const response = await getTemplates();
      if (response.data.success && response.data.data) {
        setTemplates(response.data.data);
      } else {
        // Fallback to default templates if API fails
        console.warn('Templates API returned unexpected format, using defaults');
        setTemplates([
          { id: 'traditional', name: 'Traditional', description: 'Classic business format' },
          { id: 'modern', name: 'Modern', description: 'Contemporary style' },
          { id: 'creative', name: 'Creative', description: 'Stand out approach' },
          { id: 'technical', name: 'Technical', description: 'For technical roles' },
          { id: 'executive', name: 'Executive', description: 'For senior roles' },
        ]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      // Fallback to default templates on error
      setTemplates([
        { id: 'traditional', name: 'Traditional', description: 'Classic business format' },
        { id: 'modern', name: 'Modern', description: 'Contemporary style' },
        { id: 'creative', name: 'Creative', description: 'Stand out approach' },
        { id: 'technical', name: 'Technical', description: 'For technical roles' },
        { id: 'executive', name: 'Executive', description: 'For senior roles' },
      ]);
    }
  };

  const loadResumes = async () => {
    try {
      const response = await listResumes();
      if (response.data.success) {
        setResumes(response.data.data.resumes || []);
        if (response.data.data.resumes.length > 0 && !formData.resumeId) {
          setFormData(prev => ({ ...prev, resumeId: response.data.data.resumes[0]._id }));
        }
      }
    } catch (error) {
      console.error('Error loading resumes:', error);
    }
  };

  const loadCoverLetter = async () => {
    try {
      setLoading(true);
      const response = await getCoverLetter(id);
      if (response.data.success) {
        const cl = response.data.data;
        setCoverLetter(cl);
        setContent(cl.content);
        setFormData({
          resumeId: cl.resumeId._id || cl.resumeId,
          jobTitle: cl.jobTitle,
          companyName: cl.companyName,
          jobDescription: cl.jobDescription,
          tone: cl.tone,
          template: cl.metadata?.template || cl.template || 'traditional',
        });
      }
    } catch (error) {
      showToast('Failed to load cover letter', 'error');
      navigate('/cover-letters');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.resumeId || !formData.jobTitle || !formData.companyName || !formData.jobDescription) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Cancel any existing stream
    if (cancelStream) {
      cancelStream();
    }

    try {
      setGenerating(true);
      setGenerationProgress(0);
      setProgressMessage('Initializing...');
      
      // Use SSE stream for real-time progress updates
      const cancelFn = generateCoverLetterStream(
        formData,
        {
          onProgress: (progress, message) => {
            setGenerationProgress(progress);
            setProgressMessage(message || 'Processing...');
          },
          onComplete: (result) => {
            setGenerationProgress(100);
            setProgressMessage('Complete!');
            
            // Check if multiple versions were generated
            if (result.versions) {
              showToast(`${result.count} cover letter versions generated successfully!`, 'success');
              navigate('/cover-letters');
            } else {
              const newCoverLetter = result;
              setCoverLetter(newCoverLetter);
              setContent(newCoverLetter.content);
              showToast('Cover letter generated successfully!', 'success');
              navigate(`/cover-letters/${newCoverLetter._id}`);
            }
            
            setGenerating(false);
            setGenerationProgress(0);
            setProgressMessage('');
            setCancelStream(null);
          },
          onError: (error) => {
            showToast(
              error.message || 'Failed to generate cover letter. Please try again.',
              'error'
            );
            setGenerating(false);
            setGenerationProgress(0);
            setProgressMessage('');
            setCancelStream(null);
          },
        }
      );
      
      setCancelStream(() => cancelFn);
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Failed to start generation. Please try again.',
        'error'
      );
      setGenerating(false);
      setGenerationProgress(0);
      setProgressMessage('');
    }
  };

  const handleSave = async () => {
    if (!coverLetter) return;

    try {
      setLoading(true);
      await updateCoverLetter(coverLetter._id, { content });
      showToast('Cover letter saved successfully!', 'success');
      setIsEditing(false);
      await loadCoverLetter();
    } catch (error) {
      showToast('Failed to save cover letter', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!coverLetter || !window.confirm('Are you sure you want to delete this cover letter?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteCoverLetter(coverLetter._id);
      showToast('Cover letter deleted successfully', 'success');
      navigate('/cover-letters');
    } catch (error) {
      showToast('Failed to delete cover letter', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    showToast('Cover letter copied to clipboard!', 'success');
  };

  const handleDownload = async (format = 'txt') => {
    if (!coverLetter) return;
    
    try {
      if (format === 'txt') {
        // Simple text download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cover-letter-${coverLetter?.jobTitle || 'letter'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Cover letter downloaded!', 'success');
      } else {
        // Use API for PDF/DOCX (when implemented)
        const response = await exportCoverLetter(coverLetter._id, format);
        const blob = new Blob([response.data], { 
          type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cover-letter-${coverLetter?.jobTitle || 'letter'}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Cover letter exported as ${format.toUpperCase()}!`, 'success');
      }
    } catch (error) {
      showToast('Failed to export cover letter', 'error');
    }
  };

  const handleToggleFavorite = async () => {
    if (!coverLetter) return;

    try {
      await updateCoverLetter(coverLetter._id, { isFavorite: !coverLetter.isFavorite });
      setCoverLetter(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
      showToast(
        coverLetter.isFavorite ? 'Removed from favorites' : 'Added to favorites',
        'success'
      );
    } catch (error) {
      showToast('Failed to update favorite status', 'error');
    }
  };

  const handleCreateVersion = async () => {
    if (!coverLetter) return;

    try {
      setLoading(true);
      const response = await createVersion(coverLetter._id, { content, tone: formData.tone });
      if (response.data.success) {
        showToast('New version created!', 'success');
        navigate(`/cover-letters/${response.data.data._id}`);
      }
    } catch (error) {
      showToast('Failed to create new version', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegenerate = async () => {
    if (!coverLetter) return;

    try {
      setGenerating(true);
      const response = await regenerateVersion(coverLetter._id, { 
        tone: formData.tone,
        template: formData.template 
      });
      if (response.data.success) {
        showToast('Cover letter regenerated with AI!', 'success');
        navigate(`/cover-letters/${response.data.data._id}`);
      }
    } catch (error) {
      showToast('Failed to regenerate cover letter', 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (loading && !coverLetter && id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingWrapper />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/cover-letters')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {id ? (coverLetter ? 'Edit Cover Letter' : 'Cover Letter') : 'Generate Cover Letter'}
              </h1>
              {coverLetter && (
                <p className="text-muted-foreground mt-1">
                  {coverLetter.jobTitle} at {coverLetter.companyName}
                </p>
              )}
            </div>
          </div>
          
          {coverLetter && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                title={coverLetter.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star 
                  className={`h-5 w-5 ${coverLetter.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} 
                />
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <div className="relative group">
                <Button variant="outline" onClick={() => handleDownload('txt')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white dark:bg-slate-800 border rounded-lg shadow-lg p-1 z-10 min-w-[150px]">
                  <button
                    onClick={() => handleDownload('txt')}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    Download as TXT
                  </button>
                  <button
                    onClick={() => handleDownload('pdf')}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => handleDownload('docx')}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                  >
                    Export as DOCX
                  </button>
                </div>
              </div>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {!id || !coverLetter ? (
          /* Generate Form */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Generate New Cover Letter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select Resume *
                  </label>
                  <Select
                    value={formData.resumeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, resumeId: e.target.value }))}
                    disabled={generating}
                  >
                    <option value="">Choose a resume...</option>
                    {resumes.map((resume) => (
                      <option key={resume._id} value={resume._id}>
                        {resume.title || resume.originalFilename}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tone
                  </label>
                  <Select
                    value={formData.tone}
                    onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value }))}
                    disabled={generating}
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="formal">Formal</option>
                    <option value="enthusiastic">Enthusiastic</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Template
                  </label>
                  <Select
                    value={formData.template}
                    onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value }))}
                    disabled={generating}
                  >
                    {templates.length === 0 ? (
                      <>
                        <option value="traditional">Traditional - Classic business format</option>
                        <option value="modern">Modern - Contemporary style</option>
                        <option value="creative">Creative - Stand out approach</option>
                        <option value="technical">Technical - For technical roles</option>
                        <option value="executive">Executive - For senior roles</option>
                      </>
                    ) : (
                      templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name} - {template.description}
                        </option>
                      ))
                    )}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Job Title *
                  </label>
                  <Input
                    value={formData.jobTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                    placeholder="e.g., Software Engineer"
                    disabled={generating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Company Name *
                  </label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="e.g., Tech Corp"
                    disabled={generating}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Job Description *
                </label>
                <Textarea
                  value={formData.jobDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                  placeholder="Paste the job description here..."
                  rows={8}
                  disabled={generating}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 50 characters required
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.generateMultiple}
                    onChange={(e) => setFormData(prev => ({ ...prev, generateMultiple: e.target.checked }))}
                    disabled={generating}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Generate 2 versions (A/B testing)</span>
                </label>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleGenerate}
                  disabled={generating || !formData.resumeId || !formData.jobTitle || !formData.companyName || !formData.jobDescription}
                  className="w-full"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {progressMessage || 'Generating...'} {generationProgress}%
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {formData.generateMultiple ? 'Generate 2 Versions' : 'Generate Cover Letter'}
                    </>
                  )}
                </Button>
                {generating && (
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* View/Edit Cover Letter */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Cover Letter Content
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => {
                            setIsEditing(false);
                            setContent(coverLetter.content);
                          }}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSave} disabled={loading}>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={generating}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Regenerate
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleCreateVersion}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Duplicate
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={20}
                      className="font-mono text-sm"
                    />
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {content}
                      </pre>
                    </div>
                  )}
                  
                  {/* AI Disclaimer and Warnings */}
                  {coverLetter?.disclaimer && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="text-blue-600 dark:text-blue-400 mt-0.5">⚠️</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            AI-Generated Content Disclaimer
                          </p>
                          <p className="text-xs text-blue-800 dark:text-blue-200">
                            {coverLetter.disclaimer}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Safety & Moderation Warnings */}
                  {coverLetter?.metadata?.moderation && !coverLetter.metadata.moderation.safe && (
                    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="text-yellow-600 dark:text-yellow-400 mt-0.5">🔒</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                            Content Safety Alert
                          </p>
                          <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
                            {coverLetter.metadata.moderation.hasPII && (
                              <li>Personal information detected - please review and remove sensitive data</li>
                            )}
                            {coverLetter.metadata.moderation.flagged && (
                              <li>Content may contain inappropriate material - review recommended</li>
                            )}
                            {coverLetter.metadata.moderation.safetyScore < 80 && (
                              <li>Safety score: {coverLetter.metadata.moderation.safetyScore}/100 - please review</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Hallucination Warnings */}
                  {coverLetter?.metadata?.hallucination && 
                   (!coverLetter.metadata.hallucination.isReliable || 
                    coverLetter.metadata.hallucination.hasHallucinations) && (
                    <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="text-orange-600 dark:text-orange-400 mt-0.5">📊</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
                            Accuracy Check
                          </p>
                          <p className="text-xs text-orange-800 dark:text-orange-200 mb-2">
                            {coverLetter.metadata.hallucination.recommendation}
                          </p>
                          {coverLetter.metadata.hallucination.unmatchedClaimsCount > 0 && (
                            <p className="text-xs text-orange-800 dark:text-orange-200">
                              ⚠️ {coverLetter.metadata.hallucination.unmatchedClaimsCount} claim(s) could not be verified against your resume. 
                              Please verify all facts, numbers, and achievements before sending.
                            </p>
                          )}
                          <p className="text-xs text-orange-800 dark:text-orange-200 mt-2">
                            Confidence: {coverLetter.metadata.hallucination.confidence}% | 
                            Verification Rate: {coverLetter.metadata.hallucination.verificationRate}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Bias Warnings */}
                  {coverLetter?.metadata?.bias && coverLetter.metadata.bias.hasBias && (
                    <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="text-purple-600 dark:text-purple-400 mt-0.5">⚖️</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                            Bias & Inclusivity Check
                          </p>
                          <p className="text-xs text-purple-800 dark:text-purple-200 mb-2">
                            {coverLetter.metadata.bias.recommendation}
                          </p>
                          <p className="text-xs text-purple-800 dark:text-purple-200">
                            Inclusivity Score: {coverLetter.metadata.bias.overallScore}/100 (Grade: {coverLetter.metadata.bias.grade})
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* General Warnings */}
                  {coverLetter?.warnings && coverLetter.warnings.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="text-gray-600 dark:text-gray-400 mt-0.5">ℹ️</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            Notices
                          </p>
                          <ul className="text-xs text-gray-800 dark:text-gray-200 space-y-1 list-disc list-inside">
                            {coverLetter.warnings.map((warning, idx) => (
                              <li key={idx}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Job Title</p>
                    <p className="font-medium">{coverLetter.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="font-medium">{coverLetter.companyName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tone</p>
                    <p className="font-medium capitalize">{coverLetter.tone}</p>
                  </div>
                  {coverLetter.metadata?.template && (
                    <div>
                      <p className="text-xs text-muted-foreground">Template</p>
                      <p className="font-medium capitalize">{coverLetter.metadata.template}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Version</p>
                    <p className="font-medium">{coverLetter.version}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Word Count</p>
                    <p className="font-medium">{coverLetter.metadata?.wordCount || 0}</p>
                  </div>
                  {coverLetter.metadata?.qualityScore !== undefined && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground">Quality Score</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-lg">{coverLetter.metadata.qualityScore}/100</p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            coverLetter.metadata.qualityScore >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            coverLetter.metadata.qualityScore >= 80 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            coverLetter.metadata.qualityScore >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {coverLetter.metadata.qualityGrade || 'N/A'}
                          </span>
                        </div>
                      </div>
                      {coverLetter.metadata?.validation?.issues?.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Issues</p>
                          <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                            {coverLetter.metadata.validation.issues.slice(0, 3).map((issue, idx) => (
                              <li key={idx}>• {issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {coverLetter.metadata?.validation?.strengths?.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Strengths</p>
                          <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                            {coverLetter.metadata.validation.strengths.slice(0, 3).map((strength, idx) => (
                              <li key={idx}>• {strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Security & Safety Metrics */}
                  {coverLetter.metadata?.moderation && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Security & Safety</p>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-muted-foreground">Safety Score</span>
                            <span className={`text-xs font-medium ${
                              coverLetter.metadata.moderation.safetyScore >= 80 ? 'text-green-600 dark:text-green-400' :
                              coverLetter.metadata.moderation.safetyScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {coverLetter.metadata.moderation.safetyScore}/100
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                coverLetter.metadata.moderation.safetyScore >= 80 ? 'bg-green-500' :
                                coverLetter.metadata.moderation.safetyScore >= 50 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${coverLetter.metadata.moderation.safetyScore}%` }}
                            />
                          </div>
                        </div>
                        {coverLetter.metadata.moderation.hasPII && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            ⚠️ {coverLetter.metadata.moderation.piiCount} PII item(s) detected
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Accuracy Metrics */}
                  {coverLetter.metadata?.hallucination && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Accuracy</p>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-muted-foreground">Confidence</span>
                            <span className={`text-xs font-medium ${
                              coverLetter.metadata.hallucination.confidence >= 75 ? 'text-green-600 dark:text-green-400' :
                              coverLetter.metadata.hallucination.confidence >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {coverLetter.metadata.hallucination.confidence}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                coverLetter.metadata.hallucination.confidence >= 75 ? 'bg-green-500' :
                                coverLetter.metadata.hallucination.confidence >= 50 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${coverLetter.metadata.hallucination.confidence}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Verification: {coverLetter.metadata.hallucination.verificationRate}%
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Bias Metrics */}
                  {coverLetter.metadata?.bias && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Inclusivity</p>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-muted-foreground">Bias Score</span>
                            <span className={`text-xs font-medium ${
                              coverLetter.metadata.bias.overallScore >= 75 ? 'text-green-600 dark:text-green-400' :
                              coverLetter.metadata.bias.overallScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-600 dark:text-red-400'
                            }`}>
                              {coverLetter.metadata.bias.overallScore}/100 ({coverLetter.metadata.bias.grade})
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                coverLetter.metadata.bias.overallScore >= 75 ? 'bg-green-500' :
                                coverLetter.metadata.bias.overallScore >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${coverLetter.metadata.bias.overallScore}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {coverLetter.metadata?.cost !== undefined && coverLetter.metadata.cost > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Generation Cost</p>
                      <p className="font-medium text-sm">${coverLetter.metadata.cost.toFixed(4)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="font-medium text-sm">
                      {new Date(coverLetter.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

