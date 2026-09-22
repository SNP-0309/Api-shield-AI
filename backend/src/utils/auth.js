import jwt from 'jsonwebtoken';

const AUTH_COOKIE_NAME = 'api_shield_token';

function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || '');
  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  return secret;
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || '';
  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

export function getAuthToken(req) {
  const authorization = req.headers.authorization;
  if (typeof authorization === 'string' && /^Bearer\s+/i.test(authorization)) {
    return authorization.replace(/^Bearer\s+/i, '').trim();
  }
  return getCookie(req, AUTH_COOKIE_NAME);
}

export function createAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, name: user.name, role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h', algorithm: 'HS256' }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.AUTH_COOKIE_SAMESITE || 'lax',
    path: '/',
    maxAge: Number(process.env.AUTH_COOKIE_MAX_AGE_MS || 8 * 60 * 60 * 1000)
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.AUTH_COOKIE_SAMESITE || 'lax',
    path: '/'
  });
}

export function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role
  };
}
