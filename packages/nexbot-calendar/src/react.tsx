import React, { useEffect, useRef, useCallback } from 'react';
import { NexbotCalendarSDK } from './sdk';
import { NexbotBooking, NexbotPopupOptions } from './types';

export interface UseNexbotCalendarOptions {
  host?: string;
  onBookingComplete?: (booking: NexbotBooking) => void;
  onModalOpen?: () => void;
  onModalClose?: () => void;
}

/**
 * React hook to open Nexbot Calendar popup modals programmatically
 */
export function useNexbotCalendar(defaultHostOrOptions?: string | UseNexbotCalendarOptions) {
  const host = typeof defaultHostOrOptions === 'string'
    ? defaultHostOrOptions
    : defaultHostOrOptions?.host;

  const sdk = NexbotCalendarSDK.getInstance(host);

  const openBookingModal = useCallback((options: NexbotPopupOptions) => {
    sdk.openPopup({
      ...options,
      host: options.host || host,
    });
  }, [sdk, host]);

  return {
    openBookingModal,
    sdk,
  };
}

export interface NexbotCalendarInlineProps {
  user: string;
  event?: string;
  host?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
  boxShadow?: string;
  className?: string;
  style?: React.CSSProperties;
  onBookingComplete?: (booking: NexbotBooking) => void;
}

/**
 * Drop-in React Component for inline booking calendar
 */
export function NexbotCalendarInline({
  user,
  event = 'meeting',
  host,
  width = '100%',
  height = '720px',
  borderRadius = '16px',
  boxShadow = '0 4px 20px rgba(0,0,0,0.06)',
  className,
  style,
  onBookingComplete,
}: NexbotCalendarInlineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const sdk = NexbotCalendarSDK.getInstance(host);
    sdk.initInline({
      element: containerRef.current,
      user,
      event,
      host,
      width: '100%',
      height: '100%',
      borderRadius: '0px',
      boxShadow: 'none',
    });

    if (onBookingComplete) {
      const unsub = sdk.on('booking-completed', onBookingComplete);
      return unsub;
    }
  }, [user, event, host, onBookingComplete]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height,
        borderRadius,
        boxShadow,
        overflow: 'hidden',
        ...style,
      }}
    />
  );
}

export interface NexbotCalendarButtonProps extends NexbotPopupOptions {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Drop-in React Component Button that triggers booking popup
 */
export function NexbotCalendarButton({
  user,
  event = 'meeting',
  host,
  text = 'Book a Call',
  color = '#10B981',
  children,
  className,
  style,
  onBookingComplete,
  onModalOpen,
  onModalClose,
}: NexbotCalendarButtonProps) {
  const { openBookingModal } = useNexbotCalendar(host);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openBookingModal({
      user,
      event,
      host,
      text,
      color,
      onBookingComplete,
      onModalOpen,
      onModalClose,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      style={
        className
          ? style
          : {
              padding: '12px 24px',
              backgroundColor: color,
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '14px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s',
              ...style,
            }
      }
    >
      {children || text}
    </button>
  );
}
