---
title: "How to Send OTP Codes on WhatsApp with an API: A Step-by-Step Guide"
metaTitle: "Send OTP Codes on WhatsApp with an API (Step by Step) | NexBotix"
metaDescription: "Send one-time passwords over WhatsApp from your backend: generate and store codes safely, call the NexBotix API, handle errors and know when to use the Cloud API."
excerpt: "WhatsApp is a natural place to deliver login and verification codes. This guide shows how to generate OTPs safely, send them through the NexBotix API, and build a fallback."
publishedAt: 2026-06-30
updatedAt: 2026-10-14
category: "Developer Guides"
hub: whatsapp
tags: ["OTP", "WhatsApp API", "verification", "developers"]
image: /blog/og/step-by-step-guide-automating-otp-delivery-whatsapp-api.png
imageAlt: "A verification code arriving as a WhatsApp message"
tldr:
  - "Generate OTPs on your server with a secure random generator, store only a hash, expire them in a few minutes and limit attempts."
  - "Send the code with one POST request to https://nexbotix.online/api/v1/send using your X-API-Key header."
  - "For production authentication at scale, use the WhatsApp Business Cloud API with an approved authentication template, and keep SMS or email as a fallback."
faq:
  - q: "Can I send OTP codes on WhatsApp?"
    a: "Yes. Your backend generates the code and calls the NexBotix API with the phone number and message. The code arrives as a WhatsApp message from your connected number."
  - q: "How long should a WhatsApp OTP be valid?"
    a: "A few minutes is typical, often five to ten. Short expiry plus a limit on attempts makes codes much harder to guess or reuse."
  - q: "Should I store OTP codes in my database?"
    a: "Store a hash of the code, not the code itself, along with the phone number, expiry time and attempt count. Delete or invalidate it once used."
  - q: "What phone number format does the API expect?"
    a: "Digits with the country code and no plus sign or spaces, for example 919876543210 for an Indian number."
  - q: "Should I use my personal WhatsApp number for OTPs?"
    a: "It is fine for testing and small volumes. For production login flows, use the official WhatsApp Business Cloud API with an approved authentication template for reliability."
---

Codes sent by SMS are slow in some countries, cost more than people expect and are easy to miss. Many users already have WhatsApp open, which makes it a convenient channel for login and verification codes.

This guide shows the full flow: generating the code safely, sending it through the NexBotix API, verifying it, and planning for failures.

## How does WhatsApp OTP delivery work?

The flow has four steps:

1. The user enters their phone number in your app.
2. Your server generates a one-time code, stores a hash of it with an expiry time, and sends the code to WhatsApp through the API.
3. The user types the code into your app.
4. Your server checks the code against the stored hash, the expiry time and the attempt count, then marks it as used.

The messaging part is one HTTP request. The security lives in steps 2 and 4, on your server.

## Step 1: Get an API key

Create an API key in the NexBotix **Developer Hub**. Keys start with `nex_`. Store it in an environment variable, never in your front-end code:

```bash
NEXBOTIX_API_KEY=nex_your_key_here
```

Make sure your WhatsApp number is connected in the dashboard. Messages are sent from it.

## Step 2: Generate and store the code safely

Use a cryptographically secure random generator, not `Math.random()`:

```js
import { randomInt, createHash } from 'node:crypto';

const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
const codeHash = createHash('sha256').update(code + process.env.OTP_PEPPER).digest('hex');

await db.otp.upsert({
  phone,                      // e.g. "919876543210"
  codeHash,
  expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  attempts: 0,
});
```

Store the hash, the expiry and an attempt counter. Never log the plain code.

## Step 3: Send the code with the API

Send a single message with `POST /api/v1/send`:

```js
const res = await fetch('https://nexbotix.online/api/v1/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.NEXBOTIX_API_KEY,
  },
  body: JSON.stringify({
    phone,
    message: { text: `Your verification code is ${code}. It expires in 5 minutes. Don't share it with anyone.` },
  }),
});

if (!res.ok) throw new Error(`OTP send failed: ${res.status}`);
```

Phone numbers are digits with the country code and no `+` or spaces. Keep the message short and include the expiry and a “don’t share” warning.

## Step 4: Verify the code

```js
const record = await db.otp.find({ phone });
if (!record || record.expiresAt < Date.now()) return fail('Code expired');
if (record.attempts >= 5) return fail('Too many attempts');

const hash = createHash('sha256').update(input + process.env.OTP_PEPPER).digest('hex');
if (hash !== record.codeHash) {
  await db.otp.update({ phone, attempts: record.attempts + 1 });
  return fail('Incorrect code');
}

await db.otp.delete({ phone }); // one-time means one time
return ok();
```

## Step 5: Protect the endpoint

OTP endpoints are a favourite target for abuse, because each request sends a message on your account. Add:

- **Rate limits per phone number and per IP**, for example one code per minute and a handful per hour.
- **A CAPTCHA or similar check** on the form that requests codes.
- **Resend cooldowns** in your UI, so impatient users don’t trigger five codes.

## Step 6: Plan for failures

No channel delivers 100% of the time. Handle errors from the API, show the user a clear message, and offer a fallback after a short wait: “Didn’t get it? Send by SMS or email instead.” The NexBotix email API (`POST /api/v1/email/send`) works with the same API key if email is your fallback.

## Personal number or WhatsApp Business Cloud API?

Sending OTPs from a number connected by QR code is quick to set up and fine for testing, internal tools and small volumes.

For a production login flow, use the **WhatsApp Business Cloud API**. Meta provides authentication message templates for exactly this purpose, delivery is designed for business volumes, and your personal number isn’t at risk. See the trade-offs in our [bulk WhatsApp guide](/blog/bulk-whatsapp-messaging-best-practices-avoid-bans).

## Prefer to let an AI agent send messages?

If you’re building with Claude, Cursor or Windsurf, the [WhatsApp MCP server](/blog/whatsapp-mcp-server-control-whatsapp-from-ai-agents) exposes `send_whatsapp_message` and scheduling tools to your agent. For code-triggered messages like OTPs, the REST API above is the right fit. Full reference: [API docs](/docs).
