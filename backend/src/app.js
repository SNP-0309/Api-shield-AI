import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { randomUUID } from 'node:crypto';
import protectedRoutes from './routes/protectedRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import proxyRoutes from './routes/proxyRoutes.js';
import { requireApiKey } from './middleware/apiKeyMiddleware.js';
import { isRedisOnline } from './config/redis.js';
import { mlService } from './services/mlService.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? true : Number(process.env.TRUST_PROXY || 0));

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const error = new Error('Origin is not allowed by CORS');
    error.status = 403;
    return callback(error);
  },
  credentials: true,
  exposedHeaders: [
    'X-Sentinel-Risk',
    'X-Sentinel-Level',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-Sentinel-Action',
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
    'Retry-After',
    'X-Request-Id'
  ]
}));

app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// Parse JSON and urlencoded request bodies with an explicit operational limit.
const bodyLimit = process.env.REQUEST_BODY_LIMIT || '1mb';
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));

// Logging (excluding sensitive data)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan((tokens, req, res) => [
    tokens.method(req, res),
    req.path,
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'),
    '-',
    `${tokens['response-time'](req, res)} ms`
  ].join(' ')));
}

// Health check endpoint - explicitly EXEMPT from security middleware
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'API Shield Gateway',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', async (req, res) => {
  const mlReady = await mlService.checkHealth();
  const ready = isRedisOnline() || process.env.ALLOW_IN_MEMORY_FALLBACK === 'true';
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    service: 'API Shield Gateway',
    dependencies: { redis: isRedisOnline(), ml: mlReady }
  });
});

// The reference endpoint is protected and can be used for connectivity checks.
app.use('/api', requireApiKey(), protectedRoutes);

// Real application traffic is sent to the configured upstream service through this route.
app.use('/proxy', requireApiKey(), proxyRoutes);

// Mount Security & Dashboard observability routes
app.use('/security', requireApiKey({ admin: true }), securityRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found on API Shield gateway' });
});

// Centralized error handler (Sanitize error responses, never expose stack traces)
app.use((err, req, res, next) => {
  console.error('[API Shield Error]:', err.message);
  if (res.headersSent) return next(err);
  const status = err.status || (err.type === 'entity.too.large' ? 413 : err instanceof SyntaxError ? 400 : 500);
  return res.status(status).json({
    error: status === 400 ? 'Malformed request body' : status === 413 ? 'Request body is too large' : 'An internal gateway error occurred',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    requestId: req.requestId
  });
});

export default app;
