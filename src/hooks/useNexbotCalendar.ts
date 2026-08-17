import { useCallback } from 'react';
import { NexbotCalendarSDK, NexbotPopupOptions } from '@/lib/nexbot-calendar-sdk';

export function useNexbotCalendar(customHost?: string) {
  const sdk = NexbotCalendarSDK.getInstance(customHost);

  const openBookingModal = useCallback((options: NexbotPopupOptions) => {
    sdk.openPopup(options);
  }, [sdk]);

  return {
    openBookingModal,
  };
}
