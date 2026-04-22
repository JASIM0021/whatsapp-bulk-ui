import { useState, useEffect, useCallback } from 'react';
import { Clock, X, RefreshCw, AlertTriangle, Trash2, CheckCircle2, XCircle, Loader, CalendarClock } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

interface ScheduledJobResult {
  sent: number;
  failed: number;
  total: number;
  errors: string[];
}

interface ScheduledJob {
  id: string;
  userId: string;
  contacts: { phone: string; name: string }[];
  messages: { text: string }[];
  scheduledAt: string;
  status: 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
  label?: string;
  createdAt: string;
  completedAt?: string;
  result?: ScheduledJobResult;
  errorMsg?: string;
}

interface ScheduledJobsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-blue-100 text-blue-700',   icon: Clock },
  running:   { label: 'Sending…',  color: 'bg-yellow-100 text-yellow-700', icon: Loader },
  done:      { label: 'Done',      color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  failed:    { label: 'Failed',    color: 'bg-red-100 text-red-700',     icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500',   icon: XCircle },
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function ScheduledJobsDrawer({ isOpen, onClose }: ScheduledJobsDrawerProps) {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.schedule.list);
      const json = await res.json();
      if (json.success) {
        setJobs(json.data || []);
      } else {
        setError(json.error || 'Failed to load scheduled jobs');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchJobs();
    }
  }, [isOpen, fetchJobs]);

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      const res = await apiFetch(API_ENDPOINTS.schedule.cancel(id), { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'cancelled' } : j));
      }
    } catch {
      // ignore
    } finally {
      setCancellingId(null);
    }
  };

  if (!isOpen) return null;

  const pendingCount = jobs.filter(j => j.status === 'pending').length;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <CalendarClock size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Scheduled Messages</h2>
              <p className="text-xs text-blue-200">
                {isLoading ? 'Loading…' : `${pendingCount} pending · ${jobs.length} total`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchJobs}
              disabled={isLoading}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <RefreshCw size={22} className="animate-spin mr-2" />
              <span className="text-sm">Loading scheduled jobs…</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-16 text-red-500 gap-2">
              <AlertTriangle size={28} />
              <p className="text-sm">{error}</p>
              <button onClick={fetchJobs} className="text-xs text-blue-600 underline">Retry</button>
            </div>
          )}

          {!isLoading && !error && jobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <CalendarClock size={44} className="opacity-30" />
              <p className="text-sm font-medium">No scheduled messages yet</p>
              <p className="text-xs text-center max-w-xs">
                Schedule messages from the Compose window — they'll appear here.
              </p>
            </div>
          )}

          {!isLoading && !error && jobs.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {jobs.map(job => {
                const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                const isPending = job.status === 'pending';
                return (
                  <li key={job.id} className="p-4 space-y-2.5">
                    {/* Top row: status badge + label + cancel */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          <StatusIcon size={11} className={job.status === 'running' ? 'animate-spin' : ''} />
                          {cfg.label}
                        </span>
                        {job.label && (
                          <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                            {job.label}
                          </span>
                        )}
                      </div>
                      {isPending && (
                        <button
                          onClick={() => handleCancel(job.id)}
                          disabled={cancellingId === job.id}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 shrink-0"
                          title="Cancel this job"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {/* Schedule time */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Clock size={12} className="shrink-0" />
                      <span>
                        {isPending ? 'Sends at' : job.status === 'running' ? 'Sending since' : 'Sent at'}:&nbsp;
                        <span className="font-medium">{fmtDateTime(job.scheduledAt)}</span>
                      </span>
                    </div>

                    {/* Contacts + messages summary */}
                    <div className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{job.contacts.length} contact{job.contacts.length !== 1 ? 's' : ''}</span>
                      {job.messages.length > 1 && <span> · {job.messages.length} messages</span>}
                      {job.messages[0]?.text && (
                        <p className="mt-0.5 text-gray-400 truncate max-w-sm">
                          {job.messages[0].text.slice(0, 80)}{job.messages[0].text.length > 80 ? '…' : ''}
                        </p>
                      )}
                    </div>

                    {/* Result (done/failed) */}
                    {job.result && (
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-600 font-medium">✓ {job.result.sent} sent</span>
                        {job.result.failed > 0 && (
                          <span className="text-red-500 font-medium">✗ {job.result.failed} failed</span>
                        )}
                      </div>
                    )}
                    {job.errorMsg && (
                      <p className="text-xs text-red-500">{job.errorMsg}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
