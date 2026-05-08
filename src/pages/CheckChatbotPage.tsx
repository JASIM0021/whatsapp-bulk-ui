import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiFetch } from '@/config/api';
import {
  Globe, Search, Loader2, CheckCircle2, Bot, ArrowRight,
  Sparkles, Mail, Phone, MessageSquare, ChevronRight, X, Send, Lock,
} from 'lucide-react';

// Strip dangerous tags from AI-generated HTML, keeping safe formatting tags
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
  pagesCrawled: number;
}

interface ChatMsg { role: 'user' | 'bot'; text: string; }

export function CheckChatbotPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demo, setDemo] = useState<Demo | null>(null);
  const [repliesRemaining, setRepliesRemaining] = useState(50);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatLimitHit, setChatLimitHit] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));

  // Lead capture
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSaved, setLeadSaved] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleCheck = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setError('');
    setLoading(true);
    setDemo(null);
    setChatMessages([]);
    setChatHistory([]);
    setChatLimitHit(false);

    try {
      const res = await apiFetch(API_ENDPOINTS.chatbotDemo.check, {
        method: 'POST',
        body: JSON.stringify({ websiteUrl: trimmed }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to analyze website');
      setDemo(data.data);
      setRepliesRemaining(data.data.repliesRemaining ?? 50);
      setChatMessages([{ role: 'bot', text: data.data.welcomeMessage }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not analyze website. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!demo || !chatInput.trim() || chatLoading || chatLimitHit) return;
    const msg = chatInput.trim();
    setChatInput('');
    const newMessages: ChatMsg[] = [...chatMessages, { role: 'user', text: msg }];
    setChatMessages(newMessages);
    setChatLoading(true);

    try {
      const res = await fetch(API_ENDPOINTS.chatbotDemo.chat(demo.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, sessionId, chatHistory }),
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages([...newMessages, { role: 'bot', text: data.data.reply }]);
        setChatHistory(data.data.chatHistory);
        const remaining = data.data.repliesRemaining ?? repliesRemaining - 1;
        setRepliesRemaining(remaining);
        if (remaining <= 0) setChatLimitHit(true);
        if (data.data.showLeadForm) setShowLeadForm(true);
      } else {
        // Limit hit or other error
        const errMsg = data.error || 'Could not get a response.';
        setChatMessages([...newMessages, { role: 'bot', text: errMsg }]);
        if (errMsg.includes('limit')) setChatLimitHit(true);
      }
    } catch {
      setChatMessages([...newMessages, { role: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => {
        const el = chatContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }, 50);
    }
  };

  const handleSaveLead = async () => {
    if (!demo || !leadName.trim() || !leadEmail.trim()) return;
    setLeadLoading(true);
    try {
      await fetch(API_ENDPOINTS.chatbotDemo.lead(demo.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: leadName, email: leadEmail, phone: leadPhone, chatHistory }),
      });
      setLeadSaved(true);
    } catch {
      // silently ignore
    } finally {
      setLeadLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
          <Sparkles size={14} />
          Free AI Chatbot Preview
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          See Your AI Chatbot<br />
          <span className="text-green-600">Live on Your Website</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
          Enter your website URL and we'll instantly analyze your business and create a working AI chatbot demo — <strong>no signup needed</strong>. Try 3 websites free, up to 50 chat replies each.
        </p>

        {/* URL Input */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-4">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus-within:border-green-500 transition-colors shadow-sm">
            <Globe size={18} className="text-gray-400 shrink-0" />
            <input
              type="url"
              placeholder="https://yourwebsite.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCheck()}
              className="flex-1 outline-none text-gray-800 placeholder-gray-400 text-sm bg-transparent"
            />
          </div>
          <button
            onClick={handleCheck}
            disabled={loading || !url.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {loading ? 'Analyzing…' : 'Analyze My Website'}
          </button>
        </div>

        {error && (
          <p className="text-red-600 text-sm mt-2 flex items-center justify-center gap-1.5">
            <X size={14} /> {error}
          </p>
        )}
      </div>

      {/* Results */}
      {demo && (
        <div className="max-w-5xl mx-auto px-4 pb-20">
          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 size={18} />
              <span className="font-semibold text-sm">{demo.businessName}</span>
            </div>
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            <span className="text-sm text-gray-500">{demo.pagesCrawled} pages analyzed</span>
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            <span className="text-sm text-gray-500">{demo.services.length} services detected</span>
            <div className="ml-auto">
              <button
                onClick={() => navigate(`/demo/${demo.id}`)}
                className="flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-700"
              >
                Full demo view <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Business info + services */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Globe size={16} className="text-green-600" /> About {demo.businessName}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{demo.description}</p>
              </div>

              {demo.services.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Bot size={16} className="text-green-600" /> Services Your Bot Knows About
                  </h3>
                  <ul className="space-y-1.5">
                    {demo.services.slice(0, 8).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                    {demo.services.length > 8 && (
                      <li className="text-xs text-gray-400 pl-5">+{demo.services.length - 8} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Lead alerts */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <Mail size={16} className="text-green-600" /> Get Lead Alerts
                </h3>
                <p className="text-xs text-gray-500 mb-3">Enter your contact so we can send you a summary when someone chats.</p>

                {leadSaved ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircle2 size={16} /> We'll notify you when leads come in!
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={leadName}
                      onChange={e => setLeadName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={leadEmail}
                      onChange={e => setLeadEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"
                    />
                    <input
                      type="tel"
                      placeholder="WhatsApp number (optional)"
                      value={leadPhone}
                      onChange={e => setLeadPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"
                    />
                    <button
                      onClick={handleSaveLead}
                      disabled={leadLoading || !leadName.trim() || !leadEmail.trim()}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {leadLoading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                      Save & Get Notified
                    </button>
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-5 text-white">
                <h3 className="font-bold text-lg mb-1">Ready to add this to your website?</h3>
                <p className="text-green-100 text-sm mb-4">Sign up free and deploy this chatbot on your website in minutes.</p>
                <button
                  onClick={() => navigate('/signup')}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 font-semibold text-sm rounded-lg hover:bg-green-50 transition-colors"
                >
                  Get Started Free <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Right: Live chat demo */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ height: '520px' }}>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100" style={{ background: demo.primaryColor }}>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-none">{demo.businessName} AI</p>
                  <p className="text-white/70 text-xs mt-0.5">Online · Try me!</p>
                </div>
              </div>

              {/* Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'bot' && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 shrink-0 mt-0.5" style={{ background: demo.primaryColor }}>
                        <Bot size={12} className="text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'text-white rounded-tr-sm'
                          : 'bg-gray-100 text-gray-800 rounded-tl-sm chat-html'
                      }`}
                      style={msg.role === 'user' ? { background: demo.primaryColor } : {}}
                      {...(msg.role === 'bot'
                        ? { dangerouslySetInnerHTML: { __html: sanitizeChatHtml(msg.text) } }
                        : { children: msg.text }
                      )}
                    />
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center mr-2 shrink-0" style={{ background: demo.primaryColor }}>
                      <Bot size={12} className="text-white" />
                    </div>
                    <div className="bg-gray-100 px-3 py-2 rounded-2xl rounded-tl-sm">
                      <Loader2 size={14} className="animate-spin text-gray-400" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Lead form overlay */}
              {showLeadForm && !leadSaved && (
                <div className="border-t border-gray-100 bg-green-50 p-3">
                  <p className="text-xs text-green-800 font-medium mb-2 flex items-center gap-1.5">
                    <Phone size={12} /> Leave your contact to continue chatting
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Your email"
                      value={leadEmail}
                      onChange={e => setLeadEmail(e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-green-500"
                    />
                    <button
                      onClick={() => { if (leadEmail) { handleSaveLead(); setShowLeadForm(false); } }}
                      className="px-3 py-1.5 text-white text-xs font-medium rounded-lg"
                      style={{ background: demo.primaryColor }}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}

              {/* Replies counter */}
              {!chatLimitHit && repliesRemaining <= 10 && repliesRemaining > 0 && (
                <div className="px-3 py-1.5 border-t border-amber-100 bg-amber-50 text-xs text-amber-700 flex items-center gap-1.5">
                  <Bot size={11} /> {repliesRemaining} free {repliesRemaining === 1 ? 'reply' : 'replies'} remaining
                  <button onClick={() => navigate('/signup')} className="ml-auto underline font-medium">Upgrade for unlimited</button>
                </div>
              )}
              {chatLimitHit && (
                <div className="px-3 py-2 border-t border-red-100 bg-red-50 text-xs text-red-700 flex items-center gap-2">
                  <Lock size={12} /> Demo limit reached.
                  <button onClick={() => navigate('/signup')} className="underline font-semibold">Sign up for unlimited chat →</button>
                </div>
              )}

              {/* Input */}
              <div className="border-t border-gray-100 p-3 flex gap-2">
                <input
                  type="text"
                  placeholder={chatLimitHit ? 'Sign up to continue chatting…' : 'Ask me anything…'}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  disabled={chatLimitHit}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || chatLoading || chatLimitHit}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-white disabled:opacity-40 transition-opacity"
                  style={{ background: demo.primaryColor }}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">How It Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Globe, title: 'We Scan Your Website', desc: 'Our AI reads all your pages and learns about your business automatically.' },
                { icon: Bot, title: 'Bot Trained Instantly', desc: 'A custom AI chatbot is trained on your content, ready to answer questions.' },
                { icon: MessageSquare, title: 'Embed in Minutes', desc: 'One line of code adds the chatbot to your website. Capture leads 24/7.' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 text-left shadow-sm">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                    <item.icon size={20} className="text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state features */}
      {!demo && !loading && (
        <div className="max-w-5xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: 'Auto-Trained on Your Website', desc: 'We crawl your site and the bot learns your business, services, and FAQs instantly.' },
              { icon: Bot, title: 'Live Chat Demo', desc: 'Test the AI chatbot live. Ask real questions and see how it responds to your visitors.' },
              { icon: MessageSquare, title: 'Lead Capture Built-In', desc: 'The bot collects visitor details and sends leads to your email or WhatsApp.' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                  <item.icon size={20} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
