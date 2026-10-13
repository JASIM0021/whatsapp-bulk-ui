import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Send, Users, FileText, Plus, Clock, Upload,
  CheckCircle2, AlertCircle, Loader2, Variable,
  X, Mail, ArrowRight, Sparkles, ChevronDown,
  Tag, Copy, Check, Megaphone, Save, Layers, Target
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { useNavigate } from 'react-router-dom';
import { EmailCampaign, RetargetPayload, RETARGET_STORAGE_KEY } from './emailAnalyticsTypes';
import { EmailBodyEditor } from './EmailBodyEditor';

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
type CampaignMode = 'new' | 'existing' | 'none';

const DEFAULT_BATCH = 100;
const MAX_PER_SEND = 500;
const batchStorageKey = (fileKey: string) => `email_batch:${fileKey}`;

export function EmailComposePage({ isPaid, onOpenCampaign }: { isPaid: boolean; onOpenCampaign?: (id: string) => void }) {
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
  const [done, setDone] = useState<{ sent: number; failed: number; errors: string[]; scheduled?: boolean; campaignId?: string } | null>(null);
  const [csvError, setCsvError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('code');
  const [globalVars, setGlobalVars] = useState<Record<string, string>>({});
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Batch range (1-based, inclusive) over the valid recipient list
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(0); // 0 = through the end
  // Save-as-template
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  // Campaign dialog
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignMode, setCampaignMode] = useState<CampaignMode>('new');
  const [campaignName, setCampaignName] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [retargetFrom, setRetargetFrom] = useState<{ id: string; name: string } | null>(null);

  // Collect all available dynamic variable keys from loaded contacts (e.g. name, email, company, address, website...)
  const availableTags = useMemo(() => {
    const tags = new Set<string>(['name', 'email']);
    for (const c of contacts) {
      if (c.vars) {
        for (const k of Object.keys(c.vars)) {
          const clean = k.trim().toLowerCase();
          if (clean) tags.add(clean);
        }
      }
    }
    return Array.from(tags);
  }, [contacts]);

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(`{{${tag}}}`);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const handleInsertTag = (tag: string) => {
    const token = `{{${tag}}}`;
    setBodyHtml(prev => prev + (prev.endsWith('\n') ? '' : '\n') + token);
    handleCopyTag(tag);
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const sampleVars: Record<string, string> = {};
      for (const c of contacts) {
        if (c.name && !sampleVars['name']) sampleVars['name'] = c.name;
        if (c.vars) {
          for (const [k, v] of Object.entries(c.vars)) {
            if (v && !sampleVars[k]) sampleVars[k] = v;
          }
        }
      }

      const response = await apiFetch('/api/leads/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          availableVars: availableTags,
          sampleVars,
        }),
      });
      const d = await response.json();
      if (d.success && d.data) {
        if (d.data.subject) setSubject(d.data.subject);
        if (d.data.bodyHtml) {
          setBodyHtml(d.data.bodyHtml);
          setViewMode('preview');
        }
        setAiPrompt('');
      } else {
        alert(d.error || 'Failed to generate email');
      }
    } catch (e) {
      alert('Failed to generate email: ' + e);
    } finally {
      setAiGenerating(false);
    }
  };

  // Auto-detect all {{variable}} tokens from subject + body
  const detectedVars = useMemo(() => {
    const combined = subject + ' ' + bodyHtml;
    const matches = [...combined.matchAll(/{{\s*(\w+)\s*}}/g)].map(m => m[1].toLowerCase());
    return [...new Set(matches)];
  }, [subject, bodyHtml]);

  // Variables that need manual/global values because they are NOT provided per-contact in CSV
  const manualGlobalVars = useMemo(() => {
    const contactVarSet = new Set(availableTags);
    return detectedVars.filter(v => !contactVarSet.has(v));
  }, [detectedVars, availableTags]);

  // Keep globalVars in sync — add new keys, drop removed ones
  useEffect(() => {
    setGlobalVars(prev => {
      const next: Record<string, string> = {};
      for (const v of manualGlobalVars) next[v] = prev[v] ?? '';
      return next;
    });
  }, [manualGlobalVars.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (isPaid) loadTemplates(); }, [isPaid]);

  // Load bridged contacts from Leads Scraper if present
  useEffect(() => {
    const raw = sessionStorage.getItem('temp_leads_email');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set<string>();
          const formatted: EmailContact[] = [];
          for (const item of parsed) {
            const cleanEmail = (item.email || '').toString().trim().replace(/^["'`]|["'`]$/g, '').toLowerCase();
            if (cleanEmail && cleanEmail.includes('@') && !seen.has(cleanEmail)) {
              seen.add(cleanEmail);
              formatted.push({
                email: cleanEmail,
                name: (item.name || '').toString().trim(),
                vars: item.vars && typeof item.vars === 'object' ? item.vars : undefined,
              });
            }
          }
          if (formatted.length > 0) {
            setContacts(formatted);
          }
        }
      } catch (e) {
        console.error('Failed to load bridged emails:', e);
      } finally {
        sessionStorage.removeItem('temp_leads_email');
      }
    }
  }, [setContacts]);

  // Load a re-target audience handed over from the Campaigns tab
  useEffect(() => {
    const raw = sessionStorage.getItem(RETARGET_STORAGE_KEY);
    if (!raw) return;
    sessionStorage.removeItem(RETARGET_STORAGE_KEY);
    try {
      const p: RetargetPayload = JSON.parse(raw);
      if (!p.contacts?.length) return;
      setContacts(p.contacts.map(c => ({ email: c.email, name: c.name || '', vars: c.vars || undefined })));
      if (p.subject) setSubject(p.subject);
      if (p.bodyHtml) setBodyHtml(p.bodyHtml);
      setFileKey(null); setRangeFrom(1); setRangeTo(0);
      setCampaignMode('existing'); setCampaignId(p.campaignId);
      setRetargetFrom({ id: p.campaignId, name: p.campaignName });
    } catch (e) {
      console.error('Failed to load re-target audience:', e);
    }
  }, []);

  const loadCampaigns = async () => {
    try {
      const r = await apiFetch(API_ENDPOINTS.email.campaigns);
      const d = await r.json();
      if (d.success) setCampaigns(d.data || []);
    } catch { /* ignore */ }
  };

  const loadTemplates = async () => {
    try {
      const r = await apiFetch(API_ENDPOINTS.email.templates);
      const d = await r.json();
      if (d.success) setTemplates(d.data || []);
    } catch { /* ignore */ }
  };

  // Unique, cleaned recipients in upload order — the list the batch range indexes into
  const validContacts = useMemo(() => {
    const seen = new Set<string>();
    const out: EmailContact[] = [];
    for (const c of contacts) {
      const email = (c.email || '').toString().trim().replace(/^["'`]|["'`]$/g, '').toLowerCase();
      if (email && email.includes('@') && !seen.has(email)) {
        seen.add(email);
        out.push({ email, name: (c.name || '').toString().trim(), vars: c.vars });
      }
    }
    return out;
  }, [contacts]);
  const validCount = validContacts.length;
  const batchFrom = Math.min(Math.max(1, rangeFrom || 1), Math.max(1, validCount));
  const batchTo = rangeTo <= 0 ? validCount : Math.min(Math.max(batchFrom, rangeTo), validCount);
  const selectedContacts = useMemo(() => validContacts.slice(batchFrom - 1, batchTo), [validContacts, batchFrom, batchTo]);
  const positionByEmail = useMemo(() => new Map(validContacts.map((c, i) => [c.email, i + 1])), [validContacts]);

  const setBatch = (from: number, size: number) => {
    const f = Math.min(Math.max(1, from), Math.max(1, validCount));
    setRangeFrom(f);
    setRangeTo(Math.min(validCount, f + size - 1));
  };

  // After an upload, suggest the next unsent batch for this file (remembered per browser)
  const applyDefaultBatch = (key: string, count: number) => {
    setFileKey(key);
    if (count <= DEFAULT_BATCH) { setRangeFrom(1); setRangeTo(0); return; }
    let last = 0;
    try { last = Number(localStorage.getItem(batchStorageKey(key)) || 0); } catch { /* storage unavailable */ }
    const from = last > 0 && last < count ? last + 1 : 1;
    setRangeFrom(from);
    setRangeTo(Math.min(count, from + DEFAULT_BATCH - 1));
  };
  const addRow = () => setContacts(c => [...c, { email: '', name: '' }]);
  const removeRow = (i: number) => setContacts(c => c.filter((_, j) => j !== i));
  const updateRow = (i: number, field: keyof EmailContact, val: string) =>
    setContacts(c => { const u = [...c]; u[i] = { ...u[i], [field]: val }; return u; });

  const parseContactsFromRows = useCallback((rows: string[][]): EmailContact[] => {
    if (rows.length === 0) return [];

    // Email column aliases (case-insensitive)
    const EMAIL_ALIASES = ['email', 'e-mail', 'email address', 'emailaddress', 'mail', 'email_address', 'contact email'];
    const NAME_ALIASES  = ['name', 'full name', 'fullname', 'contact name', 'first name', 'firstname', 'client name', 'person'];

    // Try to detect header row by checking if the first row has a recognisable email column
    const rawHeaders = rows[0].map(c => (c ?? '').toString().trim());
    const lowerHeaders = rawHeaders.map(c => c.toLowerCase());
    const emailColIdx = lowerHeaders.findIndex(h => EMAIL_ALIASES.includes(h));
    const nameColIdx  = lowerHeaders.findIndex(h => NAME_ALIASES.includes(h));

    const hasHeader = emailColIdx !== -1;
    const dataRows  = rows.slice(hasHeader ? 1 : 0);

    // If no header found, fall back to first column = email, second = name
    const eIdx = hasHeader ? emailColIdx : 0;
    const nIdx = hasHeader ? (nameColIdx !== -1 ? nameColIdx : -1) : 1;

    // Detect all other column headers as dynamic variable keys (e.g. company, address, website, phone...)
    const extraCols: { idx: number; key: string }[] = [];
    if (hasHeader) {
      rawHeaders.forEach((colName, idx) => {
        if (idx !== eIdx && idx !== nIdx && colName.trim()) {
          const cleanKey = colName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
          if (cleanKey) {
            extraCols.push({ idx, key: cleanKey });
          }
        }
      });
    }

    const parsed: EmailContact[] = [];
    const seen = new Set<string>();

    for (const row of dataRows) {
      const rawEmail = (row[eIdx] ?? '').toString().trim().replace(/^["'`]|["'`]$/g, '');
      const email = rawEmail.toLowerCase();
      const name  = nIdx >= 0 ? (row[nIdx] ?? '').toString().trim() : '';

      if (email.includes('@') && !seen.has(email)) {
        seen.add(email);
        const vars: Record<string, string> = {};
        for (const { idx, key } of extraCols) {
          const val = (row[idx] ?? '').toString().trim();
          if (val) {
            vars[key] = val;
          }
        }
        parsed.push({
          email,
          name: name || undefined,
          vars: Object.keys(vars).length > 0 ? vars : undefined,
        });
      }
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
          applyDefaultBatch(`${file.name}:${parsed.length}`, parsed.length);
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
        applyDefaultBatch(`${file.name}:${parsed.length}`, parsed.length);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  }, [parseContactsFromRows]);

  const useTemplate = (t: EmailTemplate) => {
    setSubject(t.subject);
    setBodyHtml(t.bodyHtml);
    setShowTemplates(false);
    // Pre-populate globalVars from template's declared variables
    const vars: Record<string, string> = {};
    for (const v of (t.variables ?? [])) {
      if (!availableTags.includes(v.toLowerCase())) {
        vars[v] = '';
      }
    }
    setGlobalVars(vars);
  };

  // Apply all variable substitutions for a given contact
  const applyVars = useCallback((template: string, contact: EmailContact) => {
    let out = template;
    out = out.replace(/{{\s*name\s*}}/gi, contact.name || '');
    out = out.replace(/{{\s*email\s*}}/gi, contact.email);
    // Replace per-contact variables (e.g. company, address, website from CSV/Leads)
    if (contact.vars) {
      for (const [k, v] of Object.entries(contact.vars)) {
        if (k) {
          out = out.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'gi'), v || '');
        }
      }
    }
    // Replace manual global variables
    for (const [k, v] of Object.entries(globalVars)) {
      if (k) {
        out = out.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'gi'), v);
      }
    }
    return out;
  }, [globalVars]);

  // Step 1: validate, then ask how to group this send into a campaign
  const send = () => {
    if (!selectedContacts.length) { alert('Add at least one valid email'); return; }
    if (selectedContacts.length > MAX_PER_SEND) { alert(`You can send to at most ${MAX_PER_SEND} recipients at once — narrow the batch range.`); return; }
    if (!subject.trim()) { alert('Subject is required'); return; }
    if (!bodyHtml.trim()) { alert('Body is required'); return; }
    if (saveTemplate && !templateName.trim()) { alert('Give the template a name, or untick "Save as template".'); return; }
    if (!campaignName) {
      const day = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      setCampaignName(`${subject.trim().slice(0, 60)} · ${day}`);
    }
    loadCampaigns();
    setShowCampaignModal(true);
  };

  // Step 2: actually send / schedule
  const doSend = async () => {
    if (campaignMode === 'new' && !campaignName.trim()) { alert('Enter a campaign name'); return; }
    if (campaignMode === 'existing' && !campaignId) { alert('Choose a campaign'); return; }
    setShowCampaignModal(false);

    const valid = selectedContacts;
    const campaignFields = campaignMode === 'new'
      ? { campaignName: campaignName.trim() }
      : campaignMode === 'existing' ? { campaignId } : {};

    if (saveTemplate) {
      try {
        const r = await apiFetch(API_ENDPOINTS.email.templates, {
          method: 'POST',
          body: JSON.stringify({ name: templateName.trim(), category: 'campaign', subject, bodyHtml, variables: detectedVars }),
        });
        const d = await r.json();
        if (d.success) { setSaveTemplate(false); setTemplateName(''); loadTemplates(); }
        else alert(`Template not saved: ${d.error || 'unknown error'} — continuing with the send.`);
      } catch { alert('Template not saved — continuing with the send.'); }
    }

    const rememberBatch = () => {
      if (!fileKey) return;
      try { localStorage.setItem(batchStorageKey(fileKey), String(batchTo)); } catch { /* storage unavailable */ }
    };

    // Build per-contact payloads with variables resolved and vars preserved
    const resolvedContacts = valid.map(c => ({
      email: c.email,
      name: c.name,
      vars: c.vars,
      subject: applyVars(subject, c),
      bodyHtml: applyVars(bodyHtml, c),
    }));

    if (scheduleEnabled && scheduledAt) {
      setSending(true);
      try {
        const r = await apiFetch(API_ENDPOINTS.email.schedule, {
          method: 'POST',
          body: JSON.stringify({ contacts: resolvedContacts, message: { subject, bodyHtml }, scheduledAt: new Date(scheduledAt).toISOString(), ...campaignFields }),
        });
        const d = await r.json();
        if (d.success) { rememberBatch(); setDone({ sent: 0, failed: 0, errors: [], scheduled: true, campaignId: d.campaign_id || undefined }); }
        else alert(d.error || 'Failed to schedule');
      } catch { alert('Failed to schedule'); }
      setSending(false); return;
    }

    setSending(true); setProgress({ sent: 0, failed: 0, total: valid.length }); setDone(null);
    try {
      const response = await fetch(API_ENDPOINTS.email.send, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ contacts: resolvedContacts, message: { subject, bodyHtml }, ...campaignFields }),
      });
      if (!response.ok) {
        const d = await response.json().catch(() => ({}));
        alert(d.error || `Send failed (${response.status})`);
        setSending(false); setProgress(null); return;
      }
      rememberBatch();
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
    setFileKey(null); setRangeFrom(1); setRangeTo(0);
    setCampaignMode('new'); setCampaignName(''); setCampaignId(''); setRetargetFrom(null);
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
        {done.campaignId && onOpenCampaign && (
          <button onClick={() => onOpenCampaign(done.campaignId!)}
            className="w-full mb-2 flex items-center justify-center gap-2 py-3 bg-white border border-blue-200 text-blue-700 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all">
            <Megaphone size={16} />View campaign tracking
          </button>
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

      {retargetFrom && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-800">
          <Target size={15} className="flex-shrink-0" />
          <span className="min-w-0">Re-targeting <strong>{retargetFrom.name}</strong>: {validCount} recipient{validCount === 1 ? '' : 's'} loaded. This send will be added to that campaign.</span>
        </div>
      )}

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
          {contacts.map((c, i) => {
            const pos = positionByEmail.get((c.email || '').trim().replace(/^["'`]|["'`]$/g, '').toLowerCase());
            const inBatch = pos !== undefined && pos >= batchFrom && pos <= batchTo;
            return (
            <div key={i} className={`flex gap-2 items-center group transition-opacity ${validCount > 1 && !inBatch ? 'opacity-40' : ''}`}>
              <span className="w-8 text-right text-[10px] text-gray-400 tabular-nums flex-shrink-0">{pos ?? ''}</span>
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${inBatch ? 'bg-green-500' : 'bg-gray-300'}`} />
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
            );
          })}
        </div>
        <div className="px-4 sm:px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1 items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
            <span>Dynamic tags:</span>
            {availableTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleCopyTag(tag)}
                title="Click to copy placeholder"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 font-mono text-[11px] transition-colors"
              >
                {`{{${tag}}}`}
                {copiedTag === tag ? <Check size={10} className="text-green-600" /> : <Copy size={10} className="text-gray-400" />}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">{validCount} valid</p>
        </div>
      </div>

      {/* ── Batch range ─────────────────────────────────────────── */}
      {validCount > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers size={15} className="text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Send to a batch</p>
                <p className="text-xs text-gray-400">Pick which rows of your {validCount} contacts to email now</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500 text-xs">Rows</span>
              <input type="number" min={1} max={validCount} value={batchFrom}
                onChange={e => { const f = Number(e.target.value) || 1; setRangeFrom(f); if (rangeTo > 0 && rangeTo < f) setRangeTo(f); }}
                className="w-20 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm tabular-nums outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-gray-400">to</span>
              <input type="number" min={batchFrom} max={validCount} value={batchTo}
                onChange={e => setRangeTo(Number(e.target.value) || 0)}
                className="w-20 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm tabular-nums outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button onClick={() => setBatch(1, DEFAULT_BATCH)} className="px-2.5 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">First {Math.min(DEFAULT_BATCH, validCount)}</button>
            {batchTo < validCount && (
              <button onClick={() => setBatch(batchTo + 1, batchTo - batchFrom + 1)} className="px-2.5 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">
                Next batch → {batchTo + 1}–{Math.min(validCount, batchTo + (batchTo - batchFrom + 1))}
              </button>
            )}
            <button onClick={() => { setRangeFrom(1); setRangeTo(0); }} className="px-2.5 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">All {validCount}</button>
            <span className={`ml-auto text-xs font-semibold ${selectedContacts.length > MAX_PER_SEND ? 'text-red-600' : 'text-blue-700'}`}>
              {selectedContacts.length} selected{selectedContacts.length > MAX_PER_SEND ? ` · max ${MAX_PER_SEND} per send` : ''}
            </span>
          </div>
        </div>
      )}

      {/* ── Available Dynamic Variables Bar ──────────────────────── */}
      {availableTags.length > 2 && (
        <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 rounded-2xl border border-blue-100/80 p-4 sm:p-4.5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Tag size={15} className="text-blue-600" />
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">Available Personalization Tags ({availableTags.length})</span>
            </div>
            <p className="text-[11px] text-gray-500">Click any variable to copy or insert into template</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {availableTags.map(tag => (
              <div key={tag} className="inline-flex items-center rounded-lg bg-white border border-blue-200/80 shadow-2xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => handleCopyTag(tag)}
                  title="Click to copy to clipboard"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  {`{{${tag}}}`}
                  {copiedTag === tag ? <Check size={11} className="text-green-600" /> : <Copy size={11} className="text-gray-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag(tag)}
                  title="Insert into email body"
                  className="px-2 py-1.5 text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50/60 hover:bg-indigo-100/80 border-l border-blue-100 transition-colors"
                >
                  + Insert
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
        {/* AI Assistant */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/40 via-indigo-50/20 to-violet-50/40 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="text-violet-600 animate-pulse" size={14} />
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">AI Email Writer</span>
            </div>
            <p className="text-[10px] text-gray-400 font-medium hidden sm:block">
              Auto-detects {availableTags.length} dynamic variable{availableTags.length > 1 ? 's' : ''} for deep personalization
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Describe the email (e.g., Friendly pitch offering our SEO services with a special offer)..."
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              className="flex-1 px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none bg-white shadow-xs"
              onKeyDown={e => { if (e.key === 'Enter') handleGenerateAI(); }}
            />
            <button
              onClick={handleGenerateAI}
              disabled={aiGenerating || !aiPrompt.trim()}
              className="px-4 py-2.5 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {aiGenerating ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Writing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </div>

        <EmailBodyEditor
          value={bodyHtml}
          onChange={setBodyHtml}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          subject={subject}
          renderPreview={html => applyVars(html, contacts[0] || { email: 'john@example.com', name: 'John Doe' })}
          hint={<>
            <Variable size={12} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">Use {availableTags.slice(0, 3).map(t => `{{${t}}}`).join(', ')}{availableTags.length > 3 ? '...' : ''} for personalization</span>
          </>}
        />
      </div>

      {/* ── Dynamic Variables ───────────────────────────────────── */}
      {detectedVars.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Variable size={14} className="text-blue-600" />
              <span className="font-semibold text-gray-900 text-sm">Template Variables in Use</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">{detectedVars.length}</span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">Variables detected from subject & HTML body</p>
          </div>
          <div className="px-4 sm:px-5 py-4 space-y-4">
            {/* Auto-filled variables */}
            {detectedVars.filter(v => availableTags.includes(v)).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-green-500" />
                  Auto-filled per recipient from recipient list / CSV:
                </p>
                <div className="flex flex-wrap gap-2">
                  {detectedVars.filter(v => availableTags.includes(v)).map(v => (
                    <span key={v} className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-mono font-medium">
                      <Check size={11} />
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Manual fallback variables */}
            {manualGlobalVars.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-amber-500" />
                  Global Fallback Variables (not in recipient list):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {manualGlobalVars.map(v => (
                    <div key={v}>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1.5">
                        <code className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded font-mono text-xs">{`{{${v}}}`}</code>
                        <span className="text-gray-400 font-normal">→ global value</span>
                      </label>
                      <input
                        value={globalVars[v] ?? ''}
                        onChange={e => setGlobalVars(prev => ({ ...prev, [v]: e.target.value }))}
                        placeholder={`Enter ${v.replace(/_/g, ' ')} for all recipients…`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none placeholder-gray-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Save as template ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input type="checkbox" checked={saveTemplate} onChange={e => {
            setSaveTemplate(e.target.checked);
            if (e.target.checked && !templateName) setTemplateName(subject.trim().slice(0, 80));
          }} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <Save size={15} className={saveTemplate ? 'text-blue-600' : 'text-gray-400'} />
          <span className={`text-sm font-semibold ${saveTemplate ? 'text-gray-900' : 'text-gray-500'}`}>Save this email as a template for future sends</span>
        </label>
        {saveTemplate && (
          <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="Template name"
            className="mt-3 w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
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
      <button onClick={send} disabled={sending || selectedContacts.length === 0}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30 hover:shadow-blue-500/50">
        {sending
          ? <><Loader2 size={16} className="animate-spin" />{progress ? `Sending ${progress.sent + progress.failed} / ${progress.total}…` : 'Scheduling…'}</>
          : scheduleEnabled
            ? <><Clock size={16} />Schedule Campaign</>
            : <><Send size={16} />Send to {selectedContacts.length || '—'} Recipients</>
        }
      </button>

      {/* ── Campaign dialog ─────────────────────────────────────── */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCampaignModal(false)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Megaphone size={16} className="text-blue-600" />Track this send as a campaign?</h3>
                <p className="text-xs text-gray-500 mt-1">{scheduleEnabled ? 'Scheduling' : 'Sending'} to {selectedContacts.length} recipient{selectedContacts.length === 1 ? '' : 's'}{validCount > 1 ? ` (rows ${batchFrom}–${batchTo})` : ''}. Opens and clicks are tracked either way; a campaign groups them so you can report on and re-target this audience later.</p>
              </div>
              <button onClick={() => setShowCampaignModal(false)} className="p-1 text-gray-400 hover:text-gray-700"><X size={16} /></button>
            </div>

            <div className="space-y-2">
              {([
                { id: 'new', label: 'Create a new campaign' },
                { id: 'existing', label: 'Add to an existing campaign' },
                { id: 'none', label: 'Send without a campaign' },
              ] as { id: CampaignMode; label: string }[]).map(o => (
                <label key={o.id} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer text-sm ${campaignMode === o.id ? 'border-blue-500 bg-blue-50/60' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="campaignMode" checked={campaignMode === o.id} onChange={() => setCampaignMode(o.id)} className="text-blue-600 focus:ring-blue-500" />
                  <span className="font-medium text-gray-800">{o.label}</span>
                </label>
              ))}
            </div>

            {campaignMode === 'new' && (
              <input autoFocus value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Campaign name, e.g. Clinic outreach – Sep"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            )}
            {campaignMode === 'existing' && (
              <select value={campaignId} onChange={e => setCampaignId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Choose a campaign…</option>
                {retargetFrom && !campaigns.some(c => c.id === retargetFrom.id) && <option value={retargetFrom.id}>{retargetFrom.name}</option>}
                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name} ({c.stats.sent} sent)</option>)}
              </select>
            )}

            <button onClick={doSend}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30">
              {scheduleEnabled ? <><Clock size={15} />Schedule {selectedContacts.length} emails</> : <><Send size={15} />Send {selectedContacts.length} emails</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
