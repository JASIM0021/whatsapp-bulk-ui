export interface EmailStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  bounced: number;
  opened: number;
  clicked: number;
  totalOpens: number;
  totalClicks: number;
  openRate: number;
  clickRate: number;
  clickToOpen: number;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  bodyHtml?: string;
  status: 'active' | 'sending' | 'scheduled';
  createdAt: string;
  lastSentAt?: string;
  stats: EmailStats;
}

export interface EmailRecipient {
  id: string;
  email: string;
  name?: string;
  subject: string;
  status: 'queued' | 'sent' | 'failed' | 'bounced';
  error?: string;
  sentAt?: string;
  openCount: number;
  clickCount: number;
  firstOpenedAt?: string;
  lastOpenedAt?: string;
  firstClickedAt?: string;
  lastClickedAt?: string;
}

export interface EmailDailyStat { date: string; sent: number; opened: number; clicked: number; failed: number }

export interface EmailAnalyticsOverview {
  all: EmailStats;
  campaigns: EmailStats;
  campaignCount: number;
  daily: EmailDailyStat[];
  recentCampaigns: EmailCampaign[];
}

/** Payload handed from the Campaigns tab to the composer for re-targeting. */
export interface RetargetPayload {
  campaignId: string;
  campaignName: string;
  subject: string;
  bodyHtml: string;
  contacts: { email: string; name?: string; vars?: Record<string, string> }[];
}
export const RETARGET_STORAGE_KEY = 'email_retarget';

export const fmtNum = (n: number) => (n ?? 0).toLocaleString();
export const fmtPct = (n: number) => `${(n ?? 0).toFixed(1)}%`;
export const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
