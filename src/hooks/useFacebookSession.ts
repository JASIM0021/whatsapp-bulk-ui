import { useState, useCallback, useEffect } from 'react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { FacebookSessionStatus } from '@/types/facebook';

export interface FacebookSessionHook extends FacebookSessionStatus {
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_STATUS: FacebookSessionStatus = {
  isConnected: false,
  selectedPageId: null,
  selectedPageName: null,
  selectedPagePicture: null,
  connectedAt: null,
};

export function useFacebookSession(): FacebookSessionHook {
  const [status, setStatus] = useState<FacebookSessionStatus>(DEFAULT_STATUS);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.facebook.status);
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
