import { create } from 'zustand';
import { authAPI } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'superadmin';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: (redirectTo?: string | React.MouseEvent) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: typeof window !== 'undefined'
    ? localStorage.getItem('resizer_superadmin_auth_token') || localStorage.getItem('resizer_user_auth_token')
    : null,
  isLoading: false,
  error: null,

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.register({ name, email, password });
      localStorage.setItem('resizer_user_auth_token', data.token);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Registration failed', isLoading: false });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authAPI.login({ email, password });
      const tokenKey = data.user.role === 'superadmin' ? 'resizer_superadmin_auth_token' : 'resizer_user_auth_token';
      localStorage.setItem(tokenKey, data.token);
      set({ user: data.user, token: data.token, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Login failed', isLoading: false });
      throw error;
    }
  },

  logout: (redirectTo?: string | React.MouseEvent) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('resizer_user_auth_token');
      localStorage.removeItem('resizer_superadmin_auth_token');
      const target = typeof redirectTo === 'string' ? redirectTo : '/login';
      window.location.href = target;
    }
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('resizer_superadmin_auth_token') || localStorage.getItem('resizer_user_auth_token');
    if (!token) return;

    try {
      const { data } = await authAPI.getMe();
      set({ user: data.user });
    } catch (error) {
      localStorage.removeItem('resizer_superadmin_auth_token');
      localStorage.removeItem('resizer_user_auth_token');
      set({ user: null, token: null });
    }
  },
}));
