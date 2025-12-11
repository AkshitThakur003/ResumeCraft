import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent, EmptyState } from '../ui'
import { BarChart3 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts'
import { CHART_COLORS } from './dashboardConstants'
import { smoothScale } from './dashboardAnimations'

export const SectionPerformanceChart = ({ trends, loading, onChartClick }) => {
  return (
    <motion.section 
      variants={smoothScale}
      initial="initial"
      animate="animate"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      aria-label="Section Performance"
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg opacity-0 group-hover:opacity-20 blur transition-opacity duration-500 -z-10" />
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>Section Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !trends?.sectionScores ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse space-y-4 w-full">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          ) : trends?.sectionScores ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={[
                    { name: 'Contact', score: trends.sectionScores.contactInfo || 0 },
                    { name: 'Summary', score: trends.sectionScores.summary || 0 },
                    { name: 'Experience', score: trends.sectionScores.experience || 0 },
                    { name: 'Education', score: trends.sectionScores.education || 0 },
                    { name: 'Skills', score: trends.sectionScores.skills || 0 },
                    { name: 'Achievements', score: trends.sectionScores.achievements || 0 },
                    { name: 'Formatting', score: trends.sectionScores.formatting || 0 }
                  ]} 
                  layout="vertical"
                  onClick={onChartClick}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]} 
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    stroke="currentColor"
                    strokeOpacity={0.5}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={80}
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    stroke="currentColor"
                    strokeOpacity={0.5}
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
                  <Bar 
                    dataKey="score" 
                    fill={CHART_COLORS.primary}
                    radius={[0, 4, 4, 0]}
                    animationDuration={1000}
                    animationBegin={0}
                  />
                </BarChart>
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
                icon={<BarChart3 className="h-10 w-10 text-slate-300 dark:text-slate-600" />}
                title="No performance data yet"
                description="Analyze resumes to see section performance metrics."
                variant="minimal"
              />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.section>
  )
}

