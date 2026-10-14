---
title: "How to Check Your WhatsApp Bot Is Working: A Testing and Monitoring Checklist"
metaTitle: "Check Your WhatsApp Bot: Testing & Monitoring Checklist | NexBotix"
metaDescription: "A practical checklist to test a WhatsApp AI bot before launch and keep it healthy after: connection checks, test conversations, handoff tests and bot detection."
excerpt: "A WhatsApp bot that silently stops replying costs you customers you never hear about. Use this checklist to test it before launch and keep an eye on it afterwards."
publishedAt: 2026-07-04
updatedAt: 2026-10-14
category: "Developer Guides"
hub: whatsapp
tags: ["WhatsApp bot", "testing", "monitoring", "bot detection"]
image: /blog/whatsapp_bot_hero.jpg
imageAlt: "Checking the status of a WhatsApp AI bot on a dashboard"
tldr:
  - "Test a WhatsApp bot like a customer would: from a different phone, with real questions, edge cases and handoff keywords."
  - "Most bot failures are a disconnected WhatsApp session, an expired plan or missing business details, so check those first."
  - "After launch, check the connection, review real conversations weekly and watch the bot detection logs for other bots messaging you."
faq:
  - q: "Why did my WhatsApp bot stop replying?"
    a: "The usual causes are a disconnected WhatsApp session (the phone logged out or lost the linked device), an expired subscription or used-up reply quota, the contact being on the excluded list, the message arriving outside operating hours, or co-pilot mode waiting because you replied recently."
  - q: "How do I test my WhatsApp bot?"
    a: "Message it from a different phone number, ask the questions customers really ask, try a handoff keyword, and test a message outside your operating hours. Check each reply against your business details."
  - q: "Can I check the bot’s status from code?"
    a: "Yes. Through the MCP server, an AI agent can call the get_bot_status tool to check whether your WhatsApp connection and bot are running."
  - q: "What is bot detection?"
    a: "It flags contacts that send more messages per hour than a limit you set, which usually means an automated sender. It stops two bots replying to each other in an endless loop."
---

The worst thing a WhatsApp bot can do is stop replying without anyone noticing. Customers don’t complain; they just message a competitor. A short test before launch and a few checks afterwards prevent that.

## Why do WhatsApp bots stop working?

In our experience the causes are almost always simple:

- **The WhatsApp session disconnected.** Linked devices can be logged out from the phone, or drop after the phone has been offline for a long time.
- **The plan ran out.** An expired subscription or a used-up reply quota stops auto-replies.
- **The settings are doing their job.** The contact is on the excluded list, the message came outside operating hours, or co-pilot mode is waiting because you replied recently.
- **The bot has nothing to go on.** An empty description or no services means weak, vague answers.

So when something seems wrong, check those four things before anything else.

## How should I test the bot before launch?

Use a phone number that is *not* the one connected to the bot, and work through this list:

1. **Greeting.** Send “Hi”. Does the reply make clear who it is and what it can help with?
2. **Top five questions.** Ask the five questions customers ask most, in the words they use: prices, hours, location, delivery, booking.
3. **Something it shouldn’t know.** Ask about a product you don’t sell. A good bot says it doesn’t know or offers to connect you, rather than inventing an answer.
4. **Links.** Ask to book or buy. Does it share the right booking or store link?
5. **Handoff.** Use one of your handoff keywords, like “I want to speak to someone”. Does the chat reach your human agent number?
6. **Excluded number.** Message from a number on the excluded list. The bot should stay silent.
7. **Outside hours.** If you set operating hours, send a message outside them and confirm the behaviour is what you expect.
8. **Co-pilot mode.** Reply to a test chat yourself, then send another message. The bot should wait for the idle time before stepping in.

Fix anything that fails by updating your business details or settings, then run the list again.

## What should I check after launch?

**Daily, at a glance:** the WhatsApp connection status in the dashboard. If you build with AI agents, the `get_bot_status` tool on the [MCP server](/blog/whatsapp-mcp-server-control-whatsapp-from-ai-agents) answers the same question, so you can ask Claude or Cursor “is my WhatsApp bot running?”.

**Weekly:** read a sample of real conversations. Look for:

- Questions the bot answered poorly. Add the missing facts to your business details.
- Handoffs that shouldn’t have happened, or that should have.
- New questions that keep coming up. They are good material for your website FAQ too.

**When you change something:** run the pre-launch checklist again after changing prices, services, hours or the prompt.

## What are the bot detection logs for?

Sometimes the “customer” on the other end is another bot: an auto-responder, a marketing tool or a spam script. Two bots replying to each other can loop for hours and burn through your reply quota.

Turn on **Smart AI Detection** and set a maximum number of messages per hour. Contacts who exceed it are flagged and recorded in the **Bot Detection Logs**, so you can see who triggered it and add them to your excluded numbers if needed.

## A simple monitoring routine

| When | Check | Where |
| --- | --- | --- |
| Every day | WhatsApp connected, plan active | Dashboard |
| Every week | 10–20 real conversations | WhatsApp workspace |
| Every week | Flagged contacts | Bot Detection Logs |
| After changes | Full pre-launch checklist | Test phone |

Ten minutes a week keeps the bot accurate and catches problems before customers do. New to bots? Start with [how to build an AI WhatsApp bot for your business](/blog/build-automated-whatsapp-bot-for-business).
