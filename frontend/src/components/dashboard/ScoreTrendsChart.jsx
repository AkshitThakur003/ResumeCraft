import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent, EmptyState } from '../ui'
import { BarChart3 } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { CHART_COLORS } from './dashboardConstants'
import { smoothScale } from './dashboardAnimations'

export const ScoreTrendsChart = ({ trends, loading, onChartClick }) => {
  return (
    <motion.section 
      variants={smoothScale}
      initial="initial"
      animate="animate"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      aria-label="Score Trends"
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-0 group-hover:opacity-20 blur transition-opacity duration-500 -z-10" />
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>Score Trends (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !trends ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse space-y-4 w-full">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          ) : trends?.scoreTrends && trends.scoreTrends.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart 
                  data={trends.scoreTrends}
                  onClick={onChartClick}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'currentColor', fontSize: 12 }}
                    stroke="currentColor"
                    strokeOpacity={0.5}
                  />
                  <YAxis 
                    domain={[0, 100]} 
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
                    formatter={(value, name) => [`${value}%`, name]}
                    animationDuration={200}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke={CHART_COLORS.primary} 
                    strokeWidth={2.5}
                    name="Average Score"
                    dot={{ r: 4, fill: CHART_COLORS.primary }}
                    activeDot={{ r: 7, fill: CHART_COLORS.primary, strokeWidth: 2 }}
                    animationDuration={1000}
                    animationBegin={0}
                  />
                </LineChart>
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
                title="No score data yet"
                description="Upload and analyze resumes to see score trends over time."
                variant="minimal"
              />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.section>
  )
}

