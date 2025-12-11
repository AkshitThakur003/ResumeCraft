const Resume = require('../models/Resume');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const { asyncHandler } = require('../middleware/errorHandler');
const { processResumeFile, deleteResumeFromCloudinary } = require('../services/resumeService');
const { parseTags } = require('../utils/controllerHelpers');
const logger = require('../utils/logger');

/**
 * @desc    Upload a new resume
 * @route   POST /api/resume/upload
 * @access  Private
 */
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const userId = req.user._id;
  const { title, tags } = req.body;

  try {
    // Determine file type from mimetype
    let fileType = 'txt';
    if (req.file.mimetype === 'application/pdf') {
      fileType = 'pdf';
    } else if (req.file.mimetype.includes('wordprocessingml') || req.file.mimetype.includes('msword')) {
      fileType = req.file.mimetype.includes('wordprocessingml') ? 'docx' : 'doc';
    }

    // Process resume file (extract text and upload to Cloudinary)
    const {
      url,
      publicId,
      extractedText,
      metadata,
    } = await processResumeFile(
      req.file.buffer,
      fileType,
      userId.toString(),
      req.file.originalname
    );

    // Parse tags if provided
    const parsedTags = parseTags(tags);

    // Create resume document
    const resume = await Resume.create({
      userId,
      filename: req.file.originalname,
      originalFilename: req.file.originalname,
      fileUrl: url,
      publicId,
      fileType,
      fileSize: req.file.size,
      extractedText,
      metadata,
      title: title || req.file.originalname,
      tags: parsedTags,
      status: 'completed',
    });

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        resume: resume.getSummary(),
      },
    });
  } catch (error) {
    logger.error('Error uploading resume:', error);
    
    // Clean up uploaded file if resume creation failed
    if (req.file && req.file.publicId) {
      try {
        await deleteResumeFromCloudinary(req.file.publicId);
      } catch (cleanupError) {
        logger.error('Error cleaning up file:', cleanupError);
      }
    }

    throw error;
  }
});

/**
 * @desc    Delete a resume
 * @route   DELETE /api/resume/:id
 * @access  Private
 */
const deleteResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: id, userId });

  if (!resume) {
    return res.status(404).json({
      success: false,
      message: 'Resume not found',
    });
  }

  // Delete file from Cloudinary
  if (resume.publicId) {
    try {
      await deleteResumeFromCloudinary(resume.publicId);
    } catch (error) {
      logger.error('Error deleting file from Cloudinary:', error);
      // Continue with deletion even if Cloudinary deletion fails
    }
  }

  // Delete all analyses associated with this resume
  await ResumeAnalysis.deleteMany({ resumeId: resume._id });

  // Delete resume
  await Resume.deleteOne({ _id: id });

  res.json({
    success: true,
    message: 'Resume deleted successfully',
  });
});

module.exports = {
  uploadResume,
  deleteResume,
};

