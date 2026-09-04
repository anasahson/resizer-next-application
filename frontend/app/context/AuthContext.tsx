'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'user' | 'superadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string | null;
  createdAt?: string;
  created_at?: string;
}

interface UpdateProfilePayload {
  name?: string;
  image?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isUser: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<{ success: boolean; message?: string; user?: User }>;
  logout: (redirectTo?: string | React.MouseEvent) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || 'http://localhost:5000';
export const AUTH_TOKEN_KEYS = {
  user: 'resizer_user_auth_token',
  superadmin: 'resizer_superadmin_auth_token',
} as const;

function getTokenKeyForPath() {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
    ? AUTH_TOKEN_KEYS.superadmin
    : AUTH_TOKEN_KEYS.user;
}

function getUserFromToken(storedToken: string): User | null {
  try {
    const payload = JSON.parse(atob(storedToken.split('.')[1]));
    if (!payload.id || !payload.email || !payload.role || (payload.exp && payload.exp * 1000 <= Date.now())) {
      return null;
    }
    return {
      id: payload.id,
      name: payload.name || 'User',
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate stored token and fetch user on load
  const loadUserFromStorage = useCallback(async () => {
    try {
      const tokenKey = getTokenKeyForPath();
      const storedToken = localStorage.getItem(tokenKey);
      localStorage.removeItem('resizer_auth_token');
      localStorage.removeItem('token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      const cachedUser = getUserFromToken(storedToken);
      if (!cachedUser) {
        localStorage.removeItem(tokenKey);
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }
      setUser(cachedUser);
      setIsLoading(false);

      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem(tokenKey);
          setToken(null);
          setUser(null);
        }
      } else {
        localStorage.removeItem(tokenKey);
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.warn('Failed to load user profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  // Login handler
  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Login failed.' };
      }

      setUser(data.user);
      setToken(data.token);
      const tokenKey = data.user.role === 'superadmin' ? AUTH_TOKEN_KEYS.superadmin : AUTH_TOKEN_KEYS.user;
      localStorage.setItem(tokenKey, data.token);

      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during login.' };
    }
  };

  // Register handler
  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Registration failed.' };
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem(AUTH_TOKEN_KEYS.user, data.token);

      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during registration.' };
    }
  };

  // Update profile handler
  const updateProfile = async (payload: UpdateProfilePayload) => {
    if (!token) {
      return { success: false, message: 'Not authenticated.' };
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Update failed.' };
      }

      if (data.user) {
        setUser(data.user);
      }

      return { success: true, message: data.message, user: data.user };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during profile update.' };
    }
  };

  // Logout handler
  const logout = (redirectTo?: string | React.MouseEvent) => {
    const tokenKey = user?.role === 'superadmin' ? AUTH_TOKEN_KEYS.superadmin : AUTH_TOKEN_KEYS.user;
    localStorage.removeItem(tokenKey);
    localStorage.removeItem('resizer_auth_token');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    const target = typeof redirectTo === 'string' ? redirectTo : '/login';
    if (typeof window !== 'undefined') {
      window.location.href = target;
    }
  };

  const isSuperAdmin = user?.role === 'superadmin';
  const isUser = user?.role === 'user';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isSuperAdmin,
        isUser,
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
