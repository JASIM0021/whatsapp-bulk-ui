import { useState, useEffect, useCallback } from 'react';
import {
  Search, Target, Trash2, Bot, TrendingUp, TrendingDown,
  Minus, ChevronDown, ChevronUp, Globe, ExternalLink, RefreshCw,
  Zap, Calendar, GitCommit, AlertCircle, CheckCircle, ToggleLeft,
  ToggleRight, BookOpen, Lightbulb, Trophy, Clock, BarChart3,
  Download, HelpCircle,
} from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import { SEOKeywordInsightsCard } from './SEOKeywordInsightsCard';
import type {
  SEOKeywordResult, SEOKeywordResearchResponse,
  SEOTargetedKeyword, SEOKeywordAgentRec, SEOKeywordScanResponse,
  SEOCompetitorAnalysis, SEOKeywordDailyRunResponse,
} from '@/types/seo';

const GEO_OPTIONS = [
  { value: '', label: 'Global' },
  { value: 'US', label: 'United States' },
  { value: 'IN', label: 'India' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'CA', label: 'Canada' },
  { value: 'DE', label: 'Germany' },
];

const VOLUME_ORDER = ['<1K', '1K-10K', '10K-100K', '100K-1M', '>1M'];
const COMPETITION_COLORS: Record<string, string> = {
  low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  high: 'text-red-600 bg-red-50 border-red-200',
};
const INTENT_COLORS: Record<string, string> = {
  informational: 'text-blue-600 bg-blue-50 border-blue-200',
  commercial: 'text-purple-600 bg-purple-50 border-purple-200',
  transactional: 'text-green-600 bg-green-50 border-green-200',
  navigational: 'text-gray-600 bg-gray-50 border-gray-200',
};
const TYPE_COLORS: Record<string, string> = {
  on_page: 'bg-blue-100 text-blue-700',
  content: 'bg-green-100 text-green-700',
  technical: 'bg-purple-100 text-purple-700',
  backlink: 'bg-orange-100 text-orange-700',
};
const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-600',
};

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token') || '';
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

function DifficultyBar({ value }: { value: number }) {
  const color = value < 35 ? 'bg-emerald-500' : value < 65 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-gray-500">{value}</span>
    </div>
  );
}

function VolumeBar({ volume }: { volume: string }) {
  const idx = VOLUME_ORDER.indexOf(volume);
  const pct = idx < 0 ? 10 : ((idx + 1) / VOLUME_ORDER.length) * 100;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-600">{volume}</span>
    </div>
  );
}

type SortKey = 'opportunity' | 'volume' | 'difficulty' | 'popularity';

function sortKeywords(list: SEOKeywordResult[], key: SortKey): SEOKeywordResult[] {
  const sorted = [...list];
  switch (key) {
    case 'volume':     return sorted.sort((a, b) => VOLUME_ORDER.indexOf(b.searchVolume) - VOLUME_ORDER.indexOf(a.searchVolume));
    case 'difficulty': return sorted.sort((a, b) => a.difficulty - b.difficulty);
    case 'popularity': return sorted.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    default:           return sorted.sort((a, b) => (b.opportunity ?? 0) - (a.opportunity ?? 0));
  }
}

