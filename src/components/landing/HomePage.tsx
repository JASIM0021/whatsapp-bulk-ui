import { Link } from 'react-router-dom';
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-green-400 tracking-wide">WhatsApp Cloud API Powered</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
            Bulk WhatsApp
            <br />
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              messages at scale
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-xl mb-10">
            Upload contacts, pick a template, attach media, and hit send.
            Reach thousands of customers with personalized messages — no coding needed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/signup"
              className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-xl shadow-green-600/25 hover:shadow-green-600/40 hover:from-green-500 hover:to-emerald-500 transition-all"
            >
              Start Sending Free
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-gray-300 border border-gray-700 rounded-2xl hover:bg-white/5 hover:border-gray-600 transition-all"
            >
              See How It Works
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-14 flex items-center gap-6">
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

        {/* Floating chat mockup */}
        <div className="hidden lg:block absolute right-8 xl:right-16 top-32 w-[340px]">
          <div className="relative">
            <div className="bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-700/50">
                <img src="/icon-192.png" alt="Logo" className="w-10 h-10 rounded-full object-contain" />
                <div>
                  <p className="text-sm font-semibold text-white">BulkSend</p>
                  <p className="text-xs text-green-400">Sending 1,247 messages...</p>
                </div>
              </div>
              {/* Chat bubbles */}
              <div className="space-y-3">
                <div className="bg-green-600/90 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[85%]">
                  <p className="text-sm text-white">Hi Rahul! Your order #4521 has been shipped.</p>
                  <p className="text-[10px] text-green-200 mt-1">10:32 AM</p>
                </div>
                <div className="bg-green-600/90 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[85%] opacity-70">
                  <p className="text-sm text-white">Hi Priya! Your order #4522 has been shipped.</p>
                  <p className="text-[10px] text-green-200 mt-1">10:35 AM</p>
                </div>
                <div className="bg-green-600/90 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[85%] opacity-40">
                  <p className="text-sm text-white">Hi Amit! Your order #4523 has been shipped.</p>
                  <p className="text-[10px] text-green-200 mt-1">10:38 AM</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-5 pt-4 border-t border-gray-700/50">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-green-400 font-semibold">847 / 1,247</span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" style={{ width: '68%' }} />
                </div>
              </div>
            </div>
            {/* Decorative dots */}
            <div className="absolute -bottom-4 -left-4 w-20 h-20 border border-green-500/10 rounded-2xl -z-10" />
            <div className="absolute -top-3 -right-3 w-16 h-16 border border-emerald-500/10 rounded-2xl -z-10" />
          </div>
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
function Pricing() {
  const plans = [
    {
      name: 'Free Trial',
      price: 'Free',
      period: '50 messages',
      desc: 'Perfect for trying things out',
      features: ['Send up to 50 messages total', 'Basic templates', 'CSV/Excel upload', 'WhatsApp QR connect', 'Community support'],
      cta: 'Get Started',
      highlight: false,
    },
    {
      name: 'Pro Monthly',
      price: '₹500',
      period: '/month',
      desc: 'For growing businesses',
      features: ['Unlimited messages', 'All templates + custom', 'Image & media attachments', 'Priority support', 'Message scheduling', 'Delivery analytics'],
      cta: 'Start Free Trial',
      highlight: true,
    },
    {
      name: 'Pro Yearly',
      price: '₹5,000',
      period: '/year',
      desc: 'Best value — save ₹1,000',
      features: ['Everything in Monthly', 'Save ₹1,000/year', 'Priority support', 'Early access to features', 'Bulk import up to 10K', 'API access (coming soon)'],
      cta: 'Start Free Trial',
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="bg-white py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-green-600 tracking-wide uppercase mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-gray-500">
            Start free, upgrade when you need more. No hidden fees, ever.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.highlight
                  ? 'bg-gradient-to-b from-gray-900 to-gray-950 text-white border-2 border-green-500/30 shadow-2xl shadow-green-500/10 scale-[1.02]'
                  : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg'
              } transition-all duration-300`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-xs font-bold text-white tracking-wide shadow-lg">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.highlight ? 'text-gray-400' : 'text-gray-500'}`}>{plan.desc}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-8">
                <span className={`text-4xl font-extrabold tracking-tight ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={`text-base ${plan.highlight ? 'text-gray-400' : 'text-gray-500'}`}>{plan.period}</span>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check size={16} className={`mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-green-400' : 'text-green-600'}`} />
                    <span className={`text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-600'}`}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
                <ChevronRight size={16} />
              </Link>
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

/* ─────────────── Page ─────────────── */
export function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
    </>
  );
}
