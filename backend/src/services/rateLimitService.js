import { redisService } from './redisService.js';

export const rateLimitService = {
  /**
   * Check if client exceeds their dynamically calculated limit
   */
  async checkRateLimit(clientId, dynamicLimit) {
    const currentCount = await redisService.getRequestCount(clientId);
    const remaining = Math.max(0, dynamicLimit - currentCount);
    const isExceeded = currentCount > dynamicLimit;

    return {
      isExceeded,
      currentCount,
      limit: dynamicLimit,
      remaining,
      retryAfter: 60
    };
  }
};
