import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (email, password, name) => api.post('/api/auth/register', { email, password, name }),
  googleLogin: (idToken) => api.post('/api/auth/google', { id_token: idToken }),
  me: () => api.get('/api/auth/me'),
};

// ESG Analysis endpoints
export const analysisApi = {
  analyze: (data) => api.post('/api/analyze', data),
  mockData: () => api.get('/api/mock-data'),
  sync1C: (apiKey, data) => api.post('/api/v1/sync-1c', data, {
    headers: { 'X-API-Key': apiKey },
  }),
  downloadReport: (analysisId) => api.get(`/api/reports/${analysisId}/pdf`, {
    responseType: 'blob',
  }),
};

// 1C Sync endpoint (API-key protected)
export const sync1C = async (apiKey, data) => {
  return api.post('/api/v1/sync-1c', data, {
    headers: { 'X-API-Key': apiKey },
  });
};

export default api;