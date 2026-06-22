import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCheck, Check, Clock, X as XIcon,
  MessageSquare, RefreshCw, Users,
  Inbox, Send, Search,
} from 'lucide-react'
import { apiFetch, API_ENDPOINTS } from '@/config/api'
import type { Campaign, CampaignMessage, CampaignDetail } from '@/types/campaign'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return Math.floor(diff / 60_000) + 'm ago'
  if (diff < 86_400_000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff < 7 * 86_400_000)
    return d.toLocaleDateString([], { weekday: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}

function fmtDateTime(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

// Delivery tick icon — WhatsApp style
function DeliveryTick({ status }: { status: string }) {
  switch (status) {
    case 'queued':
      return <Clock size={13} className="text-gray-400" />
    case 'sent':
      return <Check size={13} className="text-gray-400" />
    case 'delivered':
      return <CheckCheck size={13} className="text-gray-400" />
    case 'read':
      return <CheckCheck size={13} className="text-blue-500" />
    case 'failed':
      return <XIcon size={13} className="text-red-500" />
    default:
      return <Clock size={13} className="text-gray-300" />
  }
}

const STATUS_LABEL: Record<string, string> = {
  queued: 'Queued',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Failed',
}

const STATUS_DOT: Record<string, string> = {
  running: 'bg-blue-500 animate-pulse',
  done: 'bg-green-500',
  stopped: 'bg-yellow-500',
  failed: 'bg-red-500',
}

// ─── Campaign list item ───────────────────────────────────────────────────────

function CampaignListItem({
  campaign,
  isSelected,
  onClick,
}: {
  campaign: Campaign
  isSelected: boolean
  onClick: () => void
}) {
  const sentPct = campaign.total > 0 ? Math.round((campaign.sent / campaign.total) * 100) : 0
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-green-50 border-l-4 border-l-green-600' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
          <Send size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 truncate">{campaign.name}</p>
            <span className="text-[11px] text-gray-400 shrink-0">{fmtDate(campaign.createdAt)}</span>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{campaign.preview || 'No message preview'}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[campaign.status] || 'bg-gray-400'}`} />
            <span className="text-[11px] text-gray-500">{campaign.total} contacts</span>
            <span className="text-[11px] text-gray-400">·</span>
            <span className="text-[11px] text-green-600">{sentPct}% sent</span>
            {campaign.replyCount > 0 && (
              <>
                <span className="text-[11px] text-gray-400">·</span>
                <span className="text-[11px] text-blue-600 font-medium">{campaign.replyCount} replies</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

// ─── Message row in detail view ───────────────────────────────────────────────

function MessageRow({
  msg,
  onView,
}: {
  msg: CampaignMessage
  onView: (m: CampaignMessage) => void
}) {
  return (
    <div
      onClick={() => onView(msg)}
      className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
        <span className="text-sm font-semibold text-gray-600">{(msg.name || msg.phone).charAt(0).toUpperCase()}</span>
      </div>

      {/* Contact info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">{msg.name || msg.phone}</p>
          {msg.name && <span className="text-[11px] text-gray-400 truncate">{msg.phone}</span>}
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">{msg.message}</p>
      </div>

      {/* Delivery status */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-1">
          <DeliveryTick status={msg.status} />
          <span className={`text-[11px] font-medium ${
            msg.status === 'read' ? 'text-blue-600'
            : msg.status === 'delivered' ? 'text-gray-600'
            : msg.status === 'failed' ? 'text-red-500'
            : 'text-gray-400'
          }`}>{STATUS_LABEL[msg.status] || msg.status}</span>
        </div>
        {msg.sentAt && (
          <span className="text-[10px] text-gray-300">{fmtDate(msg.sentAt)}</span>
        )}
      </div>

      {/* Reply indicator */}
      {msg.replyText ? (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium shrink-0 ${
          !msg.replyRead
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-gray-100 text-gray-500'
        }`}>
          <Inbox size={11} />
          {!msg.replyRead ? 'New' : 'Replied'}
        </div>
      ) : (
        <div className="w-14" />
      )}
    </div>
  )
}

