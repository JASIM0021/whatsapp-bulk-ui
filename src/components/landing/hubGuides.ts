// Long-form guide content for each AI employee hub page (/ai-agents/:slug).
// Question-shaped headings with a short direct answer first (quotable by AI
// Overviews), then detail. General best practice is written as advice, not as
// product claims; product claims must match the app (see hubContent.ts).

export interface HubGuide {
  title: string; // H2 for the guide block
  sections: { q: string; a: string[] }[]; // H3 + paragraphs
  day: { time: string; text: string }[];
  vsManual: { task: string; manual: string; agent: string }[];
}

export const HUB_GUIDES: Record<string, HubGuide> = {
  whatsapp: {
    title: 'The practical guide to bulk WhatsApp messaging',
    sections: [
      {
        q: 'What is a WhatsApp bulk message sender?',
        a: [
          'A WhatsApp bulk message sender is software that sends the same message, personalised for each person, to a list of WhatsApp contacts without you typing each one. Instead of copying an offer into 300 chats, you upload the list once and the tool sends to everyone.',
          'Good bulk senders do more than send. They let you add names and other details to each message, attach images and links, schedule campaigns for later and follow up with people who didn’t reply. NexBotix adds an AI that answers the replies, which is where most of the work actually is.',
        ],
      },
      {
        q: 'How do I send bulk WhatsApp messages without getting banned?',
        a: [
          'Send only to people who know your business and expect to hear from you, space messages out, and personalise them. WhatsApp restricts numbers that look like spam, and the signals it uses are reports, blocks and sudden bursts of identical messages.',
          'In practice: start with your warmest contacts, keep the first campaigns small, use each person’s name, give people an easy way to say “stop”, and don’t send the same text to thousands of strangers. NexBotix sends with a 3 to 5 second gap between messages and lets you exclude numbers. If you need to message very large lists, use the official WhatsApp Business Cloud API, which is built for that.',
        ],
      },
      {
        q: 'Bulk sender or WhatsApp Business Cloud API: which should I use?',
        a: [
          'Use the bulk sender on your own number when your list is small to medium and your contacts already know you. It is quick to set up, costs nothing extra from Meta, and customers see the number they saved.',
          'Use the WhatsApp Business Cloud API when you send at high volume, need approved message templates, or want the lowest risk of restrictions. It takes a little longer to set up through Meta’s Embedded Signup, and Meta charges per conversation. NexBotix supports both, so you can start on your number and move to the API as you grow.',
        ],
      },
      {
        q: 'What should a bulk WhatsApp message say?',
        a: [
          'Write it like a message to one person, not an advert. Start with their name, say who you are in a few words, give one clear reason for writing and one action to take. Keep it under five short lines, because most people read WhatsApp on a phone between other things.',
          'Images help for offers and new products. Links work best at the end. Avoid all-caps, long lists of emojis and anything that looks copied from an email newsletter. Test the message on a few friendly contacts first, then send to the rest.',
        ],
      },
      {
        q: 'When is the best time to send a WhatsApp campaign?',
        a: [
          'Send when your customers are free to reply and you’re around to handle anything the AI hands back. For most local businesses that is late morning or early evening on weekdays; for shops, a few days before a weekend or payday often works well.',
          'The only real answer comes from your own results. Schedule two similar campaigns at different times and compare how many people reply. Nexa makes this easy because scheduled campaigns send themselves.',
        ],
      },
      {
        q: 'How does the AI handle replies?',
        a: [
          'You give Nexa your business name, a short description, your services and any links, like a booking page or store. When someone replies, the AI answers using that information and shares the right link when it helps.',
          'You decide where it stops. Choose keywords like “complaint” or “call me” that hand the chat to a human, set working hours, exclude numbers such as family and suppliers, and switch on co-pilot mode so Nexa only replies when you haven’t answered yourself.',
        ],
      },
    ],
    day: [
      { time: '9:00 AM', text: 'Your scheduled campaign to 600 past customers starts, one message every few seconds.' },
      { time: '9:40 AM', text: 'Thirty-two people reply. Nexa answers questions about price, sizes and delivery.' },
      { time: '10:15 AM', text: 'A customer writes “I want to speak to someone”. Nexa hands the chat to your phone.' },
      { time: '6:00 PM', text: 'Nexa sends a friendly follow-up to people who didn’t reply to the morning message.' },
      { time: '11:30 PM', text: 'A late reply asks if the offer is still on. Nexa says yes and shares the store link.' },
    ],
    vsManual: [
      { task: 'Sending to 500 contacts', manual: 'Hours of copy and paste', agent: 'One upload, sent automatically' },
      { task: 'Using each person’s name', manual: 'Easy to get wrong', agent: 'Filled in from your file' },
      { task: 'Answering replies at night', manual: 'Waits until morning', agent: 'Answered in seconds' },
      { task: 'Following up non-replies', manual: 'Rarely happens', agent: 'Scheduled AI follow-up' },
    ],
  },

  leads: {
    title: 'The practical guide to finding leads on Google Maps',
    sections: [
      {
        q: 'What is a Google Maps lead scraper?',
        a: [
          'A Google Maps lead scraper collects the public details of businesses listed on Google Maps, such as name, phone number, website, address and rating, for a search like “dentist in Pune”. It turns hours of scrolling and copying into a spreadsheet you can use straight away.',
          'Maps data is valuable because it is local, current and comes from businesses that want to be found. NexBotix also searches Bing Maps, so you catch businesses that keep only one listing up to date, and adds emails from the businesses’ own websites.',
        ],
      },
      {
        q: 'Is it legal to collect business leads from Google Maps?',
        a: [
          'Collecting publicly listed business contact details is common practice, but how you use them is regulated. Rules differ by country, so check the ones that apply to you, especially for email marketing in the EU and UK.',
          'Good habits keep you safe and get better results: contact businesses only about things relevant to them, say clearly who you are, make it easy to opt out and stop messaging anyone who asks. Scrappy only uses public business information and never looks for personal data.',
        ],
      },
      {
        q: 'How do I choose the right niche and location?',
        a: [
          'Start from your best existing customers. What kind of business are they, how big, and where? Search for exactly that, one city at a time, rather than a broad term across a whole country.',
          'Use the words a customer would use to find them, like “physiotherapy clinic” rather than “healthcare”. Run small searches first, look at the results, and refine the keyword before you scale to hundreds of leads.',
        ],
      },
      {
        q: 'How many leads do I actually need?',
        a: [
          'Fewer than you think. Fifty well-matched local businesses with a personal message usually beat a thousand generic ones. Reply rates fall quickly when the list is broad or the message is vague.',
          'A good rhythm is to extract a small batch every day on autopilot, contact it, and see who replies. Scrappy lets you pick anywhere from 5 to 500 leads per run, so you can grow slowly and keep quality high.',
        ],
      },
      {
        q: 'What should I write in the first message?',
        a: [
          'Mention something specific about their business, explain in one sentence what you do for businesses like theirs, and ask a simple question. Leave out the long introduction and the attachments.',
          'Scrappy writes the first draft from your company description and offer, and personalises it for each lead. In co-pilot mode every message waits for your approval, which is the best way to start until the tone feels right.',
        ],
      },
      {
        q: 'How often should I follow up?',
        a: [
          'Most replies come after the second or third touch, not the first. Follow up politely, add something new each time, and stop after a few attempts if there’s no answer.',
          'Scrappy can follow up every week, every two weeks or every month, in autopilot or co-pilot mode, so leads don’t go cold because you were busy.',
        ],
      },
    ],
    day: [
      { time: '6:00 AM', text: 'Autopilot runs your saved search and adds 40 new interior designers in Mumbai.' },
      { time: '6:05 AM', text: 'Duplicates are removed and emails are added from their websites.' },
      { time: '9:00 AM', text: 'Scrappy writes a personalised first message for each new lead and saves them as drafts.' },
      { time: '9:20 AM', text: 'You skim the drafts over coffee, tweak two and approve the rest.' },
      { time: 'Next week', text: 'Leads who didn’t reply get a short, friendly follow-up.' },
    ],
    vsManual: [
      { task: 'Finding 100 local businesses', manual: 'An afternoon on Google Maps', agent: 'One search' },
      { task: 'Finding their emails', manual: 'Visit each website', agent: 'Added automatically' },
      { task: 'Removing duplicates', manual: 'Spreadsheet formulas', agent: 'Done for you' },
      { task: 'Writing and following up', manual: 'Often forgotten', agent: 'Drafted and scheduled' },
    ],
  },

  email: {
    title: 'The practical guide to email outreach that gets read',
    sections: [
      {
        q: 'What is an AI email outreach tool?',
        a: [
          'An AI email outreach tool sends emails to a list of people, tracks who opened and clicked, and helps you follow up, with AI doing the repetitive writing and replying. The goal is the same as a good salesperson’s inbox: everyone gets a relevant message and nobody is forgotten.',
          'NexBotix sends from your own email account instead of a shared marketing server, so replies come straight back to you and your emails look like they came from a person.',
        ],
      },
      {
        q: 'Should I send from Gmail, Outlook or my own domain?',
        a: [
          'For small lists and personal outreach, your Gmail or Outlook account is the simplest choice. For newsletters and bigger lists, use an address on your own domain through SMTP, which looks more professional and keeps your personal inbox separate.',
          'Whatever you choose, set up SPF, DKIM and DMARC records for your domain. They tell inbox providers your emails are really from you and make a big difference to whether you land in the inbox or the spam folder.',
        ],
      },
      {
        q: 'How many emails can I send per day?',
        a: [
          'Your email provider sets the limit, not NexBotix. Personal Gmail and Outlook accounts allow a few hundred emails a day; business accounts and dedicated SMTP services allow more.',
          'Even within the limits, ramp up slowly on a new account, keep your list clean and stop emailing addresses that bounce. Sending to people who never open hurts your reputation over time.',
        ],
      },
      {
        q: 'How do I follow up with people who didn’t open?',
        a: [
          'Wait two or three days, change the subject line and send a shorter version to only the people who didn’t open. Leave everyone else alone.',
          'In NexBotix, open the campaign, choose “delivered but never opened” and send the follow-up. You can do the same for people who opened but didn’t click, or who clicked and deserve a more direct offer.',
        ],
      },
      {
        q: 'What makes a cold email work?',
        a: [
          'Relevance and brevity. Say why you are writing to this person, what’s in it for them and what you want them to do, in under 100 words. A clear subject line beats a clever one.',
          'Personalise beyond the first name: mention their business, city or something specific. Avoid attachments in the first email and send one follow-up or two at most.',
        ],
      },
      {
        q: 'How do AI email auto-replies work?',
        a: [
          'You connect your inbox over IMAP and describe your business and services. Every few minutes the AI checks for new emails and replies to the ones it can answer, like questions about pricing, availability or how to get started.',
          'You can override the AI’s default instructions with your own, so it follows your tone and never promises things you don’t offer.',
        ],
      },
    ],
    day: [
      { time: '8:00 AM', text: 'Your scheduled newsletter goes out from your own domain to 2,000 subscribers.' },
      { time: '11:00 AM', text: 'Opens and clicks start coming in on the campaign page.' },
      { time: '2:00 PM', text: 'An email asks about your pricing. The AI replies with the plans and a link.' },
      { time: 'Thursday', text: 'You send a shorter follow-up to everyone who didn’t open, in one click.' },
    ],
    vsManual: [
      { task: 'Sending a campaign', manual: 'Mail merge and hope', agent: 'Send or schedule from your inbox' },
      { task: 'Knowing who read it', manual: 'No idea', agent: 'Opens and clicks per person' },
      { task: 'Follow-up to non-openers', manual: 'Export, filter, resend', agent: 'One click' },
      { task: 'Answering common emails', manual: 'Someone’s afternoon', agent: 'AI replies in minutes' },
    ],
  },

  'website-chatbot': {
    title: 'The practical guide to AI chatbots for websites',
    sections: [
      {
        q: 'What is an AI chatbot for a website?',
        a: [
          'An AI chatbot is a chat window on your website that answers visitors’ questions in plain language, using information about your business. Unlike old rule-based bots that only follow buttons, it understands free-text questions and replies in a natural way.',
          'The best ones are trained on your own content, so they answer from your prices, policies and services instead of guessing, and they collect contact details when a visitor is ready to buy.',
        ],
      },
      {
        q: 'How does the chatbot learn about my business?',
        a: [
          'Webby crawls the pages on your domain and builds a summary of your business with links back to the pages it used. You can then add your services, a welcome message and custom instructions on top.',
          'Because it learns from your website, the most useful thing you can do is keep the site current. Add a clear pricing page and FAQ, and the chatbot’s answers get better automatically.',
        ],
      },
      {
        q: 'Will an AI chatbot give wrong answers?',
        a: [
          'It can if it has nothing to go on. That is why grounding matters: Webby answers from your website and the details you add, and you can tell it to say “I’ll ask the team” for anything it isn’t sure about.',
          'Read the first conversations, then refine its instructions. Most wrong answers come from missing information on the site, which is worth fixing for human visitors too.',
        ],
      },
      {
        q: 'How do I add the chatbot to WordPress, Shopify or Wix?',
        a: [
          'Copy the one-line script from the integration guide and paste it into your site. On WordPress use a header or footer code plugin or your theme settings; on Shopify add it to theme.liquid; on Wix and Webflow use the custom code setting.',
          'The widget appears on its own once the script loads. You can open it from your own buttons with the JavaScript API and pass the visitor’s name and email if they’re logged in.',
        ],
      },
      {
        q: 'Can I use my own AI model?',
        a: [
          'Yes. If your company runs its own model or AI backend, paste a cURL command for it. Webby detects the endpoint, method, headers and payload, stores tokens encrypted with AES-256-GCM, and sends visitor messages to your model.',
          'If your server is slow or down, it can fall back to the built-in AI, so visitors still get an answer.',
        ],
      },
      {
        q: 'How do I measure if the chatbot is working?',
        a: [
          'Look at three things: how many conversations it has, how many leads it captures, and which questions come up most. The leads page shows every captured contact.',
          'The questions are a free research tool. If many visitors ask the same thing, put the answer on your website too.',
        ],
      },
    ],
    day: [
      { time: '7:15 AM', text: 'A visitor asks if you deliver to their area. Webby answers from your shipping page.' },
      { time: '1:30 PM', text: 'Someone compares two plans. Webby explains the difference and links to pricing.' },
      { time: '8:45 PM', text: 'A visitor wants a quote. Webby takes their name and number and saves the lead.' },
      { time: '2:10 AM', text: 'An overseas visitor asks about returns and gets an answer straight away.' },
    ],
    vsManual: [
      { task: 'Answering after hours', manual: 'Nobody online', agent: 'Answered 24/7' },
      { task: 'Same five questions daily', manual: 'Team time every day', agent: 'Handled automatically' },
      { task: 'Capturing contact details', manual: 'Visitors leave anonymous', agent: 'Saved as leads' },
      { task: 'Setup', manual: 'Hire or train staff', agent: 'One script tag' },
    ],
  },

  social: {
    title: 'The practical guide to AI social media for small businesses',
    sections: [
      {
        q: 'What does an AI social media manager do?',
        a: [
          'An AI social media manager plans, writes and publishes posts for your accounts, then shows you what performed. It takes the blank-page problem away: you choose the topics and the tone, and the AI keeps a steady stream of posts going.',
          'In NexBotix, Pagey publishes and schedules posts on your Facebook Pages and shows post analytics, and Linko writes and publishes LinkedIn posts from your keywords, with optional AI images and approval by email.',
        ],
      },
      {
        q: 'How often should a small business post?',
        a: [
          'Consistency matters more than volume. A few good posts a week on the platform where your customers are beats daily posts everywhere that nobody reads.',
          'On LinkedIn, one post a day or a few a week works well for founders and B2B companies. On Facebook Pages, two or three posts a week with offers, updates and photos keeps the page looking alive. Set the rhythm once and let the schedule handle it.',
        ],
      },
      {
        q: 'Will AI posts sound like me?',
        a: [
          'They sound like the instructions you give. Add a persona describing how you write, the topics you care about and anything to avoid, and review the first posts carefully.',
          'Keep approval mode on until the drafts feel right. Linko emails every post with Approve and Delete buttons, so nothing goes live that you wouldn’t post yourself.',
        ],
      },
      {
        q: 'What should I post about?',
        a: [
          'The questions customers ask you, lessons from your work, behind-the-scenes moments, results you’ve helped someone get, and occasional offers. Aim for mostly useful posts and only some selling.',
          'Add these as content keywords. Linko rotates through them so your feed stays varied instead of repeating the same angle.',
        ],
      },
      {
        q: 'How do I know what’s working?',
        a: [
          'Check reach and engagement per post, not just follower count. Look for patterns: which topics, formats and times get the most response.',
          'Facebook post analytics in NexBotix show how each published post performed, so you can repeat the topics that work and drop the ones that don’t.',
        ],
      },
    ],
    day: [
      { time: '8:30 AM', text: 'Linko emails you today’s LinkedIn post with an AI image. You tap Approve.' },
      { time: '9:00 AM', text: 'The post goes live on LinkedIn at your chosen time.' },
      { time: '12:00 PM', text: 'Pagey publishes the scheduled Facebook offer post with a photo.' },
      { time: 'Friday', text: 'You check Facebook analytics and plan next week’s topics in ten minutes.' },
    ],
    vsManual: [
      { task: 'Writing a LinkedIn post', manual: 'An hour of staring', agent: 'Drafted from your topics' },
      { task: 'Creating an image', manual: 'Search stock photos', agent: 'Generated with AI' },
      { task: 'Posting on time', manual: 'When you remember', agent: 'Scheduled' },
      { task: 'Knowing what works', manual: 'Guesswork', agent: 'Per-post analytics' },
    ],
  },

  seo: {
    title: 'The practical guide to AI-powered SEO',
    sections: [
      {
        q: 'What is an AI SEO agent?',
        a: [
          'An AI SEO agent monitors your website, finds problems that hold back your search rankings, fixes or explains them, and helps you publish content people are searching for. It works continuously instead of producing a one-off audit that goes out of date.',
          'Seona does this with a small tracking script on your site, a dashboard of issues and Core Web Vitals per page, automatic fixes where a script can apply them, trend-based recommendations and an AI blog writer that publishes to your repository.',
        ],
      },
      {
        q: 'What are Core Web Vitals and why do they matter?',
        a: [
          'Core Web Vitals are Google’s measurements of how a page feels to use: how quickly the main content appears (LCP), how stable the layout is while loading (CLS) and how quickly the page responds. Seona also tracks First Contentful Paint (FCP) and server response time (TTFB).',
          'They are one of many ranking signals, and slow pages also lose visitors before they read anything. Seeing them per page tells you exactly where to start.',
        ],
      },
      {
        q: 'Which SEO issues can be fixed automatically?',
        a: [
          'Tags a script can add as the page loads, like a missing viewport tag, canonical tag or Open Graph tags, are fixed automatically. Seona marks these as script-fixable and injects the fixes on every page.',
          'Missing titles, meta descriptions and image alt text, slow servers, heavy images and thin content need changes to your site itself. For those, Seona gives you the specific code or change to make.',
        ],
      },
      {
        q: 'Is AI-written blog content good for SEO?',
        a: [
          'It can be, if it is useful, accurate and written for people. Search engines reward helpful content regardless of how it was produced, and penalise thin pages made only to rank.',
          'Use AI to cover topics people are actually searching for, then review and add your own experience and examples. Seona picks topics from Google Trends and your keywords, commits posts to your GitHub repository and updates your blog sitemap and RSS feed, so publishing is automatic but the content stays in your control.',
        ],
      },
      {
        q: 'How long does SEO take to show results?',
        a: [
          'Technical fixes can show up within weeks as pages are recrawled. Content usually takes a few months to build rankings, and competitive keywords take longer.',
          'Track the trend rather than daily movements: more pages indexed, faster pages, more search impressions and steady publishing. No tool can promise a specific Google ranking.',
        ],
      },
    ],
    day: [
      { time: 'All day', text: 'Seona’s script records page speed and SEO data from real visits.' },
      { time: '6:00 AM', text: 'The daily trends check suggests two topics rising in your target country.' },
      { time: '7:00 AM', text: 'A new blog post on one of them is committed to your repository.' },
      { time: '10:00 AM', text: 'You open the dashboard and see your slowest page and the exact fix.' },
    ],
    vsManual: [
      { task: 'Finding SEO issues', manual: 'Paid audit once a year', agent: 'Continuous, per page' },
      { task: 'Measuring page speed', manual: 'Test a few pages by hand', agent: 'Every page, real visits' },
      { task: 'Fixing tag issues', manual: 'Developer ticket', agent: 'Auto-injected where possible' },
      { task: 'Publishing blog posts', manual: 'Months between posts', agent: 'Scheduled to your repo' },
    ],
  },

  calendar: {
    title: 'The practical guide to online appointment booking',
    sections: [
      {
        q: 'What is appointment booking software?',
        a: [
          'Appointment booking software gives you a link where people pick a free time in your calendar and book it themselves. It removes the back-and-forth of “does Tuesday work?” and makes sure nobody books a slot you’re already busy.',
          'Schedula connects to Google Calendar in both directions, adds a Google Meet link to every booking and lets you embed the booking page on your website.',
        ],
      },
      {
        q: 'How does two-way Google Calendar sync work?',
        a: [
          'Your existing events in Google Calendar block those times on your booking page, and every new booking is added to your Google Calendar. You manage one calendar, and your availability is always accurate.',
          'Set weekly working hours on top, so people can only book within the times you choose.',
        ],
      },
      {
        q: 'How do I reduce no-shows?',
        a: [
          'Ask a couple of intake questions so people commit a little effort, set a minimum notice period so bookings aren’t made five minutes before, and send a short reminder before the meeting.',
          'Schedula handles the questions and notice period. For reminders, pair it with Nexa on WhatsApp or Mailo by email.',
        ],
      },
      {
        q: 'Should I embed the booking page or share a link?',
        a: [
          'Both. Share the link in emails, WhatsApp chats and your social profiles. Embed it on your website’s contact or pricing page, where visitors are already deciding, so they can book without leaving.',
          'Schedula supports an inline embed and a popup widget, styled with your branding.',
        ],
      },
      {
        q: 'How many meeting types should I offer?',
        a: [
          'Usually two or three: a short intro call, a longer consultation or demo, and perhaps a follow-up. Too many choices slow people down.',
          'Give each one a clear name and duration, like “15-minute intro call”, and ask only the questions you really need.',
        ],
      },
    ],
    day: [
      { time: '10:20 AM', text: 'A lead from your WhatsApp campaign clicks the booking link and picks Thursday at 11.' },
      { time: '10:20 AM', text: 'The meeting appears in your Google Calendar with its Google Meet link.' },
      { time: '3:00 PM', text: 'A website visitor books a demo through the embedded widget.' },
      { time: 'Thursday', text: 'You open your calendar and join the call. No emails needed.' },
    ],
    vsManual: [
      { task: 'Agreeing a time', manual: 'Several messages', agent: 'One link' },
      { task: 'Avoiding double-booking', manual: 'Check calendars by hand', agent: 'Two-way Google sync' },
      { task: 'Sending the video link', manual: 'Easy to forget', agent: 'Added automatically' },
      { task: 'Booking from your site', manual: 'Contact form and wait', agent: 'Embedded booking' },
    ],
  },
};
