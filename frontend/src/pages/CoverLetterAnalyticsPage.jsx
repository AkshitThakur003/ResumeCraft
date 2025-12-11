import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getCostAnalytics, getQualityAnalytics } from '../utils/coverLetterAPI';
import { useGlobalToast } from '../contexts/ToastContext';
import { Card, CardHeader, CardTitle, CardContent, LoadingWrapper } from '../components/ui';
import { TrendingUp, DollarSign, Award, BarChart3 } from 'lucide-react';
import { fadeInUp } from '../components/ui/motionVariants';

export const CoverLetterAnalyticsPage = () => {
  const { showToast } = useGlobalToast();
  const [loading, setLoading] = useState(true);
  const [costData, setCostData] = useState(null);
  const [qualityData, setQualityData] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [costResponse, qualityResponse] = await Promise.all([
        getCostAnalytics(),
        getQualityAnalytics(),
      ]);

      if (costResponse.data.success) {
        setCostData(costResponse.data.data);
      }
      if (qualityResponse.data.success) {
        setQualityData(qualityResponse.data.data);
      }
    } catch (error) {
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingWrapper />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold">Cover Letter Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track costs, quality, and performance metrics
          </p>
        </div>

        {/* Cost Analytics */}
        {costData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${(costData.summary?.totalCost || 0).toFixed(4)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {costData.summary?.totalGenerations || 0} generations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Avg Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${(costData.summary?.avgCost || 0).toFixed(4)}</p>
                <p className="text-xs text-muted-foreground mt-1">Per generation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Cache Hit Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{costData.summary?.cacheHitRate || 0}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ${(costData.summary?.estimatedSavings || 0).toFixed(4)} saved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(costData.summary?.totalTokens || 0).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Used</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quality Analytics */}
        {qualityData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Average Quality Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{qualityData.avgQualityScore || 0}/100</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {qualityData.totalCount || 0} cover letters
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Structure Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{qualityData.avgStructureScore || 0}/100</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Relevance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{qualityData.avgRelevanceScore || 0}/100</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Grade Distribution */}
        {qualityData && qualityData.gradeDistribution && (
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                {Object.entries(qualityData.gradeDistribution).map(([grade, count]) => (
                  <div key={grade} className="text-center">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{grade}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

