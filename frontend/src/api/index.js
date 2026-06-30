import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const login = (data) => api.post('/auth/login', data);

// Dashboard
export const getDashboard = () => api.get('/dashboard');

// Members
export const getMembers = (params) => api.get('/members', { params });
export const getMember = (id) => api.get(`/members/${id}`);
export const createMember = (data) => api.post('/members', data);
export const updateMember = (id, data) => api.put(`/members/${id}`, data);
export const deleteMember = (id) => api.delete(`/members/${id}`);

// Consumptions
export const getConsumptions = (params) => api.get('/consumptions', { params });
export const createConsumption = (data) => api.post('/consumptions', data);
export const updateConsumption = (id, data) => api.put(`/consumptions/${id}`, data);
export const deleteConsumption = (id) => api.delete(`/consumptions/${id}`);
