import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Send, Users, FileText, Plus, Clock, Upload,
  CheckCircle2, AlertCircle, Loader2, Variable,
  X, Mail, ArrowRight, Sparkles, Eye, Code2, ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { useNavigate } from 'react-router-dom';

interface EmailContact { email: string; name?: string; vars?: Record<string, string> }
interface EmailTemplate { id: string; name: string; subject: string; bodyHtml: string; variables: string[] }

const SAMPLE_HTML = `<div style="max-width:600px;margin:0 auto;font-family:Inter,Arial,sans-serif">
  <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:32px;text-align:center;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:24px">Hello {{name}}! 👋</h1>
    <p style="color:#bfdbfe;margin:8px 0 0;font-size:15px">We have something exciting for you</p>
  </div>
  <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:0">
    <p style="color:#374151;font-size:15px;line-height:1.7">We wanted to reach out personally and share some great news with you.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="https://example.com" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Learn More →</a>
    </div>
    <p style="color:#6b7280;font-size:13px">Best regards,<br/><strong>The Team</strong></p>
  </div>
</div>`;

type ViewMode = 'code' | 'preview';

export function EmailComposePage({ isPaid }: { isPaid: boolean }) {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<EmailContact[]>([{ email: '', name: '' }]);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState(SAMPLE_HTML);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [done, setDone] = useState<{ sent: number; failed: number; errors: string[]; scheduled?: boolean } | null>(null);
  const [csvError, setCsvError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('code');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isPaid) loadTemplates(); }, [isPaid]);

  const loadTemplates = async () => {
    try {
      const r = await apiFetch(API_ENDPOINTS.email.templates);
      const d = await r.json();
      if (d.success) setTemplates(d.data || []);
    } catch { /* ignore */ }
  };

  const validCount = contacts.filter(c => c.email.includes('@')).length;
  const addRow = () => setContacts(c => [...c, { email: '', name: '' }]);
  const removeRow = (i: number) => setContacts(c => c.filter((_, j) => j !== i));
  const updateRow = (i: number, field: keyof EmailContact, val: string) =>
    setContacts(c => { const u = [...c]; u[i] = { ...u[i], [field]: val }; return u; });

  const parseContactsFromRows = useCallback((rows: string[][]): EmailContact[] => {
    if (rows.length === 0) return [];

    // Email column aliases (case-insensitive)
    const EMAIL_ALIASES = ['email', 'e-mail', 'email address', 'emailaddress', 'mail'];
    const NAME_ALIASES  = ['name', 'full name', 'fullname', 'contact name', 'first name', 'firstname'];

    // Try to detect header row by checking if the first row has a recognisable email column
    const firstRow = rows[0].map(c => (c ?? '').toString().trim().toLowerCase());
    const emailColIdx = firstRow.findIndex(h => EMAIL_ALIASES.includes(h));
    const nameColIdx  = firstRow.findIndex(h => NAME_ALIASES.includes(h));

    const hasHeader = emailColIdx !== -1;
    const dataRows  = rows.slice(hasHeader ? 1 : 0);

    // If no header found, fall back to first column = email, second = name
    const eIdx = hasHeader ? emailColIdx : 0;
    const nIdx = hasHeader ? (nameColIdx !== -1 ? nameColIdx : -1) : 1;

    const parsed: EmailContact[] = [];
    for (const row of dataRows) {
      const email = (row[eIdx] ?? '').toString().trim();
      const name  = nIdx >= 0 ? (row[nIdx] ?? '').toString().trim() : '';
      if (email.includes('@')) parsed.push({ email, name: name || undefined });
    }
    return parsed;
  }, []);

  const handleCSV = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setCsvError('');
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (ext === 'xlsx' || ext === 'xls') {
      // Excel file — use xlsx library
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const wb = XLSX.read(ev.target?.result, { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];
          const parsed = parseContactsFromRows(rows);
          if (!parsed.length) { setCsvError('No valid email addresses found. Make sure a column is labelled "Email".'); return; }
          setContacts(parsed);
        } catch {
          setCsvError('Failed to read Excel file. Please try a CSV instead.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV / TXT — plain text parsing
      const reader = new FileReader();
      reader.onload = ev => {
        const text = (ev.target?.result as string) ?? '';
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const rows: string[][] = lines.map(l => l.split(/[,\t;]/));
        const parsed = parseContactsFromRows(rows);
        if (!parsed.length) { setCsvError('No valid email addresses found. Make sure a column is labelled "Email".'); return; }
        setContacts(parsed);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  }, [parseContactsFromRows]);

  const useTemplate = (t: EmailTemplate) => { setSubject(t.subject); setBodyHtml(t.bodyHtml); setShowTemplates(false); };

  const send = async () => {
    const valid = contacts.filter(c => c.email.includes('@'));
    if (!valid.length) { alert('Add at least one valid email'); return; }
    if (!subject.trim()) { alert('Subject is required'); return; }
    if (!bodyHtml.trim()) { alert('Body is required'); return; }

    if (scheduleEnabled && scheduledAt) {
      setSending(true);
      try {
        const r = await apiFetch(API_ENDPOINTS.email.schedule, {
          method: 'POST',
          body: JSON.stringify({ contacts: valid, message: { subject, bodyHtml }, scheduledAt: new Date(scheduledAt).toISOString() }),
        });
        const d = await r.json();
        if (d.success) setDone({ sent: 0, failed: 0, errors: [], scheduled: true });
        else alert(d.error || 'Failed to schedule');
      } catch { alert('Failed to schedule'); }
      setSending(false); return;
    }

    setSending(true); setProgress({ sent: 0, failed: 0, total: valid.length }); setDone(null);
    try {
      const response = await fetch(API_ENDPOINTS.email.send, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ contacts: valid, message: { subject, bodyHtml } }),
      });
      const rdr = response.body?.getReader();
      if (!rdr) { setSending(false); return; }
      const dec = new TextDecoder(); let buf = '';
      while (true) {
        const { done: eof, value } = await rdr.read(); if (eof) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n\n'); buf = parts.pop() || '';
        for (const part of parts) {
          const dl = part.split('\n').find(l => l.startsWith('data:'));
          if (!dl) continue;
          const p = JSON.parse(dl.slice(5));
          if (part.includes('event: progress')) setProgress(p);
          else if (part.includes('event: done')) { setDone(p); setProgress(null); }
        }
      }
    } catch (e) { alert('Send failed: ' + e); }
    setSending(false);
  };

  const reset = () => {
    setDone(null); setProgress(null); setContacts([{ email: '', name: '' }]);
    setSubject(''); setBodyHtml(SAMPLE_HTML); setScheduleEnabled(false); setScheduledAt('');
  };

  /* Upgrade gate */
  if (!isPaid) return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-xs w-full">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
          <Mail size={30} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Unlock Email Campaigns</h2>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">Send bulk HTML emails with personalisation, scheduling, and live progress.</p>
        <button onClick={() => navigate('/subscription')}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 transition-all">
          <Sparkles size={16} />Upgrade to Pro
        </button>
      </div>
    </div>
  );

  /* Done screen */
  if (done) return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-xs w-full">
        <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center shadow-xl ${done.scheduled ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-500/30' : done.failed === 0 ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/30' : 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30'}`}>
          {done.scheduled ? <Clock size={30} className="text-white" /> : done.failed === 0 ? <CheckCircle2 size={30} className="text-white" /> : <AlertCircle size={30} className="text-white" />}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">{done.scheduled ? 'Campaign Scheduled!' : 'Send Complete'}</h2>
        {!done.scheduled && (
          <div className="flex justify-center gap-8 mb-4">
            <div><p className="text-3xl font-bold text-green-600">{done.sent}</p><p className="text-xs text-gray-400 mt-1">Delivered</p></div>
            {done.failed > 0 && <div><p className="text-3xl font-bold text-red-500">{done.failed}</p><p className="text-xs text-gray-400 mt-1">Failed</p></div>}
          </div>
        )}
        {done.errors?.length > 0 && (
          <div className="mt-2 mb-4 max-h-28 overflow-y-auto bg-red-50 border border-red-200 rounded-xl p-3 text-left">
            {done.errors.map((e, i) => <p key={i} className="text-xs text-red-700 py-0.5">{e}</p>)}
          </div>
        )}
        <button onClick={reset}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all">
          <ArrowRight size={16} />New Campaign
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* ── Recipients ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Users size={15} className="text-blue-600" />
            <span className="font-semibold text-gray-900 text-sm">Recipients</span>
            {validCount > 0 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{validCount}</span>}
          </div>
          <div className="flex gap-2">
            <input type="file" accept=".csv,.txt,.xlsx,.xls" ref={fileRef} onChange={handleCSV} className="hidden" />
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition-colors">
              <Upload size={12} /><span className="hidden sm:inline">CSV</span><span className="sm:hidden">CSV</span>
            </button>
            <button onClick={addRow}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
              <Plus size={12} />Add
            </button>
          </div>
        </div>
        {csvError && <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700"><AlertCircle size={12} />{csvError}</div>}
        <div className="px-4 sm:px-5 py-3 space-y-2 max-h-52 overflow-y-auto">
          {contacts.map((c, i) => (
            <div key={i} className="flex gap-2 items-center group">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.email.includes('@') ? 'bg-green-500' : 'bg-gray-300'}`} />
              <input value={c.email} onChange={e => updateRow(i, 'email', e.target.value)} placeholder="email@example.com" type="email"
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              <input value={c.name || ''} onChange={e => updateRow(i, 'name', e.target.value)} placeholder="Name"
                className="w-20 sm:w-28 px-2 sm:px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              {contacts.length > 1 && (
                <button onClick={() => removeRow(i)} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all flex-shrink-0">
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="px-4 sm:px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1 items-center justify-between">
          <p className="text-xs text-gray-400">Use <code className="bg-white border border-gray-200 px-1 rounded text-blue-600 font-mono">{'{{name}}'}</code> to personalise</p>
          <p className="text-xs text-gray-400">{validCount} valid</p>
        </div>
      </div>

      {/* ── Subject + Templates ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Mail size={14} className="text-blue-600" />Subject</label>
          <button onClick={() => setShowTemplates(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition-colors">
            <FileText size={11} />Templates<ChevronDown size={11} className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
          </button>
        </div>
        {showTemplates && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {templates.length > 0
              ? <div className="divide-y divide-gray-100 max-h-40 overflow-y-auto">
                  {templates.map(t => (
                    <button key={t.id} onClick={() => useTemplate(t)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between group">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                        <p className="text-xs text-gray-400 truncate">{t.subject}</p>
                      </div>
                      <ArrowRight size={13} className="text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              : <p className="text-xs text-gray-400 text-center py-5">No templates — create them in the Templates tab</p>
            }
          </div>
        )}
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Your compelling email subject line…"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
      </div>

      {/* ── HTML Editor + Preview ───────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
            <Variable size={12} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">Use <code className="font-mono text-blue-600 bg-blue-50 px-1 rounded">{'{{name}}'}</code> for personalisation</span>
          </div>
          <div className="flex bg-gray-200 rounded-lg p-0.5 gap-0.5 self-end sm:self-auto flex-shrink-0">
            <button onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'code' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Code2 size={12} />Code
            </button>
            <button onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Eye size={12} />Preview
            </button>
          </div>
        </div>

        {/* Editor */}
        {viewMode === 'code' ? (
          <div>
            <div className="px-4 py-2 bg-slate-900 flex items-center gap-2">
              <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /><span className="w-3 h-3 rounded-full bg-yellow-500" /><span className="w-3 h-3 rounded-full bg-green-500" /></div>
              <span className="text-slate-400 text-xs ml-2 font-mono">email.html</span>
            </div>
            <textarea value={bodyHtml} onChange={e => setBodyHtml(e.target.value)} rows={14}
              className="w-full px-4 py-4 bg-slate-950 text-green-400 text-xs font-mono focus:outline-none resize-none leading-relaxed block"
              placeholder="Paste your HTML email here…" spellCheck={false} />
          </div>
        ) : (
          <div>
            <div className="px-4 py-2.5 bg-white border-b border-gray-100 flex items-center gap-2 text-xs text-gray-500">
              <Eye size={12} className="text-blue-500" />
              <span className="font-medium">Live Preview</span>
              {subject && <span className="text-gray-400 truncate">· {subject}</span>}
            </div>
            <div className="bg-gray-50" style={{ height: 360 }}>
              {bodyHtml
                ? <iframe srcDoc={bodyHtml.replace(/{{name}}/g, 'John').replace(/{{email}}/g, 'john@example.com')}
                    className="w-full h-full border-0" title="Email preview" sandbox="allow-same-origin" />
                : <div className="flex items-center justify-center h-full text-gray-300"><Mail size={40} /></div>
              }
            </div>
          </div>
        )}
      </div>

      {/* ── Schedule ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <label className="flex items-center justify-between cursor-pointer select-none">
          <div className="flex items-center gap-2">
            <Clock size={15} className={scheduleEnabled ? 'text-blue-600' : 'text-gray-400'} />
            <span className={`text-sm font-semibold ${scheduleEnabled ? 'text-gray-900' : 'text-gray-500'}`}>Schedule for later</span>
          </div>
          <div onClick={() => setScheduleEnabled(v => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${scheduleEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${scheduleEnabled ? 'translate-x-5' : ''}`} />
          </div>
        </label>
        {scheduleEnabled && (
          <div className="mt-3">
            <input type="datetime-local" value={scheduledAt} min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            <p className="text-xs text-gray-400 mt-1.5">Emails will be dispatched automatically at the selected time.</p>
          </div>
        )}
      </div>

      {/* ── Progress ────────────────────────────────────────────── */}
      {progress && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Sending…</span>
            <span className="text-sm font-bold text-blue-600">{Math.round(((progress.sent + progress.failed) / progress.total) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${((progress.sent + progress.failed) / progress.total) * 100}%` }} />
          </div>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1 text-green-600 font-semibold"><CheckCircle2 size={12} />{progress.sent} sent</span>
            {progress.failed > 0 && <span className="flex items-center gap-1 text-red-500 font-semibold"><AlertCircle size={12} />{progress.failed} failed</span>}
          </div>
        </div>
      )}

      {/* ── Send Button ─────────────────────────────────────────── */}
      <button onClick={send} disabled={sending || validCount === 0}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30 hover:shadow-blue-500/50">
        {sending
          ? <><Loader2 size={16} className="animate-spin" />{progress ? `Sending ${progress.sent + progress.failed} / ${progress.total}…` : 'Scheduling…'}</>
          : scheduleEnabled
            ? <><Clock size={16} />Schedule Campaign</>
            : <><Send size={16} />Send to {validCount || '—'} Recipients</>
        }
      </button>
    </div>
  );
}
