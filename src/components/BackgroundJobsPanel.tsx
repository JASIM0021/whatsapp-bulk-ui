import { useState } from 'react';
import { X, StopCircle, CheckCircle, AlertTriangle, Loader, Mail, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { ProgressBar } from './ui/ProgressBar';

export interface BgJob {
  id: string;
  total: number;
  sent: number;
  failed: number;
  status: 'running' | 'stopped' | 'done' | 'failed';
  startedAt: Date;
}

interface BackgroundJobsPanelProps {
  jobs: BgJob[];
  onStop: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function BackgroundJobsPanel({ jobs, onStop, onDismiss }: BackgroundJobsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [stoppingId, setStoppingId] = useState<string | null>(null);

  if (jobs.length === 0) return null;

  const activeCount = jobs.filter(j => j.status === 'running').length;

  const handleStop = async (id: string) => {
    setStoppingId(id);
    await onStop(id);
    setStoppingId(null);
  };

  return (
    <div className="fixed bottom-20 right-4 md:right-6 z-50 w-72 md:w-80">
      {/* Panel header — always visible, clickable to collapse */}
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-600 text-white rounded-t-xl focus:outline-none"
        onClick={() => setIsCollapsed(prev => !prev)}
      >
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
          )}
          <span className="text-sm font-semibold">
            {activeCount > 0 ? 'Sending in Background' : 'Background Jobs'}
          </span>
          <span className="text-xs text-blue-200">
            {jobs.length} job{jobs.length !== 1 ? 's' : ''}
          </span>
        </div>
        {isCollapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {/* Jobs list */}
      {!isCollapsed && (
        <div className="bg-white border border-blue-200 border-t-0 rounded-b-xl shadow-2xl divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
          {jobs.map(job => {
            const remaining = Math.max(0, job.total - job.sent - job.failed);
            return (
              <div key={job.id} className="p-4 space-y-3">
                {/* Status row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {job.status === 'running' && (
                      <>
                        <Loader size={13} className="text-blue-500 animate-spin shrink-0" />
                        <span className="text-xs font-semibold text-blue-700">Sending…</span>
                      </>
                    )}
                    {job.status === 'done' && (
                      <>
                        <CheckCircle size={13} className="text-green-500 shrink-0" />
                        <span className="text-xs font-semibold text-green-700">Done!</span>
                      </>
                    )}
                    {job.status === 'stopped' && (
                      <>
                        <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                        <span className="text-xs font-semibold text-amber-700">Stopped</span>
                      </>
                    )}
                    {job.status === 'failed' && (
                      <>
                        <XCircle size={13} className="text-red-500 shrink-0" />
                        <span className="text-xs font-semibold text-red-700">Failed</span>
                      </>
                    )}
                  </div>

                  {job.status === 'running' ? (
                    <button
                      onClick={() => handleStop(job.id)}
                      disabled={stoppingId === job.id}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                    >
                      {stoppingId === job.id ? (
                        <Loader size={11} className="animate-spin" />
                      ) : (
                        <StopCircle size={11} />
                      )}
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => onDismiss(job.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                <ProgressBar current={job.sent + job.failed} total={job.total} />

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="p-1.5 bg-green-50 rounded-lg">
                    <p className="text-sm font-bold text-green-800">{job.sent}</p>
                    <p className="text-[10px] text-green-600">Sent</p>
                  </div>
                  <div className="p-1.5 bg-red-50 rounded-lg">
                    <p className="text-sm font-bold text-red-800">{job.failed}</p>
                    <p className="text-[10px] text-red-600">Failed</p>
                  </div>
                  <div className="p-1.5 bg-gray-50 rounded-lg">
                    <p className="text-sm font-bold text-gray-800">{remaining}</p>
                    <p className="text-[10px] text-gray-600">Left</p>
                  </div>
                </div>

                {/* Email notification notice */}
                {(job.status === 'done' || job.status === 'stopped') && (
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                    <Mail size={11} className="shrink-0 text-blue-400" />
                    <span>Email report sent to your inbox</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
