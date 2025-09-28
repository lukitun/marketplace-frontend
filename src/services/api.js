import axios from 'axios';

// Use Netlify Functions as proxy to avoid mixed content issues
const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname.includes('netlify')) {
    return '/.netlify/functions/api';
  }
  return process.env.NODE_ENV === 'production'
    ? '/.netlify/functions/api'
    : 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Posts API
export const postsAPI = {
  getAllPosts: (params) => api.get('/posts', { params }),
  getPost: (id) => api.get(`/posts/${id}`),
  createPost: (formData) => api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updatePost: (id, formData) => api.put(`/posts/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deletePost: (id) => api.delete(`/posts/${id}`),
  getUserPosts: () => api.get('/posts/user/posts'),
};

// Admin API
export const adminAPI = {
  // Users
  getAllUsers: (params) => api.get('/admin/users', { params }),
  updateUserSubscription: (userId, data) => api.put(`/admin/users/${userId}/subscription`, data),
  getSubscriptionHistory: (userId) => api.get(`/admin/users/${userId}/subscriptions`),

  // Posts
  getAllPostsAdmin: (params) => api.get('/admin/posts', { params }),
  togglePostVisibility: (postId) => api.put(`/admin/posts/${postId}/visibility`),

  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
};

export default api;