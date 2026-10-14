import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Plus, Search, Plug, Trash2, PenLine, Rocket, PauseCircle, Radio, X, RefreshCw, ArrowLeft, ArrowRight, Sparkles,
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import type { AIAgent } from '@/types/agent';
import { getDef } from './studio/catalog';

type Tab = 'mine' | 'templates';

const liveWhere = (a: AIAgent) => {
  const d = a.deployment;
  if (!d) return '';
  return [d.whatsapp && 'WhatsApp', d.chatbot && 'Website chat', d.webhook && 'Webhook', d.schedule && 'Schedule'].filter(Boolean).join(' · ');
};

// Steps of a template in reading order (top to bottom), for the card.
const stepTitles = (a: AIAgent) =>
  [...(a.graph?.nodes || [])]
    .sort((x, y) => (x.position?.y ?? 0) - (y.position?.y ?? 0) || (x.position?.x ?? 0) - (y.position?.x ?? 0))
    .map(n => getDef(n.type)?.title ?? n.label)
    .filter((t, i, arr) => arr.indexOf(t) === i);

export function AIWorkersPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('mine');
  const [templates, setTemplates] = useState<AIAgent[]>([]);
  const [mine, setMine] = useState<AIAgent[] | null>(null);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [hiring, setHiring] = useState<AIAgent | null>(null);
  const [hireName, setHireName] = useState('');
  const [hireNote, setHireNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    Promise.all([
      apiFetch(API_ENDPOINTS.agents.templates).then(r => r.json()),
      apiFetch(API_ENDPOINTS.agents.list).then(r => r.json()),
    ]).then(([t, m]) => {
      if (!live) return;
      if (t.success) setTemplates(t.data || []);
      setMine(m.success ? m.data || [] : []);
      if (m.success && !(m.data || []).length) setTab('templates');
      if (!m.success) setError(m.error || 'Could not load your employees');
    }).catch(() => { if (live) { setMine([]); setError('Could not reach the server. Check your connection and refresh.'); } });
    return () => { live = false; };
  }, []);

  const categories = useMemo(() => ['all', ...Array.from(new Set(templates.map(t => t.templateCategory).filter(Boolean) as string[]))], [templates]);
  const shownTemplates = templates.filter(t =>
    (category === 'all' || t.templateCategory === category) &&
    `${t.name} ${t.description} ${t.role}`.toLowerCase().includes(query.toLowerCase()));

  const hire = async () => {
    if (!hiring) return;
    setBusy('hire');
    try {
      const res = await apiFetch(API_ENDPOINTS.agents.hireTemplate, {
        method: 'POST',
        body: JSON.stringify({ templateId: hiring.slug, customName: hireName.trim() || hiring.name, settings: hireNote.trim() ? { customInstruction: hireNote.trim() } : {} }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error || 'Could not hire this employee'); return; }
      navigate(`/studio/${json.data.id}`);
    } catch {
      setError('Could not hire this employee');
    } finally {
      setBusy(null);
    }
  };

  const pause = async (a: AIAgent) => {
    setBusy(a.id);
    try {
      const res = await apiFetch(API_ENDPOINTS.agents.pause(a.id), { method: 'POST' });
      const json = await res.json();
      if (json.success) setMine(list => (list || []).map(x => (x.id === a.id ? { ...x, status: 'paused' } : x)));
      else setError(json.error || 'Could not pause');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (a: AIAgent) => {
    if (!window.confirm(`Delete ${a.name}? ${a.status === 'active' ? 'It will stop answering immediately. ' : ''}This can’t be undone.`)) return;
    setBusy(a.id);
    try {
      const res = await apiFetch(API_ENDPOINTS.agents.delete(a.id), { method: 'DELETE' });
      const json = await res.json();
      if (json.success) setMine(list => (list || []).filter(x => x.id !== a.id));
      else setError(json.error || 'Could not delete');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-900/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/app')} title="Back" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"><ArrowLeft size={18} /></button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600"><Bot size={19} className="text-white" /></div>
            <div>
              <h1 className="text-[16px] font-bold text-white">AI employees</h1>
              <p className="hidden text-[12px] text-gray-400 sm:block">Build, test and deploy employees that answer on WhatsApp, your website and more</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/connectors')} className="hidden items-center gap-1.5 rounded-xl border border-gray-700 px-3 py-2 text-[12px] text-gray-200 hover:bg-gray-800 sm:flex"><Plug size={14} /> Connectors</button>
            <button type="button" onClick={() => navigate('/studio')} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-emerald-500"><Plus size={14} /> Build from scratch</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex gap-1 rounded-xl border border-gray-800 bg-gray-900 p-1 sm:w-fit">
          {([['mine', `My employees${mine ? ` (${mine.length})` : ''}`], ['templates', 'Hire from templates']] as [Tab, string][]).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={`flex-1 rounded-lg px-4 py-2 text-[13px] font-medium sm:flex-none ${tab === k ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-200'}`}>{label}</button>
          ))}
        </div>

        {error && (
          <p className="mb-4 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-[13px] text-red-200">
            {error}
            <button type="button" aria-label="Dismiss" onClick={() => setError('')}><X size={14} /></button>
          </p>
        )}

        {tab === 'mine' && (
          mine === null ? (
            <p className="flex items-center gap-2 py-16 text-[13px] text-gray-400"><RefreshCw size={14} className="animate-spin" /> Loading…</p>
          ) : mine.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-700 p-10 text-center">
              <Sparkles className="mx-auto text-emerald-400" />
              <p className="mt-3 text-[15px] font-semibold text-white">You haven’t built an AI employee yet</p>
              <p className="mx-auto mt-1 max-w-md text-[13px] text-gray-400">Start from a template (they work out of the box) or build your own flow in the studio.</p>
              <div className="mt-5 flex justify-center gap-2">
                <button type="button" onClick={() => setTab('templates')} className="rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-emerald-500">Browse templates</button>
                <button type="button" onClick={() => navigate('/studio')} className="rounded-xl border border-gray-700 px-4 py-2 text-[13px] text-gray-200 hover:bg-gray-800">Build from scratch</button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mine.map(a => {
                const m = a.metrics || { totalRuns: 0, successfulRuns: 0, failedRuns: 0, avgResponseTimeMs: 0 };
                const rate = m.totalRuns ? Math.round((m.successfulRuns / m.totalRuns) * 100) : null;
                return (
                  <article key={a.id} className="flex flex-col rounded-2xl border border-gray-800 bg-gray-900 p-5">
                    <div className="flex items-start gap-3">
                      <img src={a.avatar} alt="" className="h-11 w-11 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[14px] font-semibold text-white">{a.name}</h3>
                        <p className="truncate text-[12px] text-gray-400">{a.role}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      {a.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300"><Radio size={11} /> Live · {liveWhere(a)}</span>
                      ) : a.status === 'paused' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300"><PauseCircle size={11} /> Paused</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-800 px-2.5 py-1 text-[11px] font-medium text-gray-300">Draft · not live</span>
                      )}
                    </div>
                    <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-gray-950/60 p-3 text-center">
                      <div><dt className="text-[10px] text-gray-500">Runs</dt><dd className="text-[14px] font-semibold text-white">{m.totalRuns}</dd></div>
                      <div><dt className="text-[10px] text-gray-500">Success</dt><dd className="text-[14px] font-semibold text-white">{rate === null ? '–' : `${rate}%`}</dd></div>
                      <div><dt className="text-[10px] text-gray-500">Avg time</dt><dd className="text-[14px] font-semibold text-white">{m.totalRuns ? `${(m.avgResponseTimeMs / 1000).toFixed(1)}s` : '–'}</dd></div>
                    </dl>
                    <p className="mt-2 text-[11px] text-gray-500">{m.lastRunAt ? `Last run ${new Date(m.lastRunAt).toLocaleString()}` : 'No live runs yet'}</p>
                    <div className="mt-4 flex gap-2">
                      <button type="button" onClick={() => navigate(`/studio/${a.id}`)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-700 py-2 text-[12px] text-gray-100 hover:bg-gray-800"><PenLine size={13} /> Open studio</button>
                      {a.status === 'active' ? (
                        <button type="button" disabled={busy === a.id} onClick={() => pause(a)} className="flex items-center gap-1.5 rounded-xl border border-gray-700 px-3 py-2 text-[12px] text-gray-200 hover:bg-gray-800 disabled:opacity-50"><PauseCircle size={13} /> Pause</button>
                      ) : (
                        <button type="button" onClick={() => navigate(`/studio/${a.id}?deploy=1`)} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-emerald-500"><Rocket size={13} /> Deploy</button>
                      )}
                      <button type="button" disabled={busy === a.id} onClick={() => remove(a)} aria-label={`Delete ${a.name}`} className="rounded-xl border border-gray-800 px-2.5 text-gray-500 hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"><Trash2 size={14} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        )}

        {tab === 'templates' && (
          <>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search templates" className="w-full rounded-xl border border-gray-800 bg-gray-900 py-2 pl-9 pr-3 text-[13px] text-white focus:border-emerald-500 focus:outline-none" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(c => (
                  <button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-full border px-3 py-1 text-[12px] ${category === c ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-gray-800 text-gray-400 hover:text-gray-200'}`}>
                    {c === 'all' ? 'All' : c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shownTemplates.map(t => (
                <article key={t.slug} className="flex flex-col rounded-2xl border border-gray-800 bg-gray-900 p-5">
                  <div className="flex items-center gap-3">
                    <img src={t.avatar} alt="" className="h-11 w-11 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-semibold text-white">{t.name}</h3>
                      <p className="text-[12px] text-gray-400">{t.templateCategory}</p>
                    </div>
                  </div>
                  <p className="mt-3 flex-1 text-[13px] leading-relaxed text-gray-300">{t.description}</p>
                  <ol className="mt-3 flex flex-wrap items-center gap-1 text-[10px] text-gray-400">
                    {stepTitles(t).map((s, i, arr) => (
                      <li key={s} className="flex items-center gap-1">
                        <span className="rounded-md bg-gray-800 px-1.5 py-0.5">{s}</span>
                        {i < arr.length - 1 && <ArrowRight size={10} className="text-gray-600" />}
                      </li>
                    ))}
                  </ol>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={() => { setHiring(t); setHireName(t.name); setHireNote(''); }} className="flex-1 rounded-xl bg-emerald-600 py-2 text-[12px] font-semibold text-white hover:bg-emerald-500">Use this template</button>
                    <button type="button" onClick={() => navigate(`/studio?template=${t.slug}`)} className="rounded-xl border border-gray-700 px-3 py-2 text-[12px] text-gray-200 hover:bg-gray-800">Preview</button>
                  </div>
                </article>
              ))}
              {shownTemplates.length === 0 && <p className="text-[13px] text-gray-500">No templates match.</p>}
            </div>
          </>
        )}
      </main>

      {hiring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="hire-title">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-center justify-between">
              <h2 id="hire-title" className="text-[15px] font-bold text-white">Hire {hiring.name}</h2>
              <button type="button" aria-label="Close" onClick={() => setHiring(null)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-800 hover:text-white"><X size={16} /></button>
            </div>
            <p className="mt-1 text-[12px] text-gray-400">It opens in the studio as a draft, so you can add your business facts and test it before it goes live.</p>
            <label className="mt-4 block">
              <span className="mb-1 block text-[12px] font-medium text-gray-300">Name</span>
              <input value={hireName} onChange={e => setHireName(e.target.value)} className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-[13px] text-white focus:border-emerald-500 focus:outline-none" />
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-[12px] font-medium text-gray-300">Anything it should always do? (optional)</span>
              <textarea rows={3} value={hireNote} onChange={e => setHireNote(e.target.value)} placeholder="Reply in Hindi when the customer writes in Hindi. Mention free delivery above ₹999." className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-[13px] text-white focus:border-emerald-500 focus:outline-none" />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setHiring(null)} className="rounded-xl border border-gray-700 px-4 py-2 text-[13px] text-gray-200 hover:bg-gray-800">Cancel</button>
              <button type="button" onClick={hire} disabled={busy === 'hire'} className="rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">{busy === 'hire' ? 'Hiring…' : 'Hire and open studio'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
