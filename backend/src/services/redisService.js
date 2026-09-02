import { getRedisClient, isRedisOnline } from '../config/redis.js';
import { validateUpstreamUrl } from '../utils/upstreamUrl.js';

const WINDOW_TTL_SECONDS = 120;
const MAX_HISTORY_LEN = 100;
const UPSTREAM_URL_KEY = 'config:upstream_url';

export const redisService = {
  /**
   * Check connection status
   */
  isOnline() {
    return isRedisOnline();
  },

  async getUpstreamUrl() {
    const configuredFallback = String(process.env.UPSTREAM_URL || '').trim() || null;
    const { client } = getRedisClient();
    if (!client) return configuredFallback;

    try {
      const storedUrl = await client.get(UPSTREAM_URL_KEY);
      const candidate = storedUrl || configuredFallback;
      return candidate ? validateUpstreamUrl(candidate) : null;
    } catch (err) {
      console.error('[RedisService] getUpstreamUrl error:', err.message);
      return null;
    }
  },

  async setUpstreamUrl(url) {
    const { client } = getRedisClient();
    if (!client) throw new Error('Redis is unavailable; runtime configuration cannot be saved');
    await client.set(UPSTREAM_URL_KEY, url);
    return url;
  },

  /**
   * Record an incoming request into sliding window Redis keys
   */
  async recordRequest(clientId, metadata) {
    const { client } = getRedisClient();
    const now = Date.now();
    const {
      method = 'GET',
      endpoint = '/',
      payloadSize = 0,
      statusCode = 200,
      userAgent = 'Unknown',
      ip = '127.0.0.1'
    } = metadata;

    const isError = statusCode >= 400 ? '1' : '0';

    try {
      // 1. Sliding window lists
      const tKey = `timestamps:${clientId}`;
      const epKey = `endpoints:${clientId}`;
      const plKey = `payloads:${clientId}`;
      const mKey = `methods:${clientId}`;
      const errKey = `errors:${clientId}`;
      const uaKey = `useragents:${clientId}`;

      await Promise.all([
        client.rpush(tKey, now.toString()),
        client.rpush(epKey, endpoint),
        client.rpush(plKey, payloadSize.toString()),
        client.rpush(mKey, method),
        client.rpush(errKey, isError),
        client.rpush(uaKey, userAgent)
      ]);

      // Trim lists to MAX_HISTORY_LEN to prevent unbounded growth
      await Promise.all([
        client.ltrim(tKey, -MAX_HISTORY_LEN, -1),
        client.ltrim(epKey, -MAX_HISTORY_LEN, -1),
        client.ltrim(plKey, -MAX_HISTORY_LEN, -1),
        client.ltrim(mKey, -MAX_HISTORY_LEN, -1),
        client.ltrim(errKey, -MAX_HISTORY_LEN, -1),
        client.ltrim(uaKey, -MAX_HISTORY_LEN, -1)
      ]);

      // Set TTL
      await Promise.all([
        client.expire(tKey, WINDOW_TTL_SECONDS),
        client.expire(epKey, WINDOW_TTL_SECONDS),
        client.expire(plKey, WINDOW_TTL_SECONDS),
        client.expire(mKey, WINDOW_TTL_SECONDS),
        client.expire(errKey, WINDOW_TTL_SECONDS),
        client.expire(uaKey, WINDOW_TTL_SECONDS)
      ]);

      // Count the current request window from the timestamp history. This
      // remains a true sliding window instead of a fixed window from the
      // first request in the period.
      const count = await this.getRequestCount(clientId);

      // 3. Update client summary hash
      const statusKey = `status:${clientId}`;
      await client.hset(statusKey, {
        clientId,
        ip,
        userAgent,
        lastSeen: new Date(now).toISOString(),
        requests: count.toString()
      });
      await client.expire(statusKey, WINDOW_TTL_SECONDS);

      return count;
    } catch (err) {
      console.error('[RedisService] recordRequest error:', err.message);
      return 1;
    }
  },

  /**
   * Fetch recent behavioral history for client
   */
  async getClientHistory(clientId) {
    const { client } = getRedisClient();
    try {
      const [timestamps, endpoints, payloads, methods, errors, useragents] = await Promise.all([
        client.lrange(`timestamps:${clientId}`, 0, -1),
        client.lrange(`endpoints:${clientId}`, 0, -1),
        client.lrange(`payloads:${clientId}`, 0, -1),
        client.lrange(`methods:${clientId}`, 0, -1),
        client.lrange(`errors:${clientId}`, 0, -1),
        client.lrange(`useragents:${clientId}`, 0, -1)
      ]);

      return {
        timestamps: (timestamps || []).map(Number),
        endpoints: endpoints || [],
        payloads: (payloads || []).map(Number),
        methods: methods || [],
        errors: (errors || []).map(Number),
        useragents: useragents || []
      };
    } catch (err) {
      console.error('[RedisService] getClientHistory error:', err.message);
      return { timestamps: [], endpoints: [], payloads: [], methods: [], errors: [], useragents: [] };
    }
  },

  /**
   * Update client risk state in Redis
   */
  async updateClientRiskState(clientId, state) {
    const { client } = getRedisClient();
    try {
      const statusKey = `status:${clientId}`;
      await client.hset(statusKey, {
        riskScore: state.riskScore.toString(),
        dynamicLimit: state.dynamicLimit.toString(),
        status: state.securityLevel,
        action: state.action,
        dominantBehavior: state.dominantBehavior || 'Analyzing...',
        updatedAt: new Date().toISOString()
      });
      await client.expire(statusKey, WINDOW_TTL_SECONDS);
    } catch (err) {
      console.error('[RedisService] updateClientRiskState error:', err.message);
    }
  },

  /**
   * Get dynamic limit counter for client
   */
  async getRequestCount(clientId) {
    const { client } = getRedisClient();
    try {
      const cutoff = Date.now() - 60 * 1000;
      const timestamps = await client.lrange(`timestamps:${clientId}`, 0, -1);
      return (timestamps || []).filter((timestamp) => Number(timestamp) >= cutoff).length;
    } catch (err) {
      console.error('[RedisService] getRequestCount error:', err.message);
      return 0;
    }
  },

  /**
   * Record a single live traffic event in global circular list
   */
  async recordTrafficEvent(event) {
    const { client } = getRedisClient();
    try {
      const payload = JSON.stringify(event);
      await client.rpush('global:traffic_feed', payload);
      await client.ltrim('global:traffic_feed', -200, -1);
      await client.expire('global:traffic_feed', 3600);
      await client.incr('metrics:requests_total');
      if (event.statusCode === 429) {
        await client.incr('metrics:blocked_total');
      }
    } catch (err) {
      // silent
    }
  },

  /**
   * Retrieve recent traffic events
   */
  async getRecentTraffic(limit = 50) {
    const { client } = getRedisClient();
    try {
      const items = await client.lrange('global:traffic_feed', -limit, -1);
      return (items || []).reverse().map((str) => {
        try {
          return JSON.parse(str);
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (err) {
      return [];
    }
  },

  async getMetrics() {
    const { client } = getRedisClient();
    try {
      const [requests, blocked] = await Promise.all([
        client.get('metrics:requests_total'),
        client.get('metrics:blocked_total')
      ]);
      return {
        totalRequests: parseInt(requests || '0', 10),
        blockedRequests: parseInt(blocked || '0', 10)
      };
    } catch (err) {
      console.error('[RedisService] getMetrics error:', err.message);
      return { totalRequests: 0, blockedRequests: 0 };
    }
  },

  /**
   * Get all active clients from status hashes
   */
  async getAllActiveClients() {
    const { client } = getRedisClient();
    try {
      const keys = [];
      if (client.scan) {
        let cursor = '0';
        do {
          const [nextCursor, batch] = await client.scan(cursor, 'MATCH', 'status:*', 'COUNT', 100);
          keys.push(...(batch || []));
          cursor = String(nextCursor);
        } while (cursor !== '0');
      } else {
        keys.push(...(await client.keys('status:*')));
      }
      if (!keys || keys.length === 0) return [];

      const clients = await Promise.all(keys.map(async (key) => {
        const data = await client.hgetall(key);
        if (data && data.clientId) {
          const requests = await this.getRequestCount(data.clientId);
          if (requests === 0) return null;
          return {
            clientId: data.clientId,
            ip: data.ip || '127.0.0.1',
            userAgent: data.userAgent || 'Unknown',
            requests,
            riskScore: parseFloat(data.riskScore || '0'),
            dynamicLimit: parseInt(data.dynamicLimit || '100', 10),
            status: data.status || 'SAFE',
            action: data.action || 'ALLOWED',
            dominantBehavior: data.dominantBehavior || 'Insufficient observations',
            lastSeen: data.lastSeen || new Date().toISOString()
          };
        }
        return null;
      }));
      const activeClients = clients.filter(Boolean);
      return activeClients.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
    } catch (err) {
      console.error('[RedisService] getAllActiveClients error:', err.message);
      return [];
    }
  },

};
