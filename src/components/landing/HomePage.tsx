import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { usePageSEO } from '@/hooks/useSEO';
import {
  HomeHero, ChannelStrip, StopJuggling, MeetTheTeam, GrowthSystem, JobsSection,
  DemoVideo, FactsSection, IntegrationsSection, FaqSection, ClosingCta,
  DayWithTeam, WhoItsFor, CompareSection, DevelopersSection, TeamNote, PricingHero, PricingIncluded,
} from './HomeSections';
import { PRICING_FAQ, CREDIT_PLANS, CREDIT_TOPUPS, CREDIT_COSTS, TRIAL_CREDITS, inr } from './homeContent';

/* ─────────────── Credit pricing ─────────────── */
// heading=false on /pricing, where PricingHero already carries the H1.
function PricingSection({ heading = true }: { heading?: boolean }) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const examples = (credits: number) => [
    `${Math.floor(credits).toLocaleString('en-IN')} WhatsApp messages`,
    `or ${Math.floor(credits / 2).toLocaleString('en-IN')} leads`,
    `or ${Math.floor(credits / 50).toLocaleString('en-IN')} SEO blog posts`,
  ];

  return (
    <section className="bg-nb-bg py-24 sm:py-32 border-t border-nb-line relative overflow-hidden" id="pricing">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {heading && (
          <div className="max-w-3xl">
            <p className="font-label text-[12px] uppercase tracking-[0.18em] text-nb-acc">Pricing</p>
            <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.03em] text-nb-fg sm:text-6xl">One plan. Every AI employee.</h2>
            <p className="mt-4 text-lg text-nb-muted">
              Plans give you credits every month and every AI employee is included. Simple tasks use few credits; heavy AI work uses more.
            </p>
          </div>
        )}

        <div className={`${heading ? 'mt-10' : ''} inline-flex rounded-full border border-nb-line2 bg-nb-surface p-1 text-sm`}>
          {(['monthly', 'yearly'] as const).map(b => (
            <button key={b} onClick={() => setBilling(b)}
              className={`rounded-full px-5 py-2 font-semibold transition-colors ${billing === b ? 'bg-nb-acc text-nb-on-acc' : 'text-nb-muted hover:text-nb-fg'}`}>
              {b === 'monthly' ? 'Monthly' : 'Yearly · 2 months free'}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {CREDIT_PLANS.map(p => (
            <article key={p.id} className={`relative flex flex-col rounded-[24px] border p-7 ${p.highlight ? 'border-nb-acc/60 bg-nb-acc/[0.07]' : 'border-nb-line bg-nb-surface'}`}>
              {p.highlight && <span className="absolute -top-3 left-7 rounded-full bg-nb-acc px-3 py-0.5 font-label text-[11px] font-medium uppercase tracking-wider text-nb-on-acc">Most popular</span>}
              <h3 className="font-display text-2xl font-bold text-nb-fg">{p.name}</h3>
              <p className="mt-1 text-[14px] text-nb-muted">{p.blurb}</p>
              <p className="mt-6 font-display text-5xl font-black tracking-[-0.03em] text-nb-fg">
                {inr(billing === 'monthly' ? p.monthly : p.yearly)}
                <span className="ml-1 text-base font-normal text-nb-muted">/{billing === 'monthly' ? 'month' : 'year'}</span>
              </p>
              <p className="mt-4 font-label text-[13px] text-nb-acc">{p.credits.toLocaleString('en-IN')} credits every month</p>
              <ul className="mt-4 flex-1 space-y-2.5 text-[15px] text-nb-muted">
                {examples(p.credits).map(e => <li key={e} className="flex gap-2.5"><Check className="mt-1 h-4 w-4 shrink-0 text-nb-acc" />{e}</li>)}
                <li className="flex gap-2.5"><Check className="mt-1 h-4 w-4 shrink-0 text-nb-acc" />Every AI employee and service included</li>
                <li className="flex gap-2.5"><Check className="mt-1 h-4 w-4 shrink-0 text-nb-acc" />Top up any time; top-ups never expire</li>
              </ul>
              <Link to={`/signup?plan=${p.id}${billing === 'yearly' ? '_yr' : ''}`}
                className={`mt-7 flex items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-bold transition-colors ${p.highlight ? 'bg-nb-acc text-nb-on-acc hover:bg-nb-acc-hover' : 'border border-nb-line2 text-nb-fg hover:bg-white/5'}`}>
                Start with {p.name} <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-[20px] border border-nb-line bg-nb-dim p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-nb-fg">Try it free with {TRIAL_CREDITS} credits</p>
            <p className="text-[14px] text-nb-muted">No credit card. Need more later? Top-ups: {CREDIT_TOPUPS.map(t => `${t.credits.toLocaleString('en-IN')} for ${inr(t.price)}`).join(' · ')}.</p>
          </div>
          <Link to="/signup" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-nb-acc px-6 py-3 text-[15px] font-bold text-nb-on-acc hover:bg-nb-acc-hover">
            Start free <Sparkles className="h-4 w-4" />
          </Link>
        </div>
        <p className="mt-4 text-[13px] text-nb-muted2">Prices in Indian rupees; shown in your local currency at checkout where available.</p>
      </div>
    </section>
  );
}

/* ─────────────── What uses credits ─────────────── */
function CreditCostsSection() {
  return (
    <section className="border-t border-nb-line py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-black tracking-[-0.02em] text-nb-fg sm:text-4xl">What uses credits</h2>
        <p className="mt-3 text-[16px] text-nb-muted">
          1 credit is about ₹0.20. Replies from your own AI key or in-house AI don’t use credits.
        </p>
        <div className="mt-8 overflow-hidden rounded-[20px] border border-nb-line">
          <table className="w-full text-[15px]">
            <tbody className="divide-y divide-nb-line">
              {CREDIT_COSTS.map(c => (
                <tr key={c.label}>
                  <td className="px-5 py-3 text-nb-fg">{c.label}</td>
                  <td className="px-5 py-3 text-right font-label text-[14px] text-nb-acc">{c.credits === 0 ? 'Free' : `${c.credits} credit${c.credits === 1 ? '' : 's'}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── Pricing page (/pricing) ─────────────── */
export function PricingPage() {
  usePageSEO('/pricing');

  return (
    <div className="bg-nb-bg font-sans text-nb-fg">
      <PricingHero />
      <PricingSection heading={false} />
      <CreditCostsSection />
      <PricingIncluded />
      <CompareSection />
      <FaqSection items={PRICING_FAQ} title="Pricing questions" />
      <ClosingCta />
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
