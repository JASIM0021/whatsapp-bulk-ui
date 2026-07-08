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
  enabledServices?: string[];
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
  loginWithToken: (token: string, user: UserInfo) => void;
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
          const userData = data.data;
          setUser(userData);
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

  const applyBotDraft = async (tok: string) => {
    const raw = localStorage.getItem('botx_bot_draft');
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (!draft.businessName) return;
      await fetch(API_ENDPOINTS.bot.upsert, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tok}`,
        },
        body: JSON.stringify({
          businessName: draft.businessName || '',
          description: draft.description || '',
          website: draft.website || '',
          services: Array.isArray(draft.services) ? draft.services : [],
          bookingLink: '',
          productLink: '',
          isEnabled: false,
          excludedNumbers: [],
          customSystemPrompt: '',
        }),
      });
      localStorage.removeItem('botx_bot_draft');
    } catch {
      // Non-critical — silently ignore
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await apiFetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      const userData = data.data.user;
      const tok = data.data.token;

      localStorage.setItem('auth_token', tok);
      setToken(tok);
      setUser(userData);
      await applyBotDraft(tok);
    } catch (err: any) {
      throw err;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await apiFetch(API_ENDPOINTS.auth.register, {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Registration failed');
    const userData = data.data.user;
    const tok = data.data.token;
    localStorage.setItem('auth_token', tok);
    setToken(tok);
    setUser(userData);
    await applyBotDraft(tok);
  };

  const loginWithToken = (tok: string, userData: UserInfo) => {
    localStorage.setItem('auth_token', tok);
    setToken(tok);
    setUser(userData);
    applyBotDraft(tok); // fire-and-forget
  };

  const logout = async () => {
    try {
      // Call the logout API to revoke the current session
      await apiFetch(API_ENDPOINTS.auth.logout, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Logout API call failed:', err);
      // Continue with local logout even if API call fails
    } finally {
      // Always clear local storage and state
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!user, isLoading, login, register, loginWithToken, logout }}
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
