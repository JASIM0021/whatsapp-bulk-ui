import { useState, useMemo, useEffect } from 'react';
import { Code2, KeyRound, Send, Loader2, Copy, Check, Eye, EyeOff, Plus, FlaskConical, Paperclip, X } from 'lucide-react';
import { apiFetch, API_BASE_URL, API_ENDPOINTS } from '@/config/api';

// Public URL shown in code samples; the live test goes through this app's own API base.
const PUBLIC_API = (import.meta.env.VITE_PUBLIC_API_URL as string | undefined)?.replace(/\/+$/, '') || 'https://api.nexbotix.online';
const SEND_PATH = '/api/v1/email/send';
const KEY_STORAGE = 'nexbotix_playground_api_key';

type Lang = 'curl' | 'js' | 'python';

// Same limits the API enforces, checked here so mistakes show before sending.
const MAX_FILES = 10;
const MAX_FILE_BYTES = 10 << 20;
const MAX_TOTAL_BYTES = 15 << 20;
const BLOCKED_EXT = new Set(['exe', 'bat', 'cmd', 'com', 'cpl', 'scr', 'pif', 'msi', 'msp', 'dll', 'vbs', 'vbe', 'js', 'jse', 'wsf', 'wsh', 'ps1', 'psm1', 'jar', 'hta', 'lnk', 'reg', 'gadget', 'apk', 'sh', 'app']);

