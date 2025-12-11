/**
 * @fileoverview Cover Letter Controller
 * @module controllers/coverLetterController
 */

const CoverLetter = require('../models/CoverLetter');
const Resume = require('../models/Resume');
const { generateCoverLetter, generateMultipleVersions, getAvailableTemplates } = require('../services/coverLetterService');
const { exportToPDF, exportToDOCX } = require('../utils/coverLetterExport');
const { createSuccessResponse, createErrorResponse } = require('../utils/controllerHelpers');
const { sendSSE, setupSSEHeaders, handleSSECleanup } = require('./sseController');
const logger = require('../utils/logger');

/**
 * Generate a new cover letter
 * @route POST /api/cover-letter/generate
 */
const generateCoverLetterHandler = async (req, res, next) => {
  try {
    const { resumeId, jobTitle, companyName, jobDescription, tone, template, generateMultiple } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!resumeId || !jobTitle || !companyName || !jobDescription) {
      return res.status(400).json(
        createErrorResponse('Missing required fields: resumeId, jobTitle, companyName, and jobDescription are required')
      );
    }

    // Validate tone
    const validTones = ['professional', 'friendly', 'formal', 'enthusiastic'];
    const selectedTone = tone && validTones.includes(tone) ? tone : 'professional';
    
    // Validate template
    const validTemplates = ['traditional', 'modern', 'creative', 'technical', 'executive'];
    const selectedTemplate = template && validTemplates.includes(template) ? template : 'traditional';
    
    // Check if multiple versions requested (fixed to 2 versions only)
    const shouldGenerateMultiple = generateMultiple === true || generateMultiple === 'true';
    const versionCount = shouldGenerateMultiple ? 2 : 1; // Fixed to 2 versions only

    // Verify resume belongs to user
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) {
      return res.status(404).json(createErrorResponse('Resume not found'));
    }

    // Get resume text
    const resumeText = resume.extractedText || '';
    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json(
        createErrorResponse('Resume text is too short or not available. Please ensure the resume has been processed.')
      );
    }

    // Validate job description length
    if (jobDescription.length > 10000) {
      return res.status(400).json(
        createErrorResponse('Job description is too long. Maximum length is 10,000 characters.')
      );
    }

    // Generate cover letter
    logger.info('Generating cover letter', {
      userId,
      resumeId,
      jobTitle,
      companyName,
    });

    let result;
    
    // Generate single or multiple versions
    if (shouldGenerateMultiple && versionCount > 1) {
      const versions = await generateMultipleVersions(
        resumeText,
        jobDescription,
        jobTitle,
        companyName,
        versionCount
      );
      
      // Save all versions
      const savedVersions = [];
      for (const version of versions) {
        const { content, metadata, warnings, cached, template: versionTemplate, tone: versionTone } = version;
        const coverLetter = new CoverLetter({
          userId,
          resumeId,
          jobTitle: jobTitle.trim(),
          companyName: companyName.trim(),
          jobDescription: jobDescription.trim(),
          tone: versionTone || selectedTone,
          content,
          tags: [`template:${versionTemplate || selectedTemplate}`, 'multiple-versions'],
          metadata: {
            ...metadata,
            cached: cached || false,
            warnings: warnings || [],
            template: versionTemplate || selectedTemplate,
          },
        });
        await coverLetter.save();
        savedVersions.push(coverLetter);
      }
      
      return res.status(201).json(
        createSuccessResponse({
          versions: savedVersions,
          count: savedVersions.length,
        }, `${savedVersions.length} cover letter versions generated successfully`)
      );
    }
    
    // Generate single version
    result = await generateCoverLetter(
      resumeText,
      jobDescription,
      jobTitle,
      companyName,
      selectedTone,
      selectedTemplate
    );

    const { content, metadata, warnings, cached } = result;

    // Log warnings if any
    if (warnings && warnings.length > 0) {
      logger.warn('Cover letter generation warnings', {
        userId,
        resumeId,
        warnings,
      });
    }

    // Save cover letter
    const coverLetter = new CoverLetter({
      userId,
      resumeId,
      jobTitle: jobTitle.trim(),
      companyName: companyName.trim(),
      jobDescription: jobDescription.trim(),
      tone: selectedTone,
      content,
      metadata: {
        ...metadata,
        cached: cached || false,
        warnings: warnings || [],
        template: selectedTemplate,
      },
    });

    await coverLetter.save();

    logger.info('Cover letter generated and saved', {
      coverLetterId: coverLetter._id,
      userId,
    });

    return res.status(201).json(
      createSuccessResponse(coverLetter, 'Cover letter generated successfully')
    );
  } catch (error) {
    logger.error('Error generating cover letter:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
    });
    next(error);
  }
};

