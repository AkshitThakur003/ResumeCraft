/**
 * Cover Letter Header Component
 * Displays header with navigation and action buttons
 */

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui'
import { ArrowLeft, Copy, Download, Trash2, Star } from 'lucide-react'

export const CoverLetterHeader = ({ 
  coverLetter, 
  onCopy, 
  onDownload, 
  onDelete, 
  onToggleFavorite 
}) => {
  const navigate = useNavigate()

  return (
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
            {coverLetter ? 'Edit Cover Letter' : 'Generate Cover Letter'}
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
            onClick={onToggleFavorite}
            title={coverLetter.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star 
              className={`h-5 w-5 ${coverLetter.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} 
            />
          </Button>
          <Button variant="outline" onClick={onCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <div className="relative group">
            <Button variant="outline" onClick={() => onDownload('txt')}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white dark:bg-slate-800 border rounded-lg shadow-lg p-1 z-10 min-w-[150px]">
              <button
                onClick={() => onDownload('txt')}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                Download as TXT
              </button>
              <button
                onClick={() => onDownload('pdf')}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                Export as PDF
              </button>
              <button
                onClick={() => onDownload('docx')}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                Export as DOCX
              </button>
            </div>
          </div>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      )}
    </div>
  )
}

