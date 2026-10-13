import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/config/api';
import {
  Bot, Globe, Loader2, Send, CheckCircle2, Palette, Settings,
  Mail, Phone, ArrowRight, X, MessageSquare, Sparkles, ChevronRight,
} from 'lucide-react';

function sanitizeChatHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

interface Demo {
  id: string;
  websiteUrl: string;
  businessName: string;
  description: string;
  services: string[];
  primaryColor: string;
  welcomeMessage: string;
  leadEmail: string;
  leadWhatsApp: string;
  pagesCrawled: number;
  expiresAt: string;
}

interface ChatMsg { role: 'user' | 'bot'; text: string; }

type PanelTab = 'chat' | 'customize' | 'leads';

export function ChatbotDemoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [demo, setDemo] = useState<Demo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chat
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [apiHistory, setApiHistory] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Panel
  const [activeTab, setActiveTab] = useState<PanelTab>('chat');

  // Customize
  const [color, setColor] = useState('#16a34a');
  const [welcome, setWelcome] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Lead
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSaved, setLeadSaved] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);

  // Show lead form inline during chat
  const [showInlineLeadForm, setShowInlineLeadForm] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(API_ENDPOINTS.chatbotDemo.get(id));
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Demo not found');
        setDemo(data.data);
        setColor(data.data.primaryColor || '#16a34a');
        setWelcome(data.data.welcomeMessage || '');
        setMessages([{ role: 'bot', text: data.data.welcomeMessage }]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Demo not found or expired');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const sendChat = async () => {
    if (!demo || !chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    const newMessages: ChatMsg[] = [...messages, { role: 'user', text: msg }];
    setMessages(newMessages);
    setChatLoading(true);

    try {
      const res = await fetch(API_ENDPOINTS.chatbotDemo.chat(demo.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, sessionId, chatHistory: apiHistory }),
      });
      const data = await res.json();
      if (data.success) {
        const updated: ChatMsg[] = [...newMessages, { role: 'bot', text: data.data.reply }];
        setMessages(updated);
        setApiHistory(data.data.chatHistory);
        if (data.data.showLeadForm && !leadSaved) setShowInlineLeadForm(true);
      }
    } catch {
      setMessages([...newMessages, { role: 'bot', text: 'Sorry, I had trouble responding. Please try again.' }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => {
        const el = chatContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }, 50);
    }
  };

  const saveCustomize = async () => {
    if (!demo) return;
    setSaving(true);
    try {
      const res = await fetch(API_ENDPOINTS.chatbotDemo.update(demo.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryColor: color, welcomeMessage: welcome }),
      });
      const data = await res.json();
      if (data.success) {
        setDemo(data.data);
        setMessages([{ role: 'bot', text: welcome || data.data.welcomeMessage }, ...messages.slice(1)]);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const saveLead = async () => {
    if (!demo || !leadName.trim() || !leadEmail.trim()) return;
    setLeadLoading(true);
    try {
      await fetch(API_ENDPOINTS.chatbotDemo.lead(demo.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: leadName, email: leadEmail, phone: leadPhone, chatHistory: apiHistory }),
      });
      setLeadSaved(true);
      setShowInlineLeadForm(false);
    } finally {
      setLeadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-green-600 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Loading your chatbot demo…</p>
        </div>
      </div>
    );
  }

  if (error || !demo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={28} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Demo Not Available</h2>
          <p className="text-gray-600 text-sm mb-6">{error || 'This demo link has expired or does not exist.'}</p>
          <button
            onClick={() => navigate('/check-chatbot')}
            className="px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-xl hover:bg-green-700 transition-colors"
          >
            Create New Demo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: demo.primaryColor }}>
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-none">{demo.businessName}</p>
              <a href={demo.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                <Globe size={10} /> {demo.websiteUrl.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 font-medium">
              <Sparkles size={12} />
              Demo Mode
            </div>
            <button
              onClick={() => navigate('/signup')}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Get This Chatbot <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: info panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 text-lg mb-1">{demo.businessName}</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{demo.description}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" />{demo.pagesCrawled} pages scanned</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-green-500" />{demo.services.length} services trained</span>
            </div>
          </div>

          {/* Services */}
          {demo.services.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <Bot size={15} className="text-green-600" /> Bot Knowledge
              </h3>
              <ul className="space-y-1.5">
                {demo.services.slice(0, 6).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                    <CheckCircle2 size={12} className="text-green-500 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{s}</span>
                  </li>
                ))}
                {demo.services.length > 6 && (
                  <li className="text-xs text-gray-400">+{demo.services.length - 6} more services</li>
                )}
              </ul>
            </div>
          )}

          {/* CTA card */}
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-5 text-white">
            <h3 className="font-bold text-base mb-1">Want this on your website?</h3>
            <p className="text-green-100 text-xs mb-3 leading-relaxed">Sign up free and deploy this AI chatbot in minutes. Capture leads 24/7.</p>
            <button
              onClick={() => navigate('/signup')}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-green-700 font-semibold text-sm rounded-xl hover:bg-green-50 transition-colors"
            >
              Start Free <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right: chatbot panel */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ minHeight: '560px' }}>
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {([
              { key: 'chat', icon: MessageSquare, label: 'Chat Test' },
              { key: 'customize', icon: Palette, label: 'Customize' },
              { key: 'leads', icon: Mail, label: 'Lead Alerts' },
            ] as { key: PanelTab; icon: typeof MessageSquare; label: string }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Chat tab */}
          {activeTab === 'chat' && (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50" style={{ background: color }}>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-none">{demo.businessName} AI Assistant</p>
                  <p className="text-white/70 text-xs mt-0.5">Powered by NexBotix · Demo</p>
                </div>
              </div>

              {/* Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'bot' && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 shrink-0 mt-0.5" style={{ background: color }}>
                        <Bot size={12} className="text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'text-white rounded-tr-sm'
                          : 'bg-gray-100 text-gray-800 rounded-tl-sm chat-html'
                      }`}
                      style={msg.role === 'user' ? { background: color } : {}}
                      {...(msg.role === 'bot'
                        ? { dangerouslySetInnerHTML: { __html: sanitizeChatHtml(msg.text) } }
                        : { children: msg.text }
                      )}
                    />
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 shrink-0" style={{ background: color }}>
                      <Bot size={12} className="text-white" />
                    </div>
                    <div className="bg-gray-100 px-3 py-2.5 rounded-2xl rounded-tl-sm">
                      <Loader2 size={14} className="animate-spin text-gray-400" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Inline lead form */}
              {showInlineLeadForm && !leadSaved && (
                <div className="border-t border-gray-100 bg-green-50 px-4 py-3">
                  <p className="text-xs font-medium text-green-800 mb-2 flex items-center gap-1.5">
                    <Phone size={12} /> Leave your details to continue
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Name"
                      value={leadName}
                      onChange={e => setLeadName(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-green-500 bg-white"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={leadEmail}
                      onChange={e => setLeadEmail(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-green-500 bg-white"
                    />
                    <button
                      onClick={() => { if (leadName && leadEmail) saveLead(); }}
                      className="px-3 py-1.5 text-white text-xs font-medium rounded-lg shrink-0"
                      style={{ background: color }}
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
              {leadSaved && (
                <div className="border-t border-gray-100 bg-green-50 px-4 py-2 flex items-center gap-2 text-xs text-green-700">
                  <CheckCircle2 size={13} /> Lead saved! You'll be notified when they chat.
                </div>
              )}

              {/* Input */}
              <div className="border-t border-gray-100 p-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message to test the bot…"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500"
                />
                <button
                  onClick={sendChat}
                  disabled={!chatInput.trim() || chatLoading}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-white disabled:opacity-40"
                  style={{ background: color }}
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}

          {/* Customize tab */}
          {activeTab === 'customize' && (
            <div className="flex-1 p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Palette size={14} /> Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 w-32 font-mono"
                  />
                  <div className="flex-1 h-10 rounded-lg" style={{ background: color }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare size={14} /> Welcome Message
                </label>
                <textarea
                  value={welcome}
                  onChange={e => setWelcome(e.target.value)}
                  rows={3}
                  placeholder="Hi! How can I help you today?"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={saveCustomize}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl disabled:opacity-60 transition-colors"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Settings size={14} />}
                  {saving ? 'Saving…' : 'Apply Changes'}
                </button>
                {saveSuccess && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Saved!
                  </span>
                )}
              </div>

              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                <strong>Sign up to unlock:</strong> custom logo, font, position, widget size, domain whitelist, and more.
                <button onClick={() => navigate('/signup')} className="block mt-2 text-green-700 font-semibold underline text-xs">
                  Get full access →
                </button>
              </div>
            </div>
          )}

          {/* Lead Alerts tab */}
          {activeTab === 'leads' && (
            <div className="flex-1 p-5 space-y-5">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <Mail size={16} className="text-green-600" /> Lead Alert Settings
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  When a visitor submits their details through this chatbot, you'll be notified instantly.
                </p>
              </div>

              {leadSaved ? (
                <div className="flex items-center gap-2 text-green-700 text-sm font-medium p-3 bg-green-50 rounded-xl">
                  <CheckCircle2 size={16} /> Contact saved! You'll receive lead alerts.
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Your Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={leadName}
                      onChange={e => setLeadName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="you@business.com"
                      value={leadEmail}
                      onChange={e => setLeadEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Phone size={11} /> WhatsApp Number (optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={leadPhone}
                      onChange={e => setLeadPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500"
                    />
                  </div>
                  <button
                    onClick={saveLead}
                    disabled={leadLoading || !leadName.trim() || !leadEmail.trim()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    {leadLoading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                    Save Alert Preferences
                  </button>
                </div>
              )}

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                <strong>Full Lead Management:</strong> Sign up to access real-time lead dashboard, WhatsApp notifications, webhook integrations, and CRM sync.
                <button onClick={() => navigate('/signup')} className="block mt-2 text-amber-700 font-semibold underline text-xs">
                  Upgrade now →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
