import type { BlogPost } from '../data/blogPosts';
import { SITE_NAME, SITE_URL, PUBLIC_PAGES, blogPostPath } from './site';
import { HUBS, hubPath, type Hub } from '../components/landing/hubContent';
import { hubFaq } from '../components/landing/hubExtras';

type Json = Record<string, unknown>;

export function JsonLd({ data }: { data: Json | Json[] }) {
  // Escape "<" so post content can never close the script tag.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

const absolute = (path: string) => (path.startsWith('http') ? path : `${SITE_URL}${path}`);

export const organizationJsonLd: Json = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: absolute('/icon-512.png'),
  // Each AI employee page, like the competitor's makesOffer list.
  makesOffer: HUBS.map((h) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name: h.seoTitle.split(' | ')[0], description: h.seoDescription, url: absolute(hubPath(h)) },
  })),
};

export const websiteJsonLd: Json = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { '@id': `${SITE_URL}/#organization` },
};

// Prices mirror PricingSection in src/components/landing/HomePage.tsx.
export const softwareApplicationJsonLd: Json = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  url: SITE_URL,
  description: PUBLIC_PAGES['/'].description,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: 5,
    highPrice: 49,
    offerCount: 3,
    url: `${SITE_URL}/pricing`,
  },
  publisher: { '@id': `${SITE_URL}/#organization` },
};

export function blogPostingJsonLd(post: BlogPost): Json[] {
  const url = absolute(blogPostPath(post));
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.metaDescription,
      url,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      image: absolute(post.image),
      datePublished: post.publishedAt,
      dateModified: post.publishedAt,
      keywords: post.tags.join(', '),
      articleSection: post.category,
      author: { '@type': 'Person', name: post.author.name, jobTitle: post.author.role },
      publisher: { '@id': `${SITE_URL}/#organization` },
      inLanguage: 'en',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    },
  ];
}

export function faqPageJsonLd(faq: { q: string; a: string }[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

// The homepage demo (public/demo-video.mp4, added 2026-07-08, 45 s).
export const demoVideoJsonLd: Json = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: 'NexBotix demo: sending a WhatsApp campaign with an AI employee',
  description: 'A WhatsApp campaign in NexBotix, from uploading a contact list to sent messages.',
  thumbnailUrl: absolute('/demo-video-poster.webp'),
  contentUrl: absolute('/demo-video.mp4'),
  uploadDate: '2026-07-08T17:28:38+05:30',
  duration: 'PT45S',
};

const PAGE_TYPES: Record<string, string> = {
  '/about': 'AboutPage',
  '/contact': 'ContactPage',
  '/blog': 'CollectionPage',
};

const crumbName = (path: string, title: string) => title.split(/[|:–-]/)[0].trim() || path;

// WebPage (or a more specific subtype) + BreadcrumbList for every public page
// except "/", which has its own SoftwareApplication/FAQ/Video graph.
export function publicPageJsonLd(path: string, page: { title: string; description: string }, posts: BlogPost[] = []): Json[] {
  const url = absolute(path);
  const graph: Json[] = [
    {
      '@context': 'https://schema.org',
      '@type': PAGE_TYPES[path] ?? 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: page.title,
      description: page.description,
      inLanguage: 'en',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: crumbName(path, page.title), item: url },
      ],
    },
  ];

  if (path === '/blog') {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: posts.map((post, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absolute(blogPostPath(post)),
        name: post.title,
      })),
    });
  }

  if (path === '/pricing') {
    // Mirrors PricingSection in src/components/landing/HomePage.tsx (monthly prices).
    // Scale is sold via /contact (no backend plan), so it is not listed as an Offer.
    const plans: [string, number, string][] = [
      ['Starter AI Employee', 5, '1 active AI employee, 1,000 agent calls per month'],
      ['Growth Workforce', 15, 'Up to 3 active AI employees, 5,000 agent calls per month'],
    ];
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: SITE_NAME,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: SITE_URL,
      offers: plans.map(([name, price, description]) => ({
        '@type': 'Offer',
        name,
        description,
        price,
        priceCurrency: 'USD',
        url,
        priceSpecification: { '@type': 'UnitPriceSpecification', price, priceCurrency: 'USD', unitCode: 'MON' },
      })),
    });
  }

  return graph;
}

export function hubJsonLd(hub: Hub, agentNames: string[]): Json[] {
  const url = absolute(hubPath(hub));
  const name = hub.seoTitle.split(' | ')[0];
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: `NexBotix ${agentNames.join(' & ')}: ${name}`,
      description: hub.seoDescription,
      url,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: 5, highPrice: 15, offerCount: 2, url: absolute('/pricing') },
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    faqPageJsonLd(hubFaq(hub)),
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'AI Employees', item: absolute('/ai-agents') },
        { '@type': 'ListItem', position: 3, name: agentNames.join(' & '), item: url },
      ],
    },
  ];
}
