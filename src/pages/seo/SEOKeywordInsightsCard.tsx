import { useState, useEffect } from 'react';
import { Mail, Plus, X, Send, Save, AlertCircle, CheckCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import type { SEOKeywordInsightSubscription } from '@/types/seo';
import { localTimeLabel, UTC_HOUR_OPTIONS } from './utcHourOptions';

const MAX_SEEDS = 5;

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token') || '';
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export function SEOKeywordInsightsCard({
  currentSeed,
  geoOptions,
}: {
  currentSeed: string;
  geoOptions: { value: string; label: string }[];
}) {
  const [sub, setSub] = useState<SEOKeywordInsightSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [seedInput, setSeedInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API_ENDPOINTS.seo.keywordInsights, { headers: authHeaders() });
        const json = await res.json();
        if (json.success) setSub(json.data);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const update = (patch: Partial<SEOKeywordInsightSubscription>) => {
    setSub(prev => (prev ? { ...prev, ...patch } : prev));
    setDirty(true);
    setMessage(null);
  };

  const addSeed = (raw: string) => {
    if (!sub) return;
    const seed = raw.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!seed || sub.seeds.includes(seed) || sub.seeds.length >= MAX_SEEDS) return;
    update({ seeds: [...sub.seeds, seed] });
    setSeedInput('');
  };

  const save = async (next: SEOKeywordInsightSubscription) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(API_ENDPOINTS.seo.keywordInsights, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ enabled: next.enabled, seeds: next.seeds, geo: next.geo, sendHourUtc: next.sendHourUtc }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to save');
      setSub(json.data);
      setDirty(false);
      setMessage({ type: 'ok', text: next.enabled ? `Subscribed — insights will arrive daily at ${localTimeLabel(next.sendHourUtc)}.` : 'Daily insights paused.' });
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to save' });
    }
    setSaving(false);
  };

  const sendNow = async () => {
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch(API_ENDPOINTS.seo.keywordInsightsSend, { method: 'POST', headers: authHeaders() });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to send');
      setSub(prev => (prev ? { ...prev, lastSentAt: new Date().toISOString(), lastError: '' } : prev));
      setMessage({ type: 'ok', text: `Digest sent to ${sub?.email}. Check your inbox.` });
    } catch (e: unknown) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to send' });
    }
    setSending(false);
  };

  if (loading || !sub) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        {loading
          ? <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          : <p className="text-sm text-gray-400 text-center">Could not load daily insight settings.</p>}
      </div>
    );
  }

  const canAddCurrent = currentSeed.trim() && !sub.seeds.includes(currentSeed.trim().toLowerCase()) && sub.seeds.length < MAX_SEEDS;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Mail size={18} className="text-emerald-500 mt-0.5" />
          <div>
            <h2 className="text-base font-bold text-gray-800">Daily Keyword Insights</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Get new searches, easy-win keywords and questions people ask, emailed to <span className="font-semibold text-gray-700">{sub.email || 'your account email'}</span> every day.
            </p>
          </div>
        </div>
        <button
          onClick={() => save({ ...sub, enabled: !sub.enabled })}
          disabled={saving || (!sub.enabled && sub.seeds.length === 0)}
          title={!sub.enabled && sub.seeds.length === 0 ? 'Add a keyword first' : undefined}
          className="flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold disabled:opacity-50"
        >
          {sub.enabled
            ? <><ToggleRight size={28} className="text-emerald-500" /><span className="text-emerald-600">On</span></>
            : <><ToggleLeft size={28} className="text-gray-400" /><span className="text-gray-500">Off</span></>}
        </button>
      </div>

      {/* Seeds */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">Keywords to follow ({sub.seeds.length}/{MAX_SEEDS})</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {sub.seeds.map(seed => (
            <span key={seed} className="flex items-center gap-1 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-full">
              {seed}
              <button onClick={() => update({ seeds: sub.seeds.filter(s => s !== seed) })} className="hover:text-red-500" aria-label={`Remove ${seed}`}>
                <X size={11} />
              </button>
            </span>
          ))}
          {sub.seeds.length === 0 && <span className="text-xs text-gray-400 italic">No keywords yet</span>}
        </div>
        {sub.seeds.length < MAX_SEEDS && (
          <div className="flex gap-2">
            <input
              value={seedInput}
              onChange={e => setSeedInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSeed(seedInput)}
              placeholder="Add a keyword to follow…"
              maxLength={80}
              className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => addSeed(seedInput)}
              disabled={!seedInput.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              <Plus size={12} />Add
            </button>
            {canAddCurrent && (
              <button
                onClick={() => addSeed(currentSeed)}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 whitespace-nowrap"
              >
                <Plus size={12} />Add “{currentSeed.trim()}”
              </button>
            )}
          </div>
        )}
      </div>

      {/* Market + time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs font-semibold text-gray-500">Market</span>
          <select
            value={sub.geo}
            onChange={e => update({ geo: e.target.value })}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {geoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-500">Delivery time (your local time)</span>
          <select
            value={sub.sendHourUtc}
            onChange={e => update({ sendHourUtc: Number(e.target.value) })}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {UTC_HOUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => save(sub)}
          disabled={saving || !dirty}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400"
        >
          <Save size={14} />{saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={sendNow}
          disabled={sending || dirty || sub.seeds.length === 0}
          title={dirty ? 'Save your changes first' : undefined}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Send size={14} />{sending ? 'Sending…' : 'Send me one now'}
        </button>
        {sub.lastSentAt && (
          <span className="text-xs text-gray-400">Last sent {new Date(sub.lastSentAt).toLocaleString()}</span>
        )}
      </div>

      {message && (
        <p className={`text-sm flex items-center gap-1.5 ${message.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
          {message.type === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}{message.text}
        </p>
      )}
      {!message && sub.lastError && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <AlertCircle size={13} />Last delivery failed: {sub.lastError}
        </p>
      )}
    </div>
  );
}
