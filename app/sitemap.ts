import type { MetadataRoute } from 'next';
import { BLOG_POSTS } from '@/data/blogPosts';
import { PUBLIC_PAGES, SITE_URL, activeCategories, blogPostPath } from '@/seo/site';
import { HUBS, hubPath } from '@/components/landing/hubContent';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = Object.entries(PUBLIC_PAGES).map(([path, page]) => ({
    url: `${SITE_URL}${path === '/' ? '/' : path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
  const hubs = HUBS.map((hub) => ({
    url: `${SITE_URL}${hubPath(hub)}`,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));
  const categories = activeCategories().map((c) => ({
    url: `${SITE_URL}/blog/category/${c.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));
  const posts = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}${blogPostPath(post)}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  return [...pages, ...hubs, ...categories, ...posts];
}
