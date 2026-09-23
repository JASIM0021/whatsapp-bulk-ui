import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Pause, Play, Download, Trash2, Search, Loader2, AlertCircle, ArrowDownToLine } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

type Level = 'error' | 'warn' | 'success' | 'http' | 'info';

interface LogLine {
  stream: 'out' | 'err';
  time?: string;
  level: Level;
  text: string;
}

const POLL_MS = 3000;
const BUFFER_LIMIT = 5000;

const LEVELS: { id: Level; label: string; chip: string; text: string }[] = [
  { id: 'error',   label: 'Errors',   chip: 'bg-red-500/15 text-red-300 border-red-500/40',             text: 'text-red-300' },
  { id: 'warn',    label: 'Warnings', chip: 'bg-amber-500/15 text-amber-300 border-amber-500/40',       text: 'text-amber-200' },
  { id: 'success', label: 'Success',  chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40', text: 'text-emerald-300' },
  { id: 'info',    label: 'Info',     chip: 'bg-slate-500/20 text-slate-200 border-slate-500/40',       text: 'text-slate-200' },
  { id: 'http',    label: 'HTTP requests', chip: 'bg-sky-500/15 text-sky-300 border-sky-500/40',       text: 'text-sky-300/80' },
];
const LEVEL_TEXT = Object.fromEntries(LEVELS.map(l => [l.id, l.text])) as Record<Level, string>;

/* ─── Logs Tab: live view of the backend's pm2 logs ─── */
export function AdminLogsTab() {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [live, setLive] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [stream, setStream] = useState<'all' | 'out' | 'err'>('all');
  const [levels, setLevels] = useState<Set<Level>>(new Set(['error', 'warn', 'success', 'info']));
  const [query, setQuery] = useState('');
  const [initialLines, setInitialLines] = useState(300);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const cursorRef = useRef('');
  const inFlight = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(async (reset = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const params = new URLSearchParams({ lines: String(initialLines) });
      if (!reset && cursorRef.current) params.set('cursor', cursorRef.current);
      const res = await apiFetch(`${API_ENDPOINTS.admin.logs}?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || `Failed to load logs (${res.status})`);
      cursorRef.current = json.data.cursor;
      const incoming: LogLine[] = json.data.lines || [];
      setLines(prev => {
        const next = reset ? incoming : incoming.length ? [...prev, ...incoming] : prev;
        return next.length > BUFFER_LIMIT ? next.slice(next.length - BUFFER_LIMIT) : next;
      });
      setError('');
      setLastUpdate(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load logs');
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [initialLines]);

  // Initial load (and reload when the initial size changes).
  useEffect(() => {
    cursorRef.current = '';
    poll(true);
  }, [poll]);

  // Live polling; skipped while the browser tab is hidden.
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') poll();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [live, poll]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lines.filter(l =>
      (stream === 'all' || l.stream === stream) &&
      levels.has(l.level) &&
      (!q || l.text.toLowerCase().includes(q)));
  }, [lines, stream, levels, query]);

  useEffect(() => {
    if (autoScroll && boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [visible, autoScroll]);

  // Scrolling up pauses auto-scroll; returning to the bottom resumes it.
  const onScroll = () => {
    const el = boxRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom !== autoScroll) setAutoScroll(atBottom);
  };

  const toggleLevel = (id: Level) => setLevels(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const download = () => {
    const body = visible.map(l => `${l.time ?? ''} [${l.stream}] ${l.text}`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'text/plain' }));
    a.download = `backend-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const counts = useMemo(() => {
    const c: Record<Level, number> = { error: 0, warn: 0, success: 0, http: 0, info: 0 };
    for (const l of lines) c[l.level]++;
    return c;
  }, [lines]);

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap items-center gap-2">
        <button onClick={() => setLive(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${live ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          {live ? <><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /><Pause size={12} />Live</> : <><Play size={12} />Paused</>}
        </button>
        <select value={stream} onChange={e => setStream(e.target.value as typeof stream)}
          className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white">
          <option value="all">All output</option>
          <option value="out">Standard output</option>
          <option value="err">Error output</option>
        </select>
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter lines…"
            className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <select value={initialLines} onChange={e => { setLoading(true); setInitialLines(Number(e.target.value)); }}
          title="How many past lines to load" className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white">
          {[300, 1000, 2000].map(n => <option key={n} value={n}>Last {n} lines</option>)}
        </select>
        <button onClick={download} disabled={!visible.length} title="Download visible lines"
          className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40"><Download size={14} /></button>
        <button onClick={() => setLines([])} title="Clear view (doesn't delete log files)"
          className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"><Trash2 size={14} /></button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {LEVELS.map(l => (
          <button key={l.id} onClick={() => toggleLevel(l.id)}
            className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-opacity bg-slate-900 ${l.chip} ${levels.has(l.id) ? '' : 'opacity-35'}`}>
            {l.label} <span className="opacity-70">{counts[l.id]}</span>
          </button>
        ))}
        <span className="ml-auto text-[11px] text-gray-400">
          {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : ''}{live ? ` · refreshes every ${POLL_MS / 1000}s` : ''}
        </span>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
          <AlertCircle size={13} />{error}
        </p>
      )}

      {/* Log view */}
      <div className="relative">
        <div ref={boxRef} onScroll={onScroll}
          className="h-[65vh] overflow-auto bg-slate-950 rounded-xl border border-slate-800 p-3 font-mono text-[11.5px] leading-5">
          {loading && !lines.length ? (
            <div className="h-full flex items-center justify-center text-slate-500"><Loader2 size={18} className="animate-spin" /></div>
          ) : !visible.length ? (
            <p className="text-slate-500">No log lines match the current filters.</p>
          ) : visible.map((l, i) => (
            <div key={i} className="flex gap-3 hover:bg-white/5 px-1 rounded">
              <span className="text-slate-500 flex-shrink-0 select-none">{l.time?.slice(11) ?? ''}</span>
              {l.stream === 'err' && <span className="text-red-400/70 flex-shrink-0 select-none">ERR</span>}
              <span className={`whitespace-pre-wrap break-all ${LEVEL_TEXT[l.level]}`}>{l.text}</span>
            </div>
          ))}
        </div>
        {!autoScroll && visible.length > 0 && (
          <button onClick={() => setAutoScroll(true)}
            className="absolute bottom-3 right-4 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-lg hover:bg-emerald-700">
            <ArrowDownToLine size={12} />Jump to latest
          </button>
        )}
      </div>
      <p className="text-[11px] text-gray-400">
        Same output as <code>pm2 logs</code> for this backend. Secret values from the server environment are masked. Showing {visible.length} of {lines.length} buffered lines (keeps the latest {BUFFER_LIMIT}).
      </p>
    </div>
  );
}
