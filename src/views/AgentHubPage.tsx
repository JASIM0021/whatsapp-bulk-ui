import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, Minus, Plus, X } from 'lucide-react';
import { usePageSEO, useSEO } from '@/hooks/useSEO';
import { SITE_URL } from '@/seo/site';
import { AGENTS, type Agent } from '@/components/landing/homeContent';
import { HUBS, findHubBySlug, hubPath } from '@/components/landing/hubContent';
import { HUB_GUIDES } from '@/components/landing/hubGuides';
import { HUB_EXTRAS, hubFaq } from '@/components/landing/hubExtras';
import { Avatar, ClosingCta, FaqSection, Label, PrimaryCta } from '@/components/landing/HomeSections';

const agent = (id: string) => AGENTS.find((a) => a.id === id) as Agent;

// /ai-agents/:slug — one keyword-targeted landing page per AI employee.
// Section order follows the competitor product pages: pain → meet → features →
// how it works → use cases → limits → FAQ → related (docs/SEO_PLAN.md, Phase 3).
export function AgentHubPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const hub = findHubBySlug(slug);

  useSEO({
    title: hub?.seoTitle ?? 'AI Employees | NexBotix',
    description: hub?.seoDescription ?? '',
    url: `${SITE_URL}/ai-agents/${slug}`,
  });
  useEffect(() => window.scrollTo(0, 0), [slug]);

  if (!hub) return <Navigate to="/ai-agents" replace />;
  const team = hub.agentIds.map(agent);
  const base = HUB_GUIDES[hub.slug];
  const extra = HUB_EXTRAS[hub.slug];
  const guide = base && { ...base, sections: [...base.sections, ...(extra?.sections ?? [])] };
  const names = team.map((a) => a.name).join(' & ');

  return (
    <div className="bg-nb-bg font-sans text-nb-fg">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 pt-8 font-label text-[12px] text-nb-muted2 sm:px-6">
        <Link to="/" className="hover:text-nb-fg">Home</Link> <span aria-hidden>/</span>{' '}
        <Link to="/ai-agents" className="hover:text-nb-fg">AI Employees</Link> <span aria-hidden>/</span>{' '}
        <span className="text-nb-muted">{team.map((a) => a.name).join(' & ')}</span>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[800px] -translate-x-1/2 rounded-full bg-nb-acc/15 blur-[140px]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          <div className="flex justify-center gap-3">{team.map((a) => <Avatar key={a.id} a={a} size={72} />)}</div>
          <p className="mt-5 font-label text-[12px] uppercase tracking-[0.18em] text-nb-acc">
            {team.map((a) => `${a.name} · ${a.role}`).join('  ·  ')}
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl text-balance font-display text-[clamp(38px,5.5vw,76px)] font-black leading-[0.98] tracking-[-0.03em]">
            {hub.h1}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-nb-muted sm:text-xl">{hub.intro}</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <PrimaryCta>Hire {team.map((a) => a.name).join(' & ')}</PrimaryCta>
            <Link to="/pricing" className="rounded-full border border-nb-line2 px-7 py-3.5 text-[15px] font-semibold hover:bg-white/5">See pricing</Link>
          </div>
          <p className="mt-5 font-label text-[12px] text-nb-muted2">Free trial · No credit card · From ₹399 a month</p>
        </div>
      </section>

      {/* Pain */}
      <section className="border-t border-nb-line py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="font-display text-4xl font-black tracking-[-0.03em] sm:text-5xl">Does this sound familiar?</h2>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {hub.pains.map((p) => (
              <li key={p} className="flex gap-3 rounded-[18px] border border-nb-line bg-nb-dim p-5 text-[16px] text-nb-muted">
                <Minus className="mt-1 h-4 w-4 shrink-0 text-nb-muted2" />{p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Meet */}
      <section className="border-t border-nb-line py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="font-display text-4xl font-black tracking-[-0.03em] sm:text-5xl">Meet {team.map((a) => a.name).join(' and ')}.</h2>
          <blockquote className="mt-8 rounded-[24px] border border-nb-acc/40 bg-nb-acc/[0.07] p-8 text-[20px] leading-relaxed text-nb-fg">
            “{hub.meet}”
          </blockquote>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-16 border-t border-nb-line py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Label>What {team.length > 1 ? 'they do' : `${team[0].name} does`}</Label>
          <h2 className="mt-3 max-w-3xl font-display text-4xl font-black tracking-[-0.03em] sm:text-5xl">
            Everything you need for {hub.keyword.toLowerCase()}
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hub.features.map((f) => (
              <article key={f.title} className="rounded-[20px] border border-nb-line bg-nb-surface p-7">
                <Plus className="h-5 w-5 text-nb-acc" />
                <h3 className="mt-4 font-display text-xl font-bold">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-nb-muted">{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-nb-line py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-4xl font-black tracking-[-0.03em] sm:text-5xl">How it works</h2>
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {hub.steps.map((s, i) => (
              <li key={s.title} className="rounded-[20px] border border-nb-line bg-nb-surface p-7">
                <span className="font-label text-[13px] text-nb-acc">0{i + 1}</span>
                <h3 className="mt-3 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-nb-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Getting started checklist */}
      {extra && (
        <section className="border-t border-nb-line py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="font-display text-4xl font-black tracking-[-0.03em] sm:text-5xl">Your first day checklist</h2>
            <p className="mt-4 text-lg text-nb-muted">Five steps to get {names} working for you.</p>
            <ol className="mt-8 space-y-3">
              {extra.checklist.map((c, i) => (
                <li key={c} className="flex gap-4 rounded-[16px] border border-nb-line bg-nb-surface p-5 text-[16px]">
                  <span className="font-label text-[13px] text-nb-acc">{String(i + 1).padStart(2, '0')}</span>{c}
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* A day with the agent */}
      {guide && (
        <section className="border-t border-nb-line py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <Label>An example day</Label>
            <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.03em] sm:text-5xl">A day with {names}</h2>
            <ol className="relative mt-10 space-y-7 border-l border-nb-line2 pl-8">
              {guide.day.map((d, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-2 border-nb-bg bg-nb-acc" />
                  <p className="font-label text-[12px] uppercase tracking-[0.14em] text-nb-muted2">{d.time}</p>
                  <p className="mt-1.5 text-[17px] leading-relaxed">{d.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Versus doing it by hand */}
      {guide && (
        <section className="border-t border-nb-line py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 className="font-display text-4xl font-black tracking-[-0.03em] sm:text-5xl">{names} vs doing it by hand</h2>
            <div className="mt-10 overflow-x-auto rounded-[20px] border border-nb-line">
              <table className="w-full min-w-[560px] text-left text-[15px]">
                <thead className="bg-nb-surface font-label text-[12px] uppercase tracking-[0.12em] text-nb-muted2">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-medium">Task</th>
                    <th scope="col" className="px-5 py-4 font-medium">By hand</th>
                    <th scope="col" className="px-5 py-4 font-medium text-nb-acc">With {names}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nb-line">
                  {guide.vsManual.map((r) => (
                    <tr key={r.task}>
                      <th scope="row" className="px-5 py-4 font-semibold">{r.task}</th>
                      <td className="px-5 py-4 text-nb-muted">{r.manual}</td>
                      <td className="px-5 py-4">{r.agent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Use cases */}
      <section className="border-t border-nb-line py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-4xl font-black tracking-[-0.03em] sm:text-5xl">Who uses it</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {hub.useCases.map((u) => (
              <article key={u.who} className="rounded-[20px] border border-nb-line bg-nb-surface p-7">
                <h3 className="font-display text-xl font-bold">{u.who}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-nb-muted">{u.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Long-form guide */}
      {guide && (
        <section className="border-t border-nb-line py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <Label>Guide</Label>
            <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.03em] sm:text-5xl">{guide.title}</h2>
            <nav aria-label="In this guide" className="mt-8 rounded-[18px] border border-nb-line bg-nb-surface p-6">
              <p className="font-label text-[12px] uppercase tracking-[0.14em] text-nb-muted2">In this guide</p>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px]">
                {guide.sections.map((g, i) => (
                  <li key={g.q}><a href={`#guide-${i + 1}`} className="text-nb-muted hover:text-nb-acc">{g.q}</a></li>
                ))}
              </ol>
            </nav>
            <div className="mt-12 space-y-12">
              {guide.sections.map((g, i) => (
                <article key={g.q} id={`guide-${i + 1}`} className="scroll-mt-20">
                  <h3 className="font-display text-2xl font-bold sm:text-3xl">{g.q}</h3>
                  {g.a.map((para, j) => (
                    <p key={j} className={`mt-4 text-[17px] leading-relaxed ${j === 0 ? 'text-nb-fg' : 'text-nb-muted'}`}>{para}</p>
                  ))}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Honest limits */}
      <section className="border-t border-nb-line py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="font-display text-4xl font-black tracking-[-0.03em] sm:text-5xl">What {team.length > 1 ? 'they won’t' : `${team[0].name} won’t`} do</h2>
          <p className="mt-4 text-lg text-nb-muted">We’d rather you know the limits before you sign up.</p>
          <ul className="mt-8 space-y-3">
            {hub.limits.map((l) => (
              <li key={l} className="flex gap-3 rounded-[16px] border border-nb-line bg-nb-dim p-5 text-[15px] leading-relaxed text-nb-muted">
                <X className="mt-1 h-4 w-4 shrink-0 text-nb-muted2" />{l}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FaqSection items={hubFaq(hub)} title="Questions?" />

      {/* Related */}
      <section className="border-t border-nb-line py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-black tracking-[-0.02em] sm:text-4xl">Works well with</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {hub.related.map((s) => {
              const r = findHubBySlug(s);
              if (!r) return null;
              return (
                <Link key={s} to={hubPath(r)} className="group rounded-[20px] border border-nb-line bg-nb-surface p-6 transition-colors hover:border-nb-line2">
                  <div className="flex gap-2">{r.agentIds.map((id) => <Avatar key={id} a={agent(id)} size={40} />)}</div>
                  <p className="mt-4 font-display text-lg font-bold">{r.agentIds.map((id) => agent(id).name).join(' & ')}</p>
                  <p className="mt-1 text-[14px] text-nb-muted">{r.keyword.charAt(0).toUpperCase() + r.keyword.slice(1)}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[14px] font-semibold text-nb-acc">Learn more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <ClosingCta />
    </div>
  );
}

// /ai-agents — index of every hub.
export function AgentHubIndexPage() {
  usePageSEO('/ai-agents');

  return (
    <div className="bg-nb-bg font-sans text-nb-fg">
      <section className="relative overflow-hidden pt-16 pb-16 sm:pt-24">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[800px] -translate-x-1/2 rounded-full bg-nb-acc/15 blur-[140px]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Label>AI employees</Label>
          <h1 className="mt-4 text-balance font-display text-[clamp(40px,6vw,84px)] font-black leading-[0.98] tracking-[-0.03em]">
            AI employees for every job you keep putting off
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-nb-muted">
            Each NexBotix AI employee owns one job, end to end. Every plan includes every AI employee, from ₹399 a month.
          </p>
        </div>
      </section>
      <section className="border-t border-nb-line py-20">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-3">
          {HUBS.map((h) => (
            <Link key={h.slug} to={hubPath(h)} className="group flex flex-col rounded-[20px] border border-nb-line bg-nb-surface p-7 transition-colors hover:border-nb-line2">
              <div className="flex gap-2">{h.agentIds.map((id) => <Avatar key={id} a={agent(id)} size={48} />)}</div>
              <h2 className="mt-5 font-display text-2xl font-bold">{h.agentIds.map((id) => agent(id).name).join(' & ')}</h2>
              <p className="font-label text-[12px] uppercase tracking-[0.12em] text-nb-muted2">{h.keyword}</p>
              <p className="mt-4 flex-1 text-[15px] leading-relaxed text-nb-muted">{h.intro}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-[14px] font-semibold text-nb-acc">
                See how it works <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-14 text-center"><PrimaryCta>Start your free trial</PrimaryCta></div>
      </section>
      <section className="border-t border-nb-line py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-black tracking-[-0.02em] sm:text-4xl">What is an AI employee?</h2>
          <p className="mt-5 text-[17px] leading-relaxed text-nb-muted">
            An AI employee is an AI agent that owns a whole job instead of a single task. Nexa doesn’t just send one WhatsApp message; it runs the campaign, answers the replies and hands you the chats that need a person. Scrappy doesn’t just find a lead; it finds hundreds, checks them, removes duplicates and writes the first message.
          </p>
          <p className="mt-4 text-[17px] leading-relaxed text-nb-muted">
            You don’t need to write prompts. Each employee is set up once with your business details, works in the background on your accounts, and checks with you only when a decision is yours to make.
          </p>
          <ul className="mt-8 space-y-3">
            {['Works 24/7, including nights and weekends', 'Uses your own WhatsApp, email and social accounts', 'Plans from ₹399 a month, every AI employee included'].map((t) => (
              <li key={t} className="flex gap-3 text-[16px]"><Check className="mt-1 h-4 w-4 shrink-0 text-nb-acc" />{t}</li>
            ))}
          </ul>
        </div>
      </section>
      <ClosingCta />
    </div>
  );
}
