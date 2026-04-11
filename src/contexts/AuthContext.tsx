import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_ENDPOINTS, apiFetch } from '@/config/api';

interface SubscriptionInfo {
  plan: string;
  status: string;
  expiryDate: string;
  isActive: boolean;
  daysLeft: number;
  messagesUsed: number;
  messageLimit: number;
}

interface UserInfo {
  id: number;
  email: string;
  name: string;
  role: string;
  subscription?: SubscriptionInfo;
}

interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Validate stored token on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth_token');
    if (!stored) {
      setIsLoading(false);
      return;
    }
    apiFetch(API_ENDPOINTS.auth.me)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data);
          setToken(stored);
        } else {
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch(API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Login failed');
    localStorage.setItem('auth_token', data.data.token);
    setToken(data.data.token);
    setUser(data.data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await apiFetch(API_ENDPOINTS.auth.register, {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('auth_token', data.data.token);
    setToken(data.data.token);
    setUser(data.data.user);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
