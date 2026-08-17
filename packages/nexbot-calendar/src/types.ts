export interface NexbotBooking {
  id: string;
  userId: string;
  eventTypeId: string;
  eventTitle: string;
  eventSlug: string;
  hostName: string;
  hostEmail: string;
  inviteeName: string;
  inviteeEmail: string;
  inviteePhone?: string;
  inviteeNotes?: string;
  customAnswers?: Record<string, any>;
  startTime: string;
  endTime: string;
  timezone: string;
  durationMinutes: number;
  locationType: string;
  locationDetails?: string;
  meetLink?: string;
  googleEventId?: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled';
  cancelToken?: string;
  rescheduleToken?: string;
  createdAt: string;
}

export interface NexbotInlineOptions {
  element: string | HTMLElement;
  user: string;
  event?: string;
  host?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
  boxShadow?: string;
  className?: string;
}

export interface NexbotPopupOptions {
  user: string;
  event?: string;
  host?: string;
  text?: string;
  color?: string;
  onBookingComplete?: (booking: NexbotBooking) => void;
  onModalOpen?: () => void;
  onModalClose?: () => void;
}

export interface NexbotButtonOptions extends NexbotPopupOptions {
  position?: 'bottom-right' | 'bottom-left';
}
