import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus, Trash2, Save, ArrowLeft, Globe, BookOpen, ShoppingBag, Calendar, ToggleLeft, ToggleRight, Loader, Ban, Sparkles, Code2, Shield, User, ChevronDown, ChevronUp, RefreshCw, Check, Key, Eye, EyeOff, Zap, ShieldCheck, Cpu, AlertCircle } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

interface BotConfig {
  id?: string;
  businessName: string;
  description: string;
  website: string;
  services: string[];
  bookingLink: string;
  productLink: string;
  isEnabled: boolean;
  excludedNumbers: string[];
  customSystemPrompt: string;
  // AI Detection Settings
  enableAIDetection?: boolean;
  maxMessagesPerHour?: number;
  handoffKeywords?: string[];
  // Human Agent Settings
  humanAgentPhone?: string;
  enableAutoHandoff?: boolean;
  // Advanced Dispatch Settings
  onlyReplyOffline?: boolean;
  offlineIdleMinutes?: number;
  restrictedHoursEnabled?: boolean;
  restrictedHoursStart?: string;
  restrictedHoursEnd?: string;
  // Enterprise Bring Your Own Key (BYOK)
  aiProvider?: string;
  aiModel?: string;
  customApiKey?: string;
  hasCustomApiKey?: boolean;
}

const EMPTY: BotConfig = {
  businessName: '',
  description: '',
  website: '',
  services: [''],
  bookingLink: '',
  productLink: '',
  isEnabled: false,
  excludedNumbers: [],
  customSystemPrompt: '',
  enableAIDetection: true,  // Enable AI detection by default
  maxMessagesPerHour: 30,
  handoffKeywords: ['human', 'agent', 'talk to person', 'real human'],
  humanAgentPhone: '',
  enableAutoHandoff: false,
  onlyReplyOffline: false,
  offlineIdleMinutes: 3,
  restrictedHoursEnabled: false,
  restrictedHoursStart: '00:00',
  restrictedHoursEnd: '06:00',
  aiProvider: 'default',
  aiModel: '',
  customApiKey: '',
  hasCustomApiKey: false,
};

