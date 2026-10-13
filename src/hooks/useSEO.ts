import { useEffect } from 'react';
import { PUBLIC_PAGES, SITE_URL, type PageSeo, type PublicPath } from '@/seo/site';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export function useSEO({ title, description, keywords, image, url }: SEOProps) {
  useEffect(() => {
    // Update basic meta tags
    document.title = title;
    
    // Helper to update or create meta tags
    const setMetaTag = (attr: string, key: string, content: string) => {
      let element = document.querySelector(`meta[${attr}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, key);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMetaTag('name', 'description', description);
    
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    // Open Graph
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    if (url) setMetaTag('property', 'og:url', url);
    if (image) setMetaTag('property', 'og:image', image);

    // Twitter
    setMetaTag('property', 'twitter:title', title);
    setMetaTag('property', 'twitter:description', description);
    if (url) setMetaTag('property', 'twitter:url', url);
    if (image) setMetaTag('property', 'twitter:image', image);

  }, [title, description, keywords, image, url]);
}

// Applies the registry entry for a public page (see src/seo/site.ts), so
// client-side navigation shows the same title the server rendered.
export function usePageSEO(path: PublicPath) {
  const page: PageSeo = PUBLIC_PAGES[path];
  useSEO({
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    url: `${SITE_URL}${path === '/' ? '/' : path}`,
  });
}
