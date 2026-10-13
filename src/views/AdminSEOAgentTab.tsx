import { useState, useEffect } from 'react';
import { Rocket, CheckCircle, AlertCircle, Loader2, Save, RefreshCw } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

interface AgentSettings {
  engine: 'agy' | 'claude' | 'opencode';
  model: string;
  phaseTimeoutMin: number;
  updatedAt?: string;
}

interface EngineStatus {
  id: AgentSettings['engine'];
  name: string;
  installed: boolean;
  version?: string;
  signedIn?: boolean;
  modelHint: string;
  description: string;
}

/* ─── SEO Agent Tab: choose which coding-agent CLI Rank to Top runs ─── */
export function AdminSEOAgentTab() {
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [engines, setEngines] = useState<EngineStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.seoAgent);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load');
      setSettings(json.data.settings);
      setEngines(json.data.engines || []);
      setDirty(false);
    } catch (e: unknown) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Failed to load' });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (patch: Partial<AgentSettings>) => {
    setSettings(prev => (prev ? { ...prev, ...patch } : prev));
    setDirty(true);
    setMessage(null);
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true); setMessage(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.seoAgent, {
        method: 'PUT',
        body: JSON.stringify({ engine: settings.engine, model: settings.model.trim(), phaseTimeoutMin: Number(settings.phaseTimeoutMin) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to save');
      setSettings(json.data.settings);
      setEngines(json.data.engines || []);
      setDirty(false);
      const name = (json.data.engines as EngineStatus[]).find(e => e.id === json.data.settings.engine)?.name;
      setMessage({ ok: true, text: `Saved. New Rank to Top runs will use ${name}.` });
    } catch (e: unknown) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Failed to save' });
    }
    setSaving(false);
  };

  if (loading && !settings) {
    return <div className="py-16 flex justify-center"><Loader2 size={22} className="animate-spin text-gray-400" /></div>;
  }
  if (!settings) {
    return <p className="text-sm text-red-600">{message?.text || 'Could not load SEO agent settings.'}</p>;
  }

  const selected = engines.find(e => e.id === settings.engine);

  return (
    <div className="max-w-3xl space-y-5">
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Rocket size={18} /></div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Rank to Top — SEO Agent Engine</h2>
              <p className="text-xs text-gray-500 mt-0.5">Which coding-agent CLI edits users' repositories. Applies to runs that start after you save.</p>
            </div>
          </div>
          <button onClick={load} disabled={loading} title="Refresh engine status"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="space-y-2">
          {engines.map(e => {
            const active = settings.engine === e.id;
            return (
              <label key={e.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  active ? 'border-emerald-400 bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300'
                } ${!e.installed ? 'opacity-60 cursor-not-allowed' : ''}`}>
                <input type="radio" name="engine" className="mt-1" checked={active} disabled={!e.installed}
                  onChange={() => update({ engine: e.id, model: e.id === settings.engine ? settings.model : '' })} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{e.name}</span>
                    {e.installed
                      ? <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{e.version || 'installed'}</span>
                      : <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-600">not installed</span>}
                    {e.installed && e.signedIn === true && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">signed in</span>}
                    {e.installed && e.signedIn === false && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">not signed in</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{e.description}</p>
                </div>
              </label>
            );
          })}
        </div>

        {selected?.installed && selected.signedIn === false && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-1.5">
            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
            {selected.name} isn't signed in on the server, so runs will fail (and refund) until someone logs it in on the server.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-gray-600">Model (optional)</span>
            <input value={settings.model} onChange={e => update({ model: e.target.value })} maxLength={100}
              placeholder={selected?.modelHint || 'Engine default'}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            <span className="text-[11px] text-gray-400">{selected?.modelHint}</span>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-600">Time limit per phase (min)</span>
            <input type="number" min={1} max={60} value={settings.phaseTimeoutMin}
              onChange={e => update({ phaseTimeoutMin: Number(e.target.value) })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            <span className="text-[11px] text-gray-400">Each run has 2 phases (audit + optimise).</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving || !dirty}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{saving ? 'Saving…' : 'Save'}
          </button>
          {settings.updatedAt && !dirty && (
            <span className="text-xs text-gray-400">Last changed {new Date(settings.updatedAt).toLocaleString()}</span>
          )}
        </div>
        {message && (
          <p className={`text-sm flex items-center gap-1.5 ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}>
            {message.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}{message.text}
          </p>
        )}
      </div>
    </div>
  );
}
