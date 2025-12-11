import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { listCoverLetters, deleteCoverLetter } from '../utils/coverLetterAPI';
import { useGlobalToast } from '../contexts/ToastContext';
import { Button, Card, CardHeader, CardTitle, CardContent, LoadingWrapper, Input } from '../components/ui';
import { FileText, Plus, Search, Trash2, Star, Eye } from 'lucide-react';
import { fadeInUp } from '../components/ui/motionVariants';

export const CoverLetterListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useGlobalToast();
  
  const [loading, setLoading] = useState(true);
  const [coverLetters, setCoverLetters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLetters, setFilteredLetters] = useState([]);

  useEffect(() => {
    loadCoverLetters();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = coverLetters.filter(letter =>
        letter.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        letter.companyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLetters(filtered);
    } else {
      setFilteredLetters(coverLetters);
    }
  }, [searchTerm, coverLetters]);

  const loadCoverLetters = async () => {
    try {
      setLoading(true);
      const response = await listCoverLetters({ limit: 100 });
      if (response.data.success) {
        setCoverLetters(response.data.data.coverLetters || []);
      }
    } catch (error) {
      showToast('Failed to load cover letters', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this cover letter?')) {
      return;
    }

    try {
      await deleteCoverLetter(id);
      showToast('Cover letter deleted successfully', 'success');
      loadCoverLetters();
    } catch (error) {
      showToast('Failed to delete cover letter', 'error');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingWrapper />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cover Letters</h1>
            <p className="text-muted-foreground mt-1">
              Manage and generate AI-powered cover letters
            </p>
          </div>
          <Button onClick={() => navigate('/cover-letters/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Generate New
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by job title or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Cover Letters Grid */}
        {filteredLetters.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No cover letters found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try a different search term' : 'Generate your first cover letter to get started'}
              </p>
              {!searchTerm && (
                <Button onClick={() => navigate('/cover-letters/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Cover Letter
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLetters.map((letter) => (
              <motion.div
                key={letter._id}
                variants={fadeInUp}
                whileHover={{ y: -4 }}
                className="cursor-pointer"
                onClick={() => navigate(`/cover-letters/${letter._id}`)}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{letter.jobTitle}</CardTitle>
                        <p className="text-sm text-muted-foreground">{letter.companyName}</p>
                      </div>
                      {letter.isFavorite && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="capitalize">{letter.tone}</span>
                        <span>v{letter.version}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{letter.metadata?.wordCount || 0} words</span>
                        <span>{new Date(letter.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/cover-letters/${letter._id}`);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => handleDelete(letter._id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

