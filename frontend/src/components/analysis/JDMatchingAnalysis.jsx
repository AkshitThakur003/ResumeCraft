import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui';
import { Target, CheckCircle, XCircle, TrendingUp, AlertCircle } from 'lucide-react';

export const JDMatchingAnalysis = ({ analysis }) => {
  if (!analysis?.jobDescriptionMatch) {
    return null;
  }

  const matchData = analysis.jobDescriptionMatch;
  const score = matchData.score || analysis.overallScore || 0;

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950';
    if (score >= 70) return 'text-blue-600 bg-blue-50 dark:bg-blue-950';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
    return 'text-red-600 bg-red-50 dark:bg-red-950';
  };

  return (
    <div className="space-y-6">
      {/* Match Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Job Match Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className={`relative w-32 h-32 rounded-full ${getScoreColor(score)} flex items-center justify-center`}>
              <div className="text-center">
                <div className="text-4xl font-bold">{score}%</div>
                <div className="text-sm opacity-80">Match</div>
              </div>
            </div>
          </div>
          <p className="text-center mt-4 text-sm text-muted-foreground">
            {score >= 85
              ? 'Excellent match for this position'
              : score >= 70
              ? 'Good match with some improvements needed'
              : score >= 50
              ? 'Moderate match - significant improvements recommended'
              : 'Weak match - consider tailoring your resume more'}
          </p>
        </CardContent>
      </Card>

      {/* Skills Match */}
      {matchData.skillsMatch && (
        <Card>
          <CardHeader>
            <CardTitle>Skills Match</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Match Percentage</span>
                <span className="text-sm font-semibold">
                  {matchData.skillsMatch.percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${matchData.skillsMatch.percentage || 0}%` }}
                />
              </div>
            </div>

            {matchData.skillsMatch.matched && matchData.skillsMatch.matched.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  Matched Skills ({matchData.skillsMatch.matched.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {matchData.skillsMatch.matched.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {matchData.skillsMatch.missing && matchData.skillsMatch.missing.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  Missing Skills ({matchData.skillsMatch.missing.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {matchData.skillsMatch.missing.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Consider highlighting similar skills or acquiring these skills
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Requirements Match */}
      {matchData.requirementsMatch && (
        <Card>
          <CardHeader>
            <CardTitle>Requirements Match</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Requirements Met</span>
                <span className="text-sm font-semibold">
                  {matchData.requirementsMatch.percentage || 0}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${matchData.requirementsMatch.percentage || 0}%` }}
                />
              </div>
            </div>

            {matchData.requirementsMatch.met && matchData.requirementsMatch.met.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  Requirements Met ({matchData.requirementsMatch.met.length})
                </h4>
                <ul className="space-y-1">
                  {matchData.requirementsMatch.met.map((req, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {matchData.requirementsMatch.unmet && matchData.requirementsMatch.unmet.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  Requirements Not Met ({matchData.requirementsMatch.unmet.length})
                </h4>
                <ul className="space-y-1">
                  {matchData.requirementsMatch.unmet.map((req, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {matchData.recommendations && matchData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Improvement Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {matchData.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{rec}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

