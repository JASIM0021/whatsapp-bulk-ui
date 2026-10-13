import type { Metadata, Viewport } from 'next';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
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

// Display + label fonts for the marketing pages (tailwind: font-display, font-label).
const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo', display: 'swap' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' });

export const viewport: Viewport = { themeColor: '#030712' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
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
