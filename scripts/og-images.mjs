// Renders the 1200×630 Open Graph images in public/og.png and public/og/*.png.
// Needs the site running locally (for the brand fonts): pnpm build && pnpm start
// then: node scripts/og-images.mjs [baseUrl=http://localhost:3000]
import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:3000';
const CARDS = [
  { file: 'public/og.png', label: '', title: 'AI employees for WhatsApp, email &amp; lead generation', foot: 'From $5/month · Free trial · No credit card' },
  { file: 'public/og/pricing.png', label: 'Pricing', title: 'Hire AI employees from $5 a month', foot: 'Pay per AI employee · Free trial · Yearly plans save more' },
  { file: 'public/og/about.png', label: 'About', title: 'AI employees for businesses that live on WhatsApp', foot: 'Why we built NexBotix' },
  { file: 'public/og/blog.png', label: 'Blog', title: 'WhatsApp automation, AI agents &amp; MCP guides', foot: 'Practical guides from the NexBotix team' },
  { file: 'public/og/docs.png', label: 'API docs', title: 'WhatsApp, email, chatbot &amp; MCP API', foot: 'REST API · MCP server · Webhooks' },
  { file: 'public/og/contact.png', label: 'Contact', title: 'Talk to the NexBotix team', foot: 'We reply within 24 hours' },
  { file: 'public/og/check-chatbot.png', label: 'Free tool', title: 'See your AI chatbot live on your website', foot: 'Free demo · No signup needed' },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`${BASE}/privacy`, { waitUntil: 'networkidle' }); // loads the site fonts
for (const card of CARDS) {
  await page.evaluate((c) => {
    const avatars = ['whatsapp', 'leads', 'email', 'chatbot', 'facebook', 'linkedin', 'seo', 'calendar']
      .map((n) => `<img src="/agents/web/${n}.webp" style="width:64px;height:64px;border-radius:16px">`).join('');
    const label = c.label ? `<div style="margin-top:40px;font-family:var(--font-plex-mono),monospace;font-size:22px;letter-spacing:.18em;text-transform:uppercase;color:#22c55e">${c.label}</div>` : '';
    document.body.innerHTML = `
    <div style="width:1200px;height:630px;background:#0b0b0c;position:relative;overflow:hidden;font-family:var(--font-archivo),sans-serif;color:#f2eee6">
      <div style="position:absolute;left:50%;top:-200px;width:900px;height:520px;transform:translateX(-50%);border-radius:50%;background:rgba(34,197,94,.22);filter:blur(120px)"></div>
      <div style="position:relative;padding:64px 72px">
        <div style="display:flex;align-items:center;gap:14px;font-size:30px;font-weight:700"><img src="/icon-192.png" style="width:52px;height:52px;border-radius:12px"><span>Nex<span style="color:#22c55e">Botix</span></span></div>
        ${label}
        <div style="margin-top:${c.label ? 16 : 44}px;font-size:72px;font-weight:900;line-height:.98;letter-spacing:-.03em;max-width:1000px">${c.title}</div>
        <div style="margin-top:28px;font-family:var(--font-plex-mono),monospace;font-size:22px;color:#a39e95">${c.foot}</div>
        <div style="position:absolute;left:72px;top:520px;display:flex;gap:12px">${avatars}</div>
      </div>
    </div>`;
  }, card);
  await page.waitForTimeout(500);
  await page.screenshot({ path: card.file });
  console.log('wrote', card.file);
}
await browser.close();
