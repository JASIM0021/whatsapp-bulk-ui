import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Rocket, Github, GitPullRequest, HardDrive, RefreshCw, Sparkles, Plus, X, Play, Save,
  AlertCircle, CheckCircle, Clock, Coins, ChevronDown, ChevronUp, ExternalLink,
  ToggleLeft, ToggleRight, Loader2, FileCode, ListChecks, Lightbulb, ShieldCheck, GitMerge, Globe,
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import type { RankConfig, RankKeyword, RankRun, RankCredits, RankCreditPack, SEOBlogRepo } from '@/types/seo';
import { localTimeLabel, UTC_HOUR_OPTIONS } from './utcHourOptions';

const MAX_KEYWORDS = 10;
const ACTIVE: RankRun['status'][] = ['queued', 'preparing', 'auditing', 'optimizing', 'delivering'];

const STATUS_STYLE: Record<RankRun['status'], string> = {
  queued:     'bg-gray-100 text-gray-600',
  preparing:  'bg-blue-100 text-blue-700',
  auditing:   'bg-indigo-100 text-indigo-700',
  optimizing: 'bg-purple-100 text-purple-700',
  delivering: 'bg-amber-100 text-amber-700',
  completed:  'bg-emerald-100 text-emerald-700',
  failed:     'bg-red-100 text-red-700',
};

type Message = { type: 'ok' | 'error'; text: string } | null;

function formatBytes(n: number): string {
  if (n >= 1 << 30) return `${(n / (1 << 30)).toFixed(1)} GB`;
  if (n >= 1 << 20) return `${(n / (1 << 20)).toFixed(0)} MB`;
  return `${Math.max(0, Math.round(n / 1024))} KB`;
}

async function readJSON<T>(res: Response): Promise<{ success: boolean; data?: T; error?: string }> {
  try { return await res.json(); } catch { return { success: false, error: `Request failed (${res.status})` }; }
}

const loadRazorpayScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });

