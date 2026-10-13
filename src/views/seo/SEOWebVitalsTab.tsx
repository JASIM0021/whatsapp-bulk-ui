import { useState, useEffect } from 'react';
import { Loader2, Activity } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { SEOWebVitals } from '@/types/seo';

type MetricKey = 'lcp' | 'fcp' | 'cls' | 'ttfb';

interface MetricConfig {
  label: string;
  unit: string;
  good: number;
  poor: number;
  description: string;
}

const METRICS: Record<MetricKey, MetricConfig> = {
  lcp: { label: 'LCP', unit: 'ms', good: 2500, poor: 4000, description: 'Largest Contentful Paint — time to render the largest visible element' },
  fcp: { label: 'FCP', unit: 'ms', good: 1800, poor: 3000, description: 'First Contentful Paint — time to render first text or image' },
  cls: { label: 'CLS', unit: '',   good: 0.1,  poor: 0.25, description: 'Cumulative Layout Shift — visual stability (lower is better)' },
  ttfb: { label: 'TTFB', unit: 'ms', good: 800, poor: 1800, description: 'Time to First Byte — server response time' },
};

function vitalColor(value: number, metric: MetricKey) {
  const { good, poor } = METRICS[metric];
  if (value < good) return 'text-green-600';
  if (value < poor) return 'text-amber-500';
  return 'text-red-500';
}

function vitalLabel(value: number, metric: MetricKey) {
  const { good, poor } = METRICS[metric];
  if (value < good) return 'Good';
  if (value < poor) return 'Needs Improvement';
  return 'Poor';
}

function formatValue(value: number, metric: MetricKey) {
  if (value === 0) return '—';
  if (metric === 'cls') return value.toFixed(3);
  return `${Math.round(value)}ms`;
}

function MetricBar({ value, metric }: { value: number; metric: MetricKey }) {
  const { good, poor } = METRICS[metric];
  const max = poor * 1.5;
  const pct = Math.min((value / max) * 100, 100);
  const color = value < good ? 'bg-green-500' : value < poor ? 'bg-amber-400' : 'bg-red-500';
  if (value === 0) return null;
  return (
    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function SEOWebVitalsTab() {
  const [data, setData] = useState<SEOWebVitals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.seo.vitals);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-emerald-500" />
    </div>
  );

  if (!data || data.pages.length === 0) return (
    <div className="space-y-4 py-4">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">How Web Vitals are collected</p>
        <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside">
          <li><strong>TTFB</strong> — collected automatically by the site crawler (available after Scan Now)</li>
          <li><strong>LCP, FCP, CLS</strong> — require the JS embed script installed on your site (measured in real browsers)</li>
        </ul>
      </div>
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
        <Activity size={36} className="text-gray-300 mb-4" />
        <h3 className="text-base font-bold text-gray-800 mb-2">No vitals data yet</h3>
        <p className="text-sm text-gray-500">Run a site scan to collect TTFB data, or install the embed script on your site to collect LCP, FCP and CLS from real visits.</p>
      </div>
    </div>
  );

  const avgValues: Record<MetricKey, number> = {
    lcp: data.avgLcp,
    fcp: data.avgFcp,
    cls: data.avgCls,
    ttfb: data.avgTtfb,
  };

  const hasOnlyTTFB = data.avgLcp === 0 && data.avgFcp === 0;

  return (
    <div className="space-y-6 py-4">

      {hasOnlyTTFB && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-700 flex items-start gap-2">
          <Activity size={14} className="flex-shrink-0 mt-0.5 text-blue-500" />
          <span><strong>TTFB</strong> is collected by the crawler. Install the embed script on your site to also collect <strong>LCP</strong>, <strong>FCP</strong>, and <strong>CLS</strong> from real browser visits.</span>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(METRICS) as MetricKey[]).map(key => {
          const cfg = METRICS[key];
          const val = avgValues[key];
          return (
            <div key={key} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-gray-400 uppercase">{cfg.label}</p>
                {val > 0 && (
                  <span className={`text-[10px] font-bold ${vitalColor(val, key)}`}>{vitalLabel(val, key)}</span>
                )}
              </div>
              <p className={`text-2xl font-extrabold leading-none ${val > 0 ? vitalColor(val, key) : 'text-gray-300'}`}>
                {formatValue(val, key)}
              </p>
              <MetricBar value={val} metric={key} />
              <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">{cfg.description}</p>
            </div>
          );
        })}
      </div>

      {/* Google thresholds reference */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h4 className="text-sm font-bold text-gray-800 mb-3">Google Thresholds</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-gray-400 font-semibold uppercase">Metric</th>
                <th className="text-left py-2 pr-4 text-green-600 font-semibold">Good</th>
                <th className="text-left py-2 pr-4 text-amber-500 font-semibold">Needs Work</th>
                <th className="text-left py-2 text-red-500 font-semibold">Poor</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50"><td className="py-2 pr-4 font-semibold text-gray-600">LCP</td><td className="py-2 pr-4 text-gray-600">≤ 2.5s</td><td className="py-2 pr-4 text-gray-600">2.5s–4s</td><td className="py-2 text-gray-600">&gt; 4s</td></tr>
              <tr className="border-b border-gray-50"><td className="py-2 pr-4 font-semibold text-gray-600">FCP</td><td className="py-2 pr-4 text-gray-600">≤ 1.8s</td><td className="py-2 pr-4 text-gray-600">1.8s–3s</td><td className="py-2 text-gray-600">&gt; 3s</td></tr>
              <tr className="border-b border-gray-50"><td className="py-2 pr-4 font-semibold text-gray-600">CLS</td><td className="py-2 pr-4 text-gray-600">≤ 0.1</td><td className="py-2 pr-4 text-gray-600">0.1–0.25</td><td className="py-2 text-gray-600">&gt; 0.25</td></tr>
              <tr><td className="py-2 pr-4 font-semibold text-gray-600">TTFB</td><td className="py-2 pr-4 text-gray-600">≤ 0.8s</td><td className="py-2 pr-4 text-gray-600">0.8s–1.8s</td><td className="py-2 text-gray-600">&gt; 1.8s</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-page table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h4 className="text-sm font-bold text-gray-800">Per-Page Vitals</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase">Page</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">LCP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">FCP</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase hidden sm:table-cell">CLS</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase hidden md:table-cell">TTFB</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.pages.map((page, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-gray-700 truncate max-w-[180px]">{page.path || '/'}</td>
                  <td className={`px-4 py-3 text-xs font-semibold ${page.lcp > 0 ? vitalColor(page.lcp, 'lcp') : 'text-gray-300'}`}>
                    {formatValue(page.lcp, 'lcp')}
                  </td>
                  <td className={`px-4 py-3 text-xs font-semibold ${page.fcp > 0 ? vitalColor(page.fcp, 'fcp') : 'text-gray-300'}`}>
                    {formatValue(page.fcp, 'fcp')}
                  </td>
                  <td className={`px-4 py-3 text-xs font-semibold hidden sm:table-cell ${page.cls > 0 ? vitalColor(page.cls, 'cls') : 'text-gray-300'}`}>
                    {formatValue(page.cls, 'cls')}
                  </td>
                  <td className={`px-4 py-3 text-xs font-semibold hidden md:table-cell ${page.ttfb > 0 ? vitalColor(page.ttfb, 'ttfb') : 'text-gray-300'}`}>
                    {formatValue(page.ttfb, 'ttfb')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold ${page.score >= 80 ? 'text-green-600' : page.score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {page.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
