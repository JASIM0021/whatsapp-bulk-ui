import { useState, useEffect } from 'react';
import { CalendarClock, Trash2, RefreshCw, CheckCircle2, XCircle, Clock, Loader2, Users } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

interface EmailJob {
  id: string; label?: string; status: string;
  scheduledAt: string; createdAt: string;
  contacts: { email: string; name?: string }[];
  message: { subject: string };
  result?: { sent: number; failed: number; total: number };
}

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

export function EmailSchedulePage({ isPaid }: { isPaid: boolean }) {
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => { if (isPaid) load(); }, [isPaid]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.schedule);
      const d = await r.json();
      if (d.success) setJobs(d.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const cancel = async (id: string) => {
    setCancelling(id);
    try {
      await apiFetch(API_ENDPOINTS.email.cancelSchedule(id), { method: 'DELETE' });
      setJobs(j => j.map(job => job.id === id ? { ...job, status: 'cancelled' } : job));
    } catch { /* ignore */ }
    setCancelling(null);
  };

  const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  if (!isPaid) return <div className="text-center py-16"><CalendarClock size={40} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">Available on paid plans</p></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Scheduled Email Campaigns</h2>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 font-medium transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {loading && !jobs.length ? (
        <div className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-blue-500" /></div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
          <CalendarClock size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No scheduled campaigns</p>
          <p className="text-gray-400 text-sm mt-1">Use "Schedule for later" in the Send tab to create one</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${STATUS_STYLES[job.status] || STATUS_STYLES.pending}`}>
                      {STATUS_ICONS[job.status]} {job.status}
                    </span>
                    {job.label && <span className="text-sm font-medium text-gray-700">{job.label}</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{job.message.subject}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><Users size={11} />{job.contacts.length} recipients</span>
                    <span className="flex items-center gap-1"><CalendarClock size={11} />Scheduled: {fmt(job.scheduledAt)}</span>
                    <span>Created: {fmt(job.createdAt)}</span>
                  </div>
                  {job.result && (
                    <div className="mt-2 flex gap-3 text-xs">
                      <span className="text-green-600 font-semibold">{job.result.sent} sent</span>
                      {job.result.failed > 0 && <span className="text-red-600 font-semibold">{job.result.failed} failed</span>}
                    </div>
                  )}
                </div>
                {job.status === 'pending' && (
                  <button onClick={() => cancel(job.id)} disabled={cancelling === job.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-colors shrink-0">
                    {cancelling === job.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
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
