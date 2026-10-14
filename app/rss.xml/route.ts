import { BLOG_AUTHOR, BLOG_POSTS } from '@/data/blogPosts';
import { SITE_URL, blogPostPath } from '@/seo/site';

export const dynamic = 'force-static';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// RSS 2.0 feed generated from content/blog (replaces the old static public/rss.xml).
export function GET() {
  const items = BLOG_POSTS.map((p) => {
    const url = `${SITE_URL}${blogPostPath(p)}`;
    return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(p.excerpt)}</description>
      <category>${esc(p.category)}</category>
      <pubDate>${new Date(`${p.publishedAt}T09:00:00Z`).toUTCString()}</pubDate>
      <dc:creator>${esc(BLOG_AUTHOR.name)}</dc:creator>
    </item>`;
  }).join('\n');
  const latest = BLOG_POSTS.reduce((d, p) => (p.updatedAt > d ? p.updatedAt : d), '');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>NexBotix Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Guides to WhatsApp automation, AI agents, MCP and SEO from the NexBotix team.</description>
    <language>en</language>
    <lastBuildDate>${new Date(`${latest}T09:00:00Z`).toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
