import type { BlogPost } from '../data/blogPosts';
import { SITE_NAME, SITE_URL, PUBLIC_PAGES, blogPostPath } from './site';

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
