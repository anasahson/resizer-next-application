import axios from 'axios';
import { AUTH_TOKEN_KEYS } from '../context/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const tokenKey = window.location.pathname.startsWith('/admin')
      ? AUTH_TOKEN_KEYS.superadmin
      : AUTH_TOKEN_KEYS.user;
    const token = localStorage.getItem(tokenKey);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// API Functions
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.patch('/auth/profile', data),
};

export const subscriptionAPI = {
  getPlans: () => api.get('/subscription/plans'),
  getCurrentSubscription: () => api.get('/subscription/current'),
  createCheckout: (planId: string) =>
    api.post('/subscription/checkout', { planId }),
  upgradeSubscription: (newPlanId: string) =>
    api.patch('/subscription/upgrade', { newPlanId }),
  cancelSubscription: () => api.delete('/subscription/cancel'),
  getPortalSession: () => api.get('/subscription/portal'),
};

export const imageAPI = {
  processImage: (formData: FormData) =>
    api.post('/images/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getMetadata: (formData: FormData) =>
    api.post('/images/metadata', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const shareAPI = {
  createShare: (imageData: any) =>
    api.post('/share/create', { imageData }),
  getShare: (shareId: string) =>
    api.get(`/share/${shareId}`),
  getUserShares: () => api.get('/share/user'),
  getViralStats: () => api.get('/share/viral-stats'),
  trackShare: (shareId: string, platform: string) =>
    api.post('/share/track-share', { shareId, platform }),
};

export const referralAPI = {
  generateCode: () => api.post('/referral/generate'),
  getStats: () => api.get('/referral/stats'),
  getLeaderboard: (limit = 10) =>
    api.get('/referral/leaderboard', { params: { limit } }),
  applyCode: (referralCode: string, userId: string) =>
    api.post('/referral/apply', { referralCode, userId }),
  withdraw: (amount: number) =>
    api.post('/referral/withdraw', { amount }),
};

export const analyticsAPI = {
  getPublicAnalytics: () => api.get('/analytics/public'),
  getRevenueAnalytics: () => api.get('/analytics/revenue'),
  getUserAcquisition: () => api.get('/analytics/acquisition'),
  trackEvent: (eventType: string, metadata: any) =>
    api.post('/analytics/track-event', { eventType, metadata }),
};

export default api;
