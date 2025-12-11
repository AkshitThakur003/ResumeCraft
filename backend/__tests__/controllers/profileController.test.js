const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
} = require('../../controllers/profileController');
const User = require('../../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../../config/cloudinary');

// Mock dependencies
jest.mock('../../models/User');
jest.mock('../../config/cloudinary');

describe('Profile Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: {
        _id: 'user123',
        getPublicProfile: jest.fn().mockReturnValue({
          _id: 'user123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        }),
      },
      body: {},
      file: null,
    };
    // Ensure req.user._id is a string or ObjectId-like
    if (typeof req.user._id !== 'string') {
      req.user._id = String(req.user._id);
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      await getProfile(req, res, next);

      if (next.mock.calls.length > 0 && next.mock.calls[0][0]) {
        throw next.mock.calls[0][0];
      }

      expect(req.user.getPublicProfile).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: expect.objectContaining({
            _id: 'user123',
          }),
        },
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUser = {
        _id: 'user123',
        firstName: 'Old',
        lastName: 'Name',
        phone: '1234567890',
        location: 'Old Location',
        bio: 'Old bio',
        experience: 'Old experience',
        education: 'Old education',
        save: jest.fn().mockResolvedValue(),
        getPublicProfile: jest.fn().mockReturnValue({
          _id: 'user123',
          firstName: 'New',
          lastName: 'Name',
        }),
      };

      User.findById.mockResolvedValue(mockUser);
      req.body = {
        firstName: 'New',
        lastName: 'Name',
      };

      await updateProfile(req, res, next);

      if (next.mock.calls.length > 0 && next.mock.calls[0][0]) {
        throw next.mock.calls[0][0];
      }

      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.firstName).toBe('New');
      expect(mockUser.lastName).toBe('Name');
      expect(mockUser.save).toHaveBeenCalled();
      
      // Wait a bit for async operations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(res.json).toHaveBeenCalled();
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.success).toBe(true);
      expect(jsonCall.data.user).toBeDefined();
    });

    it('should update multiple profile fields', async () => {
      const mockUser = {
        _id: 'user123',
        firstName: '',
        lastName: '',
        phone: '',
        location: '',
        bio: '',
        save: jest.fn().mockResolvedValue(),
        getPublicProfile: jest.fn().mockReturnValue({
          _id: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          phone: '1234567890',
        }),
      };

      User.findById.mockResolvedValue(mockUser);
      req.body = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '1234567890',
        location: 'New York',
        bio: 'Test bio',
      };

      await updateProfile(req, res, next);

      if (next.mock.calls.length > 0 && next.mock.calls[0][0]) {
        throw next.mock.calls[0][0];
      }

      expect(mockUser.firstName).toBe('John');
      expect(mockUser.lastName).toBe('Doe');
      expect(mockUser.phone).toBe('1234567890');
      expect(mockUser.location).toBe('New York');
      expect(mockUser.bio).toBe('Test bio');
    });
  });

  describe('uploadProfilePicture', () => {
    it('should return 400 if no file is uploaded', async () => {
      req.file = null;

      await uploadProfilePicture(req, res, next);

      if (next.mock.calls.length > 0 && next.mock.calls[0][0]) {
        throw next.mock.calls[0][0];
      }

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No file uploaded',
      });
    });

    it('should upload profile picture successfully', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        mimetype: 'image/png',
        originalname: 'profile.png',
      };

      const mockUser = {
        _id: 'user123',
        profilePicture: null,
        save: jest.fn().mockResolvedValue(),
        getPublicProfile: jest.fn().mockReturnValue({
          _id: 'user123',
          profilePicture: {
            url: 'https://cloudinary.com/image.jpg',
          },
        }),
      };

      const cloudinaryResponse = {
        public_id: 'public_id_123',
        secure_url: 'https://cloudinary.com/image.jpg',
      };

      req.file = mockFile;
      User.findById.mockResolvedValue(mockUser);
      uploadToCloudinary.mockResolvedValue(cloudinaryResponse);

      await uploadProfilePicture(req, res, next);

      // Wait for any async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      if (next.mock.calls.length > 0 && next.mock.calls[0][0]) {
        throw next.mock.calls[0][0];
      }

      expect(uploadToCloudinary).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });

    it('should delete old profile picture when uploading new one', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        mimetype: 'image/png',
        originalname: 'profile.png',
      };

      const mockUser = {
        _id: 'user123',
        profilePicture: {
          publicId: 'old_public_id',
          url: 'https://cloudinary.com/old.jpg',
        },
        save: jest.fn().mockResolvedValue(),
        getPublicProfile: jest.fn().mockReturnValue({
          _id: 'user123',
          profilePicture: {
            url: 'https://cloudinary.com/new.jpg',
          },
        }),
      };

      const cloudinaryResponse = {
        public_id: 'new_public_id',
        secure_url: 'https://cloudinary.com/new.jpg',
      };

      req.file = mockFile;
      User.findById.mockResolvedValue(mockUser);
      uploadToCloudinary.mockResolvedValue(cloudinaryResponse);
      deleteFromCloudinary.mockResolvedValue();

      await uploadProfilePicture(req, res, next);

      // Wait for any async operations
      await new Promise(resolve => setTimeout(resolve, 10));

      if (next.mock.calls.length > 0 && next.mock.calls[0][0]) {
        throw next.mock.calls[0][0];
      }

      expect(deleteFromCloudinary).toHaveBeenCalledWith('old_public_id');
      expect(uploadToCloudinary).toHaveBeenCalled();
    });
  });
});

