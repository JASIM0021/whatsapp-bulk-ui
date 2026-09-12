import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  BarChart3,
  Check,
  ArrowRight,
  Star,
  Globe,
  Bot,
  MessageCircle,
  Mail,
  Sparkles,
  Workflow,
  Cpu,
  Layers,
  CheckCircle2,
  Smartphone,
  Calendar,
} from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

/* ─────────────── Hero ─────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Glow accents */}
      <div className="absolute top-[-20%] left-[10%] w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pt-16 sm:pb-24">
        <div className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-12">

          {/* ── Left: text ── */}
          <div className="flex-1 min-w-0">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 mb-6 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400 tracking-wide">
                Autonomous AI Employee Workforce &amp; Flow Orchestration
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight mb-5">
              Hire 24/7 Autonomous
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                AI Digital Employees
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-xl mb-8">
              Deploy specialized digital workers for <strong>Sales</strong>, <strong>Customer Support</strong>, <strong>Legal</strong>, and <strong>Outbound Operations</strong> across WhatsApp, Website Chatbot, Email &amp; Calendar — or build custom multi-agent flows with our visual drag-and-drop studio.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5">
              <Link
                to="/agents"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-xl shadow-emerald-950/50 hover:shadow-emerald-900/60 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-95"
              >
                <Bot size={18} />
                <span>Explore AI Workforce</span>
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/studio"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-bold text-emerald-400 border border-emerald-500/40 rounded-2xl hover:bg-emerald-500/10 hover:border-emerald-400 transition-all active:scale-95"
              >
                <Workflow size={18} />
                <span>Visual Flow Studio</span>
              </Link>
            </div>

            {/* Social proof & Metrics */}
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <div className="flex -space-x-2">
                {[
                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100',
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
                  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="AI Employee"
                    className="w-9 h-9 rounded-full border-2 border-gray-950 object-cover"
                  />
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-400 font-medium">Over 2,400+ Active AI Employees Deployed</p>
              </div>
            </div>
          </div>

          {/* ── Right: Interactive Live Workflow Simulator ── */}
          <div className="flex justify-center lg:justify-end lg:flex-shrink-0">
            <LiveWorkflowSimulator />
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─────────────── Live Workflow Simulator Component ─────────────── */
function LiveWorkflowSimulator() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { title: 'Inbound Lead', desc: 'WhatsApp query: "Can I book a demo for next Tuesday?"', icon: MessageCircle, color: 'emerald' },
    { title: 'Intent Classification', desc: 'Identified: "schedule_demo" with high buyer intent', icon: Layers, color: 'purple' },
    { title: 'In-House AI Reasoning', desc: 'Consultative sales logic checks calendar slots', icon: Bot, color: 'blue' },
    { title: 'Action Dispatched', desc: 'Nexbot Calendar meeting booked + Email confirmation sent', icon: Sparkles, color: 'teal' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % steps.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-[340px] sm:w-[380px] bg-gray-900/90 border border-gray-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold text-white tracking-wide">Live Autonomous Flow</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Agent: Maya (Sales Closer)
        </span>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isCurrent = activeStep === idx;
          const isDone = activeStep > idx;
          const Icon = step.icon;

          return (
            <div
              key={idx}
              className={`p-3 rounded-2xl border transition-all duration-300 flex items-start gap-3 ${
                isCurrent
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-950/50 scale-[1.02]'
                  : isDone
                  ? 'bg-gray-950/60 border-gray-800 opacity-80'
                  : 'bg-gray-950/30 border-gray-800/40 opacity-40'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  isCurrent
                    ? 'bg-emerald-500 text-white'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-gray-800 text-gray-500'
                }`}
              >
                <Icon size={14} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{step.title}</span>
                  {isCurrent && (
                    <span className="text-[9px] font-semibold text-emerald-400 animate-pulse">Running</span>
                  )}
                  {isDone && <CheckCircle2 size={12} className="text-emerald-400" />}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400 font-mono">
        <span>Latency: ~1.2s</span>
        <span className="text-emerald-400 font-semibold">100% Autonomous</span>
      </div>
    </div>
  );
}

/* ─────────────── Predefined AI Workforce Showcase ─────────────── */
function AIWorkforceShowcase() {
  const [activeWorker, setActiveWorker] = useState(0);

  const workers = [
    {
      name: 'Maya',
      role: 'Sales Closer & SDR',
      department: 'Sales & Growth',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      channels: ['WhatsApp', 'Website Chatbot', 'Nexbot Calendar'],
      stats: { speed: '1.2s', accuracy: '99.2%', runs: '12,450+' },
      desc: 'Engages inbound leads on WhatsApp and your website, qualifies budgets, handles objections with consultative empathy, and automatically books live meetings on your calendar.',
    },
    {
      name: 'Alex',
      role: '24/7 Tier-1 Support Engineer',
      department: 'Customer Support',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      channels: ['Chatbot', 'WhatsApp', 'Email'],
      stats: { speed: '0.8s', accuracy: '98.7%', runs: '28,900+' },
      desc: 'Troubleshoots technical bugs, references your documentation or in-house AI, answers customer tickets in seconds, and escalates to humans with full conversation transcripts.',
    },
    {
      name: 'Sarah',
      role: 'Legal & Compliance Specialist',
      department: 'Legal Operations',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      channels: ['In-House AI', 'Email', 'Webhooks'],
      stats: { speed: '2.1s', accuracy: '99.8%', runs: '4,320+' },
      desc: 'Connects directly to your proprietary in-house Legal AI to scan agreements, flag indemnification risks, verify regulatory compliance, and email executive risk summaries.',
    },
    {
      name: 'David',
      role: 'Outbound Outreach Scout',
      department: 'Growth Marketing',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      channels: ['Email Campaigns', 'WhatsApp Broadcast'],
      stats: { speed: '1.4s', accuracy: '97.9%', runs: '18,700+' },
      desc: 'Researches prospects, writes ultra-personalized cold email and WhatsApp sequences, schedules follow-ups based on engagement signals, and syncs responses to your pipeline.',
    },
  ];

  const current = workers[activeWorker];

  return (
    <section className="bg-gray-950 py-24 sm:py-32 border-t border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-3">
            <Sparkles size={13} />
            <span>Ready-to-Hire Digital Employees</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Meet Your New 24/7 AI Workforce
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-400">
            Pre-trained, domain-specialized, and immediately deployable across your sales, support, and operations channels.
          </p>
        </div>

        {/* Worker Selector Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {workers.map((w, idx) => (
            <button
              key={w.name}
              onClick={() => setActiveWorker(idx)}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all text-xs font-bold whitespace-nowrap ${
                activeWorker === idx
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-950/60 scale-105'
                  : 'bg-gray-900 text-gray-400 hover:text-white border-gray-800 hover:border-gray-700'
              }`}
            >
              <img src={w.avatar} alt={w.name} className="w-6 h-6 rounded-full object-cover" />
              <span>{w.name} — {w.role}</span>
            </button>
          ))}
        </div>

        {/* Active Worker Spotlight Card */}
        <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="relative shrink-0 text-center">
              <img
                src={current.avatar}
                alt={current.name}
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl object-cover ring-4 ring-emerald-500/30 shadow-2xl mx-auto"
              />
              <div className="mt-3 inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                {current.department}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{current.name}</h3>
                <p className="text-sm font-semibold text-emerald-400">{current.role}</p>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed">{current.desc}</p>

              {/* Supported Channels */}
              <div>
                <span className="text-xs font-semibold text-gray-400 block mb-2">Connected Channels &amp; Tools:</span>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  {current.channels.map((ch, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-gray-950 border border-gray-800 text-xs font-medium text-gray-200 flex items-center gap-1.5"
                    >
                      <Zap size={12} className="text-emerald-400" />
                      <span>{ch}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-800 text-center">
                <div className="bg-gray-950/70 p-3 rounded-2xl border border-gray-800">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Response Time</div>
                  <div className="text-base font-extrabold text-white">{current.stats.speed}</div>
                </div>
                <div className="bg-gray-950/70 p-3 rounded-2xl border border-gray-800">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Task Accuracy</div>
                  <div className="text-base font-extrabold text-emerald-400">{current.stats.accuracy}</div>
                </div>
                <div className="bg-gray-950/70 p-3 rounded-2xl border border-gray-800">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Total Runs</div>
                  <div className="text-base font-extrabold text-teal-400">{current.stats.runs}</div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to="/agents"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg shadow-emerald-950/50"
                >
                  <Bot size={15} />
                  <span>Hire {current.name} for Your Business</span>
                </Link>
                <Link
                  to="/studio"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold rounded-2xl text-xs border border-gray-700 transition-all"
                >
                  <Workflow size={15} />
                  <span>Customize in Studio</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Visual Flow Studio Showcase ─────────────── */
function VisualStudioSpotlight() {
  return (
    <section className="bg-gray-950 py-24 sm:py-32 border-t border-gray-800/60 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-teal-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-semibold">
              <Workflow size={13} />
              <span>Zero-Code &amp; Deep Extensibility</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Design Custom Agent Flows with React Flow Canvas
            </h2>

            <p className="text-base text-gray-300 leading-relaxed">
              Need custom logic? Open our visual studio to connect triggers, in-house AI endpoints, condition branches, and omni-channel action nodes.
            </p>

            <div className="space-y-3.5">
              {[
                { title: 'In-House AI & cURL Auto-Detector', desc: 'Paste your private AI curl command; headers & auth tokens are securely encrypted with AES-256-GCM.' },
                { title: 'Intent Classification & Dynamic Routing', desc: 'Direct sales questions to Maya, support bugs to Alex, and legal reviews to your private engine.' },
                { title: 'Real-Time Interactive Simulator', desc: 'Test and debug your graph in a live chat sandbox with instant step-by-step audit logs.' },
              ].map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={12} strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{feat.title}</h4>
                    <p className="text-xs text-gray-400">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                to="/studio"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold rounded-2xl text-sm transition-all shadow-xl shadow-teal-950/60"
              >
                <span>Launch Flow Studio</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Visual Canvas Mockup */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs text-gray-400 ml-2 font-mono">workflow-canvas.flow</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                Connected: 5 Nodes
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-gray-950 rounded-2xl border border-emerald-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-emerald-400" />
                  <span className="text-white font-bold">Trigger: Inbound WhatsApp / Web</span>
                </div>
                <span className="text-[10px] text-emerald-400">Entry</span>
              </div>

              <div className="text-center text-gray-500 text-xs">↓</div>

              <div className="p-3 bg-gray-950 rounded-2xl border border-purple-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-purple-400" />
                  <span className="text-white font-bold">Intent Classifier &amp; Router</span>
                </div>
                <span className="text-[10px] text-purple-400">Evaluate</span>
              </div>

              <div className="text-center text-gray-500 text-xs">↓</div>

              <div className="p-3 bg-gray-950 rounded-2xl border border-blue-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={14} className="text-blue-400" />
                  <span className="text-white font-bold">In-House AI / Consultative Model</span>
                </div>
                <span className="text-[10px] text-blue-400">Reasoning</span>
              </div>

              <div className="text-center text-gray-500 text-xs">↓</div>

              <div className="p-3 bg-gray-950 rounded-2xl border border-teal-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-teal-400" />
                  <span className="text-white font-bold">Action: Calendar Booking + WhatsApp Reply</span>
                </div>
                <span className="text-[10px] text-teal-400">Dispatched</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Staff vs AI Employee ROI Calculator ─────────────── */
function StaffCostCalculator() {
  const [teamSize, setTeamSize] = useState(3);
  const monthlySalaryPerEmployee = 3200; // $3,200/mo avg
  const aiCostPerMonth = 99; // $99/mo on Nexbotix

  const humanTotalCost = teamSize * monthlySalaryPerEmployee;
  const aiTotalCost = aiCostPerMonth;
  const annualSavings = (humanTotalCost - aiTotalCost) * 12;

  return (
    <section className="bg-gray-950 py-24 sm:py-32 border-t border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-3">
            <BarChart3 size={13} />
            <span>Staff Replacement &amp; ROI Calculator</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Scale Your Workforce at 1/30th the Cost
          </h2>
          <p className="mt-4 text-base text-gray-400">
            Compare traditional human staff hiring, onboarding, and payroll versus instant 24/7 autonomous digital employees.
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-gray-900 border border-gray-800 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-white">Full-Time Human Employees Needed:</span>
                <span className="text-lg font-extrabold text-emerald-400">{teamSize} Employees</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={teamSize}
                onChange={e => setTeamSize(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-800 text-center">
              <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800">
                <div className="text-xs text-gray-500 font-semibold mb-1">Traditional Staff Cost</div>
                <div className="text-2xl font-extrabold text-red-400">${humanTotalCost.toLocaleString()}/mo</div>
                <div className="text-[10px] text-gray-500 mt-1">Limited to 8 hrs/day</div>
              </div>

              <div className="bg-gray-950 p-4 rounded-2xl border border-emerald-500/40 shadow-lg shadow-emerald-950/40">
                <div className="text-xs text-emerald-400 font-semibold mb-1">Nexbotix AI Workforce</div>
                <div className="text-2xl font-extrabold text-white">${aiTotalCost}/mo</div>
                <div className="text-[10px] text-emerald-400 mt-1">24/7/365 Instant Response</div>
              </div>

              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-4 rounded-2xl text-white shadow-xl">
                <div className="text-xs text-emerald-100 font-semibold mb-1">Annual Savings</div>
                <div className="text-2xl font-black">${annualSavings.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-100 mt-1">Net Margin Boost</div>
              </div>
            </div>

            <div className="text-center pt-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-sm transition-all shadow-lg"
              >
                <span>Hire Your First AI Worker Today</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── AI Workforce Pricing ($5/mo Per Agent) ─────────────── */
function PricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      id: 'starter',
      name: 'Starter AI Employee',
      priceMonthly: 5,
      priceYearly: 49,
      tagline: 'Ideal for small businesses hiring their first 24/7 AI worker',
      agentQuota: '1 Active AI Employee',
      callQuota: '1,000 AI Agent Calls / mo',
      features: [
        '1 Active AI Digital Employee',
        '1,000 Autonomous Agent Calls/mo',
        'Visual Drag-and-Drop Studio access',
        'WhatsApp, Chatbot & Email integration',
        'Nexbot Calendar meeting booking',
        'Predefined marketplace worker templates',
      ],
      highlight: false,
      ctaText: 'Hire for $5/mo',
      planParam: 'ai_agent',
    },
    {
      id: 'growth',
      name: 'Growth Workforce',
      priceMonthly: 15,
      priceYearly: 149,
      tagline: 'Deploy a multi-agent workforce across your sales & support operations',
      agentQuota: 'Up to 3 Active AI Employees',
      callQuota: '5,000 AI Agent Calls / mo',
      features: [
        'Up to 3 Active AI Digital Employees',
        '5,000 Autonomous Agent Calls/mo',
        'In-House AI & Custom cURL Connectors',
        'Multi-Agent Intent Routing',
        'AES-256 Encrypted Credential Vault',
        'Real-time execution sandbox & audit logs',
      ],
      highlight: true,
      badge: 'MOST POPULAR',
      ctaText: 'Deploy Workforce',
      planParam: 'ai_agent_growth',
    },
    {
      id: 'scale',
      name: 'Scale Workforce',
      priceMonthly: 49,
      priceYearly: 479,
      tagline: 'Full enterprise autonomy for high-volume lead & support workflows',
      agentQuota: 'Up to 10 Active AI Employees',
      callQuota: '25,000 AI Agent Calls / mo',
      features: [
        'Up to 10 Active AI Digital Employees',
        '25,000 Autonomous Agent Calls/mo',
        'Unlimited In-House AI & Webhook triggers',
        'Dedicated execution queue & zero rate limits',
        'Custom model fine-tuning & RAG integration',
        'Priority 24/7 enterprise support & SLA',
      ],
      highlight: false,
      ctaText: 'Scale With AI',
      planParam: 'ai_agent_scale',
    },
  ];

  return (
    <section className="bg-gray-950 py-24 sm:py-32 border-t border-gray-800/60 relative overflow-hidden" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-3">
            <Sparkles size={13} />
            <span>Transparent Per-Agent Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Hire AI Workers Starting at Just $5/Month
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-400">
            Pay only for the digital employees you deploy. Every agent comes with allocated call quotas and omni-channel automation.
          </p>

          {/* Billing Switch */}
          <div className="mt-8 inline-flex items-center gap-3 bg-gray-900 border border-gray-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billing === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                billing === 'yearly'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                2 Months Free
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map(plan => {
            const price = billing === 'yearly' ? plan.priceYearly : plan.priceMonthly;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 transition-all flex flex-col justify-between ${
                  plan.highlight
                    ? 'bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 border-2 border-emerald-500 shadow-2xl shadow-emerald-950/60 scale-105'
                    : 'bg-gray-900/70 border border-gray-800 hover:border-gray-700'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  </div>

                  <p className="text-xs text-gray-400 mb-6 leading-relaxed">{plan.tagline}</p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-gray-800">
                    <span className="text-4xl sm:text-5xl font-black text-white">${price}</span>
                    <span className="text-xs text-gray-400 font-medium">/{billing === 'yearly' ? 'year' : 'month'}</span>
                  </div>

                  {/* Quotas */}
                  <div className="space-y-2 mb-6 bg-gray-950/60 p-3.5 rounded-2xl border border-gray-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Workforce Size:</span>
                      <span className="font-bold text-emerald-400">{plan.agentQuota}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Monthly Call Limit:</span>
                      <span className="font-bold text-white">{plan.callQuota}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">What's Included:</span>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-300">
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  to={`/signup?plan=${plan.planParam}${billing === 'yearly' ? '_yr' : ''}`}
                  className={`w-full py-3.5 rounded-2xl text-xs font-extrabold text-center transition-all flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-950/60 active:scale-95'
                      : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 active:scale-95'
                  }`}
                >
                  <span>{plan.ctaText}</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Admin note */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-500">
            Need custom call limits or dedicated on-premise AI connectors? Fully customizable from the Admin Panel or via{' '}
            <Link to="/docs" className="text-emerald-400 underline hover:text-emerald-300">
              Developer Documentation
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Features & Channels ─────────────── */
function Features() {
  const features = [
    {
      icon: Smartphone,
      title: 'WhatsApp Automation',
      desc: 'Bulk campaigns, personalized broadcasts, and 24/7 AI chat bots with smart response handling.',
    },
    {
      icon: Globe,
      title: 'Website Chatbot Widget',
      desc: 'Embeddable script answering queries with zero latency, trained on your site & docs.',
    },
    {
      icon: Mail,
      title: 'Email Campaign Hub',
      desc: 'HTML templates, custom SMTP integration, auto-followups, and real-time open tracking.',
    },
    {
      icon: Calendar,
      title: 'Nexbot Calendar Booking',
      desc: 'Automated meeting scheduling, Google Calendar sync, and frictionless prospect booking.',
    },
    {
      icon: Cpu,
      title: 'Custom In-House AI',
      desc: 'Connect your proprietary models and private APIs via cURL with AES-256 token encryption.',
    },
    {
      icon: Workflow,
      title: 'Visual Flow Canvas',
      desc: 'Drag-and-drop orchestration of triggers, LLM reasoning, conditional logic, and tool execution.',
    },
  ];

  return (
    <section className="bg-gray-950 py-24 sm:py-32 border-t border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-bold text-emerald-400 tracking-wider uppercase mb-3">All-In-One AI Platform</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Every Channel, Unified Under One AI Workforce
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="bg-gray-900/60 border border-gray-800 rounded-3xl p-7 hover:border-emerald-500/40 transition-all flex flex-col gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <feat.icon size={20} />
              </div>
              <h3 className="text-base font-bold text-white">{feat.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── CTA ─────────────── */
function CTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 py-24">
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Ready to Deploy Your 24/7 Digital Workforce?
        </h2>
        <p className="text-base sm:text-lg text-emerald-100 mb-10 max-w-xl mx-auto">
          Hire an AI employee from just $5/month. Deploy in less than 2 minutes.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-emerald-950 bg-white rounded-2xl shadow-2xl hover:scale-[1.02] transition-all"
        >
          <span>Start for $5/Month</span>
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}

/* ─────────────── Page ─────────────── */
export function HomePage() {
  useSEO({
    title: 'NexBotix — Autonomous AI Employee Workforce & Agent Orchestration from $5/mo',
    description: 'Hire 24/7 autonomous AI digital employees for Sales, Support, Legal, and Operations starting at $5/month with 1,000 calls included. Build custom multi-agent flows with our visual drag-and-drop studio.',
    keywords: 'ai employees, digital workers, ai workforce, 5 dollar ai agent, agent orchestration, react flow ai, inhouse ai connector, whatsapp ai agent, claude mcp, website chatbot, nexbotix',
    url: 'https://nexbotix.online/',
  });

  return (
    <div className="bg-gray-950 text-gray-100 min-h-screen">
      <Hero />
      <AIWorkforceShowcase />
      <VisualStudioSpotlight />
      <PricingSection />
      <StaffCostCalculator />
      <Features />
      <CTA />
    </div>
  );
}
