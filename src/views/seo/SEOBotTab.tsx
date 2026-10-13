import { useState, useEffect } from 'react';
import {
  Loader2, Bot, Globe, TrendingUp, Play, Plus, X,
  AlertCircle, CheckCircle2, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, RefreshCw, Copy, Check, Zap,
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { SEOBotConfig, SEOTrendItem, SEORecommendation, SEOBotRunResponse, SEOTrendsResponse } from '@/types/seo';

const GEO_OPTIONS = [
  { code: 'IN', flag: '🇮🇳', name: 'India' },
  { code: 'US', flag: '🇺🇸', name: 'United States' },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: 'FR', flag: '🇫🇷', name: 'France' },
  { code: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: 'BR', flag: '🇧🇷', name: 'Brazil' },
];

const REC_TYPE_COLORS: Record<string, string> = {
  keyword_add:    'bg-blue-100 text-blue-700',
  meta_update:    'bg-amber-100 text-amber-700',
  create_content: 'bg-violet-100 text-violet-700',
};

const REC_TYPE_LABELS: Record<string, string> = {
  keyword_add:    'Keyword Add',
  meta_update:    'Meta Update',
  create_content: 'Create Content',
};

const PRIORITY_COLORS: Record<string, string> = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-gray-100 text-gray-600',
};

function TrendPill({ item }: { item: SEOTrendItem }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm shadow-sm">
      <TrendingUp size={13} className="text-emerald-500 flex-shrink-0" />
      <span className="font-medium text-gray-800 truncate">{item.title}</span>
      {item.traffic && item.traffic !== 'custom' && (
        <span className="flex-shrink-0 text-[10px] text-gray-400 font-mono">{item.traffic}</span>
      )}
      {item.traffic === 'custom' && (
        <span className="flex-shrink-0 px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded text-[10px] font-semibold">custom</span>
      )}
    </div>
  );
}

