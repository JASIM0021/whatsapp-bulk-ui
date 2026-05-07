import { useState, useCallback } from 'react';
import { API_ENDPOINTS, apiFetch } from '@/config/api';

export interface Session {
  id: string;
  userId: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.auth.sessions);
      const data = await res.json();
      if (data.success) {
        setSessions(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch sessions');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  const logoutAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.auth.logoutAll, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        await fetchSessions(); // Refresh the list
        return { success: true, message: data.message, revokedCount: data.data?.revokedSessions };
      } else {
        setError(data.error || 'Failed to logout from all devices');
        return { success: false, message: data.error };
      }
    } catch (err) {
      setError('Failed to connect to server');
      return { success: false, message: 'Failed to connect to server' };
    } finally {
      setLoading(false);
    }
  }, [fetchSessions]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    logoutAll,
  };
}