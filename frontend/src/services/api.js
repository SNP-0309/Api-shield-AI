import axios from 'axios';
import { getFirebaseIdToken, isFirebaseConfigured, loginWithFirebase, logoutFromFirebase, registerWithFirebase } from './firebaseAuth';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 5000,
  // Dashboard JWTs are stored in an HttpOnly cookie by the backend.
  withCredentials: true,
});

const apiKey = import.meta.env.VITE_SENTINEL_API_KEY;
api.interceptors.request.use(async (config) => {
  const firebaseToken = isFirebaseConfigured ? await getFirebaseIdToken() : null;
  config.headers = config.headers || {};

  if (firebaseToken) {
    config.headers.Authorization = `Bearer ${firebaseToken}`;
  } else if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }

  return config;
});

export const securityApi = {
  // Observability & Telemetry
  getOverview: async () => {
    const res = await api.get('/security/overview');
    return res.data;
  },

  getClients: async () => {
    const res = await api.get('/security/clients');
    return res.data;
  },

  getTraffic: async (limit = 50) => {
    const res = await api.get(`/security/traffic?limit=${limit}`);
    return res.data;
  },

  getTimeseries: async () => {
    const res = await api.get('/security/timeseries');
    return res.data;
  },

  getClientDetails: async (clientId) => {
    const res = await api.get(`/security/client/${encodeURIComponent(clientId)}`);
    return res.data;
  },

  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },

  getUpstream: async () => {
    const res = await api.get('/security/upstream');
    return res.data;
  },

  setUpstream: async (url) => {
    const res = await api.put('/security/upstream', { url });
    return res.data;
  }
};

export const authApi = {
  register: async ({ name, email, password }) => {
    if (isFirebaseConfigured) {
      await registerWithFirebase({ name, email, password });
      const res = await api.get('/auth/me');
      return res.data;
    }

    const res = await api.post('/auth/register', { name, email, password });
    return res.data;
  },

  login: async ({ email, password }) => {
    if (isFirebaseConfigured) {
      await loginWithFirebase({ email, password });
      const res = await api.get('/auth/me');
      return res.data;
    }

    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  me: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout: async () => {
    try {
      const res = await api.post('/auth/logout');
      return res.data;
    } finally {
      if (isFirebaseConfigured) await logoutFromFirebase();
    }
  }
};

export default api;
