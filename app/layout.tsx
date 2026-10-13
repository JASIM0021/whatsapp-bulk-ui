import type { Metadata, Viewport } from 'next';
import '../src/index.css';
import { DEFAULT_OG_IMAGE, PUBLIC_PAGES, SITE_NAME, SITE_URL } from '@/seo/site';
import { JsonLd, organizationJsonLd, websiteJsonLd } from '@/seo/jsonld';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: PUBLIC_PAGES['/'].title,
  description: PUBLIC_PAGES['/'].description,
  applicationName: SITE_NAME,
  openGraph: { type: 'website', siteName: SITE_NAME, locale: 'en_US', images: [DEFAULT_OG_IMAGE] },
  twitter: { card: 'summary_large_image', images: [DEFAULT_OG_IMAGE] },
  icons: { icon: '/icon-192.png', apple: '/apple-touch-icon.png' },
};

export const viewport: Viewport = { themeColor: '#030712' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.nexbotix.online" crossOrigin="" />
        <link rel="dns-prefetch" href="https://accounts.google.com" />
      </head>
      <body>
        {children}
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
      </body>
    </html>
  );
}