function downloadCSV(seed: string, keywords: SEOKeywordResult[], questions: string[]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [
    ['keyword', 'search_volume', 'difficulty', 'competition', 'intent', 'trend', 'opportunity', 'popularity', 'related'],
    ...keywords.map(k => [k.keyword, k.searchVolume, k.difficulty, k.competition, k.intent, k.trend, k.opportunity ?? '', k.popularity ?? '', (k.related || []).join('; ')]),
    ...questions.map(q => [q, '', '', '', 'question', '', '', '', '']),
  ];
  const blob = new Blob([rows.map(r => r.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `keywords-${seed.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function OpportunityBadge({ value }: { value?: number }) {
  if (value == null) return null;
  const color = value >= 60 ? 'bg-emerald-500' : value >= 40 ? 'bg-amber-500' : 'bg-gray-400';
  return (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-white text-xs font-bold flex-shrink-0 ${color}`} title="Opportunity score: search volume vs ranking difficulty">
      {value}
    </span>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'rising') return <TrendingUp size={14} className="text-emerald-600" />;
  if (trend === 'declining') return <TrendingDown size={14} className="text-red-500" />;
  return <Minus size={14} className="text-gray-400" />;
}

function PositionBadge({ position }: { position: number }) {
  if (!position) return <span className="text-xs text-gray-400 italic">Not ranked</span>;
  const color = position <= 3 ? 'bg-emerald-500' : position <= 10 ? 'bg-blue-500' : position <= 30 ? 'bg-amber-500' : 'bg-gray-400';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs font-bold ${color}`}>
      <Trophy size={10} />#{position}
    </span>
  );
}

function AgentRecCard({ rec }: { rec: SEOKeywordAgentRec }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 bg-white hover:bg-gray-50 text-left"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${TYPE_COLORS[rec.type] || 'bg-gray-100 text-gray-600'}`}>
            {rec.type?.replace('_', ' ')}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${PRIORITY_COLORS[rec.priority] || ''}`}>
            {rec.priority}
          </span>
          <span className="text-sm font-medium text-gray-800">{rec.title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-3 pb-3 bg-gray-50 border-t border-gray-100 space-y-2">
          <p className="text-sm text-gray-600">{rec.description}</p>
          {rec.actionItems?.length > 0 && (
            <ol className="list-decimal list-inside space-y-1">
              {rec.actionItems.map((a, i) => <li key={i} className="text-xs text-gray-700">{a}</li>)}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

function CompetitorCard({ competitor }: { competitor: SEOCompetitorAnalysis }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between p-3 bg-white hover:bg-gray-50 text-left gap-3"
      >
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-6 h-6 flex-shrink-0 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center mt-0.5">
            {competitor.rank}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{competitor.domain}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{competitor.title || competitor.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {competitor.blogPosts?.length > 0 && (
            <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-600 px-1.5 py-0.5 rounded font-semibold">
              {competitor.blogPosts.length} blogs
            </span>
          )}
          {competitor.wordCount > 0 && (
            <span className="text-[10px] text-gray-400 font-mono">{(competitor.wordCount / 1000).toFixed(1)}k words</span>
          )}
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 bg-gray-50 border-t border-gray-100 space-y-2">
          {competitor.metaDesc && <p className="text-xs text-gray-600 italic">{competitor.metaDesc}</p>}
          {competitor.topKeywords?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Keywords Used</p>
              <div className="flex flex-wrap gap-1">
                {competitor.topKeywords.slice(0, 8).map((k, i) => (
                  <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{k}</span>
                ))}
              </div>
            </div>
          )}
          {competitor.headings?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Page Headings</p>
              <ul className="space-y-0.5">
                {competitor.headings.slice(0, 5).map((h, i) => (
                  <li key={i} className="text-xs text-gray-700 truncate">— {h}</li>
                ))}
              </ul>
            </div>
          )}
          {competitor.blogPosts?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Blog Posts Found</p>
              <ul className="space-y-0.5">
                {competitor.blogPosts.slice(0, 5).map((b, i) => (
                  <li key={i}>
                    <a href={b.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline truncate flex items-center gap-1">
                      <ExternalLink size={9} />{b.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScanPanel({
  kw,
  scan,
  scanning,
  onScan,
}: {
  kw: SEOTargetedKeyword;
  scan: SEOKeywordScanResponse | null;
  scanning: boolean;
  onScan: () => void;
}) {
  const [stratOpen, setStratOpen] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe size={15} className="text-slate-500" />
          <span className="text-sm font-semibold text-gray-700">SERP Analysis</span>
          {scan && (
            <span className="text-[10px] text-gray-400">
              {new Date(scan.scannedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <button
          onClick={onScan}
          disabled={scanning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            scanning ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
        >
          <RefreshCw size={11} className={scanning ? 'animate-spin' : ''} />
          {scanning ? 'Scanning…' : scan ? 'Re-scan' : 'Scan SERP'}
        </button>
      </div>

      {!scan && !scanning && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center text-sm text-slate-500">
          Click "Scan SERP" to find your position in Google for <strong>{kw.keyword}</strong> and analyse the top 10 competitors.
        </div>
      )}

      {scanning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-700">Running SERP scan…</p>
            <p className="text-xs text-blue-500 mt-0.5">Searching → crawling competitors → AI strategy (30–60s)</p>
          </div>
        </div>
      )}

      {scan && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Your Position</p>
              <PositionBadge position={scan.userPosition} />
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Competitors</p>
              <p className="text-lg font-bold text-gray-800">{scan.competitors?.length || 0}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
              <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Time to Rank</p>
              <p className="text-xs font-bold text-amber-600">{scan.strategy?.estimatedTimeToRank || '—'}</p>
            </div>
          </div>

          {scan.strategy?.approach && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <button onClick={() => setStratOpen(!stratOpen)} className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb size={14} className="text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">AI Strategy</span>
                </div>
                {stratOpen ? <ChevronUp size={14} className="text-emerald-500" /> : <ChevronDown size={14} className="text-emerald-500" />}
              </button>
              {stratOpen && (
                <div className="mt-2 space-y-3">
                  <p className="text-sm text-emerald-800">{scan.strategy.approach}</p>
                  {scan.strategy.contentGaps?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Content Gaps to Exploit</p>
                      <ul className="space-y-0.5">
                        {scan.strategy.contentGaps.map((g, i) => (
                          <li key={i} className="text-xs text-emerald-700 flex items-start gap-1"><span>•</span>{g}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {scan.strategy.quickWins?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Quick Wins</p>
                      <ul className="space-y-0.5">
                        {scan.strategy.quickWins.map((w, i) => (
                          <li key={i} className="text-xs text-emerald-700 flex items-start gap-1"><span>⚡</span>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {scan.strategy.suggestedBlogTitles?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Suggested Blog Posts (AI)</p>
                      <div className="space-y-1.5">
                        {scan.strategy.suggestedBlogTitles.map((t, i) => (
                          <div key={i} className="bg-white rounded p-2 border border-emerald-100">
                            <p className="text-xs font-semibold text-gray-800">{t.title}</p>
                            {t.angle && <p className="text-[10px] text-emerald-600 mt-0.5">{t.angle}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {scan.competitors?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Top Competitors</p>
              <div className="space-y-1.5">
                {scan.competitors.map((c, i) => <CompetitorCard key={i} competitor={c} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DailyRunsPanel({
  kw,
  runs,
  loadingRuns,
  runningJob,
  togglingAutopilot,
  autoPublish,
  onToggleAutopilot,
  onRunNow,
}: {
  kw: SEOTargetedKeyword;
  runs: SEOKeywordDailyRunResponse[];
  loadingRuns: boolean;
  runningJob: boolean;
  togglingAutopilot: boolean;
  autoPublish: boolean;
  onToggleAutopilot: () => void;
  onRunNow: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-slate-500" />
          <span className="text-sm font-semibold text-gray-700">Daily Blog Autopilot: <span className="font-mono text-xs text-sky-600 font-normal">{kw.keyword}</span></span>
        </div>
        <button
          onClick={onRunNow}
          disabled={runningJob}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
            runningJob
              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <BookOpen size={11} />
          {runningJob ? 'Generating…' : 'Run Now'}
        </button>
      </div>

      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">Daily Autopilot</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Runs every morning: scan SERP → analyse competitors → publish a better blog to GitHub
          </p>
          {!autoPublish && (
            <p className="text-[10px] text-amber-600 mt-1">Requires GitHub repo connected in Blog Posts settings</p>
          )}
        </div>
        <button
          onClick={onToggleAutopilot}
          disabled={togglingAutopilot}
          className="flex-shrink-0 ml-3"
          title={autoPublish ? 'Disable autopilot' : 'Enable autopilot'}
        >
          {autoPublish
            ? <ToggleRight size={28} className="text-emerald-500" />
            : <ToggleLeft size={28} className="text-gray-400" />}
        </button>
      </div>

      {loadingRuns ? (
        <div className="text-center py-4">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-4 text-sm text-gray-400">
          No daily runs yet. Click "Run Now" to generate your first competitive blog post.
        </div>
      ) : (
        <div className="space-y-1.5">
          {runs.map((r) => (
            <div key={r.id} className="flex items-start gap-3 bg-white border border-gray-200 rounded-lg p-3">
              <div className="mt-0.5">
                {r.error
                  ? <AlertCircle size={14} className="text-red-500" />
                  : <CheckCircle size={14} className="text-emerald-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{r.blogTitle || r.keyword}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                  <Clock size={9} />{new Date(r.runAt).toLocaleDateString()} · {r.date}
                </p>
                {r.error && <p className="text-[10px] text-red-500 mt-0.5">{r.error}</p>}
              </div>
              {r.commitUrl && (
                <a
                  href={r.commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
                >
                  <GitCommit size={10} />View
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TargetedKeywordCard({
  kw,
  onRemove,
  isPaid,
}: {
  kw: SEOTargetedKeyword;
  onRemove: (id: string) => void;
  isPaid: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'daily' | 'agent'>('scan');

  const [runningAgent, setRunningAgent] = useState(false);
  const [agentResult, setAgentResult] = useState(kw.agentResult);

  const [scan, setScan] = useState<SEOKeywordScanResponse | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanLoaded, setScanLoaded] = useState(false);

  const [runs, setRuns] = useState<SEOKeywordDailyRunResponse[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [runningJob, setRunningJob] = useState(false);
  const [togglingAutopilot, setTogglingAutopilot] = useState(false);
  const [autoPublish, setAutoPublish] = useState(kw.autoPublish);
  const [currentPosition, setCurrentPosition] = useState(kw.currentPosition);

  const fetchScan = useCallback(async () => {
    try {
      const res = await fetch(API_ENDPOINTS.seo.keywordScan(kw.id), { headers: authHeaders() });
      const json = await res.json();
      if (json.success && json.data) setScan(json.data);
    } catch { /* ignore */ }
    setScanLoaded(true);
  }, [kw.id]);

  const fetchRuns = useCallback(async () => {
    setLoadingRuns(true);
    try {
      const res = await fetch(API_ENDPOINTS.seo.keywordDaily(kw.id), { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setRuns(json.data || []);
    } catch { /* ignore */ }
    setLoadingRuns(false);
  }, [kw.id]);

  useEffect(() => {
    if (!expanded) return;
    if (!scanLoaded) fetchScan();
    if (activeTab === 'daily' && runs.length === 0 && !loadingRuns) fetchRuns();
  }, [expanded, activeTab, scanLoaded, runs.length, loadingRuns, fetchScan, fetchRuns]);

  const runAgent = async () => {
    setRunningAgent(true);
    try {
      const res = await fetch(API_ENDPOINTS.seo.keywordAgent(kw.id), { method: 'POST', headers: authHeaders() });
      const json = await res.json();
      if (json.success && json.data?.agentResult) setAgentResult(json.data.agentResult);
    } catch { /* ignore */ }
    setRunningAgent(false);
  };

  const triggerScan = async () => {
    setScanning(true);
    try {
      const res = await fetch(API_ENDPOINTS.seo.keywordScan(kw.id), { method: 'POST', headers: authHeaders() });
      const json = await res.json();
      if (json.success && json.data) {
        setScan(json.data);
        if (json.data.userPosition) setCurrentPosition(json.data.userPosition);
      }
    } catch { /* ignore */ }
    setScanning(false);
  };

  const runDaily = async () => {
    setRunningJob(true);
    try {
      const res = await fetch(API_ENDPOINTS.seo.keywordDaily(kw.id), { method: 'POST', headers: authHeaders() });
      const json = await res.json();
      if (json.success && json.data) setRuns(prev => [json.data, ...prev]);
    } catch { /* ignore */ }
    setRunningJob(false);
  };

  const toggleAutopilot = async () => {
    setTogglingAutopilot(true);
    try {
      const res = await fetch(API_ENDPOINTS.seo.keywordAutopilot(kw.id), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ enabled: !autoPublish }),
      });
      const json = await res.json();
      if (json.success) setAutoPublish(json.autoPublish);
    } catch { /* ignore */ }
    setTogglingAutopilot(false);
  };

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${expanded ? 'border-blue-300 shadow-sm' : 'border-gray-200'}`}>
      {/* Card header */}
      <div className="bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900">{kw.keyword}</h3>
              <PositionBadge position={currentPosition} />
              {autoPublish && (
                <span className="flex items-center gap-0.5 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
                  <Zap size={9} />Autopilot
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <VolumeBar volume={kw.searchVolume} />
              <DifficultyBar value={kw.difficulty} />
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${COMPETITION_COLORS[kw.competition] || ''}`}>
                {kw.competition}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${INTENT_COLORS[kw.intent] || ''}`}>
                {kw.intent}
              </span>
              <TrendIcon trend={kw.trend} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isPaid && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                title={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
            <button
              onClick={() => onRemove(kw.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="Remove"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded panels */}
      {expanded && isPaid && (
        <div className="border-t border-gray-100">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100 bg-gray-50">
            {([
              { id: 'scan' as const, label: 'SERP Scan', icon: <Globe size={12} /> },
              { id: 'daily' as const, label: 'Daily Blogs', icon: <Calendar size={12} /> },
              { id: 'agent' as const, label: 'AI Agent', icon: <Bot size={12} /> },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-500 bg-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'scan' && (
              <ScanPanel kw={kw} scan={scan} scanning={scanning} onScan={triggerScan} />
            )}
            {activeTab === 'daily' && (
              <DailyRunsPanel
                kw={kw}
                runs={runs}
                loadingRuns={loadingRuns}
                runningJob={runningJob}
                togglingAutopilot={togglingAutopilot}
                autoPublish={autoPublish}
                onToggleAutopilot={toggleAutopilot}
                onRunNow={runDaily}
              />
            )}
            {activeTab === 'agent' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot size={15} className="text-slate-500" />
                    <span className="text-sm font-semibold text-gray-700">Ranking Agent</span>
                  </div>
                  <button
                    onClick={runAgent}
                    disabled={runningAgent}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      runningAgent
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    <Bot size={12} className={runningAgent ? 'animate-pulse' : ''} />
                    {runningAgent ? 'Running…' : agentResult ? 'Re-run' : 'Run Agent'}
                  </button>
                </div>
                {!agentResult && !runningAgent && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center text-sm text-slate-500">
                    Run the AI agent to get page-by-page ranking recommendations for your site.
                  </div>
                )}
                {agentResult && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-lg p-3">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase">Score</p>
                        <p className="text-2xl font-black text-gray-800 leading-none mt-1">
                          {agentResult.rankingScore}<span className="text-sm text-gray-400">/100</span>
                        </p>
                      </div>
                      <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${agentResult.rankingScore >= 70 ? 'bg-emerald-500' : agentResult.rankingScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${agentResult.rankingScore}%` }}
                        />
                      </div>
                    </div>
                    {agentResult.contentBrief && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-blue-600 uppercase mb-1">Content Brief</p>
                        <p className="text-sm text-blue-800">{agentResult.contentBrief}</p>
                      </div>
                    )}
                    {agentResult.recommendations?.length > 0 && (
                      <div className="space-y-1.5">
                        {agentResult.recommendations.map((rec, i) => <AgentRecCard key={i} rec={rec} />)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main tab component ────────────────────────────────────────────────────────

export function SEOKeywordTab({ isPaid }: { isPaid: boolean }) {
  const [seed, setSeed] = useState('');
  const [geo, setGeo] = useState('');
  const [researching, setResearching] = useState(false);
  const [researchResults, setResearchResults] = useState<SEOKeywordResult[]>([]);
  const [researchContext, setResearchContext] = useState('');
  const [researchError, setResearchError] = useState('');
  const [researchMeta, setResearchMeta] = useState<Pick<SEOKeywordResearchResponse, 'seed' | 'totalIdeas' | 'source'> | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('opportunity');
  const [intentFilter, setIntentFilter] = useState('');

  const [targeted, setTargeted] = useState<SEOTargetedKeyword[]>([]);
  const [loadingTargeted, setLoadingTargeted] = useState(true);
  const [targeting, setTargeting] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<'targeted' | 'research'>('targeted');

  const fetchTargeted = useCallback(async () => {
    setLoadingTargeted(true);
    try {
      const res = await fetch(API_ENDPOINTS.seo.keywordTargets, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setTargeted(json.data || []);
    } catch { /* ignore */ }
    setLoadingTargeted(false);
  }, []);

  useEffect(() => { fetchTargeted(); }, [fetchTargeted]);

  const doResearch = async () => {
    if (!seed.trim()) return;
    setResearching(true);
    setResearchError('');
    setResearchResults([]);
    setQuestions([]);
    setResearchMeta(null);
    try {
      const res = await fetch(API_ENDPOINTS.seo.keywordResearch, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ seedKeyword: seed.trim(), geo }),
      });
      const json: { success: boolean; data?: SEOKeywordResearchResponse; error?: string } = await res.json();
      if (!json.success || !json.data) throw new Error(json.error || 'Research failed');
      setResearchResults(json.data.keywords || []);
      setResearchContext(json.data.context || '');
      setQuestions(json.data.questions || []);
      setResearchMeta({ seed: json.data.seed, totalIdeas: json.data.totalIdeas, source: json.data.source });
      setActiveSection('research');
    } catch (e: unknown) {
      setResearchError(e instanceof Error ? e.message : 'Unknown error');
    }
    setResearching(false);
  };

  const targetKeyword = async (kw: SEOKeywordResult) => {
    setTargeting(kw.keyword);
    try {
      const res = await fetch(API_ENDPOINTS.seo.keywordTargets, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(kw),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTargeted(prev => [json.data, ...prev]);
        setActiveSection('targeted');
      }
    } catch { /* ignore */ }
    setTargeting(null);
  };

  const removeKeyword = async (id: string) => {
    try {
      await fetch(API_ENDPOINTS.seo.keywordTargetDelete(id), { method: 'DELETE', headers: authHeaders() });
      setTargeted(prev => prev.filter(k => k.id !== id));
    } catch { /* ignore */ }
  };

  if (!isPaid) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
          <Target size={26} className="text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Keyword Intelligence</h2>
        <p className="text-gray-500 max-w-sm text-sm">
          Upgrade to SEO Bot to access keyword research, SERP scanning, competitor analysis, and daily autopilot blogging.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Research form */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} className="text-indigo-500" />
          <h2 className="text-base font-bold text-gray-800">Keyword Research</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={seed}
            onChange={e => setSeed(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doResearch()}
            placeholder="Enter a seed keyword or topic…"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={geo}
            onChange={e => setGeo(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            {GEO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={doResearch}
            disabled={researching || !seed.trim()}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap ${
              researching || !seed.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {researching
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Researching…</>
              : <><Search size={15} />Research</>}
          </button>
        </div>
        {researchError && (
          <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle size={13} />{researchError}
          </p>
        )}
      </div>

      <SEOKeywordInsightsCard currentSeed={seed} geoOptions={GEO_OPTIONS} />

      {/* Section tabs */}
      <div className="flex rounded-xl border border-gray-200 bg-white p-1 gap-1">
        {([
          { id: 'targeted' as const, label: 'Targeted Keywords', icon: <Target size={15} />, count: targeted.length },
          { id: 'research' as const, label: 'Research Results', icon: <BarChart3 size={15} />, count: researchResults.length },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeSection === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.icon}{tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] px-1.5 rounded-full font-bold ${activeSection === tab.id ? 'bg-indigo-400 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Targeted keywords */}
      {activeSection === 'targeted' && (
        <div>
          {loadingTargeted ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : targeted.length === 0 ? (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <Target size={32} className="mx-auto text-gray-300" />
              <p className="text-sm">No keywords targeted yet. Research a keyword and click "Target" to start tracking.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {targeted.map(kw => (
                <TargetedKeywordCard key={kw.id} kw={kw} onRemove={removeKeyword} isPaid={isPaid} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Research results */}
      {activeSection === 'research' && (
        <div>
          {researchResults.length === 0 ? (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <Search size={32} className="mx-auto text-gray-300" />
              <p className="text-sm">Enter a seed keyword above to discover ranking opportunities.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {researchMeta && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">{researchMeta.totalIdeas}</span> ideas for “{researchMeta.seed}”
                    <span className="text-gray-400"> · showing top {researchResults.length}</span>
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded border font-semibold ${researchMeta.source === 'autocomplete' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200'}`}
                      title={researchMeta.source === 'autocomplete' ? 'Keywords are real searches from search-engine autocomplete; metrics are estimates' : 'Search suggestions were unavailable, so keywords are AI-generated'}>
                      {researchMeta.source === 'autocomplete' ? 'Real search data' : 'AI suggestions'}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <select value={intentFilter} onChange={e => setIntentFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="">All intents</option>
                      {Object.keys(INTENT_COLORS).map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="opportunity">Best opportunity</option>
                      <option value="volume">Highest volume</option>
                      <option value="difficulty">Easiest to rank</option>
                      <option value="popularity">Most searched</option>
                    </select>
                    <button onClick={() => downloadCSV(researchMeta.seed, researchResults, questions)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50">
                      <Download size={12} />CSV
                    </button>
                  </div>
                </div>
              )}
              {researchContext && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                  {researchContext}
                </div>
              )}
              {questions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5"><HelpCircle size={13} />Questions people ask</p>
                  <div className="flex flex-wrap gap-1.5">
                    {questions.map(q => (
                      <span key={q} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-lg">{q}?</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid gap-2">
                {sortKeywords(researchResults, sortKey).filter(kw => !intentFilter || kw.intent === intentFilter).map(kw => {
                  const isTargeted = targeted.some(t => t.keyword.toLowerCase() === kw.keyword.toLowerCase());
                  return (
                    <div key={kw.keyword} className="bg-white border border-gray-200 rounded-xl p-3 flex items-start gap-3">
                      <OpportunityBadge value={kw.opportunity} />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-sm font-semibold text-gray-800">{kw.keyword}</p>
                        <div className="flex items-center gap-3 flex-wrap">
                          <VolumeBar volume={kw.searchVolume} />
                          <DifficultyBar value={kw.difficulty} />
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${COMPETITION_COLORS[kw.competition] || ''}`}>
                            {kw.competition}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${INTENT_COLORS[kw.intent] || ''}`}>
                            {kw.intent}
                          </span>
                          <TrendIcon trend={kw.trend} />
                        </div>
                        {kw.related?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {kw.related.slice(0, 4).map((r, i) => (
                              <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{r}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => targetKeyword(kw)}
                        disabled={isTargeted || targeting === kw.keyword}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors mt-1 ${
                          isTargeted
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                            : targeting === kw.keyword
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        <Target size={11} />
                        {isTargeted ? 'Targeted' : targeting === kw.keyword ? '…' : 'Target'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
