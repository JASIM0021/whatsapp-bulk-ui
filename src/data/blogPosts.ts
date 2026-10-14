// Blog types and helpers. Posts live in content/blog/*.md and are compiled by
// scripts/build-blog.mjs into blogPosts.generated.ts.

export type BlogCategory = 'WhatsApp Automation' | 'AI Agents & MCP' | 'AI SEO & Content' | 'Marketing & Growth' | 'Developer Guides';

export interface BlogPost {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  content: string; // HTML
  toc: { id: string; text: string }[];
  tldr: string[];
  faq: { q: string; a: string }[];
  publishedAt: string; // YYYY-MM-DD
  updatedAt: string;
  readTime: string;
  wordCount: number;
  category: BlogCategory;
  hub: string | null; // /ai-agents/:hub to promote
  tags: string[];
  image: string;
  imageAlt: string;
  featured: boolean;
}

// Posts are written by the team; no individual bylines (by choice).
export const BLOG_AUTHOR = {
  name: 'The NexBotix Team',
  role: 'Builders of NexBotix AI employees',
  avatar: '/icon-192.png',
  url: '/about',
};

export const BLOG_CATEGORIES: { name: BlogCategory; slug: string; hub: string | null; intro: string }[] = [
  { name: 'WhatsApp Automation', slug: 'whatsapp-automation', hub: 'whatsapp', intro: 'Guides to WhatsApp bulk messaging, auto-replies and the WhatsApp Business API, written for small businesses that sell and support on WhatsApp.' },
  { name: 'AI Agents & MCP', slug: 'ai-agents-mcp', hub: null, intro: 'How AI agents and the Model Context Protocol (MCP) connect tools like Claude and Cursor to real business channels such as WhatsApp and email.' },
  { name: 'AI SEO & Content', slug: 'ai-seo', hub: 'seo', intro: 'Practical SEO for small business websites: Core Web Vitals, technical fixes, what AI can automate, and how to publish content people actually search for.' },
  { name: 'Marketing & Growth', slug: 'marketing-growth', hub: 'website-chatbot', intro: 'Turning website visitors, chats and campaigns into customers: lead capture, follow-up and AI customer support, with AI employees doing the repetitive work.' },
  { name: 'Developer Guides', slug: 'developer-guides', hub: null, intro: 'Step-by-step developer guides for the NexBotix REST API, webhooks and MCP server: sending WhatsApp and email from code, OTPs and bot monitoring.' },
];

export const categorySlug = (name: BlogCategory) => BLOG_CATEGORIES.find((c) => c.name === name)?.slug ?? 'blog';

export { BLOG_POSTS } from './blogPosts.generated';
