import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, LoadingWrapper, Button } from '../ui'
import { Award, FileText, Sparkles } from 'lucide-react'
import { formatDate } from '../../utils'

const SummaryCard = ({ title, value, icon: Icon, accent = 'blue' }) => {
  const accentMap = {
    blue: 'from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
    green: 'from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700',
    purple: 'from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700',
    amber: 'from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700',
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-blue-500/10 transition-all duration-200 hover:scale-[1.02]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground font-medium mb-2">{title}</p>
            <p className="text-3xl font-bold text-foreground leading-tight">{value}</p>
          </div>
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${accentMap[accent] || accentMap.blue} flex items-center justify-center text-white shadow-md dark:shadow-lg flex-shrink-0`}>
              <Icon className="w-4 h-4" strokeWidth={2.5} />
            </div>
        </div>
      </CardContent>
    </Card>
  )
}


export const ProfileAnalytics = ({ data, loading, error, onRetry }) => {
  return (
    <LoadingWrapper loading={loading}>
      {error ? (
        <Card className="border border-destructive/50 bg-destructive/10 dark:bg-destructive/20">
          <CardContent className="p-6 text-center">
            <p className="text-destructive dark:text-destructive-foreground mb-3">{error}</p>
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <SummaryCard title="Total Resumes" value={data?.overview?.totalResumes || 0} icon={FileText} accent="blue" />
            <SummaryCard title="Average Resume Score" value={`${data?.resumeMetrics?.averageScore || 0}%`} icon={Sparkles} accent="purple" />
            <SummaryCard title="Best Resume Score" value={`${data?.resumeMetrics?.bestScore || 0}%`} icon={Award} accent="amber" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold text-foreground">
                {Math.round(data?.overview?.profileCompletion || 0)}%
              </div>
              <p className="text-sm text-muted-foreground">
                Complete your profile to improve recruiter visibility and personalized suggestions.
              </p>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700"
                  style={{ width: `${Math.min(data?.overview?.profileCompletion || 0, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Resume Uploads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data?.highlights?.recentResumes || []).map((resume) => (
                  <div key={resume.id} className="flex justify-between items-center border border-border rounded-lg px-4 py-3 bg-card/50 dark:bg-slate-800/50 hover:bg-accent/50 transition-colors">
                    <div>
                      <p className="font-medium text-foreground">{resume.fileName}</p>
                      <p className="text-xs text-muted-foreground">Uploaded {formatDate(resume.createdAt)} · Score {resume.score}%</p>
                    </div>
                    {resume.downloadUrl && (
                      <a
                        href={resume.downloadUrl}
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))}
                {(!data?.highlights?.recentResumes || data.highlights.recentResumes.length === 0) && (
                  <p className="text-sm text-muted-foreground">No recent resumes found.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Resumes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(data?.highlights?.topResumes || []).map((resume) => (
                  <div key={resume.id} className="border border-border rounded-lg px-4 py-3 bg-card/50 dark:bg-slate-800/50 hover:bg-accent/50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-foreground">{resume.fileName}</p>
                        <p className="text-xs text-muted-foreground">v{resume.version} · Uploaded {formatDate(resume.createdAt)}</p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{resume.score}%</span>
                    </div>
                    {resume.downloadUrl && (
                      <div className="mt-2 text-xs">
                        <a
                          href={resume.downloadUrl}
                          className="text-primary hover:text-primary/80 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download version
                        </a>
                      </div>
                    )}
                  </div>
                ))}
                {(!data?.highlights?.topResumes || data.highlights.topResumes.length === 0) && (
                  <p className="text-sm text-muted-foreground">No resumes with scores yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      )}
    </LoadingWrapper>
  )
}

export default ProfileAnalytics

