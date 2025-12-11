import React, { useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Trash2, Eye, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent, Button } from '../ui'

/**
 * ResumeCard component - Memoized for performance
 * Only re-renders when resume data or callbacks change
 */
export const ResumeCard = React.memo(({ resume, onDelete, onView, listView = false }) => {
  const navigate = useNavigate()

  const handleDelete = useCallback(async (e) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this resume?')) {
      await onDelete(resume._id)
    }
  }, [resume._id, onDelete])

  const handleView = useCallback((e) => {
    e.stopPropagation()
    onView(resume._id)
  }, [resume._id, onView])

  const handleCardClick = useCallback(() => {
    navigate(`/resumes/${resume._id}`)
  }, [resume._id, navigate])

  const score = resume.latestAnalysis?.overallScore

  // Memoize score color calculations
  const scoreColor = useMemo(() => {
    if (!score) return 'text-muted-foreground'
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 75) return 'text-blue-600 dark:text-blue-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }, [score])

  const scoreBgColor = useMemo(() => {
    if (!score) return 'bg-muted'
    if (score >= 90) return 'bg-emerald-50 dark:bg-emerald-950/30'
    if (score >= 75) return 'bg-blue-50 dark:bg-blue-950/30'
    if (score >= 60) return 'bg-yellow-50 dark:bg-yellow-950/30'
    return 'bg-red-50 dark:bg-red-950/30'
  }, [score])

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={listView ? 'w-full' : 'w-full aspect-square'}
    >
      <Card
        className={`
          group cursor-pointer relative overflow-hidden
          transition-all duration-300 ease-out
          hover:shadow-xl hover:shadow-primary/5 
          hover:border-primary/20 dark:hover:border-primary/30
          active:scale-[0.98]
          ${listView ? 'w-full rounded-2xl' : 'w-full h-full aspect-square rounded-3xl'}
        `}
        onClick={handleCardClick}
      >
        <CardContent className={`${listView ? "p-5" : "p-4 sm:p-5"} h-full flex flex-col overflow-hidden`}>
          <div className={`flex items-start justify-between gap-3 ${listView ? 'flex-row' : 'flex-col h-full min-h-0'}`}>
            <div className={`flex-1 min-w-0 w-full ${listView ? '' : 'flex flex-col h-full min-h-0'}`}>
              {/* Header with icon and title */}
              <div className={`flex items-start gap-2 ${listView ? 'mb-3' : 'mb-2'}`}>
                <div className="flex-shrink-0 p-1.5 rounded-lg bg-primary/10 dark:bg-primary/20 group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors duration-300">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold leading-tight group-hover:text-primary transition-colors duration-200 line-clamp-2 ${listView ? 'text-lg mb-1' : 'text-sm sm:text-base mb-1'}`}>
                    {resume.title || resume.originalFilename}
                  </h3>
                </div>
              </div>
              
              {/* File metadata */}
              <div className={`flex flex-wrap items-center gap-1 text-[10px] sm:text-xs text-muted-foreground ${listView ? 'mb-3 px-1' : 'mb-2'}`}>
                <span className="px-1.5 py-0.5 rounded-md bg-muted/50 font-medium">
                  {resume.fileType.toUpperCase()}
                </span>
                <span className="text-muted-foreground/60">•</span>
                <span>{(resume.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                <span className="text-muted-foreground/60">•</span>
                <span>{format(new Date(resume.uploadDate), 'MMM d, yyyy')}</span>
              </div>

              {/* Tags */}
              {resume.tags && resume.tags.length > 0 && (
                <div className={`flex flex-wrap gap-1 ${listView ? 'mb-3' : 'mb-2'}`}>
                  {resume.tags.slice(0, listView ? 3 : 2).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 text-[10px] sm:text-xs font-medium bg-muted/60 dark:bg-muted/40 rounded-full border border-border/50 hover:bg-muted transition-colors duration-200"
                    >
                      {tag}
                    </span>
                  ))}
                  {resume.tags.length > (listView ? 3 : 2) && (
                    <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground">
                      +{resume.tags.length - (listView ? 3 : 2)}
                    </span>
                  )}
                </div>
              )}

              {/* Score badge - positioned at bottom in grid view */}
              {score !== undefined && (
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${scoreBgColor} border border-current/10 shrink-0 ${listView ? '' : 'mt-auto'}`}>
                  <Sparkles className="w-3 h-3 text-primary flex-shrink-0" />
                  <span className={`text-xs font-semibold ${scoreColor} whitespace-nowrap`}>
                    {score}%
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons - only show in list view or on hover for grid */}
            {listView && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary/10 hover:text-primary"
                  onClick={handleView}
                  aria-label="View resume"
                  title="View resume"
                >
                  <Eye className="w-4 h-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleDelete}
                  aria-label="Delete resume"
                  title="Delete resume"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Action buttons overlay for grid view */}
          {!listView && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-primary/10 hover:text-primary shadow-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onView(resume._id)
                }}
                aria-label="View resume"
                title="View resume"
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive shadow-sm"
                onClick={handleDelete}
                aria-label="Delete resume"
                title="Delete resume"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if resume data or important props change
  return (
    prevProps.resume._id === nextProps.resume._id &&
    prevProps.resume.latestAnalysis?.overallScore === nextProps.resume.latestAnalysis?.overallScore &&
    prevProps.resume.title === nextProps.resume.title &&
    prevProps.listView === nextProps.listView &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onView === nextProps.onView
  )
})

ResumeCard.displayName = 'ResumeCard'

