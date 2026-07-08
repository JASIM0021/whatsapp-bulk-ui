import { useState, useEffect } from 'react';
import { CalendarClock, XCircle, Clock, Loader2, CheckCircle2, RefreshCw, ExternalLink } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { LinkedInScheduledPost } from '@/types/linkedin';
import { LinkedInSessionHook } from '@/hooks/useLinkedInSession';

interface Props { isPaid: boolean; session: LinkedInSessionHook }

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  running:   'bg-blue-50 text-blue-700 border-blue-200',
  done:      'bg-green-50 text-green-700 border-green-200',
  failed:    'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending:   <Clock size={13} />,
  running:   <Loader2 size={13} className="animate-spin" />,
  done:      <CheckCircle2 size={13} />,
  failed:    <XCircle size={13} />,
  cancelled: <XCircle size={13} />,
};

const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export function LinkedInSchedulePage({ isPaid, session }: Props) {
  const [jobs, setJobs] = useState<LinkedInScheduledPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => { if (isPaid && session.isConnected) load(); }, [isPaid, session.isConnected]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch(API_ENDPOINTS.linkedin.schedule);
      const d = await r.json();
      if (d.success) setJobs(d.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const cancel = async (id: string) => {
    setCancelling(id);
    try {
      await apiFetch(API_ENDPOINTS.linkedin.cancelSchedule(id), { method: 'DELETE' });
      setJobs(j => j.map(job => job.id === id ? { ...job, status: 'cancelled' as const } : job));
    } catch { /* ignore */ }
    setCancelling(null);
  };

  if (!isPaid) {
    return (
      <div className="text-center py-16">
        <CalendarClock size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 text-sm">Upgrade to Pro to schedule LinkedIn posts.</p>
        <a href="/subscription" className="inline-block mt-4 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">Upgrade</a>
      </div>
    );
  }

  if (!session.isConnected) {
    return (
      <div className="text-center py-16">
        <CalendarClock size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 text-sm">Connect your LinkedIn account to view scheduled posts.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">Scheduled Posts</h2>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[#0A66C2]" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
          <CalendarClock size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">No scheduled posts yet.</p>
          <p className="text-gray-400 text-xs mt-1">Schedule a post from the Compose tab.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 line-clamp-2">{job.text}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_STYLES[job.status] ?? ''}`}>
                      {STATUS_ICONS[job.status]} {job.status}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Scheduled: {fmt(job.scheduledAt)}
                    </span>
                    {job.postUrl && (
                      <a href={job.postUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-[#0A66C2] hover:underline">
                        <ExternalLink size={10} /> View on LinkedIn
                      </a>
                    )}
                  </div>
                  {job.error && (
                    <p className="mt-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1">{job.error}</p>
                  )}
                </div>
                {job.status === 'pending' && (
                  <button
                    onClick={() => cancel(job.id)}
                    disabled={cancelling === job.id}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    {cancelling === job.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
