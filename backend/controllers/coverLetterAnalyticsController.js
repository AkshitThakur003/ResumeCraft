/**
 * @fileoverview Cover Letter Analytics Controller
 * @module controllers/coverLetterAnalyticsController
 * @description Analytics and cost tracking for cover letters
 */

const CoverLetter = require('../models/CoverLetter');
const { createSuccessResponse, createErrorResponse } = require('../utils/controllerHelpers');
const logger = require('../utils/logger');

/**
 * Get cost analytics for user's cover letters
 * @route GET /api/cover-letter/analytics/costs
 */
const getCostAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Aggregate cost data
    const costData = await CoverLetter.aggregate([
      {
        $match: {
          userId: userId,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$metadata.cost' },
          totalGenerations: { $sum: 1 },
          totalTokens: { $sum: '$metadata.tokensUsed' },
          totalInputTokens: { $sum: '$metadata.costBreakdown.inputTokens' },
          totalOutputTokens: { $sum: '$metadata.costBreakdown.outputTokens' },
          avgCost: { $avg: '$metadata.cost' },
          avgTokens: { $avg: '$metadata.tokensUsed' },
          cachedCount: {
            $sum: { $cond: ['$metadata.cached', 1, 0] },
          },
        },
      },
    ]);

    // Get cost by template
    const costByTemplate = await CoverLetter.aggregate([
      {
        $match: {
          userId: userId,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: '$metadata.template',
          count: { $sum: 1 },
          totalCost: { $sum: '$metadata.cost' },
          avgCost: { $avg: '$metadata.cost' },
        },
      },
    ]);

    // Get cost by tone
    const costByTone = await CoverLetter.aggregate([
      {
        $match: {
          userId: userId,
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: '$tone',
          count: { $sum: 1 },
          totalCost: { $sum: '$metadata.cost' },
          avgCost: { $avg: '$metadata.cost' },
        },
      },
    ]);

    const summary = costData[0] || {
      totalCost: 0,
      totalGenerations: 0,
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      avgCost: 0,
      avgTokens: 0,
      cachedCount: 0,
    };

    // Calculate savings from cache
    const cacheHitRate = summary.totalGenerations > 0
      ? (summary.cachedCount / summary.totalGenerations) * 100
      : 0;

    return res.json(
      createSuccessResponse({
        summary: {
          ...summary,
          cacheHitRate: Math.round(cacheHitRate * 100) / 100,
          estimatedSavings: summary.cachedCount * (summary.avgCost || 0),
        },
        byTemplate: costByTemplate,
        byTone: costByTone,
      })
    );
  } catch (error) {
    logger.error('Error getting cost analytics:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
    });
    next(error);
  }
};

/**
 * Get quality analytics
 * @route GET /api/cover-letter/analytics/quality
 */
const getQualityAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const qualityData = await CoverLetter.aggregate([
      {
        $match: { userId },
      },
      {
        $group: {
          _id: null,
          avgQualityScore: { $avg: '$metadata.qualityScore' },
          avgStructureScore: { $avg: '$metadata.structureScore' },
          avgRelevanceScore: { $avg: '$metadata.relevanceScore' },
          totalCount: { $sum: 1 },
          gradeDistribution: {
            $push: '$metadata.qualityGrade',
          },
        },
      },
    ]);

    if (qualityData.length === 0) {
      return res.json(
        createSuccessResponse({
          avgQualityScore: 0,
          avgStructureScore: 0,
          avgRelevanceScore: 0,
          totalCount: 0,
          gradeDistribution: {},
        })
      );
    }

    const data = qualityData[0];
    const gradeCounts = {};
    data.gradeDistribution.forEach(grade => {
      gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
    });

    return res.json(
      createSuccessResponse({
        avgQualityScore: Math.round(data.avgQualityScore || 0),
        avgStructureScore: Math.round(data.avgStructureScore || 0),
        avgRelevanceScore: Math.round(data.avgRelevanceScore || 0),
        totalCount: data.totalCount,
        gradeDistribution: gradeCounts,
      })
    );
  } catch (error) {
    logger.error('Error getting quality analytics:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?._id,
    });
    next(error);
  }
};

module.exports = {
  getCostAnalytics,
  getQualityAnalytics,
};