/**
 * List user's cover letters
 * @route GET /api/cover-letter/list
 */
const listCoverLetters = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', search, resumeId } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { userId };
    if (resumeId) {
      query.resumeId = resumeId;
    }
    if (search) {
      query.$or = [
        { jobTitle: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sort]: sortOrder };

    // Execute query
    const [coverLetters, total] = await Promise.all([
      CoverLetter.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: 'resumeId',
          select: 'title originalFilename',
          strictPopulate: false, // Don't throw error if resume doesn't exist
        })
        .lean(),
      CoverLetter.countDocuments(query),
    ]);

    // Ensure coverLetters is always an array
    const safeCoverLetters = Array.isArray(coverLetters) ? coverLetters : [];

    return res.json(
      createSuccessResponse({
        coverLetters: safeCoverLetters,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      })
    );
  } catch (error) {
    logger.error('Error listing cover letters:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
    });
    next(error);
  }
};

/**
 * Get a single cover letter
 * @route GET /api/cover-letter/:id
 */
const getCoverLetter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const coverLetter = await CoverLetter.findOne({ _id: id, userId })
      .populate('resumeId', 'title originalFilename fileUrl')
      .lean();

    if (!coverLetter) {
      return res.status(404).json(createErrorResponse('Cover letter not found'));
    }

    return res.json(createSuccessResponse(coverLetter));
  } catch (error) {
    logger.error('Error getting cover letter:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      coverLetterId: req.params.id,
    });
    next(error);
  }
};

/**
 * Update a cover letter
 * @route PUT /api/cover-letter/:id
 */
const updateCoverLetter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { content, isFavorite, tags, jobTitle, companyName } = req.body;

    const coverLetter = await CoverLetter.findOne({ _id: id, userId });
    if (!coverLetter) {
      return res.status(404).json(createErrorResponse('Cover letter not found'));
    }

    // Update fields
    if (content !== undefined) {
      coverLetter.content = content;
      coverLetter.metadata.wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      coverLetter.metadata.characterCount = content.length;
    }
    if (isFavorite !== undefined) {
      coverLetter.isFavorite = isFavorite;
    }
    if (tags !== undefined) {
      coverLetter.tags = Array.isArray(tags) ? tags : [tags].filter(Boolean);
    }
    if (jobTitle !== undefined) {
      coverLetter.jobTitle = jobTitle.trim();
    }
    if (companyName !== undefined) {
      coverLetter.companyName = companyName.trim();
    }

    coverLetter.updatedAt = new Date();
    await coverLetter.save();

    return res.json(createSuccessResponse(coverLetter, 'Cover letter updated successfully'));
  } catch (error) {
    logger.error('Error updating cover letter:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      coverLetterId: req.params.id,
    });
    next(error);
  }
};

/**
 * Delete a cover letter
 * @route DELETE /api/cover-letter/:id
 */
const deleteCoverLetter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const coverLetter = await CoverLetter.findOneAndDelete({ _id: id, userId });
    if (!coverLetter) {
      return res.status(404).json(createErrorResponse('Cover letter not found'));
    }

    return res.json(createSuccessResponse(null, 'Cover letter deleted successfully'));
  } catch (error) {
    logger.error('Error deleting cover letter:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      coverLetterId: req.params.id,
    });
    next(error);
  }
};

