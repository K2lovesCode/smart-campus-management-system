import axios from 'axios';

// Empty base URL => same-origin (nginx) or Vite dev proxy handles /api.
const baseURL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({ baseURL });

// Attach the JWT to every request if present.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, drop the stale token so the app returns to login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(err);
  }
);

export default api;
