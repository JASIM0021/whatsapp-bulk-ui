import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, API_ENDPOINTS, WIDGET_BASE_URL } from '@/config/api';
import { Globe, Loader2, Save, RefreshCw, Copy, Check, Users, ArrowLeft, Bot, MessageSquare, ShieldCheck, Mail, Palette, Layout, MessageCircle, Info, Cpu, Play, Plus, Trash2, Code, Terminal, Lock, Sparkles, CheckCircle2 } from 'lucide-react';
import { WebsiteChatbotLeadsPage } from './WebsiteChatbotLeadsPage';

export interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  suggestedResponsePath?: string;
}

export function parseCurlCommand(rawCurl: string): ParsedCurl {
  // Normalize line continuations
  const cmd = rawCurl.replace(/\\\r?\n/g, ' ').trim();
  
  let method = 'POST';
  let url = '';
  const headers: Record<string, string> = {};
  let body = '';

  // Match method if explicitly specified
  const methodMatch = cmd.match(/(?:-X|--request)\s+['"]?([A-Z]+)['"]?/i);
  if (methodMatch) {
    method = methodMatch[1].toUpperCase();
  }

  // Match URL: Look for --url <url> or first standalone http(s):// url
  const urlMatch = cmd.match(/(?:--url\s+['"]?([^\s'"]+)['"]?)|['"]?(https?:\/\/[^\s'"]+)['"]?/i);
  if (urlMatch) {
    url = urlMatch[1] || urlMatch[2] || '';
  }

  // Match headers: -H "Key: Value" or -H 'Key: Value' or --header "..."
  const headerRegex = /(?:-H|--header)\s+(?:'([^']*)'|"([^"]*)"|([^\s]+))/g;
  let hMatch;
  while ((hMatch = headerRegex.exec(cmd)) !== null) {
    const headerStr = hMatch[1] ?? hMatch[2] ?? hMatch[3] ?? '';
    const colonIdx = headerStr.indexOf(':');
    if (colonIdx > 0) {
      const k = headerStr.substring(0, colonIdx).trim();
      const v = headerStr.substring(colonIdx + 1).trim();
      if (k) headers[k] = v;
    }
  }

  // Match body: -d, --data, --data-raw, --data-binary, --json
  const dataRegex = /(?:-d|--data|--data-raw|--data-binary|--json)\s+(?:'([\s\S]*?)'(?=\s+-[a-zA-Z]|\s*$)|"([\s\S]*?)"(?=\s+-[a-zA-Z]|\s*$)|\$?'([\s\S]*?)'(?=\s+-[a-zA-Z]|\s*$))/;
  const dataMatch = cmd.match(dataRegex);
  if (dataMatch) {
    body = (dataMatch[1] ?? dataMatch[2] ?? dataMatch[3] ?? '').trim();
  } else {
    // Fallback for non-space body
    const fallbackMatch = cmd.match(/(?:-d|--data|--data-raw|--data-binary|--json)\s+([^\s].*?)(?=(?:\s+-[a-zA-Z]|\s*$))/);
    if (fallbackMatch) {
      body = fallbackMatch[1].trim().replace(/^['"]|['"]$/g, '');
    }
  }

  // If method was not specified and body exists, default to POST
  if (!methodMatch && body) {
    method = 'POST';
  } else if (!methodMatch && !body) {
    method = 'GET';
  }

  let templatedBody = body;
  let suggestedResponsePath = 'reply';

  if (body) {
    try {
      const parsed = JSON.parse(body);
      let replaced = false;

      // Check for OpenAI messages structure
      if (Array.isArray(parsed.messages)) {
        for (const msg of parsed.messages) {
          if (msg.role === 'user') {
            msg.content = '{{message}}';
            replaced = true;
          }
        }
        suggestedResponsePath = 'choices[0].message.content';
      }

      // Check common query / prompt keys
      if (!replaced && typeof parsed === 'object' && parsed !== null) {
        const queryKeys = ['prompt', 'query', 'question', 'message', 'legalQuery', 'text', 'input', 'user_input', 'content'];
        for (const key of Object.keys(parsed)) {
          if (queryKeys.includes(key) && typeof parsed[key] === 'string') {
            parsed[key] = '{{message}}';
            replaced = true;
            if (key === 'legalQuery' || key === 'query') {
              suggestedResponsePath = 'data.answer';
            } else if (key === 'question' || key === 'prompt') {
              suggestedResponsePath = 'answer';
            }
            break;
          }
        }
      }

      templatedBody = JSON.stringify(parsed, null, 2);
    } catch {
      // Not JSON or has syntax idiosyncrasies
    }
  }

  return {
    url,
    method,
    headers,
    body: templatedBody,
    suggestedResponsePath,
  };
}

interface ChatbotConfig {
  id?: string;
  businessName: string;
  description: string;
  websiteUrl: string;
  services: string[];
  primaryColor: string;
  iconColor: string;
  position: string;
  widgetSize: string;
  welcomeMessage: string;
  whitelistedDomains: string[];
  enableLeadCapture: boolean;
  leadEmailTo: string;
  leadWhatsAppTo: string;
  leadWebhookURL: string;
  customSystemPrompt: string;
  customAiEnabled: boolean;
  customAiEndpoint: string;
  customAiMethod: string;
  customAiHeaders?: Record<string, string>;
  customAiPayloadTemplate: string;
  customAiResponsePath: string;
  customAiFallbackToDefault: boolean;
  customAiTimeoutSeconds: number;
  isEnabled: boolean;
  isPublished: boolean;
}

const DEFAULT: ChatbotConfig = {
  businessName: '', description: '', websiteUrl: '', services: [],
  primaryColor: '#16a34a', iconColor: '#ffffff', position: 'bottom-right',
  widgetSize: 'medium', welcomeMessage: 'Hi! How can I help you today?',
  whitelistedDomains: [], enableLeadCapture: true, leadEmailTo: '',
  leadWhatsAppTo: '', leadWebhookURL: '', customSystemPrompt: '',
  customAiEnabled: false,
  customAiEndpoint: '',
  customAiMethod: 'POST',
  customAiHeaders: {},
  customAiPayloadTemplate: '',
  customAiResponsePath: '',
  customAiFallbackToDefault: true,
  customAiTimeoutSeconds: 15,
  isEnabled: true,
  isPublished: false,
};

export function WebsiteChatbotSetupPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ChatbotConfig>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [serviceInput, setServiceInput] = useState('');
  const [activeTab, setActiveTab] = useState<'setup' | 'customize' | 'leads' | 'embed'>('setup');
  const [embedPlatform, setEmbedPlatform] = useState<'html' | 'react' | 'agent'>('html');

  // In-House Custom AI State
  const [curlInput, setCurlInput] = useState('');
  const [curlImportSuccess, setCurlImportSuccess] = useState<string | null>(null);
  const [curlImportError, setCurlImportError] = useState<string | null>(null);
  const [headerKeyInput, setHeaderKeyInput] = useState('');
  const [headerValInput, setHeaderValInput] = useState('');
  const [testQuery, setTestQuery] = useState('What are the legal compliance steps for our new contract?');
  const [testingCustomAi, setTestingCustomAi] = useState(false);
  const [customAiTestResult, setCustomAiTestResult] = useState<any>(null);
  const [showPayloadDetails, setShowPayloadDetails] = useState(false);

  const BASE = WIDGET_BASE_URL;
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.websiteChatbot.config);
        const d = await res.json();
        if (d.success && d.data) setConfig(d.data);
      } catch { /* no config yet */ }
      // Get API key
      try {
        const r = await apiFetch(API_ENDPOINTS.apiKeys.list);
        const d = await r.json();
        // handle both {data: [...]} and {data: {keys: [...]}}
        const keys = Array.isArray(d.data) ? d.data : (d.data?.keys ?? []);
        if (keys.length > 0) setApiKey(keys[0].key || keys[0].apiKey || '');
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      // Always sync isPublished with isEnabled
      const payload = { ...config, isPublished: config.isEnabled };
      const res = await apiFetch(API_ENDPOINTS.websiteChatbot.config, {
        method: 'POST', body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (d.success) { setConfig(d.data || payload); setSaved(true); setTimeout(() => setSaved(false), 2000); }
      else alert(d.error || 'Failed to save');
    } catch { alert('Failed to save'); }
    finally { setSaving(false); }
  };

  const crawl = async () => {
    if (!config.websiteUrl) { alert('Enter a website URL first'); return; }
    setCrawling(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.websiteChatbot.crawl, {
        method: 'POST', body: JSON.stringify({ url: config.websiteUrl }),
      });
      const d = await res.json();
      if (d.success && d.data) {
        setConfig(prev => ({
          ...prev,
          businessName: d.data.businessName || prev.businessName,
          description: d.data.description || prev.description,
          services: d.data.services?.length ? d.data.services : prev.services,
        }));
      } else alert(d.error || 'Crawl failed');
    } catch { alert('Crawl failed'); }
    finally { setCrawling(false); }
  };

  const crawlText = crawling ? 'Crawling full domain...' : 'Crawl Website';

  const scriptTag = `<script src="${BASE}/api/website-chatbot/script?apikey=${apiKey || 'YOUR_API_KEY'}"></script>`;

  const copyScript = () => {
    navigator.clipboard.writeText(scriptTag);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const addDomain = () => {
    const d = domainInput.trim();
    if (d && !config.whitelistedDomains.includes(d)) {
      setConfig(p => ({ ...p, whitelistedDomains: [...p.whitelistedDomains, d] }));
    }
    setDomainInput('');
  };

  const addService = () => {
    const s = serviceInput.trim();
    if (s && !config.services.includes(s)) setConfig(p => ({ ...p, services: [...p.services, s] }));
    setServiceInput('');
  };

  const addHeader = () => {
    const k = headerKeyInput.trim();
    const v = headerValInput.trim();
    if (k) {
      setConfig(p => ({
        ...p,
        customAiHeaders: { ...(p.customAiHeaders || {}), [k]: v },
      }));
      setHeaderKeyInput('');
      setHeaderValInput('');
    }
  };

  const removeHeader = (keyToRemove: string) => {
    setConfig(p => {
      const headers = { ...(p.customAiHeaders || {}) };
      delete headers[keyToRemove];
      return { ...p, customAiHeaders: headers };
    });
  };

  const applyPayloadPreset = (preset: 'standard' | 'openai' | 'simple' | 'legal') => {
    if (preset === 'standard') {
      setConfig(p => ({
        ...p,
        customAiPayloadTemplate: JSON.stringify({
          message: "{{message}}",
          sessionId: "{{sessionId}}",
          chatHistory: "{{chatHistory}}",
          businessName: "{{businessName}}"
        }, null, 2),
        customAiResponsePath: 'reply',
      }));
    } else if (preset === 'openai') {
      setConfig(p => ({
        ...p,
        customAiPayloadTemplate: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a specialized legal assistant." },
            { role: "user", content: "{{message}}" }
          ],
          temperature: 0.7
        }, null, 2),
        customAiResponsePath: 'choices[0].message.content',
      }));
    } else if (preset === 'simple') {
      setConfig(p => ({
        ...p,
        customAiPayloadTemplate: JSON.stringify({
          query: "{{message}}"
        }, null, 2),
        customAiResponsePath: 'answer',
      }));
    } else if (preset === 'legal') {
      setConfig(p => ({
        ...p,
        customAiPayloadTemplate: JSON.stringify({
          legalQuery: "{{message}}",
          sessionId: "{{sessionId}}",
          context: "Website Legal Consultation Bot",
          history: "{{chatHistory}}"
        }, null, 2),
        customAiResponsePath: 'data.answer',
      }));
    }
  };

  const handleParseAndImportCurl = (rawCurl: string) => {
    if (!rawCurl.trim()) {
      setCurlImportError('Please paste a valid cURL command.');
      return;
    }
    try {
      const parsed = parseCurlCommand(rawCurl);
      if (!parsed.url) {
        setCurlImportError('Could not detect a valid URL in the cURL command. Make sure it contains an http:// or https:// address.');
        return;
      }

      const headerCount = Object.keys(parsed.headers).length;

      setConfig(prev => ({
        ...prev,
        customAiEndpoint: parsed.url,
        customAiMethod: parsed.method,
        customAiHeaders: {
          ...(prev.customAiHeaders || {}),
          ...parsed.headers,
        },
        customAiPayloadTemplate: parsed.body || prev.customAiPayloadTemplate,
        customAiResponsePath: parsed.suggestedResponsePath || prev.customAiResponsePath || 'reply',
      }));

      setCurlImportError(null);
      setCurlImportSuccess(
        `Auto-detected ${parsed.method} ${parsed.url} with ${headerCount} header${headerCount === 1 ? '' : 's'}${parsed.body ? ' and payload template' : ''}.`
      );
    } catch (err: any) {
      setCurlImportError(`Failed to parse cURL command: ${err?.message || 'Invalid syntax'}`);
    }
  };

  const testInHouseAi = async () => {
    if (!config.customAiEndpoint) {
      alert('Please enter your in-house AI endpoint URL first.');
      return;
    }
    setTestingCustomAi(true);
    setCustomAiTestResult(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.websiteChatbot.testCustomAi, {
        method: 'POST',
        body: JSON.stringify({
          customAiEndpoint: config.customAiEndpoint,
          customAiMethod: config.customAiMethod || 'POST',
          customAiHeaders: config.customAiHeaders || {},
          customAiPayloadTemplate: config.customAiPayloadTemplate,
          customAiResponsePath: config.customAiResponsePath,
          testMessage: testQuery,
        }),
      });
      const d = await res.json();
      if (d.success && d.data) {
        setCustomAiTestResult(d.data);
      } else {
        setCustomAiTestResult({
          success: false,
          error: d.error || 'Failed to connect to in-house AI',
        });
      }
    } catch (err: any) {
      setCustomAiTestResult({
        success: false,
        error: err?.message || 'Network error while contacting test endpoint',
      });
    } finally {
      setTestingCustomAi(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-green-600" size={32} />
    </div>
  );

  const tabs = [
    { id: 'setup', label: '⚙️ Setup' },
    { id: 'customize', label: '🎨 Customize' },
    { id: 'leads', label: '👥 Leads' },
    { id: 'embed', label: '</> Embed' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 pt-5 pb-0 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/app')}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center shadow-inner">
                <Globe size={24} className="text-green-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Website Chatbot</h1>
                <p className="text-sm text-gray-500 font-medium">AI-powered support agent for your website</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live toggle */}
            <div className="flex items-center mr-2">
              <label className="relative inline-flex items-center cursor-pointer group">
                <input type="checkbox" className="sr-only peer" checked={config.isEnabled} onChange={() => setConfig(p => ({ ...p, isEnabled: !p.isEnabled, isPublished: !p.isEnabled }))} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 shadow-sm"></div>
                <span className={`ml-3 text-sm font-medium ${config.isEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                  {config.isEnabled ? 'Live' : 'Disabled'}
                </span>
              </label>
            </div>

            <button onClick={() => navigate('/website-chatbot/leads')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">
              <Users size={16} className="text-gray-400" /> Leads
            </button>

            <button onClick={save} disabled={saving}
              className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-lg shadow-sm transition-all ${saved ? 'bg-green-100 text-green-700' : 'bg-gray-900 text-white hover:bg-black'
                } disabled:opacity-70`}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto flex gap-6 overflow-x-auto no-scrollbar">
          {tabs.map(t => {
            const isActive = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`pb-3 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${isActive
                    ? 'border-green-500 text-green-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">

        {/* SETUP TAB */}
        {activeTab === 'setup' && (
          <div className="grid grid-cols-1 gap-6">

            {/* Bot Identity */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Bot Identity</h2>
                  <p className="text-xs text-gray-500">Train your chatbot with your business details</p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                {/* Website URL + Crawl */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                  <div className="flex gap-2">
                    <input value={config.websiteUrl} onChange={e => setConfig(p => ({ ...p, websiteUrl: e.target.value }))}
                      placeholder="https://yourwebsite.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow" />
                    <button onClick={crawl} disabled={crawling}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 text-sm font-medium rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors whitespace-nowrap">
                      {crawling ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      {crawlText}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1"><span className="text-blue-500">💡</span> Crawls your entire domain, all pages, and generates an AI-powered summary with reference URLs.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input value={config.businessName} onChange={e => setConfig(p => ({ ...p, businessName: e.target.value }))}
                      placeholder="Your Business Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                    <textarea value={config.description} onChange={e => setConfig(p => ({ ...p, description: e.target.value }))}
                      placeholder="Brief description of what your business does..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none transition-shadow" />
                  </div>

                  {/* Services */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Services / Products</label>
                    <div className="flex gap-2 mb-3">
                      <input value={serviceInput} onChange={e => setServiceInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addService())}
                        placeholder="Type a service and press Enter..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow" />
                      <button type="button" onClick={addService}
                        className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">Add</button>
                    </div>
                    {config.services.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {config.services.map(s => (
                          <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-700 text-sm rounded-lg border border-gray-200 shadow-sm">
                            {s}
                            <button onClick={() => setConfig(p => ({ ...p, services: p.services.filter(x => x !== s) }))} className="text-gray-400 hover:text-red-500 transition-colors">✕</button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No services added yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Behavior */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Chat Behavior</h2>
                  <p className="text-xs text-gray-500">Configure how the AI talks to your visitors</p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
                  <p className="text-xs text-gray-500 mb-2">The first message the bot sends when a user opens the chat.</p>
                  <input value={config.welcomeMessage} onChange={e => setConfig(p => ({ ...p, welcomeMessage: e.target.value }))}
                    placeholder="Hi! How can I help you today?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-shadow" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom AI Prompt (Advanced)</label>
                  <p className="text-xs text-gray-500 mb-2">Give the AI specific personality traits, rules, or instructions.</p>
                  <textarea value={config.customSystemPrompt} onChange={e => setConfig(p => ({ ...p, customSystemPrompt: e.target.value }))}
                    placeholder="E.g. Always answer in French. Be highly enthusiastic. Never mention competitors."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition-shadow bg-gray-50 focus:bg-white" />
                </div>
              </div>
            </div>

            {/* In-House AI / Custom AI Integration */}
            <div className={`bg-white rounded-xl border overflow-hidden shadow-sm transition-all ${config.customAiEnabled ? 'border-purple-300 ring-1 ring-purple-100' : 'border-gray-200'}`}>
              <div className={`border-b px-6 py-4 flex items-center justify-between transition-colors ${config.customAiEnabled ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${config.customAiEnabled ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-200 text-gray-500'}`}>
                    <Cpu size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-gray-900">In-House AI / Custom AI Integration</h2>
                      {config.customAiEnabled && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 rounded-full border border-purple-200">Active</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Route visitor questions to your proprietary AI model (e.g. Legal AI, Medical AI, RAG API) &amp; customize request/response payloads</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={config.customAiEnabled} onChange={e => setConfig(p => ({ ...p, customAiEnabled: e.target.checked }))} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {config.customAiEnabled && (
                <div className="p-6 space-y-6 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-4 text-xs text-purple-900 leading-relaxed flex items-start gap-2.5">
                    <Info size={16} className="text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>How it works:</strong> When website visitors ask questions in your chat widget, NexBotix forwards the question to your in-house AI endpoint using your specified payload template. Once your AI returns its answer, NexBotix extracts the response using your specified response field and delivers it seamlessly to the visitor.
                    </div>
                  </div>

                  {/* cURL Auto-Detector / One-Click Import */}
                  <div className="bg-gradient-to-br from-gray-900 to-indigo-950 text-white rounded-xl p-5 border border-purple-500/30 shadow-md space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-mono text-xs font-bold">
                          <Terminal size={15} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            One-Click Setup: Paste cURL Command
                            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-purple-500/30 text-purple-300 rounded border border-purple-400/30 uppercase tracking-wide">Auto-Detect</span>
                          </h4>
                          <p className="text-[11px] text-gray-400">Paste your raw cURL request and we'll auto-detect endpoint URL, HTTP method, auth tokens, and payload template</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-md shrink-0">
                        <Lock size={12} className="shrink-0" />
                        <span>Tokens encrypted with AES-256-GCM</span>
                      </div>
                    </div>

                    <div>
                      <textarea
                        value={curlInput}
                        onChange={e => {
                          setCurlInput(e.target.value);
                          setCurlImportSuccess(null);
                          setCurlImportError(null);
                        }}
                        placeholder={`curl -X POST https://api.yourdomain.com/v1/legal-ai \\\n  -H "Authorization: Bearer sk-your-token" \\\n  -H "Content-Type: application/json" \\\n  -d '{"legalQuery": "my question", "sessionId": "123"}'`}
                        rows={3}
                        className="w-full bg-black/50 border border-gray-700 focus:border-purple-500 rounded-lg p-3 text-xs font-mono text-purple-200 placeholder-gray-500 outline-none resize-y transition-all"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400">
                        <span>Sample cURL:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const sample = `curl -X POST https://api.legalai.internal/v1/consultation \\\n  -H "Authorization: Bearer legal_sec_991823" \\\n  -H "X-Client-ID: my-firm-101" \\\n  -H "Content-Type: application/json" \\\n  -d '{"legalQuery": "What are the compliance steps for NDA?", "sessionId": "sess-456"}'`;
                            setCurlInput(sample);
                            handleParseAndImportCurl(sample);
                          }}
                          className="px-2 py-0.5 bg-gray-800 hover:bg-purple-900/50 text-gray-300 hover:text-purple-300 rounded border border-gray-700 text-[10px] transition-colors"
                        >
                          ⚖️ Legal AI
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const sample = `curl https://api.openai.com/v1/chat/completions \\\n  -H "Authorization: Bearer sk-proj-1234567890abcdef" \\\n  -H "Content-Type: application/json" \\\n  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Hello AI"}]}'`;
                            setCurlInput(sample);
                            handleParseAndImportCurl(sample);
                          }}
                          className="px-2 py-0.5 bg-gray-800 hover:bg-purple-900/50 text-gray-300 hover:text-purple-300 rounded border border-gray-700 text-[10px] transition-colors"
                        >
                          🤖 OpenAI API
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const sample = `curl -X POST https://ai.mycompany.com/api/query \\\n  -H "X-API-Key: my_custom_api_key_8899" \\\n  -H "Content-Type: application/json" \\\n  -d '{"query": "Sample question", "context": "support"}'`;
                            setCurlInput(sample);
                            handleParseAndImportCurl(sample);
                          }}
                          className="px-2 py-0.5 bg-gray-800 hover:bg-purple-900/50 text-gray-300 hover:text-purple-300 rounded border border-gray-700 text-[10px] transition-colors"
                        >
                          ⚡ Custom API
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleParseAndImportCurl(curlInput)}
                        disabled={!curlInput.trim()}
                        className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Sparkles size={14} /> Auto-Detect &amp; Import
                      </button>
                    </div>

                    {curlImportSuccess && (
                      <div className="bg-purple-900/40 border border-purple-500/40 rounded-lg p-3 text-xs text-purple-200 flex items-start gap-2 animate-in fade-in">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-semibold text-white">{curlImportSuccess}</p>
                          <p className="text-[11px] text-gray-300">
                            The endpoint URL, method, headers/tokens, and payload template below have been auto-populated. Tokens will be encrypted securely when you save.
                          </p>
                        </div>
                      </div>
                    )}

                    {curlImportError && (
                      <div className="bg-red-900/40 border border-red-700/50 rounded-lg p-2.5 text-xs text-red-200 flex items-center gap-2">
                        <Info size={14} className="text-red-400 shrink-0" />
                        <span>{curlImportError}</span>
                      </div>
                    )}
                  </div>

                  {/* Endpoint & Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">In-House AI Endpoint URL <span className="text-red-500">*</span></label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={config.customAiMethod || 'POST'}
                        onChange={e => setConfig(p => ({ ...p, customAiMethod: e.target.value }))}
                        className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-purple-500 outline-none w-full sm:w-28"
                      >
                        <option value="POST">POST</option>
                        <option value="GET">GET</option>
                        <option value="PUT">PUT</option>
                      </select>
                      <input
                        value={config.customAiEndpoint}
                        onChange={e => setConfig(p => ({ ...p, customAiEndpoint: e.target.value }))}
                        placeholder="https://api.yourdomain.com/v1/legal-ai or https://ai.mycompany.com/query"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-shadow"
                      />
                    </div>
                  </div>

                  {/* Custom Headers */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Custom HTTP Headers</h4>
                        <p className="text-[11px] text-gray-500">Include authentication tokens or custom headers (e.g. Bearer token, X-API-Key)</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={headerKeyInput}
                        onChange={e => setHeaderKeyInput(e.target.value)}
                        placeholder="Header Key (e.g. Authorization)"
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        value={headerValInput}
                        onChange={e => setHeaderValInput(e.target.value)}
                        placeholder="Value (e.g. Bearer sk_live_...)"
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={addHeader}
                        className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>

                    {config.customAiHeaders && Object.keys(config.customAiHeaders).length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        {Object.entries(config.customAiHeaders).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-mono">
                            <span className="text-purple-800 font-semibold">{k}: <span className="text-gray-600 font-normal">{v}</span></span>
                            <button onClick={() => removeHeader(k)} className="text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">No custom headers added yet. Content-Type: application/json is sent by default.</p>
                    )}
                  </div>

                  {/* Request Payload Template */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Request Payload Format / Template</label>
                        <p className="text-xs text-gray-500">Configure the JSON structure sent to your in-house AI</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-gray-400 mr-1">Presets:</span>
                        <button type="button" onClick={() => applyPayloadPreset('standard')} className="px-2 py-1 text-[11px] font-medium bg-gray-100 hover:bg-purple-100 hover:text-purple-700 rounded transition-colors">Standard</button>
                        <button type="button" onClick={() => applyPayloadPreset('legal')} className="px-2 py-1 text-[11px] font-medium bg-gray-100 hover:bg-purple-100 hover:text-purple-700 rounded transition-colors">⚖️ Legal AI</button>
                        <button type="button" onClick={() => applyPayloadPreset('openai')} className="px-2 py-1 text-[11px] font-medium bg-gray-100 hover:bg-purple-100 hover:text-purple-700 rounded transition-colors">OpenAI/LLM</button>
                        <button type="button" onClick={() => applyPayloadPreset('simple')} className="px-2 py-1 text-[11px] font-medium bg-gray-100 hover:bg-purple-100 hover:text-purple-700 rounded transition-colors">Simple Query</button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 py-1 text-[11px] text-gray-600">
                      <span className="text-gray-400">Insert variable tags:</span>
                      {['{{message}}', '{{sessionId}}', '{{chatHistory}}', '{{businessName}}'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setConfig(p => ({
                              ...p,
                              customAiPayloadTemplate: (p.customAiPayloadTemplate || '') + tag,
                            }));
                          }}
                          className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-mono hover:bg-purple-100 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={config.customAiPayloadTemplate}
                      onChange={e => setConfig(p => ({ ...p, customAiPayloadTemplate: e.target.value }))}
                      placeholder={`{\n  "message": "{{message}}",\n  "sessionId": "{{sessionId}}",\n  "chatHistory": "{{chatHistory}}"\n}`}
                      rows={5}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y transition-shadow bg-gray-50 focus:bg-white leading-relaxed"
                    />
                    <p className="text-[11px] text-gray-500">Leave empty to use the standard default payload: <code className="bg-gray-100 px-1 rounded">{`{"message":"...","sessionId":"...","chatHistory":[...]}`}</code></p>
                  </div>

                  {/* Response Format & Extraction Path */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Response Extraction Field / Path</label>
                    <p className="text-xs text-gray-500">Field in your AI JSON response containing the text answer to show the visitor (supports dot-notation)</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={config.customAiResponsePath}
                        onChange={e => setConfig(p => ({ ...p, customAiResponsePath: e.target.value }))}
                        placeholder="e.g. answer, reply, data.output, choices[0].message.content"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-gray-500">
                      <span>Common formats:</span>
                      {['reply', 'answer', 'response', 'data.answer', 'choices[0].message.content', 'output.text'].map(path => (
                        <button
                          key={path}
                          type="button"
                          onClick={() => setConfig(p => ({ ...p, customAiResponsePath: path }))}
                          className="px-2 py-0.5 bg-gray-100 hover:bg-purple-100 hover:text-purple-700 text-gray-700 rounded font-mono transition-colors"
                        >
                          {path}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reliability & Timeout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="customAiFallback"
                        checked={config.customAiFallbackToDefault}
                        onChange={e => setConfig(p => ({ ...p, customAiFallbackToDefault: e.target.checked }))}
                        className="mt-1 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="customAiFallback" className="text-xs text-gray-700 cursor-pointer">
                        <strong className="block text-gray-900 font-semibold mb-0.5">Built-In AI Fallback</strong>
                        Fallback to NexBotix default AI if your in-house AI server is down, times out, or errors.
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Request Timeout (seconds)</label>
                      <input
                        type="number"
                        min={3}
                        max={60}
                        value={config.customAiTimeoutSeconds || 15}
                        onChange={e => setConfig(p => ({ ...p, customAiTimeoutSeconds: parseInt(e.target.value) || 15 }))}
                        className="w-full sm:w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  {/* Live Testing Tool */}
                  <div className="mt-4 bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl p-5 text-white space-y-4 shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">⚡</div>
                        <h4 className="text-sm font-bold text-white">Test In-House AI Connection</h4>
                      </div>
                      <span className="text-[11px] text-gray-400">Live query sandbox</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={testQuery}
                        onChange={e => setTestQuery(e.target.value)}
                        placeholder="Type a sample user question..."
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 rounded-lg text-xs outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={testInHouseAi}
                        disabled={testingCustomAi}
                        className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 shadow-sm shadow-purple-900/50"
                      >
                        {testingCustomAi ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                        {testingCustomAi ? 'Testing...' : 'Test Connection'}
                      </button>
                    </div>

                    {customAiTestResult && (
                      <div className={`rounded-lg border p-4 space-y-3 animate-in fade-in duration-200 ${customAiTestResult.success ? 'bg-purple-950/40 border-purple-700/50 text-purple-100' : 'bg-red-950/40 border-red-800/50 text-red-100'}`}>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] ${customAiTestResult.success ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                              {customAiTestResult.success ? '✓ Success' : '✕ Connection Error'}
                            </span>
                            {customAiTestResult.statusCode > 0 && (
                              <span className="text-gray-400 font-mono text-[11px]">HTTP {customAiTestResult.statusCode}</span>
                            )}
                          </div>
                          {customAiTestResult.latencyMs !== undefined && (
                            <span className="text-gray-400 font-mono text-[11px]">⚡ {customAiTestResult.latencyMs} ms</span>
                          )}
                        </div>

                        {customAiTestResult.extractedText ? (
                          <div>
                            <p className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider mb-1">Extracted Widget Reply (Delivered to Visitor):</p>
                            <div className="bg-gray-900/90 border border-purple-500/30 rounded-lg p-3 text-xs text-gray-100 font-sans leading-relaxed">
                              {customAiTestResult.extractedText}
                            </div>
                          </div>
                        ) : customAiTestResult.error ? (
                          <div className="text-xs text-red-300 font-mono bg-red-900/30 p-2.5 rounded border border-red-800/40">
                            {customAiTestResult.error}
                          </div>
                        ) : null}

                        {/* Raw Debug Toggle */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setShowPayloadDetails(!showPayloadDetails)}
                            className="text-[11px] text-gray-400 hover:text-white underline flex items-center gap-1"
                          >
                            <Code size={12} />
                            {showPayloadDetails ? 'Hide Request / Raw Response details' : 'Show Request / Raw Response details'}
                          </button>

                          {showPayloadDetails && (
                            <div className="mt-2 space-y-2 text-[11px] font-mono text-gray-300">
                              {customAiTestResult.sentPayload && (
                                <div>
                                  <span className="text-gray-400">Sent Payload:</span>
                                  <pre className="mt-1 bg-black/60 p-2 rounded text-[10px] overflow-x-auto text-green-300 whitespace-pre-wrap">{customAiTestResult.sentPayload}</pre>
                                </div>
                              )}
                              {customAiTestResult.rawResponse && (
                                <div>
                                  <span className="text-gray-400">Raw AI Response:</span>
                                  <pre className="mt-1 bg-black/60 p-2 rounded text-[10px] overflow-x-auto text-blue-300 whitespace-pre-wrap">{customAiTestResult.rawResponse}</pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Lead Capture */}
            <div className={`bg-white rounded-xl border overflow-hidden shadow-sm transition-colors ${config.enableLeadCapture ? 'border-green-300' : 'border-gray-200'}`}>
              <div className={`border-b px-6 py-4 flex items-center justify-between transition-colors ${config.enableLeadCapture ? 'bg-green-50/50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${config.enableLeadCapture ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Lead Capture</h2>
                    <p className="text-xs text-gray-500">Ask users for contact details during the chat</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={config.enableLeadCapture} onChange={e => setConfig(p => ({ ...p, enableLeadCapture: e.target.checked }))} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              {config.enableLeadCapture && (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="sm:col-span-2">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                      ℹ️ The chatbot will automatically ask the user for their Name and Email after a few messages.
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email notifications to</label>
                    <input value={config.leadEmailTo} onChange={e => setConfig(p => ({ ...p, leadEmailTo: e.target.value }))}
                      placeholder="you@email.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp notifications to</label>
                    <input value={config.leadWhatsAppTo} onChange={e => setConfig(p => ({ ...p, leadWhatsAppTo: e.target.value }))}
                      placeholder="+1234567890"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow" />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-1.5 mb-1 group relative w-fit">
                      <label className="text-sm font-medium text-gray-700">Webhook URL (Advanced)</label>
                      <Info size={14} className="text-gray-400 cursor-pointer hover:text-green-600 transition-colors" />

                      {/* Hover Tooltip */}
                      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10 before:content-[''] before:absolute before:top-full before:left-4 before:border-4 before:border-transparent before:border-t-gray-900">
                        <p className="font-semibold mb-1 text-green-400">Webhook Payload Details</p>
                        <p className="opacity-90 mb-2">A POST request with a JSON body will be sent to this URL whenever a new lead is captured.</p>
                        <div className="bg-gray-800 p-2 rounded text-[10px] font-mono text-gray-300 overflow-x-auto whitespace-pre">
                          {`{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "message": "Interested in...",
  "sourceDomain": "yourdomain.com",
  "createdAt": "2026-05-02T12:00:00Z"
}`}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">Send leads instantly to Zapier, Make.com, or your own CRM.</p>
                    <input value={config.leadWebhookURL} onChange={e => setConfig(p => ({ ...p, leadWebhookURL: e.target.value }))}
                      placeholder="https://your-webhook.com/leads"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-shadow" />
                  </div>
                </div>
              )}
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Security & Whitelisting</h2>
                  <p className="text-xs text-gray-500">Prevent unauthorized usage of your widget</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">Add the domains where this chatbot is allowed to appear. If left empty, the widget can be loaded on <strong>any</strong> website using your API key.</p>
                <div className="flex gap-2">
                  <input value={domainInput} onChange={e => setDomainInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                    placeholder="e.g., nexbotix.online"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-shadow" />
                  <button type="button" onClick={addDomain}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">Add Domain</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.whitelistedDomains.map(d => (
                    <span key={d} className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-800 text-sm rounded-lg border border-orange-200 shadow-sm">
                      {d}
                      <button onClick={() => setConfig(p => ({ ...p, whitelistedDomains: p.whitelistedDomains.filter(x => x !== d) }))} className="text-orange-500 hover:text-orange-700 transition-colors">✕</button>
                    </span>
                  ))}
                  {config.whitelistedDomains.length === 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                      ⚠️ No restrictions (All domains allowed)
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* CUSTOMIZE TAB */}
        {activeTab === 'customize' && (
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* Left: Controls */}
            <div className="w-full lg:w-[45%] space-y-6 flex-shrink-0">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center">
                    <Palette size={18} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Brand Colors</h2>
                    <p className="text-xs text-gray-500">Match the widget to your website</p>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Accent Color</label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-10 rounded-lg overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
                        <input type="color" value={config.primaryColor} onChange={e => setConfig(p => ({ ...p, primaryColor: e.target.value }))}
                          className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" />
                      </div>
                      <input value={config.primaryColor} onChange={e => setConfig(p => ({ ...p, primaryColor: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-shadow uppercase" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Text & Icon Color (on Accent)</label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-10 rounded-lg overflow-hidden border border-gray-200 shadow-sm flex-shrink-0">
                        <input type="color" value={config.iconColor} onChange={e => setConfig(p => ({ ...p, iconColor: e.target.value }))}
                          className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" />
                      </div>
                      <input value={config.iconColor} onChange={e => setConfig(p => ({ ...p, iconColor: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-shadow uppercase" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Layout size={18} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Placement & Size</h2>
                    <p className="text-xs text-gray-500">Where and how it appears</p>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Position on Screen</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['bottom-left', 'bottom-right'].map(p => (
                        <button key={p} type="button" onClick={() => setConfig(c => ({ ...c, position: p }))}
                          className={`flex items-center justify-center py-3 text-sm font-medium rounded-xl border-2 transition-all ${config.position === p ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
                          {p === 'bottom-left' ? '↙ Bottom Left' : 'Bottom Right ↘'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Widget Size</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['small', 'medium', 'large'].map(s => (
                        <button key={s} type="button" onClick={() => setConfig(c => ({ ...c, widgetSize: s }))}
                          className={`py-2 text-sm font-medium rounded-lg border transition-all capitalize ${config.widgetSize === s ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Sticky Preview */}
            <div className="w-full lg:w-[55%] sticky top-6">
              <div className="bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden shadow-inner relative flex flex-col items-center justify-center" style={{ height: '600px' }}>
                <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] bg-[length:20px_20px]"></div>

                <div className="z-10 text-center space-y-4 text-gray-400 select-none">
                  <Globe size={48} className="mx-auto opacity-20" />
                  <p className="text-sm font-medium tracking-widest uppercase">Your Website</p>
                </div>

                {/* Chat Panel Preview */}
                <div className={`absolute bottom-24 ${config.position === 'bottom-right' ? 'right-6' : 'left-6'} rounded-2xl shadow-2xl overflow-hidden bg-white flex flex-col transition-all duration-300 ease-in-out`} style={{ height: '420px', width: config.widgetSize === 'small' ? '280px' : config.widgetSize === 'large' ? '360px' : '320px' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 transition-colors duration-300" style={{ backgroundColor: config.primaryColor }}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-sm flex-shrink-0">
                        <MessageCircle size={18} style={{ color: config.iconColor }} />
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-sm font-bold tracking-wide truncate" style={{ color: config.iconColor }}>{config.businessName || 'Chat Assistant'}</p>
                        <p className="text-[11px] font-medium opacity-80 flex items-center gap-1.5" style={{ color: config.iconColor }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0"></span> Online
                        </p>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0 ml-2" style={{ color: config.iconColor }}>✕</button>
                  </div>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50 relative">
                    <div className="self-start max-w-[85%] bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 text-[13px] text-gray-700 shadow-sm leading-relaxed">
                      {config.welcomeMessage || 'Hi! How can I help you today?'}
                    </div>
                    <div className="self-end max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-[13px] shadow-sm leading-relaxed transition-colors duration-300" style={{ backgroundColor: config.primaryColor, color: config.iconColor }}>
                      I'd like to know more about what you offer.
                    </div>
                    <div className="self-start max-w-[85%] bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 text-[13px] text-gray-700 shadow-sm leading-relaxed">
                      Sure thing! We specialize in custom software solutions tailored to your needs. What specific challenges are you looking to solve?
                    </div>

                    {/* Simulated Lead Form if enabled */}
                    {config.enableLeadCapture && (
                      <div className="w-full mt-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-xs font-semibold text-gray-800 mb-3 text-center">Please leave your details</p>
                        <div className="space-y-2">
                          <input disabled placeholder="Name" className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
                          <input disabled placeholder="Email" className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
                          <button disabled className="w-full py-2 rounded-lg text-xs font-bold transition-colors opacity-90 mt-2" style={{ backgroundColor: config.primaryColor, color: config.iconColor }}>Submit</button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Input Area */}
                  <div className="flex items-center gap-2 px-3 py-3 bg-white border-t border-gray-100">
                    <div className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-[13px] text-gray-400">Type a message...</div>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 transition-colors duration-300" style={{ backgroundColor: config.primaryColor, color: config.iconColor }}>➤</div>
                  </div>
                </div>

                {/* FAB Preview */}
                <div className={`absolute bottom-6 ${config.position === 'bottom-right' ? 'right-6' : 'left-6'} transition-all duration-300 ease-in-out`}>
                  <div className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                    style={{ backgroundColor: config.primaryColor }}>
                    <MessageCircle size={24} style={{ color: config.iconColor }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LEADS TAB (shortcut) */}
        {activeTab === 'leads' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <WebsiteChatbotLeadsPage embedded={true} />
          </div>
        )}

        {/* EMBED TAB */}
        {activeTab === 'embed' && (
          <div className="space-y-6">
            <div className="text-center pb-4">
              <h2 className="text-2xl font-bold text-gray-900">Install your Chatbot</h2>
              <p className="text-gray-500 mt-2">Get your chatbot up and running in minutes with these simple steps.</p>
            </div>

            {/* Step 1: Status */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-bold">1</div>
                <h3 className="font-semibold text-gray-900">Check Prerequisites</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white ${apiKey ? 'bg-green-500' : 'bg-red-500'}`}>
                    {apiKey ? <Check size={12} /> : '✕'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Developer API Key</p>
                    {apiKey ? (
                      <p className="text-xs text-gray-500">Your API key is ready.</p>
                    ) : (
                      <p className="text-xs text-red-500">You need an API key. Go to Subscription → Developer API to generate one.</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white ${config.isEnabled ? 'bg-green-500' : 'bg-amber-500'}`}>
                    {config.isEnabled ? <Check size={12} /> : '⚠️'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Live Status</p>
                    {config.isEnabled ? (
                      <p className="text-xs text-gray-500">Your chatbot is currently set to Live.</p>
                    ) : (
                      <p className="text-xs text-amber-600">Your chatbot is Disabled. Toggle it to "Live" in the header above and save.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Code */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">2</div>
                  <h3 className="font-semibold text-gray-900">Integration Code</h3>
                </div>
                <div className="flex bg-gray-200 p-1 rounded-lg self-start sm:self-auto">
                  <button onClick={() => setEmbedPlatform('html')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${embedPlatform === 'html' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>HTML</button>
                  <button onClick={() => setEmbedPlatform('react')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${embedPlatform === 'react' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>React/Next.js</button>
                  <button onClick={() => setEmbedPlatform('agent')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${embedPlatform === 'agent' ? 'bg-green-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>🤖 AI Agent</button>
                </div>
              </div>
              <div className="p-6">
                {embedPlatform === 'html' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-sm text-gray-600 mb-4">Paste this snippet just before the closing <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">&lt;/body&gt;</code> tag of your website.</p>
                    <div className="relative group">
                      <pre className="bg-gray-950 text-green-400 rounded-xl p-4 text-sm overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed">{scriptTag}</pre>
                      <button onClick={copyScript} className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}
                {embedPlatform === 'react' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-sm text-gray-600 mb-4">Add this <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">useEffect</code> to your root layout or main App component to inject the widget globally.</p>
                    <div className="relative group">
                      <pre className="bg-gray-950 text-blue-400 rounded-xl p-4 text-sm overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed">{`import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${BASE}/api/website-chatbot/script?apikey=${apiKey || 'YOUR_API_KEY'}';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    // Your app content
  );
}`}</pre>
                      <button onClick={() => {
                        navigator.clipboard.writeText(`import { useEffect } from 'react';\n\nexport default function App() {\n  useEffect(() => {\n    const script = document.createElement('script');\n    script.src = '${BASE}/api/website-chatbot/script?apikey=${apiKey || 'YOUR_API_KEY'}';\n    script.async = true;\n    document.body.appendChild(script);\n    \n    return () => {\n      document.body.removeChild(script);\n    };\n  }, []);\n\n  return (\n    // Your app content\n  );\n}`);
                        setCopied(true); setTimeout(() => setCopied(false), 2000);
                      }} className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}
                {embedPlatform === 'agent' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-sm text-gray-600 mb-4">Building with an AI coding assistant (like Cursor, Windsurf, or GitHub Copilot)? Just copy this prompt and paste it into your agent's chat!</p>
                    <div className="relative group">
                      <pre className="bg-green-50 border border-green-200 text-green-900 rounded-xl p-5 text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner font-mono text-xs">
                        {`Please install the NexBotix customer support chatbot on my website. 

To do this, you need to inject the following script tag just before the closing </body> tag of my main layout/HTML file:

<script src="${BASE}/api/website-chatbot/script?apikey=${apiKey || 'YOUR_API_KEY'}"></script>

If this is a React/Next.js app, please use a useEffect hook in the root layout to append the script to document.body, and make sure to clean it up in the return function.

Do not change the src URL, it contains my unique API key.`}
                      </pre>
                      <button onClick={() => {
                        navigator.clipboard.writeText(`Please install the NexBotix customer support chatbot on my website. \n\nTo do this, you need to inject the following script tag just before the closing </body> tag of my main layout/HTML file:\n\n<script src="${BASE}/api/website-chatbot/script?apikey=${apiKey || 'YOUR_API_KEY'}"></script>\n\nIf this is a React/Next.js app, please use a useEffect hook in the root layout to append the script to document.body, and make sure to clean it up in the return function.\n\nDo not change the src URL, it contains my unique API key.`);
                        setCopied(true); setTimeout(() => setCopied(false), 2000);
                      }} className="absolute top-4 right-4 p-2 bg-green-200 hover:bg-green-300 text-green-800 rounded-lg transition-colors">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Security */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-bold">3</div>
                <h3 className="font-semibold text-gray-900">Security Check</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">Ensure your website's domain is allowed to use this chatbot. Go to the <button onClick={() => setActiveTab('setup')} className="text-green-600 hover:underline font-medium">Setup tab</button> and check the <strong>Domain Whitelist</strong> section.</p>
                {config.whitelistedDomains.length > 0 ? (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-3 rounded-lg border border-green-200 font-medium">
                    <Check size={16} className="text-green-500" /> Restricted to {config.whitelistedDomains.length} domain(s)
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-lg border border-amber-200 font-medium">
                    ⚠️ Currently allowing all domains (Not recommended for production)
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