/**
 * Create a new version of a cover letter
 * @route POST /api/cover-letter/:id/version
 */
const createVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { content, tone } = req.body;

    const originalCoverLetter = await CoverLetter.findOne({ _id: id, userId })
      .populate('resumeId');
    
    if (!originalCoverLetter) {
      return res.status(404).json(createErrorResponse('Cover letter not found'));
    }

    // Get the latest version number
    const latestVersion = await CoverLetter.findOne({
      userId,
      resumeId: originalCoverLetter.resumeId,
      jobTitle: originalCoverLetter.jobTitle,
      companyName: originalCoverLetter.companyName,
    })
      .sort({ version: -1 })
      .select('version')
      .lean();

    const newVersion = (latestVersion?.version || 0) + 1;

    // Create new version
    const newCoverLetter = new CoverLetter({
      userId,
      resumeId: originalCoverLetter.resumeId._id,
      jobTitle: originalCoverLetter.jobTitle,
      companyName: originalCoverLetter.companyName,
      jobDescription: originalCoverLetter.jobDescription,
      tone: tone || originalCoverLetter.tone,
      content: content || originalCoverLetter.content,
      version: newVersion,
      metadata: {
        ...originalCoverLetter.metadata,
        wordCount: content ? content.split(/\s+/).filter(word => word.length > 0).length : originalCoverLetter.metadata.wordCount,
        characterCount: content ? content.length : originalCoverLetter.metadata.characterCount,
      },
    });

    await newCoverLetter.save();

    return res.status(201).json(
      createSuccessResponse(newCoverLetter, 'New version created successfully')
    );
  } catch (error) {
    logger.error('Error creating cover letter version:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      coverLetterId: req.params.id,
    });
    next(error);
  }
};

/**
 * Get available templates
 * @route GET /api/cover-letter/templates
 */
