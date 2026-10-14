import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, Share2 } from 'lucide-react';
import { BLOG_AUTHOR, BLOG_POSTS, categorySlug } from '../data/blogPosts';
import { AGENTS } from '@/components/landing/homeContent';
import { findHubBySlug } from '@/components/landing/hubContent';
import { Avatar, FaqSection, Label, PrimaryCta } from '@/components/landing/HomeSections';

const fmt = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

// Post template (docs/SEO_PLAN.md, Phase 4): breadcrumb → H1 → byline with
// dates → TL;DR → TOC → article → FAQ → hub CTA → related posts.
export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = useMemo(() => BLOG_POSTS.find((p) => p.slug === slug), [slug]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (post) document.title = post.metaTitle;
  }, [post]);

  const related = useMemo(() => {
    if (!post) return [];
    const same = BLOG_POSTS.filter((p) => p.slug !== post.slug && p.category === post.category);
    const rest = BLOG_POSTS.filter((p) => p.slug !== post.slug && p.category !== post.category && p.hub === post.hub);
    return [...same, ...rest].slice(0, 3);
  }, [post]);

  if (!post) return <Navigate to="/blog" replace />;

  const hub = post.hub ? findHubBySlug(post.hub) : undefined;
  const hubAgents = hub ? hub.agentIds.map((id) => AGENTS.find((a) => a.id === id)!).filter(Boolean) : [];

  const share = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-nb-bg font-sans text-nb-fg">
      <article>
        <header className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
          <nav aria-label="Breadcrumb" className="font-label text-[12px] text-nb-muted2">
            <Link to="/" className="hover:text-nb-fg">Home</Link> <span aria-hidden>/</span>{' '}
            <Link to="/blog" className="hover:text-nb-fg">Blog</Link> <span aria-hidden>/</span>{' '}
            <Link to={`/blog/category/${categorySlug(post.category)}`} className="hover:text-nb-fg">{post.category}</Link>
          </nav>
          <p className="mt-10"><Label>{post.category}</Label></p>
          <h1 className="mt-4 text-balance font-display text-[clamp(34px,4.6vw,60px)] font-black leading-[1.02] tracking-[-0.03em]">
            {post.title}
          </h1>
          <p className="mt-5 text-lg text-nb-muted sm:text-xl">{post.excerpt}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-nb-line py-4 text-[14px] text-nb-muted">
            <Link to={BLOG_AUTHOR.url} className="flex items-center gap-3 hover:text-nb-fg">
              <img src={BLOG_AUTHOR.avatar} alt="" width={36} height={36} className="h-9 w-9 rounded-full" />
              <span><span className="block font-semibold text-nb-fg">{BLOG_AUTHOR.name}</span>{BLOG_AUTHOR.role}</span>
            </Link>
            <span>Published <time dateTime={post.publishedAt}>{fmt(post.publishedAt)}</time></span>
            {post.updatedAt !== post.publishedAt && <span>Updated <time dateTime={post.updatedAt}>{fmt(post.updatedAt)}</time></span>}
            <span>{post.readTime}</span>
            <button type="button" onClick={share} className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-nb-line2 px-3 py-1.5 text-nb-fg hover:bg-white/5">
              {copied ? <Check className="h-4 w-4 text-nb-acc" /> : <Share2 className="h-4 w-4" />}
              {copied ? 'Link copied' : 'Share'}
            </button>
          </div>
        </header>

        <div className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
          <img src={post.image} alt={post.imageAlt} width={1200} height={630} className="aspect-[1200/630] w-full rounded-[24px] border border-nb-line object-cover" />
        </div>

        <div className="mx-auto mt-12 grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_260px]">
          <div className="min-w-0">
            {/* TL;DR */}
            <section aria-label="Short version" className="rounded-[20px] border border-nb-acc/40 bg-nb-acc/[0.07] p-6 sm:p-7">
              <h2 className="font-label text-[12px] uppercase tracking-[0.18em] text-nb-acc">Short version</h2>
              <ul className="mt-4 space-y-3">
                {post.tldr.map((t) => (
                  <li key={t} className="flex gap-3 text-[16px] leading-relaxed"><Check className="mt-1 h-4 w-4 shrink-0 text-nb-acc" />{t}</li>
                ))}
              </ul>
            </section>

            {/* Mobile TOC */}
            {post.toc.length > 2 && (
              <details className="mt-8 rounded-[16px] border border-nb-line bg-nb-surface p-5 lg:hidden">
                <summary className="cursor-pointer font-label text-[12px] uppercase tracking-[0.14em] text-nb-muted2">In this article</summary>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px]">
                  {post.toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="text-nb-muted hover:text-nb-acc">{t.text}</a></li>)}
                </ol>
              </details>
            )}

            <div className="nb-prose mt-10" dangerouslySetInnerHTML={{ __html: post.content }} />

            {hub && (
              <aside className="mt-14 flex flex-col gap-5 rounded-[24px] border border-nb-line bg-nb-surface p-7 sm:flex-row sm:items-center">
                <div className="flex gap-2">{hubAgents.map((a) => <Avatar key={a.id} a={a} size={56} />)}</div>
                <div className="flex-1">
                  <p className="font-display text-xl font-bold">Let {hubAgents.map((a) => a.name).join(' & ')} do this for you</p>
                  <p className="mt-1 text-[15px] text-nb-muted">{hub.intro}</p>
                </div>
                <Link to={`/ai-agents/${hub.slug}`} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-nb-acc px-5 py-3 text-[14px] font-bold text-nb-on-acc hover:bg-nb-acc-hover">
                  Learn more <ArrowRight className="h-4 w-4" />
                </Link>
              </aside>
            )}
          </div>

          {/* Desktop TOC */}
          {post.toc.length > 2 && (
            <aside className="hidden lg:block">
              <nav aria-label="In this article" className="sticky top-24 rounded-[18px] border border-nb-line bg-nb-surface p-5">
                <p className="font-label text-[12px] uppercase tracking-[0.14em] text-nb-muted2">In this article</p>
                <ol className="mt-3 space-y-2 text-[14px] leading-snug">
                  {post.toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="text-nb-muted hover:text-nb-acc">{t.text}</a></li>)}
                </ol>
              </nav>
            </aside>
          )}
        </div>
      </article>

      {post.faq.length > 0 && <FaqSection items={post.faq} title="Questions" />}

      {related.length > 0 && (
        <section className="border-t border-nb-line py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-3xl font-black tracking-[-0.02em] sm:text-4xl">Keep reading</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {related.map((r) => (
                <Link key={r.slug} to={`/blog/${r.slug}`} className="group rounded-[20px] border border-nb-line bg-nb-surface p-6 transition-colors hover:border-nb-line2">
                  <p className="font-label text-[11px] uppercase tracking-[0.14em] text-nb-acc">{r.category}</p>
                  <h3 className="mt-3 font-display text-lg font-bold leading-snug">{r.title}</h3>
                  <p className="mt-3 text-[13px] text-nb-muted2">{r.readTime}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-nb-line py-20 text-center">
        <h2 className="mx-auto max-w-3xl px-4 font-display text-3xl font-black tracking-[-0.02em] sm:text-5xl">Every AI employee, from ₹399 a month</h2>
        <div className="mt-8"><PrimaryCta>Start your free trial</PrimaryCta></div>
      </section>
    </div>
  );
}
