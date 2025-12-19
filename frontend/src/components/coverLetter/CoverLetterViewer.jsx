/**
 * Cover Letter Viewer Component
 * Displays and allows editing of cover letter content
 */

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Textarea } from '../ui'
import { FileText, Save, Sparkles, RefreshCw, Edit3 } from 'lucide-react'
import { CoverLetterWarnings } from './CoverLetterWarnings'

export const CoverLetterViewer = ({
  coverLetter,
  content,
  setContent,
  loading,
  generating,
  onSave,
  onRegenerate,
  onCreateVersion
}) => {
  const [isEditing, setIsEditing] = useState(false)

  const handleCancel = () => {
    setIsEditing(false)
    setContent(coverLetter.content)
  }

  return (
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
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={() => { onSave(); setIsEditing(false); }} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={onRegenerate} disabled={generating}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
                <Button variant="outline" size="sm" onClick={onCreateVersion}>
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
        
        <CoverLetterWarnings coverLetter={coverLetter} />
      </CardContent>
    </Card>
  )
}

