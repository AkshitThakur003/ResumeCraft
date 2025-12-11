import React from 'react'
import { Card, CardContent } from '../ui'
import { RefreshCw, AlertCircle, Sparkles } from 'lucide-react'
import { AnalysisTypeSelector } from './AnalysisTypeSelector'

export const AnalysisStatusCard = ({ status, analyzing, onAnalyze, errorMessage, progress, progressMessage }) => {
  if (analyzing) {
    return (
      <Card className="border-primary">
        <CardContent className="p-6 text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="font-medium">{progressMessage || 'Analyzing resume...'}</p>
          {progress !== undefined && (
            <div className="mt-4 space-y-2">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div
                  className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{progress}%</p>
            </div>
          )}
          {progress === undefined && (
            <p className="text-sm text-muted-foreground mt-1">
              This may take 30-60 seconds
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (status === 'failed') {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <h3 className="font-semibold">Analysis Failed</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            {errorMessage || 'An error occurred during analysis'}
          </p>
          <AnalysisTypeSelector onSelect={onAnalyze} />
        </CardContent>
      </Card>
    )
  }

  if (status === 'processing') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="font-medium">Analysis in progress...</p>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Analysis Yet</h3>
          <p className="text-muted-foreground mb-6">
            Get AI-powered insights on your resume
          </p>
          <AnalysisTypeSelector onSelect={onAnalyze} />
        </CardContent>
      </Card>
    )
  }

  return null
}

