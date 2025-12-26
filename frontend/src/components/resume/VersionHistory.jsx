import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui';
import { listAnalyses } from '../../utils/resumeAPI';
import { Clock, TrendingUp, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../ui';
import { logger } from '../../utils/logger';

export const VersionHistory = ({ resumeId, onSelectAnalysis }) => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [resumeId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await listAnalyses(resumeId, { limit: 20 });
      if (response.data.success) {
        setAnalyses(response.data.data.analyses || []);
      }
    } catch (error) {
      logger.error('Failed to load version history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Loading history...</p>
        </CardContent>
      </Card>
    );
  }

  if (analyses.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Analysis History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analyses.map((analysis, idx) => (
            <div
              key={analysis._id}
              className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onSelectAnalysis?.(analysis._id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="font-semibold capitalize">
                      {analysis.analysisType.replace(/_/g, ' ')} Analysis
                    </span>
                    {analysis.overallScore !== undefined && (
                      <span className="text-sm font-medium text-primary">
                        {analysis.overallScore}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(analysis.analysisDate), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                {analysis.overallScore !== undefined && idx > 0 && analyses[idx - 1]?.overallScore !== undefined && (
                  <div className="flex items-center gap-1">
                    {analysis.overallScore > analyses[idx - 1].overallScore ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    ) : analysis.overallScore < analyses[idx - 1].overallScore ? (
                      <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

