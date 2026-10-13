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

// "A day with your AI team" — an illustrative day, labelled as such on the page.
export const DAY: { time: string; agentId: string; text: string }[] = [
  { time: '6:40 AM', agentId: 'leads', text: 'Scrappy finishes last night’s search: 52 physiotherapy clinics in Bengaluru, with phone numbers and websites.' },
  { time: '9:30 AM', agentId: 'whatsapp', text: 'Nexa starts the morning campaign to 1,100 past customers, spaced out so it reads like a person typing.' },
  { time: '10:05 AM', agentId: 'whatsapp', text: 'Forty-one people reply. Nexa answers the questions about price and delivery, and flags three that need you.' },
  { time: '1:20 PM', agentId: 'email', text: 'Mailo sends the follow-up email to everyone who opened yesterday’s offer but didn’t click.' },
  { time: '4:45 PM', agentId: 'calendar', text: 'Schedula books two demo calls for Thursday and adds the Google Meet links to your calendar.' },
  { time: '11:52 PM', agentId: 'chatbot', text: 'A visitor asks about delivery on your website. Webby answers and saves their number as a lead.' },
];

export const INDUSTRIES: { name: string; text: string }[] = [
  { name: 'Clinics & dentists', text: 'Send check-up and offer messages to your patient list on WhatsApp, answer “are you open Sunday?” on your website at night, and let patients book a slot themselves.' },
  { name: 'Real estate', text: 'Broadcast a new listing to every interested buyer in minutes, find local businesses to partner with, and let the website chat qualify enquiries before you call back.' },
  { name: 'Coaches & educators', text: 'Promote a new batch or webinar on WhatsApp and email, answer the same ten questions automatically, and fill your calendar with discovery calls.' },
  { name: 'E-commerce & D2C', text: 'Announce sales and restocks on WhatsApp, follow up by email, and answer sizing, delivery and return questions in the website chat.' },
  { name: 'Agencies', text: 'Build lead lists for clients by niche and city, run their outreach, and plug NexBotix into your own tools through the REST API.' },
  { name: 'Local services', text: 'Salons, gyms, repair shops and caterers: remind customers you exist, reply to every enquiry fast, and post on Facebook without thinking about it.' },
];

// Honest comparison — no invented salary figures; our side states real plan facts.
export const COMPARE: { row: string; hire: string; agency: string; nexbotix: string }[] = [
  { row: 'Monthly cost', hire: 'A full salary, plus tools', agency: 'A monthly retainer', nexbotix: 'From $5 per AI employee' },
  { row: 'Hours', hire: 'Office hours, minus leave', agency: 'Business days', nexbotix: '24/7, weekends included' },
  { row: 'Time to start', hire: 'Weeks of hiring and training', agency: 'Onboarding calls and briefs', nexbotix: 'Sign up and scan a QR code' },
  { row: 'Replies to a 2 AM website enquiry', hire: 'Next morning', agency: 'Next business day', nexbotix: 'In seconds' },
  { row: 'Your data and accounts', hire: 'Shared logins', agency: 'Held by the agency', nexbotix: 'Your accounts, encrypted credentials' },
];

export const DEV_FEATURES: { title: string; text: string }[] = [
  { title: 'REST API', text: 'Send WhatsApp messages to one contact or up to 50 at once, schedule them, and send email with attachments, from any language.' },
  { title: 'MCP server', text: 'Connect Claude, Cursor or Windsurf to WhatsApp through the Model Context Protocol and let your AI agent send messages and check status.' },
  { title: 'Visual flow studio', text: 'Drag and drop triggers, AI steps, conditions and actions to build your own AI employee without writing code.' },
  { title: 'In-house AI & webhooks', text: 'Route chatbot conversations to your own model or backend through webhooks and cURL connectors, with credentials encrypted.' },
];

FAQ.push(
  {
    q: 'Can I use my existing WhatsApp number?',
    a: 'Yes. The WhatsApp employee connects to your current number by scanning a QR code, like WhatsApp Web, so customers see the number they already know. For the official Cloud API you connect a number through Meta’s Embedded Signup instead.',
  },
  {
    q: 'What is the difference between bulk sending and the WhatsApp Business Cloud API?',
    a: 'Bulk sending uses your own WhatsApp account, which is quick to start and suits smaller lists. The WhatsApp Business Cloud API is Meta’s official channel for businesses, uses approved message templates and is the safer choice for large volumes.',
  },
  {
    q: 'Does the website chatbot work on WordPress, Shopify or Wix?',
    a: 'Yes. You paste one script tag into your site, which works on WordPress, Shopify, Webflow, Wix and hand-coded websites. You can try it on your own site for free on the chatbot demo page before signing up.',
  },
  {
    q: 'Is there an API for developers?',
    a: 'Yes. There is a REST API for WhatsApp and email, an MCP server for AI tools like Claude and Cursor, and webhooks for your own AI. API keys are created in the Developer Hub and the full reference is in the API docs.',
  },
  {
    q: 'What happens when the free trial ends?',
    a: 'The free trial includes 10 messages with no time limit. When they are used up, pick a plan to keep sending. API keys created during the trial stop working when it ends, and on a paid plan you only pay for the AI employees you turn on.',
  },
);

export const TEAM_NOTE = {
  heading: 'Why we built NexBotix',
  paragraphs: [
    'NexBotix started with a simple problem. Business owners we knew were spending hours every week sending the same WhatsApp message to hundreds of contacts, one by one, and then losing track of who replied.',
    'We built a tool to send those messages for them. From there the idea grew: replies at night, finding new leads, follow-up emails, a booking link. Each of those jobs became an AI employee.',
    'We keep NexBotix affordable on purpose. A small business should be able to hire its first AI employee for less than the cost of a lunch, and add more only when it helps.',
  ],
  signoff: 'The NexBotix team',
};
