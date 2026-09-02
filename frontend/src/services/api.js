import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 5000,
});

const apiKey = import.meta.env.VITE_SENTINEL_API_KEY;
api.interceptors.request.use((config) => {
  if (apiKey) config.headers['X-API-Key'] = apiKey;
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

export default api;
