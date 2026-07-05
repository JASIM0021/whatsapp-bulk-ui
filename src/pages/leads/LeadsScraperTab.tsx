import { useState, useEffect, useCallback } from 'react';
import { Download, Key, Copy, Check, RefreshCw, Chrome, Github, Zap, AlertCircle, Globe } from 'lucide-react';
import { API_ENDPOINTS, apiFetch } from '@/config/api';

function ServerUrlCopy() {
  const [copied, setCopied] = useState(false);
  const url = window.location.origin;
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2">
      <Globe size={13} className="text-blue-500 flex-shrink-0" />
      <code className="flex-1 text-xs font-mono bg-white border border-blue-200 rounded px-2 py-1.5 truncate text-blue-900">{url}</code>
      <button
        onClick={copy}
        className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex-shrink-0"
        title="Copy server URL"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
}

interface APIKey {
  id: string;
  name: string;
  key?: string;
  maskedKey?: string;
  createdAt: string;
}

interface LeadStats {
  todayCount: number;
  dailyLimit: number;
  totalCount: number;
  totalLimit: number; // -1 = unlimited
}

const GITHUB_ZIP_URL = 'https://github.com/nexbotix/leads-extension/releases/latest/download/nexbotix-leads-extension.zip';

export function LeadsScraperTab() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [newKey, setNewKey] = useState<APIKey | null>(null);
  const [copied, setCopied] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.apiKeys.list);
      const data = await res.json();
      if (data.success) setApiKeys(data.data || []);
    } catch {}
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.leads.stats);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {} finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
    fetchStats();
  }, [fetchKeys, fetchStats]);

  const createKey = async () => {
    setCreatingKey(true);
    setError(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.apiKeys.create, {
        method: 'POST',
        body: JSON.stringify({ name: 'Leads Extension' }),
      });
      const data = await res.json();
      if (data.success) {
        setNewKey(data.data);
        fetchKeys();
      } else {
        setError(data.error || 'Failed to create key');
      }
    } catch {
      setError('Network error');
    } finally {
      setCreatingKey(false);
    }
  };

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quotaPct = stats && stats.dailyLimit > 0
    ? Math.min(100, Math.round(stats.todayCount / stats.dailyLimit * 100))
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Usage Stats */}
      {stats && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Today's Usage</h3>
            <button onClick={fetchStats} className="text-gray-400 hover:text-gray-600 transition-colors" title="Refresh">
              <RefreshCw size={14} className={statsLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>{stats.todayCount} leads ingested today</span>
            <span className="font-medium text-gray-700">{stats.todayCount} / {stats.dailyLimit}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${quotaPct >= 90 ? 'bg-red-500' : 'bg-amber-500'}`}
              style={{ width: `${quotaPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Total stored: <strong className="text-gray-600">{stats.totalCount}</strong></span>
            <span>{stats.totalLimit === -1 ? '✓ Unlimited (Pro)' : `Limit: ${stats.totalLimit}`}</span>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-4">
        {/* Step 1 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center flex-shrink-0">1</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1">Download the Extension</h3>
              <p className="text-sm text-gray-500 mb-3">Download the NexBotix Leads Extension for Chrome.</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={GITHUB_ZIP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Download size={14} />
                  Download ZIP (GitHub)
                </a>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 text-sm font-semibold rounded-lg cursor-not-allowed">
                  <Chrome size={14} />
                  Chrome Web Store (coming soon)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center flex-shrink-0">2</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1">Install in Chrome</h3>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Extract the downloaded <code className="bg-gray-100 px-1 rounded text-xs">.zip</code> file to a folder</li>
                <li>Open Chrome and go to <code className="bg-gray-100 px-1 rounded text-xs">chrome://extensions</code></li>
                <li>Enable <strong>Developer Mode</strong> (top-right toggle)</li>
                <li>Click <strong>Load unpacked</strong> and select the extracted folder</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Step 3 — API Key */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center flex-shrink-0">3</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1">Get Your API Key</h3>
              <p className="text-sm text-gray-500 mb-3">Create an API key to connect the extension to your account.</p>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                  <AlertCircle size={12} />
                  {error}
                </div>
              )}

              {newKey?.key && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 mb-3">
                  <p className="text-xs text-green-700 font-semibold mb-1.5">Key created — copy it now, it won't be shown again:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-white border border-green-200 rounded px-2 py-1 truncate">{newKey.key}</code>
                    <button
                      onClick={() => copyKey(newKey.key!)}
                      className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex-shrink-0"
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              )}

              {apiKeys.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {apiKeys.map(k => (
                    <div key={k.id} className="flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <Key size={11} className="text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-700 mr-1">{k.name}</span>
                      <code className="text-gray-400 truncate flex-1">{k.maskedKey || '••••••••••••'}</code>
                    </div>
                  ))}
                </div>
              ) : null}

              <button
                onClick={createKey}
                disabled={creatingKey}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                <Zap size={13} />
                {creatingKey ? 'Creating...' : 'Create Key for Leads Extension'}
              </button>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center flex-shrink-0">4</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1">Configure the Extension</h3>
              <ol className="text-sm text-gray-600 space-y-1.5 list-decimal list-inside mb-4">
                <li>Click the extension icon in your Chrome toolbar</li>
                <li>Go to the <strong>NexBotix</strong> tab inside the extension</li>
                <li>Paste your <strong>API Key</strong> and the <strong>Server URL</strong> below</li>
                <li>Click <strong>Save &amp; Connect</strong> — leads sync automatically!</li>
              </ol>

              {/* Server URL copy box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-xs font-semibold text-blue-800 mb-2">Server URL — paste this into the extension:</p>
                <ServerUrlCopy />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <strong>Tip:</strong> Email &amp; WhatsApp campaigns in the extension use your NexBotix connected accounts — no extra SMTP or phone setup needed.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub link */}
      <div className="flex items-center justify-center">
        <a
          href="https://github.com/nexbotix/leads-extension"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Github size={12} />
          View on GitHub
        </a>
      </div>
    </div>
  );
}
