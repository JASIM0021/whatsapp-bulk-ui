export type CampaignStatus = 'running' | 'done' | 'stopped' | 'failed'
export type MsgStatus = 'queued' | 'sent' | 'failed' | 'delivered' | 'read'

export interface Campaign {
  id: string
  userId: string
  name: string
  preview: string
  total: number
  sent: number
  failed: number
  delivered: number
  readCount: number
  replyCount: number
  status: CampaignStatus
  createdAt: string
  completedAt?: string
}

export interface CampaignMessage {
  id: string
  campaignId: string
  userId: string
  phone: string
  name: string
  message: string
  status: MsgStatus
  waMsgId?: string
  errorMsg?: string
  sentAt?: string
  deliveredAt?: string
  readAt?: string
  replyText?: string
  replyAt?: string
  replyRead: boolean
}

export interface CampaignDetail {
  campaign: Campaign
  messages: CampaignMessage[]
}

export interface CampaignListResponse {
  campaigns: Campaign[]
  total: number
  page: number
  limit: number
}
