import { useState, useCallback, useEffect } from 'react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { SEOSiteConfig } from '@/types/seo';

export interface SEOSessionHook {
  config: SEOSiteConfig | null;
  isLoading: boolean;
  isSetup: boolean;
  refresh: () => Promise<void>;
}

export function useSEOSession(): SEOSessionHook {
  const [config, setConfig] = useState<SEOSiteConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.seo.config);
      const data = await res.json();
      if (data.success && data.data) {
        setConfig(data.data);
      } else {
        setConfig(null);
      }
    } catch {
      // safe failure
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { config, isLoading, isSetup: config !== null, refresh };
}
