import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '../ui'
import { Target } from 'lucide-react'
import { elegantFadeIn, staggerFadeIn } from './dashboardAnimations'

export const TopRecommendations = ({ insights }) => {
  if (!insights?.topRecommendations || insights.topRecommendations.length === 0) return null

  return (
    <motion.section 
      variants={elegantFadeIn}
      initial="initial"
      animate="animate"
      aria-label="Recommendations"
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500 -z-10" />
      <Card className="relative overflow-hidden">
        <CardHeader>
          <CardTitle>Top Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {insights.topRecommendations.map((rec, index) => (
              <motion.div 
                key={index} 
                className="flex flex-col gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 relative overflow-hidden group/item"
                variants={staggerFadeIn}
                custom={index}
                whileHover={{ 
                  scale: 1.05,
                  y: -4,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                <motion.div 
                  className="flex items-center gap-2 relative z-10"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  <motion.div 
                    className={`p-1.5 rounded shrink-0 ${
                      rec.priority === 'high' ? 'bg-red-100 dark:bg-red-900/20' :
                      rec.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/20' :
                      'bg-blue-100 dark:bg-blue-900/20'
                    }`}
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Target className={`h-4 w-4 ${
                      rec.priority === 'high' ? 'text-red-600 dark:text-red-400' :
                      rec.priority === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`} />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{rec.category || rec.title}</p>
                  </div>
                </motion.div>
                <motion.p 
                  className="text-xs text-muted-foreground relative z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  Mentioned in {rec.count} {rec.count === 1 ? 'analysis' : 'analyses'}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}

