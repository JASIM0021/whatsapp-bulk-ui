import { useState } from 'react';
import {
  Loader2, Copy, Check, ExternalLink, Code2, Globe,
  ToggleLeft, ToggleRight, AlertCircle, FlaskConical,
  CheckCircle2, XCircle, RefreshCw, Trash2, ScanLine,
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS, WIDGET_BASE_URL } from '@/config/api';
import { SEOSessionHook } from '@/hooks/useSEOSession';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  session: SEOSessionHook;
}

type Framework = 'html' | 'react' | 'wordpress';

type VerifyState =
  | { status: 'idle' }
  | { status: 'testing' }
  | { status: 'success'; pageCount: number; domain?: string; lastSeenAt?: string }
  | { status: 'failed' };

const BACKEND_URL = WIDGET_BASE_URL || 'https://bulksenderapi.todayintech.in';

export function SEOSetupTab({ session }: Props) {
  const { user } = useAuth();
  const [siteName, setSiteName] = useState(session.config?.siteName || '');
  const [sitemapUrl, setSitemapUrl] = useState(session.config?.sitemapUrl || '');
  const [isEnabled, setIsEnabled] = useState(session.config?.isEnabled ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fw, setFw] = useState<Framework>('html');
  const [verify, setVerify] = useState<VerifyState>({ status: 'idle' });
  const [clearing, setClearing] = useState(false);
  const [clearMsg, setClearMsg] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const [scanLogs, setScanLogs] = useState<string[]>([]);

  const apiKey = (user as any)?.apiKey || 'YOUR_API_KEY';
  const scriptSrc = `${BACKEND_URL}/api/seo/script?apikey=${apiKey}`;

  const snippets: Record<Framework, string> = {
    html: `<!-- SEO Extension by botx — add inside <head> -->
<script src="${scriptSrc}" async></script>`,
    react: `// In your root layout component (e.g. _app.tsx or layout.tsx)
import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    const s = document.createElement('script');
    s.src = '${scriptSrc}';
    s.async = true;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);
  return <>{children}</>;
}`,
    wordpress: `<?php
// Add to your theme's functions.php
function botx_seo_script() {
  echo '<script src="${scriptSrc}" async></script>';
}
add_action('wp_head', 'botx_seo_script');`,
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) return;
    setError('');
    setSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.seo.config, {
        method: 'POST',
        body: JSON.stringify({ siteName: siteName.trim(), isEnabled, sitemapUrl: sitemapUrl.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to save');
        return;
      }
      await session.refresh();
      setSaved(true);
      setScanning(true);
      setTimeout(() => setSaved(false), 3000);
      // Backend crawls async — give it ~15s then refresh to show new data
      setTimeout(async () => {
        await session.refresh();
        setScanning(false);
      }, 15000);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const copySnippet = async () => {
    await navigator.clipboard.writeText(snippets[fw]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTest = async () => {
    setVerify({ status: 'testing' });
    try {
      const res = await apiFetch(API_ENDPOINTS.seo.verify);
      const data = await res.json();
      if (data.success && data.data?.verified) {
        setVerify({
          status: 'success',
          pageCount: data.data.pageCount,
          domain: data.data.domain,
          lastSeenAt: data.data.lastSeenAt,
        });
        // Refresh session so domain badge updates
        session.refresh();
      } else {
        setVerify({ status: 'failed' });
      }
    } catch {
      setVerify({ status: 'failed' });
    }
  };

  const handleClear = async () => {
    if (!window.confirm('This will permanently delete all tracked page data for your site. Continue?')) return;
    setClearing(true);
    setClearMsg('');
    try {
      const res = await apiFetch(API_ENDPOINTS.seo.resetData, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setClearMsg(`Cleared ${data.deleted} page${data.deleted !== 1 ? 's' : ''}`);
        setVerify({ status: 'idle' });
        await session.refresh();
        setTimeout(() => setClearMsg(''), 4000);
      } else {
        setClearMsg('Failed to clear data');
      }
    } catch {
      setClearMsg('Network error');
    } finally {
      setClearing(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    setScanMsg('Starting crawl…');
    setScanLogs([]);
    try {
      const res = await apiFetch(API_ENDPOINTS.seo.scan, { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        setScanMsg(data.error || 'Failed to start scan');
        setScanning(false);
        return;
      }
      // Open SSE stream for live logs
      const token = localStorage.getItem('auth_token');
      const es = new EventSource(`${API_ENDPOINTS.seo.scanStream}?token=${token}`);
      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.done) {
            es.close();
            setScanMsg('Scan complete');
            setScanning(false);
            session.refresh();
          } else if (payload.msg) {
            setScanLogs(prev => [...prev, payload.msg]);
          }
        } catch {}
      };
      es.onerror = () => {
        es.close();
        setScanMsg('Scan finished');
        setScanning(false);
        session.refresh();
      };
    } catch {
      setScanMsg('Network error');
      setScanning(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">

      {/* Site config */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4">Site Configuration</h3>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Site URL</label>
            <input
              type="url"
              value={siteName}
              onChange={e => setSiteName(e.target.value)}
              placeholder="https://www.yoursite.com"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Sitemap URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="url"
              value={sitemapUrl}
              onChange={e => setSitemapUrl(e.target.value)}
              placeholder="https://www.yoursite.com/sitemap.xml"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">Helps the crawler discover all your pages faster. Leave blank for auto-detection.</p>
          </div>

          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-800">Enable tracking</p>
              <p className="text-xs text-gray-500 mt-0.5">Pause collection without removing the script</p>
            </div>
            <button type="button" onClick={() => setIsEnabled(v => !v)}>
              {isEnabled
                ? <ToggleRight size={32} className="text-emerald-500" />
                : <ToggleLeft size={32} className="text-gray-300" />
              }
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={saving || !siteName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : null}
              {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Configuration'}
            </button>
            <button
              type="button"
              onClick={handleScan}
              disabled={scanning || !session.config?.siteName}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              title="Re-crawl your site to discover all pages"
            >
              {scanning ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />}
              {scanning ? 'Scanning…' : 'Scan Now'}
            </button>
          </div>
        </form>

        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {(scanning || scanMsg) && (
            <div className={`flex items-center gap-2 text-xs rounded-xl px-3 py-2.5 border ${
              scanning
                ? 'text-blue-600 bg-blue-50 border-blue-100'
                : 'text-emerald-700 bg-emerald-50 border-emerald-100'
            }`}>
              {scanning && <Loader2 size={12} className="animate-spin flex-shrink-0" />}
              <span>{scanMsg}</span>
            </div>
          )}
          {!scanning && session.config?.domain && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
              <Globe size={13} className="text-emerald-500 flex-shrink-0" />
              <span>Detected domain: <strong className="text-gray-700">{session.config.domain}</strong></span>
            </div>
          )}
          <button
            type="button"
            onClick={handleClear}
            disabled={clearing}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-semibold transition-colors disabled:opacity-50"
            title="Delete all tracked page data and start fresh"
          >
            {clearing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {clearing ? 'Clearing…' : 'Clear tracking data'}
          </button>
          {clearMsg && (
            <span className="text-xs font-semibold text-emerald-600">{clearMsg}</span>
          )}
        </div>
      </div>

      {/* Live scan log terminal */}
      {(scanning || scanLogs.length > 0) && (
        <div className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <ScanLine size={14} className="text-blue-400" />
              <span className="text-xs font-semibold text-gray-300">Crawl Log</span>
              {scanning && (
                <span className="flex items-center gap-1.5 text-xs text-blue-400">
                  <Loader2 size={11} className="animate-spin" />
                  Live
                </span>
              )}
              {!scanning && (
                <span className="text-xs text-emerald-400 font-semibold">Done</span>
              )}
            </div>
            <button
              onClick={() => { setScanLogs([]); setScanMsg(''); }}
              className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="p-4 font-mono text-xs text-gray-300 max-h-64 overflow-y-auto space-y-0.5">
            {scanLogs.map((line, i) => (
              <div key={i} className={
                line.startsWith('  ✓') ? 'text-emerald-400' :
                line.startsWith('  ✗') ? 'text-red-400' :
                line.startsWith('Crawl complete') ? 'text-emerald-300 font-semibold' :
                line.startsWith('Starting') ? 'text-blue-300 font-semibold' :
                line.startsWith('[') ? 'text-gray-200' :
                'text-gray-400'
              }>{line}</div>
            ))}
            {scanning && scanLogs.length === 0 && (
              <div className="text-gray-500 animate-pulse">Connecting to crawler…</div>
            )}
          </div>
        </div>
      )}

      {/* Embed script */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Code2 size={18} className="text-emerald-600" />
          <h3 className="text-base font-bold text-gray-900">Embed Script</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Copy the snippet below and paste it in your website. It collects SEO data and Core Web Vitals silently on every page load — no visible widget.
        </p>

        {/* Framework tabs */}
        <div className="flex gap-1 mb-3 bg-gray-100 rounded-xl p-1 w-fit">
          {(['html', 'react', 'wordpress'] as Framework[]).map(f => (
            <button
              key={f}
              onClick={() => setFw(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                fw === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f === 'react' ? 'React / Next.js' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap">
            {snippets[fw]}
          </pre>
          <button
            onClick={copySnippet}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-semibold transition-colors"
          >
            {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-500 flex items-center gap-1.5">
          <ExternalLink size={11} />
          The script is ~3 KB, runs invisibly, and does not affect your page performance.
        </p>
      </div>

      {/* Test Connection */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <FlaskConical size={18} className="text-violet-500" />
          <h3 className="text-base font-bold text-gray-900">Test Connection</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          After adding the script to your site, open any page on your website in a browser, then click the button below to verify the data is reaching this platform.
        </p>

        <button
          onClick={handleTest}
          disabled={verify.status === 'testing'}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {verify.status === 'testing'
            ? <><Loader2 size={15} className="animate-spin" />Testing…</>
            : verify.status !== 'idle'
            ? <><RefreshCw size={14} />Test Again</>
            : <><FlaskConical size={15} />Test Script Installation</>
          }
        </button>

        {/* Result */}
        {verify.status === 'success' && (
          <div className="mt-4 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Script detected — connection successful!</p>
              <div className="mt-1.5 space-y-0.5 text-xs text-emerald-700">
                <p><span className="font-semibold">{verify.pageCount}</span> page{verify.pageCount !== 1 ? 's' : ''} tracked so far</p>
                {verify.domain && <p>Domain: <span className="font-semibold font-mono">{verify.domain}</span></p>}
                {verify.lastSeenAt && (
                  <p>Last beacon: <span className="font-semibold">{new Date(verify.lastSeenAt).toLocaleString()}</span></p>
                )}
              </div>
            </div>
          </div>
        )}

        {verify.status === 'failed' && (
          <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <XCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">No data received yet</p>
              <ul className="mt-1.5 space-y-1 text-xs text-amber-700 list-disc list-inside">
                <li>Make sure the script tag is inside <code className="bg-amber-100 px-1 rounded">&lt;head&gt;</code> on every page</li>
                <li>Open your website in a new browser tab (not this dashboard)</li>
                <li>Wait a few seconds for the beacon to fire, then test again</li>
                <li>Check your browser console for any script loading errors</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Active status banner */}
      {session.isSetup && verify.status !== 'success' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">✓</div>
            <div>
              <p className="text-sm font-bold text-emerald-800">SEO tracking is configured</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {session.config?.domain
                  ? `Monitoring ${session.config.domain} — click "Test Script Installation" to verify.`
                  : 'Paste the script in your site, visit a page, then click the test button above.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
