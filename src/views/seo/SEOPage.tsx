import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Settings, BarChart2, FileText, AlertTriangle, Activity,
  ArrowLeft, Crown, LogOut, User, Zap, Menu, X,
  Wrench, Bot, BookOpen, Tag, KeyRound, Rocket,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSEOSession } from '@/hooks/useSEOSession';
import { SEOSetupTab } from './SEOSetupTab';
import { SEODashboardTab } from './SEODashboardTab';
import { SEOPagesTab } from './SEOPagesTab';
import { SEOIssuesTab } from './SEOIssuesTab';
import { SEOWebVitalsTab } from './SEOWebVitalsTab';
import { SEOAutoFixTab } from './SEOAutoFixTab';
import { SEOBotTab } from './SEOBotTab';
import { SEOBlogTab } from './SEOBlogTab';
import { SEOTagManagerTab } from './SEOTagManagerTab';
import { SEOKeywordTab } from './SEOKeywordTab';
import { SEORankToTopTab } from './SEORankToTopTab';

type Tab = 'setup' | 'dashboard' | 'pages' | 'issues' | 'vitals' | 'autofix' | 'bot' | 'keywords' | 'rank' | 'blog' | 'gtm';

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'setup',     label: 'Setup',       icon: <Settings size={20} />,      desc: 'Embed script' },
  { id: 'dashboard', label: 'Dashboard',   icon: <BarChart2 size={20} />,     desc: 'Overview & score' },
  { id: 'pages',     label: 'Pages',       icon: <FileText size={20} />,      desc: 'Per-page analysis' },
  { id: 'issues',    label: 'Issues',      icon: <AlertTriangle size={20} />, desc: 'All detected issues' },
  { id: 'vitals',    label: 'Web Vitals',  icon: <Activity size={20} />,      desc: 'LCP · FCP · CLS · TTFB' },
  { id: 'autofix',   label: 'Auto Fix',    icon: <Wrench size={20} />,        desc: 'Fix issues automatically' },
  { id: 'bot',       label: 'SEO Bot',     icon: <Bot size={20} />,           desc: 'Trends & recommendations' },
  { id: 'keywords',  label: 'Keywords',    icon: <KeyRound size={20} />,      desc: 'Research & rank with AI agent' },
  { id: 'rank',      label: 'Rank to Top', icon: <Rocket size={20} />,        desc: 'Daily AI SEO engineer on your code' },
  { id: 'blog',      label: 'Blog Posts',  icon: <BookOpen size={20} />,      desc: 'AI-generated SEO blogs' },
  { id: 'gtm',       label: 'Tag Manager', icon: <Tag size={20} />,           desc: 'Google Tag Manager' },
];

const TAB_LABELS: Record<Tab, string> = {
  setup:     'Setup',
  dashboard: 'SEO Dashboard',
  pages:     'Pages',
  issues:    'Issues',
  vitals:    'Core Web Vitals',
  autofix:   'Auto Fix',
  bot:       'SEO Bot',
  keywords:  'Keyword Research',
  rank:      'Rank to Top',
  blog:      'Blog Posts',
  gtm:       'Tag Manager',
};

const BRAND_COLOR = '#10b981'; // emerald-500

function SEOIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
      <path d="M11 8v6M8 11h6" />
    </svg>
  );
}

export function SEOPage() {
  // The active tab lives in ?tab= so it survives reloads and can be linked to.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as Tab | null;
  const tab: Tab = tabParam && TAB_LABELS[tabParam] ? tabParam : 'setup';
  const setTab = (next: Tab) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      params.set('tab', next);
      return params;
    }, { replace: true });
  };
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isPaid = !!(user?.subscription?.plan !== 'free' && user?.subscription?.isActive);
  const hasSEOBot = !!(user?.subscription?.isActive && user?.subscription?.enabledServices?.includes('seo_bot'));
  const session = useSEOSession();

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-800">
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-xs mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg text-white" style={{ background: BRAND_COLOR }}>
            <SEOIcon size={17} />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">SEO Manager</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {session.config?.domain || (session.isSetup ? session.config?.siteName || 'Active' : 'Not configured')}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => { setTab(item.id); setDrawerOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
              tab === item.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className={`transition-transform ${tab === item.id ? 'scale-110' : 'group-hover:scale-105'}`}>
              {item.icon}
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">{item.label}</p>
              <p className={`text-[10px] mt-0.5 ${tab === item.id ? 'text-emerald-200' : 'text-slate-500'}`}>{item.desc}</p>
            </div>
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-slate-800 pt-3 space-y-2">
        {!isPaid && (
          <button onClick={() => navigate('/subscription')} className="w-full flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-semibold hover:bg-amber-500/20 transition-colors">
            <Crown size={13} />Upgrade to Pro
          </button>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <User size={13} className="text-slate-300" />
            </div>
            <span className="text-xs text-slate-400 truncate">{user?.name}</span>
          </div>
          <button onClick={logout} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors" title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col border-r border-slate-800 bg-slate-900">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <aside className="relative z-10 w-64 flex flex-col bg-slate-900 h-full shadow-2xl">
            <button onClick={() => setDrawerOpen(false)} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setDrawerOpen(true)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-none">{TAB_LABELS[tab]}</h1>
              <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
                {NAV_ITEMS.find(n => n.id === tab)?.desc}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session.isSetup && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700">Tracking Active</span>
              </div>
            )}
            {isPaid
              ? <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-full">
                  <Zap size={11} className="text-green-600" />
                  <span className="text-xs font-semibold text-green-700 hidden sm:inline">Pro Active</span>
                </div>
              : <button onClick={() => navigate('/subscription')} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-semibold hover:bg-amber-100 transition-colors">
                  <Crown size={12} /><span className="hidden sm:inline">Upgrade</span>
                </button>
            }
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
          {tab === 'setup'     && <SEOSetupTab session={session} />}
          {tab === 'dashboard' && <SEODashboardTab />}
          {tab === 'pages'     && <SEOPagesTab />}
          {tab === 'issues'    && <SEOIssuesTab />}
          {tab === 'vitals'    && <SEOWebVitalsTab />}
          {tab === 'autofix'   && <SEOAutoFixTab />}
          {tab === 'bot'       && <SEOBotTab isPaid={hasSEOBot} />}
          {tab === 'keywords'  && <SEOKeywordTab isPaid={hasSEOBot} />}
          {tab === 'rank'      && <SEORankToTopTab isPaid={hasSEOBot} />}
          {tab === 'blog'      && <SEOBlogTab isPaid={hasSEOBot} />}
          {tab === 'gtm'       && <SEOTagManagerTab />}
        </div>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900 border-t border-slate-800 flex">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors relative ${
                tab === item.id ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <span className={`transition-transform ${tab === item.id ? 'scale-110' : ''}`}>{item.icon}</span>
              <span className="text-[9px] font-semibold leading-none">{item.label}</span>
              {tab === item.id && <span className="absolute bottom-0 w-8 h-0.5 bg-emerald-500 rounded-full" />}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
