---
title: "WhatsApp MCP Server: How to Send WhatsApp Messages from Claude, Cursor and Windsurf"
metaTitle: "WhatsApp MCP Server for Claude, Cursor & Windsurf | NexBotix"
metaDescription: "Connect Claude Desktop, Cursor or Windsurf to WhatsApp with the NexBotix MCP server. Setup in 5 minutes, the 6 tools it exposes, and safe ways to use it."
excerpt: "Give your AI agent a WhatsApp tool. This guide shows how to connect Claude Desktop, Cursor or Windsurf to WhatsApp through the NexBotix MCP server, what the agent can do, and how to keep it safe."
publishedAt: 2026-07-06
updatedAt: 2026-10-14
category: "AI Agents & MCP"
hub: whatsapp
tags: ["MCP", "Claude Desktop", "Cursor", "WhatsApp API", "AI agents"]
image: /blog/mcp_whatsapp_hero.jpg
imageAlt: "An AI agent sending a WhatsApp message through the Model Context Protocol"
featured: true
tldr:
  - "The NexBotix MCP server lets AI agents like Claude Desktop, Cursor and Windsurf send and schedule WhatsApp messages and emails with plain-language instructions."
  - "Setup takes one config block: the endpoint https://nexbotix.online/api/mcp plus your API key in an X-API-Key header."
  - "It exposes six tools: send, schedule, list and cancel WhatsApp messages, send email, and check the bot status."
faq:
  - q: "What is a WhatsApp MCP server?"
    a: "It is a server that exposes WhatsApp actions, such as sending or scheduling a message, as tools an AI agent can call through the Model Context Protocol. The agent decides when to use a tool based on your instructions."
  - q: "Which AI tools work with the NexBotix MCP server?"
    a: "Any MCP client that supports remote servers. Claude Desktop connects through the mcp-remote package, and Cursor and Windsurf connect to the URL directly with a header."
  - q: "Do I need a paid plan?"
    a: "You need a NexBotix account with an API key from the Developer Hub. API keys created during the free trial stop working when the trial ends."
  - q: "Can the agent read my WhatsApp messages?"
    a: "No. The six tools send, schedule, list and cancel messages, send email and check the bot status. There is no tool to read your chats."
  - q: "Is it safe to let an AI send WhatsApp messages?"
    a: "Treat it like any automation: keep your API key secret, ask the agent to confirm before sending, start with test numbers, and only message people who expect to hear from you."
---

AI agents are good at deciding *what* to do. The Model Context Protocol (MCP) gives them a standard way to actually *do* it, by calling tools. The NexBotix MCP server adds WhatsApp and email to that toolbox, so you can tell Claude “remind the three clients with meetings tomorrow on WhatsApp” and it can carry that out.

This guide covers what the server does, how to connect your agent in about five minutes, and how to use it safely.

## What is the NexBotix WhatsApp MCP server?

It is a remote MCP endpoint at `https://nexbotix.online/api/mcp` that uses the Streamable HTTP transport. When an MCP client connects, it discovers six tools and their parameters automatically. Your agent can then call them whenever your instructions call for it, without you writing any API code.

Behind the tools is your own NexBotix account: the WhatsApp number you connected and the email account you set up. Messages go out from your accounts, exactly as if you had sent them from the dashboard.

## Which tools does it expose?

| Tool | What it does |
| --- | --- |
| `send_whatsapp_message(phone, message)` | Sends a WhatsApp message now |
| `schedule_whatsapp_message(phone, message, schedule_at)` | Queues a message for a future time (ISO 8601, UTC) |
| `list_scheduled_messages()` | Lists messages waiting to be sent |
| `cancel_scheduled_message(job_id)` | Cancels a pending message |
| `send_email(to, subject, body, isHtml)` | Sends an email from your connected account |
| `get_bot_status()` | Reports whether your WhatsApp connection and bot are up |

There is deliberately no tool for reading your chats. The agent can act on your behalf, but it can’t browse your conversations.

## How do I connect Claude Desktop?

First create an API key in the NexBotix **Developer Hub**. Keys start with `nex_`. Then add this to `claude_desktop_config.json` and restart Claude Desktop:

```json
{
  "mcpServers": {
    "nexbotix": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://nexbotix.online/api/mcp", "--header", "X-API-Key: nex_your_key_here"]
    }
  }
}
```

Claude Desktop talks to local processes, so `mcp-remote` bridges it to the remote server. Once Claude restarts, you should see the NexBotix tools in its tool list.

## How do I connect Cursor or Windsurf?

Clients that support remote MCP servers can connect to the URL directly. In Cursor, add this to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "nexbotix-agent": {
      "url": "https://nexbotix.online/api/mcp",
      "headers": { "X-API-Key": "nex_your_key_here" }
    }
  }
}
```

Windsurf uses the same idea: a server entry with the URL and the `X-API-Key` header. Keep the key out of shared repositories; use your editor’s user-level config or an environment variable.

## What can I actually do with it?

A few patterns work well from day one:

- **Meeting reminders.** “Look at the meetings I pasted and schedule a WhatsApp reminder to each client one hour before.” The agent calls `schedule_whatsapp_message` once per client.
- **Deploy or monitoring alerts.** In Cursor, ask the agent to message you on WhatsApp when a long task finishes or a test suite fails.
- **Follow-ups from a list.** Paste a short list of leads and ask for a personalised first message to each, sent tomorrow at 10 AM.
- **Clean-up.** “Show me what’s scheduled for Friday and cancel anything for the Mumbai office.” The agent combines `list_scheduled_messages` and `cancel_scheduled_message`.
- **Health checks.** Ask “is my WhatsApp bot running?” and the agent calls `get_bot_status`.

For bulk campaigns to hundreds of people, the dashboard or the REST API is the better tool: you get file upload, spacing between messages and follow-ups. MCP shines for small, specific actions that come out of a conversation.

## How do I keep it safe?

An agent with a send tool can make mistakes quickly, so set a few rules:

1. **Ask for confirmation.** Tell the agent to show you every message and number before sending. Most clients also ask you to approve each tool call.
2. **Test on your own number first** before letting it message customers.
3. **Protect the API key.** Anyone with it can send from your account. Rotate it in the Developer Hub if it leaks.
4. **Only message people who expect it.** The same rules as any WhatsApp sending apply; see our [guide to bulk messaging without bans](/blog/bulk-whatsapp-messaging-best-practices-avoid-bans).

## MCP or the REST API?

Use **MCP** when a person is talking to an AI agent and the agent should be able to send messages as part of the conversation. Use the **REST API** (`POST /api/v1/send`) when your own code sends messages on a trigger, such as an order confirmation or an [OTP](/blog/step-by-step-guide-automating-otp-delivery-whatsapp-api). Both use the same API key and the same account. Full details are in the [API docs](/docs).

New to MCP itself? Start with [Model Context Protocol explained](/blog/model-context-protocol-mcp-explained-new-era-ai-agents).
