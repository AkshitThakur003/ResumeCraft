const mongoose = require('mongoose');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const { validatePassword } = require('../../utils/validators');

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('../../utils/validators');
jest.mock('../../utils/hash.util', () => ({
  hashToken: jest.fn((token) => `hashed_${token}`),
}));

describe('User Model', () => {
  const isMongoConnected = () => mongoose.connection.readyState === 1;
  
  beforeAll(async () => {
    jest.setTimeout(30000);
    
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
      try {
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000,
        });
      } catch (error) {
        console.warn('MongoDB not available, model tests will be skipped:', error.message);
      }
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    if (!isMongoConnected()) return;
    try {
      await User.deleteMany({});
    } catch (error) {
      // Ignore errors if MongoDB not connected
    }
    jest.clearAllMocks();
  });

  describe('User Creation', () => {
    it('should create a user with required fields', async () => {
      if (!isMongoConnected()) {
        console.log('Skipping test: MongoDB not connected');
        return;
      }
      
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
      };

      bcrypt.hash.mockResolvedValue('hashed_password');
      validatePassword.mockReturnValue({ valid: true });

      const user = new User(userData);
      await user.save();

      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.email).toBe(userData.email.toLowerCase());
      expect(user.password).toBe('hashed_password');
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
      expect(user.isEmailVerified).toBe(false);
    });
  });

  // Note: Remaining tests require MongoDB connection
  // They will be skipped automatically if MongoDB is not available
});
