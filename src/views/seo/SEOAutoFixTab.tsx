import { useState, useEffect } from 'react';
import {
  Loader2, Copy, Check, ChevronDown, ChevronUp,
  Wrench, Zap, AlertCircle, CheckCircle2, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { SEOAutoFixItem, SEOAutoFixResponse } from '@/types/seo';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  warning:  'bg-amber-100 text-amber-700 border-amber-200',
  info:     'bg-blue-100 text-blue-700 border-blue-200',
};

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative mt-3">
      <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-semibold transition-colors"
      >
        {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

function FixCard({ item }: { item: SEOAutoFixItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`flex-shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${SEVERITY_COLORS[item.severity]}`}>
              {item.severity}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                {item.isScriptFixable && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold border border-emerald-200">
                    <Zap size={9} />Script-fixable
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <span className="text-sm font-bold text-gray-700">{item.affectedCount}</span>
            <p className="text-[10px] text-gray-400">page{item.affectedCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <CodeBlock code={item.codeSnippet} />

        {item.pages.length > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'Hide' : 'Show'} affected pages ({item.pages.length})
          </button>
        )}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 space-y-1.5">
          {item.pages.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
              <span className="font-mono truncate">{p.path}</span>
              {p.suggested && (
                <span className="text-gray-400 truncate">→ {p.suggested}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SEOAutoFixTab() {
  const [data, setData] = useState<SEOAutoFixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.seo.autofix);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Failed to load');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleAutoFix = async () => {
    if (!data) return;
    setToggling(true);
    try {
      // Load current bot config first
      const cfgRes = await apiFetch(API_ENDPOINTS.seo.bot);
      const cfgData = await cfgRes.json();
      const current = cfgData.data || {};

      await apiFetch(API_ENDPOINTS.seo.bot, {
        method: 'POST',
        body: JSON.stringify({
          isEnabled: current.isEnabled ?? false,
          geoTargets: current.geoTargets ?? [],
          customKeywords: current.customKeywords ?? [],
          schedule: current.schedule ?? 'off',
          autoFixEnabled: !data.autoFixEnabled,
        }),
      });
      setData(d => d ? { ...d, autoFixEnabled: !d.autoFixEnabled } : d);
    } catch {
      // silent
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <AlertCircle size={16} />{error}
        </div>
      </div>
    );
  }

  const scriptFixable = data?.fixes.filter(f => f.isScriptFixable) ?? [];
  const manualFixes = data?.fixes.filter(f => !f.isScriptFixable) ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">

      {/* Auto-inject toggle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wrench size={18} className="text-emerald-600" />
              <h3 className="text-base font-bold text-gray-900">Auto-inject via Script</h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              When enabled, the embed script automatically injects missing viewport, canonical, and Open Graph tags into every page on load — no source code changes needed.
            </p>
          </div>
          <button
            onClick={toggleAutoFix}
            disabled={toggling}
            className="flex-shrink-0"
          >
            {toggling
              ? <Loader2 size={32} className="animate-spin text-gray-300" />
              : data?.autoFixEnabled
              ? <ToggleRight size={32} className="text-emerald-500" />
              : <ToggleLeft size={32} className="text-gray-300" />
            }
          </button>
        </div>

        {data?.autoFixEnabled && (
          <div className="mt-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
            <p className="text-sm text-emerald-700 font-medium">
              Auto-fix is active — your embed script is injecting fixes on every page load.
            </p>
          </div>
        )}
      </div>

      {/* Script-fixable issues */}
      {scriptFixable.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-700">Script-Fixable Issues ({scriptFixable.length})</h3>
            <span className="text-xs text-gray-400">Auto-inject handles these automatically</span>
          </div>
          {scriptFixable.map(item => <FixCard key={item.code} item={item} />)}
        </div>
      )}

      {/* Manual fixes */}
      {manualFixes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="text-amber-500" />
            <h3 className="text-sm font-bold text-gray-700">Manual Fixes Required ({manualFixes.length})</h3>
            <span className="text-xs text-gray-400">Copy and paste into your source code</span>
          </div>
          {manualFixes.map(item => <FixCard key={item.code} item={item} />)}
        </div>
      )}

      {/* Empty state */}
      {data?.fixes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No fixable issues found</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            All detected issues require tracking data first. Visit more pages on your site to populate issues, or your site is already well-optimized.
          </p>
        </div>
      )}
    </div>
  );
}
