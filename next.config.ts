import type { NextConfig } from 'next';

const API_ORIGIN = 'https://api.nexbotix.online';

// The .env files and Vercel project still use the old VITE_* names; expose
// them under NEXT_PUBLIC_* so either name works.
const publicEnv = (name: string) =>
  process.env[`NEXT_PUBLIC_${name}`] ?? process.env[`VITE_${name}`] ?? '';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BACKEND_URL: publicEnv('BACKEND_URL'),
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: publicEnv('GOOGLE_CLIENT_ID'),
    NEXT_PUBLIC_PUBLIC_API_URL: publicEnv('PUBLIC_API_URL'),
    NEXT_PUBLIC_META_WA_APP_ID: publicEnv('META_WA_APP_ID'),
  },

  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` },
      { source: '/.well-known/:path*', destination: `${API_ORIGIN}/.well-known/:path*` },
    ];
  },

  async redirects() {
    // Blog slugs that the old static sitemap advertised but never existed.
    const oldBlogSlugs: Record<string, string> = {
      'whatsapp-mcp-server-ai-agents-guide': 'whatsapp-mcp-server-control-whatsapp-from-ai-agents',
      'build-ai-whatsapp-bot-claude-mcp': 'build-automated-whatsapp-bot-for-business',
      'how-to-check-whatsapp-bot-health-detection': 'check-whatsapp-bot-monitoring-debugging-testing',
      'ai-seo-automation-whatsapp-marketing': 'ai-seo-automation-autonomous-bots-fix-seo-issues',
      'whatsapp-bulk-messaging-best-practices-2026': 'bulk-whatsapp-messaging-best-practices-avoid-bans',
      'how-to-prevent-whatsapp-number-banning-bulk-messaging': 'bulk-whatsapp-messaging-best-practices-avoid-bans',
      'whatsapp-mcp-vs-traditional-whatsapp-business-api': 'model-context-protocol-mcp-explained-new-era-ai-agents',
      'top-5-whatsapp-automation-use-cases-ai-agents': '10-essential-whatsapp-automation-strategies-ecommerce-growth',
      'converting-website-visitors-to-whatsapp-leads-ai-chatbots': 'transforming-website-leads-ai-chatbots-whatsapp-integration',
    };
    return [
      ...Object.entries(oldBlogSlugs).map(([from, to]) => ({
        source: `/blog/${from}`,
        destination: `/blog/${to}`,
        permanent: true,
      })),
      { source: '/blog/future-of-agentic-commerce-whatsapp-mcp-2026', destination: '/blog', permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: '/:file*.:ext(png|jpg|jpeg|gif|ico|svg|webp|mp4|webm|woff2|woff|ttf)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }],
      },
      {
        source: '/:path*',
        headers: [{ key: 'Strict-Transport-Security', value: 'max-age=63072000' }],
      },
    ];
  },
};

export default nextConfig;
