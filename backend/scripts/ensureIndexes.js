/**
 * Script to ensure all database indexes are created
 * Run this after deploying or when indexes are missing
 * 
 * Usage: node backend/scripts/ensureIndexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Import models to register their schemas
const Resume = require('../models/Resume');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const User = require('../models/User');
const CoverLetter = require('../models/CoverLetter');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

async function ensureIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    logger.info('✅ Connected to MongoDB');
    logger.info('📊 Creating indexes...\n');

    // Create indexes for all models
    const models = [
      { name: 'Resume', model: Resume },
      { name: 'ResumeAnalysis', model: ResumeAnalysis },
      { name: 'User', model: User },
      { name: 'CoverLetter', model: CoverLetter },
      { name: 'Notification', model: Notification },
      { name: 'AuditLog', model: AuditLog },
    ];

    for (const { name, model } of models) {
      try {
        logger.info(`Creating indexes for ${name}...`);
        await model.createIndexes();
        const indexes = await model.collection.getIndexes();
        logger.info(`✅ ${name}: ${Object.keys(indexes).length} indexes created`);
      } catch (error) {
        logger.error(`❌ Error creating indexes for ${name}:`, error.message);
      }
    }

    logger.info('\n✅ All indexes created successfully!');
    logger.info('💡 Restart your server to see performance improvements.');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error ensuring indexes:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  ensureIndexes();
}

module.exports = { ensureIndexes };

