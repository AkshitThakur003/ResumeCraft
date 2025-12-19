/**
 * Cover Letter Page
 * Main page for generating and managing cover letters
 */

import React from 'react'
import { motion } from 'framer-motion'
import { LoadingWrapper } from '../components/ui'
import { fadeInUp } from '../components/ui/motionVariants'
import { useCoverLetter } from '../hooks/useCoverLetter'
import {
  CoverLetterHeader,
  CoverLetterForm,
  CoverLetterViewer,
  CoverLetterDetails
} from '../components/coverLetter'

export const CoverLetterPage = () => {
  const {
    loading,
    generating,
    generationProgress,
    progressMessage,
    coverLetter,
    resumes,
    templates,
    content,
    formData,
    setContent,
    setFormData,
    handleGenerate,
    handleSave,
    handleDelete,
    handleCopy,
    handleDownload,
    handleToggleFavorite,
    handleCreateVersion,
    handleRegenerate,
  } = useCoverLetter()

  if (loading && !coverLetter) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingWrapper />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="space-y-6"
      >
        <CoverLetterHeader
          coverLetter={coverLetter}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onToggleFavorite={handleToggleFavorite}
        />

        {!coverLetter ? (
          <CoverLetterForm
            formData={formData}
            setFormData={setFormData}
            resumes={resumes}
            templates={templates}
            generating={generating}
            generationProgress={generationProgress}
            progressMessage={progressMessage}
            onGenerate={handleGenerate}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CoverLetterViewer
                coverLetter={coverLetter}
                content={content}
                setContent={setContent}
                loading={loading}
                generating={generating}
                onSave={handleSave}
                onRegenerate={handleRegenerate}
                onCreateVersion={handleCreateVersion}
              />
            </div>

            <div className="space-y-4">
              <CoverLetterDetails coverLetter={coverLetter} />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
