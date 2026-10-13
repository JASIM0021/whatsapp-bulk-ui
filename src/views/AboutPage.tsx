import { usePageSEO } from '@/hooks/useSEO';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { AGENTS, TEAM_NOTE } from '@/components/landing/homeContent';
import { Avatar, Label, PrimaryCta } from '@/components/landing/HomeSections';

// Team-only About page: no personal names by choice. Every claim here maps to
// a shipped feature; keep it that way when editing.
const PRINCIPLES = [
  {
    title: 'Simple first',
    text: 'If a feature needs a manual, it isn’t finished. Connecting WhatsApp is a QR scan, and starting a campaign is an upload and a message.',
  },
  {
    title: 'Affordable on purpose',
    text: 'A one-person business should be able to hire its first AI employee for $5 a month, and add more only when they pay for themselves.',
  },
  {
    title: 'Honest about limits',
    text: 'Bulk sending on a personal WhatsApp number carries risk, so we say so, space messages out, and offer the official WhatsApp Business Cloud API for high volume.',
  },
  {
    title: 'Your data stays yours',
    text: 'Your accounts stay in your name. Each user gets their own WhatsApp session, credentials are encrypted, and you can ask us to delete your data at any time.',
  },
];

const SECURITY = [
  'Separate WhatsApp session for every user',
  'API keys and connector credentials encrypted with AES-256',
  'Built-in rate limiting and human-like delays when sending',
  'Data deletion on request, from the data deletion page',
];

export function AboutPage() {
  usePageSEO('/about');

  return (
    <div className="bg-nb-bg font-sans text-nb-fg">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[800px] -translate-x-1/2 rounded-full bg-nb-acc/15 blur-[140px]" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
          <Label>About us</Label>
          <h1 className="mt-4 text-balance font-display text-[clamp(40px,6vw,84px)] font-black leading-[0.98] tracking-[-0.03em]">
            We build AI employees for businesses that live on WhatsApp
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-nb-muted sm:text-xl">
            NexBotix gives small and growing businesses a team of AI employees for WhatsApp, email, lead generation and
            website chat, at a price a one-person business can afford.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="border-t border-nb-line py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-4xl font-black tracking-[-0.03em] sm:text-5xl">{TEAM_NOTE.heading}</h2>
          <div className="mt-8 space-y-5 text-[18px] leading-relaxed text-nb-muted">
            {TEAM_NOTE.paragraphs.map((t) => <p key={t}>{t}</p>)}
            <p>
              Today NexBotix runs {AGENTS.length} AI employees in one workspace, from WhatsApp campaigns and lead finding to
              website chat, social posting, SEO and meeting booking. Developers can build on the same engine through our
              REST API, an MCP server for AI tools like Claude and Cursor, and a visual flow studio.
            </p>
          </div>
        </div>
      </section>

      {/* The team we built */}
      <section className="border-t border-nb-line py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-4xl font-black tracking-[-0.03em] sm:text-5xl">The AI team we’ve built so far</h2>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AGENTS.map((a) => (
              <li key={a.id} className="flex items-center gap-4 rounded-[18px] border border-nb-line bg-nb-surface p-4">
                <Avatar a={a} size={48} />
                <div>
                  <p className="font-display text-lg font-bold">{a.name}</p>
                  <p className="text-[14px] text-nb-muted">{a.role}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/#features" className="mt-8 inline-flex items-center gap-2 text-[15px] font-semibold text-nb-acc hover:underline">
            See what each one does <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Principles */}
      <section className="border-t border-nb-line py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-4xl font-black tracking-[-0.03em] sm:text-5xl">How we build NexBotix</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <article key={p.title} className="rounded-[20px] border border-nb-line bg-nb-surface p-7">
                <h3 className="font-display text-xl font-bold">{p.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-nb-muted">{p.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="border-t border-nb-line py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl font-black tracking-[-0.03em] sm:text-5xl">Security and privacy</h2>
            <p className="mt-4 text-lg text-nb-muted">
              You’re trusting us with your customers’ conversations. Here is how we look after them. The details are in our{' '}
              <Link to="/privacy" className="text-nb-acc hover:underline">privacy policy</Link>.
            </p>
          </div>
          <ul className="space-y-3">
            {SECURITY.map((t) => (
              <li key={t} className="flex gap-3 rounded-[16px] border border-nb-line bg-nb-surface p-5 text-[15px]">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-nb-acc" />{t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-nb-line py-24 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-4xl font-black tracking-[-0.03em] sm:text-5xl">Talk to the team</h2>
          <p className="mt-4 text-lg text-nb-muted">
            Questions, feature requests or feedback: send us a message and we’ll reply within 24 hours.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryCta>Start your free trial</PrimaryCta>
            <Link to="/contact" className="rounded-full border border-nb-line2 px-7 py-3.5 text-[15px] font-semibold hover:bg-white/5">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
