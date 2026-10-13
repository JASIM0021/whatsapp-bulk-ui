# Marblism SEO Teardown & NexBotix Execution Plan

As of 13 Oct 2026. Living copy: https://claude.ai/code/artifact/c7515b12-225e-4147-b572-22a8bbcc9440

## Executive summary

Marblism ranks on a server-rendered Next.js site that exposes 147 indexable URLs. Each URL has a unique title, description, canonical and JSON-LD. Most of its organic surface is long-form blog content (72 posts) that targets "best X", "X alternatives" and "how to" queries.

NexBotix was a Vite single-page app on Vercel: every URL returned the same empty `<div id="root">` and the homepage title, so Google saw one page, not 21. Phase 1 (done, see below) moved the public site to Next.js. Every later phase depends on it.

**What to copy from Marblism, in priority order:**

1. Server-rendered HTML with per-page metadata, canonicals and JSON-LD on every page.
2. One landing page per "AI employee" or product, each targeting a job-title keyword ("AI executive assistant", "AI sales agent").
3. A blog of 3,000–9,000-word comparison and alternatives posts with TL;DR, table of contents, author and FAQ.
4. Proof pages that also rank: reviews, customer stories, a changelog ("What's new") and an agency directory.
5. AI-search readiness: `llms.txt`, an open `robots.txt`, and a sitemap with `lastmod`.

**What not to copy:** thin legacy posts (one has a 38-character description that repeats its title), 14+ images with empty alt text on every page, and generic titles on /pricing, /features and /blog.

## Site inventory

