import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw, Megaphone, ArrowRight, Table2, LineChart } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { KpiGrid, StatusPill } from './emailAnalytics';
import { EmailAnalyticsOverview, EmailDailyStat, fmtNum, fmtPct, fmtDate } from './emailAnalyticsTypes';

// Categorical slots 1–3, validated for CVD separation on the light surface.
const SERIES = [
  { key: 'sent', label: 'Sent', color: '#2a78d6' },
  { key: 'opened', label: 'Opened', color: '#eb6834' },
  { key: 'clicked', label: 'Clicked', color: '#1baf7a' },
] as const;

type Scope = 'all' | 'campaigns';

export function EmailOverviewPage({ onOpenCampaign, onGoToCampaigns }: {
  onOpenCampaign: (id: string) => void;
  onGoToCampaigns: () => void;
}) {
  const [data, setData] = useState<EmailAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const [scope, setScope] = useState<Scope>('all');

  const [reloadTick, setReloadTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await apiFetch(`${API_ENDPOINTS.email.analyticsOverview}?days=${days}`);
        const d = await r.json();
        if (cancelled) return;
        if (d.success) { setData(d.data); setError(''); }
        else setError(d.error || 'Failed to load analytics');
      } catch { if (!cancelled) setError('Failed to load analytics'); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [days, reloadTick]);
  const refresh = () => { setLoading(true); setReloadTick(t => t + 1); };

  if (loading && !data) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (error && !data) return <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">{error}</p>;
  if (!data) return null;

  const stats = scope === 'all' ? data.all : data.campaigns;

  return (
    <div className="space-y-4">
      {/* Filters — one row above everything they affect */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex bg-gray-200 rounded-lg p-0.5 gap-0.5">
          {(['all', 'campaigns'] as Scope[]).map(s => (
            <button key={s} onClick={() => setScope(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${scope === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {s === 'all' ? 'All emails' : `Campaigns only (${data.campaignCount})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={e => { setLoading(true); setDays(Number(e.target.value)); }}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={refresh} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg border border-transparent hover:border-gray-200" title="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <KpiGrid stats={stats} />
      <p className="text-[11px] text-gray-400 -mt-2">
        KPI totals are all-time. Opens rely on images loading, so some mail apps under-report (images blocked) or over-report (Apple Mail privacy prefetch); a click also counts as an open.
      </p>

      <TrendCard daily={data.daily} days={days} />

      {/* Recent campaigns */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Megaphone size={15} className="text-blue-600" />
            <span className="font-semibold text-gray-900 text-sm">Recent campaigns</span>
          </div>
          <button onClick={onGoToCampaigns} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
            All campaigns<ArrowRight size={12} />
          </button>
        </div>
        {data.recentCampaigns.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10 px-4">No campaigns yet. When you send, choose “Create campaign” to group and track the send here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                  <th className="px-4 sm:px-5 py-2 font-semibold">Campaign</th>
                  <th className="px-3 py-2 font-semibold text-right">Sent</th>
                  <th className="px-3 py-2 font-semibold text-right">Open rate</th>
                  <th className="px-3 py-2 font-semibold text-right">CTR</th>
                  <th className="px-3 py-2 font-semibold text-right hidden sm:table-cell">Failed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recentCampaigns.map(c => (
                  <tr key={c.id} onClick={() => onOpenCampaign(c.id)} className="hover:bg-blue-50/40 cursor-pointer">
                    <td className="px-4 sm:px-5 py-2.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate max-w-[160px] sm:max-w-xs">{c.name}</span>
                        <StatusPill status={c.status} />
                      </div>
                      <p className="text-[11px] text-gray-400">Last sent {fmtDate(c.lastSentAt)}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{fmtNum(c.stats.sent)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{fmtPct(c.stats.openRate)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">{fmtPct(c.stats.clickRate)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-700 hidden sm:table-cell">{fmtNum(c.stats.failed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Daily trend: 3-series line chart with crosshair tooltip + table view ──────

function TrendCard({ daily, days }: { daily: EmailDailyStat[]; days: number }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 720, H = 220, PAD = { l: 36, r: 12, t: 12, b: 24 };
  const max = useMemo(() => {
    const m = Math.max(1, ...daily.map(d => d.sent));
    const step = Math.pow(10, Math.floor(Math.log10(m)));
    return Math.ceil(m / step) * step;
  }, [daily]);
  const x = (i: number) => PAD.l + (daily.length <= 1 ? 0 : (i / (daily.length - 1)) * (W - PAD.l - PAD.r));
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const ticks = [0, max / 2, max];
  const totals = SERIES.map(s => daily.reduce((a, d) => a + d[s.key], 0));
  const labelEvery = Math.ceil(daily.length / 6);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || daily.length === 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.l) / (W - PAD.l - PAD.r)) * (daily.length - 1));
    setHover(Math.max(0, Math.min(daily.length - 1, i)));
  };
  const shortDate = (s: string) => new Date(s + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-gray-100">
        <div>
          <p className="font-semibold text-gray-900 text-sm">Daily activity · last {days} days</p>
          <p className="text-[11px] text-gray-400">Grouped by send date: opens and clicks count toward the day the email went out</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend with totals — identity never relies on color alone */}
          <div className="flex items-center gap-3">
            {SERIES.map((s, i) => (
              <span key={s.key} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-3 h-0.5 rounded-full" style={{ background: s.color }} />
                {s.label} <span className="text-gray-900 font-semibold tabular-nums">{fmtNum(totals[i])}</span>
              </span>
            ))}
          </div>
          <button onClick={() => setView(v => v === 'chart' ? 'table' : 'chart')}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg" title={view === 'chart' ? 'Show table' : 'Show chart'}>
            {view === 'chart' ? <Table2 size={14} /> : <LineChart size={14} />}
          </button>
        </div>
      </div>

      {view === 'chart' ? (
        <div className="relative px-2 sm:px-3 py-3">
          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
            aria-label="Daily sent, opened and clicked emails"
            onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
            {ticks.map(t => (
              <g key={t}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#eef0f3" strokeWidth={1} />
                <text x={PAD.l - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill="#9ca3af">{fmtNum(Math.round(t))}</text>
              </g>
            ))}
            {daily.map((d, i) => i % labelEvery === 0 && (
              <text key={d.date} x={x(i)} y={H - 6} textAnchor="middle" fontSize={10} fill="#9ca3af">{shortDate(d.date)}</text>
            ))}
            {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} stroke="#d1d5db" strokeWidth={1} />}
            {SERIES.map(s => (
              <polyline key={s.key} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
                points={daily.map((d, i) => `${x(i)},${y(d[s.key])}`).join(' ')} />
            ))}
            {hover !== null && SERIES.map(s => (
              <circle key={s.key} cx={x(hover)} cy={y(daily[hover][s.key])} r={4} fill={s.color} stroke="#fff" strokeWidth={2} />
            ))}
          </svg>
          {hover !== null && (
            <div className="absolute top-3 pointer-events-none bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs"
              style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > daily.length / 2 ? 'calc(-100% - 12px)' : '12px'})` }}>
              <p className="font-semibold text-gray-900 mb-1">{shortDate(daily[hover].date)}</p>
              {SERIES.map(s => (
                <p key={s.key} className="flex items-center gap-1.5 text-gray-600">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  {s.label}<span className="ml-auto pl-3 font-semibold text-gray-900 tabular-nums">{fmtNum(daily[hover][s.key])}</span>
                </p>
              ))}
              {daily[hover].failed > 0 && <p className="text-gray-500 mt-0.5">Failed <span className="font-semibold text-gray-900">{daily[hover].failed}</span></p>}
            </div>
          )}
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400">
                <th className="px-4 sm:px-5 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 font-semibold text-right">Sent</th>
                <th className="px-3 py-2 font-semibold text-right">Opened</th>
                <th className="px-3 py-2 font-semibold text-right">Clicked</th>
                <th className="px-3 py-2 font-semibold text-right">Failed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...daily].reverse().map(d => (
                <tr key={d.date}>
                  <td className="px-4 sm:px-5 py-2 text-gray-700">{shortDate(d.date)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtNum(d.sent)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtNum(d.opened)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtNum(d.clicked)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmtNum(d.failed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
