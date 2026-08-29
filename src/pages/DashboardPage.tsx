import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, LogOut, Shield, Crown, ChevronRight, User, Lock, Bot, Code2, Sparkles } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.security.userUsageStats);
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Failed to load user usage stats", err);
      }
    })();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const services = [
    {
      id: 'whatsapp',
      title: 'Nexa - WhatsApp AI Employee',
      description: 'Send bulk WhatsApp campaigns, schedule broadcasts, and configure automated replies.',
      iconPath: '/agents/agent-whatsapp.jpg?v=2',
      bg: 'bg-green-50',
      border: 'border-green-100',
      hoverBorder: 'hover:border-green-300',
      iconBg: 'bg-green-100',
      path: '/whatsapp',
      dbId: 'whatsapp',
    },
    {
      id: 'email',
      title: 'Mailo - Email Outreach Employee',
      description: 'Create and broadcast professional email marketing campaigns with custom templates.',
      iconPath: '/agents/agent-email.jpg?v=2',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      hoverBorder: 'hover:border-blue-300',
      iconBg: 'bg-blue-100',
      path: '/email',
      dbId: 'email',
    },
    {
      id: 'website-chatbot',
      title: 'Webby - Web Conversation Employee',
      description: 'Embed a smart AI-powered chat widget on your website to capture leads and capture prospects.',
      iconPath: '/agents/agent-chatbot.jpg?v=2',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      hoverBorder: 'hover:border-purple-300',
      iconBg: 'bg-purple-100',
      path: '/website-chatbot',
      dbId: 'chatbot',
    },
    {
      id: 'facebook',
      title: 'Pagey - Facebook Social Employee',
      description: 'Publish posts, schedule updates, and view analytics for your Facebook Pages.',
      iconPath: '/agents/agent-facebook.jpg?v=2',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      hoverBorder: 'hover:border-blue-400',
      iconBg: 'bg-blue-100',
      path: '/facebook',
      dbId: 'facebook',
    },
    {
      id: 'linkedin',
      title: 'Linko - LinkedIn Growth Employee',
      description: 'Automate LinkedIn posts and schedule high-quality content using browser engines.',
      iconPath: '/agents/agent-linkedin.jpg?v=2',
      bg: 'bg-sky-50',
      border: 'border-sky-100',
      hoverBorder: 'hover:border-sky-400',
      iconBg: 'bg-sky-100',
      path: '/linkedin',
      dbId: 'linkedin',
    },
    {
      id: 'seo',
      title: 'Seona - SEO Optimization Employee',
      description: 'Embed a tracking script to monitor Core Web Vitals and page rankings across your domain.',
      iconPath: '/agents/agent-seo.jpg?v=2',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      hoverBorder: 'hover:border-emerald-300',
      iconBg: 'bg-emerald-100',
      path: '/seo',
      dbId: 'seo',
    },
    {
      id: 'leads',
      title: 'Scrappy - Lead Finder Employee',
      description: 'Scrape business leads from local maps by niche & location, enrich email details, and start campaigns.',
      iconPath: '/agents/agent-leads.jpg?v=2',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      hoverBorder: 'hover:border-amber-300',
      iconBg: 'bg-amber-100',
      path: '/leads',
      dbId: 'leads',
    },
    {
      id: 'calendar',
      title: 'Schedula - Calendar Booking Assistant',
      description: 'Schedule meeting slots with Google Meet sync, custom branding, and embed scripts.',
      iconPath: '/agents/agent-calendar.jpg?v=2',
      bg: 'bg-teal-50',
      border: 'border-teal-100',
      hoverBorder: 'hover:border-teal-300',
      iconBg: 'bg-teal-100',
      path: '/calendar',
      dbId: 'calendar',
    },
    {
      id: 'life-companion',
      title: 'Mitra - Life Growth Companion',
      description: 'Understand emotions & sadness, suggest music, and build custom roadmaps.',
      iconPath: '/agents/agent-life-companion.jpg?v=2',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      hoverBorder: 'hover:border-purple-300',
      iconBg: 'bg-purple-100',
      path: '/life-companion',
      dbId: 'life_companion',
    },
    {
      id: 'freelancer',
      title: 'Bidder - Freelancer Bid Automator',
      description: 'Automate project discovery and generate tailored winning proposals for Freelancer.com.',
      iconPath: '/agents/agent-freelancer.jpg?v=2',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
      hoverBorder: 'hover:border-violet-300',
      iconBg: 'bg-violet-100',
      path: '/freelancer',
      dbId: 'freelancer',
    },
    {
      id: 'trading',
      title: 'Dhana - Dhan Trading AI Employee',
      description: 'Compose quantitative strategy rules, run historical backtests, and deploy live Dhan loops.',
      iconPath: '/agents/agent-trading.jpg?v=2',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      hoverBorder: 'hover:border-emerald-300',
      iconBg: 'bg-emerald-100',
      path: '/trading',
      dbId: 'trading',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icon-192.png" alt="NexBotix" className="w-9 h-9 rounded-xl object-contain shadow-sm" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">NexBotix</h1>
              <p className="text-xs font-medium text-gray-500 mt-1">AI Agent Hub</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="p-2 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors shadow-sm border border-transparent hover:border-purple-200">
                <Shield size={18} />
              </button>
            )}
            <button onClick={() => navigate('/subscription')} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors shadow-sm">
              <Crown size={16} />
              <span className="text-sm font-semibold capitalize">{user?.subscription?.plan === 'free' || user?.subscription?.plan === 'trial' ? 'Trial' : user?.subscription?.plan || 'Free'}</span>
            </button>
            <div className="w-px h-6 bg-gray-200"></div>
            <button onClick={() => navigate('/sessions')} title="Active Sessions" className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
              <Globe size={18} />
            </button>
            <button onClick={() => navigate('/security')} title="Security Settings" className="p-2 rounded-lg text-gray-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <Lock size={18} />
            </button>
            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white shadow-md">
                <User size={16} />
              </div>
              <span className="text-sm font-semibold text-gray-800 hidden sm:block">{user?.name}</span>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-gray-500 text-lg max-w-2xl">Select a service below to start managing your communications, running campaigns, and capturing leads.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => {
            const plan = user?.subscription?.plan || 'free';
            const enabled = user?.subscription?.enabledServices ?? [];
            const isLocked = !user?.subscription?.isActive || ((plan !== 'free' && plan !== 'trial' && plan !== 'admin_all') && !enabled.includes(service.dbId));
            return (
              <div
                key={service.id}
                onClick={() => !isLocked && navigate(service.path)}
                className={`relative group bg-white rounded-2xl border-2 ${service.border} ${isLocked ? 'opacity-80' : `cursor-pointer ${service.hoverBorder}`} overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col`}
              >
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300">
                      <img src={service.iconPath} alt={service.title} className="w-full h-full object-cover" />
                    </div>
                    {isLocked && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                        <Crown size={12} /> Premium
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">{service.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">{service.description}</p>
                  
                  {!isLocked && stats && (
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-start">
                      {service.id === 'whatsapp' && (
                        <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">
                          {stats.whatsapp.activeSessions > 0 ? '🟢 CONNECTED' : '🔴 OFFLINE'} • {stats.whatsapp.campaignsSent} CAMPAIGNS
                        </span>
                      )}
                      {service.id === 'email' && (
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                          {stats.email.isSmtpConnected ? '📧 SMTP CONNECTED' : '❌ UNCONFIGURED'} • {stats.email.scheduledReminders} REMINDERS
                        </span>
                      )}
                      {service.id === 'website-chatbot' && (
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                          🤖 {stats.websiteChatbot.activeWidgets} WIDGETS • {stats.websiteChatbot.leadsCaptured} LEADS
                        </span>
                      )}
                      {service.id === 'facebook' && (
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                          👥 {stats.facebook.connectedPages} PAGES
                        </span>
                      )}
                      {service.id === 'linkedin' && (
                        <span className="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">
                          {stats.linkedin.botEnabled ? '⏰ BOT ACTIVE' : '⏸️ BOT PAUSED'} • {stats.linkedin.totalPosts} POSTS
                        </span>
                      )}
                      {service.id === 'seo' && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                          🔍 {stats.seo.trackedSites} SITES TRACKED
                        </span>
                      )}
                      {service.id === 'leads' && (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                          👥 {stats.leads.scrapedCount} MAPS LEADS
                        </span>
                      )}
                      {service.id === 'freelancer' && (
                        <span className="text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md">
                          {stats.freelancer?.isConnected ? '🟢 CONNECTED' : '🔴 DISCONNECTED'} • {stats.freelancer?.totalBids || 0} BIDS
                        </span>
                      )}
                      {service.id === 'trading' && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                          📈 LIVE QUANT BOT LOOP
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className={`px-8 py-4 ${service.bg} border-t ${service.border} flex items-center justify-between`}>
                  {isLocked ? (
                    <button
                      onClick={e => { e.stopPropagation(); navigate('/subscription', { state: { preselect: service.dbId } }); }}
                      className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Lock size={13} /> Click here to unlock
                    </button>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-gray-900">Deploy Agent</span>
                      <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:translate-x-1 transition-transform">
                        <ChevronRight size={16} className="text-gray-700" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Bots Hub */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <Bot size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your AI Employee Squad</h2>
              <p className="text-sm text-gray-500">Autonomous digital employees active on your channels</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-4">
            {[
              { id: 'whatsapp-bot', label: 'Nexa (WhatsApp)',  iconPath: '/agents/agent-whatsapp.jpg?v=2',  bg: 'bg-green-50',  border: 'border-green-200',  hoverBorder: 'hover:border-green-400', service: 'whatsapp',  path: '/bot' },
              { id: 'chatbot',      label: 'Webby (Chatbot)', iconPath: '/agents/agent-chatbot.jpg?v=2',      bg: 'bg-sky-50',    border: 'border-sky-200',    hoverBorder: 'hover:border-sky-400',   service: 'chatbot',   path: '/website-chatbot' },
              { id: 'calendar-bot', label: 'Schedula (Calendar)', iconPath: '/agents/agent-calendar.jpg?v=2',bg: 'bg-teal-50',   border: 'border-teal-200',   hoverBorder: 'hover:border-teal-400',  service: 'calendar',  path: '/calendar' },
              { id: 'email-bot',   label: 'Mailo (Email)',      iconPath: '/agents/agent-email.jpg?v=2',       bg: 'bg-blue-50',   border: 'border-blue-200',   hoverBorder: 'hover:border-blue-400',  service: 'email',     path: '/email' },
              { id: 'seo-bot',     label: 'Seona (SEO)',        iconPath: '/agents/agent-seo.jpg?v=2',  bg: 'bg-emerald-50',border: 'border-emerald-200',hoverBorder: 'hover:border-emerald-400',service: 'seo',      path: '/seo' },
              { id: 'linkedin-bot',label: 'Linko (LinkedIn)',   iconPath: '/agents/agent-linkedin.jpg?v=2',                         bg: 'bg-indigo-50', border: 'border-indigo-200', hoverBorder: 'hover:border-indigo-400',service: 'linkedin',  path: '/linkedin' },
              { id: 'life-companion-bot', label: 'Mitra (Life)', iconPath: '/agents/agent-life-companion.jpg?v=2', bg: 'bg-purple-50', border: 'border-purple-200', hoverBorder: 'hover:border-purple-400', service: 'life_companion', path: '/life-companion' },
              { id: 'trading-bot', label: 'Dhana (Trading)', iconPath: '/agents/agent-trading.jpg?v=2', bg: 'bg-orange-50', border: 'border-orange-200', hoverBorder: 'hover:border-orange-400', service: 'trading', path: '/trading' },
              { id: 'freelancer-bot', label: 'Bidder (Freelancer)', iconPath: '/agents/agent-freelancer.jpg?v=2', bg: 'bg-violet-50', border: 'border-violet-200', hoverBorder: 'hover:border-violet-400', service: 'freelancer', path: '/freelancer' },
              { id: 'blog-bot',    label: 'Blog Bot',       iconPath: null,  bg: 'bg-amber-50',  border: 'border-amber-200',  hoverBorder: 'hover:border-amber-400', service: null,        path: null },
            ].map((bot) => {
              const enabled = user?.subscription?.enabledServices ?? [];
              const isActive = !!user?.subscription?.isActive;
              const accessible = bot.path !== null && isActive && (bot.service === null || enabled.includes(bot.service));
              const comingSoon = bot.path === null;
              return (
                <div
                  key={bot.id}
                  onClick={() => accessible && navigate(bot.path!)}
                  title={bot.label}
                  className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 ${bot.border} ${bot.bg} transition-all duration-200 ${accessible ? `cursor-pointer ${bot.hoverBorder} hover:shadow-md` : 'opacity-60 cursor-not-allowed'}`}
                >
                  {!accessible && !comingSoon && (
                    <span className="absolute top-2 right-2">
                      <Lock size={11} className="text-gray-400" />
                    </span>
                  )}
                  {comingSoon && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">Soon</span>
                  )}
                  <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm border border-gray-200">
                    {bot.iconPath ? (
                      <img src={bot.iconPath} alt={bot.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-[9px] uppercase tracking-wider">
                        Soon
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{bot.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Developer Hub */}
        <div
          onClick={() => navigate('/developer')}
          className="mt-6 cursor-pointer group relative overflow-hidden rounded-2xl border-2 border-violet-200 bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 hover:border-violet-400 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-violet-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Code2 size={24} className="text-violet-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-gray-900">Developer Hub</h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full">
                  API + MCP
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                Manage API keys, explore REST API docs for WhatsApp & Email, and connect AI agents via the WhatsApp MCP server.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 text-violet-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
              Open <ChevronRight size={18} />
            </div>
          </div>
        </div>

        {/* Check Your AI Chatbot Demo */}
        <div
          onClick={() => navigate('/check-chatbot')}
          className="mt-8 cursor-pointer group relative overflow-hidden rounded-2xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 hover:border-orange-400 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div className="px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-14 h-14 shrink-0 rounded-2xl bg-orange-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Bot size={28} className="text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-900">Check Your AI Chatbot</h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full">
                  <Sparkles size={10} /> Free
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
                Enter your website URL and instantly see how an AI chatbot would answer questions about your business. Share the live demo link with potential clients.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 text-orange-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
              Try Demo <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
