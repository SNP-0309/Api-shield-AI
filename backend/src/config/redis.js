import Redis from 'ioredis';

class InMemoryRedisStore {
  constructor() {
    this.strings = new Map();
    this.lists = new Map();
    this.hashes = new Map();
    this.ttls = new Map();
  }

  _checkTtl(key) {
    const expireAt = this.ttls.get(key);
    if (expireAt && Date.now() > expireAt) {
      this.strings.delete(key);
      this.lists.delete(key);
      this.hashes.delete(key);
      this.ttls.delete(key);
      return true;
    }
    return false;
  }

  async incr(key) {
    this._checkTtl(key);
    const val = (parseInt(this.strings.get(key) || '0', 10) + 1).toString();
    this.strings.set(key, val);
    return parseInt(val, 10);
  }

  async get(key) {
    this._checkTtl(key);
    return this.strings.get(key) || null;
  }

  async set(key, value) {
    this._checkTtl(key);
    this.strings.set(key, String(value));
    return 'OK';
  }

  async expire(key, seconds) {
    this.ttls.set(key, Date.now() + seconds * 1000);
    return 1;
  }

  async rpush(key, ...values) {
    this._checkTtl(key);
    if (!this.lists.has(key)) {
      this.lists.set(key, []);
    }
    const list = this.lists.get(key);
    list.push(...values.map(String));
    return list.length;
  }

  async lrange(key, start, stop) {
    this._checkTtl(key);
    const list = this.lists.get(key) || [];
    if (stop === -1) {
      return list.slice(start);
    }
    return list.slice(start, stop + 1);
  }

  async ltrim(key, start, stop) {
    this._checkTtl(key);
    const list = this.lists.get(key) || [];
    const trimmed = stop === -1 ? list.slice(start) : list.slice(start, stop + 1);
    this.lists.set(key, trimmed);
    return 'OK';
  }

  async hset(key, ...args) {
    this._checkTtl(key);
    if (!this.hashes.has(key)) {
      this.hashes.set(key, new Map());
    }
    const hash = this.hashes.get(key);
    if (args.length === 1 && typeof args[0] === 'object') {
      for (const [k, v] of Object.entries(args[0])) {
        hash.set(k, String(v));
      }
    } else {
      for (let i = 0; i < args.length; i += 2) {
        hash.set(args[i], String(args[i + 1]));
      }
    }
    return 1;
  }

  async hget(key, field) {
    this._checkTtl(key);
    const hash = this.hashes.get(key);
    return hash ? hash.get(field) || null : null;
  }

  async hgetall(key) {
    this._checkTtl(key);
    const hash = this.hashes.get(key);
    if (!hash) return {};
    const obj = {};
    for (const [k, v] of hash.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  async keys(pattern) {
    const matched = [];
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const allKeys = new Set([...this.strings.keys(), ...this.lists.keys(), ...this.hashes.keys()]);
    for (const key of allKeys) {
      if (!this._checkTtl(key) && regex.test(key)) {
        matched.push(key);
      }
    }
    return matched;
  }

  async scan(_cursor, ...args) {
    const matchIndex = args.findIndex((arg) => String(arg).toUpperCase() === 'MATCH');
    const pattern = matchIndex >= 0 ? args[matchIndex + 1] : '*';
    return ['0', await this.keys(pattern)];
  }

  async del(...keys) {
    for (const key of keys) {
      this.strings.delete(key);
      this.lists.delete(key);
      this.hashes.delete(key);
      this.ttls.delete(key);
    }
    return keys.length;
  }

  async flushall() {
    this.strings.clear();
    this.lists.clear();
    this.hashes.clear();
    this.ttls.clear();
    return 'OK';
  }
}

let redisClient = null;
let isConnected = false;
let fallbackStore = new InMemoryRedisStore();

export function getRedisClient() {
  if (redisClient && isConnected) {
    return { client: redisClient, isOnline: true, isFallback: false };
  }
  const allowFallback = process.env.NODE_ENV !== 'production' || process.env.ALLOW_IN_MEMORY_FALLBACK === 'true';
  return { client: allowFallback ? fallbackStore : null, isOnline: isConnected, isFallback: allowFallback };
}

export function isRedisOnline() {
  return isConnected;
}

export async function initRedis() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log(`[*] Connecting to Redis at ${redisUrl}...`);

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 1500,
      retryStrategy(times) {
        if (times > 3) {
          return null; // Stop reconnecting to avoid spamming logs.
        }
        return Math.min(times * 500, 2000);
      }
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('[+] Redis client connected successfully.');
    });

    redisClient.on('ready', () => {
      isConnected = true;
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      // The process-level readiness check decides whether this is acceptable.
    });

    redisClient.on('close', () => {
      isConnected = false;
    });

    // Test ping with short timeout
    await Promise.race([
      redisClient.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout')), 1200))
    ]);
    isConnected = true;
    console.log('[+] Redis verified online.');
  } catch (err) {
    isConnected = false;
    console.warn(`[!] Redis server unreachable (${err.message}).`);
  }

  return getRedisClient();
}
