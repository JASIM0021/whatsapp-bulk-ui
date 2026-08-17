export interface CustomQuestion {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'phone';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface EventType {
  id?: string;
  title: string;
  slug: string;
  description: string;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  locationType: 'google_meet' | 'phone' | 'in_person' | 'custom';
  locationDetails: string;
  color: string;
  isActive: boolean;
  customQuestions: CustomQuestion[];
  requiresConfirmation: boolean;
  price: number;
  currency: string;
  redirectUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeRange {
  start: string; // "09:00"
  end: string;   // "17:00"
}

export interface DayAvailability {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isEnabled: boolean;
  ranges: TimeRange[];
}

export interface DateOverride {
  date: string; // "YYYY-MM-DD"
  isBlocked: boolean;
  ranges?: TimeRange[];
}

export interface AvailabilitySchedule {
  id?: string;
  timezone: string;
  weeklyHours: DayAvailability[];
  dateOverrides: DateOverride[];
  minNoticeHours: number;
  maxAdvanceDays: number;
  slotIntervalMinutes: number;
}

export interface CalendarBranding {
  id?: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  companyName: string;
  brandColor: string;
  themeMode: 'light' | 'dark' | 'auto';
  welcomeHeadline: string;
  footerText: string;
  hideNexbotBranding: boolean;
  confirmationMessage: string;
}

export interface Booking {
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
  locationDetails: string;
  meetLink?: string;
  googleEventId?: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled';
  cancellationReason?: string;
  cancelledBy?: string;
  cancelToken: string;
  rescheduleToken: string;
  createdAt: string;
}

export interface CalendarWebhook {
  id: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export interface CalendarAccount {
  id?: string;
  email: string;
  isConnected: boolean;
  autoCreateMeet: boolean;
  syncStatus: string;
  lastSyncedAt?: string;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  formatted: string;
}

export interface PublicEventInfo {
  host: CalendarBranding;
  event: EventType;
  timezone: string;
  availableDays: string[];
}
