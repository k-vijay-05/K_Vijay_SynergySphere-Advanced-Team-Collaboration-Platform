// Redis Model - Example implementation for caching and session management
// NOTE: This is for demonstration purposes only - not integrated with actual code

const Redis = require('ioredis');

// Redis client configuration (example)
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

class RedisModel {
  // Session Management
  static async setUserSession(userId, sessionData, expirationSeconds = 3600) {
    const key = `session:user:${userId}`;
    const data = JSON.stringify({
      ...sessionData,
      createdAt: new Date().toISOString(),
      userId
    });
    
    await redis.setex(key, expirationSeconds, data);
    return key;
  }

  static async getUserSession(userId) {
    const key = `session:user:${userId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async deleteUserSession(userId) {
    const key = `session:user:${userId}`;
    return await redis.del(key);
  }

  static async extendUserSession(userId, additionalSeconds = 3600) {
    const key = `session:user:${userId}`;
    return await redis.expire(key, additionalSeconds);
  }

  // Project Caching
  static async cacheProject(projectId, projectData, expirationSeconds = 1800) {
    const key = `cache:project:${projectId}`;
    const data = JSON.stringify({
      ...projectData,
      cachedAt: new Date().toISOString()
    });
    
    await redis.setex(key, expirationSeconds, data);
    return key;
  }

  static async getCachedProject(projectId) {
    const key = `cache:project:${projectId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async invalidateProjectCache(projectId) {
    const keys = [
      `cache:project:${projectId}`,
      `cache:project:${projectId}:*`,
      `cache:tasks:project:${projectId}`
    ];
    
    // Use pipeline for multiple operations
    const pipeline = redis.pipeline();
    keys.forEach(pattern => {
      if (pattern.includes('*')) {
        // For wildcard patterns, we'd need to scan and delete
        // This is a simplified example
        pipeline.eval(`
          local keys = redis.call('keys', ARGV[1])
          for i=1,#keys do
            redis.call('del', keys[i])
          end
          return #keys
        `, 0, pattern);
      } else {
        pipeline.del(pattern);
      }
    });
    
    return await pipeline.exec();
  }

  // Task Caching
  static async cacheUserTasks(userId, tasks, expirationSeconds = 900) {
    const key = `cache:tasks:user:${userId}`;
    const data = JSON.stringify({
      tasks,
      cachedAt: new Date().toISOString(),
      count: tasks.length
    });
    
    await redis.setex(key, expirationSeconds, data);
    return key;
  }

  static async getCachedUserTasks(userId) {
    const key = `cache:tasks:user:${userId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Real-time Notifications Queue
  static async queueNotification(userId, notification) {
    const key = `notifications:${userId}`;
    const notificationData = JSON.stringify({
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    });
    
    // Add to list (queue)
    await redis.lpush(key, notificationData);
    
    // Keep only last 100 notifications
    await redis.ltrim(key, 0, 99);
    
    // Set expiration for the entire list (7 days)
    await redis.expire(key, 604800);
    
    return notificationData;
  }

  static async getNotifications(userId, limit = 50) {
    const key = `notifications:${userId}`;
    const notifications = await redis.lrange(key, 0, limit - 1);
    return notifications.map(notif => JSON.parse(notif));
  }

  static async markNotificationsAsRead(userId, notificationIds) {
    const key = `notifications:${userId}`;
    const notifications = await redis.lrange(key, 0, -1);
    
    const updatedNotifications = notifications.map(notifStr => {
      const notif = JSON.parse(notifStr);
      if (notificationIds.includes(notif.id)) {
        notif.read = true;
        notif.readAt = new Date().toISOString();
      }
      return JSON.stringify(notif);
    });
    
    // Replace the entire list
    if (updatedNotifications.length > 0) {
      await redis.del(key);
      await redis.lpush(key, ...updatedNotifications.reverse());
      await redis.expire(key, 604800);
    }
    
    return updatedNotifications.length;
  }

  // Rate Limiting
  static async checkRateLimit(identifier, maxRequests = 100, windowSeconds = 3600) {
    const key = `ratelimit:${identifier}`;
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    const ttl = await redis.ttl(key);
    
    return {
      current,
      max: maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetTime: ttl > 0 ? Date.now() + (ttl * 1000) : null,
      allowed: current <= maxRequests
    };
  }

  // Active Users Tracking
  static async trackActiveUser(userId, metadata = {}) {
    const key = 'active_users';
    const userKey = `active_user:${userId}`;
    const timestamp = Date.now();
    
    // Add user to sorted set with current timestamp as score
    await redis.zadd(key, timestamp, userId);
    
    // Store user metadata
    await redis.hmset(userKey, {
      lastSeen: new Date().toISOString(),
      ...metadata
    });
    
    // Set expiration for user data
    await redis.expire(userKey, 1800); // 30 minutes
    
    return timestamp;
  }

  static async getActiveUsers(minutesAgo = 15) {
    const key = 'active_users';
    const cutoffTime = Date.now() - (minutesAgo * 60 * 1000);
    
    // Get users active in the last X minutes
    const userIds = await redis.zrangebyscore(key, cutoffTime, '+inf');
    
    // Get metadata for each user
    const pipeline = redis.pipeline();
    userIds.forEach(userId => {
      pipeline.hgetall(`active_user:${userId}`);
    });
    
    const results = await pipeline.exec();
    
    return userIds.map((userId, index) => ({
      userId,
      ...results[index][1]
    }));
  }

  static async removeInactiveUsers(minutesAgo = 30) {
    const key = 'active_users';
    const cutoffTime = Date.now() - (minutesAgo * 60 * 1000);
    
    // Remove users inactive for more than X minutes
    return await redis.zremrangebyscore(key, '-inf', cutoffTime);
  }

  // Project Statistics Caching
  static async cacheProjectStats(projectId, stats, expirationSeconds = 300) {
    const key = `stats:project:${projectId}`;
    const data = JSON.stringify({
      ...stats,
      calculatedAt: new Date().toISOString()
    });
    
    await redis.setex(key, expirationSeconds, data);
    return key;
  }

  static async getCachedProjectStats(projectId) {
    const key = `stats:project:${projectId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Pub/Sub for Real-time Updates
  static async publishProjectUpdate(projectId, updateData) {
    const channel = `project:${projectId}:updates`;
    const message = JSON.stringify({
      ...updateData,
      timestamp: new Date().toISOString(),
      projectId
    });
    
    return await redis.publish(channel, message);
  }

  static async publishTaskUpdate(taskId, projectId, updateData) {
    const channels = [
      `task:${taskId}:updates`,
      `project:${projectId}:task_updates`
    ];
    
    const message = JSON.stringify({
      ...updateData,
      timestamp: new Date().toISOString(),
      taskId,
      projectId
    });
    
    const pipeline = redis.pipeline();
    channels.forEach(channel => {
      pipeline.publish(channel, message);
    });
    
    return await pipeline.exec();
  }

  // Lock Management (for preventing concurrent operations)
  static async acquireLock(resource, lockTime = 30) {
    const key = `lock:${resource}`;
    const value = `${Date.now()}_${Math.random()}`;
    
    const result = await redis.set(key, value, 'PX', lockTime * 1000, 'NX');
    
    return result === 'OK' ? value : null;
  }

  static async releaseLock(resource, lockValue) {
    const key = `lock:${resource}`;
    
    // Use Lua script to ensure atomic check and delete
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    return await redis.eval(script, 1, key, lockValue);
  }

  // Health Check
  static async healthCheck() {
    try {
      const start = Date.now();
      await redis.ping();
      const responseTime = Date.now() - start;
      
      const info = await redis.info('memory');
      const memoryUsage = info.split('\r\n')
        .find(line => line.startsWith('used_memory_human:'))
        ?.split(':')[1];
      
      return {
        status: 'healthy',
        responseTime,
        memoryUsage: memoryUsage || 'unknown',
        connected: true
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false
      };
    }
  }

  // Cleanup expired keys (maintenance)
  static async cleanup() {
    const patterns = [
      'cache:*',
      'session:*',
      'ratelimit:*'
    ];
    
    let totalDeleted = 0;
    
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        const deleted = await redis.del(...keys);
        totalDeleted += deleted;
      }
    }
    
    return totalDeleted;
  }
}

// Error handling for Redis connection
redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('ready', () => {
  console.log('Redis client ready');
});

redis.on('close', () => {
  console.log('Redis connection closed');
});

module.exports = RedisModel;
