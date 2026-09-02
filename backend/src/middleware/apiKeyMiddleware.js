import crypto from 'node:crypto';

function splitKeys(value) {
  return String(value || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
}

function getPresentedKey(req) {
  const apiKey = req.headers['x-api-key'];
  if (typeof apiKey === 'string' && apiKey.trim()) {
    return apiKey.trim();
  }

  const authorization = req.headers.authorization;
  if (typeof authorization === 'string' && /^Bearer\s+/i.test(authorization)) {
    return authorization.replace(/^Bearer\s+/i, '').trim();
  }

  return null;
}

function securelyEquals(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function keyCandidates({ admin = false } = {}) {
  if (admin && process.env.SENTINEL_ADMIN_API_KEY) {
    return splitKeys(process.env.SENTINEL_ADMIN_API_KEY);
  }

  return splitKeys(process.env.SENTINEL_API_KEYS || process.env.SENTINEL_API_KEY);
}

export function requireApiKey(options = {}) {
  return (req, res, next) => {
    const keys = keyCandidates(options);

    // Local development remains convenient when no key has been configured.
    // Production deployments must provide a key and fail closed when they do not.
    if (keys.length === 0) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'API authentication is not configured' });
      }
      return next();
    }

    const presentedKey = getPresentedKey(req);
    const valid = presentedKey && keys.some((key) => securelyEquals(presentedKey, key));

    if (!valid) {
      res.setHeader('WWW-Authenticate', 'Bearer');
      return res.status(401).json({ error: 'A valid API key is required' });
    }

    const fingerprint = crypto.createHash('sha256').update(presentedKey).digest('hex').slice(0, 24);
    req.user = {
      id: `api-${fingerprint}`,
      role: options.admin ? 'security-admin' : 'api-client'
    };
    req.auth = { method: 'api-key', fingerprint };
    return next();
  };
}

