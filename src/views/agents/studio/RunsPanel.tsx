import { useCallback, useEffect, useState } from 'react';
import { X, RefreshCw, History, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import type { AgentExecution } from '@/types/agent';
import { StepTrace } from './TestPanel';

const TRIGGER_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp', chatbot: 'Website chat', webhook: 'Webhook', schedule: 'Schedule', test: 'Test',
};

// Recent runs of a saved employee, live and test.
export function RunsPanel({ agentId, onClose }: { agentId: string; onClose: () => void }) {
  const [runs, setRuns] = useState<AgentExecution[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_ENDPOINTS.agents.executions(agentId)}?limit=50`);
      const json = await res.json();
      if (json.success) { setRuns(json.data || []); setError(''); }
      else setError(json.error || 'Could not load runs');
    } catch {
      setError('Could not load runs');
    }
  }, [agentId]);
  useEffect(() => {
    let live = true;
    apiFetch(`${API_ENDPOINTS.agents.executions(agentId)}?limit=50`)
      .then(r => r.json())
      .then(json => { if (live) { if (json.success) setRuns(json.data || []); else setError(json.error || 'Could not load runs'); } })
      .catch(() => { if (live) setError('Could not load runs'); });
    return () => { live = false; };
  }, [agentId]);

  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-gray-800 bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white"><History size={15} className="text-violet-400" /> Run history</h3>
        <div className="flex items-center gap-1">
          <button type="button" title="Refresh" onClick={load} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-white"><RefreshCw size={14} /></button>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-white"><X size={16} /></button>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {error && <p className="text-[12px] text-red-300">{error}</p>}
        {runs === null && !error && <p className="text-[12px] text-gray-500">Loading…</p>}
        {runs?.length === 0 && <p className="pt-6 text-center text-[12px] text-gray-500">No runs yet. Test the employee or deploy it.</p>}
        {runs?.map(r => {
          const open = openId === r.id;
          return (
            <div key={r.id} className="rounded-xl border border-gray-800 bg-gray-950/60">
              <button type="button" onClick={() => setOpenId(open ? null : r.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left">
                {r.status === 'success' ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
                <span className="flex-1">
                  <span className="block text-[12px] text-gray-200">
                    {TRIGGER_LABEL[r.triggerType] ?? r.triggerType}{r.mode === 'test' && r.triggerType !== 'test' ? ' (test)' : ''}
                  </span>
                  <span className="block text-[10px] text-gray-500">{new Date(r.createdAt).toLocaleString()} · {(r.totalDurationMs / 1000).toFixed(1)}s</span>
                </span>
                <ChevronRight size={13} className={`text-gray-500 ${open ? 'rotate-90' : ''}`} />
              </button>
              {open && (
                <div className="space-y-2 px-3 pb-3">
                  {typeof r.initialPayload?.message === 'string' && r.initialPayload.message && (
                    <p className="text-[12px] text-gray-300"><span className="text-gray-500">Message:</span> {r.initialPayload.message}</p>
                  )}
                  {r.reply && <p className="text-[12px] text-gray-300"><span className="text-gray-500">Reply:</span> {r.reply}</p>}
                  {r.error && <p className="text-[12px] text-red-300">{r.error}</p>}
                  <StepTrace steps={r.stepLogs} total={r.totalDurationMs} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
