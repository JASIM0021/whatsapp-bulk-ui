import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, Copy, Check, ExternalLink } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-500">{label}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-3 text-xs text-gray-700 overflow-x-auto font-mono leading-relaxed bg-white whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  );
}

export function SEOTagManagerTab() {
  const [containerId, setContainerId] = useState('');
  const [savedId, setSavedId] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ isVerified: boolean; message: string } | null>(null);

  useEffect(() => {
    apiFetch(API_ENDPOINTS.seo.gtm)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          setSavedId(json.data.containerId || '');
          setContainerId(json.data.containerId || '');
          setDomain(json.data.domain || '');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const id = containerId.trim().toUpperCase();
    if (id && !/^GTM-[A-Z0-9]{4,10}$/.test(id)) {
      setSaveMsg('Invalid format — use GTM-XXXXXX');
      setTimeout(() => setSaveMsg(''), 3000);
      return;
    }
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await apiFetch(API_ENDPOINTS.seo.gtm, {
        method: 'POST',
        body: JSON.stringify({ containerId: id }),
      });
      const json = await res.json();
      if (json.success) {
        setSavedId(id);
        setSaveMsg('Saved');
        setVerifyResult(null);
      } else {
        setSaveMsg(json.error || 'Save failed');
      }
    } catch {
      setSaveMsg('Network error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.seo.gtmVerify, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        setVerifyResult({ isVerified: json.data.isVerified, message: json.data.message });
        if (json.data.domain) setDomain(json.data.domain);
      } else {
        setVerifyResult({ isVerified: false, message: json.error || 'Verification failed' });
      }
    } catch {
      setVerifyResult({ isVerified: false, message: 'Network error' });
    } finally {
      setVerifying(false);
    }
  };

  const headScript = savedId
    ? `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${savedId}');</script>
<!-- End Google Tag Manager -->`
    : '';

  const bodyScript = savedId
    ? `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${savedId}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`
    : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">

      {/* Container ID card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Google Tag Manager</h3>
            <p className="text-xs text-gray-400 mt-0.5">Manage all your tags from one place</p>
          </div>
          {savedId && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={12} /> Connected
            </span>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Container ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={containerId}
              onChange={e => setContainerId(e.target.value.toUpperCase())}
              placeholder="GTM-XXXXXX"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
            <button
              onClick={handleSave}
              disabled={saving || !containerId.trim()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
            </button>
          </div>
          {saveMsg && (
            <p className={`text-xs mt-1.5 font-semibold ${saveMsg === 'Saved' ? 'text-emerald-600' : 'text-red-500'}`}>
              {saveMsg}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1.5">
            Find your Container ID in{' '}
            <a
              href="https://tagmanager.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline inline-flex items-center gap-0.5"
            >
              Google Tag Manager <ExternalLink size={10} />
            </a>
          </p>
        </div>

        {savedId && (
          <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
            <button
              onClick={handleVerify}
              disabled={verifying || !domain}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {verifying ? <Loader2 size={14} className="animate-spin" /> : null}
              {verifying ? 'Checking…' : 'Verify Installation'}
            </button>
            {!domain && (
              <p className="text-xs text-gray-400">Visit your site first to detect the domain</p>
            )}
            {verifyResult && (
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${verifyResult.isVerified ? 'text-emerald-600' : 'text-red-500'}`}>
                {verifyResult.isVerified
                  ? <CheckCircle2 size={14} />
                  : <AlertCircle size={14} />}
                {verifyResult.message}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Script snippets */}
      {savedId && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Installation Code</h3>
            <p className="text-xs text-gray-500">Add both snippets to every page of your website</p>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">
                1. Paste inside <code className="bg-gray-100 px-1 rounded">&lt;head&gt;</code>
              </p>
              <CodeBlock code={headScript} label="Head snippet" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">
                2. Paste immediately after opening <code className="bg-gray-100 px-1 rounded">&lt;body&gt;</code>
              </p>
              <CodeBlock code={bodyScript} label="Body snippet (noscript)" />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-amber-800 mb-1">Using the botx SEO beacon through GTM?</p>
            <p className="text-xs text-amber-700">
              In GTM, create a new <strong>Custom HTML tag</strong>, paste your botx SEO beacon script, and set the trigger to <strong>All Pages</strong>.
              This keeps everything managed through one tag container.
            </p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!savedId && (
        <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500">Enter your GTM Container ID above to see installation instructions</p>
        </div>
      )}
    </div>
  );
}
