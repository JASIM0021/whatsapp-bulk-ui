import { useState, useCallback, useEffect } from 'react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

export interface SetupStatus {
  step1Done: boolean;  // bot.businessName is non-empty
  step2Done: boolean;  // whatsapp isConnected && isReady
  step3Done: boolean;  // bot.isEnabled === true
  isComplete: boolean; // all three true
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useSetupStatus(): SetupStatus {
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [botRes, waRes] = await Promise.all([
        apiFetch(API_ENDPOINTS.bot.get),
        apiFetch(API_ENDPOINTS.whatsapp.status),
      ]);
      const botData = await botRes.json();
      const waData = await waRes.json();

      const bot = botData.success ? botData.data : null;
      const wa = waData.success ? waData.data : null;

      setStep1Done(!!bot?.businessName);
      setStep2Done(!!(wa?.isConnected && wa?.isReady));
      setStep3Done(!!bot?.isEnabled);
    } catch {
      // leave defaults (false) — safe failure
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return {
    step1Done,
    step2Done,
    step3Done,
    isComplete: step1Done && step2Done && step3Done,
    isLoading,
    refresh,
  };
}
