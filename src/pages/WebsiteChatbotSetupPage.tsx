import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, API_ENDPOINTS, WIDGET_BASE_URL } from '@/config/api';
import { Globe, Loader2, Save, RefreshCw, Copy, Check, Users, ArrowLeft, Bot, MessageSquare, ShieldCheck, Mail, Palette, Layout, MessageCircle, Info } from 'lucide-react';
import { WebsiteChatbotLeadsPage } from './WebsiteChatbotLeadsPage';

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
  isEnabled: boolean;
  isPublished: boolean;
}

const DEFAULT: ChatbotConfig = {
  businessName: '', description: '', websiteUrl: '', services: [],
  primaryColor: '#16a34a', iconColor: '#ffffff', position: 'bottom-right',
  widgetSize: 'medium', welcomeMessage: 'Hi! How can I help you today?',
  whitelistedDomains: [], enableLeadCapture: true, leadEmailTo: '',
  leadWhatsAppTo: '', leadWebhookURL: '', customSystemPrompt: '', isEnabled: true, isPublished: false,
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
                    placeholder="e.g., todayintech.in"
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
