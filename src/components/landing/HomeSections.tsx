// Homepage sections, modelled on the section order and visual language of
// leading AI-employee sites (see docs/SEO_PLAN.md, "Landing page anatomy").
// Copy lives in homeContent.ts.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Plus, Minus, Play, MessageCircle, MapPin, Mail, Globe, CalendarDays, Star, Code2 } from 'lucide-react';
import { AGENTS, JOBS, INTEGRATIONS, FAQ, DAY, INDUSTRIES, COMPARE, DEV_FEATURES, TEAM_NOTE, type Agent } from './homeContent';

const agent = (id: string) => AGENTS.find((a) => a.id === id) as Agent;

/* ───────── shared bits ───────── */

export function Label({ children }: { children: React.ReactNode }) {
  return <p className="font-label text-[12px] uppercase tracking-[0.18em] text-nb-acc">{children}</p>;
}

export function PrimaryCta({ children = 'Get started free' }: { children?: React.ReactNode }) {
  return (
    <Link
      to="/signup"
      className="group inline-flex items-center gap-2 rounded-full bg-nb-acc px-7 py-3.5 text-[15px] font-bold text-nb-on-acc transition-colors hover:bg-nb-acc-hover"
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function Avatar({ a, size = 48 }: { a: Agent; size?: number }) {
  return (
    <img
      src={a.avatar}
      alt={`${a.name}, NexBotix ${a.role} AI employee`}
      width={size}
      height={size}
      loading="lazy"
      className="rounded-[14px] object-cover ring-1 ring-white/10"
      style={{ width: size, height: size }}
    />
  );
}

/* ───────── 1. Hero ───────── */

const HERO_TASKS = [
  { id: 'whatsapp', text: 'Sent 248 personalised WhatsApp messages' },
  { id: 'leads', text: 'Found 37 dental clinics in Pune' },
  { id: 'chatbot', text: 'Answered a pricing question at 2:14 AM' },
  { id: 'email', text: 'Followed up with 12 leads who opened' },
  { id: 'calendar', text: 'Booked a demo for Thursday, 11:00' },
  { id: 'seo', text: 'Spotted a ranking drop on /pricing' },
];

export function HomeHero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % HERO_TASKS.length), 2600);
    return () => clearInterval(t);
  }, []);
  const task = HERO_TASKS[i];

  return (
    <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-nb-acc/20 blur-[140px]"
      />
      <div className="relative mx-auto max-w-6xl px-4 text-center sm:px-6">
        <h1 className="mx-auto max-w-5xl text-balance font-display text-[clamp(44px,6.5vw,92px)] font-black leading-[0.95] tracking-[-0.03em] text-nb-fg">
          AI employees for WhatsApp, email &amp; lead generation
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-nb-muted sm:text-xl">
          Get an AI team that sends your WhatsApp campaigns, finds new leads, replies to every chat and books
          meetings. Day and night, from $5 a month.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryCta />
          <Link to="/pricing" className="rounded-full border border-nb-line2 px-7 py-3.5 text-[15px] font-semibold text-nb-fg hover:bg-white/5">
            See pricing
          </Link>
        </div>
        <p className="mt-5 font-label text-[12px] text-nb-muted2">Free trial · No credit card · Connect WhatsApp with a QR scan</p>

        {/* team strip + live task */}
        <div className="mx-auto mt-16 max-w-4xl rounded-[24px] border border-nb-line bg-nb-surface/80 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {AGENTS.slice(0, 8).map((a) => (
              <div key={a.id} className={`transition-transform duration-500 ${a.id === task.id ? '-translate-y-1.5' : ''}`}>
                <Avatar a={a} size={56} />
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center gap-3 text-left" aria-live="polite">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-nb-acc opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-nb-acc" />
            </span>
            <p className="text-[15px] text-nb-fg">
              <span className="font-semibold">{agent(task.id).name}:</span> <span className="text-nb-muted">{task.text}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── 2. Channel strip ───────── */

export function ChannelStrip() {
  return (
    <section aria-label="Channels" className="border-y border-nb-line py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 font-label text-[13px] uppercase tracking-[0.14em] text-nb-muted2">
        <span>WhatsApp</span><span>Gmail</span><span>Google Maps</span><span>Facebook</span><span>LinkedIn</span><span>Google Calendar</span><span>Claude MCP</span>
      </div>
    </section>
  );
}

/* ───────── 3. Pain ───────── */

const CHORES = [
  'Reply to 40 WhatsApp chats', 'Chase last week’s leads', 'Post on Facebook', 'Find new clients',
  'Send the newsletter', 'Answer the website chat', 'Book the demo calls', 'Update LinkedIn',
];

export function StopJuggling() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        <p className="mx-auto max-w-3xl text-balance text-2xl text-nb-muted sm:text-3xl">
          You want to grow your business, but today you’re the marketer, the receptionist and the sales team.
        </p>
        <h2 className="mt-6 font-display text-[clamp(48px,8vw,120px)] font-black leading-none tracking-[-0.04em] text-nb-fg">
          Stop juggling.
        </h2>
        <ul className="mt-12 flex flex-wrap justify-center gap-3">
          {CHORES.map((c, n) => (
            <li
              key={c}
              className="rounded-full border border-nb-line2 bg-nb-dim px-4 py-2 text-[14px] text-nb-muted"
              style={{ transform: `rotate(${(n % 2 ? 1 : -1) * ((n % 3) + 1)}deg)` }}
            >
              {c}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────── 4. Meet the team ───────── */

export function MeetTheTeam() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <Label>Your AI team</Label>
          <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.03em] text-nb-fg sm:text-6xl">Meet your new AI team</h2>
          <p className="mt-4 text-lg text-nb-muted">AI employees run your WhatsApp, leads, email, website chat, socials and bookings.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a) => (
            <article key={a.id} className="group rounded-[20px] border border-nb-line bg-nb-surface p-6 transition-colors hover:border-nb-line2">
              <div className="flex items-center gap-4">
                <Avatar a={a} size={56} />
                <div>
                  <h3 className="font-display text-xl font-bold text-nb-fg">{a.name}</h3>
                  <p className="font-label text-[12px] uppercase tracking-[0.12em] text-nb-muted2">{a.role}</p>
                </div>
              </div>
              <p className="mt-5 text-[15px] leading-relaxed text-nb-muted">“{a.pitch}”</p>
            </article>
          ))}
        </div>
        <div className="mt-10"><PrimaryCta>Hire your AI team</PrimaryCta></div>
      </div>
    </section>
  );
}

