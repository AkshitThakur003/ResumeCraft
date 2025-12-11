import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { listResumes, compareResumes } from '../utils/resumeAPI';
import { useGlobalToast } from '../contexts/ToastContext';
import { Button, Card, CardHeader, CardTitle, CardContent, PageLoading, ErrorState } from '../components/ui';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, FileText, Sparkles } from 'lucide-react';
import { fadeInUp, staggerContainer } from '../components/ui/motionVariants';

export const ResumeComparisonPage = () => {
  const navigate = useNavigate();
  const { showToast } = useGlobalToast();
  const [resumes, setResumes] = useState([]);
  const [selectedResumes, setSelectedResumes] = useState([null, null]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listResumes({ limit: 100 });
      if (response.data.success) {
        setResumes(response.data.data.resumes || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resumes');
      showToast('Failed to load resumes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!selectedResumes[0] || !selectedResumes[1]) {
      showToast('Please select 2 resumes to compare', 'error');
      return;
    }

    try {
      setComparing(true);
      setError(null);
      const response = await compareResumes(selectedResumes);
      if (response.data.success) {
        setComparison(response.data.data.comparison);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to compare resumes');
      showToast('Failed to compare resumes', 'error');
    } finally {
      setComparing(false);
    }
  };

  if (loading) {
    return <PageLoading message="Loading resumes..." />;
  }

  if (error && resumes.length === 0) {
    return (
      <ErrorState
        title="Failed to load resumes"
        message={error}
        onRetry={loadResumes}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/resumes')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resumes
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">Compare Resumes</h1>
          <p className="text-muted-foreground">Compare two resumes side-by-side</p>
        </div>

        {!comparison ? (
          <Card>
            <CardHeader>
              <CardTitle>Select Resumes to Compare</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Resume 1</label>
                  <select
                    value={selectedResumes[0] || ''}
                    onChange={(e) => setSelectedResumes([e.target.value || null, selectedResumes[1]])}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select a resume...</option>
                    {resumes
                      .filter(r => r._id !== selectedResumes[1])
                      .map((resume) => (
                        <option key={resume._id} value={resume._id}>
                          {resume.title || resume.originalFilename}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Resume 2</label>
                  <select
                    value={selectedResumes[1] || ''}
                    onChange={(e) => setSelectedResumes([selectedResumes[0], e.target.value || null])}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select a resume...</option>
                    {resumes
                      .filter(r => r._id !== selectedResumes[0])
                      .map((resume) => (
                        <option key={resume._id} value={resume._id}>
                          {resume.title || resume.originalFilename}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleCompare}
                disabled={!selectedResumes[0] || !selectedResumes[1] || comparing}
                className="w-full"
              >
                {comparing ? 'Comparing...' : 'Compare Resumes'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ComparisonResults
            comparison={comparison}
            onReset={() => {
              setComparison(null);
              setSelectedResumes([null, null]);
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

const ComparisonResults = ({ comparison, onReset }) => {
  const navigate = useNavigate();

  const getScoreDiff = (diff) => {
    if (!diff && diff !== 0) return null;
    if (diff > 0) return { value: `+${diff.toFixed(1)}`, color: 'text-emerald-600', icon: TrendingUp };
    if (diff < 0) return { value: diff.toFixed(1), color: 'text-red-600', icon: TrendingDown };
    return { value: '0', color: 'text-gray-600', icon: Minus };
  };

  const renderScore = (score, diff = null) => {
    const diffInfo = getScoreDiff(diff);
    return (
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{score || 'N/A'}</span>
        {diffInfo && (
          <span className={`text-sm flex items-center gap-1 ${diffInfo.color}`}>
            <diffInfo.icon className="w-4 h-4" />
            {diffInfo.value}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Comparison Results</h2>
        <Button variant="outline" onClick={onReset}>
          Compare Different Resumes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resume 1 */}
        <Card>
          <CardHeader>
            <CardTitle>{comparison.resume1.title || comparison.resume1.originalFilename}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {comparison.resume1.analysis ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                  {renderScore(
                    comparison.resume1.analysis.overallScore,
                    comparison.differences?.overallScore
                  )}
                </div>

                {comparison.resume1.analysis.sectionScores && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Section Scores</p>
                    {Object.entries(comparison.resume1.analysis.sectionScores).map(([section, score]) => (
                      <div key={section}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm capitalize">
                            {section.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          {renderScore(
                            score,
                            comparison.differences?.sectionScores?.[section]
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No analysis available</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate(`/resumes/${comparison.resume1._id}`)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Resume
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resume 2 */}
        <Card>
          <CardHeader>
            <CardTitle>{comparison.resume2.title || comparison.resume2.originalFilename}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {comparison.resume2.analysis ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
                  {renderScore(
                    comparison.resume2.analysis.overallScore,
                    -comparison.differences?.overallScore
                  )}
                </div>

                {comparison.resume2.analysis.sectionScores && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Section Scores</p>
                    {Object.entries(comparison.resume2.analysis.sectionScores).map(([section, score]) => (
                      <div key={section}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm capitalize">
                            {section.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          {renderScore(
                            score,
                            -comparison.differences?.sectionScores?.[section]
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No analysis available</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate(`/resumes/${comparison.resume2._id}`)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Resume
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