The [sitemap](https://www.marblism.com/sitemap.xml) lists 147 URLs; 72 of them (49%) are blog posts. [robots.txt](https://www.marblism.com/robots.txt) allows everything except `/api/`, and an [llms.txt](https://www.marblism.com/llms.txt) summarises the product for AI crawlers.

| Section | URLs | URL pattern | Purpose | Copy for NexBotix |
| --- | --- | --- | --- | --- |
| Blog posts | 72 | `/blog/{keyword-slug}` | Organic traffic: "best X", "X alternatives", "how to" | Yes, core of Phase 4 |
| Product updates | 18 | `/news/{id}-{slug}` | Freshness, brand queries | Yes, as `/changelog` |
| Customer stories | 18 | `/stories/{industry}` | Proof, industry long tail | Yes, Phase 5 |
| Spanish pages | 16 | `/es/...` with hreflang | Second market | Later, optional |
| AI employee pages | 7 EN + 7 ES | `/ai-employees/{name}` | Job-title keywords | Yes, Phase 3 |
| Core pages | 9 | `/`, `/pricing`, `/features`, `/about-us`, `/reviews`, `/teams`, `/tutorial`, `/events`, `/photo-booth` | Conversion | Yes, Phase 2 |
| Partner pages | 4 | `/affiliate`, `/partners`, `/agencies`, `/partner-terms` | Backlinks, partner SEO | Phase 6 |
| Legal and trust | 3 | `/privacy-policy`, `/terms-of-service`, `/trust-center` | Trust signals | Yes |

**The seven AI employee pages:** Eva (executive assistant), Sonny (social media), Stan (sales/lead gen), Walter (website builder), Penny (SEO blog writer), Rachel (receptionist), Linda (legal).

**Blog post types, from the 72 slugs:**

| Type | Count (approx.) | Example slugs |
| --- | --- | --- |
| Competitor alternatives | 10 | `fyxer-alternatives`, `sintra-ai-alternatives`, `openclaw-alternatives`, `blaze-ai-alternatives` |
| "Best X" listicles | 10 | `best-ai-receptionist`, `best-ai-email-assistant`, `best-ai-tools-for-small-business` |
| How-to guides | 20 | `how-to-add-my-business-to-google-maps`, `how-to-verify-google-my-business`, `how-to-organize-outlook-email` |
| Definitions and comparisons | 8 | `what-is-an-ai-employee`, `ai-employees-vs-freelancers`, `virtual-assistant-cost` |
| Industry posts (real estate) | 7 | `ai-tools-for-real-estate-agents`, `why-real-estate-firms-are-replacing-receptionists-with-ai` |
| Older AI-written posts with numeric suffix | 17 | `...-what-actually-works-in-2026-42`, `...-sales-rep-to-close-10k-deals-22` |

The newest posts use short keyword slugs; the older ones carry long titles plus a random number. Use the short pattern.

Pagination is not indexed: `/blog/page/2` returns 404 (noindex), so every post must be reachable from the sitemap and internal links.

## On-page SEO teardown

Every page carries a unique title, description and self-referencing canonical, plus page-type JSON-LD.

| Page | Title (chars) | Description pattern | JSON-LD types | Words |
| --- | --- | --- | --- | --- |
| Home | AI Employees To Scale Your Business - Marblism (46) | Jobs it does + "40,000+ businesses" + "Get started free" (143) | WebPage, Organization (7 Service offers), FAQPage | 2,259 |
| Eva | AI Executive Assistant for Your Inbox & Calendar \| Marblism (63) | Keyword + social proof + outcome "Save 2+ hours a day" (152) | Product, Brand, FAQPage (7 Q), BreadcrumbList | 2,639 |
| Stan | AI Sales Agent for Outbound Sales & Lead Generation \| Marblism (66) | Keyword + "AI SDR" + "80% higher reply rates" (151) | Product, Brand, FAQPage (8 Q), BreadcrumbList | 2,660 |
| Best AI receptionist | 9 Best AI Receptionists for Small Business (2026 Review) \| Marblism (67) | "Compare the 9 best… real 2026 pricing" (151) | BlogPosting (Person author), BreadcrumbList, FAQPage, ItemList | 7,185 |
| Fyxer alternatives | 9 Best Fyxer Alternatives Compared for 2026 \| Marblism (54) | Pain points of the competitor (153) | BlogPosting, BreadcrumbList | 8,766 |
| Reviews | Marblism Reviews: Why 40,000+ Businesses Love Us (48) | "rated 4.8/5 on Trustpilot" (155) | WebPage, BreadcrumbList, FAQPage, ItemList, 13 VideoObject | 2,472 |
| About | Meet the Team Behind Marblism – 18 Humans, 7 AI Employees (68) | Founder, Y Combinator, team size (162) | WebPage, Organization | 1,570 |
| Pricing | Pricing - Marblism \| Marblism (29) | "Starting at $24/mo" (111) | WebPage, Organization | 1,690 |
| Blog index | Blog - Marblism \| Marblism (26) | Generic (72) | CollectionPage | 600 |

**Patterns to copy:**

- **Title formula:** `{Primary keyword} for {audience or outcome} | Brand`, 50–68 characters. Listicles add the count and year: `9 Best X for Y (2026 Review)`.
- **Description formula:** keyword + proof number + concrete outcome, 140–160 characters.
- **One H1 per page** matching the keyword; product pages follow H2 "Does it sound familiar?" → "Meet {name}" → "How {name} works" → testimonials → "Questions?".
- **Blog H2s** open with "TL;DR" or "Short version", then a table of contents, then question-shaped H2s. This is what AI Overviews quote.
- **Author entity:** posts name a real person with job title and LinkedIn `sameAs` (E-E-A-T).
- **Social tags:** og:image 1200×630 on every page.
- **Organization schema sitewide**, listing every product as an `Offer` with its URL.

**Weaknesses to avoid:** brand repeated in titles ("Pricing - Marblism | Marblism"); no og:image on /pricing, /features, /blog; 14–132 images per page with empty alt text; legacy descriptions that copy the title.

## Technical SEO

| Factor | Marblism | NexBotix before Phase 1 | NexBotix now |
| --- | --- | --- | --- |
| Framework | Next.js App Router | Vite + React Router SPA | Next.js 16 App Router |
| Rendering | Static prerender + ISR | Client-only, empty root div | Public pages prerendered; app client-only |
| Title per URL | Unique, server-rendered | Same homepage title everywhere | Unique (`src/seo/site.ts`) |
| Canonical | Self-referencing | None | Self-referencing |
| JSON-LD | Every page | None | Organization, WebSite, SoftwareApplication, BlogPosting, BreadcrumbList |
| Sitemap | 147 URLs with lastmod | Static, 21 URLs, 10 broken blog slugs | Generated (`app/sitemap.ts`) |
| 404 | Real 404, noindex | Redirect to `/` (soft 404) | Real 404 |
| llms.txt | Yes | Yes | Yes |

**Internal linking:** every Marblism page links ~29 shared URLs through header and footer; blog posts add 10–20 contextual links to the matching AI employee page.

**URL rules:** lowercase, hyphenated, no trailing slash, no dates in blog slugs, product noun in the path.

## Content & keyword strategy

Hub and spoke: each agent page is a hub; blog posts on the same job link back to it. Keywords are candidates; validate volumes in Phase 3.

| Hub URL | Agent in the app | Primary keyword | Spoke posts to write |
| --- | --- | --- | --- |
| `/ai-agents/whatsapp` | WhatsApp bulk + MCP | whatsapp bulk message sender | best whatsapp bulk sender, how to send bulk whatsapp without ban, wati / interakt / aisensy alternatives |
| `/ai-agents/email` | Email campaigns | ai email outreach tool | best cold email software, instantly / lemlist alternatives |
| `/ai-agents/leads` | Maps / Bing lead scraper | google maps lead scraper | how to scrape google maps leads, best lead generation tools for small business |
| `/ai-agents/website-chatbot` | Website chatbot | ai chatbot for website | best ai chatbot for small business, tidio / intercom alternatives |
| `/ai-agents/social` | Facebook + LinkedIn | ai social media manager | best ai social media tools, how to schedule facebook posts |
| `/ai-agents/seo` | SEO agent | ai seo blog writer | is ai content good for seo, best ai seo tools |
| `/ai-agents/calendar` | Booking pages | ai appointment booking | calendly alternatives, whatsapp appointment reminders |

`/agents` is already the logged-in AI Workers screen, so hubs live under `/ai-agents/`.

**Blog formats, in order of effort:** alternatives posts → "best X" listicles → how-to guides → definitions → industry pages.

**Post template:** H1 with keyword and year → TL;DR → table of contents → question-shaped H2s → comparison table → FAQ (FAQPage schema) → CTA to the hub. Named author with bio and LinkedIn. Updated date shown and in `dateModified`.

## Landing page anatomy (Marblism homepage → NexBotix)

| # | Marblism section | Job it does | NexBotix version |
| --- | --- | --- | --- |
| 1 | H1 "AI employees to scale your business" + CTA | Keyword in H1, one primary CTA | H1 with "AI employees" + WhatsApp/email/leads, "Start free" |
| 2 | Logo/rating strip | Instant trust | Channels/integrations strip (no invented ratings) |
| 3 | H2 "Stop juggling." | Pain statement | Juggling WhatsApp, email, leads by hand |
| 4 | H2 "Meet your new AI Team" | Card per agent, each linking to its hub | One card per agent |
| 5 | H2 "Growth is a system." / "Set the goal. They own it." | Outcome framing | Goal → agents run it |
| 6 | H3 × 6 job tabs | Keyword-rich H3s | H3 per job: WhatsApp campaigns, Email outreach, Lead generation, Website chatbot, Social posting, Booking |
| 7 | H2 "Watch your AI team work" | Demo video | `demo-video.mp4` + VideoObject schema |
| 8 | H2 "Built on real work, proven at scale." | Stats | Real product numbers only |
| 9 | H2 "Works with the tools you already use" | Integrations | WhatsApp, Gmail, Facebook, LinkedIn, Google Calendar, Claude/MCP |
| 10 | H2 "Employee of the Month" | Testimonials | Real reviews only |
| 11 | H2 "Scaling shouldn't be this easy" | Case studies | `/stories/*` once written |
| 12 | H2 "Questions?" | FAQ + FAQPage schema | 6–8 questions |
| 13 | H2 closing CTA | Final conversion | "Start free" |

## Phase 1: Convert the Vercel site to Next.js — DONE

Branch `feat/nextjs-seo-migration` (not pushed yet). Commits: `af70983` migration, `db5a87d` chat widget + Razorpay refund text, `9a49bc5` subscription bundle + homepage anchors.

How: the React Router app (`src/SpaApp.tsx`) renders on the server with `StaticRouter` for public pages and hydrates with `BrowserRouter`; app routes render client-only and `noindex`; unknown URLs 404.

- [x] All 21 sitemap URLs return server HTML with unique title, description, canonical
- [x] Blog posts show article text in view-source
- [x] Logged-in app tested with a real account: all 27 screens, login, logout, setup wizard, session persistence
- [x] Razorpay checkout opens with the correct live order (not paid)
- [x] Unknown URLs return 404; old blog slugs 308 to real posts
- [x] `next build` and TypeScript clean
- [ ] Vercel preview deploy (set Framework Preset to Next.js)
- [ ] One real small Razorpay payment on the preview (verifies `/api/payment/razorpay/verify`)
- [ ] Rich Results Test on `/` and one post; resubmit sitemap in Search Console

Open item: `ultimate_yr` plan is hidden in the admin plan config, so Ultimate is monthly-only. Unhide it in admin if yearly Ultimate should be sold.

## Phase 2: Landing page and core pages — DONE (except /reviews)

- [x] `/` rebuilt to the landing anatomy: 17 sections, 2,747 words (Marblism: 2,259), one H1, FAQPage + VideoObject schema
- [x] `/pricing`: new design, plan cards, "every plan includes", comparison, 8-question pricing FAQ; Offer + FAQPage schema
- [x] `/about`: team story, AI team, principles, security & privacy (team-only, no personal names by choice; unverifiable stats removed)
- [x] 1200×630 Open Graph image per page type (`public/og/*.png`, regenerate with `node scripts/og-images.mjs`)
- [x] Alt text on every image across all 21 public pages (audited in the rendered DOM)
- [ ] `/reviews`: waiting for 10+ real reviews and a Trustpilot/G2/Google profile (then add to Organization `sameAs`)

Found while doing Phase 2 (for the owner):
- The $49 Scale plan has no backend plan (`ai_agent_scale` missing from `/api/subscription/plans`); its button now goes to /contact and it is left out of the Offer schema.
- `ultimate_yr` is hidden in the admin plan config, so Ultimate is monthly-only.
- Landing shows $5 / $15; the backend prices are ₹399 / ₹1,199 per month.

## Phase 3: Agent hub pages — DONE

- [ ] Validate the seven hub keywords with Search Console or a keyword tool (not done: no keyword data source connected; titles target the phrases in the table above)
- [x] 7 hub pages at `/ai-agents/{slug}` (whatsapp, leads, email, website-chatbot, social, seo, calendar) + `/ai-agents` index
- [x] Section order: breadcrumb → hero (keyword H1) → "Does this sound familiar?" → meet the agent → 6 features (H3) → how it works → first-day checklist → example day → vs doing it by hand → use cases → long-form guide (7–8 question-shaped H3s with TOC) → what it won't do → FAQ (8–9) → related hubs
- [x] 1,400–2,200 words each (server HTML); every product claim checked against the app code
- [x] SoftwareApplication + FAQPage (matches visible FAQ) + BreadcrumbList per hub; Organization `makesOffer` lists all hubs
- [x] Linked from navbar ("AI Employees"), footer, homepage team cards and job blocks, and each hub's related section
- [x] `llms.txt` rewritten: hubs, real MCP tool names, accurate trial and pricing (old file claimed a 3-day trial, 99.99% uptime, number rotation)
- [x] Per-hub Open Graph images (`public/og/hub-*.png`)
- [ ] Add real customer reviews to each hub once available (Marblism's product pages are ~2,600 words partly because of testimonials)

## Phase 4: Blog engine and content

- [ ] Move posts from `blogPosts.ts` to MDX or a CMS
- [ ] Post template: TL;DR, TOC, author box, updated date, FAQ, CTA to hub
- [ ] Rewrite the existing 10 posts; publish 2 a week
- [ ] Category pages `/blog/category/{hub}`
- [ ] Generate RSS from the same data

## Phase 5: Proof, freshness and AI search

- [ ] `/stories/{industry}` case studies
- [ ] `/changelog` with one page per release
- [ ] `/vs/{competitor}` comparison pages
- [ ] Expand `llms.txt`; allow GPTBot, ClaudeBot, PerplexityBot, Google-Extended
- [ ] 40–60-word answer paragraphs under question-shaped H2s

## Phase 6: Authority and monitoring

- [ ] Affiliate/partner pages
- [ ] G2, Capterra, Product Hunt, Trustpilot listings in `sameAs`
- [ ] Optional second locale with hreflang
- [ ] Monthly Search Console + Core Web Vitals review; refresh top posts every 6 months

## KPIs

| KPI | Where to measure | Baseline | Target after Phase 4 |
| --- | --- | --- | --- |
| Indexed pages | Search Console → Pages | Likely 1–2 before Phase 1 | All sitemap URLs |
| Pages with unique title + canonical | `curl` each sitemap URL | 0 of 21 → 21 of 21 | 100% |
| Non-brand clicks / month | Search Console → Performance | Record at deploy | Rising month on month |
| Valid rich results | Search Console → Enhancements | 0 | Every hub and post |
| Core Web Vitals | PageSpeed Insights / CrUX | Record at deploy | All "good" |
| Published posts | Sitemap count | 10 | 40+ |
