import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Smartphone,
  Shield,
  Zap,
  CheckCircle2,
  Plus,
  Trash2,
  Send,
  RefreshCw,
  MessageSquare,
  Bot,
  Radio,
  ArrowLeft,
  Copy,
  Check,
  Globe,
  FileText
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import {
  WhatsAppBusinessAccount,
  WhatsAppBusinessTemplate,
  WhatsAppBusinessMessage
} from '@/types/whatsapp_business';

type TabType = 'connect' | 'templates' | 'broadcast' | 'direct' | 'inbox' | 'bot';

export function WhatsappBusinessPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('connect');
  const [account, setAccount] = useState<WhatsAppBusinessAccount | null>(null);
  const [appId, setAppId] = useState<string>('');
  const [configId, setConfigId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);

  // Manual BYOK modal
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualWabaId, setManualWabaId] = useState('');
  const [manualPhoneId, setManualPhoneId] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [manualDisplayPhone, setManualDisplayPhone] = useState('');
  const [manualVerifiedName, setManualVerifiedName] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<WhatsAppBusinessTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [newTemplateLanguage, setNewTemplateLanguage] = useState('en_US');
  const [newTemplateBody, setNewTemplateBody] = useState('');
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  // Direct Send state
  const [directPhone, setDirectPhone] = useState('');
  const [directType, setDirectType] = useState<'text' | 'template'>('text');
  const [directMessage, setDirectMessage] = useState('');
  const [directSelectedTemplate, setDirectSelectedTemplate] = useState('');
  const [sendingDirect, setSendingDirect] = useState(false);
  const [sendSuccess, setSendSuccess] = useState('');
  const [sendError, setSendError] = useState('');

  // Broadcast state
  const [broadcastName, setBroadcastName] = useState('');
  const [broadcastRecipients, setBroadcastRecipients] = useState('');
  const [broadcastType, setBroadcastType] = useState<'text' | 'template'>('template');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastTemplate, setBroadcastTemplate] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<any>(null);

  // Messages Inbox state
  const [messages, setMessages] = useState<WhatsAppBusinessMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Bot Config state
  const [autoReply, setAutoReply] = useState(true);
  const [humanPhone, setHumanPhone] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [aiProvider, setAiProvider] = useState('openai');
  const [aiModel, setAiModel] = useState('gpt-4o-mini');
  const [savingBot, setSavingBot] = useState(false);
  const [botSavedSuccess, setBotSavedSuccess] = useState(false);

  const [sessionInfo, setSessionInfo] = useState<{ wabaId?: string; phoneId?: string }>({});

  const fetchStatus = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.whatsappBusiness.status);
      const json = await res.json();
      if (json.success && json.data) {
        setAccount(json.data.account);
        const resolvedAppId = json.data.appId || (import.meta.env.VITE_META_WA_APP_ID as string) || '';
        setAppId(resolvedAppId);
        setConfigId(json.data.configId || '');
        if (json.data.account) {
          setAutoReply(json.data.account.autoReplyEnabled ?? true);
          setHumanPhone(json.data.account.humanAgentPhone || '');
          setSystemPrompt(json.data.account.systemPrompt || '');
          setAiProvider(json.data.account.aiProvider || 'openai');
          setAiModel(json.data.account.aiModel || 'gpt-4o-mini');
        }

        // Initialize FB SDK if appId is present
        if (resolvedAppId && typeof window !== 'undefined') {
          initFacebookSDK(resolvedAppId);
        }
      }
    } catch (e) {
      console.error('Failed to fetch WhatsApp Business status:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const initFacebookSDK = (fbAppId: string) => {
    const fbWin = window as any;
    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      js.async = true;
      js.defer = true;
      js.onload = () => {
        if (fbWin.FB) {
          fbWin.FB.init({
            appId: fbAppId,
            autoLogAppEvents: true,
            xfbml: true,
            version: 'v21.0',
          });
        }
      };
      document.body.appendChild(js);
    } else if (fbWin.FB) {
      fbWin.FB.init({
        appId: fbAppId,
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v21.0',
      });
    }
  };

  useEffect(() => {
    fetchStatus();

    // Check URL parameters for OAuth redirect callback (?code=...)
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      handleExchangeCode(code);
    }

    // Listen for Meta Embedded Signup message events (session info)
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') {
        return;
      }
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.event === 'FINISH' || data.data?.phone_number_id || data.data?.waba_id) {
            setSessionInfo({
              wabaId: data.data?.waba_id,
              phoneId: data.data?.phone_number_id,
            });
          }
        }
      } catch {
        // non-json message, ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Fetch templates when tab changes to templates or direct/broadcast
  useEffect(() => {
    if (account?.isConnected && (activeTab === 'templates' || activeTab === 'direct' || activeTab === 'broadcast')) {
      fetchTemplates();
    }
    if (account?.isConnected && activeTab === 'inbox') {
      fetchMessages();
    }
  }, [activeTab, account?.isConnected]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.whatsappBusiness.templates);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTemplates(json.data);
      }
    } catch (e) {
      console.error('Failed to load templates:', e);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.whatsappBusiness.messages);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMessages(json.data);
      }
    } catch (e) {
      console.error('Failed to load messages:', e);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Meta Embedded Signup SDK handler
  const handleLaunchEmbeddedSignup = () => {
    const effectiveAppId = appId || (import.meta.env.VITE_META_WA_APP_ID as string) || '';
    if (!effectiveAppId) {
      alert('Meta App ID is not configured. Please use Manual BYOK or set META_WA_APP_ID in backend .env.');
      return;
    }

    const fbWindow = window as any;
    if (fbWindow.FB) {
      fbWindow.FB.login(
        (response: any) => {
          if (response.authResponse && response.authResponse.code) {
            handleExchangeCode(response.authResponse.code, sessionInfo.wabaId, sessionInfo.phoneId);
          } else {
            console.log('User cancelled login or did not fully authorize.');
          }
        },
        {
          config_id: configId || undefined,
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            feature: 'whatsapp_embedded_signup',
            version: 2,
            sessionInfoVersion: 2,
          },
        }
      );
    } else {
      // Direct Meta OAuth URL fallback
      const redirectUri = window.location.origin + '/fb/redirect';
      const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${effectiveAppId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=whatsapp_business_management,whatsapp_business_messaging&response_type=code`;
      window.location.href = oauthUrl;
    }
  };

  const handleExchangeCode = async (code: string, wabaId?: string, phoneId?: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.whatsappBusiness.exchangeCode, {
        method: 'POST',
        body: JSON.stringify({
          code,
          wabaId: wabaId || sessionInfo.wabaId,
          phoneNumberId: phoneId || sessionInfo.phoneId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchStatus();
        setActiveTab('connect');
      } else {
        alert('Embedded Signup exchange failed: ' + (json.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Network error during token exchange: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualWabaId || !manualPhoneId || !manualToken) {
      alert('WABA ID, Phone Number ID, and Access Token are required.');
      return;
    }
    setSavingManual(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.whatsappBusiness.manualConnect, {
        method: 'POST',
        body: JSON.stringify({
          wabaId: manualWabaId.trim(),
          phoneNumberId: manualPhoneId.trim(),
          accessToken: manualToken.trim(),
          displayPhoneNumber: manualDisplayPhone.trim(),
          verifiedName: manualVerifiedName.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowManualModal(false);
        await fetchStatus();
      } else {
        alert('Connection failed: ' + (json.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Error connecting: ' + e.message);
    } finally {
      setSavingManual(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this WhatsApp Business account?')) return;
    try {
      await apiFetch(API_ENDPOINTS.whatsappBusiness.disconnect, { method: 'POST' });
      await fetchStatus();
    } catch (e) {
      console.error('Failed to disconnect:', e);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName || !newTemplateBody) {
      alert('Template Name and Body are required.');
      return;
    }
    setCreatingTemplate(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.whatsappBusiness.templates, {
        method: 'POST',
        body: JSON.stringify({
          name: newTemplateName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          category: newTemplateCategory,
          language: newTemplateLanguage,
          components: [
            {
              type: 'BODY',
              text: newTemplateBody,
            },
          ],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowCreateTemplateModal(false);
        setNewTemplateName('');
        setNewTemplateBody('');
        await fetchTemplates();
      } else {
        alert('Template creation error: ' + (json.error || 'Failed'));
      }
    } catch (e: any) {
      alert('Error creating template: ' + e.message);
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (name: string) => {
    if (!confirm(`Delete template "${name}" from Meta?`)) return;
    try {
      const res = await apiFetch(API_ENDPOINTS.whatsappBusiness.deleteTemplate(name), { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        await fetchTemplates();
      } else {
        alert('Delete failed: ' + json.error);
      }
    } catch (e: any) {
      alert('Error deleting template: ' + e.message);
    }
  };

  const handleDirectSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendSuccess('');
    setSendError('');
    if (!directPhone) {
      setSendError('Recipient phone number is required.');
      return;
    }
    setSendingDirect(true);
    try {
      const payload: any = {
        toPhone: directPhone,
        messageType: directType,
      };
      if (directType === 'template') {
        payload.templateName = directSelectedTemplate;
      } else {
        payload.body = directMessage;
      }

      const res = await apiFetch(API_ENDPOINTS.whatsappBusiness.send, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setSendSuccess('Message sent successfully via Meta Cloud API!');
        setDirectMessage('');
        fetchMessages();
      } else {
        setSendError('Failed to send: ' + (json.error || 'Unknown error'));
      }
    } catch (e: any) {
      setSendError('Network error: ' + e.message);
    } finally {
      setSendingDirect(false);
    }
  };

  const handleBroadcastSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const phones = broadcastRecipients
      .split(/[\n,]+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 5);

    if (phones.length === 0) {
      alert('Please enter at least one recipient phone number.');
      return;
    }

    setBroadcasting(true);
    setBroadcastResult(null);
    try {
      const payload: any = {
        campaignName: broadcastName || 'Cloud API Broadcast',
        recipients: phones,
        messageType: broadcastType,
      };
      if (broadcastType === 'template') {
        payload.templateName = broadcastTemplate;
      } else {
        payload.body = broadcastBody;
      }

      const res = await apiFetch(API_ENDPOINTS.whatsappBusiness.broadcast, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setBroadcastResult(json.data);
      } else {
        alert('Broadcast failed: ' + (json.error || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Error broadcasting: ' + e.message);
    } finally {
      setBroadcasting(false);
    }
  };

  const handleSaveBotConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBot(true);
    setBotSavedSuccess(false);
    try {
      const res = await apiFetch(API_ENDPOINTS.whatsappBusiness.botConfig, {
        method: 'POST',
        body: JSON.stringify({
          autoReplyEnabled: autoReply,
          humanAgentPhone: humanPhone,
          systemPrompt,
          aiProvider,
          aiModel,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setBotSavedSuccess(true);
        setTimeout(() => setBotSavedSuccess(false), 3000);
      } else {
        alert('Save failed: ' + json.error);
      }
    } catch (e: any) {
      alert('Error saving bot: ' + e.message);
    } finally {
      setSavingBot(false);
    }
  };

  const webhookUrl = `${window.location.origin}/api/whatsapp-business/webhook`;
  const verifyToken = 'nexbotix_meta_webhook_token_2026';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Smartphone size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base text-white tracking-tight">WhatsApp Business Cloud API</h1>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Meta Official
                </span>
              </div>
              <p className="text-xs text-slate-400">Embedded Signup & High-Throughput Cloud Engine</p>
            </div>
          </div>
        </div>

        {/* Right Status Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setRefreshing(true);
              fetchStatus();
            }}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Refresh Status"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-emerald-400' : ''} />
          </button>

          {account?.isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{account.verifiedName || account.displayPhoneNumber || 'Connected'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Not Connected</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/40 p-4 space-y-1 flex flex-col justify-between">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('connect')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'connect'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Zap size={18} />
              <span>Connect & Setup</span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'templates'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText size={18} />
              <span>Meta Templates</span>
            </button>

            <button
              onClick={() => setActiveTab('broadcast')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'broadcast'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Radio size={18} />
              <span>Cloud Broadcast</span>
            </button>

            <button
              onClick={() => setActiveTab('direct')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'direct'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Send size={18} />
              <span>Direct Sender</span>
            </button>

            <button
              onClick={() => setActiveTab('inbox')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'inbox'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare size={18} />
              <span>Live Inbox</span>
            </button>

            <button
              onClick={() => setActiveTab('bot')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === 'bot'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Bot size={18} />
              <span>AI Auto-Reply</span>
            </button>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <Shield size={14} className="text-emerald-400" />
              <span>Cloud API Benefits</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
              <li>0% Phone Ban Risk</li>
              <li>Official Meta Green Tick</li>
              <li>High-Throughput (80 msg/s)</li>
              <li>Auto Tier Growth</li>
            </ul>
          </div>
        </aside>

        {/* Workspace Body */}
        <main className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">
          {/* TAB 1: CONNECT & SETUP */}
          {activeTab === 'connect' && (
            <div className="space-y-6">
              {account?.isConnected ? (
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 size={28} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          {account.verifiedName || 'WhatsApp Business Account'}
                          <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-normal">
                            Active
                          </span>
                        </h2>
                        <p className="text-sm text-slate-400">{account.displayPhoneNumber || 'Registered Phone'}</p>
                      </div>
                    </div>

                    <button
                      onClick={handleDisconnect}
                      className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition"
                    >
                      Disconnect Account
                    </button>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                      <p className="text-xs text-slate-400">WABA ID</p>
                      <p className="text-sm font-mono text-slate-200 mt-1 font-semibold">{account.wabaId || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                      <p className="text-xs text-slate-400">Phone Number ID</p>
                      <p className="text-sm font-mono text-slate-200 mt-1 font-semibold">{account.phoneNumberId || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                      <p className="text-xs text-slate-400">Quality Rating</p>
                      <p className="text-sm text-emerald-400 mt-1 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        {account.qualityRating || 'GREEN'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-b from-slate-900 to-slate-900/60 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 max-w-2xl mx-auto">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                    <Zap size={32} />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Connect WhatsApp Business Cloud API</h2>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      Onboard your official WhatsApp Business number via Meta Embedded Signup with zero server setup.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={handleLaunchEmbeddedSignup}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#1877f2] hover:bg-[#166fe5] text-white text-sm font-semibold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 transition transform hover:-translate-y-0.5"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12.07h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.988C20.343 21.201 24 17.064 24 12.073z" />
                      </svg>
                      <span>Connect with Meta Embedded Signup</span>
                    </button>

                    <button
                      onClick={() => setShowManualModal(true)}
                      className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
                    >
                      Manual / Enterprise BYOK
                    </button>
                  </div>
                </div>
              )}

              {/* Webhook Settings Box */}
              <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Globe size={16} className="text-emerald-400" />
                      <span>Meta Webhook Configuration</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure these in Meta for Developers &gt; WhatsApp &gt; Configuration to receive incoming messages & status callbacks.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs text-slate-400 font-medium">Callback URL</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={webhookUrl}
                        className="flex-1 bg-slate-950 px-3 py-2 rounded-xl text-xs font-mono text-slate-300 border border-slate-800"
                      />
                      <button
                        onClick={() => copyToClipboard(webhookUrl)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-300 border border-slate-700 flex items-center gap-1.5"
                      >
                        {copiedWebhook ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-medium">Verify Token</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={verifyToken}
                        className="flex-1 bg-slate-950 px-3 py-2 rounded-xl text-xs font-mono text-slate-300 border border-slate-800"
                      />
                      <button
                        onClick={() => copyToClipboard(verifyToken)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-300 border border-slate-700 flex items-center gap-1.5"
                      >
                        <Copy size={14} />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: META TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Meta Message Templates</h2>
                  <p className="text-xs text-slate-400">Manage pre-approved WhatsApp Business message templates</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchTemplates}
                    disabled={loadingTemplates}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
                  >
                    <RefreshCw size={16} className={loadingTemplates ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={() => setShowCreateTemplateModal(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
                  >
                    <Plus size={16} />
                    <span>Create Template</span>
                  </button>
                </div>
              </div>

              {loadingTemplates ? (
                <div className="py-12 text-center text-slate-400 text-sm">Loading Meta templates...</div>
              ) : templates.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                  <FileText size={32} className="mx-auto text-slate-600" />
                  <p className="text-sm text-slate-300 font-semibold">No Templates Found</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Create your first Meta WhatsApp template or sync existing templates from your WhatsApp Business Account.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((tmpl) => (
                    <div key={tmpl.name} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-white">{tmpl.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {tmpl.category}
                            </span>
                            <span className="text-[10px] text-slate-400">{tmpl.language}</span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            tmpl.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : tmpl.status === 'REJECTED'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {tmpl.status}
                        </span>
                      </div>

                      <div className="bg-slate-950/80 p-3 rounded-xl text-xs text-slate-300 whitespace-pre-wrap font-sans border border-slate-800/60">
                        {tmpl.components?.find((c) => c.type === 'BODY')?.text || '(No body text)'}
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => handleDeleteTemplate(tmpl.name)}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CLOUD BROADCAST */}
          {activeTab === 'broadcast' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-lg font-bold text-white">Cloud Broadcast Campaign</h2>
                <p className="text-xs text-slate-400">Broadcast official template or text messages to customer lists</p>
              </div>

              <form onSubmit={handleBroadcastSend} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div>
                  <label className="text-xs text-slate-300 font-medium">Campaign Name</label>
                  <input
                    type="text"
                    value={broadcastName}
                    onChange={(e) => setBroadcastName(e.target.value)}
                    placeholder="e.g. Autumn Flash Sale"
                    className="w-full mt-1 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium">Message Type</label>
                  <div className="flex gap-4 mt-1.5">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="btype"
                        checked={broadcastType === 'template'}
                        onChange={() => setBroadcastType('template')}
                        className="text-emerald-500"
                      />
                      <span>Meta Approved Template</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="btype"
                        checked={broadcastType === 'text'}
                        onChange={() => setBroadcastType('text')}
                        className="text-emerald-500"
                      />
                      <span>Freeform Text</span>
                    </label>
                  </div>
                </div>

                {broadcastType === 'template' ? (
                  <div>
                    <label className="text-xs text-slate-300 font-medium">Select Template</label>
                    <select
                      value={broadcastTemplate}
                      onChange={(e) => setBroadcastTemplate(e.target.value)}
                      className="w-full mt-1 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-sm text-white"
                    >
                      <option value="">-- Choose Template --</option>
                      {templates
                        .filter((t) => t.status === 'APPROVED')
                        .map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name} ({t.language})
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-slate-300 font-medium">Message Content</label>
                    <textarea
                      rows={4}
                      value={broadcastBody}
                      onChange={(e) => setBroadcastBody(e.target.value)}
                      placeholder="Write your broadcast message..."
                      className="w-full mt-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-300 font-medium">
                    Recipients (comma or newline separated phone numbers with country code)
                  </label>
                  <textarea
                    rows={4}
                    value={broadcastRecipients}
                    onChange={(e) => setBroadcastRecipients(e.target.value)}
                    placeholder="919876543210&#10;15551234567"
                    className="w-full mt-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm font-mono text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={broadcasting}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                >
                  {broadcasting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>{broadcasting ? 'Broadcasting via Cloud API...' : 'Launch Cloud Broadcast'}</span>
                </button>
              </form>

              {broadcastResult && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-emerald-400">Broadcast Completed!</p>
                  <p className="text-xs text-slate-300">
                    Total: {broadcastResult.total} | Sent: {broadcastResult.sent} | Failed: {broadcastResult.failed}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DIRECT SENDER */}
          {activeTab === 'direct' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <h2 className="text-lg font-bold text-white">Direct Message Sender</h2>
                <p className="text-xs text-slate-400">Send an instant Cloud API message or template to any recipient</p>
              </div>

              <form onSubmit={handleDirectSend} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                {sendSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
                    {sendSuccess}
                  </div>
                )}
                {sendError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                    {sendError}
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-300 font-medium">Recipient Phone (with country code)</label>
                  <input
                    type="text"
                    value={directPhone}
                    onChange={(e) => setDirectPhone(e.target.value)}
                    placeholder="e.g. 917679349780"
                    className="w-full mt-1 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-sm text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium">Type</label>
                  <div className="flex gap-4 mt-1.5">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={directType === 'text'}
                        onChange={() => setDirectType('text')}
                      />
                      <span>Text Message</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        checked={directType === 'template'}
                        onChange={() => setDirectType('template')}
                      />
                      <span>Template</span>
                    </label>
                  </div>
                </div>

                {directType === 'template' ? (
                  <div>
                    <label className="text-xs text-slate-300 font-medium">Select Template</label>
                    <select
                      value={directSelectedTemplate}
                      onChange={(e) => setDirectSelectedTemplate(e.target.value)}
                      className="w-full mt-1 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-sm text-white"
                    >
                      <option value="">-- Choose Template --</option>
                      {templates.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-slate-300 font-medium">Message Body</label>
                    <textarea
                      rows={3}
                      value={directMessage}
                      onChange={(e) => setDirectMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="w-full mt-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm text-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sendingDirect}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                >
                  {sendingDirect ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>{sendingDirect ? 'Sending...' : 'Send Message'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: LIVE INBOX */}
          {activeTab === 'inbox' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Live Cloud Messages</h2>
                  <p className="text-xs text-slate-400">Inbound and outbound WhatsApp Cloud API conversation history</p>
                </div>
                <button
                  onClick={fetchMessages}
                  disabled={loadingMessages}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
                >
                  <RefreshCw size={16} className={loadingMessages ? 'animate-spin' : ''} />
                </button>
              </div>

              {loadingMessages ? (
                <div className="py-12 text-center text-slate-400 text-sm">Loading message log...</div>
              ) : messages.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                  No Cloud API messages logged yet.
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60">
                  {messages.map((m) => (
                    <div key={m.id || m.wamid} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-800/30">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              m.direction === 'inbound'
                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {m.direction === 'inbound' ? 'INCOMING' : 'OUTGOING'}
                          </span>
                          <span className="text-xs font-mono font-semibold text-slate-300">
                            {m.direction === 'inbound' ? m.fromPhone : m.toPhone}
                          </span>
                          <span className="text-[10px] text-slate-500">{new Date(m.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-300">{m.body}</p>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          m.status === 'read'
                            ? 'bg-sky-500/20 text-sky-400'
                            : m.status === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : m.status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AI AUTO-REPLY BOT */}
          {activeTab === 'bot' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-lg font-bold text-white">AI Auto-Reply Configuration</h2>
                <p className="text-xs text-slate-400">Configure AI responses and human agent handoffs for your Cloud API number</p>
              </div>

              <form onSubmit={handleSaveBotConfig} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                {botSavedSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
                    Bot configuration saved successfully!
                  </div>
                )}

                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-white">Enable AI Auto-Reply</p>
                    <p className="text-xs text-slate-400">Automatically reply to inbound customer messages via Cloud API</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoReply}
                      onChange={(e) => setAutoReply(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium">Human Agent Notification Phone Number</label>
                  <input
                    type="text"
                    value={humanPhone}
                    onChange={(e) => setHumanPhone(e.target.value)}
                    placeholder="e.g. +916290902922"
                    className="w-full mt-1 bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-sm text-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    When a customer asks for a human, the bot synthesizes an executive summary and notifies this number.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-300 font-medium">AI Provider</label>
                    <select
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value)}
                      className="w-full mt-1 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs text-white"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="groq">Groq (Llama 3)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-medium">Model</label>
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full mt-1 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs text-white"
                    >
                      <option value="gpt-4o-mini">gpt-4o-mini</option>
                      <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium">System Prompt & Instructions</label>
                  <textarea
                    rows={4}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="You are an AI sales assistant for Nexbotix..."
                    className="w-full mt-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingBot}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition"
                >
                  {savingBot ? 'Saving...' : 'Save AI Settings'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Manual Connect Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Manual / Enterprise BYOK Connect</h3>
            <p className="text-xs text-slate-400">
              Enter your WhatsApp Business Account (WABA) details and System User Permanent Token from Meta Business Manager.
            </p>

            <form onSubmit={handleManualConnect} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300">WABA ID *</label>
                <input
                  type="text"
                  required
                  value={manualWabaId}
                  onChange={(e) => setManualWabaId(e.target.value)}
                  placeholder="e.g. 102938475610293"
                  className="w-full mt-1 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Phone Number ID *</label>
                <input
                  type="text"
                  required
                  value={manualPhoneId}
                  onChange={(e) => setManualPhoneId(e.target.value)}
                  placeholder="e.g. 987654321098765"
                  className="w-full mt-1 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Permanent System User Access Token *</label>
                <input
                  type="password"
                  required
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="EAAG..."
                  className="w-full mt-1 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Display Phone Number (optional)</label>
                <input
                  type="text"
                  value={manualDisplayPhone}
                  onChange={(e) => setManualDisplayPhone(e.target.value)}
                  placeholder="e.g. +1 555-0100"
                  className="w-full mt-1 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Verified Business Name (optional)</label>
                <input
                  type="text"
                  value={manualVerifiedName}
                  onChange={(e) => setManualVerifiedName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full mt-1 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                >
                  {savingManual ? 'Connecting...' : 'Connect WABA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create Meta Message Template</h3>

            <form onSubmit={handleCreateTemplate} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300">Template Name (lowercase, no spaces) *</label>
                <input
                  type="text"
                  required
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="welcome_promo_v1"
                  className="w-full mt-1 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300">Category</label>
                  <select
                    value={newTemplateCategory}
                    onChange={(e: any) => setNewTemplateCategory(e.target.value)}
                    className="w-full mt-1 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs text-white"
                  >
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300">Language</label>
                  <select
                    value={newTemplateLanguage}
                    onChange={(e) => setNewTemplateLanguage(e.target.value)}
                    className="w-full mt-1 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs text-white"
                  >
                    <option value="en_US">English (US)</option>
                    <option value="en_GB">English (UK)</option>
                    <option value="hi">Hindi</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300">Body Text (use {"{{1}}"}, {"{{2}}"} for variables) *</label>
                <textarea
                  rows={4}
                  required
                  value={newTemplateBody}
                  onChange={(e) => setNewTemplateBody(e.target.value)}
                  placeholder="Hi {{1}}, thank you for contacting us! Your order #{{2}} has been confirmed."
                  className="w-full mt-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-white font-sans"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTemplateModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTemplate}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                >
                  {creatingTemplate ? 'Submitting...' : 'Submit to Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
