/**
 * Notification Emitter
 * Manages SSE connections for real-time notification delivery
 * @module utils/notificationEmitter
 */

const EventEmitter = require('events');
const logger = require('./logger');

class NotificationEmitter extends EventEmitter {
  constructor() {
    super();
    // Map of userId -> Set of response objects (SSE connections)
    this.connections = new Map();
    this.setMaxListeners(100); // Allow many connections
  }

  /**
   * Add a new SSE connection for a user
   * @param {string} userId - User ID
   * @param {Object} res - Express response object
   */
  addConnection(userId, res) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    
    const userConnections = this.connections.get(userId);
    userConnections.add(res);
    
    logger.debug(`Added SSE connection for user ${userId}. Total connections: ${userConnections.size}`);
    
    // Handle connection cleanup
    res.on('close', () => {
      this.removeConnection(userId, res);
    });
    
    res.on('error', (error) => {
      logger.debug(`SSE connection error for user ${userId}:`, error.message);
      this.removeConnection(userId, res);
    });
  }

  /**
   * Remove an SSE connection for a user
   * @param {string} userId - User ID
   * @param {Object} res - Express response object
   */
  removeConnection(userId, res) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(res);
      
      // Clean up empty sets
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
      
      logger.debug(`Removed SSE connection for user ${userId}. Remaining connections: ${userConnections?.size || 0}`);
    }
  }

  /**
   * Send notification to all connected clients for a user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification object
   */
  sendNotification(userId, notification) {
    const userConnections = this.connections.get(userId);
    
    if (!userConnections || userConnections.size === 0) {
      logger.debug(`No SSE connections for user ${userId}, notification will be delivered on next poll`);
      return;
    }

    const notificationData = {
      id: notification._id || notification.id,
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      createdAt: notification.createdAt || notification.timestamp || new Date().toISOString(),
      read: notification.read || false,
      metadata: notification.metadata || {},
    };

    // Send to all connections for this user
    let sentCount = 0;
    const deadConnections = [];

    userConnections.forEach((res) => {
      try {
        if (!res.headersSent) {
          return; // Connection not ready yet
        }
        
        res.write(`event: notification\n`);
        res.write(`data: ${JSON.stringify(notificationData)}\n\n`);
        sentCount++;
      } catch (error) {
        logger.debug(`Error sending notification to user ${userId}:`, error.message);
        deadConnections.push(res);
      }
    });

    // Clean up dead connections
    deadConnections.forEach((res) => {
      this.removeConnection(userId, res);
    });

    if (sentCount > 0) {
      logger.debug(`Sent notification to ${sentCount} connection(s) for user ${userId}`);
    }
  }

  /**
   * Send a ping to keep connections alive
   * @param {string} userId - User ID (optional, if not provided, pings all users)
   */
  sendPing(userId = null) {
    const usersToPing = userId ? [userId] : Array.from(this.connections.keys());
    
    usersToPing.forEach((uid) => {
      const userConnections = this.connections.get(uid);
      if (userConnections) {
        const deadConnections = [];
        
        userConnections.forEach((res) => {
          try {
            if (res.headersSent) {
              res.write(': ping\n\n');
            }
          } catch (error) {
            deadConnections.push(res);
          }
        });
        
        // Clean up dead connections
        deadConnections.forEach((res) => {
          this.removeConnection(uid, res);
        });
      }
    });
  }

  /**
   * Get connection count for a user
   * @param {string} userId - User ID
   * @returns {number} Number of active connections
   */
  getConnectionCount(userId) {
    const userConnections = this.connections.get(userId);
    return userConnections ? userConnections.size : 0;
  }

  /**
   * Get total connection count across all users
   * @returns {number} Total number of active connections
   */
  getTotalConnectionCount() {
    let total = 0;
    this.connections.forEach((connections) => {
      total += connections.size;
    });
    return total;
  }
}

// Create singleton instance
const notificationEmitter = new NotificationEmitter();

// Send ping every 30 seconds to keep connections alive
setInterval(() => {
  notificationEmitter.sendPing();
}, 30000);

module.exports = notificationEmitter;