function RecommendationRow({ rec }: { rec: SEORecommendation }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!rec.codeSnippet) return;
    await navigator.clipboard.writeText(rec.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 flex gap-1.5 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${REC_TYPE_COLORS[rec.type] ?? 'bg-gray-100 text-gray-600'}`}>
            {REC_TYPE_LABELS[rec.type] ?? rec.type}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${PRIORITY_COLORS[rec.priority] ?? 'bg-gray-100 text-gray-600'}`}>
            {rec.priority}
          </span>
        </div>
      </div>
      <h4 className="mt-2 text-sm font-bold text-gray-900">{rec.title}</h4>
      <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{rec.description}</p>
      {rec.pagePath && (
        <p className="mt-1 text-xs font-mono text-emerald-600">{rec.pagePath}</p>
      )}
      {rec.codeSnippet && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? 'Hide' : 'Show'} code snippet
          </button>
          {expanded && (
            <div className="relative mt-2">
              <pre className="bg-gray-900 text-gray-100 rounded-xl p-3 text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {rec.codeSnippet}
              </pre>
              <button
                onClick={copy}
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-[10px] font-semibold transition-colors"
              >
                {copied ? <Check size={9} className="text-green-400" /> : <Copy size={9} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SEOBotTab({ isPaid = false }: { isPaid?: boolean }) {
  const [config, setConfig] = useState<SEOBotConfig>({
    isEnabled: false,
    geoTargets: [],
    customKeywords: [],
    schedule: 'off',
    autoFixEnabled: false,
  });
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savedConfig, setSavedConfig] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [configError, setConfigError] = useState('');

  const [trendsGeo, setTrendsGeo] = useState('IN');
  const [trends, setTrends] = useState<SEOTrendItem[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [trendsError, setTrendsError] = useState('');

  const [running, setRunning] = useState(false);
  const [botResult, setBotResult] = useState<SEOBotRunResponse | null>(null);
  const [botError, setBotError] = useState('');

  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    apiFetch(API_ENDPOINTS.seo.bot)
      .then(r => r.json())
      .then(d => { if (d.success && d.data) { setConfig(d.data); setHasUnsavedChanges(false); } })
      .catch(() => {})
      .finally(() => setLoadingConfig(false));
  }, []);

  const saveConfig = async () => {
    setSavingConfig(true);
    setConfigError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.seo.bot, {
        method: 'POST',
        body: JSON.stringify(config),
      });
      const d = await res.json();
      if (!d.success) { setConfigError(d.error || 'Failed to save'); return; }
      setConfig(d.data);
      setHasUnsavedChanges(false);
      setSavedConfig(true);
      setTimeout(() => setSavedConfig(false), 3000);
    } catch {
      setConfigError('Network error');
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchTrends = async () => {
    setLoadingTrends(true);
    setTrendsError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.seo.trends(trendsGeo));
      const d: { success: boolean; data: SEOTrendsResponse; error?: string } = await res.json();
      if (!d.success) { setTrendsError(d.error || 'Failed to fetch trends'); return; }
      setTrends(d.data.items);
    } catch {
      setTrendsError('Network error');
    } finally {
      setLoadingTrends(false);
    }
  };

  const runBot = async () => {
    setRunning(true);
    setBotError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.seo.botRun, { method: 'POST' });
      const d = await res.json();
      if (!d.success) { setBotError(d.error || 'Failed to run bot'); return; }
      setBotResult(d.data);
    } catch {
      setBotError('Network error');
    } finally {
      setRunning(false);
    }
  };

  const toggleGeo = (code: string) => {
    setConfig(c => ({
      ...c,
      geoTargets: c.geoTargets.includes(code)
        ? c.geoTargets.filter(g => g !== code)
        : [...c.geoTargets, code],
    }));
    setHasUnsavedChanges(true);
  };

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (!kw || config.customKeywords.includes(kw)) return;
    setConfig(c => ({ ...c, customKeywords: [...c.customKeywords, kw] }));
    setNewKeyword('');
    setHasUnsavedChanges(true);
  };

  const removeKeyword = (kw: string) => {
    setConfig(c => ({ ...c, customKeywords: c.customKeywords.filter(k => k !== kw) }));
    setHasUnsavedChanges(true);
  };

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!isPaid) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
          <Zap size={28} className="text-amber-500" />
        </div>
        <h3 className="text-base font-bold text-gray-900">SEO Bot is a Premium Feature</h3>
        <p className="text-sm text-gray-500">Upgrade to a plan that includes <strong>seo_bot</strong> to unlock the auto-fix bot, keyword trend runner, and blog publishing automation.</p>
        <a href="/subscription" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">
          <Zap size={14} /> Upgrade Plan
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">

      {/* Bot Configuration */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Bot size={18} className="text-emerald-600" />
          <h3 className="text-base font-bold text-gray-900">Bot Configuration</h3>
        </div>

        {configError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">
            <AlertCircle size={14} />{configError}
          </div>
        )}

        {/* Enable toggle */}
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl border border-gray-200 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-800">Enable SEO Bot</p>
            <p className="text-xs text-gray-500 mt-0.5">Fetch trends and generate daily recommendations</p>
          </div>
          <button type="button" onClick={() => { setConfig(c => ({ ...c, isEnabled: !c.isEnabled })); setHasUnsavedChanges(true); }}>
            {config.isEnabled
              ? <ToggleRight size={32} className="text-emerald-500" />
              : <ToggleLeft size={32} className="text-gray-300" />
            }
          </button>
        </div>

        {/* Country targeting */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Countries</label>
          <div className="flex flex-wrap gap-2">
            {GEO_OPTIONS.map(g => (
              <button
                key={g.code}
                type="button"
                onClick={() => toggleGeo(g.code)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  config.geoTargets.includes(g.code)
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400 hover:text-emerald-600'
                }`}
              >
                <span>{g.flag}</span>
                <span>{g.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom keywords */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Custom Keywords</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              placeholder="Add keyword…"
              className="flex-1 px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
            <button
              type="button"
              onClick={addKeyword}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors"
            >
              <Plus size={14} />Add
            </button>
          </div>
          {config.customKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.customKeywords.map(kw => (
                <span key={kw} className="flex items-center gap-1.5 px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">
                  {kw}
                  <button onClick={() => removeKeyword(kw)} className="hover:text-violet-900 transition-colors">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Schedule */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Run Schedule</label>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'off'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => { setConfig(c => ({ ...c, schedule: s })); setHasUnsavedChanges(true); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                  config.schedule === s
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-emerald-400'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={saveConfig}
          disabled={savingConfig}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {savingConfig ? <Loader2 size={15} className="animate-spin" /> : null}
          {savingConfig ? 'Saving…' : savedConfig ? '✓ Saved!' : 'Save Configuration'}
        </button>
      </div>

      {/* Google Trends */}
      {config.isEnabled && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-blue-500" />
            <h3 className="text-base font-bold text-gray-900">Google Trends</h3>
          </div>

          <div className="flex gap-2 mb-4">
            <select
              value={trendsGeo}
              onChange={e => setTrendsGeo(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              {GEO_OPTIONS.map(g => (
                <option key={g.code} value={g.code}>{g.flag} {g.name}</option>
              ))}
            </select>
            <button
              onClick={fetchTrends}
              disabled={loadingTrends}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-60"
            >
              {loadingTrends ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Fetch Trends
            </button>
          </div>

          {trendsError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mb-3">
              <AlertCircle size={14} />{trendsError}
            </div>
          )}

          {trends.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {trends.map((t, i) => <TrendPill key={i} item={t} />)}
            </div>
          )}

          {trends.length === 0 && !loadingTrends && !trendsError && (
            <p className="text-sm text-gray-400 text-center py-4">
              Select a country and click "Fetch Trends" to see what's trending.
            </p>
          )}
        </div>
      )}

      {/* Run Bot */}
      {config.isEnabled && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Play size={18} className="text-violet-500" />
            <h3 className="text-base font-bold text-gray-900">Run Bot Now</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Fetch the latest trends for your target countries, match them against your tracked pages, and generate actionable recommendations.
          </p>

          {config.lastRunAt && (
            <p className="text-xs text-gray-400 mb-3">
              Last run: {new Date(config.lastRunAt).toLocaleString()}
            </p>
          )}

          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-sm text-amber-700">
              <AlertCircle size={14} />Save your configuration first before running the bot.
            </div>
          )}

          <button
            onClick={runBot}
            disabled={running || hasUnsavedChanges}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {running ? 'Running…' : 'Run Bot Now'}
          </button>

          {botError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mt-4 text-sm text-red-700">
              <AlertCircle size={14} />{botError}
            </div>
          )}

          {botResult && (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-800">
                  {botResult.recommendations.length} Recommendation{botResult.recommendations.length !== 1 ? 's' : ''}
                </h4>
                <span className="text-xs text-gray-400">
                  Generated {new Date(botResult.runAt).toLocaleString()}
                </span>
              </div>

              {botResult.recommendations.length === 0 && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                  <p className="text-sm text-emerald-700">
                    Your site is well-aligned with current trends. No immediate recommendations.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {botResult.recommendations.map((rec, i) => (
                  <RecommendationRow key={i} rec={rec} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Not enabled state */}
      {!config.isEnabled && !loadingConfig && (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
            <Bot size={32} className="text-violet-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">SEO Bot is disabled</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Enable the bot above and configure your target countries and keywords to start getting trend-based SEO recommendations.
          </p>
        </div>
      )}
    </div>
  );
}
