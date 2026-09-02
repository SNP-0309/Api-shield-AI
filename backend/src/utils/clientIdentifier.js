import crypto from 'node:crypto';

/**
 * Stable client identification utility.
 * Prefer an authenticated principal, then a one-way API-key fingerprint,
 * and finally the request IP for anonymous local integrations.
 */
export function extractClientIdentifier(req) {
  // 1. Check for an authenticated principal supplied by the host application.
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }

  // 2. Never store a raw credential in telemetry.
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  if (apiKey && typeof apiKey === 'string') {
    const token = apiKey.replace(/^bearer\s+/i, '').trim();
    if (token.length > 0) {
      const fingerprint = crypto.createHash('sha256').update(token).digest('hex').slice(0, 24);
      return `key:${fingerprint}`;
    }
  }

  // 3. IP is the final fallback for public/anonymous endpoints.
  let ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }
  return `ip:${ip}`;
}