const getTemplates = async (req, res, next) => {
  try {
    const templates = getAvailableTemplates();
    return res.json(createSuccessResponse(templates));
  } catch (error) {
    logger.error('Error getting templates:', {
      error: error.message,
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Export cover letter to PDF or DOCX
 * @route GET /api/cover-letter/:id/export
 */
const exportCoverLetter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;
    const userId = req.user._id;

    const coverLetter = await CoverLetter.findOne({ _id: id, userId }).lean();
    if (!coverLetter) {
      return res.status(404).json(createErrorResponse('Cover letter not found'));
    }

    const safeJobTitle = coverLetter.jobTitle.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
    const filename = `cover-letter-${safeJobTitle}`;

    try {
      if (format === 'pdf') {
        const pdfBuffer = await exportToPDF(
          coverLetter.content,
          coverLetter.jobTitle,
          coverLetter.companyName,
          filename
        );
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
        return res.send(pdfBuffer);
      } else if (format === 'docx') {
        const docxBuffer = await exportToDOCX(
          coverLetter.content,
          coverLetter.jobTitle,
          coverLetter.companyName,
          filename
        );
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
        return res.send(docxBuffer);
      } else {
        // Text export
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
        return res.send(coverLetter.content);
      }
    } catch (exportError) {
      logger.error('Error during export:', {
        error: exportError.message,
        stack: exportError.stack,
        format,
        coverLetterId: id,
      });
      return res.status(500).json(
        createErrorResponse(`Failed to export cover letter as ${format.toUpperCase()}`)
      );
    }
  } catch (error) {
    logger.error('Error exporting cover letter:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      coverLetterId: req.params.id,
    });
    next(error);
  }
};

/**
 * Create a new version with AI regeneration
 * @route POST /api/cover-letter/:id/regenerate
 */
const regenerateVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { tone, template } = req.body;

    const originalCoverLetter = await CoverLetter.findOne({ _id: id, userId })
      .populate('resumeId');
    
    if (!originalCoverLetter) {
      return res.status(404).json(createErrorResponse('Cover letter not found'));
    }

    // Get resume text
    const resume = originalCoverLetter.resumeId;
    const resumeText = resume.extractedText || '';
    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json(
        createErrorResponse('Resume text is too short or not available.')
      );
    }

    // Validate tone and template
    const validTones = ['professional', 'friendly', 'formal', 'enthusiastic'];
    const selectedTone = tone && validTones.includes(tone) ? tone : originalCoverLetter.tone;
    
    const validTemplates = ['traditional', 'modern', 'creative', 'technical', 'executive'];
    const selectedTemplate = template && validTemplates.includes(template) ? template : (originalCoverLetter.metadata?.template || 'traditional');

    // Generate new version
    const { generateCoverLetter } = require('../services/coverLetterService');
    const result = await generateCoverLetter(
      resumeText,
      originalCoverLetter.jobDescription,
      originalCoverLetter.jobTitle,
      originalCoverLetter.companyName,
      selectedTone,
      selectedTemplate
    );

    const { content, metadata, warnings, cached } = result;

    // Get the latest version number
    const latestVersion = await CoverLetter.findOne({
      userId,
      resumeId: originalCoverLetter.resumeId._id || originalCoverLetter.resumeId,
      jobTitle: originalCoverLetter.jobTitle,
      companyName: originalCoverLetter.companyName,
    })
      .sort({ version: -1 })
      .select('version')
      .lean();

    const newVersion = (latestVersion?.version || 0) + 1;

    // Create new version
    const newCoverLetter = new CoverLetter({
      userId,
      resumeId: originalCoverLetter.resumeId._id || originalCoverLetter.resumeId,
      jobTitle: originalCoverLetter.jobTitle,
      companyName: originalCoverLetter.companyName,
      jobDescription: originalCoverLetter.jobDescription,
      tone: selectedTone,
      content,
      version: newVersion,
      metadata: {
        ...metadata,
        cached: cached || false,
        warnings: warnings || [],
        template: selectedTemplate,
      },
    });

    await newCoverLetter.save();

    return res.status(201).json(
      createSuccessResponse(newCoverLetter, 'New version generated successfully')
    );
  } catch (error) {
    logger.error('Error regenerating cover letter version:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
      coverLetterId: req.params.id,
    });
    next(error);
  }
};

/**
 * Generate cover letter with SSE progress updates
 * @route POST /api/cover-letter/generate-stream
 */
