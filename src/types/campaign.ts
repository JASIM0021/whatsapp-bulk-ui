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
  followUp?: CampaignFollowUp
  followUpSent: number
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
  followUpAt?: string
  followUpText?: string
  followUpError?: string
}

export type Segment = 'all' | 'not_read' | 'read' | 'replied' | 'not_replied' | 'failed'
export type FollowUpAudience = 'not_replied' | 'not_read' | 'all'
export const FOLLOW_UP_DAYS = [7, 14, 21, 30] as const

export interface CampaignFollowUp {
  enabled: boolean
  afterDays: number
  audience: FollowUpAudience
  instructions?: string
  message?: string
  updatedAt?: string
}

/** Where a send is tracked: an existing campaign, a new one, or none (both empty). */
export interface CampaignSendTarget {
  campaignId?: string
  campaignName?: string
  followUpDays?: number
}

/** Contacts handed from a campaign's retarget action to the WhatsApp composer. */
export interface WaRetargetPayload {
  campaignId: string
  campaignName: string
  segment: Segment
  contacts: { phone: string; name: string }[]
}
export const WA_RETARGET_STORAGE_KEY = 'nexa_wa_retarget'

export interface CampaignDetail {
  campaign: Campaign
  messages: CampaignMessage[]
  nextFollowUpAt?: string | null
  followUpPending?: number
}

export interface CampaignListResponse {
  campaigns: Campaign[]
  total: number
  page: number
  limit: number
}
