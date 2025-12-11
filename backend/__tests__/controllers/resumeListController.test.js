const { listResumes } = require('../../controllers/resumeListController');
const Resume = require('../../models/Resume');
const ResumeAnalysis = require('../../models/ResumeAnalysis');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../../config/constants');

// Mock dependencies
jest.mock('../../models/Resume');
jest.mock('../../models/ResumeAnalysis');

describe('Resume List Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: {
        _id: 'user123',
      },
      query: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('listResumes', () => {
    it('should list resumes for authenticated user', async () => {
      const mockResumes = [
        { _id: 'resume1', title: 'Resume 1', userId: 'user123' },
        { _id: 'resume2', title: 'Resume 2', userId: 'user123' },
      ];

      Resume.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockResumes),
      });

      Resume.countDocuments.mockResolvedValue(2);
      ResumeAnalysis.aggregate.mockResolvedValue([]);

      await listResumes(req, res, next);

      if (next.mock.calls.length > 0 && next.mock.calls[0][0]) {
        throw next.mock.calls[0][0];
      }

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(Resume.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(res.json).toHaveBeenCalled();
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.success).toBe(true);
      expect(jsonCall.data.resumes).toBeDefined();
      expect(jsonCall.data.pagination).toBeDefined();
    });

    it('should filter resumes by status', async () => {
      req.query = { status: 'active' };

      Resume.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      Resume.countDocuments.mockResolvedValue(0);
      ResumeAnalysis.aggregate.mockResolvedValue([]);

      await listResumes(req, res, next);

      if (next.mock.calls.length > 0 && next.mock.calls[0][0]) {
        throw next.mock.calls[0][0];
      }

      expect(Resume.find).toHaveBeenCalledWith({
        userId: 'user123',
        status: 'active',
      });
    });

    it('should search resumes by query parameter', async () => {
      req.query = { search: 'engineer' };

      Resume.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      Resume.countDocuments.mockResolvedValue(0);
      ResumeAnalysis.aggregate.mockResolvedValue([]);

      await listResumes(req, res, next);

      if (next.mock.calls.length > 0 && next.mock.calls[0][0]) {
        throw next.mock.calls[0][0];
      }

      expect(Resume.find).toHaveBeenCalledWith({
        userId: 'user123',
        $or: expect.arrayContaining([
          { title: { $regex: 'engineer', $options: 'i' } },
          { originalFilename: { $regex: 'engineer', $options: 'i' } },
        ]),
      });
    });

    it('should handle pagination correctly', async () => {
      req.query = { page: 2, limit: 10 };

      Resume.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      Resume.countDocuments.mockResolvedValue(25);
      ResumeAnalysis.aggregate.mockResolvedValue([]);

      await listResumes(req, res, next);

      // Wait for any async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      if (next.mock.calls.length > 0 && next.mock.calls[0][0]) {
        throw next.mock.calls[0][0];
      }

      expect(res.json).toHaveBeenCalled();
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.success).toBe(true);
      expect(jsonCall.data.pagination).toMatchObject({
        page: 2,
        pageSize: 10,
        total: 25,
        totalPages: 3,
      });
    });

    it('should include latest analysis for each resume', async () => {
      const mockResumes = [
        { _id: 'resume1', title: 'Resume 1' },
        { _id: 'resume2', title: 'Resume 2' },
      ];

      const mockAnalyses = [
        {
          resumeId: 'resume1',
          overallScore: 85,
          analysisType: 'ats',
          analysisDate: new Date(),
        },
      ];

      Resume.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockResumes),
      });

      Resume.countDocuments.mockResolvedValue(2);
      ResumeAnalysis.aggregate.mockResolvedValue(mockAnalyses);

      await listResumes(req, res, next);

      if (next.mock.calls.length > 0 && next.mock.calls[0][0]) {
        throw next.mock.calls[0][0];
      }

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(ResumeAnalysis.aggregate).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
      const jsonCall = res.json.mock.calls[0][0];
      if (jsonCall.data.resumes && jsonCall.data.resumes.length > 0) {
        expect(jsonCall.data.resumes[0]).toMatchObject({
          _id: 'resume1',
        });
      }
    });

    it('should respect max page size limit', async () => {
      req.query = { limit: 1000 }; // Exceeds MAX_PAGE_SIZE

      Resume.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

      Resume.countDocuments.mockResolvedValue(0);
      ResumeAnalysis.aggregate.mockResolvedValue([]);

      await listResumes(req, res, next);

      if (next.mock.calls.length > 0 && next.mock.calls[0][0]) {
        throw next.mock.calls[0][0];
      }

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      // The limit should be capped at MAX_PAGE_SIZE
      expect(res.json).toHaveBeenCalled();
      const jsonCall = res.json.mock.calls[0][0];
      if (jsonCall.data && jsonCall.data.pagination) {
        expect(jsonCall.data.pagination.pageSize).toBeLessThanOrEqual(
          MAX_PAGE_SIZE
        );
      }
    });
  });
});

