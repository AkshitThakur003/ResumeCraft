import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent, EmptyState } from '../ui'
import { Target } from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts'
import { CHART_COLORS } from './dashboardConstants'
import { smoothScale } from './dashboardAnimations'

export const SectionScoresChart = ({ trends, loading }) => {
  const sectionScoresData = trends?.sectionScores ? [
    { subject: 'Contact', value: trends.sectionScores.contactInfo || 0 },
    { subject: 'Summary', value: trends.sectionScores.summary || 0 },
    { subject: 'Experience', value: trends.sectionScores.experience || 0 },
    { subject: 'Education', value: trends.sectionScores.education || 0 },
    { subject: 'Skills', value: trends.sectionScores.skills || 0 },
    { subject: 'Achievements', value: trends.sectionScores.achievements || 0 },
    { subject: 'Formatting', value: trends.sectionScores.formatting || 0 }
  ] : []

  return (
    <motion.section 
      variants={smoothScale}
      initial="initial"
      animate="animate"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      aria-label="Section Scores"
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg opacity-0 group-hover:opacity-20 blur transition-opacity duration-500 -z-10" />
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>Section Scores Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && sectionScoresData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse space-y-4 w-full">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          ) : sectionScoresData.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart 
                  data={sectionScoresData} 
                  margin={{ top: 20, right: 50, bottom: 20, left: 50 }}
                  outerRadius="80%"
                >
                  <PolarGrid strokeOpacity={0.3} />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    tickCount={5}
                    type="number"
                    orientation="middle"
                  />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke={CHART_COLORS.primary}
                    fill={CHART_COLORS.primary}
                    fillOpacity={0.6}
                    animationDuration={1000}
                    animationBegin={0}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [`${value}%`, 'Score']}
                    animationDuration={200}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div 
              className="h-[300px] flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <EmptyState
                icon={<Target className="h-10 w-10 text-slate-300 dark:text-slate-600" />}
                title="No section scores yet"
                description="Analyze resumes to see section-by-section score breakdowns."
                variant="minimal"
              />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.section>
  )
}

