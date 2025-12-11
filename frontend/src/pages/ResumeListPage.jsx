import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { listResumes, deleteResume } from '../utils/resumeAPI';
import { useGlobalToast } from '../contexts/ToastContext';
import { Button, Card, CardHeader, CardTitle, CardContent, EmptyState, ErrorState, PageLoading, Pagination, ListSkeleton, SkeletonCard, Skeleton } from '../components/ui';
import { FileText, Plus, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { fadeInUp, staggerContainer } from '../components/ui/motionVariants';
import { ResumeFilters } from '../components/resume/ResumeFilters';
import { ResumeCard } from '../components/resume/ResumeCard';
import { ResumeSearchBar } from '../components/resume/ResumeSearchBar';

export const ResumeListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useGlobalToast();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    sort: '-uploadDate',
    view: 'grid',
    tag: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Debounce search query to avoid refreshing on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setPagination(prev => {
      if (prev.page !== 1) {
        return { ...prev, page: 1 };
      }
      return prev;
    });
  }, [debouncedSearchQuery, filters.status, filters.sort]);

  // Memoize loadResumes to prevent unnecessary re-renders
  const loadResumes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        status: filters.status,
        sort: filters.sort,
        page: pagination.page,
        limit: pagination.limit,
      };
      if (debouncedSearchQuery) params.search = debouncedSearchQuery;

      const response = await listResumes(params);
      
      if (response.data.success) {
        setResumes(response.data.data.resumes || []);
        if (response.data.data.pagination) {
          setPagination(prev => {
            const newPagination = {
              ...prev,
              total: response.data.data.pagination.total,
              pages: response.data.data.pagination.pages,
            };
            // If current page exceeds total pages, reset to page 1
            if (newPagination.page > newPagination.pages && newPagination.pages > 0) {
              newPagination.page = 1;
            }
            return newPagination;
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resumes');
      showToast('Failed to load resumes', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, filters.status, filters.sort, pagination.page, pagination.limit, showToast]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const handleDelete = async (id) => {
    try {
      await deleteResume(id);
      // If we're on the last page and it becomes empty after deletion, go to previous page
      if (resumes.length === 1 && pagination.page > 1) {
        setPagination(prev => ({ ...prev, page: prev.page - 1 }));
      } else {
        // Reload to get updated list with correct pagination
        loadResumes();
      }
      showToast('Resume deleted successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete resume', 'error');
    }
  };

  const handleView = (id) => {
    navigate(`/resumes/${id}`);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      sort: '-uploadDate',
      view: 'grid',
      tag: '',
    });
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  if (loading && resumes.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-5 w-64" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="space-y-6 sm:space-y-8"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Resumes</h1>
            <p className="text-muted-foreground">Manage and analyze your resumes</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/resumes/compare')}
            >
              Compare Resumes
            </Button>
            <Button onClick={() => navigate('/resumes/upload')}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Resume
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <ResumeSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {showFilters && (
          <ResumeFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        )}

        {resumes.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-16 h-16 text-muted-foreground" />}
            title="No resumes yet"
            description="Upload your first resume to get started with AI-powered analysis"
            action={() => navigate('/resumes/upload')}
            actionLabel="Upload Resume"
          />
        ) : (
          <>
            {filters.view === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                {resumes.map((resume, index) => (
                  <motion.div
                    key={resume._id}
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: index * 0.05 }}
                    className="w-full"
                  >
                    <ResumeCard
                      resume={resume}
                      onDelete={handleDelete}
                      onView={handleView}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <>
                <div className="space-y-3 sm:space-y-4">
                  {resumes.map((resume, index) => (
                    <motion.div
                      key={resume._id}
                      variants={fadeInUp}
                      initial="initial"
                      animate="animate"
                      transition={{ delay: index * 0.03 }}
                    >
                      <ResumeCard
                        resume={resume}
                        onDelete={handleDelete}
                        onView={handleView}
                        listView
                      />
                    </motion.div>
                  ))}
                </div>
                {pagination.pages > 1 && (
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    totalItems={pagination.total}
                    pageSize={pagination.limit}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