const fmtSize = (n: number) => (n >= 1 << 20 ? `${(n / (1 << 20)).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

const SAMPLE_HTML = '<p>Hi {{name}},</p>\n<p>Thanks for signing up! Your account is ready.</p>';

function loadKey(): string {
  try { return sessionStorage.getItem(KEY_STORAGE) || ''; } catch { return ''; }
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* clipboard blocked */ }
      }}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-white/10 text-slate-200 hover:bg-white/20"
    >
      {done ? <Check size={11} /> : <Copy size={11} />}{done ? 'Copied' : 'Copy'}
    </button>
  );
}

/* ─── API Playground: build, copy and test an email API request ─── */
export function EmailAPIPlayground() {
  const [apiKey, setApiKey] = useState(loadKey);
  const [showKey, setShowKey] = useState(false);
  const [creating, setCreating] = useState(false);
  const [keyMsg, setKeyMsg] = useState('');

  const [to, setTo] = useState('');
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('Welcome to Acme');
  const [html, setHtml] = useState(SAMPLE_HTML);
  const [tracking, setTracking] = useState(false);
  const [attachSig, setAttachSig] = useState(false);
  const [sendDeck, setSendDeck] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileUrls, setFileUrls] = useState('');

  const [lang, setLang] = useState<Lang>('curl');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ status: number; ms: number; body: string } | null>(null);

  const saveKey = (k: string) => {
    setApiKey(k);
    try { if (k) sessionStorage.setItem(KEY_STORAGE, k); else sessionStorage.removeItem(KEY_STORAGE); } catch { /* ignore */ }
  };

  const createKey = async () => {
    setCreating(true); setKeyMsg('');
    try {
      const r = await apiFetch(API_ENDPOINTS.apiKeys.create, { method: 'POST', body: JSON.stringify({ name: 'Email API playground' }) });
      const d = await r.json();
      if (!d.success || !d.data?.key) throw new Error(d.error || 'Could not create a key');
      saveKey(d.data.key);
      setShowKey(true);
      setKeyMsg('New key created and filled in. Copy it now — it is only shown once.');
    } catch (e: unknown) {
      setKeyMsg(e instanceof Error ? e.message : 'Could not create a key');
    } finally {
      setCreating(false);
    }
  };

  // Request body exactly as the API expects it (false options left out).
  const body = useMemo(() => {
    const emails = to.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
    const b: Record<string, unknown> = {};
    if (emails.length <= 1 && !name.trim()) b.email = emails[0] || 'customer@example.com';
    else b.contacts = (emails.length ? emails : ['customer@example.com']).map((email, i) => (i === 0 && name.trim() ? { email, name: name.trim() } : { email }));
    b.message = { subject, bodyHtml: html };
    if (tracking) b.tracking = true;
    if (attachSig) b.attachSig = true;
    if (sendDeck) b.sendDeck = true;
    if (scheduleAt) b.schedule_at = new Date(scheduleAt).toISOString();
    const urls = fileUrls.split(/\s+/).map(u => u.trim()).filter(Boolean);
    if (urls.length) b.attachments = urls.map(url => ({ url }));
    return b;
  }, [to, name, subject, html, tracking, attachSig, sendDeck, scheduleAt, fileUrls]);

  // Client-side check of the API's attachment limits.
  const urlCount = fileUrls.split(/\s+/).filter(Boolean).length;
  const totalBytes = files.reduce((n, f) => n + f.size, 0);
  const fileError = (() => {
    if (files.length + urlCount > MAX_FILES) return `At most ${MAX_FILES} attachments.`;
    const blocked = files.find(f => BLOCKED_EXT.has(f.name.split('.').pop()?.toLowerCase() ?? ''));
    if (blocked) return `${blocked.name}: executable and script files can't be attached.`;
    const big = files.find(f => f.size > MAX_FILE_BYTES);
    if (big) return `${big.name} is larger than 10 MB.`;
    if (totalBytes > (scheduleAt ? 10 << 20 : MAX_TOTAL_BYTES)) return `Files add up to more than ${scheduleAt ? 10 : 15} MB.`;
    return '';
  })();
  // Copy the files out right away: the input's FileList is live and is emptied
  // when the input is reset, before React runs the state update.
  const addFiles = (list: FileList | null) => {
    const picked = list ? Array.from(list) : [];
    if (!picked.length) return;
    setFiles(prev => [...prev, ...picked].slice(0, MAX_FILES + 1));
  };
  const removeFile = (i: number) => {
    setFiles(prev => prev.filter((_, j) => j !== i));
    setPreviewIdx(null);
  };

  // Thumbnails for images; object URLs are released when the list changes.
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const previews = useMemo(() => files.map(f => (f.type.startsWith('image/') ? URL.createObjectURL(f) : '')), [files]);
  useEffect(() => () => previews.forEach(u => u && URL.revokeObjectURL(u)), [previews]);

  const json = JSON.stringify(body, null, 2);
  const keyInCode = showKey && apiKey ? apiKey : 'YOUR_API_KEY';
  const uploadNames = files.map(f => f.name);
  const multipartCode: Record<Lang, string> = {
    curl: `curl -X POST '${PUBLIC_API}${SEND_PATH}' \\\n  -H 'X-API-Key: ${keyInCode}' \\\n  -F 'payload=${JSON.stringify(body).replace(/'/g, "'\\''")}' \\\n${uploadNames.map(n => `  -F 'attachments=@${n.replace(/'/g, "'\\''")}'`).join(' \\\n')}`,
    js: `const form = new FormData();\nform.append('payload', JSON.stringify(${json.replace(/\n/g, '\n')}));\n${uploadNames.map((n, i) => `form.append('attachments', fileInput.files[${i}]); // ${n}`).join('\n')}\n\nconst res = await fetch('${PUBLIC_API}${SEND_PATH}', {\n  method: 'POST',\n  headers: { 'X-API-Key': '${keyInCode}' }, // the browser sets the multipart Content-Type\n  body: form,\n});\nconsole.log(await res.json());`,
    python: `import json\nimport requests\n\nres = requests.post(\n    "${PUBLIC_API}${SEND_PATH}",\n    headers={"X-API-Key": "${keyInCode}"},\n    data={"payload": json.dumps(${json.replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False').replace(/\n/g, '\n    ')})},\n    files=[\n${uploadNames.map(n => `        ("attachments", ("${n.replace(/"/g, '\\"')}", open("${n.replace(/"/g, '\\"')}", "rb"))),`).join('\n')}\n    ],\n)\nprint(res.json())`,
  };
  const code: Record<Lang, string> = files.length ? multipartCode : {
    curl: `curl -X POST '${PUBLIC_API}${SEND_PATH}' \\\n  -H 'X-API-Key: ${keyInCode}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${json.replace(/'/g, "'\\''")}'`,
    js: `const res = await fetch('${PUBLIC_API}${SEND_PATH}', {\n  method: 'POST',\n  headers: {\n    'X-API-Key': '${keyInCode}',\n    'Content-Type': 'application/json',\n  },\n  body: JSON.stringify(${json.replace(/\n/g, '\n  ')}),\n});\nconsole.log(await res.json());`,
    python: `import requests\n\nres = requests.post(\n    "${PUBLIC_API}${SEND_PATH}",\n    headers={"X-API-Key": "${keyInCode}"},\n    json=${json.replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False').replace(/\n/g, '\n    ')},\n)\nprint(res.json())`,
  };

  const runTest = async () => {
    if (!apiKey.trim() || !to.trim() || fileError) return;
    setSending(true); setResult(null);
    const started = performance.now();
    try {
      // Plain fetch with only the API key — exactly what a developer's code sends.
      let init: RequestInit;
      if (files.length) {
        const form = new FormData();
        form.append('payload', JSON.stringify(body));
        files.forEach(f => form.append('attachments', f, f.name));
        init = { method: 'POST', headers: { 'X-API-Key': apiKey.trim() }, body: form };
      } else {
        init = { method: 'POST', headers: { 'X-API-Key': apiKey.trim(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
      }
      const r = await fetch(`${API_BASE_URL}${SEND_PATH}`, init);
      const text = await r.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* not JSON */ }
      setResult({ status: r.status, ms: Math.round(performance.now() - started), body: pretty });
    } catch (e: unknown) {
      setResult({ status: 0, ms: Math.round(performance.now() - started), body: e instanceof Error ? e.message : 'Network error' });
    } finally {
      setSending(false);
    }
  };

  const toggle = (label: string, hint: string, value: boolean, set: (v: boolean) => void) => (
    <label className="flex items-start gap-2 cursor-pointer select-none">
      <input type="checkbox" checked={value} onChange={e => set(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
      <span>
        <span className="block text-xs font-semibold text-gray-700 font-mono">{label}</span>
        <span className="block text-[11px] text-gray-500">{hint}</span>
      </span>
    </label>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0"><FlaskConical size={18} /></div>
        <div>
          <h2 className="text-base font-bold text-gray-900">API Playground</h2>
          <p className="text-xs text-gray-500">
            Send email from your own app with an API key. Build a request, copy the code, and test it live. API emails go out exactly as written: no open/click tracking, signature, deck or send-summary email unless you turn them on below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-gray-100">
        {/* Request builder */}
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1"><KeyRound size={12} />API key</label>
            <div className="mt-1 flex gap-2">
              <div className="relative flex-1">
                <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={e => saveKey(e.target.value)} placeholder="nex_…"
                  className="w-full px-3 py-2 pr-9 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                <button onClick={() => setShowKey(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label="Show key">
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button onClick={createKey} disabled={creating}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap">
                {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}Create key
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">{keyMsg || 'Paste a key from Developer → API keys, or create one. Kept only in this browser tab.'}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-gray-600">To
              <input value={to} onChange={e => setTo(e.target.value)} placeholder="you@example.com, …"
                className="mt-1 w-full px-3 py-2 text-sm font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </label>
            <label className="block text-xs font-semibold text-gray-600">Name <span className="font-normal text-gray-400">(fills {'{{name}}'})</span>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Jo"
                className="mt-1 w-full px-3 py-2 text-sm font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </label>
          </div>
          <label className="block text-xs font-semibold text-gray-600">Subject
            <input value={subject} onChange={e => setSubject(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </label>
          <label className="block text-xs font-semibold text-gray-600">HTML body
            <textarea value={html} onChange={e => setHtml(e.target.value)} rows={4}
              className="mt-1 w-full px-3 py-2 text-xs font-mono font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            {toggle('tracking', 'Add open & click tracking', tracking, setTracking)}
            {toggle('attachSig', 'Append your saved signature', attachSig, setAttachSig)}
            {toggle('sendDeck', 'Attach your company deck', sendDeck, setSendDeck)}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 flex items-center gap-1"><Paperclip size={12} />Attachments <span className="font-normal text-gray-400">(optional · max 10, 10 MB each, 15 MB total)</span></p>
            <label className="mt-1 flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500 cursor-pointer hover:border-indigo-400 hover:text-indigo-600"
              onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}>
              <Paperclip size={13} />Choose files or drop them here
              <input type="file" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
            </label>
            {files.some((_, i) => previews[i]) && (
              <div className="mt-2 flex flex-wrap gap-2">
                {files.map((f, i) => previews[i] && (
                  <div key={`${f.name}-${i}`} className="relative group w-20">
                    <button onClick={() => setPreviewIdx(i)} className="block w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 hover:ring-2 hover:ring-indigo-400" title={`Preview ${f.name}`}>
                      <img src={previews[i]} alt={f.name} className="w-full h-full object-cover" />
                    </button>
                    <button onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-white border border-gray-300 text-gray-500 hover:text-red-600 hover:border-red-300 shadow-sm"><X size={11} /></button>
                    <p className="mt-0.5 text-[10px] text-gray-500 truncate" title={f.name}>{f.name}</p>
                    <p className="text-[10px] text-gray-400">{fmtSize(f.size)}</p>
                  </div>
                ))}
              </div>
            )}
            {files.some((_, i) => !previews[i]) && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => !previews[i] && (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 px-2 py-1 bg-gray-50 border border-gray-100 rounded-md text-xs">
                    <span className="truncate text-gray-700">{f.name}</span>
                    <span className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-gray-400">{fmtSize(f.size)}</span>
                      <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500" aria-label={`Remove ${f.name}`}><X size={12} /></button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {files.length > 0 && <p className="text-[11px] text-gray-500 mt-1">{files.length} file{files.length > 1 ? 's' : ''} · {fmtSize(totalBytes)} — sent as multipart/form-data</p>}
            {previewIdx !== null && previews[previewIdx] && (
              <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewIdx(null)}>
                <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
                  <img src={previews[previewIdx]} alt={files[previewIdx].name} className="max-h-[80vh] w-auto mx-auto rounded-lg shadow-xl bg-white" />
                  <div className="mt-2 flex items-center justify-center gap-3 text-sm text-white">
                    <span className="truncate">{files[previewIdx].name} · {fmtSize(files[previewIdx].size)}</span>
                    <button onClick={() => removeFile(previewIdx)} className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-xs font-semibold">Remove</button>
                    <button onClick={() => setPreviewIdx(null)} className="px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 text-xs font-semibold">Close</button>
                  </div>
                </div>
              </div>
            )}
            <textarea value={fileUrls} onChange={e => setFileUrls(e.target.value)} rows={1}
              placeholder="…or file URLs we download (one per line)"
              className="mt-2 w-full px-3 py-1.5 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            {fileError && <p className="text-[11px] text-red-600 mt-1">{fileError}</p>}
          </div>
          <label className="block text-xs font-semibold text-gray-600">Schedule <span className="font-normal text-gray-400">(optional, sends later)</span>
            <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </label>

          <button onClick={runTest} disabled={sending || !apiKey.trim() || !to.trim() || !subject.trim() || !html.trim() || !!fileError}
            title={!apiKey.trim() ? 'Add an API key first' : !to.trim() ? 'Add a recipient' : undefined}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400">
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {scheduleAt ? 'Schedule test email' : 'Send test request'}
          </button>
          <p className="text-[11px] text-gray-400 -mt-1">This sends a real email through your connected mailbox and counts like any API send.</p>
        </div>

        {/* Code + response */}
        <div className="p-5 space-y-3 bg-slate-50/50">
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
              <div className="flex items-center gap-1">
                <Code2 size={13} className="text-slate-400 mr-1" />
                {([['curl', 'cURL'], ['js', 'JavaScript'], ['python', 'Python']] as [Lang, string][]).map(([id, label]) => (
                  <button key={id} onClick={() => setLang(id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold ${lang === id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <CopyBtn text={code[lang]} />
            </div>
            <pre className="p-3 text-[11.5px] leading-5 text-slate-200 font-mono overflow-x-auto max-h-80">{code[lang]}</pre>
          </div>
          {!showKey && apiKey && <p className="text-[11px] text-gray-400 -mt-1">Your key is hidden in the code; click the eye icon to include it.</p>}

          <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-600">Response</span>
              {result && (
                <span className={`text-[11px] font-mono font-semibold ${result.status >= 200 && result.status < 300 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.status ? `HTTP ${result.status}` : 'Network error'} · {result.ms} ms
                </span>
              )}
            </div>
            <pre className="p-3 text-[11.5px] leading-5 font-mono text-gray-700 overflow-x-auto max-h-60 min-h-[64px]">
              {result ? result.body : 'Send a test request to see the API response here.'}
            </pre>
          </div>

          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer font-semibold">Request fields</summary>
            <ul className="mt-2 space-y-1 list-disc pl-5">
              <li><code>email</code> one recipient, or <code>contacts</code>: up to 50 <code>{'{ email, name }'}</code></li>
              <li><code>message.subject</code>, <code>message.bodyHtml</code> (required), <code>message.bodyText</code> (optional); <code>{'{{name}}'}</code> is filled per contact</li>
              <li><code>tracking</code>, <code>attachSig</code>, <code>sendDeck</code>: all off unless set to <code>true</code></li>
              <li><code>attachments</code>: <code>{'{ filename, content (base64) }'}</code> or <code>{'{ url }'}</code>, or upload files with <code>multipart/form-data</code> (field <code>attachments</code>, JSON in <code>payload</code>)</li>
              <li><code>schedule_at</code>: ISO 8601 time at least 30 seconds ahead</li>
              <li>Header <code>X-API-Key</code> is required. Responses: <code>sent</code>, <code>failed</code>, <code>total</code>, <code>errors</code>, <code>tracking</code>, <code>attachments</code></li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
