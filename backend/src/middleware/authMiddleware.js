import { requireApiKey } from './apiKeyMiddleware.js';
import { getAuthToken, verifyAccessToken } from '../utils/auth.js';
import { isFirebaseAdminAllowed, verifyFirebaseIdToken } from '../config/firebaseAdmin.js';

export async function authenticateJwt(req, res, next) {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Dashboard authentication is required' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role
    };
    req.auth = { method: 'jwt' };
    return next();
  } catch {
    try {
      const payload = await verifyFirebaseIdToken(token);
      if (!isFirebaseAdminAllowed(payload.email)) {
        return res.status(403).json({ error: 'This Firebase account is not allowed to access the dashboard' });
      }

      req.user = {
        id: payload.uid,
        email: payload.email || '',
        name: payload.name || payload.email?.split('@')[0] || 'Administrator',
        role: 'admin'
      };
      req.auth = { method: 'firebase' };
      return next();
    } catch {
      return res.status(401).json({ error: 'Dashboard session is invalid or expired' });
    }
  }
}

// Keep the admin API key as a migration fallback while JWT dashboard auth is adopted.
export function requireDashboardAuth() {
  return (req, res, next) => {
    if (getAuthToken(req)) return authenticateJwt(req, res, next);

    // Keep an explicitly configured admin key available during migration, but
    // never let a client traffic key grant dashboard access.
    if (process.env.SENTINEL_ADMIN_API_KEY) {
      return requireApiKey({ admin: true })(req, res, next);
    }

    return res.status(401).json({ error: 'Dashboard authentication is required' });
  };
}
