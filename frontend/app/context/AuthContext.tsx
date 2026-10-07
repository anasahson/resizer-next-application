'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { identifyUser, resetUser } from '../lib/posthog';

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
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<{ success: boolean; message?: string; user?: User }>;
  logout: (redirectTo?: string | React.MouseEvent) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || 'http://localhost:5000';

export const AUTH_TOKEN_KEYS = {
  primary: 'resizora_auth_token',
  user: 'resizer_user_auth_token',
  superadmin: 'resizer_superadmin_auth_token',
} as const;

export function getUserFromToken(storedToken: string): User | null {
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

export function getActiveAuthToken(): { token: string; key: string } | null {
  if (typeof window === 'undefined') return null;

  // 1. Check primary unified token
  const primary = localStorage.getItem('resizora_auth_token');
  if (primary && getUserFromToken(primary)) {
    return { token: primary, key: 'resizora_auth_token' };
  }

  // 2. Check superadmin role token
  const superToken = localStorage.getItem(AUTH_TOKEN_KEYS.superadmin);
  if (superToken && getUserFromToken(superToken)) {
    return { token: superToken, key: AUTH_TOKEN_KEYS.superadmin };
  }

  // 3. Check user role token
  const userToken = localStorage.getItem(AUTH_TOKEN_KEYS.user);
  if (userToken && getUserFromToken(userToken)) {
    return { token: userToken, key: AUTH_TOKEN_KEYS.user };
  }

  // 4. Check legacy tokens
  const legacyToken = localStorage.getItem('resizer_auth_token') || localStorage.getItem('token');
  if (legacyToken && getUserFromToken(legacyToken)) {
    return { token: legacyToken, key: 'resizer_auth_token' };
  }

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate stored token and fetch user on load
  const loadUserFromStorage = useCallback(async () => {
    try {
      const active = getActiveAuthToken();

      if (!active) {
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // 1. Immediately hydrate user from valid JWT payload (zero flicker / no false logout)
      const cachedUser = getUserFromToken(active.token);
      if (!cachedUser) {
        localStorage.removeItem(active.key);
        localStorage.removeItem('resizora_auth_token');
        setToken(null);
        setUser(null);
        setIsLoading(false);
        return;
      }

      setToken(active.token);
      setUser(cachedUser);
      // Tie this PostHog visitor to the real account so per-page visitor
      // counts can distinguish signed-in people from anonymous devices.
      identifyUser(cachedUser);
      setIsLoading(false);

      // 2. Attempt to verify profile against backend
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${active.token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          }
        } else if (res.status === 401) {
          // Token is strictly rejected as expired or invalid by server
          localStorage.removeItem('resizora_auth_token');
          localStorage.removeItem(active.key);
          setToken(null);
          setUser(null);
        }
      } catch (networkErr) {
        // Network error or backend temporarily offline: preserve session from valid JWT!
        console.warn('Backend /api/auth/me unreachable, keeping session from JWT payload');
      }
    } catch (err) {
      console.warn('Failed to load user profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Session hydration intentionally updates state synchronously on mount so the
  // app never flashes a logged-out frame while the stored JWT is validated.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

      // Store in primary unified token key
      localStorage.setItem('resizora_auth_token', data.token);

      // Also set role-specific key for backward compatibility
      if (data.user.role === 'superadmin') {
        localStorage.setItem(AUTH_TOKEN_KEYS.superadmin, data.token);
      } else {
        localStorage.setItem(AUTH_TOKEN_KEYS.user, data.token);
      }

      identifyUser(data.user);

      return { success: true, message: data.message, user: data.user };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return { success: false, message: message || 'Network error during login.' };
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
      identifyUser(data.user);

      return { success: true, message: data.message };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return { success: false, message: message || 'Network error during registration.' };
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
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return { success: false, message: message || 'Network error during profile update.' };
    }
  };

  // Logout handler
  const logout = (redirectTo?: string | React.MouseEvent) => {
    localStorage.removeItem('resizora_auth_token');
    localStorage.removeItem(AUTH_TOKEN_KEYS.superadmin);
    localStorage.removeItem(AUTH_TOKEN_KEYS.user);
    localStorage.removeItem('resizer_auth_token');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    resetUser(); // stop attributing further events to the signed-out user
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
