import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent, EmptyState } from '../ui'
import { BarChart3 } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts'
import { CHART_COLORS, PIE_COLORS } from './dashboardConstants'
import { smoothScale } from './dashboardAnimations'

export const AnalysisTypeChart = ({ trends, loading }) => {
  return (
    <motion.section 
      variants={smoothScale}
      initial="initial"
      animate="animate"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      aria-label="Analysis Types"
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg opacity-0 group-hover:opacity-20 blur transition-opacity duration-500 -z-10" />
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>Analysis Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && !trends ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse space-y-4 w-full">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
              </div>
            </div>
          ) : trends?.analysisTypeDistribution && trends.analysisTypeDistribution.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={trends.analysisTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) => `${type}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    animationDuration={1000}
                    animationBegin={0}
                  >
                    {trends.analysisTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value, name, props) => [
                      `${value} (${((value / trends.analysisTypeDistribution.reduce((sum, item) => sum + item.count, 0)) * 100).toFixed(1)}%)`,
                      props.payload.type
                    ]}
                    animationDuration={200}
                  />
                  <Legend />
                </PieChart>
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
                title="No analysis data yet"
                description="Run different types of analyses to see the distribution."
                variant="minimal"
              />
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.section>
  )
}

