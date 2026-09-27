import { useEffect, useState } from 'react';
import {
  Loader2, Megaphone, ArrowLeft, Trash2, Search, Target, RefreshCw, MailOpen, MousePointerClick, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { KpiGrid, StatusPill } from './emailAnalytics';
import {
  EmailCampaign, EmailRecipient, RetargetPayload, RETARGET_STORAGE_KEY, fmtNum, fmtPct, fmtDate,
} from './emailAnalyticsTypes';

type Segment = 'all' | 'opened' | 'not_opened' | 'clicked' | 'not_clicked' | 'failed';

const SEGMENTS: { id: Segment; label: string; hint: string }[] = [
  { id: 'all', label: 'Everyone', hint: 'Every address in this campaign' },
  { id: 'opened', label: 'Opened', hint: 'Opened at least once' },
  { id: 'not_opened', label: 'Not opened', hint: 'Delivered but never opened' },
  { id: 'clicked', label: 'Clicked', hint: 'Clicked a link' },
  { id: 'not_clicked', label: 'Not clicked', hint: 'Delivered, no clicks' },
  { id: 'failed', label: 'Failed', hint: 'Send failed: retry these' },
];

export function EmailCampaignsPage({ selectedId, onSelect, onRetarget }: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRetarget: () => void;
}) {
  if (selectedId) return <CampaignDetail id={selectedId} onBack={() => onSelect(null)} onRetarget={onRetarget} />;
  return <CampaignList onSelect={onSelect} />;
}

