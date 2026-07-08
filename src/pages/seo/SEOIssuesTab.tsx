import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, AlertTriangle, Info, ExternalLink, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { SEOIssueGroup } from '@/types/seo';

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === 'critical') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
      <AlertCircle size={9} />Critical
    </span>
  );
  if (severity === 'warning') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
      <AlertTriangle size={9} />Warning
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
      <Info size={9} />Info
    </span>
  );
}

export function SEOIssuesTab() {
  const [issues, setIssues] = useState<SEOIssueGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.seo.issues);
        const json = await res.json();
        if (json.success) setIssues(json.data || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-emerald-500" />
    </div>
  );

  if (issues.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
        <CheckCircle2 size={28} className="text-green-500" />
      </div>
      <h3 className="text-base font-bold text-gray-800 mb-2">No issues found</h3>
      <p className="text-sm text-gray-500">
        Either your site is fully optimised, or no pages have been tracked yet. Add the embed script to start collecting data.
      </p>
    </div>
  );

  const critical = issues.filter(i => i.severity === 'critical');
  const warning = issues.filter(i => i.severity === 'warning');
  const info = issues.filter(i => i.severity === 'info');

  const IssueCard = ({ iss }: { iss: SEOIssueGroup }) => {
    const isOpen = expanded === iss.code;
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(isOpen ? null : iss.code)}
          className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <SeverityBadge severity={iss.severity} />
            <p className="text-sm font-semibold text-gray-800 truncate">{iss.message}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs text-gray-400 hidden sm:block">{iss.affectedPages} page{iss.affectedPages !== 1 ? 's' : ''}</span>
            {isOpen ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
          </div>
        </button>

        {isOpen && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase">Affected Pages ({iss.affectedPages})</p>
            <div className="flex flex-wrap gap-2">
              {iss.urls.map(url => (
                <span key={url} className="inline-block bg-gray-100 text-gray-600 font-mono text-[11px] px-2.5 py-1 rounded-lg">{url}</span>
              ))}
              {iss.affectedPages > iss.urls.length && (
                <span className="text-xs text-gray-400 self-center">+ {iss.affectedPages - iss.urls.length} more</span>
              )}
            </div>
            <a
              href={iss.fixGuideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:underline font-semibold"
            >
              How to fix this <ExternalLink size={11} />
            </a>
          </div>
        )}
      </div>
    );
  };

  const Section = ({ title, items, color }: { title: string; items: SEOIssueGroup[]; color: string }) => items.length === 0 ? null : (
    <div className="space-y-3">
      <h4 className={`text-xs font-bold uppercase tracking-wide ${color}`}>{title} ({items.length})</h4>
      {items.map(iss => <IssueCard key={iss.code} iss={iss} />)}
    </div>
  );

  return (
    <div className="space-y-6 py-4">
      <Section title="Critical Issues" items={critical} color="text-red-500" />
      <Section title="Warnings" items={warning} color="text-amber-500" />
      <Section title="Informational" items={info} color="text-blue-500" />
    </div>
  );
}
