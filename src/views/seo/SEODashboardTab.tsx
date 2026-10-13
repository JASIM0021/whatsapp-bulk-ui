import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, AlertTriangle, Info, TrendingDown, Gauge } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { SEODashboard, SEOIssueGroup } from '@/types/seo';

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-500' : 'text-red-500';
  const ring = score >= 80 ? 'stroke-green-500' : score >= 50 ? 'stroke-amber-400' : 'stroke-red-500';
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle cx="64" cy="64" r={r} fill="none" className={ring} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <p className={`text-3xl font-extrabold leading-none ${color}`}>{score}</p>
        <p className="text-xs text-gray-400 font-medium mt-0.5">/ 100</p>
      </div>
    </div>
  );
}

function vitalsLabel(ms: number, type: 'lcp' | 'fcp' | 'ttfb' | 'cls'): { label: string; color: string } {
  if (type === 'cls') {
    if (ms < 0.1) return { label: 'Good', color: 'text-green-600' };
    if (ms < 0.25) return { label: 'Needs Work', color: 'text-amber-500' };
    return { label: 'Poor', color: 'text-red-500' };
  }
  const thresholds: Record<string, [number, number]> = {
    lcp: [2500, 4000],
    fcp: [1800, 3000],
    ttfb: [800, 1800],
  };
  const [good, poor] = thresholds[type] || [2500, 4000];
  if (ms < good) return { label: 'Good', color: 'text-green-600' };
  if (ms < poor) return { label: 'Needs Work', color: 'text-amber-500' };
  return { label: 'Poor', color: 'text-red-500' };
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'critical') return <AlertCircle size={14} className="text-red-500 flex-shrink-0" />;
  if (severity === 'warning') return <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />;
  return <Info size={14} className="text-blue-400 flex-shrink-0" />;
}

export function SEODashboardTab() {
  const [data, setData] = useState<SEODashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.seo.dashboard);
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

  if (!data || data.totalPages === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Gauge size={28} className="text-gray-400" />
      </div>
      <h3 className="text-base font-bold text-gray-800 mb-2">No data yet</h3>
      <p className="text-sm text-gray-500">Embed the script on your website and visit a page. Data will appear here within seconds.</p>
    </div>
  );

  const stat = (label: string, value: string | number, sub?: string, color?: string) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-extrabold leading-none ${color || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );

  const totalIssues = data.criticalIssues + data.warnings + data.infoIssues;

  return (
    <div className="space-y-6 py-4">

      {/* Top row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col items-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Overall SEO Score</p>
          <ScoreBadge score={data.overallScore} />
          <p className="text-xs text-gray-400 mt-2">
            {data.overallScore >= 80 ? 'Excellent' : data.overallScore >= 50 ? 'Needs improvement' : 'Critical issues found'}
          </p>
        </div>
        {stat('Pages Tracked', data.totalPages, 'unique URLs visited')}
        {stat('Critical Issues', data.criticalIssues, `${data.warnings} warnings · ${data.infoIssues} info`, data.criticalIssues > 0 ? 'text-red-500' : 'text-gray-900')}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Avg LCP</p>
          {data.avgLcp > 0 ? (
            <>
              <p className="text-2xl font-extrabold text-gray-900 leading-none">{Math.round(data.avgLcp)}ms</p>
              <p className={`text-xs font-semibold mt-1 ${vitalsLabel(data.avgLcp, 'lcp').color}`}>
                {vitalsLabel(data.avgLcp, 'lcp').label}
              </p>
            </>
          ) : <p className="text-sm text-gray-400 mt-2">No data yet</p>}
        </div>
      </div>

      {/* Issue breakdown */}
      {totalIssues > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h4 className="text-sm font-bold text-gray-800 mb-3">Issue Breakdown</h4>
          <div className="flex rounded-full overflow-hidden h-3 mb-3">
            {data.criticalIssues > 0 && (
              <div className="bg-red-500" style={{ width: `${(data.criticalIssues / totalIssues) * 100}%` }} />
            )}
            {data.warnings > 0 && (
              <div className="bg-amber-400" style={{ width: `${(data.warnings / totalIssues) * 100}%` }} />
            )}
            {data.infoIssues > 0 && (
              <div className="bg-blue-300" style={{ width: `${(data.infoIssues / totalIssues) * 100}%` }} />
            )}
          </div>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />{data.criticalIssues} Critical</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />{data.warnings} Warnings</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-300 inline-block" />{data.infoIssues} Info</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top issues */}
        {data.topIssues.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h4 className="text-sm font-bold text-gray-800 mb-3">Top Issues</h4>
            <div className="space-y-2.5">
              {data.topIssues.slice(0, 6).map((iss: SEOIssueGroup) => (
                <div key={iss.code} className="flex items-start gap-2.5">
                  <SeverityIcon severity={iss.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800 truncate">{iss.message}</p>
                    <p className="text-[10px] text-gray-400">{iss.affectedPages} page{iss.affectedPages !== 1 ? 's' : ''} affected</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Worst pages */}
        {data.worstPages.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={15} className="text-red-400" />
              <h4 className="text-sm font-bold text-gray-800">Pages Needing Attention</h4>
            </div>
            <div className="space-y-2">
              {data.worstPages.map(page => (
                <div key={page.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-100 last:border-0">
                  <p className="text-xs text-gray-600 truncate min-w-0 flex-1 font-mono">{page.path || '/'}</p>
                  <span className={`text-xs font-bold flex-shrink-0 ${page.seoScore >= 80 ? 'text-green-600' : page.seoScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {page.seoScore}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