export function BotSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [config, setConfig] = useState<BotConfig>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlMsg, setCrawlMsg] = useState('');
  const [isToggeling, setIsToggeling] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [aiDetectionExpanded, setAiDetectionExpanded] = useState(false);
  const [handoffExpanded, setHandoffExpanded] = useState(false);
  const [advancedSettingsExpanded, setAdvancedSettingsExpanded] = useState(false);
  const [aiProviderExpanded, setAiProviderExpanded] = useState(true);
  const [maxMessagesDraft, setMaxMessagesDraft] = useState('30');
  const [customKeyDraft, setCustomKeyDraft] = useState('');
  const [showCustomKey, setShowCustomKey] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<{ ok: boolean; msg: string } | null>(null);


  const isActive = user?.subscription?.isActive ?? false;
  const isFree = user?.subscription?.plan === 'free' || user?.subscription?.plan === 'trial';

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.bot.get);
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setConfig({
            businessName: d.businessName || '',
            description: d.description || '',
            website: d.website || '',
            services: d.services?.length ? d.services : [''],
            bookingLink: d.bookingLink || '',
            productLink: d.productLink || '',
            isEnabled: d.isEnabled ?? false,
            excludedNumbers: d.excludedNumbers ?? [],
            customSystemPrompt: d.customSystemPrompt ?? '',
            enableAIDetection: d.enableAIDetection ?? true,  // Default to true
            maxMessagesPerHour: d.maxMessagesPerHour ?? 30,

            handoffKeywords: d.handoffKeywords?.length ? d.handoffKeywords : ['human', 'agent', 'talk to person', 'real human'],
            humanAgentPhone: d.humanAgentPhone ?? '',
            enableAutoHandoff: d.enableAutoHandoff ?? false,
            onlyReplyOffline: d.onlyReplyOffline ?? false,
            offlineIdleMinutes: d.offlineIdleMinutes ?? 3,
            restrictedHoursEnabled: d.restrictedHoursEnabled ?? false,
            restrictedHoursStart: d.restrictedHoursStart || '00:00',
            restrictedHoursEnd: d.restrictedHoursEnd || '06:00',
            aiProvider: d.aiProvider || 'default',
            aiModel: d.aiModel || '',
            customApiKey: '',
            hasCustomApiKey: d.hasCustomApiKey ?? false,
          });
          // Sync draft states with loaded config
          setMaxMessagesDraft(String(d.maxMessagesPerHour ?? 30));
        }
      } catch {
        // no config yet — use empty
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    // Commit any draft values before saving
    const maxMsgParsed = parseInt(maxMessagesDraft);
    const maxMsgValidated = !isNaN(maxMsgParsed) ? Math.max(1, Math.min(100, maxMsgParsed)) : 30;

    const cleanServices = config.services.map(s => s.trim()).filter(Boolean);

    const payload: any = {
      ...config,
      maxMessagesPerHour: maxMsgValidated,
      services: cleanServices,
    };

    if (customKeyDraft.trim() !== '') {
      payload.customApiKey = customKeyDraft.trim();
    }

    const hasCustomPrompt = config.customSystemPrompt.trim() !== '';
    if (!hasCustomPrompt && (!config.businessName.trim() || !config.description.trim())) {
      showToast('Business name and description are required (or enter a custom system prompt)', false);
      return;
    }

    setIsSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.bot.upsert, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Bot configuration saved!', true);
        // Update config and sync drafts
        setConfig(prev => ({
          ...prev,
          maxMessagesPerHour: maxMsgValidated,
          services: json.data?.services?.length ? json.data.services : prev.services,
          aiProvider: json.data?.aiProvider ?? prev.aiProvider,
          aiModel: json.data?.aiModel ?? prev.aiModel,
          hasCustomApiKey: json.data?.hasCustomApiKey ?? prev.hasCustomApiKey,
        }));
        if (customKeyDraft.trim() !== '') {
          setCustomKeyDraft('');
          setConfig(prev => ({ ...prev, hasCustomApiKey: true }));
        }
        setMaxMessagesDraft(String(maxMsgValidated));
      } else {
        showToast(json.error || 'Failed to save', false);
      }
    } catch {
      showToast('Network error — could not save', false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCustomKey = async () => {
    setCustomKeyDraft('');
    setIsSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.bot.upsert, {
        method: 'POST',
        body: JSON.stringify({
          ...config,
          customApiKey: '__CLEAR__',
          aiProvider: 'default',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setConfig(prev => ({ ...prev, customApiKey: '', hasCustomApiKey: false, aiProvider: 'default' }));
        showToast('Custom API key removed. Reverted to Platform Managed AI.', true);
      } else {
        showToast('Failed to remove custom key', false);
      }
    } catch {
      showToast('Network error — failed to remove key', false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestKey = async () => {
    const keyToTest = customKeyDraft.trim();
    if (!keyToTest) {
      showToast('Please enter an API key to test', false);
      return;
    }
    let prov = config.aiProvider === 'default' ? '' : (config.aiProvider || '');
    if (!prov) {
      if (keyToTest.startsWith('gsk_')) prov = 'groq';
      else if (keyToTest.startsWith('sk-')) prov = 'openai';
      else if (keyToTest.startsWith('AIza')) prov = 'gemini';
      else prov = 'groq';
    }

    setIsTestingKey(true);
    setKeyTestStatus(null);
    try {
      const res = await apiFetch('/api/admin/ai/config/test', {
        method: 'POST',
        body: JSON.stringify({ provider: prov, key: keyToTest }),
      });
      const data = await res.json();
      if (data.success) {
        setKeyTestStatus({ ok: true, msg: `Key valid! Successfully connected to ${prov.toUpperCase()}` });
      } else {
        setKeyTestStatus({ ok: false, msg: data.error || 'Connection failed — invalid API key' });
      }
    } catch {
      setKeyTestStatus({ ok: false, msg: 'Network error while testing key' });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleToggle = async () => {
    // Commit any draft values before toggling
    const maxMsgParsed = parseInt(maxMessagesDraft);
    const maxMsgValidated = !isNaN(maxMsgParsed) ? Math.max(1, Math.min(100, maxMsgParsed)) : 30;

    const finalConfig = {
      ...config,
      maxMessagesPerHour: maxMsgValidated,
    };

    const hasCustomPrompt = config.customSystemPrompt.trim() !== '';
    if (!hasCustomPrompt && (!config.businessName.trim() || !config.description.trim())) {
      showToast('Save your business info (or enter a custom system prompt) before enabling the bot', false);
      return;
    }
    const newEnabled = !config.isEnabled;
    setConfig(prev => ({ ...prev, isEnabled: newEnabled }));
    setIsToggeling(true);
    try {
      const cleanServices = config.services.map(s => s.trim()).filter(Boolean);
      const res = await apiFetch(API_ENDPOINTS.bot.upsert, {
        method: 'POST',
        body: JSON.stringify({ ...finalConfig, isEnabled: newEnabled, services: cleanServices }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(newEnabled ? 'Bot enabled — auto-replies are active' : 'Bot disabled — auto-replies stopped', newEnabled);
        // Sync drafts after successful toggle
        setMaxMessagesDraft(String(maxMsgValidated));
      } else {
        // Revert on failure
        setConfig(prev => ({ ...prev, isEnabled: !newEnabled }));
        showToast(json.error || 'Failed to update bot status', false);
      }
    } catch {
      setConfig(prev => ({ ...prev, isEnabled: !newEnabled }));
      showToast('Network error — could not update bot status', false);
    } finally {
      setIsToggeling(false);
    }
  };

  const handleCrawl = async () => {
    const raw = config.website.trim();
    if (!raw) return;
    // Auto-add https:// if missing — backend needs a full URL
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    setIsCrawling(true);
    setCrawlMsg('');
    try {
      const res = await apiFetch(API_ENDPOINTS.websiteChatbot.crawl, {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
      const d = await res.json();
      // Check both outer success AND inner CrawlResult.success
      const innerOk = d.success && d.data && d.data.success !== false && d.data.businessName;
      if (innerOk) {
        setConfig(prev => ({
          ...prev,
          businessName: d.data.businessName || prev.businessName,
          description: d.data.description || prev.description,
          services: d.data.services?.length
            ? d.data.services.slice(0, 5).concat(Array(5).fill('')).slice(0, 5)
            : prev.services,
        }));
        setCrawlMsg('Auto-filled from your website!');
        setTimeout(() => setCrawlMsg(''), 4000);
      } else {
        const errMsg = d.data?.error || d.error || 'Could not extract data — check the URL';
        setToast({ msg: errMsg, ok: false });
        setTimeout(() => setToast(null), 5000);
      }
    } catch {
      setToast({ msg: 'Network error during crawl', ok: false });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsCrawling(false);
    }
  };

  const addService = () => setConfig(prev => ({ ...prev, services: [...prev.services, ''] }));
  const removeService = (i: number) =>
    setConfig(prev => ({ ...prev, services: prev.services.filter((_, idx) => idx !== i) }));
  const updateService = (i: number, val: string) =>
    setConfig(prev => ({ ...prev, services: prev.services.map((s, idx) => idx === i ? val : s) }));

  const addExcluded = () => setConfig(prev => ({ ...prev, excludedNumbers: [...prev.excludedNumbers, ''] }));
  const removeExcluded = (i: number) =>
    setConfig(prev => ({ ...prev, excludedNumbers: prev.excludedNumbers.filter((_, idx) => idx !== i) }));
  const updateExcluded = (i: number, val: string) =>
    setConfig(prev => ({ ...prev, excludedNumbers: prev.excludedNumbers.map((n, idx) => idx === i ? val : n) }));

  const addHandoffKeyword = () => setConfig(prev => ({ ...prev, handoffKeywords: [...(prev.handoffKeywords || []), ''] }));
  const removeHandoffKeyword = (i: number) =>
    setConfig(prev => ({ ...prev, handoffKeywords: (prev.handoffKeywords || []).filter((_, idx) => idx !== i) }));
  const updateHandoffKeyword = (i: number, val: string) =>
    setConfig(prev => ({ ...prev, handoffKeywords: (prev.handoffKeywords || []).map((k, idx) => idx === i ? val : k) }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader size={32} className="animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/app')}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">WhatsApp Bot Setup</h1>
              <p className="text-xs text-gray-500">AI-powered auto-reply for your business</p>
            </div>
          </div>
          {user?.subscription?.plan && (
            <span className={`ml-auto flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border capitalize ${
              !isActive ? 'bg-red-50 text-red-700 border-red-200'
              : isFree ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              {isFree ? 'Free Trial' : user.subscription.plan}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Dynamic Quota & BYOK Status Banner */}
        {isActive && (
          config.hasCustomApiKey || user?.subscription?.isBYOKActive ? (
            <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-900 text-sm">🟢 BYOK Active — Unlimited AI Auto-Replies</span>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-200 text-emerald-800 rounded-full">No Quota Limits</span>
                </div>
                <p className="text-xs text-emerald-700 mt-1">
                  Your WhatsApp bot is powered by your custom <strong>{config.aiProvider && config.aiProvider !== 'default' ? config.aiProvider.toUpperCase() : 'Custom LLM'}</strong> API key. Zero monthly message limits or platform quota deductions apply.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-5 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-900 text-sm">⚡ Platform Managed AI</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-200 text-indigo-800 rounded-full">
                      {Math.max(0, (user?.subscription?.botRepliesLimit ?? 500) - (user?.subscription?.botRepliesUsed ?? 0))} of {user?.subscription?.botRepliesLimit ?? 500} replies left
                    </span>
                  </div>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Powered by high-speed Groq &amp; OpenAI failover. Need unlimited replies? Add your own API key below.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/subscription')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                >
                  + Top-up 1k Replies
                </button>
              </div>
            </div>
          )
        )}

        {!isActive && (
          <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
            <span>Your subscription has expired. Renew now to enable WhatsApp auto-replies.</span>
            <button onClick={() => navigate('/subscription')} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">
              Renew Plan
            </button>
          </div>
        )}

        <div className={!isActive ? 'opacity-50 pointer-events-none select-none' : ''}>
          {/* Enable/Disable toggle */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Bot Status</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {config.isEnabled
                    ? 'Bot is active and will auto-reply to incoming messages'
                    : 'Bot is disabled — no auto-replies will be sent'}
                </p>
              </div>
              <button
                onClick={handleToggle}
                disabled={isToggeling}
                className={`transition-colors disabled:opacity-60 ${config.isEnabled ? 'text-green-600' : 'text-gray-400'}`}
              >
                {isToggeling
                  ? <Loader size={40} className="animate-spin" />
                  : config.isEnabled
                    ? <ToggleRight size={40} />
                    : <ToggleLeft size={40} />}
              </button>
            </div>
          </div>

          {/* Business Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-500" /> Business Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.businessName}
                onChange={e => setConfig(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="e.g. Acme Enterprises"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={config.description}
                onChange={e => setConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your business, what you do, and what makes you unique…"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Globe size={13} /> Website <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={config.website}
                  onChange={e => setConfig(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleCrawl}
                  disabled={isCrawling || !config.website.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <RefreshCw size={13} className={isCrawling ? 'animate-spin' : ''} />
                  {isCrawling ? 'Crawling…' : 'Crawl Website'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                <span className="text-blue-400">💡</span>
                Auto-fills name, description &amp; services from your website.
              </p>
              {crawlMsg && (
                <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                  <Check size={12} /> {crawlMsg}
                </p>
              )}
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <ShoppingBag size={16} className="text-indigo-500" /> Key Services / Products
              <span className="ml-auto text-xs text-gray-400 font-normal">Add 4–5 for best results</span>
            </h2>
            <div className="space-y-2.5">
              {config.services.map((svc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={svc}
                    onChange={e => updateService(i, e.target.value)}
                    placeholder={`Service ${i + 1} — e.g. Website Design`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  {config.services.length > 1 && (
                    <button
                      onClick={() => removeService(i)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addService}
              className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <Plus size={15} /> Add another service
            </button>
          </div>

          {/* Optional Links */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" /> Optional Links
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking / Appointment Link
              </label>
              <input
                type="url"
                value={config.bookingLink}
                onChange={e => setConfig(prev => ({ ...prev, bookingLink: e.target.value }))}
                placeholder="https://calendly.com/yourbusiness"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Products / Store Link
              </label>
              <input
                type="url"
                value={config.productLink}
                onChange={e => setConfig(prev => ({ ...prev, productLink: e.target.value }))}
                placeholder="https://yourstore.com/products"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* System Prompt */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <Code2 size={16} className="text-indigo-500" /> System Prompt
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Override the AI's behaviour with a custom system prompt. Leave blank to use the auto-generated prompt built from your business info above.
            </p>

            {/* Auto-preview banner */}
            {!config.customSystemPrompt.trim() && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                <Sparkles size={13} className="text-indigo-400 shrink-0" />
                <span className="text-xs text-indigo-600">Auto-generated prompt is active — based on your business name, description and services.</span>
              </div>
            )}

            <textarea
              value={config.customSystemPrompt}
              onChange={e => setConfig(prev => ({ ...prev, customSystemPrompt: e.target.value }))}
              placeholder={`Example:\nYou are Aria, a friendly support agent for Acme Corp. Only answer questions about our products. Always reply in English. Keep responses under 3 sentences.`}
              rows={8}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y leading-relaxed"
            />

            {config.customSystemPrompt.trim() && (
              <button
                onClick={() => setConfig(prev => ({ ...prev, customSystemPrompt: '' }))}
                className="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear — revert to auto-generated prompt
              </button>
            )}
          </div>

          {/* AI Engine & Bring Your Own Key (BYOK) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
            <button
              type="button"
              onClick={() => setAiProviderExpanded(!aiProviderExpanded)}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Cpu size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">AI Engine &amp; BYOK (Custom API Key)</span>
                    {config.hasCustomApiKey ? (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full">Custom Key Active</span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full">Platform Managed</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Connect your own Groq, OpenAI, or Gemini key for unlimited free replies, or customize the AI model
                  </p>
                </div>
              </div>
              {aiProviderExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            {aiProviderExpanded && (
              <div className="p-5 pt-0 border-t border-gray-100 space-y-5">
                {/* Provider Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    AI Provider Mode
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'default', label: 'Platform Default', desc: 'Managed Quota' },
                      { id: 'groq',    label: 'Groq (Ultra-Fast)', desc: 'BYOK Unlimited' },
                      { id: 'openai',  label: 'OpenAI (GPT-4o)',   desc: 'BYOK Unlimited' },
                      { id: 'gemini',  label: 'Google Gemini',     desc: 'BYOK Unlimited' },
                    ].map(item => {
                      const isSel = (config.aiProvider || 'default') === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setConfig(prev => ({
                              ...prev,
                              aiProvider: item.id,
                              aiModel: item.id === 'groq' ? 'llama-3.3-70b-versatile' : item.id === 'openai' ? 'gpt-4o-mini' : item.id === 'gemini' ? 'gemini-2.5-flash' : '',
                            }));
                            setKeyTestStatus(null);
                          }}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            isSel
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <p className={`text-xs font-bold ${isSel ? 'text-indigo-900' : 'text-gray-900'}`}>{item.label}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom API Key Input for BYOK */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Key size={14} className="text-indigo-600" />
                      Custom API Key (BYOK)
                    </label>
                    {config.hasCustomApiKey && (
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <Check size={12} /> Key Encrypted &amp; Stored in Cloud
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showCustomKey ? 'text' : 'password'}
                        value={customKeyDraft}
                        onChange={e => {
                          setCustomKeyDraft(e.target.value);
                          setKeyTestStatus(null);
                        }}
                        placeholder={config.hasCustomApiKey ? '•••••••••••••••• (Enter new key to replace)' : 'Paste your API key (e.g. gsk_..., sk-..., AIza...)'}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustomKey(!showCustomKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCustomKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestKey}
                      disabled={isTestingKey || (!customKeyDraft.trim() && !config.hasCustomApiKey)}
                      className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded-lg disabled:opacity-40 transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
                    >
                      {isTestingKey ? <Loader size={13} className="animate-spin" /> : <Zap size={13} className="text-amber-500" />}
                      Test Key
                    </button>

                    {config.hasCustomApiKey && (
                      <button
                        type="button"
                        onClick={handleClearCustomKey}
                        className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-medium rounded-lg transition-colors shrink-0"
                      >
                        Remove Key
                      </button>
                    )}
                  </div>

                  {keyTestStatus && (
                    <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                      keyTestStatus.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {keyTestStatus.ok ? <Check size={13} /> : <AlertCircle size={13} />}
                      {keyTestStatus.msg}
                    </div>
                  )}

                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    💡 <strong>Bring Your Own Key benefit:</strong> When you provide your own API key, all bot replies are 100% free and exempt from monthly quota limits. Free API keys are available at <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline">Groq Console</a> (Recommended for &lt;300ms speed) and <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline">Google AI Studio</a>.
                  </p>
                </div>

                {/* Model Override */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    AI Model Preset / Override
                  </label>
                  <select
                    value={config.aiModel || (config.aiProvider === 'openai' ? 'gpt-4o-mini' : config.aiProvider === 'gemini' ? 'gemini-2.5-flash' : 'llama-3.3-70b-versatile')}
                    onChange={e => setConfig(prev => ({ ...prev, aiModel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <optgroup label="Groq LPU (Ultra-Low Latency)">
                      <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (Recommended)</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fastest)</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
                      <option value="deepseek-r1-distill-llama-70b">deepseek-r1-distill-llama-70b</option>
                    </optgroup>
                    <optgroup label="Google Gemini">
                      <option value="gemini-2.5-flash">gemini-2.5-flash (Standard 2026)</option>
                      <option value="gemini-flash-latest">gemini-flash-latest</option>
                      <option value="gemini-3.7-flash">gemini-3.7-flash (High Reasoning)</option>
                    </optgroup>
                    <optgroup label="OpenAI">
                      <option value="gpt-4o-mini">gpt-4o-mini (Fast &amp; Cost Efficient)</option>
                      <option value="gpt-4o">gpt-4o (Flagship Model)</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Excluded Numbers */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
              <Ban size={16} className="text-red-500" /> Excluded Numbers
            </h2>
            <p className="text-xs text-gray-500 mb-4">Auto-reply will be silently skipped for these numbers. Enter numbers with country code (e.g. 919876543210).</p>
            <div className="space-y-2.5">
              {config.excludedNumbers.map((num, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={num}
                    onChange={e => updateExcluded(i, e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 919876543210"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none font-mono"
                  />
                  <button
                    onClick={() => removeExcluded(i)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addExcluded}
              className="mt-3 flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              <Plus size={15} /> Add number to exclude
            </button>
          </div>

          {/* Smart AI Detection Settings */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
            <button
              onClick={() => setAiDetectionExpanded(!aiDetectionExpanded)}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Shield size={16} className="text-purple-500" /> Smart AI Detection
              </h2>
              {aiDetectionExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {aiDetectionExpanded && (
              <div className="px-5 pb-5 pt-0 border-t border-gray-100 space-y-4">
                <p className="text-xs text-gray-500 mt-4">
                  Automatically detect and stop bot-to-bot conversations. When enabled, the system analyzes message patterns, frequency, and timing to identify automated systems.
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Enable AI Detection</label>
                    <p className="text-xs text-gray-500 mt-0.5">Detect and block automated bot interactions</p>
                  </div>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, enableAIDetection: !prev.enableAIDetection }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${config.enableAIDetection ? 'bg-purple-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${config.enableAIDetection ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                {config.enableAIDetection && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Messages Per Hour
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={maxMessagesDraft}
                        onChange={e => setMaxMessagesDraft(e.target.value)}
                        onBlur={e => {
                          const parsed = parseInt(e.target.value);
                          const validated = !isNaN(parsed) ? Math.max(1, Math.min(100, parsed)) : 30;
                          setConfig(prev => ({ ...prev, maxMessagesPerHour: validated }));
                          setMaxMessagesDraft(String(validated));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Flag contact if they send more messages than this in one hour</p>
                    </div>

                  </>
                )}
              </div>
            )}
          </div>

          {/* Human Agent Handoff Settings */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
            <button
              onClick={() => setHandoffExpanded(!handoffExpanded)}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <User size={16} className="text-blue-500" /> Human Agent Handoff
              </h2>
              {handoffExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {handoffExpanded && (
              <div className="px-5 pb-5 pt-0 border-t border-gray-100 space-y-4">
                <p className="text-xs text-gray-500 mt-4">
                  Seamlessly transfer conversations to a human agent when customers request it. Configure keywords and agent phone number below.
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Enable Auto Handoff</label>
                    <p className="text-xs text-gray-500 mt-0.5">Automatically transfer to human agent on keyword match</p>
                  </div>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, enableAutoHandoff: !prev.enableAutoHandoff }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${config.enableAutoHandoff ? 'bg-blue-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${config.enableAutoHandoff ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                {config.enableAutoHandoff && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Human Agent Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={config.humanAgentPhone || ''}
                        onChange={e => setConfig(prev => ({ ...prev, humanAgentPhone: e.target.value }))}
                        placeholder="+919876543210"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">Include country code with + (e.g., +919876543210)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Handoff Keywords
                      </label>
                      <p className="text-xs text-gray-500 mb-2">When customer uses these words, they'll be transferred to a human agent</p>
                      <div className="space-y-2">
                        {(config.handoffKeywords || []).map((keyword, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={keyword}
                              onChange={e => updateHandoffKeyword(i, e.target.value)}
                              placeholder={`Keyword ${i + 1}`}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            {(config.handoffKeywords || []).length > 1 && (
                              <button
                                onClick={() => removeHandoffKeyword(i)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={addHandoffKeyword}
                        className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Plus size={15} /> Add keyword
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Advanced Dispatch Rules Settings */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
            <button
              onClick={() => setAdvancedSettingsExpanded(!advancedSettingsExpanded)}
              className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Code2 size={16} className="text-indigo-500" /> Advanced Dispatch Rules
              </h2>
              {advancedSettingsExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {advancedSettingsExpanded && (
              <div className="px-5 pb-5 pt-0 border-t border-gray-100 space-y-5">
                <p className="text-xs text-gray-500 mt-4">
                  Configure special conditions for when the AI bot should reply, including co-pilot mode and scheduled active hours.
                </p>

                {/* Co-pilot Mode Toggle */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Human Co-Pilot Mode</label>
                      <p className="text-xs text-gray-500 mt-0.5">Only reply when I am offline/inactive in the chat</p>
                    </div>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, onlyReplyOffline: !prev.onlyReplyOffline }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${config.onlyReplyOffline ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${config.onlyReplyOffline ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  {config.onlyReplyOffline && (
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Idle Duration Before Bot Response (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={config.offlineIdleMinutes ?? 3}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setConfig(prev => ({ ...prev, offlineIdleMinutes: isNaN(val) ? 3 : val }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                      <p className="text-[11px] text-gray-500 mt-1">
                        The bot will only respond to incoming messages if you haven't sent any messages in this chat for the specified number of minutes.
                      </p>
                    </div>
                  )}
                </div>

                {/* Restricted Hours Toggle */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Active Schedule Only</label>
                      <p className="text-xs text-gray-500 mt-0.5">Restrict bot replies to specific hours of the day</p>
                    </div>
                    <button
                      onClick={() => setConfig(prev => ({ ...prev, restrictedHoursEnabled: !prev.restrictedHoursEnabled }))}
                      className={`relative w-11 h-6 rounded-full transition-colors ${config.restrictedHoursEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${config.restrictedHoursEnabled ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  {config.restrictedHoursEnabled && (
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Active Hours Start</label>
                          <input
                            type="time"
                            value={config.restrictedHoursStart || '00:00'}
                            onChange={e => setConfig(prev => ({ ...prev, restrictedHoursStart: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Active Hours End</label>
                          <input
                            type="time"
                            value={config.restrictedHoursEnd || '06:00'}
                            onChange={e => setConfig(prev => ({ ...prev, restrictedHoursEnd: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500">
                        The bot will only operate and auto-reply during the selected time interval (e.g. 00:00 to 06:00). You can span this across midnight (e.g. 22:00 to 06:00).
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 shadow-sm"
          >
            {isSaving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Saving…' : 'Save Bot Configuration'}
          </button>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-sm text-white font-medium transition-all ${
          toast.ok ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
