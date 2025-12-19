/**
 * Cover Letter Generation Form Component
 */

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, Input, Textarea, Select, Button } from '../ui'
import { Sparkles, RefreshCw } from 'lucide-react'

export const CoverLetterForm = ({
  formData,
  setFormData,
  resumes,
  templates,
  generating,
  generationProgress,
  progressMessage,
  onGenerate
}) => {
  return (
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
            onClick={onGenerate}
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
  )
}

