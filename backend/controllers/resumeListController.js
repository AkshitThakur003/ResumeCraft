const Resume = require('../models/Resume');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const { asyncHandler } = require('../middleware/errorHandler');
const { parseTags, calculatePagination } = require('../utils/controllerHelpers');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../config/constants');

/**
 * @desc    Get all resumes for the authenticated user
 * @route   GET /api/resume/list
 * @access  Private
 */
const listResumes = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    status,
    sort = '-uploadDate',
    limit = DEFAULT_PAGE_SIZE,
    page = 1,
    search,
  } = req.query;

  // Build query
  const query = { userId };
  
  if (status && status !== 'all') {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { originalFilename: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  // Pagination
  const { pageSize, skip } = calculatePagination(page, limit, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);

  // Execute query
  const [resumes, total] = await Promise.all([
    Resume.find(query)
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Resume.countDocuments(query),
  ]);

  // Get latest analysis for each resume (optimized with aggregation)
  const resumeIds = resumes.map(r => r._id);
  
  // Batch fetch all latest analyses in one query instead of N queries
  // Only run if we have resume IDs to avoid unnecessary query
  let latestAnalyses = [];
  if (resumeIds.length > 0) {
    latestAnalyses = await ResumeAnalysis.aggregate([
      {
        $match: {
          resumeId: { $in: resumeIds },
          status: 'completed',
        },
      },
      {
        $sort: { analysisDate: -1 },
      },
      {
        $group: {
          _id: '$resumeId',
          latestAnalysis: { $first: '$$ROOT' },
        },
      },
      {
        $project: {
          resumeId: '$_id',
          overallScore: '$latestAnalysis.overallScore',
          analysisType: '$latestAnalysis.analysisType',
          analysisDate: '$latestAnalysis.analysisDate',
        },
      },
    ]).allowDiskUse(true); // Allow disk use for large aggregations
  }

  // Create a map for quick lookup
  const analysisMap = new Map(
    latestAnalyses.map(a => [a.resumeId.toString(), a])
  );

  // Combine resumes with their analyses
  const resumesWithAnalysis = resumes.map(resume => ({
    ...resume,
    latestAnalysis: analysisMap.get(resume._id.toString()) || null,
  }));

  res.json({
    success: true,
    data: {
      resumes: resumesWithAnalysis,
      pagination: {
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / pageSize),
        pageSize: pageSize,
      },
    },
  });
});

/**
 * @desc    Get a single resume by ID
 * @route   GET /api/resume/:id
 * @access  Private
 */
const getResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const resume = await Resume.findOne({ _id: id, userId });

  if (!resume) {
    return res.status(404).json({
      success: false,
      message: 'Resume not found',
    });
  }

  // Get latest analysis
  const latestAnalysis = await ResumeAnalysis.findOne({
    resumeId: resume._id,
    status: 'completed',
  })
    .sort({ analysisDate: -1 })
    .lean();

  res.json({
    success: true,
    data: {
      resume,
      latestAnalysis: latestAnalysis || null,
    },
  });
});

/**
 * @desc    Update resume metadata
 * @route   PUT /api/resume/:id
 * @access  Private
 */
const updateResume = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const { title, tags, isPrimary } = req.body;

  const resume = await Resume.findOne({ _id: id, userId });

  if (!resume) {
    return res.status(404).json({
      success: false,
      message: 'Resume not found',
    });
  }

  // Update fields
  if (title !== undefined) resume.title = title;
  if (tags !== undefined) {
    resume.tags = parseTags(tags);
  }
  
  // Handle primary flag
  if (isPrimary === true) {
    // Set all other resumes to non-primary
    await Resume.updateMany(
      { userId, _id: { $ne: id } },
      { $set: { isPrimary: false } }
    );
    resume.isPrimary = true;
  } else if (isPrimary === false) {
    resume.isPrimary = false;
  }

  await resume.save();

  res.json({
    success: true,
    message: 'Resume updated successfully',
    data: {
      resume: resume.getSummary(),
    },
  });
});

module.exports = {
  listResumes,
  getResume,
  updateResume,
};