/* ───────── 5. Growth is a system + how it works ───────── */

const TODAY = ['Leads wait hours for a reply', 'Campaigns go out when you find time', 'The website chat sits empty at night', 'Follow-ups get forgotten'];
const WITH_TEAM = ['Every chat answered in seconds', 'Campaigns sent on schedule', 'Visitors turned into leads 24/7', 'Every lead followed up'];
const STEPS = [
  { n: '01', title: 'Pick your AI employees', text: 'Start with one, like Nexa for WhatsApp, and add more as you grow.' },
  { n: '02', title: 'Connect your accounts', text: 'Scan a QR code for WhatsApp, link Gmail, Facebook or LinkedIn, paste the chat widget on your site.' },
  { n: '03', title: 'Set the goal', text: 'More replies, more leads, more bookings. Your team works toward it every day.' },
];

export function GrowthSystem() {
  return (
    <section id="how-it-works" className="scroll-mt-16 border-t border-nb-line py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl font-black tracking-[-0.03em] text-nb-fg sm:text-6xl">Growth is a system.</h2>
          <p className="mt-4 text-lg text-nb-muted">
            Every reply, every follow-up, every booked call adds up. Your AI team shows up every day, so it never stops.
          </p>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-nb-line bg-nb-dim p-8">
            <p className="font-label text-[12px] uppercase tracking-[0.18em] text-nb-muted2">Today</p>
            <ul className="mt-6 space-y-4">
              {TODAY.map((t) => (
                <li key={t} className="flex gap-3 text-nb-muted"><Minus className="mt-1 h-4 w-4 shrink-0 text-nb-muted2" />{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[24px] border border-nb-acc/40 bg-nb-acc/[0.07] p-8">
            <p className="font-label text-[12px] uppercase tracking-[0.18em] text-nb-acc">With an AI team</p>
            <ul className="mt-6 space-y-4">
              {WITH_TEAM.map((t) => (
                <li key={t} className="flex gap-3 text-nb-fg"><Check className="mt-1 h-4 w-4 shrink-0 text-nb-acc" />{t}</li>
              ))}
            </ul>
          </div>
        </div>

        <h3 className="mt-24 text-center font-display text-3xl font-black tracking-[-0.02em] text-nb-fg sm:text-5xl">Set the goal. They own it.</h3>
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-[20px] border border-nb-line bg-nb-surface p-7">
              <span className="font-label text-[13px] text-nb-acc">{s.n}</span>
              <h4 className="mt-3 font-display text-xl font-bold text-nb-fg">{s.title}</h4>
              <p className="mt-2 text-[15px] leading-relaxed text-nb-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────── 6. What they do (job blocks) ───────── */

function JobMock({ id }: { id: string }) {
  const card = 'rounded-[18px] border border-nb-line bg-nb-bg p-5';
  if (id === 'whatsapp') {
    return (
      <div className={card}>
        <div className="flex items-center gap-2 text-[13px] text-nb-muted"><MessageCircle className="h-4 w-4 text-nb-acc" /> Diwali offer · 1,240 contacts</div>
        <div className="mt-4 space-y-2.5 text-[14px]">
          <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-[#1f6f43] px-3.5 py-2 text-white">Hi Priya, our Diwali offer is live: 20% off all plans until Sunday 🎉</p>
          <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-nb-dim px-3.5 py-2 text-nb-fg">Does it include the yearly plan?</p>
          <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-[#1f6f43] px-3.5 py-2 text-white">Yes! The yearly plan is 20% off too. Want me to send the link?</p>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-nb-dim"><div className="h-full w-3/4 rounded-full bg-nb-acc" /></div>
        <p className="mt-2 font-label text-[11px] text-nb-muted2">930 / 1,240 sent · auto-replies on</p>
      </div>
    );
  }
  if (id === 'leads') {
    const rows = [['Smile Dental Care', 'Koregaon Park', '4.8'], ['City Dental Studio', 'Baner', '4.6'], ['Bright Teeth Clinic', 'Kothrud', '4.7'], ['Pune Family Dentist', 'Aundh', '4.5']];
    return (
      <div className={card}>
        <div className="flex items-center gap-2 text-[13px] text-nb-muted"><MapPin className="h-4 w-4 text-nb-acc" /> “dentist” in Pune · 37 found</div>
        <ul className="mt-4 divide-y divide-nb-line text-[14px]">
          {rows.map(([n, area, r]) => (
            <li key={n} className="flex items-center justify-between py-2.5">
              <span><span className="text-nb-fg">{n}</span> <span className="text-nb-muted2">· {area}</span></span>
              <span className="flex items-center gap-1 text-nb-muted"><Star className="h-3.5 w-3.5 fill-current text-amber-400" />{r}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (id === 'email') {
    return (
      <div className={card}>
        <div className="flex items-center gap-2 text-[13px] text-nb-muted"><Mail className="h-4 w-4 text-nb-acc" /> October newsletter</div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[['2,400', 'sent'], ['41%', 'opened'], ['126', 'clicked']].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-nb-dim py-3"><p className="font-display text-2xl font-black text-nb-fg">{v}</p><p className="font-label text-[11px] text-nb-muted2">{l}</p></div>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-nb-muted">Follow-up queued for 980 people who didn’t open.</p>
      </div>
    );
  }
  if (id === 'chatbot') {
    return (
      <div className={card}>
        <div className="flex items-center gap-2 text-[13px] text-nb-muted"><Globe className="h-4 w-4 text-nb-acc" /> yourbusiness.com · 11:52 PM</div>
        <div className="mt-4 space-y-2.5 text-[14px]">
          <p className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-nb-dim px-3.5 py-2 text-nb-fg">Do you deliver to Andheri?</p>
          <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-nb-acc px-3.5 py-2 text-nb-on-acc">Yes, free delivery in Andheri on orders over ₹999. Can I get your number to confirm a slot?</p>
        </div>
        <p className="mt-4 rounded-lg bg-nb-acc/10 px-3 py-2 font-label text-[11px] text-nb-acc">New lead captured · +91 98••• ••210</p>
      </div>
    );
  }
  if (id === 'social') {
    return (
      <div className={card}>
        <p className="text-[13px] text-nb-muted">This week’s posts</p>
        <ul className="mt-4 space-y-2.5 text-[14px]">
          {[['Mon', 'Facebook', '5 tips to keep customers coming back'], ['Wed', 'LinkedIn', 'What we learned from 1,000 WhatsApp campaigns'], ['Fri', 'Blog', 'How to send bulk WhatsApp without getting banned']].map(([d, ch, t]) => (
            <li key={d} className="flex items-start gap-3 rounded-xl bg-nb-dim px-3.5 py-2.5">
              <span className="font-label text-[11px] text-nb-muted2">{d}</span>
              <span><span className="font-label text-[11px] uppercase text-nb-acc">{ch}</span><br /><span className="text-nb-fg">{t}</span></span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className={card}>
      <div className="flex items-center gap-2 text-[13px] text-nb-muted"><CalendarDays className="h-4 w-4 text-nb-acc" /> Upcoming</div>
      <ul className="mt-4 space-y-2.5 text-[14px]">
        {[['Thu · 11:00 AM', 'Product demo', '30 min'], ['Fri · 4:30 PM', 'Onboarding call', '45 min']].map(([w, t, d]) => (
          <li key={w} className="flex items-center justify-between rounded-xl bg-nb-dim px-3.5 py-3">
            <span><span className="text-nb-fg">{t}</span><br /><span className="font-label text-[11px] text-nb-muted2">{w} · Google Meet</span></span>
            <span className="text-nb-muted">{d}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function JobsSection() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-nb-line py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <Label>What they do</Label>
          <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.03em] text-nb-fg sm:text-6xl">One team. Every channel.</h2>
          <p className="mt-4 text-lg text-nb-muted">Each AI employee owns one job, end to end, and works where your customers already are.</p>
        </div>
        <div className="mt-16 space-y-24">
          {JOBS.map((job, n) => (
            <article key={job.id} id={`job-${job.id}`} className="grid scroll-mt-20 items-center gap-10 md:grid-cols-2">
              <div className={n % 2 ? 'md:order-2' : ''}>
                <div className="flex items-center gap-3">
                  {job.agentIds.map((id) => <Avatar key={id} a={agent(id)} size={40} />)}
                  <span className="font-label text-[12px] uppercase tracking-[0.14em] text-nb-muted2">
                    {job.agentIds.map((id) => agent(id).name).join(' · ')}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-3xl font-black tracking-[-0.02em] text-nb-fg sm:text-4xl">{job.title}</h3>
                <p className="mt-3 text-lg text-nb-muted">{job.lead}</p>
                <ul className="mt-6 space-y-4">
                  {job.points.map((p) => (
                    <li key={p.title} className="flex gap-3">
                      <Plus className="mt-1 h-4 w-4 shrink-0 text-nb-acc" />
                      <span><span className="font-semibold text-nb-fg">{p.title}.</span> <span className="text-nb-muted">{p.text}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={n % 2 ? 'md:order-1' : ''}><JobMock id={job.id} /></div>
            </article>
          ))}
        </div>
        <div className="mt-20 text-center"><PrimaryCta /></div>
      </div>
    </section>
  );
}

/* ───────── 7. Demo video ───────── */

export function DemoVideo() {
  const [playing, setPlaying] = useState(false);
  return (
    <section className="border-t border-nb-line py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
        <h2 className="font-display text-4xl font-black tracking-[-0.03em] text-nb-fg sm:text-6xl">Watch your AI team work</h2>
        <p className="mt-4 text-lg text-nb-muted">See a WhatsApp campaign go from contact list to sent messages.</p>
        <div className="relative mt-12 overflow-hidden rounded-[24px] border border-nb-line bg-nb-surface">
          {playing ? (
            <video className="aspect-video w-full" controls autoPlay playsInline poster="/demo-video-poster.webp">
              <source src="/demo-video.webm" type="video/webm" />
              <source src="/demo-video.mp4" type="video/mp4" />
            </video>
          ) : (
            <button type="button" onClick={() => setPlaying(true)} className="group relative block w-full" aria-label="Play the NexBotix demo video">
              <img src="/demo-video-poster.webp" alt="NexBotix dashboard sending a WhatsApp campaign" width={1280} height={720} loading="lazy" className="aspect-video w-full object-cover opacity-80" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-nb-acc text-nb-on-acc shadow-2xl transition-transform group-hover:scale-105">
                  <Play className="ml-1 h-8 w-8 fill-current" />
                </span>
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/* ───────── 8. Proof (facts, not invented metrics) ───────── */

const FACTS = [
  ['24/7', 'Nights and weekends included'],
  ['9', 'AI employees, one workspace'],
  ['$5', 'Per month to start'],
  ['API + MCP', 'Plug into your code and AI tools'],
];

export function FactsSection() {
  return (
    <section className="border-t border-nb-line py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-3xl font-display text-4xl font-black tracking-[-0.03em] text-nb-fg sm:text-6xl">Built for real work, not demos.</h2>
        <dl className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map(([v, l]) => (
            <div key={l} className="rounded-[20px] border border-nb-line bg-nb-surface p-7">
              <dt className="font-label text-[12px] uppercase tracking-[0.14em] text-nb-muted2">{l}</dt>
              <dd className="mt-3 font-display text-5xl font-black tracking-[-0.03em] text-nb-fg">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ───────── 9. Integrations ───────── */

export function IntegrationsSection() {
  const row = [...INTEGRATIONS, ...INTEGRATIONS];
  return (
    <section className="overflow-hidden border-t border-nb-line py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-display text-4xl font-black tracking-[-0.03em] text-nb-fg sm:text-6xl">Works with the tools you already use</h2>
        <p className="mt-4 text-lg text-nb-muted">No new software to learn. Your AI employees log into your WhatsApp, inbox, socials and website, and work where you work.</p>
      </div>
      <div className="relative mt-14 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <ul className="flex w-max animate-marquee gap-3 motion-reduce:animate-none">
          {row.map((name, n) => (
            <li key={`${name}-${n}`} aria-hidden={n >= INTEGRATIONS.length} className="whitespace-nowrap rounded-full border border-nb-line2 bg-nb-surface px-5 py-2.5 text-[15px] text-nb-fg">
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────── 12. FAQ ───────── */

export function FaqSection({ items = FAQ, title = 'Questions?' }: { items?: { q: string; a: string }[]; title?: string }) {
  return (
    <section className="border-t border-nb-line py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center font-display text-4xl font-black tracking-[-0.03em] text-nb-fg sm:text-6xl">{title}</h2>
        <div className="mt-12 divide-y divide-nb-line border-y border-nb-line">
          {items.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left text-lg font-semibold text-nb-fg [&::-webkit-details-marker]:hidden">
                <h3>{f.q}</h3>
                <Plus className="h-5 w-5 shrink-0 text-nb-muted transition-transform group-open:rotate-45" />
              </summary>
              <p className="mt-3 text-[16px] leading-relaxed text-nb-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── 13. Closing CTA ───────── */

export function ClosingCta() {
  return (
    <section className="relative overflow-hidden border-t border-nb-line py-28 sm:py-36">
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 h-[380px] w-[800px] -translate-x-1/2 rounded-full bg-nb-acc/20 blur-[140px]" />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="text-balance font-display text-[clamp(40px,6vw,80px)] font-black leading-[0.98] tracking-[-0.03em] text-nb-fg">
          Your next customer just messaged you. Who’s replying?
        </h2>
        <div className="mt-10"><PrimaryCta>Hire your AI team</PrimaryCta></div>
      </div>
    </section>
  );
}

/* ───────── A day with your AI team ───────── */

export function DayWithTeam() {
  return (
    <section className="border-t border-nb-line py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Label>An example day</Label>
        <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.03em] text-nb-fg sm:text-6xl">A Tuesday with your AI team</h2>
        <p className="mt-4 text-lg text-nb-muted">
          You run the business. They handle the messages, the lists and the follow-ups in between. Here is what a normal day can look like.
        </p>
        <ol className="relative mt-12 space-y-8 border-l border-nb-line2 pl-8">
          {DAY.map((d) => {
            const a = agent(d.agentId);
            return (
              <li key={d.time} className="relative">
                <span className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-2 border-nb-bg bg-nb-acc" />
                <p className="font-label text-[12px] uppercase tracking-[0.14em] text-nb-muted2">{d.time} · {a.name}</p>
                <p className="mt-1.5 text-[17px] leading-relaxed text-nb-fg">{d.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ───────── Who it's for ───────── */

export function WhoItsFor() {
  return (
    <section className="border-t border-nb-line py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-3xl">
          <Label>Who it’s for</Label>
          <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.03em] text-nb-fg sm:text-6xl">Built for businesses that live on WhatsApp</h2>
          <p className="mt-4 text-lg text-nb-muted">If your customers message you, you’re who we built this for.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((i) => (
            <article key={i.name} className="rounded-[20px] border border-nb-line bg-nb-surface p-7">
              <h3 className="font-display text-xl font-bold text-nb-fg">{i.name}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-nb-muted">{i.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Compare ───────── */

export function CompareSection() {
  return (
    <section className="border-t border-nb-line py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="max-w-3xl font-display text-4xl font-black tracking-[-0.03em] text-nb-fg sm:text-6xl">AI employee, new hire or agency?</h2>
        <p className="mt-4 max-w-3xl text-lg text-nb-muted">
          People are still best at the relationships. An AI employee takes the repetitive part, the sending, replying and chasing, so you and your team don’t have to.
        </p>
        <div className="mt-12 overflow-x-auto rounded-[20px] border border-nb-line">
          <table className="w-full min-w-[640px] text-left text-[15px]">
            <thead className="bg-nb-surface font-label text-[12px] uppercase tracking-[0.12em] text-nb-muted2">
              <tr>
                <th scope="col" className="px-5 py-4 font-medium"> </th>
                <th scope="col" className="px-5 py-4 font-medium">New hire</th>
                <th scope="col" className="px-5 py-4 font-medium">Agency</th>
                <th scope="col" className="px-5 py-4 font-medium text-nb-acc">NexBotix AI employee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nb-line">
              {COMPARE.map((c) => (
                <tr key={c.row}>
                  <th scope="row" className="px-5 py-4 font-semibold text-nb-fg">{c.row}</th>
                  <td className="px-5 py-4 text-nb-muted">{c.hire}</td>
                  <td className="px-5 py-4 text-nb-muted">{c.agency}</td>
                  <td className="px-5 py-4 text-nb-fg">{c.nexbotix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ───────── Developers ───────── */

export function DevelopersSection() {
  return (
    <section className="border-t border-nb-line py-24 sm:py-32">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <Label>For developers</Label>
          <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.03em] text-nb-fg sm:text-5xl">Build on top of your AI team</h2>
          <p className="mt-4 text-lg text-nb-muted">
            Everything the AI employees do is available to your own code and AI agents.
          </p>
          <Link to="/docs" className="mt-8 inline-flex items-center gap-2 text-[15px] font-semibold text-nb-acc hover:underline">
            Read the API docs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {DEV_FEATURES.map((f) => (
            <article key={f.title} className="rounded-[20px] border border-nb-line bg-nb-surface p-6">
              <Code2 className="h-5 w-5 text-nb-acc" />
              <h3 className="mt-4 font-display text-lg font-bold text-nb-fg">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-nb-muted">{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Team note ───────── */

export function TeamNote() {
  return (
    <section className="border-t border-nb-line py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-black tracking-[-0.02em] text-nb-fg sm:text-5xl">{TEAM_NOTE.heading}</h2>
        <div className="mt-8 space-y-5 text-[18px] leading-relaxed text-nb-muted">
          {TEAM_NOTE.paragraphs.map((t) => <p key={t}>{t}</p>)}
        </div>
        <p className="mt-8 font-label text-[13px] text-nb-fg">— {TEAM_NOTE.signoff} · <Link to="/about" className="text-nb-acc hover:underline">About us</Link></p>
      </div>
    </section>
  );
}

/* ───────── Pricing page parts ───────── */

const INCLUDED = [
  'Your pick of AI employee: WhatsApp, leads, email, website chat, social, SEO or booking',
  'Personalised bulk campaigns from Excel or CSV',
  'AI auto-replies on WhatsApp and your website',
  'Visual drag-and-drop flow studio',
  'REST API and MCP server for developers',
  'Free trial with 10 messages before you pay',
];

export function PricingHero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-4 sm:pt-24">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[800px] -translate-x-1/2 rounded-full bg-nb-acc/15 blur-[140px]" />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <Label>Pricing</Label>
        <h1 className="mt-4 text-balance font-display text-[clamp(40px,6vw,80px)] font-black leading-[0.98] tracking-[-0.03em] text-nb-fg">
          Hire AI employees from $5 a month
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-nb-muted">
          Pay per AI employee, not per seat or per message. Start with a free trial, no credit card, and add employees only when they earn their keep.
        </p>
      </div>
    </section>
  );
}

export function PricingIncluded() {
  return (
    <section className="border-t border-nb-line py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-black tracking-[-0.02em] text-nb-fg sm:text-4xl">Every plan includes</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {INCLUDED.map((t) => (
            <li key={t} className="flex gap-3 rounded-[16px] border border-nb-line bg-nb-surface p-5 text-[15px] text-nb-fg">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-nb-acc" />{t}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-[15px] text-nb-muted">
          Need more than three AI employees, or running outreach for clients?{' '}
          <Link to="/contact" className="text-nb-acc hover:underline">Talk to us</Link> about a larger plan. Refunds follow our{' '}
          <Link to="/refund" className="text-nb-acc hover:underline">refund policy</Link>.
        </p>
      </div>
    </section>
  );
}
