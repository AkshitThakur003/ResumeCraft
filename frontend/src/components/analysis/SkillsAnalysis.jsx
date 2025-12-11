import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui';
import { Award, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export const SkillsAnalysis = ({ analysis }) => {
  if (!analysis?.skillsAnalysis) {
    return null;
  }

  const skillsData = analysis.skillsAnalysis;

  return (
    <div className="space-y-6">
      {/* Detected Skills */}
      {skillsData.detected && skillsData.detected.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Detected Skills ({skillsData.detected.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skillsData.detected.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categorized Skills */}
      {skillsData.categorized && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skillsData.categorized.technical && skillsData.categorized.technical.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Technical Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skillsData.categorized.technical.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {skillsData.categorized.soft && skillsData.categorized.soft.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Soft Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skillsData.categorized.soft.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {skillsData.categorized.industry && skillsData.categorized.industry.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Industry-Specific</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skillsData.categorized.industry.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {skillsData.categorized.other && skillsData.categorized.other.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Other Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skillsData.categorized.other.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Missing Skills */}
      {skillsData.missing && skillsData.missing.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Recommended Skills ({skillsData.missing.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Consider adding these skills to strengthen your resume
            </p>
            <div className="flex flex-wrap gap-2">
              {skillsData.missing.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {skillsData.recommendations && skillsData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Skills Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {skillsData.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
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

