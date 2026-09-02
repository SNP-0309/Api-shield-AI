import { extractClientIdentifier } from '../utils/clientIdentifier.js';
import { redisService } from '../services/redisService.js';
import { behaviorService } from '../services/behaviorService.js';
import { mlService } from '../services/mlService.js';
import { riskEngine } from '../services/riskEngine.js';
import { rateLimitService } from '../services/rateLimitService.js';

export async function securityMiddleware(req, res, next) {
  const startTime = Date.now();
  const clientId = extractClientIdentifier(req);
  const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const method = req.method;
  const endpoint = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
  const declaredPayloadSize = Number.parseInt(req.headers['content-length'] || '0', 10);
  const payloadSize = Number.isFinite(declaredPayloadSize) && declaredPayloadSize > 0 ? declaredPayloadSize : 0;

  try {
    if (process.env.NODE_ENV === 'production' && !redisService.isOnline() && process.env.ALLOW_IN_MEMORY_FALLBACK !== 'true') {
      throw new Error('Redis is unavailable for security telemetry');
    }

    // Extract features from the client's recent observed request history.
    const { features, historyLength } = await behaviorService.getClientFeatures(clientId);

    // Ask the model service for an anomaly score. The service can return a
    // degraded heuristic decision when the model dependency is unavailable.
    const mlResult = await mlService.predictAnomaly(features);

    // Do not make an enforcement decision from an under-sampled profile.
    const warmupScore = Number(process.env.INITIAL_ANOMALY_SCORE || '0.12');
    const effectiveAnomalyScore = historyLength < 3 ? warmupScore : mlResult.anomalyScore;

    // Calculate final risk, posture, dynamic limit, and action.
    const riskEval = riskEngine.evaluateRisk(effectiveAnomalyScore, features);

    // Check the current sliding-window count against the dynamic limit.
    const limitCheck = await rateLimitService.checkRateLimit(clientId, riskEval.dynamicLimit);

    // 6. Set required API Shield security headers
    const actionTaken = riskEval.securityLevel === 'CRITICAL'
      ? 'BLOCKED'
      : (limitCheck.isExceeded ? 'THROTTLED' : riskEval.action);

    res.setHeader('X-Sentinel-Risk', riskEval.finalRisk.toFixed(2));
    res.setHeader('X-Sentinel-Level', riskEval.securityLevel);
    res.setHeader('X-RateLimit-Limit', riskEval.dynamicLimit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limitCheck.remaining));
    res.setHeader('X-Sentinel-Action', actionTaken);
    res.setHeader('RateLimit-Limit', riskEval.dynamicLimit);
    res.setHeader('RateLimit-Remaining', Math.max(0, limitCheck.remaining));
    res.setHeader('RateLimit-Reset', limitCheck.retryAfter);

    // Reject requests that exceed the current client quota.
    if (riskEval.securityLevel === 'CRITICAL' || limitCheck.isExceeded) {
      res.setHeader('Retry-After', limitCheck.retryAfter);
      // Record failed throttled request in Redis
      await redisService.recordRequest(clientId, {
        method,
        endpoint,
        payloadSize,
        statusCode: 429,
        userAgent,
        ip
      });

      await redisService.updateClientRiskState(clientId, {
        riskScore: riskEval.finalRisk,
        dynamicLimit: riskEval.dynamicLimit,
        securityLevel: riskEval.securityLevel,
        action: actionTaken,
        dominantBehavior: riskEval.dominantBehavior
      });

      await redisService.recordTrafficEvent({
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        clientId,
        ip,
        method,
        endpoint,
        statusCode: 429,
        riskScore: riskEval.finalRisk,
        securityLevel: riskEval.securityLevel,
        action: actionTaken,
        dynamicLimit: riskEval.dynamicLimit,
        dominantBehavior: riskEval.dominantBehavior,
        responseTimeMs: Date.now() - startTime
      });

      return res.status(429).json({
        error: 'Request throttled by API Shield',
        riskScore: riskEval.finalRisk,
        securityLevel: riskEval.securityLevel,
        retryAfter: limitCheck.retryAfter,
        dominantBehavior: riskEval.dominantBehavior
      });
    }

    // Capture the actual downstream status code after the response completes.
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode || 200;

      Promise.all([
        redisService.recordRequest(clientId, {
          method,
          endpoint,
          payloadSize,
          statusCode,
          userAgent,
          ip
        }),
        redisService.updateClientRiskState(clientId, {
          riskScore: riskEval.finalRisk,
          dynamicLimit: riskEval.dynamicLimit,
          securityLevel: riskEval.securityLevel,
          action: actionTaken,
          dominantBehavior: riskEval.dominantBehavior
        }),
        redisService.recordTrafficEvent({
          id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          clientId,
          ip,
          method,
          endpoint,
          statusCode,
          riskScore: riskEval.finalRisk,
          securityLevel: riskEval.securityLevel,
          action: actionTaken,
          dynamicLimit: riskEval.dynamicLimit,
          dominantBehavior: riskEval.dominantBehavior,
          responseTimeMs: responseTime
        })
      ]).catch((error) => {
        console.error('[SecurityMiddleware] telemetry persistence error:', error.message);
      });
    });

    // Attach security context to request for downstream handlers
    req.sentinel = {
      clientId,
      riskScore: riskEval.finalRisk,
      securityLevel: riskEval.securityLevel,
      dynamicLimit: riskEval.dynamicLimit
    };

    next();
  } catch (err) {
    console.error('[SecurityMiddleware] Evaluation error:', err.message);
    if (process.env.SECURITY_FAIL_OPEN === 'true') {
      return next();
    }
    return res.status(503).json({
      error: 'Security evaluation is temporarily unavailable',
      requestId: req.requestId
    });
  }
}
