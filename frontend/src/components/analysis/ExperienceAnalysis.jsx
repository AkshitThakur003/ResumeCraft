import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui';
import { Briefcase, TrendingUp, AlertCircle, Award, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const ExperienceAnalysis = ({ analysis }) => {
  if (!analysis?.experienceAnalysis) {
    return null;
  }

  const expData = analysis.experienceAnalysis;

  const getProgressionColor = (progression) => {
    switch (progression) {
      case 'positive':
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950';
      case 'regressive':
        return 'text-red-600 bg-red-50 dark:bg-red-950';
      case 'stable':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950';
    }
  };

  return (
    <div className="space-y-6">
      {/* Career Progression */}
      {expData.progression && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Career Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-lg ${getProgressionColor(expData.progression)}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold capitalize">{expData.progression} Career Path</span>
                {expData.progression === 'positive' && (
                  <TrendingUp className="w-6 h-6" />
                )}
              </div>
              <p className="text-sm mt-2 opacity-90">
                {expData.progression === 'positive'
                  ? 'Your career shows positive growth and advancement'
                  : expData.progression === 'regressive'
                  ? 'Consider highlighting career growth opportunities'
                  : 'Your career path shows stability'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      {expData.achievements && expData.achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Key Achievements ({expData.achievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expData.achievements.map((achievement, idx) => (
                <div key={idx} className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold">{achievement.position}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.company}</p>
                    </div>
                  </div>
                  <p className="text-sm mb-2">{achievement.achievement}</p>
                  {achievement.impact && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold">Impact:</span> {achievement.impact}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Experience Gaps */}
      {expData.gaps && expData.gaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-600" />
              Experience Gaps ({expData.gaps.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expData.gaps.map((gap, idx) => (
                <div key={idx} className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">
                      {gap.duration} {gap.duration === 1 ? 'month' : 'months'}
                    </span>
                    {gap.startDate && gap.endDate && (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(gap.startDate), 'MMM yyyy')} - {format(new Date(gap.endDate), 'MMM yyyy')}
                      </span>
                    )}
                  </div>
                  {gap.explanation && (
                    <p className="text-sm text-muted-foreground">{gap.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {expData.recommendations && expData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Experience Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {expData.recommendations.map((rec, idx) => (
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

