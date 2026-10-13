// Content for the AI employee hub pages (/ai-agents/:slug), Phase 3 of
// docs/SEO_PLAN.md. Plain data: read by the page, metadata, JSON-LD and sitemap.
// Every feature here maps to something in the app (see the matching view in
// src/views). Keep it that way: no invented numbers, reviews or features.

export interface Hub {
  slug: string;
  agentIds: string[]; // ids from AGENTS in homeContent.ts
  keyword: string; // primary search phrase
  seoTitle: string;
  seoDescription: string;
  h1: string;
  intro: string;
  pains: string[];
  meet: string; // first-person pitch from the agent
  features: { title: string; text: string }[];
  steps: { title: string; text: string }[];
  useCases: { who: string; text: string }[];
  limits: string[]; // what it won't do — honest expectations
  faq: { q: string; a: string }[];
  related: string[]; // other hub slugs
}

export const HUBS: Hub[] = [
  {
    slug: 'whatsapp',
    agentIds: ['whatsapp'],
    keyword: 'WhatsApp bulk message sender',
    seoTitle: 'WhatsApp Bulk Message Sender with AI Auto-Reply | NexBotix',
    seoDescription: 'Send personalised bulk WhatsApp messages from Excel or CSV, schedule campaigns, follow up automatically and let an AI answer every reply, 24/7. From $5/month.',
    h1: 'WhatsApp bulk messaging, with an AI that answers every reply',
    intro: 'Nexa sends your WhatsApp campaigns to hundreds of customers at once, personalised with their names, and then handles the replies for you: day, night and weekends.',
    pains: [
      'You copy and paste the same offer into WhatsApp, one contact at a time.',
      'A campaign goes out, forty people reply, and half of them wait hours for an answer.',
      'You worry that sending to a big list will get your number blocked.',
      'Customers message at midnight and you only see it the next morning.',
    ],
    meet: 'I’m Nexa. Give me your contact list and your message, and I’ll send it to everyone, one by one, like a person would. When people reply, I answer with what I know about your business, and I pass the conversation to you when it needs a human.',
    features: [
      { title: 'Send from Excel or CSV', text: 'Upload an .xlsx, .xls or .csv file with names and phone numbers, or add contacts by hand. Nexa maps the columns, removes duplicates and keeps your contact book tidy for the next campaign.' },
      { title: 'Personalised messages, images and links', text: 'Use each contact’s name and custom fields in the text, attach an image (JPG, PNG, GIF or WebP up to 10 MB) and add a link to your store or booking page. You can send more than one message in a sequence.' },
      { title: 'Human-like sending', text: 'Messages go out with a 3 to 5 second gap between each one instead of all at once, which reads like a person typing and puts less pressure on your number.' },
      { title: 'Scheduled campaigns and auto follow-ups', text: 'Pick a date and time and the campaign sends itself. Turn on AI follow-up and Nexa writes a polite second message to the people who didn’t reply the first time.' },
      { title: 'AI replies that know your business', text: 'Add your business name, description, services and links once. Nexa uses them to answer questions about prices, opening hours and delivery, and can share your booking or store link in the chat.' },
      { title: 'You stay in control', text: 'Hand a chat to a human when a customer uses words you choose, skip numbers that should never get auto-replies, only reply when you’re offline, and limit replies to your working hours.' },
    ],
    steps: [
      { title: 'Connect WhatsApp', text: 'Scan a QR code with your phone, the same way you open WhatsApp Web. Your customers keep seeing the number they already know.' },
      { title: 'Upload contacts and write the message', text: 'Drop in your spreadsheet, write the message with name placeholders, add an image or link, and send now or schedule it.' },
      { title: 'Let Nexa handle the replies', text: 'Fill in your business details and switch on auto-replies. Every answer and every handoff shows up in your dashboard.' },
    ],
    useCases: [
      { who: 'Shops and D2C brands', text: 'Announce a sale or a restock to every past customer, then let Nexa answer sizing, stock and delivery questions.' },
      { who: 'Clinics and salons', text: 'Remind patients and clients about check-ups or offers and let them reply to book, even after hours.' },
      { who: 'Coaches and institutes', text: 'Promote a new batch, webinar or course launch to your whole list and answer the same ten questions automatically.' },
      { who: 'Developers and SaaS', text: 'Send OTPs, order updates and alerts from your own code through the REST API, or let Claude and Cursor send WhatsApp messages through MCP.' },
    ],
    limits: [
      'Nexa can’t make bulk sending on a personal WhatsApp number risk-free. It lowers the risk with delays and personalisation; for very large lists use the official WhatsApp Business Cloud API option.',
      'Nexa only knows what you tell it about your business. Add your services, prices and links, and keep them up to date.',
      'Nexa doesn’t buy or supply contact lists. Send to people who know you and expect to hear from you.',
    ],
    faq: [
      { q: 'Can I send bulk WhatsApp messages from my own number?', a: 'Yes. You connect your existing WhatsApp number by scanning a QR code, like WhatsApp Web, so customers see a number they recognise. For high volumes you can also connect the official WhatsApp Business Cloud API.' },
      { q: 'Will my number get banned?', a: 'Any bulk sending carries some risk. NexBotix sends with 3 to 5 second gaps, personalises each message and lets you exclude numbers, which lowers that risk. Send to people who expect your messages, and use the Cloud API for large campaigns.' },
      { q: 'Which file formats can I upload?', a: 'Excel (.xlsx and .xls) and CSV files up to 10 MB. The first row should be headers, and phone numbers should include the country code. You can download a sample file from the upload screen.' },
      { q: 'Can I schedule a WhatsApp campaign?', a: 'Yes. Choose “Schedule for later”, pick the date and time, and the messages are queued and sent automatically.' },
      { q: 'How does the AI auto-reply work?', a: 'You add your business name, description, services and links. The AI uses them to answer customers on WhatsApp. You can hand chats to a human by keyword, exclude numbers, reply only when you’re offline and set working hours.' },
      { q: 'Can I use my own OpenAI, Groq or Gemini key?', a: 'Yes. Bring your own key for the WhatsApp bot and replies don’t count against your plan’s quota. Your key is stored encrypted.' },
      { q: 'Is there a WhatsApp API for developers?', a: 'Yes. The REST API sends to one contact or up to 50 at once, schedules messages, and the MCP server lets AI tools like Claude and Cursor send WhatsApp messages.' },
    ],
    related: ['leads', 'website-chatbot', 'email'],
  },
  {
    slug: 'leads',
    agentIds: ['leads'],
    keyword: 'Google Maps lead scraper',
    seoTitle: 'Google Maps Lead Scraper & AI Outreach | NexBotix',
    seoDescription: 'Find local business leads on Google Maps and Bing Maps by niche and city, enriched with emails and phone numbers, deduplicated, then contacted by AI. 10 free leads.',
    h1: 'Find local business leads on Google Maps, then reach out on autopilot',
    intro: 'Scrappy searches Google Maps and Bing Maps for the businesses you sell to, adds their phone numbers and emails, removes duplicates and can write the first message for you.',
    pains: [
      'You scroll Google Maps and copy phone numbers into a spreadsheet by hand.',
      'Bought lead lists are old, generic and full of the same businesses twice.',
      'You find good leads but never get around to messaging them.',
      'Follow-ups depend on you remembering who you contacted and when.',
    ],
    meet: 'I’m Scrappy. Tell me who your ideal customer is and which city they’re in. I’ll find them, check their details, and either message them for you or leave drafts for you to approve.',
    features: [
      { title: 'Search by niche and city', text: 'Type a business keyword like “dentist” or “interior designer” and a location. Scrappy pulls matching businesses with names, phone numbers, websites, addresses and ratings.' },
      { title: 'Google Maps and Bing Maps together', text: 'By default lead volume is balanced 50/50 between Google Maps and Bing Maps, so you see businesses one source alone would miss. Other sources include Trustpilot for e-commerce brands and the Google Play Store for app publishers.' },
      { title: 'Email enrichment and deduplication', text: 'Scrappy looks up contact emails from each business’s website and removes duplicates, so the same business never ends up on your list twice.' },
      { title: 'Daily autopilot extraction', text: 'Save your niche and city once and Scrappy collects fresh leads on a daily schedule, between 5 and 500 per run, until your credits run out.' },
      { title: 'AI-written outreach', text: 'Describe your company and offer, or let Scrappy fill it in from your website. It writes a personalised first message for each lead and follow-ups every week, two weeks or month.' },
      { title: 'Autopilot or co-pilot', text: 'Let Scrappy send messages automatically, or switch to co-pilot mode and it saves every message as a draft for you to review before anything goes out.' },
    ],
    steps: [
      { title: 'Describe your ideal customer', text: 'Enter a niche, a city and how many leads you want. New accounts get 10 free trial leads.' },
      { title: 'Review your lead list', text: 'Check names, phone numbers, emails and ratings. Export them or send them straight into a WhatsApp or email campaign.' },
      { title: 'Turn on outreach', text: 'Choose autopilot or co-pilot, set your follow-up rhythm, and let Scrappy keep the pipeline moving.' },
    ],
    useCases: [
      { who: 'Agencies and freelancers', text: 'Build lists of restaurants, clinics or retailers in a city that need a website, ads or social media help.' },
      { who: 'B2B suppliers', text: 'Find every café, salon or gym in your delivery area and introduce your product.' },
      { who: 'SaaS for local businesses', text: 'Reach the exact type of business your software is built for, city by city.' },
      { who: 'Recruiters and franchisors', text: 'Map every business of one kind in a region before you call.' },
    ],
    limits: [
      'Scrappy works with publicly listed business information. It doesn’t find personal phone numbers or private data.',
      'Not every business lists an email. Some leads will have a phone number and website only.',
      'Leads are a starting point. Reply rates depend on your offer and message, so test and adjust.',
    ],
    faq: [
      { q: 'How do I scrape leads from Google Maps?', a: 'Enter a business keyword and a city in the lead extractor. NexBotix searches Google Maps and Bing Maps and returns businesses with phone numbers, websites, addresses and ratings, plus emails where they can be found.' },
      { q: 'Is there a free trial for leads?', a: 'Yes. New accounts can claim 10 free trial leads to see the quality before buying credits.' },
      { q: 'How many leads can I get per run?', a: 'Between 5 and 500 per run, within your available credits and daily cap. You can buy lead add-on packs at flat rates if you need more.' },
      { q: 'Are the leads deduplicated?', a: 'Yes. Each business appears once, even when it shows up on both Google Maps and Bing Maps.' },
      { q: 'Can the AI contact the leads for me?', a: 'Yes. In autopilot mode it writes and sends personalised messages and follow-ups. In co-pilot mode it saves drafts for you to approve first.' },
      { q: 'Is there a Chrome extension?', a: 'Yes. The NexBotix Leads extension for Chrome connects to your account with an API key, so you can capture leads while you browse.' },
    ],
    related: ['whatsapp', 'email', 'calendar'],
  },
  {
    slug: 'email',
    agentIds: ['email'],
    keyword: 'AI email outreach tool',
    seoTitle: 'AI Email Outreach & Bulk Email Campaigns | NexBotix',
    seoDescription: 'Send bulk email campaigns from Gmail, Outlook or SMTP, track opens and clicks, re-target people who didn’t open, and auto-reply with AI. From $5/month.',
    h1: 'Email campaigns from your own inbox, with follow-ups that send themselves',
    intro: 'Mailo sends your email campaigns from Gmail, Outlook or your own domain, shows you who opened and clicked, re-targets everyone else and answers incoming emails with AI.',
    pains: [
      'Your newsletter goes out and you have no idea who read it.',
      'Following up with people who didn’t open means exporting lists and starting again.',
      'Email tools want you to move your whole list and sender to their platform.',
      'Replies sit in your inbox for a day because nobody had time.',
    ],
    meet: 'I’m Mailo. I send your campaigns from your own email account, so they come from you. I track what happens, follow up with the right people and reply to simple emails while you’re busy.',
    features: [
      { title: 'Send from your own email', text: 'Connect Gmail with an app password, Outlook or Office 365, or any SMTP server, including Hostinger. Emails come from your address and domain, not a shared marketing server.' },
      { title: 'Opens, clicks and deliveries', text: 'Every campaign shows who received it, who opened it at least once and who clicked a link, so you can see what actually worked.' },
      { title: 'One-click re-targeting', text: 'Send a follow-up to a segment in one click: delivered but never opened, opened but didn’t click, clicked, or failed and needs a retry.' },
      { title: 'HTML templates, signature and brochure', text: 'Save reusable HTML templates, add your email signature and attach your company deck or brochure automatically to every email.' },
      { title: 'AI auto-replies', text: 'Connect your inbox over IMAP and Mailo checks it every few minutes, answering incoming emails using your business details and your own instructions.' },
      { title: 'Email API with attachments', text: 'Send transactional or bulk email to up to 50 recipients per call from your own code, with attachments, using the same account.' },
    ],
    steps: [
      { title: 'Connect your email', text: 'Add Gmail, Outlook or SMTP details once. Use an app password for Gmail.' },
      { title: 'Send a campaign', text: 'Pick a template or write a message, choose recipients and send now or schedule it.' },
      { title: 'Follow up by segment', text: 'Open the campaign, pick “never opened” or “didn’t click”, and send the follow-up.' },
    ],
    useCases: [
      { who: 'Newsletters and offers', text: 'Send monthly updates and promotions, then follow up only with people who missed them.' },
      { who: 'Cold outreach', text: 'Pair with Scrappy to email new leads with a personalised first message and timed follow-ups.' },
      { who: 'Customer support', text: 'Let the AI answer common questions by email so your team handles only the tricky ones.' },
      { who: 'Developers', text: 'Send receipts, notifications and reports with attachments from your app through the API.' },
    ],
    limits: [
      'Your sending limits are your email provider’s limits. Gmail and Outlook cap how many emails one account can send per day.',
      'Inbox placement depends on your domain setup and list quality. Mailo can’t fix a domain without SPF and DKIM records.',
      'Mailo doesn’t sell or rent email lists.',
    ],
    faq: [
      { q: 'Can I send bulk email from Gmail?', a: 'Yes. Connect your Gmail account with an app password and send campaigns from your own address. Gmail’s daily sending limits still apply.' },
      { q: 'Which email providers are supported?', a: 'Gmail, Outlook and Office 365, Hostinger and any SMTP server with TLS or STARTTLS.' },
      { q: 'Can I see who opened my email?', a: 'Yes. Each campaign shows deliveries, opens and clicks, and lets you re-target every segment.' },
      { q: 'How do I follow up with people who didn’t open?', a: 'Open the campaign, choose the “delivered but never opened” segment and send a follow-up to just those people.' },
      { q: 'Does the AI reply to emails automatically?', a: 'Yes, on paid plans. Connect your inbox over IMAP and the AI checks for new emails every few minutes and replies using your business details.' },
      { q: 'Is there an email API?', a: 'Yes. Send to one or up to 50 recipients per request, with attachments, using an API key from the Developer Hub.' },
    ],
    related: ['leads', 'whatsapp', 'social'],
  },
  {
    slug: 'website-chatbot',
    agentIds: ['chatbot'],
    keyword: 'AI chatbot for website',
    seoTitle: 'AI Chatbot for Your Website, Trained on Your Site | NexBotix',
    seoDescription: 'Add an AI chatbot to your website in one line. It learns your pages, answers visitors 24/7 and captures leads. Works on WordPress, Shopify, Wix. Try it free.',
    h1: 'An AI chatbot for your website that learns your business in minutes',
    intro: 'Webby reads your website, answers visitors’ questions in seconds, day or night, and turns conversations into leads with names, emails and phone numbers.',
    pains: [
      'Visitors leave because nobody answers the chat after office hours.',
      'Your team answers the same five questions about price and delivery every day.',
      'Chatbots you tried gave robotic, wrong answers because they didn’t know your business.',
      'Interested visitors browse, leave and you never find out who they were.',
    ],
    meet: 'I’m Webby. I read every page of your website, then I answer your visitors the way your best salesperson would. When someone is interested, I ask for their details and send them to you.',
    features: [
      { title: 'Trained on your whole website', text: 'Webby crawls your domain, reads your pages and builds a summary of your business with links back to the source pages, so its answers are grounded in what you actually say.' },
      { title: 'Captures leads', text: 'When a visitor is interested, Webby collects their name, email or phone number and saves the lead to your dashboard.' },
      { title: 'One line to install', text: 'Paste a single script tag into WordPress, Shopify, Webflow, Wix or any HTML site. The widget appears on its own.' },
      { title: 'Your tone and rules', text: 'Set the welcome message and give the AI personality traits, rules and instructions, like which products to recommend or topics to avoid.' },
      { title: 'Bring your own AI', text: 'Already have an in-house model? Paste a cURL command and Webby detects the endpoint, headers and payload, stores tokens with AES-256-GCM encryption and falls back to the built-in AI if your server is down.' },
      { title: 'JavaScript API', text: 'Open, close or toggle the widget from your own buttons, and pass the logged-in user’s name, email and phone to the chat.' },
    ],
    steps: [
      { title: 'Try it on your site for free', text: 'Enter your website on the chatbot demo page and get a working demo trained on your content, with no signup.' },
      { title: 'Train and customise', text: 'Sign up, let Webby crawl your domain, then add services, a welcome message and any rules.' },
      { title: 'Paste the script', text: 'Copy the snippet for your platform into your site. Leads appear in your dashboard as visitors chat.' },
    ],
    useCases: [
      { who: 'Online stores', text: 'Answer sizing, shipping, returns and stock questions at 2 AM and recover visitors who would have left.' },
      { who: 'Service businesses', text: 'Qualify enquiries for clinics, agencies and consultants and collect contact details for a call back.' },
      { who: 'SaaS', text: 'Answer pricing and feature questions from your docs and route complex ones to your team.' },
      { who: 'Developers', text: 'Put your own AI model behind a production-ready chat widget with fallback, without building the UI.' },
    ],
    limits: [
      'Webby answers from your website and the details you add. If something isn’t written anywhere, it won’t make it up; keep your pages current.',
      'It isn’t a replacement for a human on complex complaints. Use it to answer and capture, then follow up yourself.',
      'The free demo covers 3 websites and up to 50 chat replies each.',
    ],
    faq: [
      { q: 'How do I add an AI chatbot to my website?', a: 'Sign up, let the chatbot crawl your site, then paste one script tag into your website. It works on WordPress, Shopify, Webflow, Wix and hand-coded sites.' },
      { q: 'Can I try it before signing up?', a: 'Yes. Enter your website on the free chatbot demo page to get a working demo trained on your content. You can try 3 websites with up to 50 replies each.' },
      { q: 'How does the chatbot learn about my business?', a: 'It crawls the pages of your domain and builds an AI summary with reference links. You can add your services and custom instructions on top.' },
      { q: 'Does it capture leads?', a: 'Yes. It collects visitors’ names, emails and phone numbers and saves them to the chatbot leads page in your dashboard.' },
      { q: 'Can I connect my own AI model?', a: 'Yes. Paste a cURL command for your in-house AI and the chatbot routes conversations to it, with encrypted tokens and an automatic fallback to the built-in AI.' },
      { q: 'Can I control the widget with JavaScript?', a: 'Yes. Use window.NexBotix.open(), close(), toggle() and setUser() to control the widget and pass user details.' },
    ],
    related: ['whatsapp', 'calendar', 'seo'],
  },
  {
    slug: 'social',
    agentIds: ['facebook', 'linkedin'],
    keyword: 'AI social media manager',
    seoTitle: 'AI Social Media Manager for Facebook & LinkedIn | NexBotix',
    seoDescription: 'Schedule Facebook Page posts, track analytics and keep LinkedIn active with AI-written posts and AI images you approve by email. From $5 per month.',
    h1: 'An AI social media manager for Facebook and LinkedIn',
    intro: 'Pagey runs your Facebook Pages and Linko keeps your LinkedIn active, with posts written by AI, images generated on demand and nothing published that you don’t want.',
    pains: [
      'You know you should post every week, but weeks go by without a single post.',
      'Writing a LinkedIn post takes an hour you don’t have.',
      'Your Facebook Page looks abandoned to anyone who checks it.',
      'You post, but you never look at what actually worked.',
    ],
    meet: 'We’re Pagey and Linko. Pagey publishes and schedules your Facebook Page posts and shows you how they perform. Linko writes LinkedIn posts from your topics, creates an image if you want one and asks for your approval by email before posting.',
    features: [
      { title: 'Facebook Page posting', text: 'Compose posts with text, a link or a photo, publish now or schedule them for later across the Facebook Pages you connect.' },
      { title: 'Facebook post analytics', text: 'See how each published post performs so you know which topics and formats to repeat.' },
      { title: 'AI LinkedIn posts from your keywords', text: 'Add the topics you want to be known for. Linko rotates through them to write varied posts every day, in the persona and tone you set.' },
      { title: 'AI images', text: 'Generate an image for each LinkedIn post with DALL-E 3 or Google Imagen 3, using whichever key you’ve configured.' },
      { title: 'Approve by email', text: 'Turn on manual approval and every LinkedIn post arrives in your inbox with Approve and Delete buttons before it goes live.' },
      { title: 'Your schedule', text: 'Choose posts per day, the time of the first post and the gap between posts. Add a short call to action that’s woven into every post.' },
    ],
    steps: [
      { title: 'Connect your accounts', text: 'Connect your Facebook Pages and your LinkedIn account in a couple of clicks.' },
      { title: 'Set topics and tone', text: 'Add keywords, a persona and how often to post, or let the AI config assistant fill it in for you.' },
      { title: 'Approve and publish', text: 'Schedule Facebook posts and approve LinkedIn posts from your inbox. Check analytics to see what worked.' },
    ],
    useCases: [
      { who: 'Founders and consultants', text: 'Stay visible on LinkedIn with regular, on-topic posts without writing every one.' },
      { who: 'Local businesses', text: 'Keep your Facebook Page active with offers, updates and photos scheduled ahead.' },
      { who: 'Agencies', text: 'Plan and schedule posts for clients and review what performed.' },
      { who: 'B2B teams', text: 'Turn product keywords into a steady stream of LinkedIn content that brings people to your site.' },
    ],
    limits: [
      'Facebook posting covers Facebook Pages, not personal profiles or Instagram.',
      'Analytics depend on the permissions your Facebook app grants; some insights may be unavailable.',
      'AI posts are a first draft of your voice. Use approval mode until you’re happy with the tone.',
    ],
    faq: [
      { q: 'Can I schedule Facebook posts?', a: 'Yes. Compose a post with text, a link or a photo for a connected Facebook Page and choose “Schedule for later”.' },
      { q: 'Does it post to Instagram?', a: 'No. Social posting covers Facebook Pages and LinkedIn.' },
      { q: 'How does the AI write LinkedIn posts?', a: 'You add content keywords and an optional persona. The bot rotates through your keywords daily to write varied posts and can generate an image for each one.' },
      { q: 'Can I approve posts before they go live?', a: 'Yes. With manual approval on, each LinkedIn post is emailed to you with Approve and Delete buttons.' },
      { q: 'Which AI makes the images?', a: 'DALL-E 3 or Google Imagen 3, depending on which key is configured.' },
      { q: 'Can I see analytics?', a: 'Yes. Facebook post analytics show how your published posts performed.' },
    ],
    related: ['seo', 'email', 'whatsapp'],
  },
  {
    slug: 'seo',
    agentIds: ['seo'],
    keyword: 'AI SEO agent',
    seoTitle: 'AI SEO Agent: Site Audits, Web Vitals & Auto Blogs | NexBotix',
    seoDescription: 'Track Core Web Vitals and SEO issues on every page with a 3 KB script, fix many automatically, follow Google Trends and publish AI blog posts to GitHub.',
    h1: 'An AI SEO agent that watches your site and writes your blog',
    intro: 'Seona tracks how every page of your website performs, finds SEO issues, fixes the ones a script can fix, follows what’s trending and writes SEO blog posts straight into your repository.',
    pains: [
      'You don’t know why your pages aren’t ranking, or where to start.',
      'SEO audits give you a 60-item PDF that nobody acts on.',
      'Your blog hasn’t had a new post in months.',
      'You hear about Core Web Vitals but can’t tell which pages are slow.',
    ],
    meet: 'I’m Seona. Add my small script to your site and I’ll watch every page: speed, tags, issues and trends. I’ll fix what I can automatically, tell you exactly what to change for the rest, and write blog posts on the topics people are searching for.',
    features: [
      { title: 'Lightweight tracking script', text: 'A script of about 3 KB runs invisibly on your site and reports on every page without slowing it down. Pause tracking any time without removing it.' },
      { title: 'Core Web Vitals per page', text: 'See LCP, FCP, CLS and TTFB for each page from real visits, so you know exactly which pages are slow.' },
      { title: 'Issues and automatic fixes', text: 'Seona lists SEO issues page by page. Script-fixable ones can be injected automatically on every page load; the rest come with code to paste into your source.' },
      { title: 'Trends and recommendations', text: 'Pick target countries and keywords. Seona fetches Google Trends and gives daily recommendations to keep your content aligned with what people search for.' },
      { title: 'AI blog posts to GitHub', text: 'Connect a GitHub repository and Seona generates SEO blog posts on trending and custom keywords, updates your blog sitemap and RSS feed, and styles posts with your template.' },
      { title: 'Rank tracking and Tag Manager', text: 'Research keywords with an AI agent, track where you rank, and manage Google Tag Manager from the same place.' },
    ],
    steps: [
      { title: 'Install the script', text: 'Paste one script tag into your site’s head and test the connection from the dashboard.' },
      { title: 'Review your pages', text: 'Check the overview score, per-page analysis, Web Vitals and the list of issues.' },
      { title: 'Turn on auto-fix and blogging', text: 'Enable script fixes, set keywords and countries, connect GitHub and let Seona publish.' },
    ],
    useCases: [
      { who: 'Small business websites', text: 'Find out why the site is slow and fix the basics without hiring an SEO agency.' },
      { who: 'Developers', text: 'Get per-page Web Vitals and concrete code fixes instead of a generic audit.' },
      { who: 'Content-led startups', text: 'Keep the blog publishing on trending topics with posts committed straight to your repo.' },
      { who: 'Agencies', text: 'Monitor client sites and show them measurable progress.' },
    ],
    limits: [
      'Some issues can’t be fixed by a script, like slow servers or heavy images. Seona tells you what to change, but someone has to change it.',
      'Rankings take time. Better pages and regular posts help, but no tool can guarantee a position on Google.',
      'AI blog posting needs a GitHub repository for your site.',
    ],
    faq: [
      { q: 'Will the SEO script slow down my site?', a: 'No. It’s about 3 KB and runs invisibly. It reports page data without blocking your page from loading.' },
      { q: 'What does it measure?', a: 'Core Web Vitals and loading metrics (LCP, FCP, CLS and TTFB) for each page, plus SEO issues like missing tags and headings.' },
      { q: 'Can it fix SEO issues automatically?', a: 'Yes, for issues a script can fix. Auto-fix injects those fixes on every page load. For the rest you get the exact code to paste into your source.' },
      { q: 'How does the AI blog work?', a: 'Connect a GitHub repository, choose keywords and countries, and the blog bot generates SEO posts, updates your blog sitemap and RSS feed and uses your template styles.' },
      { q: 'Does it use Google Trends?', a: 'Yes. The SEO bot fetches trends for your target countries and gives daily recommendations.' },
      { q: 'Can I manage Google Tag Manager here?', a: 'Yes. There is a Google Tag Manager section in the SEO workspace.' },
    ],
    related: ['social', 'website-chatbot', 'email'],
  },
  {
    slug: 'calendar',
    agentIds: ['calendar'],
    keyword: 'appointment booking software',
    seoTitle: 'Appointment Booking Software with Google Meet | NexBotix',
    seoDescription: 'Online booking pages with Google Calendar two-way sync and automatic Google Meet links. Set working hours, notice periods and intake questions. Embed on your site.',
    h1: 'Appointment booking that fills your calendar, not your inbox',
    intro: 'Schedula gives you booking pages people can use in seconds. It checks your Google Calendar, adds a Google Meet link to every meeting and fits on your website.',
    pains: [
      '“When are you free?” turns into six messages and two days.',
      'People book a time you’re actually busy because your calendars don’t talk to each other.',
      'You forget to send the video link, or send the wrong one.',
      'Booking tools charge per seat for features you barely use.',
    ],
    meet: 'I’m Schedula. Tell me when you’re free and what kinds of meetings you take. I’ll give you a link, keep your Google Calendar in sync and put a Google Meet room on every booking.',
    features: [
      { title: 'Event types', text: 'Create bookable meeting types, like a 15-minute intro call or a 30-minute demo, each with its own duration and intake questions.' },
      { title: 'Google Calendar two-way sync', text: 'Bookings appear in your Google Calendar and busy times in your calendar block those slots, so you’re never double-booked.' },
      { title: 'Automatic Google Meet links', text: 'Every booking gets its own Google Meet room, added to the invite automatically.' },
      { title: 'Working hours and rules', text: 'Set weekly working hours in your time zone, a minimum notice period and how far ahead people can book.' },
      { title: 'Embed and branding', text: 'Share a public booking link, or embed the booking page or a popup widget on your website, with your own branding.' },
      { title: 'All bookings in one place', text: 'See and manage every upcoming meeting from the dashboard, and use webhooks to notify your other tools.' },
    ],
    steps: [
      { title: 'Connect Google Calendar', text: 'Link your Google account so availability and bookings stay in sync.' },
      { title: 'Create an event type', text: 'Choose a name, duration, intake questions and your working hours.' },
      { title: 'Share or embed', text: 'Send your booking link or embed it on your site. Meetings land in your calendar with a Meet link.' },
    ],
    useCases: [
      { who: 'Sales teams', text: 'Let leads from WhatsApp, email or the website chat book a demo straight away.' },
      { who: 'Consultants and coaches', text: 'Offer discovery calls with intake questions so you know who you’re talking to.' },
      { who: 'Clinics and services', text: 'Let clients pick a slot that fits your working hours, with a notice period.' },
      { who: 'Agencies', text: 'Put a booking widget on every landing page you build.' },
    ],
    limits: [
      'Calendar sync and Meet links work with Google accounts. Outlook calendars aren’t supported for sync yet.',
      'Schedula books meetings; it doesn’t take payment for them.',
      'Reminder messages aren’t sent automatically; pair it with Nexa or Mailo if you want them.',
    ],
    faq: [
      { q: 'Does it sync with Google Calendar?', a: 'Yes. Two-way sync means bookings appear in your Google Calendar and your existing events block those times.' },
      { q: 'Are Google Meet links created automatically?', a: 'Yes. Each booking gets its own Google Meet link in the calendar invite.' },
      { q: 'Can I embed the booking page on my website?', a: 'Yes. Embed the booking page inline or as a popup widget with a short script.' },
      { q: 'Can I set working hours and notice periods?', a: 'Yes. Set weekly hours in your time zone, a minimum notice period and a maximum advance booking window.' },
      { q: 'Can I ask questions before the meeting?', a: 'Yes. Add intake questions to each event type.' },
      { q: 'Is it a Calendly alternative?', a: 'For one-to-one bookings with Google Calendar and Meet, yes, and it’s part of the same workspace as your WhatsApp, email and lead tools.' },
    ],
    related: ['website-chatbot', 'leads', 'whatsapp'],
  },
];

export const findHubBySlug = (slug: string) => HUBS.find((h) => h.slug === slug);
export const hubPath = (h: Hub) => `/ai-agents/${h.slug}`;
