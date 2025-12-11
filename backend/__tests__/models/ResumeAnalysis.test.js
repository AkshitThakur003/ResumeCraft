const mongoose = require('mongoose');
const ResumeAnalysis = require('../../models/ResumeAnalysis');

describe('ResumeAnalysis Model', () => {
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
      await ResumeAnalysis.deleteMany({});
    } catch (error) {
      // Ignore errors
    }
  });

  it('should create a resume analysis with required fields', async () => {
    if (!isMongoConnected()) {
      console.log('Skipping test: MongoDB not connected');
      return;
    }
    
    const analysisData = {
      resumeId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      analysisType: 'ats',
      status: 'completed',
      overallScore: 85,
    };

    const analysis = new ResumeAnalysis(analysisData);
    await analysis.save();

    expect(analysis.resumeId.toString()).toBe(analysisData.resumeId.toString());
    expect(analysis.userId.toString()).toBe(analysisData.userId.toString());
    expect(analysis.analysisType).toBe('ats');
    expect(analysis.status).toBe('completed');
    expect(analysis.overallScore).toBe(85);
    expect(analysis.analysisDate).toBeInstanceOf(Date);
  });

  // Note: Remaining tests require MongoDB connection
  // They will be skipped automatically if MongoDB is not available
});
