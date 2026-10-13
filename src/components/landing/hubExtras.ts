// Extra depth for the hub pages: more guide sections, a getting-started
// checklist and extra FAQs. Same rules as hubGuides.ts and hubContent.ts.

export interface HubExtra {
  sections: { q: string; a: string[] }[];
  checklist: string[];
  faq: { q: string; a: string }[];
}

export const HUB_EXTRAS: Record<string, HubExtra> = {
  whatsapp: {
    sections: [
      {
        q: 'How do I build a WhatsApp contact list the right way?',
        a: [
          'Collect numbers from people who already deal with you: customers at checkout, enquiries, bookings, event sign-ups and your website chat. Ask permission in plain words, like “Can we send you offers on WhatsApp?”.',
          'Keep the list in a spreadsheet with a name column and a phone column that includes the country code. Add columns for anything you want to personalise, such as city, last purchase or course name, and NexBotix can use them in your message.',
        ],
      },
      {
        q: 'How do I measure a WhatsApp campaign?',
        a: [
          'Count three things: how many messages were sent, how many people replied, and how many replies turned into a sale, booking or next step. Replies matter more than sends, because they show the message landed.',
          'Compare campaigns over time. If one offer or opening line gets twice the replies, use it as your template. Saved templates in NexBotix make it easy to reuse what works.',
        ],
      },
    ],
    checklist: [
      'Export your customer list to Excel or CSV with names and phone numbers including country code',
      'Scan the QR code to connect your WhatsApp number',
      'Fill in your business name, description, services and booking or store link for the AI',
      'Write a short, personal first message and test it on a few friendly contacts',
      'Schedule the campaign and switch on AI replies and follow-ups',
    ],
    faq: [
      { q: 'Can I send images and links in bulk WhatsApp messages?', a: 'Yes. Attach a JPG, PNG, GIF or WebP image up to 10 MB, or paste an image URL, and add a link that appears at the end of your message.' },
      { q: 'Can I send more than one message in a campaign?', a: 'Yes. Add another message to send a short sequence, for example a greeting followed by an image and a link.' },
    ],
  },
  leads: {
    sections: [
      {
        q: 'Google Maps or Bing Maps: which has better leads?',
        a: [
          'Neither is complete on its own. Many businesses update their Google listing and forget Bing, while others appear on Bing with details missing from Google. Searching both finds more businesses and fills more gaps.',
          'That is why Scrappy balances lead volume 50/50 between the two by default, and removes businesses that appear on both so you never pay for the same lead twice.',
        ],
      },
      {
        q: 'What can I do with leads besides cold outreach?',
        a: [
          'Use them to size a market before you launch in a new city, to find partners and suppliers, to plan a sales territory or to research competitors in your category.',
          'Ratings and reviews also tell you which businesses are growing and which may need help, which is useful if you sell services like marketing or software.',
        ],
      },
    ],
    checklist: [
      'Write down your ideal customer: business type, size and city',
      'Claim your 10 free trial leads and check their quality',
      'Describe your company and offer so the AI can write first messages',
      'Start in co-pilot mode and approve the first drafts yourself',
      'Turn on daily autopilot extraction and weekly follow-ups once replies come in',
    ],
    faq: [
      { q: 'Can I export the leads?', a: 'Yes. Your stored leads are in the leads database, and you can send them straight into a WhatsApp or email campaign.' },
      { q: 'Which other sources can I search?', a: 'Besides Google Maps and Bing Maps, you can find e-commerce brands through Trustpilot and app publishers through the Google Play Store.' },
    ],
  },
  email: {
    sections: [
      {
        q: 'Why do my emails go to spam?',
        a: [
          'Usually because the domain isn’t authenticated, the list contains old or invalid addresses, or the email looks like a mass promotion: big images, lots of links, spammy words and no plain text.',
          'Set up SPF, DKIM and DMARC, remove bounced addresses, write like a person and include an easy way to unsubscribe. Sending from your own mailbox, as NexBotix does, also helps because replies and engagement build your reputation.',
        ],
      },
      {
        q: 'What should a newsletter for a small business include?',
        a: [
          'One main story or offer, one useful tip, and one clear action. Short, regular newsletters are read more than long, rare ones.',
          'Save your layout as an HTML template so each issue only needs new words, and let the re-targeting segments handle the follow-ups.',
        ],
      },
    ],
    checklist: [
      'Connect Gmail, Outlook or your SMTP server and send a test email',
      'Add your email signature and, if you have one, your company brochure',
      'Import or paste your recipients and choose a template',
      'Send to a small segment first, check opens and clicks',
      'Follow up with “never opened” and “didn’t click” segments a few days later',
    ],
    faq: [
      { q: 'Can I attach my brochure automatically?', a: 'Yes. Upload your company deck or brochure and turn on auto-attach so it goes with every email.' },
      { q: 'Can I schedule email campaigns?', a: 'Yes. Write the campaign and choose a send time; it goes out automatically.' },
    ],
  },
  'website-chatbot': {
    sections: [
      {
        q: 'Chatbot or live chat: which is better?',
        a: [
          'Live chat is great when someone is online, and frustrating when nobody is. An AI chatbot answers instantly at any hour and handles the common questions, while people take the conversations that need judgement.',
          'Most small businesses get the best of both by letting the chatbot answer first and collect contact details, then following up personally on the leads it captures.',
        ],
      },
      {
        q: 'What should the welcome message say?',
        a: [
          'Say who it is, what it can help with and invite a question. For example: “Hi, I’m the assistant for Acme Café. Ask me about our menu, delivery areas or catering.”',
          'Avoid generic greetings like “How can I help?” on their own. Telling visitors what to ask gets more conversations started.',
        ],
      },
    ],
    checklist: [
      'Try the free demo on your own website',
      'Sign up and let the chatbot crawl your domain',
      'Add your services, a welcome message and any rules',
      'Paste the script into your site and test a few questions',
      'Check the leads page daily and follow up with new contacts',
    ],
    faq: [
      { q: 'Does the chatbot work on mobile?', a: 'Yes. The widget appears on desktop and mobile versions of your site once the script is installed.' },
      { q: 'Can I change the chatbot’s personality?', a: 'Yes. Use the custom AI prompt to give it personality traits, rules and instructions, such as tone of voice or topics to avoid.' },
    ],
  },
  social: {
    sections: [
      {
        q: 'LinkedIn or Facebook: where should my business post?',
        a: [
          'Post where your customers spend time. LinkedIn suits B2B, consulting, recruitment and founder-led brands. Facebook Pages suit local businesses, community groups and consumer offers.',
          'Many businesses use both: LinkedIn for expertise and trust, Facebook for offers and updates. NexBotix lets you run both from one workspace.',
        ],
      },
      {
        q: 'Should I use AI images in posts?',
        a: [
          'Images make posts stand out in a busy feed, and AI images are a fast way to get one when you don’t have a photo. Keep them simple and relevant to the post.',
          'Real photos of your team, products and work still build the most trust, so mix them in when you can.',
        ],
      },
    ],
    checklist: [
      'Connect your Facebook Pages and LinkedIn account',
      'Add 5–10 content keywords you want to be known for',
      'Write a short persona describing your tone, or use the config assistant',
      'Keep approval by email on for the first week',
      'Review Facebook analytics weekly and adjust your topics',
    ],
    faq: [
      { q: 'Can I add a call to action to every post?', a: 'Yes. Add a short line, such as an offer or a link, and it is woven into every auto-generated LinkedIn post.' },
      { q: 'How many LinkedIn posts can it publish per day?', a: 'You choose the number of posts per day, the time of the first post and the gap between posts.' },
    ],
  },
  seo: {
    sections: [
      {
        q: 'What should I fix first?',
        a: [
          'Start with what affects every page: slow loading, missing titles and descriptions, and broken pages. Then work on your most important pages, like the homepage, product pages and pricing.',
          'Seona’s overview score and per-page analysis show which pages have the most issues and the worst Web Vitals, so you can work from the top of the list.',
        ],
      },
      {
        q: 'How do I pick blog topics that bring traffic?',
        a: [
          'Write about the questions your customers ask and the problems your product solves, using the words they would type into Google. Trending topics add timely posts on top of that steady base.',
          'Add your own keywords and target countries in Seona. It combines them with Google Trends to choose topics for the blog bot.',
        ],
      },
    ],
    checklist: [
      'Add the tracking script to your site’s head and test the connection',
      'Review the overview score and your slowest pages',
      'Turn on auto-fix for script-fixable issues',
      'Choose target countries and keywords for trends',
      'Connect your GitHub repository and enable the blog bot',
    ],
    faq: [
      { q: 'Do I need a developer to install it?', a: 'No. Paste one script tag into your site’s head, which most website builders allow in their settings. A developer helps for the code fixes Seona suggests.' },
      { q: 'Can I pause tracking?', a: 'Yes. Pause collection from the dashboard without removing the script.' },
    ],
  },
  calendar: {
    sections: [
      {
        q: 'What time zone do bookings use?',
        a: [
          'You set your own time zone for working hours. Visitors see available times on the booking page and pick the one that suits them.',
          'This matters if you work with clients abroad: set your hours once and let the booking page show the free slots.',
        ],
      },
      {
        q: 'How do I connect bookings to my other tools?',
        a: [
          'Use webhook notifications to send each new booking to your CRM, spreadsheet or automation tool.',
          'Inside NexBotix, leads from WhatsApp, email and the website chatbot can be sent your booking link, so a conversation turns into a meeting in one step.',
        ],
      },
    ],
    checklist: [
      'Connect your Google account for calendar sync',
      'Set your weekly working hours and time zone',
      'Create one or two event types with clear names and durations',
      'Add a minimum notice period and a couple of intake questions',
      'Share your link and embed the widget on your contact page',
    ],
    faq: [
      { q: 'Can I limit how far ahead people book?', a: 'Yes. Set a maximum advance booking window as well as a minimum notice period.' },
      { q: 'Can I see all my bookings in one place?', a: 'Yes. The bookings tab lists every upcoming meeting.' },
    ],
  },
};

// The FAQ shown on a hub page (and in its FAQPage JSON-LD): core + extras.
export const hubFaq = (hub: { slug: string; faq: { q: string; a: string }[] }) => [
  ...hub.faq,
  ...(HUB_EXTRAS[hub.slug]?.faq ?? []),
];
