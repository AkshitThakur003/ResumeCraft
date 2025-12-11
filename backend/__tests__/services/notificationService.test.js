const {
  notifyResumeAnalysisComplete,
  createNotification,
} = require('../../services/notificationService');
const Notification = require('../../models/Notification');
const User = require('../../models/User');

// Mock dependencies
jest.mock('../../models/Notification');
jest.mock('../../models/User');

describe('Notification Service', () => {
  let mockNotificationInstance;
  let mockSave;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Notification instance
    mockSave = jest.fn().mockResolvedValue(undefined);
    mockNotificationInstance = {
      save: mockSave,
      _id: 'notification123',
      user: null,
      type: null,
      title: null,
      message: null,
      metadata: null,
    };
    
    // Mock Notification constructor
    Notification.mockImplementation((data) => {
      Object.assign(mockNotificationInstance, data);
      return mockNotificationInstance;
    });
    
    // Mock Notification.findOne (for duplicate checking)
    Notification.findOne = jest.fn().mockResolvedValue(null);
  });

  describe('notifyResumeAnalysisComplete', () => {
    it('should create a notification for resume analysis completion', async () => {
      const userId = 'user123';
      const resumeId = 'resume123';
      const fileName = 'resume.pdf';
      const analysisType = 'resume-only';

      User.findById.mockResolvedValue({ _id: userId, email: 'test@example.com' });

      await notifyResumeAnalysisComplete(userId, resumeId, fileName, analysisType);

      // Verify Notification constructor was called with correct data
      expect(Notification).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userId,
          type: 'success',
          title: 'Resume Analysis Complete',
          metadata: expect.objectContaining({
            type: 'resume_analysis',
            resumeId,
            fileName,
            analysisType,
          }),
        })
      );
      
      // Verify save was called
      expect(mockSave).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const userId = 'user123';
      const resumeId = 'resume123';
      const fileName = 'resume.pdf';
      const analysisType = 'resume-only';

      mockSave.mockRejectedValue(new Error('Database error'));

      // Should throw on save error
      await expect(
        notifyResumeAnalysisComplete(userId, resumeId, fileName, analysisType)
      ).rejects.toThrow();
    });
  });

  describe('createNotification', () => {
    it('should create a notification with all options', async () => {
      const userId = 'user123';
      const notificationData = {
        userId,
        type: 'info',
        title: 'Test Notification',
        message: 'Test message',
        metadata: { test: true },
        preventDuplicates: false,
      };

      await createNotification(notificationData);

      expect(Notification).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userId,
          type: 'info',
          title: 'Test Notification',
          message: 'Test message',
          metadata: { test: true },
          read: false,
        })
      );

      expect(mockSave).toHaveBeenCalled();
    });

    it('should prevent duplicates when enabled', async () => {
      const userId = 'user123';
      const existingNotification = { _id: 'existing123' };
      
      Notification.findOne.mockResolvedValue(existingNotification);

      const result = await createNotification({
        userId,
        title: 'Duplicate Test',
        type: 'info',
        preventDuplicates: true,
      });

      expect(result).toEqual(existingNotification);
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should throw error if userId or title missing', async () => {
      await expect(
        createNotification({ userId: 'user123' })
      ).rejects.toThrow('userId and title are required');

      await expect(
        createNotification({ title: 'Test' })
      ).rejects.toThrow('userId and title are required');
    });
  });
});