// ─── Reply / Detail drawer ────────────────────────────────────────────────────

function ReplyDrawer({
  msg,
  onClose,
  onMarkRead,
}: {
  msg: CampaignMessage
  onClose: () => void
  onMarkRead: () => void
}) {
  const [replyText, setReplyText] = useState('')
  const [replySending, setReplySending] = useState(false)
  const [replySent, setReplySent] = useState(false)

  useEffect(() => {
    if (!msg.replyRead && msg.replyText) onMarkRead()
  }, [msg.id])

  const handleSendReply = async () => {
    if (!replyText.trim() || replySending) return
    setReplySending(true)
    try {
      await apiFetch(API_ENDPOINTS.campaigns.reply(msg.campaignId, msg.id), {
        method: 'POST',
        body: JSON.stringify({ message: replyText.trim() }),
      })
      setReplySent(true)
      setReplyText('')
    } catch {}
    setReplySending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white font-bold text-sm">{(msg.name || msg.phone).charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{msg.name || msg.phone}</p>
            <p className="text-green-100 text-xs">{msg.phone}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <XIcon size={16} />
          </button>
        </div>

        {/* Chat thread */}
        <div className="bg-[#efeae2] px-4 py-4 space-y-3 min-h-[160px] max-h-64 overflow-y-auto">
          {/* Outbound message */}
          <div className="flex justify-end">
            <div className="bg-[#d9fdd3] rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[85%] shadow-sm">
              <p className="text-sm text-gray-800 leading-relaxed">{msg.message}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px] text-gray-400">{msg.sentAt ? fmtDate(msg.sentAt) : ''}</span>
                <DeliveryTick status={msg.status} />
              </div>
            </div>
          </div>

          {/* Incoming reply */}
          {msg.replyText && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%] shadow-sm">
                <p className="text-sm text-gray-800 leading-relaxed">{msg.replyText}</p>
                {msg.replyAt && (
                  <p className="text-[10px] text-gray-400 mt-1 text-right">{fmtDate(msg.replyAt)}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Delivery timestamps */}
        <div className="px-5 py-3 border-t border-gray-100 space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Sent</span><span className="font-medium">{fmtDateTime(msg.sentAt)}</span>
          </div>
          {msg.deliveredAt && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Delivered</span><span className="font-medium">{fmtDateTime(msg.deliveredAt)}</span>
            </div>
          )}
          {msg.readAt && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Read by contact</span><span className="font-medium">{fmtDateTime(msg.readAt)}</span>
            </div>
          )}
          {msg.replyAt && (
            <div className="flex justify-between text-xs text-blue-600">
              <span>Replied</span><span className="font-medium">{fmtDateTime(msg.replyAt)}</span>
            </div>
          )}
        </div>

        {/* Send reply input */}
        <div className="px-5 py-3 border-t border-gray-100">
          {replySent ? (
            <p className="text-sm text-center text-green-600 font-medium py-1">Reply sent via WhatsApp!</p>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Type a reply…"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                onKeyDown={e => { if (e.key === 'Enter' && replyText.trim()) handleSendReply() }}
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim() || replySending}
                className="px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {replySending ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Re-target modal ──────────────────────────────────────────────────────────

function RetargetModal({
  campaign,
  messages,
  onClose,
}: {
  campaign: Campaign
  messages: CampaignMessage[]
  onClose: () => void
}) {
  const [retargetMsg, setRetargetMsg] = useState(campaign.preview || '')
  const [retargetName, setRetargetName] = useState(`Re: ${campaign.name}`)
  const [retargetFilter, setRetargetFilter] = useState<'all' | 'failed' | 'not_read'>('all')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState('')

  const targetContacts = messages.filter(m => {
    if (retargetFilter === 'failed') return m.status === 'failed'
    if (retargetFilter === 'not_read') return m.status !== 'read'
    return true
  })

  const handleRetarget = async () => {
    if (!retargetMsg.trim() || loading) return
    setLoading(true)
    const contacts = targetContacts.map(m => ({ phone: m.phone, name: m.name || '' }))
    try {
      const res = await apiFetch(API_ENDPOINTS.whatsapp.sendBg, {
        method: 'POST',
        body: JSON.stringify({
          contacts,
          messages: [{ type: 'text', text: retargetMsg }],
          campaignName: retargetName.trim() || `Re: ${campaign.name}`,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setDone(`Campaign started! ${contacts.length} contacts queued.`)
        setTimeout(onClose, 2500)
      } else {
        setDone('Error: ' + (json.error || 'Failed to start'))
      }
    } catch {
      setDone('Network error')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Re-target Campaign</h3>
            <p className="text-xs text-gray-400 mt-0.5">Send a follow-up to contacts from this campaign</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <XIcon size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Campaign name */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Campaign name</label>
            <input
              type="text"
              value={retargetName}
              onChange={e => setRetargetName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Target filter */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Send to</label>
            <div className="flex gap-2">
              {([
                ['all', 'All contacts'],
                ['failed', 'Failed only'],
                ['not_read', 'Not read'],
              ] as const).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setRetargetFilter(val)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${retargetFilter === val ? 'bg-green-600 text-white border-green-600' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">{targetContacts.length} contacts selected</p>
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Message</label>
            <textarea
              rows={4}
              value={retargetMsg}
              onChange={e => setRetargetMsg(e.target.value)}
              placeholder="Type your follow-up message…"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <button
              onClick={() => setRetargetMsg(campaign.preview || '')}
              className="text-[11px] text-blue-600 hover:underline mt-1"
            >
              Use same message as original
            </button>
          </div>

          {done && (
            <p className={`text-sm text-center font-medium ${done.startsWith('Error') || done.startsWith('Network') ? 'text-red-600' : 'text-green-600'}`}>
              {done}
            </p>
          )}

          <button
            onClick={handleRetarget}
            disabled={!retargetMsg.trim() || loading || targetContacts.length === 0}
            className="w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Starting…' : `Send to ${targetContacts.length} contacts`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Campaign detail panel ────────────────────────────────────────────────────

function CampaignDetailPanel({
  campaign,
  messages,
  onRefresh,
  isRefreshing,
}: {
  campaign: Campaign
  messages: CampaignMessage[]
  onRefresh: () => void
  isRefreshing: boolean
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'replied' | 'failed' | 'unread'>('all')
  const [activeMsg, setActiveMsg] = useState<CampaignMessage | null>(null)
  const [showRetarget, setShowRetarget] = useState(false)

  const handleMarkRead = async (msg: CampaignMessage) => {
    try {
      await apiFetch(API_ENDPOINTS.campaigns.markReplyRead(msg.campaignId, msg.id), { method: 'PATCH' })
      onRefresh()
    } catch {}
  }

  const filtered = messages.filter(m => {
    if (filter === 'replied') return !!m.replyText
    if (filter === 'failed') return m.status === 'failed'
    if (filter === 'unread') return m.replyText && !m.replyRead
    return true
  }).filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return m.name.toLowerCase().includes(q) || m.phone.includes(q)
  })

  return (
    <div className="flex flex-col h-full">
      {/* Campaign header */}
      <div className="flex-none bg-white border-b border-gray-200 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-base leading-tight truncate">{campaign.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(campaign.createdAt)}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowRetarget(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors"
            >
              <Users size={13} />
              Re-target
            </button>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-5 gap-2 mt-4">
          {[
            { label: 'Total', val: campaign.total, color: 'text-gray-700' },
            { label: 'Sent', val: campaign.sent, color: 'text-green-600' },
            { label: 'Delivered', val: campaign.delivered, color: 'text-blue-600' },
            { label: 'Read', val: campaign.readCount, color: 'text-violet-600' },
            { label: 'Replies', val: campaign.replyCount, color: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl py-2.5 px-2 text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {campaign.total > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((campaign.sent / campaign.total) * 100))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex-none flex gap-1 px-4 py-2.5 bg-gray-50 border-b border-gray-200 overflow-x-auto">
        {([
          ['all', 'All'],
          ['unread', 'Unread replies'],
          ['replied', 'All replies'],
          ['failed', 'Failed'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              filter === key ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex-none px-4 py-2.5 bg-white border-b border-gray-100">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No contacts match this filter</p>
          </div>
        ) : (
          filtered.map(msg => (
            <MessageRow
              key={msg.id}
              msg={msg}
              onView={setActiveMsg}
            />
          ))
        )}
      </div>

      {/* Re-target modal */}
      {showRetarget && (
        <RetargetModal
          campaign={campaign}
          messages={messages}
          onClose={() => setShowRetarget(false)}
        />
      )}

      {/* Reply/detail drawer */}
      {activeMsg && (
        <ReplyDrawer
          msg={activeMsg}
          onClose={() => setActiveMsg(null)}
          onMarkRead={() => handleMarkRead(activeMsg)}
        />
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CampaignPage() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<CampaignDetail | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.campaigns.list)
      const json = await res.json()
      if (json.success) {
        setCampaigns(json.data.campaigns || [])
        setTotal(json.data.total || 0)
      }
    } catch {}
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadCampaigns()
  }, [loadCampaigns])

  const loadDetail = useCallback(async (id: string, isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true)
    else setIsDetailLoading(true)
    try {
      const res = await apiFetch(API_ENDPOINTS.campaigns.get(id))
      const json = await res.json()
      if (json.success) {
        setDetail(json.data)
        setCampaigns(prev => prev.map(c => c.id === id ? json.data.campaign : c))
      }
    } catch {}
    setIsDetailLoading(false)
    setIsRefreshing(false)
  }, [])

  // Auto-refresh while campaign is still running
  useEffect(() => {
    if (!selectedId) return
    const campaign = detail?.campaign
    if (!campaign || campaign.status !== 'running') return
    const interval = setInterval(() => loadDetail(selectedId, true), 12_000)
    return () => clearInterval(interval)
  }, [selectedId, detail?.campaign?.status, loadDetail])

  const handleSelectCampaign = (id: string) => {
    setSelectedId(id)
    loadDetail(id)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex-none bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 py-3.5 flex items-center gap-4">
        <button
          onClick={() => navigate('/app')}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <MessageSquare size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-tight">Campaigns</h1>
            <p className="text-[11px] text-gray-400">{total} total</p>
          </div>
        </div>
        <button
          onClick={loadCampaigns}
          className="ml-auto p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <RefreshCw size={15} />
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Campaign list */}
        <div className={`flex-none border-r border-gray-200 bg-white overflow-y-auto ${selectedId ? 'hidden sm:flex sm:flex-col w-80' : 'flex flex-col w-full sm:w-80'}`}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <RefreshCw size={20} className="animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={24} className="text-green-500" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No campaigns yet</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                Send your first bulk WhatsApp message — it will appear here as a campaign.
              </p>
              <button
                onClick={() => navigate('/app')}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
              >
                Start a campaign
              </button>
            </div>
          ) : (
            campaigns.map(c => (
              <CampaignListItem
                key={c.id}
                campaign={c}
                isSelected={c.id === selectedId}
                onClick={() => handleSelectCampaign(c.id)}
              />
            ))
          )}
        </div>

        {/* Right: Detail panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedId && detail ? (
            <CampaignDetailPanel
              campaign={detail.campaign}
              messages={detail.messages}
              onRefresh={() => loadDetail(selectedId, true)}
              isRefreshing={isRefreshing}
            />
          ) : isDetailLoading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <RefreshCw size={24} className="animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 px-8">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare size={32} className="text-gray-300" />
              </div>
              <p className="text-base font-medium text-gray-500 mb-1">Select a campaign</p>
              <p className="text-sm text-center text-gray-400">Click a campaign on the left to view its messages, delivery status, and replies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
