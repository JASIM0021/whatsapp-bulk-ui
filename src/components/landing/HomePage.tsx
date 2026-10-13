import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { usePageSEO } from '@/hooks/useSEO';
import {
  HomeHero, ChannelStrip, StopJuggling, MeetTheTeam, GrowthSystem, JobsSection,
  DemoVideo, FactsSection, IntegrationsSection, FaqSection, ClosingCta,
  DayWithTeam, WhoItsFor, CompareSection, DevelopersSection, TeamNote,
} from './HomeSections';

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

/* ─────────────── Pricing page (/pricing) ─────────────── */
export function PricingPage() {
  usePageSEO('/pricing');

  return (
    <div className="bg-gray-950 text-gray-100 min-h-screen pt-28">
      <h1 className="text-center text-sm font-semibold uppercase tracking-widest text-emerald-400">
        NexBotix Pricing
      </h1>
      <PricingSection />
      <CTA />
    </div>
  );
}


/* ─────────────── Page ─────────────── */
// Section order follows docs/SEO_PLAN.md "Landing page anatomy".
export function HomePage() {
  usePageSEO('/');

  // Scroll to /#features etc. on arrival and whenever a link changes the hash.
  const { hash } = useLocation();
  useEffect(() => {
    if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
  }, [hash]);

  return (
    <div className="bg-nb-bg font-sans text-nb-fg">
      <HomeHero />
      <ChannelStrip />
      <StopJuggling />
      <MeetTheTeam />
      <GrowthSystem />
      <JobsSection />
      <DayWithTeam />
      <DemoVideo />
      <WhoItsFor />
      <CompareSection />
      <FactsSection />
      <IntegrationsSection />
      <DevelopersSection />
      <PricingSection />
      <FaqSection />
      <TeamNote />
      <ClosingCta />
    </div>
  );
}
