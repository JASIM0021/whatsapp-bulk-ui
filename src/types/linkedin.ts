export interface LinkedInSessionStatus {
  isConnected: boolean;
  hasCredentials: boolean;
  profileName?: string | null;
  profilePicture?: string | null;
  email?: string | null;
  connectedAt?: string | null;
  callbackUrl?: string | null;
}

export interface LinkedInPost {
  id: string;
  text: string;
  imageUrl?: string;
  postUrl?: string;
  createdAt: string;
}

export interface LinkedInScheduledPost {
  id: string;
  text: string;
  imageUrl?: string;
  scheduledAt: string;
  status: 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
  error?: string;
  postUrl?: string;
  createdAt: string;
}

export interface CreateLinkedInPostPayload {
  text: string;
  imageUrl?: string;
  scheduledAt?: string;
}
