/**
 * Cover Letter Details Component
 * Displays cover letter metadata and metrics in sidebar
 */

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui'

export const CoverLetterDetails = ({ coverLetter }) => {
  if (!coverLetter) return null

  return (
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
        
        {/* Quality Score */}
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
  )
}

