import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCheck, Check, Clock, X as XIcon,
  MessageSquare, RefreshCw, Users,
  Inbox, Send, Search, Sparkles, Loader2,
} from 'lucide-react'
import { apiFetch, API_ENDPOINTS } from '@/config/api'
import {
  FOLLOW_UP_DAYS, WA_RETARGET_STORAGE_KEY,
  type Campaign, type CampaignMessage, type CampaignDetail, type CampaignFollowUp,
  type FollowUpAudience, type Segment, type WaRetargetPayload,
} from '@/types/campaign'

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

const SEGMENTS: { id: Segment; label: string; hint: string }[] = [
  { id: 'not_replied', label: "Didn't reply", hint: 'Got the message but never answered' },
  { id: 'not_read', label: 'Not read', hint: 'Delivered but never opened' },
  { id: 'read', label: 'Read', hint: 'Opened the message' },
  { id: 'replied', label: 'Replied', hint: 'Answered at least once' },
  { id: 'failed', label: 'Failed', hint: 'Send failed: retry these' },
  { id: 'all', label: 'Everyone', hint: 'Every contact in this campaign' },
]

function RetargetModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const navigate = useNavigate()
  const [counts, setCounts] = useState<Record<string, number> | null>(null)
  const [segment, setSegment] = useState<Segment>('not_replied')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch(API_ENDPOINTS.campaigns.segments(campaign.id))
      .then(r => r.json())
      .then(d => { if (d.success) setCounts(d.data) })
      .catch(() => setError('Could not load segments'))
  }, [campaign.id])

  const openInComposer = async () => {
    setLoading(true); setError('')
    try {
      const res = await apiFetch(API_ENDPOINTS.campaigns.retarget(campaign.id), { method: 'POST', body: JSON.stringify({ segment }) })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || 'Failed to load contacts')
      if (!d.data?.length) { setError('Nobody is in that segment yet.'); return }
      const payload: WaRetargetPayload = { campaignId: campaign.id, campaignName: campaign.name, segment, contacts: d.data }
      sessionStorage.setItem(WA_RETARGET_STORAGE_KEY, JSON.stringify(payload))
      navigate('/whatsapp')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900">Re-target “{campaign.name}”</h3>
            <p className="text-xs text-gray-500 mt-0.5">Pick who to message again. They open in the composer with this campaign preselected, so you can use variables, images, scheduling and follow-ups.</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700"><XIcon size={16} /></button>
        </div>
        <div className="space-y-1.5">
          {SEGMENTS.map(sg => {
            const n = counts?.[sg.id]
            return (
              <label key={sg.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer ${segment === sg.id ? 'border-green-500 bg-green-50/60' : 'border-gray-200 hover:border-gray-300'} ${n === 0 ? 'opacity-50' : ''}`}>
                <input type="radio" name="segment" checked={segment === sg.id} onChange={() => setSegment(sg.id)} className="text-green-600 focus:ring-green-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{sg.label}</p>
                  <p className="text-[11px] text-gray-400">{sg.hint}</p>
                </div>
                <span className="text-sm font-bold text-gray-700">{n ?? '…'}</span>
              </label>
            )
          })}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button onClick={openInComposer} disabled={loading || !counts || counts[segment] === 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          Open {counts?.[segment] ?? ''} contact{counts?.[segment] === 1 ? '' : 's'} in composer
        </button>
      </div>
    </div>
  )
}

// ─── Auto follow-up ───────────────────────────────────────────────────────────

const AUDIENCES: { id: FollowUpAudience; label: string }[] = [
  { id: 'not_replied', label: "People who didn't reply" },
  { id: 'not_read', label: "People who didn't read it" },
  { id: 'all', label: 'Everyone who received it' },
]

function FollowUpPanel({
  campaign, nextFollowUpAt, pending, onSaved,
}: {
  campaign: Campaign
  nextFollowUpAt?: string | null
  pending?: number
  onSaved: () => void
}) {
  const initial: CampaignFollowUp = campaign.followUp ?? { enabled: false, afterDays: 7, audience: 'not_replied' }
  const [f, setF] = useState<CampaignFollowUp>(initial)
  const [open, setOpen] = useState(!!campaign.followUp?.enabled)
  const [saving, setSaving] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    setF(campaign.followUp ?? { enabled: false, afterDays: 7, audience: 'not_replied' })
  }, [campaign.id, campaign.followUp])

  const save = async (next: CampaignFollowUp) => {
    setSaving(true); setMsg(null)
    try {
      const res = await apiFetch(API_ENDPOINTS.campaigns.followUp(campaign.id), { method: 'PUT', body: JSON.stringify(next) })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || 'Failed to save')
      setF(d.data.campaign.followUp ?? next)
      setMsg({ ok: true, text: next.enabled ? `Auto follow-up on: ${next.afterDays} days after each message.` : 'Auto follow-up switched off.' })
      onSaved()
    } catch (e: unknown) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  const draft = async () => {
    setDrafting(true); setMsg(null)
    try {
      const res = await apiFetch(API_ENDPOINTS.campaigns.followUpGenerate(campaign.id), {
        method: 'POST', body: JSON.stringify({ instructions: f.instructions ?? '', afterDays: f.afterDays }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || 'AI could not write a message')
      setF(prev => ({ ...prev, message: d.data.message }))
    } catch (e: unknown) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'AI could not write a message' })
    } finally {
      setDrafting(false)
    }
  }

  return (
    <div className="mt-3 border border-violet-200 bg-violet-50/40 rounded-xl">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left">
        <span className="flex items-center gap-2 text-sm font-semibold text-violet-900">
          <Sparkles size={14} />AI auto follow-up
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${f.enabled ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            {f.enabled ? `ON · ${f.afterDays} days` : 'OFF'}
          </span>
        </span>
        <span className="text-[11px] text-violet-700">
          {campaign.followUpSent > 0 && `${campaign.followUpSent} sent`}
          {f.enabled && nextFollowUpAt && ` · next ${new Date(nextFollowUpAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}`}
          {f.enabled && !!pending && ` · ${pending} waiting`}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2.5">
          <p className="text-[11px] text-gray-500">AI sends one follow-up to each matching contact once their message is this many days old. It uses your WhatsApp connection, the same pacing as bulk sends, and counts toward your message quota.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-xs text-gray-600">Send after
              <select value={f.afterDays} onChange={e => setF({ ...f, afterDays: Number(e.target.value) })}
                className="mt-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white">
                {FOLLOW_UP_DAYS.map(d => <option key={d} value={d}>{d} days</option>)}
              </select>
            </label>
            <label className="text-xs text-gray-600">Who gets it
              <select value={f.audience} onChange={e => setF({ ...f, audience: e.target.value as FollowUpAudience })}
                className="mt-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white">
                {AUDIENCES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </label>
          </div>
          <label className="block text-xs text-gray-600">Instructions for the AI (optional)
            <input value={f.instructions ?? ''} onChange={e => setF({ ...f, instructions: e.target.value })} maxLength={500}
              placeholder="e.g. mention the offer ends Sunday, keep it short"
              className="mt-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white" />
          </label>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Follow-up message</span>
              <button onClick={draft} disabled={drafting} className="flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:underline disabled:opacity-50">
                {drafting ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}Write with AI
              </button>
            </div>
            <textarea value={f.message ?? ''} onChange={e => setF({ ...f, message: e.target.value })} rows={3} maxLength={1000}
              placeholder="Leave empty and AI writes it when the first follow-up is due. {{name}} is filled per contact."
              className="mt-1 w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => save({ ...f, enabled: true })} disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50">
              {saving ? 'Saving…' : f.enabled ? 'Save changes' : 'Turn on auto follow-up'}
            </button>
            {f.enabled && (
              <button onClick={() => save({ ...f, enabled: false })} disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-300 hover:bg-white disabled:opacity-50">
                Turn off
              </button>
            )}
            {msg && <span className={`text-xs ${msg.ok ? 'text-violet-700' : 'text-red-600'}`}>{msg.text}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

function CampaignDetailPanel({
  campaign,
  messages,
  onRefresh,
  isRefreshing,
  nextFollowUpAt,
  followUpPending,
}: {
  campaign: Campaign
  messages: CampaignMessage[]
  onRefresh: () => void
  isRefreshing: boolean
  nextFollowUpAt?: string | null
  followUpPending?: number
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

        <FollowUpPanel campaign={campaign} nextFollowUpAt={nextFollowUpAt} pending={followUpPending} onSaved={onRefresh} />

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
              nextFollowUpAt={detail.nextFollowUpAt}
              followUpPending={detail.followUpPending}
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
