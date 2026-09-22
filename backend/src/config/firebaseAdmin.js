import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let firebaseAuth = null;

function firebaseConfig() {
  return {
    projectId: String(process.env.FIREBASE_PROJECT_ID || '').trim(),
    clientEmail: String(process.env.FIREBASE_CLIENT_EMAIL || '').trim(),
    privateKey: String(process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim()
  };
}

export function isFirebaseConfigured() {
  const config = firebaseConfig();
  return Boolean(config.projectId && config.clientEmail && config.privateKey);
}

function getFirebaseAuth() {
  if (firebaseAuth) return firebaseAuth;
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase Admin authentication is not configured');
  }

  const config = firebaseConfig();
  const app = getApps()[0] || initializeApp({ credential: cert(config) });
  firebaseAuth = getAuth(app);
  return firebaseAuth;
}

export function verifyFirebaseIdToken(token) {
  return getFirebaseAuth().verifyIdToken(token);
}

export function isFirebaseAdminAllowed(email) {
  const allowedEmails = String(process.env.FIREBASE_ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  // Local development can use any account in the configured Firebase project.
  // Production should always provide an explicit admin email allowlist.
  if (allowedEmails.length === 0) return process.env.NODE_ENV !== 'production';
  return allowedEmails.includes(String(email || '').toLowerCase());
}
