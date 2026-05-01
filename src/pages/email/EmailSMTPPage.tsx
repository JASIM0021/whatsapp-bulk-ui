import { useState, useEffect } from 'react';
import { Settings2, Wifi, WifiOff, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

interface SMTPConfig {
  id?: string;
  host: string;
  port: number;
  username: string;
  senderName: string;
  senderEmail: string;
  useTLS: boolean;
  isVerified: boolean;
}

const PRESETS: Record<string, { host: string; port: number; useTLS: boolean; label: string }> = {
  gmail:   { host: 'smtp.gmail.com',       port: 587, useTLS: false, label: 'Gmail (App Password)' },
  outlook: { host: 'smtp.office365.com',   port: 587, useTLS: false, label: 'Outlook / Office 365' },
  yahoo:   { host: 'smtp.mail.yahoo.com',  port: 587, useTLS: false, label: 'Yahoo Mail' },
  zoho:    { host: 'smtp.zoho.com',        port: 465, useTLS: true,  label: 'Zoho Mail' },
  custom:  { host: '',                     port: 587, useTLS: false, label: 'Custom SMTP' },
};

export function EmailSMTPPage({ isPaid }: { isPaid: boolean }) {
  const [form, setForm] = useState({ host: '', port: 587, username: '', password: '', senderName: '', senderEmail: '', useTLS: false });
  const [showPwd, setShowPwd] = useState(false);
  const [preset, setPreset] = useState('gmail');
  const [saved, setSaved] = useState<SMTPConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => { if (isPaid) load(); }, [isPaid]);

  const load = async () => {
    try {
      const r = await apiFetch(API_ENDPOINTS.email.smtp);
      const d = await r.json();
      if (d.success && d.data) {
        setSaved(d.data);
        setForm(f => ({ ...f, host: d.data.host, port: d.data.port, username: d.data.username, senderName: d.data.senderName, senderEmail: d.data.senderEmail, useTLS: d.data.useTLS }));
      }
    } catch { /* ignore */ }
  };

  const applyPreset = (key: string) => {
    setPreset(key);
    const p = PRESETS[key];
    setForm(f => ({ ...f, host: p.host, port: p.port, useTLS: p.useTLS }));
  };

  const save = async () => {
    if (!form.host || !form.username || !form.senderEmail) { setMsg({ text: 'Host, username and sender email are required', type: 'error' }); return; }
    setSaving(true); setMsg(null);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.smtp, { method: 'POST', body: JSON.stringify(form) });
      const d = await r.json();
      if (d.success) { setSaved(d.data); setMsg({ text: 'SMTP settings saved successfully!', type: 'success' }); }
      else setMsg({ text: d.error || 'Failed to save', type: 'error' });
    } catch { setMsg({ text: 'Network error', type: 'error' }); }
    setSaving(false);
  };

  const test = async () => {
    setTesting(true); setMsg(null);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.smtpTest, { method: 'POST' });
      const d = await r.json();
      setMsg({ text: d.success ? '✅ Connection successful! SMTP is working.' : d.error, type: d.success ? 'success' : 'error' });
      if (d.success && saved) setSaved({ ...saved, isVerified: true });
    } catch { setMsg({ text: 'Network error', type: 'error' }); }
    setTesting(false);
  };

  if (!isPaid) return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4"><Settings2 size={28} className="text-amber-500" /></div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Pro Feature</h2>
      <p className="text-gray-500">SMTP configuration is available on paid plans.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">SMTP Configuration</h2>
          <p className="text-sm text-gray-500 mt-1">Connect your email account to send campaigns</p>
        </div>
        {saved?.isVerified && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
            <CheckCircle2 size={14} className="text-green-600" />
            <span className="text-xs font-semibold text-green-700">Verified</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {/* Provider Presets */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email Provider</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([k, v]) => (
              <button key={k} onClick={() => applyPreset(k)}
                className={`px-3 py-1.5 text-sm rounded-lg border-2 font-medium transition-colors ${preset === k ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {v.label}
              </button>
            ))}
          </div>
          {preset === 'gmail' && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <HelpCircle size={15} className="text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-800">For Gmail, use your Gmail address as username and create an <strong>App Password</strong> at myaccount.google.com → Security → 2-Step Verification → App Passwords.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">SMTP Host</label>
            <input value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))}
              placeholder="smtp.gmail.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Port</label>
            <input type="number" value={form.port} onChange={e => setForm(f => ({ ...f, port: +e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Username / Email</label>
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="you@gmail.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Password / App Password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder={saved ? '••••••••••••' : 'Enter password'}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Sender Name</label>
            <input value={form.senderName} onChange={e => setForm(f => ({ ...f, senderName: e.target.value }))}
              placeholder="My Business" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Sender Email (From)</label>
            <input value={form.senderEmail} onChange={e => setForm(f => ({ ...f, senderEmail: e.target.value }))}
              placeholder="noreply@mybusiness.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div onClick={() => setForm(f => ({ ...f, useTLS: !f.useTLS }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.useTLS ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.useTLS ? 'translate-x-5' : ''}`} />
          </div>
          <span className="text-sm text-gray-700">Use TLS (port 465) — leave off for STARTTLS (port 587)</span>
        </label>

        {msg && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {msg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {msg.text}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {saved && (
            <button onClick={test} disabled={testing}
              className="flex items-center gap-2 px-5 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-sm font-semibold transition-colors">
              {testing ? <Loader2 size={15} className="animate-spin" /> : saved.isVerified ? <Wifi size={15} className="text-green-600" /> : <WifiOff size={15} />}
              {testing ? 'Testing…' : 'Test Connection'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
