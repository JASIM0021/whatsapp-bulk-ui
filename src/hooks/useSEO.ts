import { useEffect } from 'react';

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
