import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getResume, analyzeResume, analyzeResumeStream, getAnalysis, pollAnalysisStatus, listAnalyses } from '../utils/resumeAPI';
import { useGlobalToast } from '../contexts/ToastContext';
import { Button, Card, CardHeader, CardTitle, CardContent, PageLoading, ErrorState } from '../components/ui';
import { ArrowLeft, Download } from 'lucide-react';
import { fadeInUp } from '../components/ui/motionVariants';
import { AnalysisTypeSelector } from '../components/analysis';
import { AnalysisResults } from '../components/analysis/AnalysisResults';
import { AnalysisStatusCard } from '../components/analysis/AnalysisStatusCard';
import { VersionHistory } from '../components/resume/VersionHistory';
import { exportAnalysisToPDF } from '../utils/exportAnalysis';

export const ResumeAnalysisPage = () => {
  const { id, analysisId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useGlobalToast();
  
  const [resume, setResume] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState(null);
  const [cancelStream, setCancelStream] = useState(null);

  const loadData = useCallback(async () => {
    // ✅ Create AbortController for request cancellation
    const abortController = new AbortController();
    
    try {
      setLoading(true);
      setError(null);

      // ✅ Load resume and analysis in parallel for faster loading
      // This reduces total load time from 2x network latency to 1x
      const [resumeRes, analysisRes] = await Promise.allSettled([
        getResume(id, { signal: abortController.signal }),
        analysisId ? getAnalysis(id, analysisId, { signal: abortController.signal }) : Promise.resolve(null)
      ]);

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return;
      }

      // Process resume result
      if (resumeRes.status === 'fulfilled' && resumeRes.value.data.success) {
        setResume(resumeRes.value.data.data.resume);
        
        // Process analysis result
        if (analysisRes.status === 'fulfilled' && analysisRes.value?.data?.success) {
          setAnalysis(analysisRes.value.data.data.analysis);
        } else if (resumeRes.value.data.data.latestAnalysis) {
          // Fallback to latest analysis from resume data
          setAnalysis(resumeRes.value.data.data.latestAnalysis);
        }
      } else if (resumeRes.status === 'rejected') {
        // Ignore abort errors
        if (resumeRes.reason?.name === 'AbortError' || resumeRes.reason?.code === 'ERR_CANCELED') {
          return;
        }
        throw resumeRes.reason;
      }
    } catch (err) {
      // Ignore abort errors
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return;
      }
      setError(err.response?.data?.message || 'Failed to load resume');
      showToast('Failed to load resume', 'error');
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }

    // Return cleanup function
    return () => {
      abortController.abort();
    };
  }, [id, analysisId, showToast]);

  useEffect(() => {
    const abortController = new AbortController();
    let isMounted = true;

    const fetchData = async () => {
      try {
        await loadData();
      } catch (err) {
        if (isMounted && err.name !== 'AbortError') {
          // Error already handled in loadData
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [loadData]);

  // Cleanup SSE stream on unmount
  useEffect(() => {
    return () => {
      if (cancelStream) {
        cancelStream();
      }
    };
  }, [cancelStream]);


  const handleAnalyze = async (analysisType = 'general', jobDescription = null) => {
    // Cancel any existing stream
    if (cancelStream) {
      cancelStream();
    }

    try {
      setAnalyzing(true);
      setError(null);
      setAnalysisProgress(0);
      setProgressMessage('Initializing...');

      // Use SSE stream for real-time progress updates
      const cancelFn = analyzeResumeStream(
        id,
        { analysisType, jobDescription },
        {
          onAnalysisId: (newAnalysisId) => {
            navigate(`/resumes/${id}/analysis/${newAnalysisId}`);
          },
          onProgress: (progress, message) => {
            setAnalysisProgress(progress);
            setProgressMessage(message || 'Processing...');
          },
          onComplete: (completedAnalysis) => {
            setAnalysis(completedAnalysis);
            setAnalysisProgress(100);
            setProgressMessage('Complete!');
            setAnalyzing(false);
            showToast('Analysis completed!', 'success');
            setCancelStream(null);
          },
          onError: (err) => {
            setError(err.message || 'Analysis failed');
            setAnalyzing(false);
            setAnalysisProgress(0);
            setProgressMessage('');
            showToast('Analysis failed', 'error');
            setCancelStream(null);
          },
        }
      );

      setCancelStream(() => cancelFn);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start analysis');
      setAnalyzing(false);
      setAnalysisProgress(0);
      setProgressMessage('');
      showToast('Failed to start analysis', 'error');
    }
  };

  if (loading) {
    return <PageLoading message="Loading analysis..." />;
  }

  if (error && !resume) {
    return (
      <ErrorState
        title="Failed to load resume"
        message={error}
        onRetry={loadData}
      />
    );
  }

  if (!resume) {
    return (
      <ErrorState
        title="Resume not found"
        message="The resume you're looking for doesn't exist"
        onRetry={() => navigate('/resumes')}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial="initial"
        animate="animate"
        variants={fadeInUp}
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
          
          <div className="flex gap-3">
            {analysis && analysis.status === 'completed' && (
              <Button
                variant="outline"
                onClick={() => exportAnalysisToPDF(analysis, resume, resume.title || resume.originalFilename)}
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            )}
            {!analyzing && (
              <AnalysisTypeSelector
                onSelect={(analysisType, jobDescription) => handleAnalyze(analysisType, jobDescription)}
                disabled={analyzing}
              />
            )}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold mb-2">{resume.title || resume.originalFilename}</h1>
          <p className="text-muted-foreground">
            Analysis Results {analysis && `• ${new Date(analysis.analysisDate).toLocaleDateString()}`}
          </p>
        </div>

        <AnalysisStatusCard
          status={analysis?.status}
          analyzing={analyzing}
          onAnalyze={(analysisType, jobDescription) => handleAnalyze(analysisType, jobDescription)}
          errorMessage={analysis?.errorMessage}
          progress={analysisProgress}
          progressMessage={progressMessage}
        />

        {analysis && analysis.status === 'completed' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <AnalysisResults analysis={analysis} resume={resume} analysisType={analysis.analysisType || 'general'} />
            </div>
            <div className="lg:col-span-1">
              <VersionHistory
                resumeId={id}
                onSelectAnalysis={(analysisId) => navigate(`/resumes/${id}/analysis/${analysisId}`)}
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};


