// Copy and data for the homepage. Plain data (no React) so the server can
// read FAQ for FAQPage JSON-LD in app/[[...slug]]/page.tsx.
// Only state what the product actually does — no invented ratings or stats.

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  pitch: string;
}

export const AGENTS: Agent[] = [
  { id: 'whatsapp', name: 'Nexa', role: 'WhatsApp Marketer', avatar: '/agents/web/whatsapp.webp', pitch: 'I send your WhatsApp campaigns and reply to every customer, day and night.' },
  { id: 'leads', name: 'Scrappy', role: 'Lead Finder', avatar: '/agents/web/leads.webp', pitch: 'I find businesses on Google Maps that need what you sell, with their contact details.' },
  { id: 'email', name: 'Mailo', role: 'Email Outreach', avatar: '/agents/web/email.webp', pitch: 'I write and send your email campaigns, then follow up so nobody slips through.' },
  { id: 'chatbot', name: 'Webby', role: 'Website Chat Agent', avatar: '/agents/web/chatbot.webp', pitch: 'I answer visitors on your website in seconds and turn them into leads.' },
  { id: 'facebook', name: 'Pagey', role: 'Facebook Manager', avatar: '/agents/web/facebook.webp', pitch: 'I schedule posts to your Facebook Pages and track how they perform.' },
  { id: 'linkedin', name: 'Linko', role: 'LinkedIn Growth', avatar: '/agents/web/linkedin.webp', pitch: 'I keep your LinkedIn active with AI-written, scheduled posts.' },
  { id: 'seo', name: 'Seona', role: 'SEO Specialist', avatar: '/agents/web/seo.webp', pitch: 'I watch your rankings and Core Web Vitals and write blog posts that get found.' },
  { id: 'calendar', name: 'Schedula', role: 'Booking Assistant', avatar: '/agents/web/calendar.webp', pitch: 'I book meetings into your calendar with Google Meet links attached.' },
  { id: 'youtube', name: 'Tuber', role: 'YouTube Growth', avatar: '/agents/web/youtube.webp', pitch: 'I spot trending topics, draft scripts and tune your video SEO.' },
];

export interface Job {
  id: string;
  agentIds: string[];
  title: string;
  lead: string;
  points: { title: string; text: string }[];
}

