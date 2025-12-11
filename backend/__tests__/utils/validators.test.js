const {
  validatePassword,
  passwordValidator,
} = require('../../utils/validators');

describe('Validators', () => {
  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result1 = validatePassword('Password123!');
      expect(result1.valid).toBe(true);
      
      const result2 = validatePassword('StrongP@ssw0rd');
      expect(result2.valid).toBe(true);
    });

    it('should reject weak passwords', () => {
      const result1 = validatePassword('short');
      expect(result1.valid).toBe(false);
      expect(result1.message).toContain('at least 8 characters');
      
      const result2 = validatePassword('12345678');
      expect(result2.valid).toBe(false);
      
      const result3 = validatePassword('password');
      expect(result3.valid).toBe(false);
      
      const result4 = validatePassword('');
      expect(result4.valid).toBe(false);
      expect(result4.message).toContain('required');
    });

    it('should require uppercase letter', () => {
      const result = validatePassword('password123!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('uppercase');
    });

    it('should require lowercase letter', () => {
      const result = validatePassword('PASSWORD123!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('lowercase');
    });

    it('should require number', () => {
      const result = validatePassword('Password!');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('number');
    });

    it('should require special character', () => {
      const result = validatePassword('Password123');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('special character');
    });
  });

  describe('passwordValidator', () => {
    it('should return true for valid password', () => {
      expect(passwordValidator('Password123!')).toBe(true);
    });

    it('should throw error for invalid password', () => {
      expect(() => passwordValidator('short')).toThrow();
      expect(() => passwordValidator('password')).toThrow();
    });
  });
});

