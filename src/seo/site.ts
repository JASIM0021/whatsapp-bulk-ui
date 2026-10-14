// Single source of truth for public-page SEO. Read on the server by
// app/[[...slug]]/page.tsx (metadata, sitemap) and in the browser by useSEO
// (so client-side navigation shows the same titles).
import { BLOG_CATEGORIES, BLOG_POSTS, categorySlug, type BlogPost } from '../data/blogPosts';
import { HUBS, findHubBySlug, hubPath } from '../components/landing/hubContent';

export const SITE_URL = 'https://nexbotix.online';
export const SITE_NAME = 'NexBotix';
export const DEFAULT_OG_IMAGE = '/og.png'; // 1200×630

export interface PageSeo {
  title: string;
  description: string;
  ogImage?: string; // 1200×630, defaults to DEFAULT_OG_IMAGE
  keywords?: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
}

// Server-rendered, indexable pages. Every key must also be a route in SpaApp.
export const PUBLIC_PAGES = {
  '/': {
    title: 'AI Employees for WhatsApp, Email & Leads from ₹399/mo | NexBotix',
    description: 'Hire 24/7 AI employees for sales, support and operations from ₹399/month. Automate WhatsApp, email, lead generation and website chat. Start free with 100 credits.',
    keywords: 'ai employees, ai workforce, whatsapp ai agent, whatsapp bulk messaging, claude mcp, website chatbot, lead generation, nexbotix',
    changeFrequency: 'weekly',
    priority: 1,
  },
  '/pricing': {
    ogImage: '/og/pricing.png',
    title: 'Pricing: Every AI Employee from ₹399/month | NexBotix',
    description: 'Credit plans with every AI employee included: Starter ₹399/mo for 2,500 credits, Growth ₹1,199 for 8,000, Pro ₹2,999 for 22,000. Free trial, 100 credits.',
    changeFrequency: 'monthly',
    priority: 0.9,
  },
  '/ai-agents': {
    ogImage: '/og/ai-agents.png',
    title: 'AI Employees for Small Business: WhatsApp, Leads & Email | NexBotix',
    description: 'Meet the NexBotix AI employees for WhatsApp marketing, lead generation, email outreach, website chat, social media, SEO and appointment booking.',
    changeFrequency: 'weekly',
    priority: 0.9,
  },
  '/blog': {
    ogImage: '/og/blog.png',
    title: 'NexBotix Blog: WhatsApp Automation, AI Agents & MCP Guides',
    description: 'Guides on WhatsApp bulk messaging, AI agents, the Model Context Protocol, website chatbots and AI SEO from the NexBotix team.',
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  '/check-chatbot': {
    ogImage: '/og/check-chatbot.png',
    title: 'Free AI Chatbot Demo for Your Website | NexBotix',
    description: 'Enter your website URL and get a working AI chatbot demo trained on your business in seconds. No signup needed: try 3 websites free.',
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  '/docs': {
    ogImage: '/og/docs.png',
    title: 'API Docs: WhatsApp, Email, Chatbot & MCP API | NexBotix',
    description: 'REST API and MCP documentation for NexBotix WhatsApp messaging, website chatbot widgets, in-house AI integration, email and calendar booking.',
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  '/about': {
    ogImage: '/og/about.png',
    title: 'About NexBotix: AI Employees for WhatsApp-First Businesses',
    description: 'Why we built NexBotix, the AI employees we offer for WhatsApp, email, leads and website chat, how we build them, and how we protect your data.',
    changeFrequency: 'monthly',
    priority: 0.6,
  },
  '/contact': {
    ogImage: '/og/contact.png',
    title: 'Contact NexBotix: Sales, Support & Feature Requests',
    description: 'Questions, feature requests or need help with NexBotix? Send us a message and the team replies within 24 hours.',
    changeFrequency: 'yearly',
    priority: 0.5,
  },
  '/privacy': {
    title: 'Privacy Policy - NexBotix',
    description: 'How NexBotix collects, uses, stores and protects your personal data, including connected WhatsApp, email and social accounts, and how to contact us.',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  '/terms': {
    title: 'Terms & Conditions - NexBotix',
    description: 'The terms and conditions for using NexBotix AI employees, WhatsApp and email messaging, subscriptions, acceptable use and account termination.',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  '/refund': {
    title: 'Refund Policy - NexBotix',
    description: 'When NexBotix subscriptions are eligible for a refund, how to request one, and how long refunds take to reach your original payment method.',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  '/data-deletion': {
    title: 'Data Deletion Request - NexBotix',
    description: 'Request deletion of your NexBotix account and personal data, including messages, contacts and connected accounts. Deletion is permanent and cannot be undone.',
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

// Category pages with at least one post.
export const activeCategories = () => BLOG_CATEGORIES.filter((c) => BLOG_POSTS.some((p) => categorySlug(p.category) === c.slug));

export function findCategory(path: string) {
  const match = /^\/blog\/category\/([^/]+)$/.exec(path);
  return match ? activeCategories().find((c) => c.slug === match[1]) : undefined;
}

export function findHub(path: string) {
  const match = /^\/ai-agents\/([^/]+)$/.exec(path);
  return match ? findHubBySlug(match[1]) : undefined;
}

// Every path that is server-rendered and listed in the sitemap.
export function indexablePaths(): string[] {
  return [
    ...Object.keys(PUBLIC_PAGES),
    ...HUBS.map(hubPath),
    ...activeCategories().map((c) => `/blog/category/${c.slug}`),
    ...BLOG_POSTS.map(blogPostPath),
  ];
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
