import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SpaApp from '@/SpaApp';
import ClientOnlySpa from './ClientOnlySpa';
import { APP_SEGMENTS, PUBLIC_PAGES, findBlogPost, indexablePaths, type PageSeo } from '@/seo/site';
import { JsonLd, blogPostingJsonLd, softwareApplicationJsonLd } from '@/seo/jsonld';

type Props = { params: Promise<{ slug?: string[] }> };

// Public pages are prerendered at build time; app routes and dynamic links
// (/book/:user/:slug, /studio/:id, …) render on first request.
export const dynamicParams = true;

export function generateStaticParams() {
  return indexablePaths().map((path) => ({ slug: path === '/' ? [] : path.slice(1).split('/') }));
}

function resolve(slug: string[] | undefined) {
  const path = `/${(slug ?? []).map(decodeURIComponent).join('/')}`;
  const page: PageSeo | undefined = PUBLIC_PAGES[path as keyof typeof PUBLIC_PAGES];
  if (page) return { kind: 'page' as const, path, page };
  const post = findBlogPost(path);
  if (post) return { kind: 'post' as const, path, post };
  if (slug?.length && APP_SEGMENTS.has(slug[0])) return { kind: 'app' as const, path };
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const route = resolve((await params).slug);
  if (!route) return {};

  if (route.kind === 'page') {
    const { title, description, keywords } = route.page;
    return {
      title,
      description,
      keywords,
      alternates: { canonical: route.path },
      openGraph: { title, description, url: route.path },
      twitter: { title, description },
    };
  }

  if (route.kind === 'post') {
    const { post } = route;
    const title = post.metaTitle || `${post.title} | NexBotix Blog`;
    return {
      title,
      description: post.metaDescription,
      keywords: post.tags,
      authors: [{ name: post.author.name }],
      alternates: { canonical: route.path },
      openGraph: {
        type: 'article',
        title,
        description: post.metaDescription,
        url: route.path,
        images: [post.image],
        publishedTime: post.publishedAt,
        authors: [post.author.name],
        section: post.category,
        tags: post.tags,
      },
      twitter: { title, description: post.metaDescription, images: [post.image] },
    };
  }

  return { title: 'NexBotix', robots: { index: false, follow: false } };
}

export default async function Page({ params }: Props) {
  const route = resolve((await params).slug);
  if (!route) notFound();

  if (route.kind === 'app') return <ClientOnlySpa />;

  return (
    <>
      <SpaApp location={route.path} />
      {route.path === '/' && <JsonLd data={softwareApplicationJsonLd} />}
      {route.kind === 'post' && <JsonLd data={blogPostingJsonLd(route.post)} />}
    </>
  );
}
