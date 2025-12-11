/**
 * Controller Helpers Unit Tests
 * Tests for utility functions used across controllers
 */

const {
  createAppError,
  safeNotify,
  throwNotFound,
  throwBadRequest,
  validateMinLength,
  findUserDocument,
  withErrorHandling,
} = require('../../utils/controllerHelpers');

describe('controllerHelpers', () => {
  describe('createAppError', () => {
    it('should create an error with message and default status code', () => {
      const error = createAppError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
    });

    it('should create an error with custom status code', () => {
      const error = createAppError('Not found', 404);
      
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
    });

    it('should attach metadata when provided', () => {
      const meta = { field: 'email', value: 'test@test.com' };
      const error = createAppError('Validation failed', 400, meta);
      
      expect(error.meta).toEqual(meta);
    });

    it('should not attach meta when not provided', () => {
      const error = createAppError('Simple error', 400);
      
      expect(error.meta).toBeUndefined();
    });
  });

  describe('safeNotify', () => {
    it('should execute notification function successfully', async () => {
      const mockNotify = jest.fn().mockResolvedValue({ id: '123' });
      
      await safeNotify(mockNotify, 'test notification');
      
      expect(mockNotify).toHaveBeenCalledTimes(1);
    });

    it('should not throw when notification fails', async () => {
      const mockNotify = jest.fn().mockRejectedValue(new Error('Notification failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await expect(safeNotify(mockNotify, 'test notification')).resolves.not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create test notification notification:',
        'Notification failed'
      );
      
      consoleSpy.mockRestore();
    });

    it('should use default context in error message', async () => {
      const mockNotify = jest.fn().mockRejectedValue(new Error('Failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await safeNotify(mockNotify);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to create notification notification:',
        'Failed'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('throwNotFound', () => {
    it('should throw 404 error with resource name', () => {
      expect(() => throwNotFound('Resume')).toThrow('Resume not found');
      
      try {
        throwNotFound('Resume');
      } catch (error) {
        expect(error.statusCode).toBe(404);
      }
    });

    it('should use default resource name when not provided', () => {
      expect(() => throwNotFound()).toThrow('Resource not found');
    });
  });

  describe('throwBadRequest', () => {
    it('should throw 400 error with message', () => {
      expect(() => throwBadRequest('Invalid input')).toThrow('Invalid input');
      
      try {
        throwBadRequest('Invalid input');
      } catch (error) {
        expect(error.statusCode).toBe(400);
      }
    });

    it('should attach metadata when provided', () => {
      try {
        throwBadRequest('Validation failed', { field: 'email' });
      } catch (error) {
        expect(error.meta).toEqual({ field: 'email' });
      }
    });
  });

  describe('validateMinLength', () => {
    it('should not throw for valid length', () => {
      expect(() => validateMinLength('This is a valid string', 'Field', 5)).not.toThrow();
    });

    it('should throw for empty value', () => {
      expect(() => validateMinLength('', 'Description', 10))
        .toThrow('Description must be at least 10 characters long');
    });

    it('should throw for null value', () => {
      expect(() => validateMinLength(null, 'Text', 5))
        .toThrow('Text must be at least 5 characters long');
    });

    it('should throw for value shorter than minimum', () => {
      expect(() => validateMinLength('short', 'Content', 10))
        .toThrow('Content must be at least 10 characters long');
    });

    it('should trim whitespace before checking length', () => {
      expect(() => validateMinLength('   ab   ', 'Field', 5))
        .toThrow('Field must be at least 5 characters long');
    });
  });

  describe('findUserDocument', () => {
    it('should return document when found', async () => {
      const mockDoc = { _id: '123', user: 'user1', name: 'Test' };
      const mockModel = {
        findOne: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(mockDoc),
        }),
      };

      const result = await findUserDocument(mockModel, '123', 'user1', 'Resume', { lean: true });
      
      expect(result).toEqual(mockDoc);
      expect(mockModel.findOne).toHaveBeenCalledWith({ _id: '123', user: 'user1' });
    });

    it('should throw 404 when document not found', async () => {
      const mockModel = {
        findOne: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          lean: jest.fn().mockResolvedValue(null),
        }),
      };

      await expect(findUserDocument(mockModel, '123', 'user1', 'Job', { lean: true }))
        .rejects.toThrow('Job not found');
    });

    it('should apply populate option when provided', async () => {
      const mockDoc = { _id: '123' };
      const populateMock = jest.fn().mockReturnThis();
      const mockModel = {
        findOne: jest.fn().mockReturnValue({
          populate: populateMock,
          lean: jest.fn().mockResolvedValue(mockDoc),
        }),
      };

      await findUserDocument(mockModel, '123', 'user1', 'Note', { 
        populate: 'user job',
        lean: true 
      });
      
      expect(populateMock).toHaveBeenCalledWith('user job');
    });
  });

  describe('withErrorHandling', () => {
    it('should return result on success', async () => {
      const action = jest.fn().mockResolvedValue({ data: 'success' });
      
      const result = await withErrorHandling(action);
      
      expect(result).toEqual({ data: 'success' });
    });

    it('should run cleanup on error', async () => {
      const action = jest.fn().mockRejectedValue(new Error('Action failed'));
      const cleanup = jest.fn().mockResolvedValue();
      
      await expect(withErrorHandling(action, { cleanup })).rejects.toThrow('Action failed');
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('should not fail if cleanup fails', async () => {
      const action = jest.fn().mockRejectedValue(new Error('Action failed'));
      const cleanup = jest.fn().mockRejectedValue(new Error('Cleanup failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await expect(withErrorHandling(action, { cleanup })).rejects.toThrow('Action failed');
      expect(consoleSpy).toHaveBeenCalledWith('Cleanup failed:', 'Cleanup failed');
      
      consoleSpy.mockRestore();
    });

    it('should call onError handler when provided', async () => {
      const action = jest.fn().mockRejectedValue(new Error('Action failed'));
      const onError = jest.fn().mockReturnValue({ fallback: true });
      
      const result = await withErrorHandling(action, { onError });
      
      expect(result).toEqual({ fallback: true });
      expect(onError).toHaveBeenCalled();
    });
  });
});