const generateCoverLetterStreamHandler = async (req, res, next) => {
  try {
    const { resumeId, jobTitle, companyName, jobDescription, tone, template, generateMultiple } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!resumeId || !jobTitle || !companyName || !jobDescription) {
      sendSSE(res, 'error', { message: 'Missing required fields: resumeId, jobTitle, companyName, and jobDescription are required' });
      res.end();
      return;
    }

    // Setup SSE headers
    setupSSEHeaders(res);
    handleSSECleanup(res);

    // Validate tone
    const validTones = ['professional', 'friendly', 'formal', 'enthusiastic'];
    const selectedTone = tone && validTones.includes(tone) ? tone : 'professional';
    
    // Validate template
    const validTemplates = ['traditional', 'modern', 'creative', 'technical', 'executive'];
    const selectedTemplate = template && validTemplates.includes(template) ? template : 'traditional';
    
    // Check if multiple versions requested
    const shouldGenerateMultiple = generateMultiple === true || generateMultiple === 'true';
    const versionCount = shouldGenerateMultiple ? 2 : 1;

    // Verify resume belongs to user
    sendSSE(res, 'progress', { message: 'Validating resume...', progress: 5 });
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) {
      sendSSE(res, 'error', { message: 'Resume not found' });
      res.end();
      return;
    }

    // Get resume text
    const resumeText = resume.extractedText || '';
    if (!resumeText || resumeText.trim().length < 50) {
      sendSSE(res, 'error', { message: 'Resume text is too short or not available. Please ensure the resume has been processed.' });
      res.end();
      return;
    }

    sendSSE(res, 'progress', { message: 'Starting cover letter generation...', progress: 10 });

    try {
      let result;
      
      if (shouldGenerateMultiple && versionCount > 1) {
        sendSSE(res, 'progress', { message: `Generating ${versionCount} versions...`, progress: 15 });
        const versions = await generateMultipleVersions(
          resumeText,
          jobDescription,
          jobTitle,
          companyName,
          versionCount
        );
        
        sendSSE(res, 'progress', { message: 'Saving versions...', progress: 85 });
        
        // Save all versions
        const savedVersions = [];
        for (let i = 0; i < versions.length; i++) {
          const version = versions[i];
          const { content, metadata, warnings, cached, template: versionTemplate, tone: versionTone } = version;
          const coverLetter = new CoverLetter({
            userId,
            resumeId,
            jobTitle: jobTitle.trim(),
            companyName: companyName.trim(),
            jobDescription: jobDescription.trim(),
            tone: versionTone || selectedTone,
            content,
            tags: [`template:${versionTemplate || selectedTemplate}`, 'multiple-versions'],
            metadata: {
              ...metadata,
              cached: cached || false,
              warnings: warnings || [],
              template: versionTemplate || selectedTemplate,
            },
          });
          await coverLetter.save();
          savedVersions.push(coverLetter);
          
          sendSSE(res, 'progress', { 
            message: `Version ${i + 1} of ${versions.length} saved`, 
            progress: 85 + ((i + 1) / versions.length) * 10 
          });
        }
        
        sendSSE(res, 'complete', {
          versions: savedVersions,
          count: savedVersions.length,
        });
        res.end();
      } else {
        // Generate single version with progress updates
        sendSSE(res, 'progress', { message: 'Analyzing resume content...', progress: 20 });
        
        // Import and call service with progress callback
        const generateWithProgress = async () => {
          const progressSteps = [
            { message: 'Sanitizing inputs...', progress: 25 },
            { message: 'Checking cache...', progress: 30 },
            { message: 'Generating AI content...', progress: 40 },
            { message: 'Validating content...', progress: 70 },
            { message: 'Running quality checks...', progress: 80 },
          ];
          
          for (const step of progressSteps) {
            sendSSE(res, 'progress', step);
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for visual feedback
          }
          
          return await generateCoverLetter(
            resumeText,
            jobDescription,
            jobTitle,
            companyName,
            selectedTone,
            selectedTemplate
          );
        };
        
        result = await generateWithProgress();
        const { content, metadata, warnings, cached } = result;

        sendSSE(res, 'progress', { message: 'Saving cover letter...', progress: 90 });

        // Save cover letter
        const coverLetter = new CoverLetter({
          userId,
          resumeId,
          jobTitle: jobTitle.trim(),
          companyName: companyName.trim(),
          jobDescription: jobDescription.trim(),
          tone: selectedTone,
          content,
          metadata: {
            ...metadata,
            cached: cached || false,
            warnings: warnings || [],
            template: selectedTemplate,
          },
        });

        await coverLetter.save();

        logger.info('Cover letter generated and saved', {
          coverLetterId: coverLetter._id,
          userId,
        });

        sendSSE(res, 'complete', coverLetter);
        res.end();
      }
    } catch (error) {
      logger.error('Error generating cover letter:', {
        error: error.message,
        stack: error.stack,
        userId,
      });
      sendSSE(res, 'error', { message: error.message || 'Failed to generate cover letter' });
      res.end();
    }
  } catch (error) {
    logger.error('Error in SSE cover letter generation:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
    });
    if (!res.headersSent) {
      sendSSE(res, 'error', { message: error.message || 'An unexpected error occurred' });
      res.end();
    }
  }
};

module.exports = {
  generateCoverLetterHandler,
  generateCoverLetterStreamHandler,
  listCoverLetters,
  getCoverLetter,
  updateCoverLetter,
  deleteCoverLetter,
  createVersion,
  getTemplates,
  exportCoverLetter,
  regenerateVersion,
};

