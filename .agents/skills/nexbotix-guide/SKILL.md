---
name: nexbotix-guide
description: >-
  Comprehensive project guide detailing E2EE Trading structures, S3 regional proxies,
  Freelancer bidding views, and add-on registration lifecycle protocols.
---

# NexBotix Codebase Guide & Technical Reference

This guide serves as the official reference for the NexBotix platform architecture, security models, custom workflows, and code integration checklists.

---

## 1. AI Trading Workspace (E2EE)

The AI Trading Workspace is built on a **Bring-Your-Own-Key (BYO-Key)** model utilizing **End-to-End Encryption (E2EE)** to ensure user credential privacy.

### A. Client-Side Cryptography (`crypto.ts`)
* Uses the browser's native **Web Crypto API** to encrypt/decrypt sensitive credentials (e.g. Zerodha API Key, Secret, and Access Tokens).
* Derives a 256-bit key from a user-provided 6-digit **Trading PIN** using **PBKDF2** with 100,000 iterations and SHA-256 hashing.
* Encrypts the payload using **AES-GCM (256-bit)**. 
* Plaintext credentials and access tokens are **never** stored in MongoDB or written to server logs.

### B. Redirect URL & Authorization Flow
* Users register their personal developer app at `https://kite.trade` setting the **Redirect URL** to:
  `window.location.origin + "/trading"` (e.g., `https://nexbotix.online/trading`).
* Zerodha redirects the authenticated session to our page with the parameter `?request_token=XXXXXX`.
* A `useEffect` hook in [`TradingWorkspacePage.tsx`](file:///root/project/nextbotix/whatsapp-bulk-ui/src/pages/trading/TradingWorkspacePage.tsx) auto-detects this parameter, prompts the user to enter their Trading PIN, decrypts the stored `api_secret` in-browser, and dispatches the proxy exchange.
* The proxy exchange resolves CORS restrictions by posting to `/api/trading/broker/exchange` (hosted on the Python service) to acquire the `access_token` server-to-server.
* Once returned, the `access_token` is E2E encrypted in the browser and stored securely in MongoDB.

---

## 2. Freelancer Bidding Workspace

The Freelancer Workspace implements auto-scheduler engines to bid on lead opportunities.

### Frontend Pages & Tabs Layout (`src/pages/freelancer`)
* [`FreelancerPage.tsx`](file:///root/project/nextbotix/whatsapp-bulk-ui/src/pages/freelancer/FreelancerPage.tsx): Main landing page.
* [`FreelancerConfigTab.tsx`](file:///root/project/nextbotix/whatsapp-bulk-ui/src/pages/freelancer/FreelancerConfigTab.tsx): Credentials configuration.
* [`FreelancerBotTab.tsx`](file:///root/project/nextbotix/whatsapp-bulk-ui/src/pages/freelancer/FreelancerBotTab.tsx): Bidding templates and active criteria.
* [`FreelancerApprovalsTab.tsx`](file:///root/project/nextbotix/whatsapp-bulk-ui/src/pages/freelancer/FreelancerApprovalsTab.tsx): Approval queue for manual-review bidding options.
* [`FreelancerHistoryTab.tsx`](file:///root/project/nextbotix/whatsapp-bulk-ui/src/pages/freelancer/FreelancerHistoryTab.tsx): Log of past bid execution results.

---

## 3. S3 Regional Attachment View Proxy

To bypass AWS private S3 bucket access restrictions (which block direct HTML attachments in campaign emails), we stream files securely through our Go server.

### View Proxy Handler (`GET /api/email/deck/view`)
* Rewrites raw S3 URLs in mail campaigns to our public proxy:
  `https://api.nexbotix.online/api/email/deck/view?userId=...&file=...`
* Download streams files using server AWS keys from region `eu-north-1` (the actual location of the `mother-child-s3` bucket) and returns them inline with correct headers:
  `Content-Disposition: inline`
  `Content-Type: application/pdf`

---

## 4. LinkedIn Markdown Sanitizer

To prevent the LLM from outputting image descriptions or visual placeholders directly into the text body of live LinkedIn posts:
* The Go backend runs a `stripMarkdown` regular expression filter inside `linkedin_bot.go`.
* Matches and removes bracketed visual placeholders like `[Image Description: ...]`, `(Image Description: ...)`, `[Visual: ...]`, `[Graphic: ...]`, and lines starting with `Image Description:` before pushing the post body to LinkedIn.

---

## 5. Add-on Lifecycle Checklist

When adding a new workspace module:
1. **Pricing Table**: Register service metadata in `SVC_META`, include it in the `Ultimate` combo plan list in `COMBO_DEFS`, and add the Lucide icon to the local `MAP` in `SubscriptionPage.tsx`.
2. **Admin Panel**: Add the service ID to `ALL_SERVICES` and configure toggle buttons under the details viewer inside `AdminPanel.tsx`.
3. **Plan Seeding**: Update the `solo()` plans and include the new service ID in the `trial`, `free`, and `admin_all` lists inside `cmd/seed_plans/main.go` to ensure new features automatically apply to users during their 3-day free trials.
