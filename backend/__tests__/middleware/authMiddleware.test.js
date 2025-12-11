const { authenticateToken, authorize } = require('../../middleware/authMiddleware');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');

// Mock dependencies
jest.mock('../../models/User');
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should return 401 if no token provided', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token is required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid_token';
      jwt.verify.mockImplementation(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid access token',
      });
    });

    it('should authenticate user with valid token', async () => {
      const mockUser = { _id: 'user123', email: 'test@example.com', isActive: true };
      const decoded = { userId: 'user123' };

      req.headers.authorization = 'Bearer valid_token';
      jwt.verify.mockImplementation(() => decoded);
      
      // Mock the select chain - User.findById().select() returns the user
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authenticateToken(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      const decoded = { userId: 'user123' };

      req.headers.authorization = 'Bearer valid_token';
      jwt.verify.mockImplementation(() => decoded);
      
      // Mock the select chain - User.findById().select() returns null
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });

    it('should return 403 if user is inactive', async () => {
      const mockUser = { 
        _id: 'user123', 
        email: 'test@example.com', 
        isActive: false,
        select: jest.fn().mockReturnThis()
      };
      const decoded = { userId: 'user123' };

      req.headers.authorization = 'Bearer valid_token';
      jwt.verify.mockImplementation(() => decoded);
      
      // Mock the select chain - User.findById().select() returns the user
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    });
  });

  describe('authorize', () => {
    it('should allow access for authorized role', () => {
      req.user = { role: 'admin' };
      const middleware = authorize('admin', 'user');

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for unauthorized role', () => {
      req.user = { role: 'user' };
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insufficient permissions',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user not authenticated', () => {
      req.user = null;
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not authenticated',
      });
    });
  });
});

