// Mock pdf-parse to avoid file system dependencies
jest.mock('pdf-parse', () => {
  return jest.fn().mockResolvedValue({
    text: 'Sample resume text',
    numpages: 1,
  });
}, { virtual: true });

jest.mock('mammoth', () => ({
  extractRawText: jest.fn().mockResolvedValue({
    value: 'Sample DOCX text',
  }),
}), { virtual: true });

const {
  extractTextFromPDF,
  extractTextFromDOCX,
  extractTextFromTXT,
  extractTextFromResume,
} = require('../../services/resumeService');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Mock dependencies
jest.mock('pdf-parse');
jest.mock('mammoth');
jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('Resume Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractTextFromPDF', () => {
    it('should extract text from PDF buffer successfully', async () => {
      const mockPdfData = {
        text: 'John Doe\nSoftware Engineer\nExperience...',
        numpages: 2,
      };

      pdfParse.mockResolvedValue(mockPdfData);

      const buffer = Buffer.from('mock pdf content');
      const result = await extractTextFromPDF(buffer);

      expect(pdfParse).toHaveBeenCalledWith(buffer);
      expect(result.text).toBe(mockPdfData.text.trim());
      expect(result.pages).toBe(2);
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.characterCount).toBeGreaterThan(0);
    });

    it('should handle PDF parse errors', async () => {
      pdfParse.mockRejectedValue(new Error('PDF parse error'));

      const buffer = Buffer.from('invalid pdf');
      
      await expect(extractTextFromPDF(buffer)).rejects.toThrow(
        'Failed to extract text from PDF file'
      );
    });

    it('should default to 1 page if numpages is not provided', async () => {
      const mockPdfData = {
        text: 'Sample text',
      };

      pdfParse.mockResolvedValue(mockPdfData);

      const buffer = Buffer.from('mock pdf');
      const result = await extractTextFromPDF(buffer);

      expect(result.pages).toBe(1);
    });
  });

  describe('extractTextFromDOCX', () => {
    it('should extract text from DOCX buffer successfully', async () => {
      const mockDocxResult = {
        value: 'John Doe\nSoftware Engineer\nExperience...',
      };

      mammoth.extractRawText.mockResolvedValue(mockDocxResult);

      const buffer = Buffer.from('mock docx content');
      const result = await extractTextFromDOCX(buffer);

      expect(mammoth.extractRawText).toHaveBeenCalledWith({ buffer });
      expect(result.text).toBe(mockDocxResult.value.trim());
      expect(result.pages).toBeGreaterThanOrEqual(1);
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.characterCount).toBeGreaterThan(0);
    });

    it('should estimate pages based on word count', async () => {
      const longText = 'word '.repeat(600); // ~600 words = ~2 pages
      const mockDocxResult = {
        value: longText,
      };

      mammoth.extractRawText.mockResolvedValue(mockDocxResult);

      const buffer = Buffer.from('mock docx');
      const result = await extractTextFromDOCX(buffer);

      expect(result.pages).toBeGreaterThanOrEqual(1);
    });

    it('should handle DOCX extraction errors', async () => {
      mammoth.extractRawText.mockRejectedValue(new Error('DOCX parse error'));

      const buffer = Buffer.from('invalid docx');
      
      await expect(extractTextFromDOCX(buffer)).rejects.toThrow(
        'Failed to extract text from DOCX file'
      );
    });
  });

  describe('extractTextFromTXT', () => {
    it('should extract text from TXT buffer successfully', async () => {
      const textContent = 'John Doe\nSoftware Engineer\nExperience...';
      const buffer = Buffer.from(textContent, 'utf-8');

      const result = await extractTextFromTXT(buffer);

      expect(result.text).toBe(textContent.trim());
      expect(result.pages).toBeGreaterThanOrEqual(1);
      expect(result.wordCount).toBeGreaterThan(0);
      expect(result.characterCount).toBeGreaterThan(0);
    });

    it('should handle empty text files', async () => {
      const buffer = Buffer.from('   ', 'utf-8');
      const result = await extractTextFromTXT(buffer);

      expect(result.text).toBe('');
      expect(result.pages).toBe(1);
      expect(result.wordCount).toBe(0);
    });

    it('should estimate pages correctly for large text files', async () => {
      const longText = 'word '.repeat(600);
      const buffer = Buffer.from(longText, 'utf-8');
      const result = await extractTextFromTXT(buffer);

      expect(result.pages).toBeGreaterThanOrEqual(1);
      expect(result.wordCount).toBeGreaterThan(0);
    });
  });

  describe('extractTextFromResume', () => {
    it('should extract text from PDF file', async () => {
      const mockPdfData = {
        text: 'Resume content',
        numpages: 1,
      };

      pdfParse.mockResolvedValue(mockPdfData);

      const buffer = Buffer.from('pdf content');
      const result = await extractTextFromResume(buffer, 'pdf');

      expect(result.text).toBe(mockPdfData.text.trim());
      expect(pdfParse).toHaveBeenCalledWith(buffer);
    });

    it('should extract text from DOCX file', async () => {
      const mockDocxResult = {
        value: 'Resume content',
      };

      mammoth.extractRawText.mockResolvedValue(mockDocxResult);

      const buffer = Buffer.from('docx content');
      const result = await extractTextFromResume(buffer, 'docx');

      expect(result.text).toBe(mockDocxResult.value.trim());
      expect(mammoth.extractRawText).toHaveBeenCalledWith({ buffer });
    });

    it('should extract text from TXT file', async () => {
      const textContent = 'Resume content';
      const buffer = Buffer.from(textContent, 'utf-8');
      const result = await extractTextFromResume(buffer, 'txt');

      expect(result.text).toBe(textContent.trim());
    });

    it('should throw error for unsupported file type', async () => {
      const buffer = Buffer.from('content');

      await expect(extractTextFromResume(buffer, 'unsupported')).rejects.toThrow(
        'Unsupported file type'
      );
    });
  });
});

