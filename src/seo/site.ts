// Single source of truth for public-page SEO. Read on the server by
// app/[[...slug]]/page.tsx (metadata, sitemap) and in the browser by useSEO
// (so client-side navigation shows the same titles).
import { BLOG_POSTS, type BlogPost } from '../data/blogPosts';

export const SITE_URL = 'https://nexbotix.online';
export const SITE_NAME = 'NexBotix';
export const DEFAULT_OG_IMAGE = '/icon-512.png';

export interface PageSeo {
  title: string;
  description: string;
  keywords?: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
}

// Server-rendered, indexable pages. Every key must also be a route in SpaApp.
export const PUBLIC_PAGES = {
  '/': {
    title: 'AI Employees for WhatsApp, Email & Leads from $5/mo | NexBotix',
    description: 'Hire 24/7 AI employees for sales, support and operations from $5/month. Automate WhatsApp, email, lead generation and website chat with a visual agent studio.',
    keywords: 'ai employees, ai workforce, whatsapp ai agent, whatsapp bulk messaging, claude mcp, website chatbot, lead generation, nexbotix',
    changeFrequency: 'weekly',
    priority: 1,
  },
  '/pricing': {
    title: 'Pricing: AI Employees from $5/month | NexBotix',
    description: 'Per-agent pricing: Starter $5/mo for 1 AI employee and 1,000 agent calls, Growth $15/mo for 3, Scale $49/mo for 10. Save with yearly billing.',
    changeFrequency: 'monthly',
    priority: 0.9,
  },
  '/blog': {
    title: 'NexBotix Blog: WhatsApp Automation, AI Agents & MCP Guides',
    description: 'Guides on WhatsApp bulk messaging, AI agents, the Model Context Protocol, website chatbots and AI SEO from the NexBotix team.',
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  '/check-chatbot': {
    title: 'Free AI Chatbot Demo for Your Website | NexBotix',
    description: 'Enter your website URL and get a working AI chatbot demo trained on your business in seconds. No signup needed: try 3 websites free.',
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  '/docs': {
    title: 'API Docs: WhatsApp, Email, Chatbot & MCP API | NexBotix',
    description: 'REST API and MCP documentation for NexBotix WhatsApp messaging, website chatbot widgets, in-house AI integration, email and calendar booking.',
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  '/about': {
    title: 'About NexBotix: Simpler WhatsApp & AI Automation',
    description: 'NexBotix gives businesses a simpler, affordable way to reach customers on WhatsApp and automate sales and support with AI employees.',
    changeFrequency: 'monthly',
    priority: 0.6,
  },
  '/contact': {
    title: 'Contact NexBotix: Sales, Support & Feature Requests',
    description: 'Questions, feature requests or need help with NexBotix? Send us a message and the team replies within 24 hours.',
    changeFrequency: 'yearly',
    priority: 0.5,
  },
  '/privacy': {
    title: 'Privacy Policy - NexBotix',
    description: 'Learn how we collect, use, and protect your personal information when you use NexBotix.',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  '/terms': {
    title: 'Terms & Conditions - NexBotix',
    description: 'Read the terms and conditions for using NexBotix.',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  '/refund': {
    title: 'Refund Policy - NexBotix',
    description: 'Read the refund policy for NexBotix.',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  '/data-deletion': {
    title: 'Data Deletion Request - NexBotix',
    description: 'Request deletion of your personal data from NexBotix.',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
} satisfies Record<string, PageSeo>;

export type PublicPath = keyof typeof PUBLIC_PAGES;

export function blogPostPath(post: BlogPost) {
  return `/blog/${post.slug}`;
}

export function findBlogPost(path: string) {
  const match = /^\/blog\/([^/]+)$/.exec(path);
  return match ? BLOG_POSTS.find((p) => p.slug === match[1]) : undefined;
}

// Every path that is server-rendered and listed in the sitemap.
export function indexablePaths(): string[] {
  return [...Object.keys(PUBLIC_PAGES), ...BLOG_POSTS.map(blogPostPath)];
}

// First path segments that belong to the logged-in app (or to login/OAuth
// flows). These render client-only and are never indexed.
export const APP_SEGMENTS = new Set([
  'login', 'signup', 'setup', 'mcp-auth', 'payment', 'subscription', 'admin',
  'bot', 'security', 'sessions', 'email', 'leads', 'website-chatbot', 'app',
  'whatsapp', 'whatsapp-business', 'fb', 'facebook', 'linkedin', 'seo',
  'campaigns', 'influencer', 'developer', 'calendar', 'book', 'embed',
  'life-companion', 'trading', 'freelancer', 'youtube', 'agents', 'studio',
  'connectors', 'demo',
]);