export const JOBS: Job[] = [
  {
    id: 'whatsapp',
    agentIds: ['whatsapp'],
    title: 'WhatsApp campaigns',
    lead: 'Bulk WhatsApp messages that read like one-to-one chats, and an AI that answers every reply.',
    points: [
      { title: 'Upload and send', text: 'Import contacts from Excel or CSV and personalise every message with names and custom fields.' },
      { title: 'Schedule broadcasts', text: 'Plan campaigns ahead and let them go out with human-like delays between messages.' },
      { title: 'AI auto-replies 24/7', text: 'Answers questions about your business on WhatsApp, even at 2am.' },
      { title: 'Official Cloud API option', text: 'Run high-volume sending on the Meta WhatsApp Business Cloud API with approved templates.' },
    ],
  },
  {
    id: 'leads',
    agentIds: ['leads'],
    title: 'Lead generation',
    lead: 'Pick a niche and a city. Get a list of real local businesses ready for outreach.',
    points: [
      { title: 'Scrape Google & Bing Maps', text: 'Find businesses by category and location, with phone numbers, websites and ratings.' },
      { title: 'Enrich with emails', text: 'Look up contact emails from each business website.' },
      { title: 'Straight into campaigns', text: 'Send your new leads to a WhatsApp or email campaign in one click.' },
    ],
  },
  {
    id: 'email',
    agentIds: ['email'],
    title: 'Email outreach',
    lead: 'Campaigns from your own Gmail or SMTP, with templates, tracking and follow-ups.',
    points: [
      { title: 'Your sender, your domain', text: 'Connect Gmail or any SMTP server so emails come from you.' },
      { title: 'Templates that convert', text: 'Reusable HTML templates with personalisation fields.' },
      { title: 'API for developers', text: 'Send transactional or bulk email, with attachments, from your own code.' },
    ],
  },
  {
    id: 'chatbot',
    agentIds: ['chatbot'],
    title: 'Website chatbot',
    lead: 'An AI chat widget trained on your website that captures leads while you sleep.',
    points: [
      { title: 'Trained on your site', text: 'Reads your pages and answers questions about your products and prices.' },
      { title: 'Captures leads', text: 'Collects names, emails and phone numbers and sends them to your dashboard.' },
      { title: 'One line to install', text: 'Paste a script tag on any website: WordPress, Shopify, Webflow or custom.' },
    ],
  },
  {
    id: 'social',
    agentIds: ['facebook', 'linkedin', 'seo'],
    title: 'Social media & SEO',
    lead: 'Stay visible on Facebook, LinkedIn and Google without writing every post yourself.',
    points: [
      { title: 'Facebook Pages', text: 'Compose, schedule and analyse posts across your Pages.' },
      { title: 'LinkedIn posting', text: 'AI-written LinkedIn posts, scheduled ahead.' },
      { title: 'SEO monitoring and blogs', text: 'Track rankings and Core Web Vitals, and generate SEO blog posts.' },
    ],
  },
  {
    id: 'calendar',
    agentIds: ['calendar'],
    title: 'Booking & calendar',
    lead: 'A booking page that fills your calendar and adds the video link for you.',
    points: [
      { title: 'Public booking pages', text: 'Share a link or embed a widget so customers pick a free slot.' },
      { title: 'Google Calendar & Meet', text: 'Two-way calendar sync with a Google Meet room on every booking.' },
    ],
  },
];

export const INTEGRATIONS = [
  'WhatsApp', 'WhatsApp Business API', 'Gmail', 'SMTP', 'Facebook', 'LinkedIn', 'Google Maps',
  'Google Calendar', 'Google Meet', 'YouTube', 'Excel & CSV', 'Claude (MCP)', 'Cursor (MCP)', 'REST API',
];

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is an AI employee?',
    a: 'An AI employee is an agent that does a whole job for you, such as sending WhatsApp campaigns, replying to customers or finding new leads. It works on its own in the background and checks with you only when it needs a decision.',
  },
  {
    q: 'How much does NexBotix cost?',
    a: 'AI workforce plans start at $5 per month for one AI employee with 1,000 agent calls. Growth is $15 per month for up to 3 employees and Scale is $49 per month for up to 10. Yearly billing costs less, and you can start with a free trial with no credit card.',
  },
  {
    q: 'Will sending bulk WhatsApp messages get my number banned?',
    a: 'Any bulk sending on WhatsApp carries some risk. NexBotix spaces messages out with human-like delays and personalises each one, which lowers that risk. For high volumes, use the official WhatsApp Business Cloud API option, which is built for business messaging.',
  },
  {
    q: 'Do I need to know how to code or write prompts?',
    a: 'No. You pick an AI employee, connect your account and tell it what you want. Developers can go further with the visual flow studio, the REST API and the MCP server for Claude and Cursor.',
  },
  {
    q: 'Which apps does NexBotix work with?',
    a: 'WhatsApp and the WhatsApp Business Cloud API, Gmail and any SMTP server, Facebook Pages, LinkedIn, Google Maps, Google Calendar and Meet, YouTube, and your own website through the chat widget. AI tools like Claude and Cursor connect through MCP.',
  },
  {
    q: 'How do I connect WhatsApp?',
    a: 'Sign up, open the WhatsApp employee and scan the QR code with your phone, the same way you use WhatsApp Web. Then upload your contacts and send your first campaign.',
  },
  {
    q: 'Is my data secure?',
    a: 'API keys and connector credentials, including WhatsApp Business tokens, are stored encrypted with AES-256. You can request deletion of your data at any time from the data deletion page.',
  },
];
