import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { isMongoOnline } from '../config/mongodb.js';
import { clearAuthCookie, createAccessToken, setAuthCookie, toPublicUser } from '../utils/auth.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireMongo(res) {
  if (isMongoOnline()) return true;
  res.status(503).json({ error: 'MongoDB is unavailable for dashboard authentication' });
  return false;
}

function credentialsFrom(body = {}) {
  return {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    password: typeof body.password === 'string' ? body.password : ''
  };
}

export const authController = {
  async register(req, res) {
    if (!requireMongo(res)) return;
    if (process.env.ALLOW_DASHBOARD_SIGNUP !== 'true') {
      return res.status(403).json({ error: 'Dashboard registration is currently disabled' });
    }

    const { name, email, password } = credentialsFrom(req.body);
    if (name.length < 2 || name.length > 80 || !EMAIL_PATTERN.test(email) || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Enter a name, valid email, and password between 8 and 128 characters' });
    }

    const existingUserCount = await User.countDocuments();
    if (existingUserCount > 0) {
      return res.status(403).json({ error: 'Registration is closed. Sign in with the existing dashboard account.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    try {
      const user = await User.create({ name, email, passwordHash, role: 'admin' });
      setAuthCookie(res, createAccessToken(user));
      return res.status(201).json({ user: toPublicUser(user) });
    } catch (error) {
      if (error?.code === 11000) return res.status(409).json({ error: 'An account with this email already exists' });
      console.error('[AuthController] register error:', error.message);
      return res.status(500).json({ error: 'Unable to create dashboard account' });
    }
  },

  async login(req, res) {
    if (!requireMongo(res)) return;

    const { email, password } = credentialsFrom(req.body);
    if (!EMAIL_PATTERN.test(email) || !password) {
      return res.status(400).json({ error: 'Enter your email and password' });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    setAuthCookie(res, createAccessToken(user));
    return res.json({ user: toPublicUser(user) });
  },

  me(req, res) {
    return res.json({ user: req.user });
  },

  logout(req, res) {
    clearAuthCookie(res);
    return res.json({ success: true });
  }
};
