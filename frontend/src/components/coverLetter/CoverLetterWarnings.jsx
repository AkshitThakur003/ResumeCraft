/**
 * Cover Letter Warnings Component
 * Displays all warnings, disclaimers, and safety notices
 */

import React from 'react'

export const CoverLetterWarnings = ({ coverLetter }) => {
  if (!coverLetter) return null

  return (
    <>
      {/* AI Disclaimer */}
      {coverLetter.disclaimer && (
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
      {coverLetter.metadata?.moderation && !coverLetter.metadata.moderation.safe && (
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
      {coverLetter.metadata?.hallucination && 
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
      {coverLetter.metadata?.bias && coverLetter.metadata.bias.hasBias && (
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
      {coverLetter.warnings && coverLetter.warnings.length > 0 && (
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
    </>
  )
}

