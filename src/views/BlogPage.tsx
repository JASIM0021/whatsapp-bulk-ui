import { usePageSEO, useSEO } from '@/hooks/useSEO';
import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { BLOG_CATEGORIES, BLOG_POSTS, categorySlug, type BlogPost } from '../data/blogPosts';
import { SITE_URL } from '@/seo/site';
import { Label } from '@/components/landing/HomeSections';

const fmt = (d: string) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link to={`/blog/${post.slug}`} className="group flex flex-col overflow-hidden rounded-[20px] border border-nb-line bg-nb-surface transition-colors hover:border-nb-line2">
      <img src={post.image} alt={post.imageAlt} width={1200} height={630} loading="lazy" className="aspect-[1200/630] w-full object-cover opacity-90" />
      <div className="flex flex-1 flex-col p-6">
        <p className="font-label text-[11px] uppercase tracking-[0.14em] text-nb-acc">{post.category}</p>
        <h3 className="mt-3 font-display text-xl font-bold leading-snug">{post.title}</h3>
        <p className="mt-3 flex-1 text-[14px] leading-relaxed text-nb-muted">{post.excerpt}</p>
        <p className="mt-5 text-[13px] text-nb-muted2">{fmt(post.updatedAt)} · {post.readTime}</p>
      </div>
    </Link>
  );
}

function CategoryNav({ active }: { active?: string }) {
  return (
    <nav aria-label="Blog categories" className="flex flex-wrap justify-center gap-2">
      <Link to="/blog" className={`rounded-full border px-4 py-2 text-[14px] ${!active ? 'border-nb-acc bg-nb-acc/10 text-nb-fg' : 'border-nb-line2 text-nb-muted hover:text-nb-fg'}`}>All</Link>
      {BLOG_CATEGORIES.filter((c) => BLOG_POSTS.some((p) => p.category === c.name)).map((c) => (
        <Link key={c.slug} to={`/blog/category/${c.slug}`} className={`rounded-full border px-4 py-2 text-[14px] ${active === c.slug ? 'border-nb-acc bg-nb-acc/10 text-nb-fg' : 'border-nb-line2 text-nb-muted hover:text-nb-fg'}`}>
          {c.name}
        </Link>
      ))}
    </nav>
  );
}

// /blog — all posts, featured first.
export default function BlogPage() {
  usePageSEO('/blog');
  const featured = BLOG_POSTS.find((p) => p.featured) ?? BLOG_POSTS[0];
  const rest = BLOG_POSTS.filter((p) => p !== featured);

  return (
    <div className="bg-nb-bg font-sans text-nb-fg">
      <section className="relative overflow-hidden pt-16 pb-12 sm:pt-24">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[800px] -translate-x-1/2 rounded-full bg-nb-acc/15 blur-[140px]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Label>Blog</Label>
          <h1 className="mt-4 text-balance font-display text-[clamp(40px,6vw,80px)] font-black leading-[0.98] tracking-[-0.03em]">
            Guides to WhatsApp automation, AI agents and growth
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-nb-muted">
            Practical, tested advice from the team building NexBotix: bulk WhatsApp without bans, AI bots customers like, MCP for developers and SEO for small sites.
          </p>
          <div className="mt-10"><CategoryNav /></div>
        </div>
      </section>

      {featured && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          <Link to={`/blog/${featured.slug}`} className="group grid overflow-hidden rounded-[24px] border border-nb-line bg-nb-surface transition-colors hover:border-nb-line2 md:grid-cols-2">
            <img src={featured.image} alt={featured.imageAlt} width={1200} height={630} className="h-full w-full object-cover" />
            <div className="flex flex-col justify-center p-8 sm:p-10">
              <p className="font-label text-[11px] uppercase tracking-[0.14em] text-nb-acc">Featured · {featured.category}</p>
              <h2 className="mt-4 font-display text-3xl font-black leading-tight tracking-[-0.02em]">{featured.title}</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-nb-muted">{featured.excerpt}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-[15px] font-semibold text-nb-acc">Read the guide <ArrowRight className="h-4 w-4" /></span>
            </div>
          </Link>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="sr-only">All articles</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => <PostCard key={p.slug} post={p} />)}
        </div>
      </section>
    </div>
  );
}

// /blog/category/:category — posts in one category, linked to its AI employee hub.
export function BlogCategoryPage() {
  const { category = '' } = useParams<{ category: string }>();
  const cat = BLOG_CATEGORIES.find((c) => c.slug === category);
  useSEO({
    title: cat ? `${cat.name} Guides & Articles | NexBotix Blog` : 'NexBotix Blog',
    description: cat?.intro ?? '',
    url: `${SITE_URL}/blog/category/${category}`,
  });
  useEffect(() => window.scrollTo(0, 0), [category]);
  if (!cat) return <Navigate to="/blog" replace />;
  const posts = BLOG_POSTS.filter((p) => categorySlug(p.category) === cat.slug);

  return (
    <div className="bg-nb-bg font-sans text-nb-fg">
      <section className="pt-8 pb-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="font-label text-[12px] text-nb-muted2">
            <Link to="/" className="hover:text-nb-fg">Home</Link> <span aria-hidden>/</span>{' '}
            <Link to="/blog" className="hover:text-nb-fg">Blog</Link> <span aria-hidden>/</span> <span className="text-nb-muted">{cat.name}</span>
          </nav>
          <div className="mt-12 text-center">
            <Label>Blog category</Label>
            <h1 className="mt-4 font-display text-[clamp(38px,5.5vw,72px)] font-black leading-[0.98] tracking-[-0.03em]">{cat.name}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-nb-muted">{cat.intro}</p>
            {cat.hub && (
              <Link to={`/ai-agents/${cat.hub}`} className="mt-6 inline-flex items-center gap-1 text-[15px] font-semibold text-nb-acc hover:underline">
                See the AI employee for this <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
          <div className="mt-10"><CategoryNav active={cat.slug} /></div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <h2 className="sr-only">{cat.name} articles</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => <PostCard key={p.slug} post={p} />)}
        </div>
      </section>
    </div>
  );
}
