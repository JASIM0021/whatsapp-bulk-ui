import type { MetadataRoute } from 'next';
import { BLOG_POSTS } from '@/data/blogPosts';
import { PUBLIC_PAGES, SITE_URL, blogPostPath } from '@/seo/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = Object.entries(PUBLIC_PAGES).map(([path, page]) => ({
    url: `${SITE_URL}${path === '/' ? '/' : path}`,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
  const posts = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}${blogPostPath(post)}`,
    lastModified: post.publishedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  return [...pages, ...posts];
}
