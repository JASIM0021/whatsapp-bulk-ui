import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '@/config/api';
import {
  Upload,
  Users,
  Zap,
  Shield,
  BarChart3,
  FileText,
  Image,
  Clock,
  Check,
  ArrowRight,
  Star,
  ChevronRight,
  Bot,
  CalendarClock,
  MessageSquareWarning,
  UserX,
  Timer,
  Globe,
} from 'lucide-react';

/* ─────────────── Hero ─────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Glow accents */}
      <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pt-14 sm:pb-24">
        <div className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-12">

          {/* ── Left: text ── */}
          <div className="flex-1 min-w-0">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-green-400 tracking-wide">WhatsApp Cloud API Powered</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight mb-5">
              Turn Your WhatsApp
              <br />
              <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Into a Sales Machine
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-lg mb-8">
              Bulk messaging + AI bot + scheduling — all in one platform.
              Reach thousands, auto-reply leads, and send at the perfect time.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/signup"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-xl shadow-green-600/25 hover:shadow-green-600/40 hover:from-green-500 hover:to-emerald-500 transition-all"
              >
                Start Free Trial
                <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="https://wa.me/917679349780?text=Hi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-gray-300 border border-gray-700 rounded-2xl hover:bg-white/5 hover:border-gray-600 transition-all"
              >
                Try WhatsApp Bot Now
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-5">
              <div className="flex -space-x-2">
                {[
                  'bg-gradient-to-br from-amber-400 to-orange-500',
                  'bg-gradient-to-br from-blue-400 to-indigo-500',
                  'bg-gradient-to-br from-pink-400 to-rose-500',
                  'bg-gradient-to-br from-green-400 to-emerald-500',
                ].map((bg, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-gray-900 flex items-center justify-center`}>
                    <span className="text-[10px] font-bold text-white">{['AK', 'MJ', 'SR', 'LP'][i]}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-500">Trusted by 2,000+ businesses</p>
              </div>
            </div>
          </div>

          {/* ── Right: phone mockup ── */}
          <div className="flex justify-center lg:justify-end lg:flex-shrink-0">
            <div className="relative w-[220px] sm:w-[250px] lg:w-[270px]">
              {/* Glow */}
              <div className="absolute inset-0 bg-green-500/15 blur-3xl rounded-full scale-125 -z-10" />

              {/* Phone body */}
              <div className="relative bg-gray-900 rounded-[44px] p-[10px] shadow-2xl ring-1 ring-white/10">
                {/* Side buttons */}
                <div className="absolute -left-[3px] top-[80px] w-[3px] h-7 bg-gray-700 rounded-l-full" />
                <div className="absolute -left-[3px] top-[120px] w-[3px] h-10 bg-gray-700 rounded-l-full" />
                <div className="absolute -left-[3px] top-[172px] w-[3px] h-10 bg-gray-700 rounded-l-full" />
                <div className="absolute -right-[3px] top-[120px] w-[3px] h-14 bg-gray-700 rounded-r-full" />

                {/* Screen */}
                <div className="bg-black rounded-[36px] overflow-hidden">
                  {/* Dynamic island */}
                  <div className="bg-black flex justify-center pt-3 pb-1">
                    <div className="w-[80px] h-[24px] bg-gray-950 rounded-full flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-800 ring-1 ring-gray-700" />
                      <div className="w-[5px] h-[5px] rounded-full bg-gray-700" />
                    </div>
                  </div>

                  {/* GIF */}
                  <img
                    src="/demo-video.gif"
                    alt="WhatsApp AI bot demo"
                    className="w-full block"
                  />

                  {/* Home indicator */}
                  <div className="bg-black py-2 flex justify-center">
                    <div className="w-20 h-1 bg-gray-600 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Shine */}
              <div className="absolute top-[10px] left-[18px] w-[26px] h-[100px] bg-white/5 rounded-full blur-sm rotate-12 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─────────────── Problem ─────────────── */
function Problem() {
  const pains = [
    {
      icon: MessageSquareWarning,
      title: 'Sending messages manually?',
      desc: 'Copying and pasting the same message to hundreds of contacts wastes hours every day.',
    },
    {
      icon: UserX,
      title: 'Missing leads?',
      desc: 'Prospects message you, get no instant reply, and move on to competitors — before you even see their message.',
    },
    {
      icon: Timer,
      title: 'Slow responses?',
      desc: 'Delayed follow-ups kill conversions. Every minute without a reply costs you a potential sale.',
    },
  ];

  return (
    <section className="bg-gray-950 py-24 sm:py-32 border-t border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-red-400 tracking-wide uppercase mb-3">Sound familiar?</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            WhatsApp marketing is broken for most businesses
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pains.map((pain) => (
            <div
              key={pain.title}
              className="bg-gray-900/60 border border-gray-800 rounded-2xl p-7 flex flex-col gap-4 hover:border-red-500/30 transition-all"
            >
              <div className="w-11 h-11 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
                <pain.icon size={22} className="text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">{pain.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{pain.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Solution ─────────────── */
function Solution() {
  const pillars = [
    {
      icon: Upload,
      label: 'Bulk Sender',
      tagline: 'Reach 1,000+ instantly',
      desc: 'Upload a CSV/Excel, pick a template, attach media, and broadcast to thousands in one click — with personalised names.',
      color: 'from-green-500 to-emerald-600',
      glow: 'shadow-green-500/20',
      badge: 'bg-green-500/10 text-green-400 border-green-500/20',
    },
    {
      icon: Bot,
      label: 'AI Bot',
      tagline: 'Auto-reply & convert leads',
      desc: 'Your 24/7 WhatsApp agent. Answers FAQs, captures lead details, and books appointments — even while you sleep.',
      color: 'from-violet-500 to-purple-600',
      glow: 'shadow-violet-500/20',
      badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    },
    {
      icon: CalendarClock,
      label: 'Scheduler',
      tagline: 'Send at the perfect time',
      desc: 'Schedule campaigns for peak engagement hours. Set it once and let BulkSend deliver at exactly the right moment.',
      color: 'from-blue-500 to-indigo-600',
      glow: 'shadow-blue-500/20',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
  ];

  return (
    <section id="demo" className="bg-gray-900 py-24 sm:py-32 border-t border-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-green-400 tracking-wide uppercase mb-3">The Solution</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Three pillars. One unstoppable platform.
          </h2>
          <p className="text-lg text-gray-400">
            BulkSend combines everything you need to turn WhatsApp into your highest-converting sales channel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((p) => (
            <div
              key={p.label}
              className="relative bg-gray-800/50 border border-gray-700/60 rounded-2xl p-8 flex flex-col gap-5 hover:border-gray-600 hover:bg-gray-800/80 transition-all group"
            >
              <div className={`w-13 h-13 bg-gradient-to-br ${p.color} rounded-2xl flex items-center justify-center shadow-xl ${p.glow} w-14 h-14`}>
                <p.icon size={26} className="text-white" />
              </div>
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${p.badge} mb-3`}>
                  {p.label}
                </span>
                <h3 className="text-xl font-bold text-white mb-2">{p.tagline}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Features ─────────────── */
function Features() {
  const features = [
    {
      icon: Upload,
      title: 'Bulk Upload',
      desc: 'Import contacts from Excel or CSV files. Auto-validate phone numbers and filter duplicates.',
      color: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-blue-500/20',
    },
    {
      icon: FileText,
      title: 'Message Templates',
      desc: 'Create reusable templates with dynamic variables like {{name}}, {{order_id}}, and more.',
      color: 'from-violet-500 to-purple-600',
      shadow: 'shadow-violet-500/20',
    },
    {
      icon: Image,
      title: 'Media Attachments',
      desc: 'Send images, documents, and links alongside your messages. Supports JPG, PNG, WebP, GIF.',
      color: 'from-pink-500 to-rose-600',
      shadow: 'shadow-pink-500/20',
    },
    {
      icon: Users,
      title: 'Contact Management',
      desc: 'Select, filter, and manage contacts with an intuitive table. Choose exactly who gets each message.',
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20',
    },
    {
      icon: Zap,
      title: 'Smart Delivery',
      desc: 'Built-in rate limiting and random delays to avoid spam detection. Messages sent safely at scale.',
      color: 'from-green-500 to-emerald-600',
      shadow: 'shadow-green-500/20',
    },
    {
      icon: BarChart3,
      title: 'Live Progress',
      desc: 'Real-time delivery tracking with success/failure counts. Know exactly which messages landed.',
      color: 'from-teal-500 to-cyan-600',
      shadow: 'shadow-teal-500/20',
    },
    {
      icon: Shield,
      title: 'Secure Sessions',
      desc: 'Per-user WhatsApp sessions with encrypted storage. Your data stays yours, always.',
      color: 'from-gray-500 to-gray-700',
      shadow: 'shadow-gray-500/20',
    },
    {
      icon: Clock,
      title: 'Personalization',
      desc: 'Auto-replace {{name}} with each contact\'s name. Every message feels personal, at any scale.',
      color: 'from-red-500 to-rose-600',
      shadow: 'shadow-red-500/20',
    },
    {
      icon: Zap,
      title: 'API: OTP, Alerts & Automation',
      desc: 'Trigger WhatsApp messages programmatically — send OTPs, order alerts, and automated workflows via REST API.',
      color: 'from-yellow-500 to-amber-600',
      shadow: 'shadow-yellow-500/20',
    },
  ];

  return (
    <section id="features" className="bg-white py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-green-600 tracking-wide uppercase mb-3">Features</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Everything you need to send at scale
          </h2>
          <p className="text-lg text-gray-500">
            Powerful tools designed for marketers, support teams, and businesses of all sizes.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-11 h-11 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center mb-4 shadow-lg ${f.shadow}`}>
                <f.icon size={20} className="text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── How It Works ─────────────── */
function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Upload Your Contacts',
      desc: 'Import your Excel or CSV file with phone numbers and names. We validate everything automatically.',
    },
    {
      num: '02',
      title: 'Connect WhatsApp',
      desc: 'Scan the QR code with your phone to link your WhatsApp account. One-time setup, stays connected.',
    },
    {
      num: '03',
      title: 'Compose & Send',
      desc: 'Write your message or pick a template, attach images if needed, and hit send. Watch delivery in real time.',
    },
  ];

  return (
    <section id="how-it-works" className="bg-gray-50 py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-green-600 tracking-wide uppercase mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Three steps. That's it.
          </h2>
          <p className="text-lg text-gray-500">
            Go from zero to sending bulk messages in under 2 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.num} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(100%)] w-full h-px border-t-2 border-dashed border-gray-300 -z-0" />
              )}
              <div className="bg-white rounded-2xl p-8 border border-gray-200 relative z-10 h-full">
                <div className="text-5xl font-black text-green-100 mb-4">{step.num}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Pricing ─────────────── */
const PLAN_META: Record<string, { name: string; desc: string; features: string[]; highlight?: boolean }> = {
  free:            { name: 'Free Trial', desc: 'Perfect for trying things out',   features: ['Send up to 10 messages total','Basic templates','CSV/Excel upload','WhatsApp QR connect'] },
  starter:         { name: 'Starter',   desc: 'Great for small teams',           features: ['1,000 messages/month','All templates + custom','CSV/Excel upload','Basic support','API access'] },
  starter_yearly:  { name: 'Starter',   desc: 'Great for small teams',           features: ['1,000 messages/month','All templates + custom','CSV/Excel upload','Basic support','API access'] },
  growth:          { name: 'Growth',    desc: 'For growing businesses',           features: ['5,000 messages/month','Image & media attachments','Message scheduling','Delivery analytics','Priority support','API access'], highlight: true },
  growth_yearly:   { name: 'Growth',    desc: 'For growing businesses',           features: ['5,000 messages/month','Image & media attachments','Message scheduling','Delivery analytics','Priority support','API access'], highlight: true },
  business:        { name: 'Business',  desc: 'High-volume sending',              features: ['15,000 messages/month','Everything in Growth','Advanced automation','Bulk import up to 10K','Early access to features','Priority support'] },
  business_yearly: { name: 'Business',  desc: 'High-volume sending',              features: ['15,000 messages/month','Everything in Growth','Advanced automation','Bulk import up to 10K','Early access to features','Priority support'] },
};

function Pricing() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [livePricing, setLivePricing] = useState<Record<string, { amount: number; messageLimit: number }> | null>(null);
  const [currency, setCurrency] = useState({ symbol: '₹', isIndia: true, rate: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/subscription/plans`)
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setLivePricing(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Support ?testCurrency=US in the browser URL for local dev testing
    const testCountry = new URLSearchParams(window.location.search).get('testCurrency');
    const currencyUrl = `${API_BASE_URL}/api/payment/currency${testCountry ? `?country=${testCountry}` : ''}`;
    fetch(currencyUrl)
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setCurrency({ symbol: d.data.symbol, isIndia: d.data.isIndia, rate: d.data.exchangeRate }); })
      .catch(() => {});
  }, []);

  const fmt = (inr: number) =>
    currency.isIndia ? `₹${inr.toLocaleString('en-IN')}` : `$${(inr * currency.rate).toFixed(2)}`;

  const displayKeys = billing === 'yearly'
    ? ['free', 'starter_yearly', 'growth_yearly', 'business_yearly']
    : ['free', 'starter', 'growth', 'business'];

  return (
    <section id="pricing" className="bg-white py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-sm font-semibold text-green-600 tracking-wide uppercase mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-gray-500">Start free, upgrade when you need more. No hidden fees, ever.</p>
          {!currency.isIndia && (
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
              <Globe size={13} className="text-blue-500" />
              <span className="text-xs font-medium text-blue-700">Prices shown in USD for your region</span>
            </div>
          )}
        </div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <button onClick={() => setBilling('monthly')} className={`text-sm font-semibold transition-colors ${billing === 'monthly' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>Monthly</button>
          <button type="button" onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${billing === 'yearly' ? 'bg-green-500' : 'bg-gray-300'}`}>
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${billing === 'yearly' ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <button onClick={() => setBilling('yearly')} className={`text-sm font-semibold transition-colors ${billing === 'yearly' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
            Yearly <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Save ~17%</span>
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {displayKeys.map((key) => {
            const meta = PLAN_META[key]; if (!meta) return null;
            const isFree = key === 'free';
            const liveData = livePricing?.[key];
            const rawAmount = liveData?.amount ?? 0;
            const msgLimit = liveData?.messageLimit ?? 10;

            return (
              <div key={key} className={`relative rounded-2xl p-8 flex flex-col transition-all duration-300 ${
                meta.highlight
                  ? 'bg-gradient-to-b from-gray-900 to-gray-950 text-white border-2 border-green-500/30 shadow-2xl shadow-green-500/10 scale-[1.02]'
                  : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg'
              }`}>
                {meta.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-xs font-bold text-white tracking-wide shadow-lg whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}

                {/* Name */}
                <div className="mb-6">
                  <h3 className={`text-lg font-bold mb-1 ${meta.highlight ? 'text-white' : 'text-gray-900'}`}>{meta.name}</h3>
                  <p className={`text-sm ${meta.highlight ? 'text-gray-400' : 'text-gray-500'}`}>{meta.desc}</p>
                </div>

                {/* Price */}
                <div className="mb-2 min-h-[56px]">
                  {loading && !isFree ? (
                    <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-extrabold tracking-tight ${meta.highlight ? 'text-white' : 'text-gray-900'}`}>
                        {isFree ? 'Free' : fmt(rawAmount)}
                      </span>
                      {!isFree && (
                        <span className={`text-base ${meta.highlight ? 'text-gray-400' : 'text-gray-500'}`}>
                          /{billing === 'yearly' ? 'yr' : 'mo'}
                        </span>
                      )}
                    </div>
                  )}
                  {isFree && <p className={`text-xs mt-0.5 ${meta.highlight ? 'text-gray-400' : 'text-gray-500'}`}>{msgLimit} messages</p>}
                  {!isFree && billing === 'yearly' && !loading && rawAmount > 0 && (
                    <p className={`text-xs mt-0.5 font-medium ${meta.highlight ? 'text-green-400' : 'text-green-600'}`}>
                      ≈ {fmt(Math.round(rawAmount / 12))}/month
                    </p>
                  )}
                  {!currency.isIndia && !isFree && !loading && rawAmount > 0 && (
                    <p className={`text-xs mt-0.5 flex items-center gap-1 ${meta.highlight ? 'text-gray-500' : 'text-gray-400'}`}>
                      <Globe size={10} />≈ ₹{rawAmount.toLocaleString('en-IN')} INR
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1 mt-6">
                  {meta.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check size={16} className={`mt-0.5 flex-shrink-0 ${meta.highlight ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={`text-sm ${meta.highlight ? 'text-gray-300' : 'text-gray-600'}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link to={isFree ? '/signup' : '/subscription'}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    meta.highlight
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.02]'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}>
                  {isFree ? 'Get Started' : 'Subscribe Now'}
                  <ChevronRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── CTA ─────────────── */
function CTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 py-24">
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '32px 32px',
      }} />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          Ready to reach your customers?
        </h2>
        <p className="text-lg text-green-100 mb-10 max-w-xl mx-auto">
          Join 2,000+ businesses already using BulkSend to grow their customer engagement on WhatsApp.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-green-700 bg-white rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all"
        >
          Get Started Free
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}

import { useSEO } from '@/hooks/useSEO';

/* ─────────────── Page ─────────────── */
export function HomePage() {
  useSEO({
    title: 'WhatsApp Bulk Messenger - Send Messages at Scale',
    description: 'Bulk WhatsApp messaging tool. Upload contacts, select templates, and launch campaigns instantly without coding.',
    keywords: 'whatsapp bulk sender, whatsapp marketing, bulk messaging, whatsapp api',
    url: 'https://bulksender.todayintech.in/'
  });

  return (
    <>
      <Hero />
      <Problem />
      <Solution />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
    </>
  );
}
