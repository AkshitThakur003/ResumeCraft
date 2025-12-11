const User = require('../models/User');
const Resume = require('../models/Resume');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Get dashboard data
 * @route   GET /api/user/dashboard
 * @access  Private
 */
const getDashboardData = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get statistics in parallel
    const [
      resumeCount, 
      analysisCount, 
      recentResumes, 
      recentAnalyses,
      resumesLast7Days,
      analysesLast7Days,
      resumesLast30Days,
      analysesLast30Days
    ] = await Promise.all([
      Resume.countDocuments({ userId }),
      ResumeAnalysis.countDocuments({ userId }),
      Resume.find({ userId })
        .sort({ uploadDate: -1 })
        .limit(20) // Reduced from 50 to 20 for better performance
        .select('originalFilename uploadDate status title')
        .lean(), // Use lean() for faster queries
      ResumeAnalysis.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20) // Reduced from 50 to 20 for better performance
        .select('resumeId analysisType status createdAt overallScore')
        .lean(), // Use lean() instead of populate for better performance
      Resume.countDocuments({ userId, uploadDate: { $gte: last7Days } }),
      ResumeAnalysis.countDocuments({ userId, createdAt: { $gte: last7Days } }),
      Resume.countDocuments({ userId, uploadDate: { $gte: last30Days } }),
      ResumeAnalysis.countDocuments({ userId, createdAt: { $gte: last30Days } })
    ]);

    // Build recent activities
    const activities = [];

    // Add resume uploads as activities
    recentResumes.forEach(resume => {
      activities.push({
        id: `resume-${resume._id}`,
        type: 'resume_upload',
        title: `Uploaded ${resume.title || resume.originalFilename}`,
        description: `Resume ${resume.status === 'completed' ? 'processed' : resume.status}`,
        timestamp: resume.uploadDate || resume.createdAt,
        metadata: {
          resumeId: resume._id,
          status: resume.status
        }
      });
    });

    // Fetch resume data separately for better performance (instead of populate)
    const resumeIds = recentAnalyses
      .map(a => a.resumeId)
      .filter(id => id); // Filter out null/undefined
    
    const resumesMap = new Map();
    if (resumeIds.length > 0) {
      const resumes = await Resume.find({ _id: { $in: resumeIds } })
        .select('_id originalFilename title')
        .lean();
      resumes.forEach(r => resumesMap.set(r._id.toString(), r));
    }

    // Add analyses as activities
    recentAnalyses.forEach(analysis => {
      const resume = analysis.resumeId ? resumesMap.get(analysis.resumeId.toString()) : null;
      if (resume) {
        activities.push({
          id: `analysis-${analysis._id}`,
          type: 'analysis',
          title: `Analyzed ${resume.title || resume.originalFilename || 'resume'}`,
          description: `${analysis.analysisType} analysis ${analysis.status === 'completed' ? 'completed' : analysis.status}`,
          timestamp: analysis.createdAt,
          metadata: {
            analysisId: analysis._id,
            resumeId: resume._id,
            score: analysis.overallScore,
            type: analysis.analysisType
          }
        });
      }
    });

    // Sort activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    // Return all activities (pagination handled on frontend)
    const recentActivities = activities;

    // Calculate additional stats in parallel
    const [
      completedResumes,
      primaryResume,
      scoreStats
    ] = await Promise.all([
      Resume.countDocuments({ userId, status: 'completed' }),
      Resume.findOne({ userId, isPrimary: true }).lean(),
      // Combined aggregation for avg and best score (more efficient)
      ResumeAnalysis.aggregate([
        { 
          $match: { 
            userId: userId, 
            status: 'completed', 
            overallScore: { $exists: true, $ne: null } 
          } 
        },
        { 
          $group: { 
            _id: null, 
            avgScore: { $avg: '$overallScore' },
            bestScore: { $max: '$overallScore' },
            count: { $sum: 1 }
          } 
        }
      ])
    ]);
    
    const avgScore = scoreStats.length > 0 ? scoreStats[0].avgScore : null;
    const bestScore = scoreStats.length > 0 ? scoreStats[0].bestScore : null;

    // Score trends over time (last 30 days)
    const scoreTrends = await ResumeAnalysis.aggregate([
      {
        $match: {
          userId: userId,
          status: 'completed',
          overallScore: { $exists: true, $ne: null },
          createdAt: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          avgScore: { $avg: '$overallScore' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Section scores breakdown
    const sectionScoresData = await ResumeAnalysis.aggregate([
      {
        $match: {
          userId: userId,
          status: 'completed',
          sectionScores: { $exists: true }
        }
      },
      {
        $project: {
          contactInfo: { $ifNull: ['$sectionScores.contactInfo', 0] },
          summary: { $ifNull: ['$sectionScores.summary', 0] },
          experience: { $ifNull: ['$sectionScores.experience', 0] },
          education: { $ifNull: ['$sectionScores.education', 0] },
          skills: { $ifNull: ['$sectionScores.skills', 0] },
          achievements: { $ifNull: ['$sectionScores.achievements', 0] },
          formatting: { $ifNull: ['$sectionScores.formatting', 0] }
        }
      },
      {
        $group: {
          _id: null,
          avgContactInfo: { $avg: '$contactInfo' },
          avgSummary: { $avg: '$summary' },
          avgExperience: { $avg: '$experience' },
          avgEducation: { $avg: '$education' },
          avgSkills: { $avg: '$skills' },
          avgAchievements: { $avg: '$achievements' },
          avgFormatting: { $avg: '$formatting' }
        }
      }
    ]);

    // Analysis type distribution
    const analysisTypeDistribution = await ResumeAnalysis.aggregate([
      {
        $match: { userId: userId, status: 'completed' }
      },
      {
        $group: {
          _id: '$analysisType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate improvement trend (compare last 7 days vs previous 7 days)
    // If previous 7 days has no data, compare against overall average for better UX
    const [recentAvgScore, previousAvgScore, overallAvgScore] = await Promise.all([
      ResumeAnalysis.aggregate([
        {
          $match: {
            userId: userId,
            status: 'completed',
            overallScore: { $exists: true, $ne: null },
            createdAt: { $gte: last7Days }
          }
        },
        { $group: { _id: null, avgScore: { $avg: '$overallScore' } } }
      ]),
      ResumeAnalysis.aggregate([
        {
          $match: {
            userId: userId,
            status: 'completed',
            overallScore: { $exists: true, $ne: null },
            createdAt: { $gte: previous7Days, $lt: last7Days }
          }
        },
        { $group: { _id: null, avgScore: { $avg: '$overallScore' } } }
      ]),
      // Get overall average as fallback for comparison
      ResumeAnalysis.aggregate([
        {
          $match: {
            userId: userId,
            status: 'completed',
            overallScore: { $exists: true, $ne: null }
          }
        },
        { $group: { _id: null, avgScore: { $avg: '$overallScore' } } }
      ])
    ]);

    const recentAvg = recentAvgScore.length > 0 ? recentAvgScore[0].avgScore : null;
    const prevAvg = previousAvgScore.length > 0 ? previousAvgScore[0].avgScore : null;
    const overallAvg = overallAvgScore.length > 0 ? overallAvgScore[0].avgScore : null;
    
    // Calculate improvement: prefer previous 7 days comparison, fallback to overall average
    let scoreImprovement = null;
    if (recentAvg !== null) {
      if (prevAvg !== null) {
        // Compare against previous 7 days (preferred)
        scoreImprovement = recentAvg - prevAvg;
      } else if (overallAvg !== null) {
        // Compare against overall average if previous 7 days has no data
        scoreImprovement = recentAvg - overallAvg;
      }
    }

    // Get top recommendations
    const topRecommendations = await ResumeAnalysis.aggregate([
      {
        $match: {
          userId: userId,
          status: 'completed',
          recommendations: { $exists: true, $ne: [] }
        }
      },
      { $unwind: '$recommendations' },
      {
        $group: {
          _id: '$recommendations.category',
          count: { $sum: 1 },
          priority: { $first: '$recommendations.priority' },
          title: { $first: '$recommendations.title' }
        }
      },
      { $sort: { count: -1, priority: 1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalResumes: resumeCount,
          totalAnalyses: analysisCount,
          completedResumes,
          averageScore: avgScore !== null ? Math.round(avgScore) : null,
          bestScore: bestScore !== null ? Math.round(bestScore) : null,
          profileCompletion: req.user.profileCompletionPercentage || 0,
          hasPrimaryResume: !!primaryResume,
          // Activity trends
          resumesLast7Days,
          analysesLast7Days,
          resumesLast30Days,
          analysesLast30Days,
          // Improvement metrics
          scoreImprovement: scoreImprovement !== null ? Math.round(scoreImprovement * 10) / 10 : null,
          recentAverageScore: recentAvg !== null ? Math.round(recentAvg) : null
        },
        trends: {
          scoreTrends: scoreTrends.map(item => ({
            date: item._id,
            score: Math.round(item.avgScore),
            count: item.count
          })),
          sectionScores: sectionScoresData.length > 0 ? {
            contactInfo: Math.round(sectionScoresData[0].avgContactInfo || 0),
            summary: Math.round(sectionScoresData[0].avgSummary || 0),
            experience: Math.round(sectionScoresData[0].avgExperience || 0),
            education: Math.round(sectionScoresData[0].avgEducation || 0),
            skills: Math.round(sectionScoresData[0].avgSkills || 0),
            achievements: Math.round(sectionScoresData[0].avgAchievements || 0),
            formatting: Math.round(sectionScoresData[0].avgFormatting || 0)
          } : null,
          analysisTypeDistribution: analysisTypeDistribution.map(item => ({
            type: item._id || 'general',
            count: item.count
          }))
        },
        insights: {
          topRecommendations: topRecommendations.map(item => ({
            category: item._id,
            count: item.count,
            priority: item.priority,
            title: item.title
          }))
        },
        activities: recentActivities.map(activity => ({
          ...activity,
          timestamp: activity.timestamp.toISOString()
        }))
      },
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
    });
  }
});

/**
 * @desc    Get user statistics
 * @route   GET /api/user/stats
 * @access  Private
 */
const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    res.json({
      success: true,
      data: {
        profileCompletion: req.user.profileCompletionPercentage || 50,
        taskCompletion: 0, // Placeholder
      },
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user stats',
    });
  }
});

const getProfileAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const overview = {
      profileCompletion: req.user.profileCompletionPercentage || 0,
    };

    res.json({
      success: true,
      data: {
        overview,
      },
    });
  } catch (error) {
    console.error('Profile analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load profile analytics',
    });
  }
});

module.exports = {
  getDashboardData,
  getUserStats,
  getProfileAnalytics,
};