function CampaignList({ onSelect }: { onSelect: (id: string) => void }) {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [reloadTick, setReloadTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await apiFetch(API_ENDPOINTS.email.campaigns);
        const d = await r.json();
        if (cancelled) return;
        if (d.success) { setCampaigns(d.data || []); setError(''); }
        else setError(d.error || 'Failed to load campaigns');
      } catch { if (!cancelled) setError('Failed to load campaigns'); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [reloadTick]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (error) return <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>;

  if (campaigns.length === 0) return (
    <div className="text-center py-20 px-4">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center"><Megaphone className="text-blue-600" size={24} /></div>
      <p className="font-semibold text-gray-900">No campaigns yet</p>
      <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">Send emails from the Send tab and choose “Create campaign”. Opens, clicks and deliveries will show up here.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => { setLoading(true); setReloadTick(t => t + 1); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg">
          <RefreshCw size={12} />Refresh
        </button>
      </div>
      <div className="grid gap-3">
        {campaigns.map(c => (
          <button key={c.id} onClick={() => onSelect(c.id)}
            className="text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-blue-200 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                  <StatusPill status={c.status} />
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{c.subject || 'No subject'} · created {fmtDate(c.createdAt)}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3 text-xs">
              <Metric label="Sent" value={fmtNum(c.stats.sent)} />
              <Metric label="Delivered" value={fmtNum(c.stats.delivered)} />
              <Metric label="Opened" value={`${fmtNum(c.stats.opened)} · ${fmtPct(c.stats.openRate)}`} />
              <Metric label="Clicked" value={`${fmtNum(c.stats.clicked)} · ${fmtPct(c.stats.clickRate)}`} />
              <Metric label="Failed" value={fmtNum(c.stats.failed)} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
      <p className="text-gray-900 font-semibold tabular-nums truncate">{value}</p>
    </div>
  );
}

const PAGE = 25;

function CampaignDetail({ id, onBack, onRetarget }: { id: string; onBack: () => void; onRetarget: () => void }) {
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [error, setError] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<EmailRecipient[]>([]);
  const [total, setTotal] = useState(0);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [retargeting, setRetargeting] = useState<Segment | null>(null);

  const loadCampaign = async () => {
    try {
      const r = await apiFetch(API_ENDPOINTS.email.campaign(id));
      const d = await r.json();
      if (d.success) setCampaign(d.data);
      else setError(d.error || 'Campaign not found');
    } catch { setError('Failed to load campaign'); }
  };

  const loadRows = async () => {
    setRowsLoading(true);
    try {
      const q = new URLSearchParams({ segment, page: String(page), limit: String(PAGE) });
      if (search.trim()) q.set('search', search.trim());
      const r = await apiFetch(`${API_ENDPOINTS.email.campaignRecipients(id)}?${q}`);
      const d = await r.json();
      if (d.success) { setRows(d.data || []); setTotal(d.total || 0); }
    } catch { /* keep previous rows */ }
    setRowsLoading(false);
  };

  useEffect(() => { loadCampaign(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(loadRows, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [id, segment, page, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const retarget = async (seg: Segment) => {
    if (!campaign) return;
    setRetargeting(seg);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.campaignRetarget(id), { method: 'POST', body: JSON.stringify({ segment: seg }) });
      const d = await r.json();
      if (!d.success) { alert(d.error || 'Failed to build audience'); return; }
      if (!d.data?.length) { alert('Nobody is in that segment yet.'); return; }
      const payload: RetargetPayload = {
        campaignId: campaign.id,
        campaignName: campaign.name,
        subject: campaign.subject,
        bodyHtml: campaign.bodyHtml || '',
        contacts: d.data,
      };
      sessionStorage.setItem(RETARGET_STORAGE_KEY, JSON.stringify(payload));
      onRetarget();
    } catch { alert('Failed to build audience'); }
    finally { setRetargeting(null); }
  };

  const remove = async () => {
    if (!campaign || !confirm(`Delete campaign "${campaign.name}" and all its tracking data? This cannot be undone.`)) return;
    const r = await apiFetch(API_ENDPOINTS.email.campaign(id), { method: 'DELETE' });
    const d = await r.json();
    if (d.success) onBack(); else alert(d.error || 'Failed to delete');
  };

  if (error) return (
    <div className="space-y-3">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"><ArrowLeft size={14} />Campaigns</button>
      <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>
    </div>
  );
  if (!campaign) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 mb-1.5"><ArrowLeft size={13} />All campaigns</button>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900 truncate">{campaign.name}</h2>
            <StatusPill status={campaign.status} />
          </div>
          <p className="text-xs text-gray-400 truncate">{campaign.subject} · created {fmtDate(campaign.createdAt)} · last sent {fmtDate(campaign.lastSentAt)}</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={() => { loadCampaign(); loadRows(); }} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg border border-transparent hover:border-gray-200" title="Refresh"><RefreshCw size={14} /></button>
          <button onClick={remove} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete campaign"><Trash2 size={14} /></button>
        </div>
      </div>

      <KpiGrid stats={campaign.stats} />

      {/* Re-target */}
      <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/60 rounded-2xl border border-blue-100 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Target size={15} className="text-blue-600" />
          <span className="font-semibold text-gray-900 text-sm">Re-target this campaign</span>
        </div>
        <p className="text-xs text-gray-500 mb-3">Pick an audience: it opens in Send with this campaign's email pre-filled, and the new send is added to this campaign.</p>
        <div className="flex flex-wrap gap-2">
          {SEGMENTS.map(s => (
            <button key={s.id} onClick={() => retarget(s.id)} disabled={retargeting !== null} title={s.hint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors disabled:opacity-50">
              {retargeting === s.id && <Loader2 size={12} className="animate-spin" />}{s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipients */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between px-4 sm:px-5 py-3 border-b border-gray-100">
          <div className="flex gap-1 overflow-x-auto">
            {SEGMENTS.map(s => (
              <button key={s.id} onClick={() => { setSegment(s.id); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${segment === s.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search email…"
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-52" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="px-4 sm:px-5 py-2 font-semibold">Recipient</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Sent</th>
                <th className="px-3 py-2 font-semibold">Opens</th>
                <th className="px-3 py-2 font-semibold">Clicks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rowsLoading && rows.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center"><Loader2 className="animate-spin text-blue-500 inline" size={18} /></td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-gray-400">No recipients in this segment</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} className={rowsLoading ? 'opacity-60' : ''}>
                  <td className="px-4 sm:px-5 py-2.5">
                    <p className="text-gray-900 font-medium truncate max-w-[220px]">{r.email}</p>
                    {r.name && <p className="text-[11px] text-gray-400 truncate max-w-[220px]">{r.name}</p>}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusPill status={r.status} />
                    {r.error && <p className="text-[10px] text-red-500 truncate max-w-[180px]" title={r.error}>{r.error}</p>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{fmtDate(r.sentAt)}</td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                    {r.openCount > 0
                      ? <span className="flex items-center gap-1 text-gray-900"><MailOpen size={12} className="text-gray-400" />{r.openCount}× <span className="text-gray-400">· {fmtDate(r.lastOpenedAt)}</span></span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                    {r.clickCount > 0
                      ? <span className="flex items-center gap-1 text-gray-900"><MousePointerClick size={12} className="text-gray-400" />{r.clickCount}× <span className="text-gray-400">· {fmtDate(r.lastClickedAt)}</span></span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-t border-gray-100 text-xs text-gray-500">
          <span>{fmtNum(total)} email{total === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={14} /></button>
            <span>{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
