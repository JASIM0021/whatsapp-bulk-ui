import { useState, useCallback, useEffect } from 'react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { LinkedInSessionStatus } from '@/types/linkedin';

export interface LinkedInSessionHook extends LinkedInSessionStatus {
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_STATUS: LinkedInSessionStatus = {
  isConnected: false,
  hasCredentials: false,
  profileName: null,
  profilePicture: null,
  email: null,
  connectedAt: null,
  callbackUrl: null,
};

export function useLinkedInSession(): LinkedInSessionHook {
  const [status, setStatus] = useState<LinkedInSessionStatus>(DEFAULT_STATUS);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.linkedin.status);
      const data = await res.json();
      if (data.success && data.data) {
        setStatus(data.data);
      } else {
        setStatus(DEFAULT_STATUS);
      }
    } catch {
      // safe failure — leave state at defaults
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...status, isLoading, refresh };
}
