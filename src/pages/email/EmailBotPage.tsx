import { useState, useEffect } from 'react';
import { Bot, Loader2, CheckCircle2, AlertCircle, Copy, Power, PowerOff } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

interface EmailBotConfig {
  businessName: string; description: string; website: string; services: string[];
  isEnabled: boolean; customSystemPrompt: string;
  imapHost: string; imapPort: number; imapUsername: string; imapPassword: string;
  pollIntervalMin: number;
}

const EMPTY: EmailBotConfig = { businessName: '', description: '', website: '', services: [], isEnabled: false, customSystemPrompt: '', imapHost: '', imapPort: 993, imapUsername: '', imapPassword: '', pollIntervalMin: 2 };

export function EmailBotPage({ isPaid }: { isPaid: boolean }) {
  const [form, setForm] = useState<EmailBotConfig>(EMPTY);
  const [servicesInput, setServicesInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { if (isPaid) load(); }, [isPaid]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.bot);
      const d = await r.json();
      if (d.success && d.data) {
        setForm({ ...EMPTY, ...d.data, imapPassword: '' });
        setServicesInput((d.data.services || []).join(', '));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const save = async () => {
    setSaving(true); setMsg(null);
    const payload = { ...form, services: servicesInput.split(',').map((s: string) => s.trim()).filter(Boolean) };
    try {
      const r = await apiFetch(API_ENDPOINTS.email.bot, { method: 'POST', body: JSON.stringify(payload) });
      const d = await r.json();
      if (d.success) { setMsg({ text: 'Bot settings saved!', type: 'success' }); if (d.data) setForm(f => ({ ...f, ...d.data, imapPassword: '' })); }
      else setMsg({ text: d.error || 'Save failed', type: 'error' });
    } catch { setMsg({ text: 'Network error', type: 'error' }); }
    setSaving(false);
  };

  const copyFromWA = async () => {
    setCopying(true); setMsg(null);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.copyBot, { method: 'POST' });
      const d = await r.json();
      if (d.success && d.data) { setForm(f => ({ ...f, ...d.data, imapPassword: '' })); setServicesInput((d.data.services || []).join(', ')); setMsg({ text: 'WhatsApp bot config copied! Add your IMAP settings and enable.', type: 'success' }); }
      else setMsg({ text: d.error, type: 'error' });
    } catch { setMsg({ text: 'Network error', type: 'error' }); }
    setCopying(false);
  };

  if (!isPaid) return <div className="text-center py-16"><Bot size={40} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">Available on paid plans</p></div>;
  if (loading) return <div className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Email Autoreply Bot</h2>
          <p className="text-sm text-gray-500 mt-1">AI-powered auto-replies via IMAP polling every 2-3 minutes</p>
        </div>
        <button onClick={copyFromWA} disabled={copying}
          className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-lg text-sm font-semibold transition-colors">
          {copying ? <Loader2 size={15} className="animate-spin" /> : <Copy size={15} />}
          Copy from WhatsApp Bot
        </button>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {msg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {msg.text}
        </div>
      )}

      {/* Enable toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <label className="flex items-center justify-between cursor-pointer select-none">
          <div className="flex items-center gap-3">
            {form.isEnabled ? <Power size={20} className="text-green-600" /> : <PowerOff size={20} className="text-gray-400" />}
            <div>
              <p className="font-semibold text-gray-900">{form.isEnabled ? 'Bot is Active' : 'Bot is Disabled'}</p>
              <p className="text-xs text-gray-500">Polls inbox every {form.pollIntervalMin || 2} min for new emails</p>
            </div>
          </div>
          <div onClick={() => setForm(f => ({ ...f, isEnabled: !f.isEnabled }))}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isEnabled ? 'translate-x-6' : ''}`} />
          </div>
        </label>
      </div>

      {/* Bot Identity */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-semibold text-gray-800">Business Identity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Business Name *</label>
            <input value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Website (optional)</label>
            <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Business Description *</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Services / Products (comma-separated)</label>
          <input value={servicesInput} onChange={e => setServicesInput(e.target.value)} placeholder="Web Design, SEO, Support"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Custom System Prompt (overrides auto-generated prompt)</label>
          <textarea value={form.customSystemPrompt} onChange={e => setForm(f => ({ ...f, customSystemPrompt: e.target.value }))} rows={4}
            placeholder="You are a helpful email assistant for…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
        </div>
      </div>

      {/* IMAP Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-800">IMAP Settings</h3>
          <p className="text-xs text-gray-500 mt-1">Used to poll your inbox for incoming emails that need auto-replies</p>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          💡 For Gmail, use <strong>imap.gmail.com:993</strong> and your App Password. Make sure IMAP is enabled in Gmail settings.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">IMAP Host</label>
            <input value={form.imapHost} onChange={e => setForm(f => ({ ...f, imapHost: e.target.value }))} placeholder="imap.gmail.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">IMAP Port</label>
            <input type="number" value={form.imapPort} onChange={e => setForm(f => ({ ...f, imapPort: +e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">IMAP Username / Email</label>
            <input value={form.imapUsername} onChange={e => setForm(f => ({ ...f, imapUsername: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">IMAP Password / App Password</label>
            <input type="password" value={form.imapPassword} onChange={e => setForm(f => ({ ...f, imapPassword: e.target.value }))}
              placeholder="Leave blank to keep existing"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Poll Interval (minutes)</label>
            <input type="number" min={1} max={60} value={form.pollIntervalMin} onChange={e => setForm(f => ({ ...f, pollIntervalMin: +e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors">
        {saving ? <Loader2 size={15} className="animate-spin" /> : null}
        {saving ? 'Saving…' : 'Save Bot Settings'}
      </button>
    </div>
  );
}
