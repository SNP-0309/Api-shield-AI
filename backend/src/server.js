import app from './app.js';
import { initRedis } from './config/redis.js';
import { mlService } from './services/mlService.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('========================================================');
  console.log('       API Shield - Behavioral Security Gateway        ');
  console.log('========================================================');

  if (process.env.NODE_ENV === 'production') {
    const requiredProductionConfig = ['SENTINEL_API_KEYS', 'SENTINEL_ADMIN_API_KEY'];
    const missing = requiredProductionConfig.filter((name) => !process.env[name]);
    if (missing.length > 0) {
      throw new Error(`Missing required production configuration: ${missing.join(', ')}`);
    }
  }

  // Redis is a required production dependency. The in-memory store is only
  // available when explicitly enabled for local development.
  const redis = await initRedis();
  const allowInMemory = process.env.ALLOW_IN_MEMORY_FALLBACK === 'true';
  if (process.env.NODE_ENV === 'production' && !redis.isOnline && !allowInMemory) {
    throw new Error('Redis is unavailable. Set REDIS_URL or explicitly enable ALLOW_IN_MEMORY_FALLBACK for local-only use.');
  }

  // Test ML service connectivity
  const mlAvailable = await mlService.checkHealth();
  if (mlAvailable) {
    console.log('[+] Python ML Isolation Forest service online at', process.env.ML_SERVICE_URL || 'http://localhost:8000');
  } else {
    console.warn('[!] ML service is unavailable. Requests will use the configured degraded heuristic decision path.');
  }

  if (!process.env.UPSTREAM_URL) {
    console.warn('[!] No upstream API is configured. Set one in the dashboard or with UPSTREAM_URL before using /proxy routes.');
  }

  app.listen(PORT, () => {
    console.log(`[+] Express Gateway listening on http://localhost:${PORT}`);
    console.log(`[+] Protected APIs at http://localhost:${PORT}/api/*`);
    console.log(`[+] Security Observability at http://localhost:${PORT}/security/*`);
    console.log('========================================================');
  });
}

startServer();
