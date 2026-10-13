import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { AIAgent } from '@/types/agent';
import {
  Users,
  Bot,
  Zap,
  Sparkles,
  CheckCircle2,
  Settings,
  Plus,
  Trash2,
  Smartphone,
  Globe,
  Mail,
  Calendar,
  Search,
  Cpu,
  RefreshCw,
} from 'lucide-react';

const DEFAULT_TEMPLATES: AIAgent[] = [
  {
    id: 'tpl-nexa-wa',
    name: 'Nexa — 24/7 WhatsApp AI Customer Specialist',
    slug: 'nexa-whatsapp-bot',
    role: 'WhatsApp Autonomous Specialist',
    department: 'support',
    description: 'Handles incoming WhatsApp inquiries 24/7, answers FAQs from your knowledge base, captures customer phone & intent, sends product catalogs, and triggers human-agent escalation when requested.',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['whatsapp'],
    templateCategory: 'WhatsApp Bots',
    metrics: { totalRuns: 42100, successfulRuns: 41850, failedRuns: 250, avgResponseTimeMs: 620 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-webby-chat',
    name: 'Webby — Intelligent Website Concierge & Lead Bot',
    slug: 'webby-website-chatbot',
    role: 'Website Lead Conversion Specialist',
    department: 'marketing',
    description: 'Embeds into any website, instantly indexes your product pages, answers visitor questions with sub-second latency, captures leads with phone/email validation, and routes high-value prospects to your team.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['chatbot'],
    templateCategory: 'Website Chatbots',
    metrics: { totalRuns: 38500, successfulRuns: 38190, failedRuns: 310, avgResponseTimeMs: 480 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-maya-sales',
    name: 'Maya — Sales Closer & Lead Qualifier',
    slug: 'maya-sales-closer',
    role: 'Autonomous Sales Executive',
    department: 'sales',
    description: 'Engages inbound leads via WhatsApp & Website Chatbot, discovers budget and pain points, handles objections, and automatically books demo meetings on your calendar.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['whatsapp', 'chatbot', 'calendar'],
    templateCategory: 'Sales & Growth',
    metrics: { totalRuns: 12450, successfulRuns: 12320, failedRuns: 130, avgResponseTimeMs: 1420 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-alex-support',
    name: 'Alex — 24/7 Tier-1 Support Engineer',
    slug: 'alex-support-engineer',
    role: 'Senior Support Specialist',
    department: 'support',
    description: 'Resolves customer technical queries, troubleshoots errors using your knowledge base or in-house AI, and creates support tickets or escalates when human intervention is needed.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['chatbot', 'whatsapp', 'email'],
    templateCategory: 'Customer Support',
    metrics: { totalRuns: 28900, successfulRuns: 28650, failedRuns: 250, avgResponseTimeMs: 850 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-liam-ecom',
    name: 'Liam — E-Commerce Orders & Logistics Assistant',
    slug: 'liam-ecommerce-orders',
    role: 'Logistics & Order Specialist',
    department: 'support',
    description: 'Connects to your Shopify, WooCommerce, or warehouse APIs via custom cURL connectors to track packages, handle return requests, and answer sizing queries 24/7 on WhatsApp.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['whatsapp', 'chatbot', 'email'],
    templateCategory: 'E-Commerce & Orders',
    metrics: { totalRuns: 34100, successfulRuns: 33890, failedRuns: 210, avgResponseTimeMs: 740 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-sarah-legal',
    name: 'Sarah — Legal & Compliance Analyst',
    slug: 'sarah-legal-compliance',
    role: 'Legal Operations Specialist',
    department: 'legal',
    description: 'Connects to your custom In-House Legal AI or internal models to analyze contracts, verify compliance clauses, detect regulatory risks, and output formatted summaries.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['chatbot', 'email', 'webhook'],
    templateCategory: 'Legal & Compliance',
    metrics: { totalRuns: 4320, successfulRuns: 4290, failedRuns: 30, avgResponseTimeMs: 2100 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-rachel-re',
    name: 'Rachel — Real Estate Tour & Property Qualifier',
    slug: 'rachel-real-estate',
    role: 'Property Concierge Agent',
    department: 'sales',
    description: 'Captures property seeker preferences (budget, bedrooms, neighborhood), sends matching listings with photos, and schedules private property showings directly onto your calendar.',
    avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['whatsapp', 'chatbot', 'calendar'],
    templateCategory: 'Real Estate & Housing',
    metrics: { totalRuns: 8750, successfulRuns: 8690, failedRuns: 60, avgResponseTimeMs: 1100 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-mailo-email',
    name: 'Mailo — Cold Email & Sequence Strategist',
    slug: 'mailo-email-specialist',
    role: 'Autonomous Outreach Specialist',
    department: 'marketing',
    description: 'Generates high-converting cold email sequences, monitors open & reply signals, automatically handles out-of-office vs objection replies, and schedules follow-ups with zero spam trigger risk.',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['email'],
    templateCategory: 'Email & Outreach',
    metrics: { totalRuns: 19300, successfulRuns: 19100, failedRuns: 200, avgResponseTimeMs: 1200 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-schedula-cal',
    name: 'Schedula — AI Meeting & Calendar Concierge',
    slug: 'schedula-calendar-bot',
    role: 'Autonomous Meeting Coordinator',
    department: 'operations',
    description: 'Syncs directly with Google Meet and Nexbotix Calendar to coordinate multi-participant meetings, send WhatsApp and email reminders, and handle instant reschedules.',
    avatar: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['calendar', 'whatsapp', 'email'],
    templateCategory: 'Executive & Admin',
    metrics: { totalRuns: 11400, successfulRuns: 11350, failedRuns: 50, avgResponseTimeMs: 780 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-scrappy-leads',
    name: 'Scrappy — Local Maps & B2B Lead Finder',
    slug: 'scrappy-lead-intelligence',
    role: 'B2B Lead Intelligence Agent',
    department: 'marketing',
    description: 'Extracts local business listings from Google Maps by niche and geography, verifies email addresses and WhatsApp availability, and automatically enrolls them into targeted drip campaigns.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['webhook', 'email'],
    templateCategory: 'Lead Generation',
    metrics: { totalRuns: 16200, successfulRuns: 16020, failedRuns: 180, avgResponseTimeMs: 1450 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-seona-seo',
    name: 'Seona — Autonomous SEO Growth & Ranking Engine',
    slug: 'seona-seo-specialist',
    role: 'SEO & Content Architect',
    department: 'marketing',
    description: 'Monitors search queries, identifies keyword gaps, writes SEO-optimized long-form articles, and tracks Core Web Vitals to boost organic search rankings.',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['chatbot', 'webhook'],
    templateCategory: 'SEO & Content',
    metrics: { totalRuns: 14700, successfulRuns: 14550, failedRuns: 150, avgResponseTimeMs: 1800 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-victor-fin',
    name: 'Victor — Billing & Invoicing Specialist',
    slug: 'victor-finance-billing',
    role: 'Finance Operations Specialist',
    department: 'operations',
    description: 'Answers payment disputes, checks subscription receipts, generates payment links via Stripe/Razorpay, and reconciles overdue balances over WhatsApp and email.',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['email', 'whatsapp', 'webhook'],
    templateCategory: 'Finance & Invoicing',
    metrics: { totalRuns: 15200, successfulRuns: 15080, failedRuns: 120, avgResponseTimeMs: 1350 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-zoe-soc',
    name: 'Zoe — Social Media Engagement & Community Lead',
    slug: 'zoe-social-community',
    role: 'Community & Social Media Manager',
    department: 'marketing',
    description: 'Monitors comments across Facebook, LinkedIn & Web channels, replies to community feedback with brand voice, flags negative sentiment, and routes hot leads into your CRM.',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['chatbot', 'email', 'webhook'],
    templateCategory: 'Social & Community',
    metrics: { totalRuns: 21600, successfulRuns: 21450, failedRuns: 150, avgResponseTimeMs: 820 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-dhana-trade',
    name: 'Dhana — Algorithmic Quant & Strategy Bot',
    slug: 'dhana-trading-bot',
    role: 'Quantitative Strategy Agent',
    department: 'operations',
    description: 'Connects to Dhan broker webhooks to backtest technical indicators, execute automated risk management stop-loss rules, and deliver daily P&L digests on WhatsApp.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['webhook'],
    templateCategory: 'Trading & Quant',
    metrics: { totalRuns: 51200, successfulRuns: 50990, failedRuns: 210, avgResponseTimeMs: 310 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-tuber-yt',
    name: 'Tuber — YouTube SEO & Shorts Scriptwriter',
    slug: 'tuber-youtube-growth',
    role: 'YouTube Content Architect',
    department: 'marketing',
    description: 'Analyzes trending video topics, writes engaging YouTube Shorts and long-form scripts with high-retention hooks, generates click-worthy titles, and suggests tags & descriptions.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['chatbot', 'webhook'],
    templateCategory: 'Social & Media',
    metrics: { totalRuns: 17800, successfulRuns: 17650, failedRuns: 150, avgResponseTimeMs: 1100 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-bidder-fr',
    name: 'Bidder — Freelancer.com AI Bid Automator',
    slug: 'bidder-freelancer-bot',
    role: 'Freelance Proposal Closer',
    department: 'sales',
    description: 'Monitors Freelancer.com project feeds in real-time, extracts technical requirements, drafts personalized bids tailored to client briefs, and notifies you when shortlisted.',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['webhook', 'email'],
    templateCategory: 'Sales & Proposals',
    metrics: { totalRuns: 13900, successfulRuns: 13780, failedRuns: 120, avgResponseTimeMs: 950 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-mitra-life',
    name: 'Mitra — AI Empathy & Habit Companion',
    slug: 'mitra-life-companion',
    role: 'Wellness & Habit Coach',
    department: 'support',
    description: 'Provides thoughtful 24/7 conversation, daily mindfulness reflections, mood tracking, habit accountability check-ins, and actionable growth roadmaps over WhatsApp and web chat.',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
    status: 'active',
    channels: ['chatbot', 'whatsapp'],
    templateCategory: 'Mindset & Wellness',
    metrics: { totalRuns: 26400, successfulRuns: 26280, failedRuns: 120, avgResponseTimeMs: 710 },
    graph: { nodes: [], edges: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function AIWorkersPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'marketplace' | 'my-workforce'>('marketplace');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<AIAgent[]>(DEFAULT_TEMPLATES);
  const [myAgents, setMyAgents] = useState<AIAgent[]>([]);

  // Hire Modal state
  const [hireModalOpen, setHireModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AIAgent | null>(null);
  const [customName, setCustomName] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['whatsapp', 'chatbot']);
  const [customInstruction, setCustomInstruction] = useState('');
  const [isHiring, setIsHiring] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1. Load Marketplace Templates
      const tempRes = await apiFetch(API_ENDPOINTS.agents.templates);
      const tempJson = await tempRes.json();
      if (tempJson.success && Array.isArray(tempJson.data)) {
        setTemplates(tempJson.data);
      }

      // 2. Load User's Hired Agents
      const myRes = await apiFetch(API_ENDPOINTS.agents.list);
      const myJson = await myRes.json();
      if (myJson.success && Array.isArray(myJson.data)) {
        setMyAgents(myJson.data);
      }
    } catch (e) {
      console.error('Failed to load agents data:', e);
    }
  };

  const handleOpenHireModal = (template: AIAgent) => {
    setSelectedTemplate(template);
    setCustomName(template.name);
    setSelectedChannels(template.channels || ['whatsapp', 'chatbot']);
    setCustomInstruction('');
    setHireModalOpen(true);
  };

  const handleConfirmHire = async () => {
    if (!selectedTemplate) return;
    setIsHiring(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.agents.hireTemplate, {
        method: 'POST',
        body: JSON.stringify({
          templateId: selectedTemplate.slug || selectedTemplate.id,
          customName: customName || selectedTemplate.name,
          channels: selectedChannels,
          settings: {
            customInstruction,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setHireModalOpen(false);
        await loadData();
        setActiveTab('my-workforce');
      } else {
        alert(json.error || 'Failed to hire AI worker');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    } finally {
      setIsHiring(false);
    }
  };

  const handleDeleteAgent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to dismiss this AI worker?')) return;
    try {
      const res = await apiFetch(API_ENDPOINTS.agents.delete(id), { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setMyAgents(prev => prev.filter(a => a.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const departments = [
    { id: 'all', label: 'All AI Specialists' },
    { id: 'whatsapp', label: '🟢 WhatsApp Bots' },
    { id: 'chatbot', label: '🌐 Website Chatbots' },
    { id: 'sales', label: '💼 Sales & Growth' },
    { id: 'support', label: '🎧 Customer Support' },
    { id: 'marketing', label: '🚀 Marketing & Outreach' },
    { id: 'operations', label: '⚡ Ops & Finance' },
    { id: 'legal', label: '⚖️ Legal & Risk' },
  ];

  const filteredTemplates = templates.filter(t => {
    let matchesDept = selectedDept === 'all';
    if (!matchesDept) {
      if (selectedDept === 'whatsapp') {
        matchesDept = Boolean(
          t.channels?.includes('whatsapp') ||
          t.templateCategory?.toLowerCase().includes('whatsapp') ||
          t.name.toLowerCase().includes('whatsapp')
        );
      } else if (selectedDept === 'chatbot') {
        matchesDept = Boolean(
          t.channels?.includes('chatbot') ||
          t.templateCategory?.toLowerCase().includes('chatbot') ||
          t.name.toLowerCase().includes('chatbot')
        );
      } else {
        matchesDept = t.department.toLowerCase() === selectedDept.toLowerCase();
      }
    }
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.templateCategory && t.templateCategory.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  const getChannelIcon = (ch: string) => {
    switch (ch.toLowerCase()) {
      case 'whatsapp':
        return <Smartphone size={13} className="text-emerald-400" />;
      case 'chatbot':
        return <Globe size={13} className="text-blue-400" />;
      case 'email':
        return <Mail size={13} className="text-amber-400" />;
      case 'calendar':
        return <Calendar size={13} className="text-purple-400" />;
      default:
        return <Zap size={13} className="text-teal-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800/80 bg-gray-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-600/20 ring-1 ring-white/20">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">AI Workforce Hub</h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  Autonomous 24/7
                </span>
              </div>
              <p className="text-xs text-gray-400">Deploy, orchestrate, and customize digital employees for your business</p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/studio')}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
            >
              <Plus size={15} />
              <span>Create Custom Worker (Studio)</span>
            </button>
            <button
              onClick={() => navigate('/connectors')}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800/80 hover:bg-gray-800 text-gray-300 border border-gray-700/80 rounded-xl text-xs font-medium transition-colors"
            >
              <Cpu size={14} className="text-teal-400" />
              <span>Connectors</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <div className="flex items-center gap-2 bg-gray-900/80 p-1 rounded-2xl border border-gray-800">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'marketplace'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} />
              <span>Predefined Marketplace</span>
            </button>
            <button
              onClick={() => setActiveTab('my-workforce')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'my-workforce'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users size={14} />
              <span>My Active Workforce ({myAgents.length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[280px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by role, skill, or department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* ── TAB 1: PREDEFINED MARKETPLACE ── */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            {/* Department Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {departments.map(dept => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    selectedDept === dept.id
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-gray-900/60 text-gray-400 hover:text-gray-200 border border-gray-800'
                  }`}
                >
                  {dept.label}
                </button>
              ))}
            </div>

            {/* Workers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map(template => (
                <div
                  key={template.id || template.slug}
                  className="group relative bg-gray-900/70 hover:bg-gray-900 border border-gray-800/80 hover:border-emerald-500/40 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-emerald-950/40"
                >
                  <div>
                    {/* Top Row: Avatar & Department */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="relative">
                        <img
                          src={template.avatar}
                          alt={template.name}
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30 group-hover:ring-emerald-400 transition-all shadow-md"
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        </div>
                      </div>

                      <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase rounded-lg bg-gray-800 text-gray-300 border border-gray-700/60">
                        {template.templateCategory || template.department}
                      </span>
                    </div>

                    {/* Name & Role */}
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors mb-1">
                      {template.name}
                    </h3>
                    <p className="text-xs font-medium text-emerald-400/80 mb-3">{template.role}</p>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 mb-4">
                      {template.description}
                    </p>

                    {/* Channels Pill List */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {template.channels?.map((ch, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-950/70 border border-gray-800 text-[11px] text-gray-300"
                        >
                          {getChannelIcon(ch)}
                          <span className="capitalize">{ch}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Metrics Footer */}
                  <div className="pt-4 border-t border-gray-800/80 space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-center bg-gray-950/50 p-2.5 rounded-xl border border-gray-800/50">
                      <div>
                        <div className="text-[10px] text-gray-500">Response Speed</div>
                        <div className="text-xs font-bold text-white">
                          {(template.metrics?.avgResponseTimeMs / 1000).toFixed(1)}s avg
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500">Success Accuracy</div>
                        <div className="text-xs font-bold text-emerald-400">98.9%</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenHireModal(template)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
                      >
                        <Zap size={14} />
                        <span>Hire &amp; Deploy</span>
                      </button>
                      <button
                        onClick={() => navigate(`/studio?template=${template.slug || template.id}`)}
                        className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl border border-gray-700/60 transition-colors"
                        title="Inspect & Customize in Drag-and-Drop Studio"
                      >
                        <Settings size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: MY ACTIVE WORKFORCE ── */}
        {activeTab === 'my-workforce' && (
          <div className="space-y-6">
            {myAgents.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/40 border border-gray-800 rounded-3xl p-8 max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <Bot size={32} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">No Active AI Workers Yet</h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  Hire your first predefined AI employee from our marketplace or design a custom agent using the visual flow studio.
                </p>
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg"
                >
                  <Sparkles size={15} />
                  <span>Browse Predefined Marketplace</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myAgents.map(agent => (
                  <div
                    key={agent.id}
                    className="relative bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-3xl p-6 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={agent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={agent.name}
                            className="w-12 h-12 rounded-xl object-cover ring-1 ring-gray-700"
                          />
                          <div>
                            <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                            <span className="text-[11px] text-emerald-400">{agent.role}</span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {agent.status.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mb-4 line-clamp-2">{agent.description}</p>

                      {/* Channels */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {agent.channels?.map((ch, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gray-950 border border-gray-800 text-[10px] text-gray-300"
                          >
                            {getChannelIcon(ch)}
                            <span className="capitalize">{ch}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-gray-800 space-y-3">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Total Executions</span>
                        <span className="font-semibold text-white">{agent.metrics?.totalRuns || 0}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/studio/${agent.id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold border border-gray-700 transition-colors"
                        >
                          <Settings size={13} />
                          <span>Open in Studio</span>
                        </button>
                        <button
                          onClick={e => handleDeleteAgent(agent.id, e)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors"
                          title="Dismiss Agent"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── HIRE & PROVISION MODAL ── */}
      {hireModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <img
                src={selectedTemplate.avatar}
                alt={selectedTemplate.name}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/40"
              />
              <div>
                <h3 className="text-base font-bold text-white">Deploy {selectedTemplate.name}</h3>
                <p className="text-xs text-gray-400">{selectedTemplate.role}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Employee Custom Name */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Employee Display Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Channel Bindings */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Assign Active Channels</label>
                <div className="grid grid-cols-2 gap-2">
                  {['whatsapp', 'chatbot', 'email', 'calendar'].map(ch => {
                    const isSelected = selectedChannels.includes(ch);
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedChannels(selectedChannels.filter(c => c !== ch));
                          } else {
                            setSelectedChannels([...selectedChannels, ch]);
                          }
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-white'
                            : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {getChannelIcon(ch)}
                        <span className="capitalize">{ch}</span>
                        {isSelected && <CheckCircle2 size={13} className="ml-auto text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Knowledge or Instructions */}
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Custom Instructions / Brand Voice (Optional)
                </label>
                <textarea
                  rows={3}
                  value={customInstruction}
                  onChange={e => setCustomInstruction(e.target.value)}
                  placeholder="e.g. Speak formally, emphasize our 30-day money-back guarantee, and book meetings for PST timezone."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setHireModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmHire}
                disabled={isHiring}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-950/50"
              >
                {isHiring ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                <span>{isHiring ? 'Deploying...' : 'Deploy to Workforce'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
