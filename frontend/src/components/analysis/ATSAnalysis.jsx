import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui';
import { AlertTriangle, CheckCircle, TrendingUp, FileCheck } from 'lucide-react';

export const ATSAnalysis = ({ analysis }) => {
  if (!analysis?.atsAnalysis) {
    return null;
  }

  const atsData = analysis.atsAnalysis;
  const score = atsData.score || analysis.overallScore || 0;

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950';
    if (score >= 75) return 'text-blue-600 bg-blue-50 dark:bg-blue-950';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
    return 'text-red-600 bg-red-50 dark:bg-red-950';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      default:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
    }
  };

  return (
    <div className="space-y-6">
      {/* ATS Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary" />
            ATS Compatibility Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className={`relative w-32 h-32 rounded-full ${getScoreColor(score)} flex items-center justify-center`}>
              <div className="text-center">
                <div className="text-4xl font-bold">{score}</div>
                <div className="text-sm opacity-80">/ 100</div>
              </div>
            </div>
          </div>
          <p className="text-center mt-4 text-sm text-muted-foreground">
            {score >= 90
              ? 'Excellent ATS compatibility'
              : score >= 75
              ? 'Good ATS compatibility'
              : score >= 60
              ? 'Fair ATS compatibility'
              : 'Needs improvement for ATS systems'}
          </p>
        </CardContent>
      </Card>

      {/* Keywords */}
      {atsData.keywords && (
        <Card>
          <CardHeader>
            <CardTitle>Keyword Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {atsData.keywords.found && atsData.keywords.found.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Found Keywords ({atsData.keywords.found.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {atsData.keywords.found.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {atsData.keywords.missing && atsData.keywords.missing.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Missing Keywords ({atsData.keywords.missing.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {atsData.keywords.missing.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-sm"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Consider adding these keywords naturally to improve ATS matching
                </p>
              </div>
            )}

            {atsData.keywords.density && (
              <div>
                <h4 className="font-semibold mb-2">Keyword Density</h4>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${Math.min(atsData.keywords.density * 10, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {atsData.keywords.density.toFixed(2)}% density
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Issues */}
      {atsData.issues && atsData.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              ATS Issues ({atsData.issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {atsData.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-4 border-l-4 rounded ${getSeverityColor(issue.severity)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold capitalize mb-1">
                        {issue.type} Issue
                      </h4>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                      {issue.location && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Location: {issue.location}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                      issue.severity === 'critical'
                        ? 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : issue.severity === 'high'
                        ? 'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        : 'bg-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {issue.severity}
                    </span>
                  </div>
                  {issue.fix && (
                    <div className="mt-3 p-3 bg-background rounded border">
                      <p className="text-xs font-semibold mb-1">Fix:</p>
                      <p className="text-sm">{issue.fix}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimizations */}
      {atsData.optimizations && atsData.optimizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Optimization Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atsData.optimizations.map((opt, idx) => (
                <div key={idx} className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                  <h4 className="font-semibold mb-1">{opt.category}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{opt.suggestion}</p>
                  {opt.impact && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      Impact: {opt.impact}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

