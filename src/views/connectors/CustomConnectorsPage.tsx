import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { CustomConnector, TestConnectorResponse } from '@/types/agent';
import {
  Cpu,
  Plus,
  Trash2,
  Zap,
  Play,
  ArrowLeft,
  Lock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export function CustomConnectorsPage() {
  const navigate = useNavigate();
  const [connectors, setConnectors] = useState<CustomConnector[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [curlInput, setCurlInput] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category] = useState('ai');
  const [method, setMethod] = useState('POST');
  const [url, setUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('{\n  "query": "{{user_query}}"\n}');
  const [isSaving, setIsSaving] = useState(false);

  // Test Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [activeConnector, setActiveConnector] = useState<CustomConnector | null>(null);
  const [testVariables, setTestVariables] = useState<string>('{\n  "user_query": "Is our contract compliant?"\n}');
  const [testResult, setTestResult] = useState<TestConnectorResponse | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.connectors.list);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setConnectors(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseCurl = async () => {
    if (!curlInput.trim()) return;
    try {
      const res = await apiFetch(API_ENDPOINTS.connectors.parseCurl, {
        method: 'POST',
        body: JSON.stringify({ curl: curlInput.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.url) setUrl(json.data.url);
        if (json.data.method) setMethod(json.data.method);
        if (json.data.authToken) setAuthToken(json.data.authToken);
        if (json.data.bodyTemplate) setBodyTemplate(json.data.bodyTemplate);
        if (!name) setName('In-House AI Connector');
      }
    } catch (e) {
      console.error('Failed to auto-detect curl:', e);
    }
  };

  const handleSaveConnector = async () => {
    if (!name.trim() || !url.trim()) {
      alert('Please provide a name and URL for the connector.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.connectors.create, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          method,
          url: url.trim(),
          authToken: authToken.trim(),
          authType: authToken.trim() ? 'bearer' : 'none',
          bodyTemplate,
          params: [],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        resetForm();
        loadConnectors();
      } else {
        alert(json.error || 'Failed to save connector');
      }
    } catch (e: any) {
      alert(e.message || 'Error saving connector');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConnector = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom connector?')) return;
    try {
      const res = await apiFetch(API_ENDPOINTS.connectors.delete(id), { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setConnectors(prev => prev.filter(c => c.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenTest = (conn: CustomConnector) => {
    setActiveConnector(conn);
    setTestResult(null);
    setTestModalOpen(true);
  };

  const handleExecuteTest = async () => {
    if (!activeConnector) return;
    setIsTesting(true);
    try {
      let parsedVars = {};
      try {
        parsedVars = JSON.parse(testVariables);
      } catch {
        parsedVars = { user_query: testVariables };
      }

      const res = await apiFetch(API_ENDPOINTS.connectors.test(activeConnector.id), {
        method: 'POST',
        body: JSON.stringify({ variables: parsedVars }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTestResult(json.data);
      } else {
        alert(json.error || 'Test execution failed');
      }
    } catch (e: any) {
      alert(e.message || 'Failed to test');
    } finally {
      setIsTesting(false);
    }
  };

  const resetForm = () => {
    setCurlInput('');
    setName('');
    setDescription('');
    setUrl('');
    setAuthToken('');
    setBodyTemplate('{\n  "query": "{{user_query}}"\n}');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/agents')}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              title="Back to Workforce"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
              <Cpu size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Custom Connectors &amp; In-House AI</h1>
              <p className="text-xs text-gray-400">Plug proprietary models, enterprise APIs, and webhooks into your AI workers</p>
            </div>
          </div>

          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-950/40 transition-all active:scale-95"
          >
            <Plus size={15} />
            <span>Register Connector</span>
          </button>
        </div>
      </header>

      {/* Main List */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {connectors.length === 0 && !isLoading ? (
          <div className="text-center py-16 bg-gray-900/40 border border-gray-800 rounded-3xl p-8 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto mb-4">
              <Cpu size={28} />
            </div>
            <h3 className="text-base font-bold text-white mb-2">No Custom Connectors Registered</h3>
            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Connect your in-house AI servers, internal CRMs, or private APIs. Simply paste your cURL command or specify the endpoint URL.
            </p>
            <button
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-md"
            >
              <Plus size={14} />
              <span>Add First Connector</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectors.map(conn => (
              <div
                key={conn.id}
                className="bg-gray-900 border border-gray-800 hover:border-teal-500/40 rounded-3xl p-6 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-xs">
                        {conn.method}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{conn.name}</h3>
                        <span className="text-[10px] text-teal-400 uppercase font-semibold">{conn.category}</span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ACTIVE
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mb-4 line-clamp-2">{conn.description || 'Custom API connector'}</p>

                  <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800 text-[11px] font-mono text-gray-300 truncate mb-4">
                    {conn.url}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenTest(conn)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Play size={13} />
                    <span>Test Sandbox</span>
                  </button>
                  <button
                    onClick={() => handleDeleteConnector(conn.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors"
                    title="Delete Connector"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── CREATE CONNECTOR MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu size={18} className="text-teal-400" />
                <h3 className="text-base font-bold text-white">Register In-House AI / Connector</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                &times;
              </button>
            </div>

            {/* Smart cURL Auto-Detector */}
            <div className="bg-gray-950 p-3.5 rounded-2xl border border-teal-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-400 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Smart cURL Auto-Detector</span>
                </span>
                <button
                  type="button"
                  onClick={handleParseCurl}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[10px] font-bold transition-colors"
                >
                  Auto-Detect
                </button>
              </div>
              <textarea
                rows={2}
                placeholder="curl -X POST https://api.mycompany.com/v1/ai -H 'Authorization: Bearer my_token' -d '{...}'"
                value={curlInput}
                onChange={e => setCurlInput(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl p-2 text-[11px] font-mono text-gray-300 focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Connector Name</label>
                <input
                  type="text"
                  placeholder="e.g. In-House Legal AI, Internal CRM Lookup"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Method</label>
                  <select
                    value={method}
                    onChange={e => setMethod(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-300 mb-1">Endpoint URL</label>
                  <input
                    type="text"
                    placeholder="https://api.yourcompany.com/predict"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center justify-between">
                  <span>Bearer Auth Token (Encrypted with AES-256)</span>
                  <Lock size={12} className="text-emerald-400" />
                </label>
                <input
                  type="password"
                  placeholder="Secret token or API key"
                  value={authToken}
                  onChange={e => setAuthToken(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">JSON Payload Template</label>
                <textarea
                  rows={4}
                  value={bodyTemplate}
                  onChange={e => setBodyTemplate(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs font-mono text-gray-200 focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConnector}
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-teal-950/40 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Zap size={13} />}
                <span>{isSaving ? 'Saving...' : 'Save Connector'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEST SANDBOX MODAL ── */}
      {testModalOpen && activeConnector && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Play size={16} className="text-teal-400" />
                <h3 className="text-base font-bold text-white">Test Sandbox: {activeConnector.name}</h3>
              </div>
              <button onClick={() => setTestModalOpen(false)} className="text-gray-400 hover:text-white">
                &times;
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Test Dynamic Variables (JSON)</label>
              <textarea
                rows={3}
                value={testVariables}
                onChange={e => setTestVariables(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs font-mono text-gray-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              onClick={handleExecuteTest}
              disabled={isTesting}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
              <span>{isTesting ? 'Sending Request...' : 'Send Live Request'}</span>
            </button>

            {testResult && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Response Status</span>
                  <span className={`font-bold ${testResult.statusCode === 200 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    HTTP {testResult.statusCode} ({testResult.durationMs}ms)
                  </span>
                </div>
                <div className="bg-gray-950 border border-gray-800 p-3 rounded-xl max-h-48 overflow-y-auto font-mono text-[11px] text-gray-300">
                  {testResult.rawResponse || testResult.error || 'Empty response'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