function Notice({ message }: { message: Message }) {
  if (!message) return null;
  return (
    <p className={`text-sm flex items-start gap-1.5 ${message.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
      {message.type === 'ok' ? <CheckCircle size={14} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />}
      {message.text}
    </p>
  );
}

function Card({ step, icon, title, subtitle, children }: { step?: number; icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">{icon}</div>
        <div>
          <h2 className="text-base font-bold text-gray-800">{step ? <span className="text-gray-400 mr-1">{step}.</span> : null}{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

// ── Credits ──────────────────────────────────────────────────────────────────

function CreditsBar({ credits, onPurchased }: { credits: RankCredits | null; onPurchased: () => void }) {
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>(null);

  const buy = async (pack: RankCreditPack) => {
    setBuying(pack.plan);
    setMessage(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.subscription.initiate, {
        method: 'POST',
        body: JSON.stringify({ plan: pack.plan, currency: 'INR' }),
      });
      const json = await readJSON<{ keyId: string; amount: number; currency: string; description?: string; orderId: string; txnId: string; prefillName?: string; prefillEmail?: string; prefillPhone?: string }>(res);
      if (!json.success || !json.data) throw new Error(json.error || 'Failed to start payment');
      const rzp = json.data;
      await loadRazorpayScript();
      const Razorpay = (window as unknown as { Razorpay: new (o: object) => { open: () => void } }).Razorpay;
      new Razorpay({
        key: rzp.keyId,
        amount: rzp.amount,
        currency: rzp.currency || 'INR',
        name: 'NexBotix',
        description: rzp.description || pack.name,
        order_id: rzp.orderId,
        prefill: { name: rzp.prefillName, email: rzp.prefillEmail, contact: rzp.prefillPhone },
        theme: { color: '#10b981' },
        modal: { ondismiss: () => setBuying(null) },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verify = await apiFetch(API_ENDPOINTS.subscription.razorpayVerify, {
              method: 'POST',
              body: JSON.stringify({
                razorpayOrderId: r.razorpay_order_id,
                razorpayPaymentId: r.razorpay_payment_id,
                razorpaySignature: r.razorpay_signature,
                txnId: rzp.txnId,
              }),
            });
            const vj = await readJSON(verify);
            if (!vj.success) throw new Error(vj.error || 'Payment verification failed');
            setMessage({ type: 'ok', text: `Payment successful — ${pack.credits} credits added.` });
            onPurchased();
          } catch (e: unknown) {
            setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Payment verification failed' });
          } finally {
            setBuying(null);
          }
        },
      }).open();
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Payment failed' });
      setBuying(null);
    }
  };

  return (
    <section className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center"><Rocket size={20} /></div>
          <div>
            <h2 className="text-lg font-bold leading-tight">Rank to Top</h2>
            <p className="text-xs text-emerald-100">An AI SEO engineer that improves your website code every day and sends you a pull request.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
          <Coins size={16} />
          <span className="text-xl font-bold">{credits?.credits ?? '–'}</span>
          <span className="text-xs text-emerald-100">credits · 1 run = 1 credit</span>
        </div>
      </div>
      {credits && credits.packs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {credits.packs.map(p => (
            <button
              key={p.plan}
              onClick={() => buy(p)}
              disabled={buying !== null}
              className="flex items-center justify-between gap-2 bg-white text-gray-800 rounded-xl px-3 py-2.5 text-left hover:bg-emerald-50 disabled:opacity-60 transition-colors"
            >
              <span>
                <span className="block text-sm font-bold">{p.credits} runs</span>
                <span className="block text-[11px] text-gray-500">₹{(p.amount / p.credits).toFixed(0)} per run</span>
              </span>
              <span className="text-sm font-bold text-emerald-700 whitespace-nowrap">
                {buying === p.plan ? <Loader2 size={16} className="animate-spin" /> : `₹${p.amount}`}
              </span>
            </button>
          ))}
        </div>
      )}
      {message && (
        <p className={`text-sm flex items-center gap-1.5 ${message.type === 'ok' ? 'text-white' : 'text-red-100'}`}>
          {message.type === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}{message.text}
        </p>
      )}
    </section>
  );
}

// ── Runs ─────────────────────────────────────────────────────────────────────

const PR_STYLE: Record<NonNullable<RankRun['prState']>, string> = {
  open:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  merged: 'bg-purple-50 text-purple-700 border-purple-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

function PullRequestPanel({ run, onUpdated }: { run: RankRun; onUpdated: (r: RankRun) => void }) {
  const [busy, setBusy] = useState<'check' | 'merge' | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [mergeable, setMergeable] = useState<boolean | undefined>(run.prMergeable);

  const check = async () => {
    setBusy('check'); setMessage(null);
    try {
      const json = await readJSON<RankRun>(await apiFetch(API_ENDPOINTS.seo.rankRunPR(run.id)));
      if (!json.success || !json.data) throw new Error(json.error || 'Could not check the pull request');
      onUpdated(json.data);
      setMergeable(json.data.prMergeable);
      const state = json.data.prState;
      setMessage({
        type: 'ok',
        text: state === 'merged' ? 'Merged.' : state === 'closed' ? 'This pull request was closed without merging.'
          : json.data.prMergeable ? 'Open and ready to merge.' : 'Open, but GitHub reports it can\'t be merged yet (checks running, conflicts or branch protection).',
      });
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Could not check the pull request' });
    }
    setBusy(null);
  };

  const merge = async () => {
    if (!window.confirm(`Merge pull request #${run.prNumber} into ${run.baseBranch}? The changes will go live on your next deploy.`)) return;
    setBusy('merge'); setMessage(null);
    try {
      const json = await readJSON<RankRun>(await apiFetch(API_ENDPOINTS.seo.rankRunMerge(run.id), { method: 'POST' }));
      if (!json.success || !json.data) throw new Error(json.error || 'Merge failed');
      onUpdated(json.data);
      setMessage({ type: 'ok', text: `Merged into ${run.baseBranch}. Live links below work once your site redeploys.` });
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Merge failed' });
    }
    setBusy(null);
  };

  if (!run.prNumber) {
    // PR couldn't be opened automatically (e.g. missing permission): link to GitHub's compare page.
    return run.prUrl ? (
      <a href={run.prUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold hover:underline">
        <GitPullRequest size={14} />{run.prState === 'merged' ? 'View the commit on GitHub' : 'Open the pull request on GitHub'}<ExternalLink size={12} />
      </a>
    ) : null;
  }

  const state = run.prState ?? 'open';
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GitPullRequest size={16} className="text-gray-500 flex-shrink-0" />
          <span className="font-semibold text-gray-800">Pull request #{run.prNumber}</span>
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${PR_STYLE[state]}`}>{state}</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={run.prUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50">
            <ExternalLink size={12} />View on GitHub
          </a>
          <button onClick={check} disabled={busy !== null}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {busy === 'check' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}Check PR
          </button>
          {state === 'open' && (
            <button onClick={merge} disabled={busy !== null || mergeable === false}
              title={mergeable === false ? 'GitHub reports this PR can\'t be merged yet' : undefined}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400">
              {busy === 'merge' ? <Loader2 size={12} className="animate-spin" /> : <GitMerge size={12} />}Merge
            </button>
          )}
        </div>
      </div>
      {run.runBranch && (
        <p className="text-[11px] text-gray-500 font-mono truncate">{run.runBranch} → {run.baseBranch}</p>
      )}
      {state === 'merged' && run.mergedAt && (
        <p className="text-[11px] text-gray-500">Merged {new Date(run.mergedAt).toLocaleString()}</p>
      )}
      <Notice message={message} />
    </div>
  );
}

function RunCard({ run }: { run: RankRun }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<RankRun | null>(null);
  const [showLog, setShowLog] = useState(false);
  const active = ACTIVE.includes(run.status);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !active) {
      try {
        const json = await readJSON<RankRun>(await apiFetch(API_ENDPOINTS.seo.rankRunDetail(run.id)));
        if (json.success && json.data) setDetail(json.data);
      } catch { /* keep summary view */ }
    }
  };
  // PR check/merge responses omit the log; keep the one already loaded.
  const applyUpdate = (u: RankRun) => setDetail(prev => ({ ...u, log: u.log ?? prev?.log }));
  const r = detail ?? run;
  const merged = r.prState === 'merged';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button onClick={toggle} className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-gray-50">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${STATUS_STYLE[r.status]}`}>
              {active && <Loader2 size={10} className="animate-spin" />}{r.status}
            </span>
            <span className="text-sm font-semibold text-gray-800 truncate">“{r.keyword}”</span>
            {r.prNumber ? (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${PR_STYLE[r.prState ?? 'open']}`}>
                PR #{r.prNumber} · {r.prState ?? 'open'}
              </span>
            ) : null}
            {r.trigger === 'schedule' && <span className="text-[10px] text-gray-400">daily</span>}
          </div>
          <p className="text-xs text-gray-500 truncate">
            {active ? r.stage : r.status === 'failed' ? r.error : r.summary}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-gray-400 whitespace-nowrap">{new Date(r.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 bg-gray-50 p-3 space-y-3 text-sm">
          {r.status === 'failed' && (
            <p className="text-red-600 flex items-start gap-1.5"><AlertCircle size={14} className="mt-0.5 flex-shrink-0" />{r.error}</p>
          )}
          {r.summary && <p className="text-gray-700">{r.summary}</p>}
          {(r.prNumber || r.prUrl) && <PullRequestPanel run={r} onUpdated={applyUpdate} />}
          {!!r.improvements?.length && (
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1"><ListChecks size={12} />Changes</p>
              <ul className="list-disc pl-5 space-y-0.5 text-gray-700">{r.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
          {!!r.nextSteps?.length && (
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1"><Lightbulb size={12} />Your next steps</p>
              <ul className="list-disc pl-5 space-y-0.5 text-gray-700">{r.nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
          {!!r.files?.length && (
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1"><FileCode size={12} />Files ({r.files.length})</p>
              <ul className="space-y-1 text-xs">
                {r.files.map(f => (
                  <li key={f.path} className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-gray-700">{f.path}</span>
                    <span className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono"><span className="text-emerald-600">+{f.additions}</span> <span className="text-red-500">−{f.deletions}</span></span>
                      {f.sourceUrl && (
                        <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-gray-500 hover:text-gray-800" title="View source on GitHub">
                          <Github size={12} />Source
                        </a>
                      )}
                      {f.liveUrl ? (
                        <a href={f.liveUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-emerald-700 hover:underline" title={f.liveUrl}>
                          <Globe size={12} />Live
                        </a>
                      ) : !merged && r.prNumber ? (
                        <span className="text-gray-300" title="Live link appears after the pull request is merged">Live</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!r.reverted?.length && (
            <p className="text-xs text-gray-500 flex items-start gap-1.5">
              <ShieldCheck size={13} className="mt-0.5 flex-shrink-0 text-emerald-600" />
              Safety rules undid changes to: {r.reverted.join(', ')}
            </p>
          )}
          {r.creditRefunded && <p className="text-xs text-gray-500">The credit for this run was refunded.</p>}
          {r.log && (
            <div>
              <button onClick={() => setShowLog(v => !v)} className="text-xs font-semibold text-gray-500 hover:text-gray-700">
                {showLog ? 'Hide' : 'Show'} agent log
              </button>
              {showLog && (
                <pre className="mt-1 max-h-80 overflow-auto bg-slate-900 text-slate-200 text-[11px] leading-relaxed rounded-lg p-3 whitespace-pre-wrap break-words">{r.log}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main tab ─────────────────────────────────────────────────────────────────

export function SEORankToTopTab({ isPaid }: { isPaid: boolean }) {
  const [cfg, setCfg] = useState<RankConfig | null>(null);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<RankCredits | null>(null);
  const [repos, setRepos] = useState<SEOBlogRepo[]>([]);
  const [runs, setRuns] = useState<RankRun[]>([]);

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [suggestions, setSuggestions] = useState<RankKeyword[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [runKeyword, setRunKeyword] = useState('');

  const [repoMsg, setRepoMsg] = useState<Message>(null);
  const [kwMsg, setKwMsg] = useState<Message>(null);
  const [runMsg, setRunMsg] = useState<Message>(null);

  const loadCredits = useCallback(async () => {
    try {
      const json = await readJSON<RankCredits>(await apiFetch(API_ENDPOINTS.seo.rankCredits));
      if (json.success && json.data) {
        setCredits(json.data);
        setCfg(prev => (prev ? { ...prev, credits: json.data!.credits } : prev));
      }
    } catch { /* ignore */ }
  }, []);

  const loadRuns = useCallback(async () => {
    try {
      const json = await readJSON<RankRun[]>(await apiFetch(API_ENDPOINTS.seo.rankRuns));
      if (json.success) setRuns(json.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!isPaid) return;
    (async () => {
      try {
        const json = await readJSON<RankConfig>(await apiFetch(API_ENDPOINTS.seo.rankConfig));
        if (json.success && json.data) {
          setCfg(json.data);
          if (json.data.githubConnected) {
            const rj = await readJSON<SEOBlogRepo[]>(await apiFetch(API_ENDPOINTS.seoBlog.repos));
            if (rj.success) setRepos(rj.data || []);
          }
        }
      } catch { /* shown as load error below */ }
      setLoading(false);
    })();
    loadCredits();
    loadRuns();
  }, [isPaid, loadCredits, loadRuns]);

  // Poll while a run is active; refresh credits when it finishes (refunds).
  const hasActive = runs.some(r => ACTIVE.includes(r.status));
  const wasActive = useRef(false);
  useEffect(() => {
    if (!hasActive) {
      if (wasActive.current) loadCredits();
      wasActive.current = false;
      return;
    }
    wasActive.current = true;
    const t = setInterval(loadRuns, 5000);
    return () => clearInterval(t);
  }, [hasActive, loadRuns, loadCredits]);

  const update = (patch: Partial<RankConfig>) => {
    setCfg(prev => (prev ? { ...prev, ...patch } : prev));
    setDirty(true);
  };

  const save = async (next: RankConfig, onDone?: (m: Message) => void): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.seo.rankConfig, {
        method: 'PUT',
        body: JSON.stringify({
          repoOwner: next.repoOwner, repoName: next.repoName, branch: next.branch, deliveryMode: next.deliveryMode,
          siteUrl: next.siteUrl, businessBrief: next.businessBrief, nicheSummary: next.nicheSummary,
          keywords: next.keywords, enabled: next.enabled, runHourUtc: next.runHourUtc,
        }),
      });
      const json = await readJSON<RankConfig>(res);
      if (!json.success || !json.data) throw new Error(json.error || 'Failed to save');
      setCfg(json.data);
      setDirty(false);
      onDone?.({ type: 'ok', text: 'Saved.' });
      return true;
    } catch (e: unknown) {
      onDone?.({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const connectGitHub = async () => {
    setConnecting(true);
    try {
      const res = await apiFetch(`${API_ENDPOINTS.seoBlog.installUrl}?origin=${encodeURIComponent(window.location.origin)}`);
      const json = await readJSON<{ url: string }>(res);
      if (!json.success || !json.data?.url) throw new Error(json.error || 'Failed to get install URL');
      try { sessionStorage.setItem('seo_github_return_tab', 'rank'); } catch { /* ignore */ }
      window.location.href = json.data.url;
    } catch (e: unknown) {
      setRepoMsg({ type: 'error', text: e instanceof Error ? e.message : 'Failed to connect GitHub' });
      setConnecting(false);
    }
  };

  const sync = async () => {
    if (!cfg) return;
    setRepoMsg(null);
    if (dirty && !(await save(cfg, setRepoMsg))) return;
    setSyncing(true);
    try {
      const json = await readJSON<RankConfig>(await apiFetch(API_ENDPOINTS.seo.rankSync, { method: 'POST' }));
      if (!json.success || !json.data) throw new Error(json.error || 'Sync failed');
      setCfg(json.data);
      setRepoMsg({ type: 'ok', text: `Workspace ready — ${formatBytes(json.data.workspaceBytes)} used.` });
    } catch (e: unknown) {
      setRepoMsg({ type: 'error', text: e instanceof Error ? e.message : 'Sync failed' });
    }
    setSyncing(false);
  };

  const askAI = async () => {
    if (!cfg) return;
    setThinking(true);
    setKwMsg(null);
    setSuggestions([]);
    try {
      const res = await apiFetch(API_ENDPOINTS.seo.rankStrategy, {
        method: 'POST',
        body: JSON.stringify({ businessBrief: cfg.businessBrief, siteUrl: cfg.siteUrl }),
      });
      const json = await readJSON<{ nicheSummary: string; keywords: RankKeyword[] }>(res);
      if (!json.success || !json.data) throw new Error(json.error || 'AI could not pick keywords');
      const existing = new Set(cfg.keywords.map(k => k.keyword));
      setSuggestions(json.data.keywords.filter(k => !existing.has(k.keyword)));
      update({ nicheSummary: json.data.nicheSummary });
    } catch (e: unknown) {
      setKwMsg({ type: 'error', text: e instanceof Error ? e.message : 'AI could not pick keywords' });
    }
    setThinking(false);
  };

  const addKeywords = (list: RankKeyword[]) => {
    if (!cfg) return;
    const existing = new Set(cfg.keywords.map(k => k.keyword));
    const fresh = list.filter(k => !existing.has(k.keyword));
    const room = MAX_KEYWORDS - cfg.keywords.length;
    if (fresh.length > room) setKwMsg({ type: 'error', text: `You can target up to ${MAX_KEYWORDS} keywords.` });
    update({ keywords: [...cfg.keywords, ...fresh.slice(0, Math.max(0, room))] });
    setSuggestions(prev => prev.filter(s => !fresh.slice(0, Math.max(0, room)).some(f => f.keyword === s.keyword)));
  };

  const addManual = () => {
    const kw = keywordInput.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!kw) return;
    addKeywords([{ keyword: kw, source: 'manual', enabled: true, runs: 0 }]);
    setKeywordInput('');
  };

  const runNow = async () => {
    if (!cfg) return;
    setRunMsg(null);
    if (dirty && !(await save(cfg, setRunMsg))) return;
    setStarting(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.seo.rankRun, { method: 'POST', body: JSON.stringify({ keyword: runKeyword }) });
      const json = await readJSON<RankRun>(res);
      if (!json.success || !json.data) throw new Error(json.error || 'Failed to start run');
      setRuns(prev => [json.data!, ...prev]);
      setRunMsg({ type: 'ok', text: `Run started for “${json.data.keyword}”. It usually takes 10–30 minutes; you'll get an email when it's done.` });
      loadCredits();
    } catch (e: unknown) {
      setRunMsg({ type: 'error', text: e instanceof Error ? e.message : 'Failed to start run' });
    }
    setStarting(false);
  };

  if (!isPaid) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center"><Rocket size={26} className="text-amber-600" /></div>
        <h2 className="text-xl font-bold text-gray-800">Rank to Top</h2>
        <p className="text-gray-500 max-w-sm text-sm">Upgrade to SEO Bot to let an AI SEO engineer improve your website's code every day.</p>
      </div>
    );
  }
  if (loading) {
    return <div className="py-20"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>;
  }
  if (!cfg) {
    return <p className="text-center text-sm text-gray-500 py-20">Could not load Rank to Top settings. Please refresh.</p>;
  }

  const repoValue = cfg.repoOwner && cfg.repoName ? `${cfg.repoOwner}/${cfg.repoName}` : '';
  const usedPct = Math.min(100, (cfg.workspaceBytes / cfg.workspaceLimit) * 100);
  const enabledKeywords = cfg.keywords.filter(k => k.enabled);

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <CreditsBar credits={credits} onPurchased={loadCredits} />

      {/* 1. Repository */}
      <Card step={1} icon={<Github size={16} />} title="Connect your website repository"
        subtitle="The bot works on a private copy of your code (up to 500 MB) and sends changes as a pull request.">
        {!cfg.githubConnected ? (
          <button onClick={connectGitHub} disabled={connecting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60">
            {connecting ? <Loader2 size={15} className="animate-spin" /> : <Github size={15} />}Connect GitHub
          </button>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Repository</span>
                <select value={repoValue}
                  onChange={e => { const [o, n] = e.target.value.split('/'); update({ repoOwner: o || '', repoName: n || '' }); }}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Select a repository…</option>
                  {repoValue && !repos.some(r => r.fullName === repoValue) && <option value={repoValue}>{repoValue}</option>}
                  {repos.map(r => <option key={r.fullName} value={r.fullName}>{r.fullName}{r.private ? ' (private)' : ''}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Branch</span>
                <input value={cfg.branch} onChange={e => update({ branch: e.target.value })} placeholder="main"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">Live website URL</span>
                <input value={cfg.siteUrl} onChange={e => update({ siteUrl: e.target.value })} placeholder="https://example.com"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-gray-500">How to deliver changes</span>
                <select value={cfg.deliveryMode} onChange={e => update({ deliveryMode: e.target.value as RankConfig['deliveryMode'] })}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="pull_request">Pull request for me to review (recommended)</option>
                  <option value="direct">Push directly to the branch</option>
                </select>
              </label>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1"><HardDrive size={12} />Workspace storage</span>
                <span>{formatBytes(cfg.workspaceBytes)} / {formatBytes(cfg.workspaceLimit)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${usedPct > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${usedPct}%` }} />
              </div>
              <p className="text-[11px] text-gray-400">
                {cfg.workspaceSyncedAt
                  ? `Synced ${new Date(cfg.workspaceSyncedAt).toLocaleString()}${cfg.workspaceCommit ? ` at ${cfg.workspaceCommit}` : ''}`
                  : 'Not synced yet — sync to check your repository fits.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => save(cfg, setRepoMsg)} disabled={saving || !dirty}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400">
                <Save size={14} />{saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={sync} disabled={syncing || !repoValue || hasActive}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />{syncing ? 'Syncing…' : 'Sync workspace'}
              </button>
            </div>
          </>
        )}
        <Notice message={repoMsg} />
      </Card>

      {/* 2. Keywords */}
      <Card step={2} icon={<Sparkles size={16} />} title="Choose what to rank for"
        subtitle="Describe your business and let AI pick keywords from real searches, or add your own. Each run focuses on one keyword, rotating through the list.">
        <div className="space-y-2">
          <textarea value={cfg.businessBrief} onChange={e => update({ businessBrief: e.target.value })} rows={3} maxLength={2000}
            placeholder="e.g. We're a family-run plumbing company in Austin, TX offering emergency repairs, water heater installation and drain cleaning for homes and small businesses."
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={askAI} disabled={thinking || cfg.businessBrief.trim().length < 20}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400">
              {thinking ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}{thinking ? 'Researching keywords…' : 'Let AI choose keywords'}
            </button>
            {cfg.nicheSummary && <p className="text-xs text-gray-500 flex-1 min-w-0"><span className="font-semibold">Niche:</span> {cfg.nicheSummary}</p>}
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-indigo-700">AI suggestions</p>
              <button onClick={() => addKeywords(suggestions)} className="text-xs font-semibold text-indigo-700 hover:underline">Add all</button>
            </div>
            {suggestions.map(s => (
              <div key={s.keyword} className="flex items-start justify-between gap-2 bg-white rounded-lg border border-indigo-100 p-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{s.keyword}</p>
                  {s.reason && <p className="text-xs text-gray-500">{s.reason}</p>}
                </div>
                <button onClick={() => addKeywords([s])} className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700">
                  <Plus size={11} />Add
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Target keywords ({cfg.keywords.length}/{MAX_KEYWORDS})</p>
          {cfg.keywords.length === 0 ? (
            <p className="text-xs text-gray-400 italic mb-2">No keywords yet.</p>
          ) : (
            <div className="space-y-1.5 mb-2">
              {cfg.keywords.map(k => (
                <div key={k.keyword} className={`flex items-center justify-between gap-2 border rounded-lg px-3 py-2 ${k.enabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {k.keyword}
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-semibold ${k.source === 'ai' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>{k.source === 'ai' ? 'AI' : 'manual'}</span>
                    </p>
                    {k.reason && <p className="text-[11px] text-gray-400 truncate">{k.reason}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {k.runs > 0 && <span className="text-[11px] text-gray-400">{k.runs} run{k.runs === 1 ? '' : 's'}</span>}
                    <button onClick={() => update({ keywords: cfg.keywords.map(x => x.keyword === k.keyword ? { ...x, enabled: !x.enabled } : x) })}
                      title={k.enabled ? 'Pause this keyword' : 'Resume this keyword'}>
                      {k.enabled ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} className="text-gray-400" />}
                    </button>
                    <button onClick={() => update({ keywords: cfg.keywords.filter(x => x.keyword !== k.keyword) })} className="text-gray-400 hover:text-red-500" aria-label={`Remove ${k.keyword}`}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {cfg.keywords.length < MAX_KEYWORDS && (
            <div className="flex gap-2">
              <input value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addManual()}
                placeholder="Add a keyword manually…" maxLength={80}
                className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <button onClick={addManual} disabled={!keywordInput.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50">
                <Plus size={12} />Add
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => save(cfg, setKwMsg)} disabled={saving || !dirty}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400">
            <Save size={14} />{saving ? 'Saving…' : 'Save keywords'}
          </button>
          <Notice message={kwMsg} />
        </div>
      </Card>

      {/* 3. Run */}
      <Card step={3} icon={<Play size={16} />} title="Run the bot"
        subtitle="Each run audits your code for one keyword, applies the fixes and opens a pull request. Failed runs are refunded.">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-gray-200 rounded-xl p-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">Run automatically every day</p>
            <p className="text-xs text-gray-500">Uses 1 credit per day. Skipped (with an email) when you're out of credits.</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={cfg.runHourUtc} onChange={e => update({ runHourUtc: Number(e.target.value) })}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {UTC_HOUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => { const next = { ...cfg, enabled: !cfg.enabled }; setCfg(next); save(next, setRunMsg); }}
              disabled={saving || (!cfg.enabled && (!repoValue || enabledKeywords.length === 0))}
              title={!repoValue || enabledKeywords.length === 0 ? 'Connect a repository and add a keyword first' : undefined}
              className="disabled:opacity-50">
              {cfg.enabled ? <ToggleRight size={30} className="text-emerald-500" /> : <ToggleLeft size={30} className="text-gray-400" />}
            </button>
          </div>
        </div>
        {cfg.enabled && <p className="text-xs text-emerald-700 flex items-center gap-1"><Clock size={12} />Daily run at {localTimeLabel(cfg.runHourUtc)} (your time).</p>}
        {cfg.lastError && <p className="text-xs text-amber-700 flex items-center gap-1"><AlertCircle size={12} />{cfg.lastError}</p>}

        <div className="flex flex-col sm:flex-row gap-2">
          <select value={runKeyword} onChange={e => setRunKeyword(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Next keyword in rotation</option>
            {enabledKeywords.map(k => <option key={k.keyword} value={k.keyword}>{k.keyword}</option>)}
          </select>
          <button onClick={runNow} disabled={starting || hasActive || !repoValue || enabledKeywords.length === 0 || cfg.credits < 1}
            className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400">
            {starting ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}Run now · 1 credit
          </button>
        </div>
        {cfg.credits < 1 && <p className="text-xs text-amber-700">You have no credits — buy a pack above to run the bot.</p>}
        {hasActive && <p className="text-xs text-gray-500">A run is in progress. You can close this page; we'll email you when it's done.</p>}
        <Notice message={runMsg} />
      </Card>

      {/* History */}
      <section className="space-y-2">
        <h2 className="text-sm font-bold text-gray-700 px-1">Run history</h2>
        {runs.length === 0
          ? <p className="text-sm text-gray-400 text-center py-8 bg-white border border-dashed border-gray-200 rounded-xl">No runs yet.</p>
          : runs.map(r => <RunCard key={`${r.id}-${r.status}`} run={r} />)}
      </section>
    </div>
  );
}
