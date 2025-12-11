import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { ATSAnalysis } from './ATSAnalysis'
import { JDMatchingAnalysis } from './JDMatchingAnalysis'

export const AnalysisResults = ({ analysis, resume, analysisType = 'general' }) => {
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950'
    if (score >= 75) return 'text-blue-600 bg-blue-50 dark:bg-blue-950'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950'
    return 'text-red-600 bg-red-50 dark:bg-red-950'
  }

  // Render specialized analysis components based on type
  const renderSpecializedAnalysis = () => {
    switch (analysisType) {
      case 'ats':
        return <ATSAnalysis analysis={analysis} />
      case 'jd_match':
        return <JDMatchingAnalysis analysis={analysis} />
      default:
        return null
    }
  }

  const specializedView = renderSpecializedAnalysis()

  return (
    <div className="space-y-6">
      {/* Show specialized view if available, otherwise show general view */}
      {specializedView ? (
        <>
          <OverallScoreCard analysis={analysis} getScoreColor={getScoreColor} />
          {specializedView}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <RecommendationsCard recommendations={analysis.recommendations} />
          )}
        </>
      ) : (
        <GeneralAnalysisView analysis={analysis} getScoreColor={getScoreColor} />
      )}
    </div>
  )
}

const OverallScoreCard = ({ analysis, getScoreColor }) => (
  <Card>
    <CardHeader>
      <CardTitle>Overall Score</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-center">
        <div className={`relative w-32 h-32 rounded-full ${getScoreColor(analysis.overallScore)} flex items-center justify-center`}>
          <div className="text-center">
            <div className="text-4xl font-bold">{analysis.overallScore}</div>
            <div className="text-sm opacity-80">/ 100</div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

const SectionScoresCard = ({ sectionScores, getScoreColor }) => (
  <Card>
    <CardHeader>
      <CardTitle>Section Scores</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Object.entries(sectionScores).map(([section, score]) => (
          <div key={section}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium capitalize">
                {section.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className={`text-sm font-semibold ${getScoreColor(score).split(' ')[0]}`}>
                {score}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getScoreColor(score).split(' ')[1]}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const StrengthsCard = ({ strengths }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-emerald-600" />
        Strengths
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {strengths.map((strength, idx) => (
          <div key={idx} className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
            <h4 className="font-semibold mb-2">{strength.category}</h4>
            <p className="text-sm text-muted-foreground">{strength.description}</p>
            {strength.examples && strength.examples.length > 0 && (
              <ul className="mt-2 space-y-1">
                {strength.examples.map((example, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const WeaknessesCard = ({ weaknesses }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingDown className="w-5 h-5 text-red-600" />
        Areas for Improvement
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {weaknesses.map((weakness, idx) => (
          <div key={idx} className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <h4 className="font-semibold mb-2">{weakness.category}</h4>
            <p className="text-sm text-muted-foreground mb-2">{weakness.description}</p>
            {weakness.impact && (
              <p className="text-xs text-muted-foreground mb-2">Impact: {weakness.impact}</p>
            )}
            {weakness.suggestions && weakness.suggestions.length > 0 && (
              <ul className="mt-2 space-y-1">
                {weakness.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

const RecommendationsCard = ({ recommendations }) => (
  <Card>
    <CardHeader>
      <CardTitle>Recommendations</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {recommendations
          .sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 }
            return priorityOrder[a.priority] - priorityOrder[b.priority]
          })
          .map((rec, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">{rec.title}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                  rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
              {rec.actionItems && rec.actionItems.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {rec.actionItems.map((item, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
      </div>
    </CardContent>
  </Card>
)

const GeneralAnalysisView = ({ analysis, getScoreColor }) => (
  <>
    <OverallScoreCard analysis={analysis} getScoreColor={getScoreColor} />
    {analysis.sectionScores && (
      <SectionScoresCard sectionScores={analysis.sectionScores} getScoreColor={getScoreColor} />
    )}
    {analysis.strengths && analysis.strengths.length > 0 && (
      <StrengthsCard strengths={analysis.strengths} />
    )}
    {analysis.weaknesses && analysis.weaknesses.length > 0 && (
      <WeaknessesCard weaknesses={analysis.weaknesses} />
    )}
    {analysis.recommendations && analysis.recommendations.length > 0 && (
      <RecommendationsCard recommendations={analysis.recommendations} />
    )}
  </>
)

