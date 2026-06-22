export interface FacebookPage {
  id: string;
  name: string;
  category: string;
  picture?: { data: { url: string } };
  followerCount?: number;
}

export interface FacebookSessionStatus {
  isConnected: boolean;
  selectedPageId: string | null;
  selectedPageName: string | null;
  selectedPagePicture: string | null;
  connectedAt: string | null;
}

export interface FacebookPost {
  id: string;
  message: string;
  story?: string;
  fullPicture?: string;
  permalinkUrl: string;
  createdTime: string;
  scheduledPublishTime?: string;
  isPublished: boolean;
}

export interface FacebookPostInsights {
  postId: string;
  reach: number;
  impressions: number;
  reactions: number;
  comments: number;
  shares: number;
  clicks: number;
}

export interface CreateFacebookPostPayload {
  message: string;
  link?: string;
  imageUrl?: string;
  scheduledAt?: string;
}

export interface FacebookScheduledPost {
  id: string;
  status: 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
  scheduledAt: string;
  createdAt: string;
  message: string;
  link?: string;
  result?: { postId?: string; error?: string };
}
