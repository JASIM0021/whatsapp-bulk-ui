import { useEffect, useRef, useState } from 'react';
import { X, Send, RefreshCw, RotateCcw, CheckCircle2, XCircle, ChevronRight, FlaskConical, Info } from 'lucide-react';
import type { AgentExecution, ExecutionStepLog } from '@/types/agent';
import { getDef } from './catalog';

interface Msg { role: 'user' | 'agent' | 'system'; text: string }

interface Props {
  triggerType: string | null; // first trigger in the flow
  webhookSample: string;
  onRun: (input: { inputText: string; variables?: Record<string, unknown>; history: { role: string; content: string }[] }) => Promise<AgentExecution | null>;
  onClose: () => void;
}

// Chat-style test runner. Uses the real AI (costs credits) but the backend
// never sends WhatsApp messages, emails or notifications during tests.
export function TestPanel({ triggerType, webhookSample, onRun, onClose }: Props) {
  const isChat = triggerType === 'trigger_inbound' || triggerType === null;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [payload, setPayload] = useState(webhookSample || '{}');
  const [running, setRunning] = useState(false);
  const [last, setLast] = useState<AgentExecution | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, last]);

  const run = async () => {
    let variables: Record<string, unknown> | undefined;
    let text = input.trim();
    if (!isChat) {
      try {
        variables = JSON.parse(payload || '{}');
      } catch {
        setMsgs(m => [...m, { role: 'system', text: 'The test data is not valid JSON.' }]);
        return;
      }
      text = String(variables?.message ?? '');
    } else if (!text) {
      return;
    }
    const history = msgs.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.text }));
    if (isChat) setMsgs(m => [...m, { role: 'user', text }]);
    setInput('');
    setRunning(true);
    const exec = await onRun({ inputText: text, variables, history });
    setRunning(false);
    if (!exec) return;
    setLast(exec);
    if (exec.status === 'failed') {
      setMsgs(m => [...m, { role: 'system', text: exec.error || 'The run failed.' }]);
    } else if (exec.reply) {
      setMsgs(m => [...m, { role: 'agent', text: exec.reply! }]);
    } else {
      setMsgs(m => [...m, { role: 'system', text: 'Finished without a reply (no “Reply to sender” step ran).' }]);
    }
  };

  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-gray-800 bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white"><FlaskConical size={15} className="text-sky-400" /> Test this employee</h3>
        <div className="flex items-center gap-1">
          <button type="button" title="Start over" onClick={() => { setMsgs([]); setLast(null); }} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-white"><RotateCcw size={14} /></button>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-800 hover:text-white"><X size={16} /></button>
        </div>
      </div>

      <p className="flex gap-2 border-b border-gray-800 bg-sky-500/5 px-4 py-2.5 text-[11px] leading-snug text-sky-200">
        <Info size={13} className="mt-px shrink-0" />
        Tests use the real AI (1 credit per AI step) but never send WhatsApp messages, emails or notifications. Your changes are saved before each test.
      </p>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {msgs.length === 0 && (
          <p className="pt-6 text-center text-[12px] text-gray-500">
            {isChat ? 'Type a message as if you were a customer.' : 'Edit the test data below and press Run.'}
          </p>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] ${
              m.role === 'user' ? 'bg-emerald-600 text-white' : m.role === 'agent' ? 'border border-gray-700 bg-gray-800 text-gray-100' : 'border border-red-500/30 bg-red-500/10 text-red-200'
            }`}>{m.text}</div>
          </div>
        ))}
        {running && <p className="flex items-center gap-2 text-[12px] text-gray-400"><RefreshCw size={12} className="animate-spin" /> Running the flow…</p>}
        {last && <StepTrace steps={last.stepLogs} total={last.totalDurationMs} />}
        <div ref={end} />
      </div>

      <div className="border-t border-gray-800 p-3">
        {isChat ? (
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !running) run(); }}
              placeholder="Hi, how much does delivery cost?"
              className="flex-1 rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-[13px] text-white focus:border-emerald-500 focus:outline-none"
            />
            <button type="button" onClick={run} disabled={running || !input.trim()} aria-label="Send" className="rounded-xl bg-emerald-600 px-3 text-white hover:bg-emerald-500 disabled:opacity-40">
              <Send size={15} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-[11px] font-medium text-gray-400">Test data (JSON the trigger receives)</label>
            <textarea value={payload} onChange={e => setPayload(e.target.value)} rows={5} className="w-full rounded-xl border border-gray-700 bg-gray-950 p-2.5 font-mono text-[11px] text-gray-100 focus:border-emerald-500 focus:outline-none" />
            <button type="button" onClick={run} disabled={running} className="w-full rounded-xl bg-emerald-600 py-2 text-[13px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-40">
              {running ? 'Running…' : 'Run test'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export function StepTrace({ steps, total }: { steps: ExecutionStepLog[]; total: number }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950/70 p-2.5">
      <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Steps that ran · {(total / 1000).toFixed(1)}s</p>
      <ol className="space-y-1">
        {steps.map(s => <StepRow key={s.stepIndex} step={s} />)}
      </ol>
    </div>
  );
}

function StepRow({ step }: { step: ExecutionStepLog }) {
  const [open, setOpen] = useState(step.status === 'failed');
  const def = getDef(step.nodeType);
  const out = step.output ?? {};
  const note = typeof out.test_note === 'string' ? out.test_note : null;
  const shown = Object.entries(out).filter(([k]) => !['started_at', 'test_note'].includes(k));
  return (
    <li className="rounded-lg bg-gray-900/80">
      <button type="button" onClick={() => setOpen(o => !o)} className="flex w-full items-center gap-2 px-2 py-1.5 text-left">
        {step.status === 'failed' ? <XCircle size={13} className="shrink-0 text-red-400" /> : <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />}
        <span className="min-w-0 flex-1 truncate text-[12px] text-gray-200">{step.nodeLabel || def?.title}</span>
        <span className="text-[10px] text-gray-500">{step.durationMs}ms</span>
        <ChevronRight size={12} className={`text-gray-500 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {note && <p className="px-7 pb-1.5 text-[11px] text-sky-300">{note}</p>}
      {open && (
        <div className="space-y-1 px-7 pb-2">
          {step.error && <p className="text-[11px] text-red-300">{step.error}</p>}
          {shown.map(([k, v]) => (
            <div key={k} className="text-[11px]">
              <code className="text-emerald-300">{k}</code>
              <pre className="mt-0.5 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded bg-black/30 p-1.5 font-mono text-[10px] text-gray-300">
                {typeof v === 'string' ? v : JSON.stringify(v, null, 2)}
              </pre>
            </div>
          ))}
          {!step.error && shown.length === 0 && <p className="text-[11px] text-gray-500">No output.</p>}
        </div>
      )}
    </li>
  );
}
