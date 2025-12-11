const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // Configure connection pool for production scalability
    // Optimized pool sizes based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const defaultMaxPool = isProduction ? 50 : 10;
    const defaultMinPool = isProduction ? 5 : 2;
    
    const connectionOptions = {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || String(defaultMaxPool), 10), // Maximum number of connections
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || String(defaultMinPool), 10), // Minimum number of connections
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000', 10), // Timeout for server selection
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000', 10), // Socket timeout
      heartbeatFrequencyMS: parseInt(process.env.MONGODB_HEARTBEAT_FREQUENCY_MS || '10000', 10), // Heartbeat frequency
      retryWrites: true, // Enable retryable writes
      retryReads: true, // Enable retryable reads
      // Connection pool optimization
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS || '30000', 10), // Close connections after 30s of inactivity
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS || '10000', 10), // Connection timeout
      // Compression for better performance
      compressors: ['zlib'],
      zlibCompressionLevel: 6,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`MongoDB Pool Size: ${connectionOptions.minPoolSize}-${connectionOptions.maxPoolSize}`);
    
    // Monitor connection pool
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection disconnected');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
