import { useState } from 'react';
import {
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Terminal,
  Zap,
  Shield,
  AlertCircle,
  Clock,
  Bot,
  Mail,
  MessageSquare,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

// ─── AI Agent Prompt ───────────────────────────────────────────────────────────

const AI_AGENT_PROMPT = `You are helping me integrate with the NexBotix API.

## Environment Setup (do this first)
Add the following variable to your .env file:

  NEXBOTIX_API_KEY=bsk_your_key_here

Then load it in your code:
  - Node.js / Next.js:  process.env.NEXBOTIX_API_KEY
  - Python:             os.environ["NEXBOTIX_API_KEY"]
  - Go:                 os.Getenv("NEXBOTIX_API_KEY")
  - PHP:                $_ENV["NEXBOTIX_API_KEY"]
  - Ruby:               ENV["NEXBOTIX_API_KEY"]

Never hardcode the key in source code or commit it to a repository.
Get your actual key from: Dashboard → Subscription → Developer API.

## Base URL
https://nexbotix.online

## Authentication
Every API request must include the header:
  X-API-Key: <value of NEXBOTIX_API_KEY>   (keys start with bsk_)

---

## 1. WhatsApp Messaging API
- Single Message: POST /api/v1/send
  { "phone": "919876543210", "message": { "text": "Hello!" } }

- Bulk Personalised (max 50 contacts per call): POST /api/v1/send
  {
    "contacts": [
      { "phone": "919876543210", "name": "Rahul" },
      { "phone": "919123456789", "name": "Priya" }
    ],
    "message": { "text": "Hi {{name}}, your appointment is confirmed!" }
  }

- Scheduled Messaging (ISO 8601 UTC):
  Add "schedule_at": "2026-10-15T09:00:00Z" to POST /api/v1/send (returns HTTP 202 + job_id)
  GET    /api/v1/schedules          — list last 50 scheduled jobs
  DELETE /api/v1/schedules/:job_id  — cancel a pending job

---

## 2. Omnichannel Email API
- Send Transactional / Marketing Email: POST /api/v1/email/send
  {
    "to": "client@example.com",
    "subject": "Order Confirmation #1024",
    "body": "<h1>Thank you for your order!</h1><p>Your items have been shipped.</p>",
    "isHtml": true
  }

---

## 3. Website Chatbot & In-House AI Integration
- Chat Query: POST /api/website-chatbot/chat
  {
    "message": "What is the penalty clause in section 4?",
    "sessionId": "sid_user_1234",
    "chatHistory": [
      { "role": "user", "content": "Hi" },
      { "role": "model", "content": "Hello! How can I help you?" }
    ]
  }
  Header: X-API-Key: bsk_your_key_here

- Submit Lead: POST /api/website-chatbot/leads/submit
  { "name": "John Doe", "email": "john@example.com", "phone": "1234567890", "message": "Interested in quote" }

- In-House AI / Webhook Integration:
  You can connect any custom in-house AI (e.g. Legal AI, Medical AI, RAG API) in the Chatbot Setup Panel.
  NexBotix forwards queries to your webhook, formats payload using templates ({{message}}, {{sessionId}}, {{chatHistory}}), extracts answers using dot-notation paths (e.g. "reply", "data.answer", "choices[0].message.content"), and gracefully falls back to built-in AI if configured.

---

## 4. MCP (Model Context Protocol) Server
- Streamable HTTP MCP Endpoint: POST /api/mcp
  Connect Cursor, Claude Desktop, or LangChain agents.
  Header: X-API-Key: bsk_your_key_here
  Tools: send_whatsapp_message, schedule_whatsapp_message, get_bot_status, send_email, list_schedules.

---

## 5. SEO & Tracking API
- Script: GET /api/seo/script?apikey=bsk_your_key_here
- Performance Beacon: POST /api/seo/track

Please help me integrate this API into my project.`;

// ─── AI Prompt Block component ─────────────────────────────────────────────────

function AIPromptBlock() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(AI_AGENT_PROMPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="border border-violet-200 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-50 to-indigo-50 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-violet-200 bg-white/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-violet-600" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 text-sm">AI Agent Prompt (Claude, Cursor, Copilot)</h2>
            <p className="text-xs text-gray-500">Copy &amp; paste into Cursor, Windsurf, Claude Desktop, or Copilot for instant full-stack integration</p>
          </div>
        </div>
        <button
          onClick={copy}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            copied
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied Prompt!' : 'Copy Prompt'}
        </button>
      </div>
      {/* Prompt preview */}
      <pre className="px-6 py-5 text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-64 overflow-y-auto bg-white/40">
        {AI_AGENT_PROMPT}
      </pre>
      {/* Footer hint */}
      <div className="px-6 py-3 border-t border-violet-100 bg-white/40 flex items-start gap-2 text-xs text-violet-700">
        <Bot className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>Paste this prompt at the start of your AI chat session. Your agent will configure environment variables and generate complete integration code in any language.</span>
      </div>
    </div>
  );
}

// ─── Code snippets ─────────────────────────────────────────────────────────────

const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://nexbotix.online';

const snippets: Record<string, Record<string, string>> = {
  send_single: {
    curl: `curl -X POST ${BASE}/api/v1/send \\
  -H "X-API-Key: bsk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"919876543210","message":{"text":"Hello! Your verification code is 49201"}}'`,

    'node-fetch': `const res = await fetch('${BASE}/api/v1/send', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.NEXBOTIX_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone: '919876543210',
    message: { text: 'Hello! Your verification code is 49201' },
  }),
});
const data = await res.json();
console.log(data);`,

    python: `import os
import requests

response = requests.post(
    '${BASE}/api/v1/send',
    headers={'X-API-Key': os.environ['NEXBOTIX_API_KEY']},
    json={
        'phone': '919876543210',
        'message': {'text': 'Hello! Your verification code is 49201'},
    }
)
print(response.json())`,

    go: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
)

func main() {
    body, _ := json.Marshal(map[string]any{
        "phone":   "919876543210",
        "message": map[string]string{"text": "Hello! Your verification code is 49201"},
    })
    req, _ := http.NewRequest("POST", "${BASE}/api/v1/send", bytes.NewBuffer(body))
    req.Header.Set("X-API-Key", os.Getenv("NEXBOTIX_API_KEY"))
    req.Header.Set("Content-Type", "application/json")
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,
  },

  send_bulk: {
    curl: `curl -X POST ${BASE}/api/v1/send \\
  -H "X-API-Key: bsk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contacts": [
      {"phone":"919876543210","name":"Rahul"},
      {"phone":"919123456789","name":"Priya"},
      {"phone":"918765432109","name":"Amit"}
    ],
    "message": {"text":"Hi {{name}}, your order #8921 is confirmed!"}
  }'`,

    'node-fetch': `const contacts = [
  { phone: '919876543210', name: 'Rahul' },
  { phone: '919123456789', name: 'Priya' },
  { phone: '918765432109', name: 'Amit'  },
];

const res = await fetch('${BASE}/api/v1/send', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.NEXBOTIX_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contacts,
    message: { text: 'Hi {{name}}, your order #8921 is confirmed!' },
  }),
});
const data = await res.json();
console.log(data);`,

    python: `import os
import requests

contacts = [
    {'phone': '919876543210', 'name': 'Rahul'},
    {'phone': '919123456789', 'name': 'Priya'},
]

response = requests.post(
    '${BASE}/api/v1/send',
    headers={'X-API-Key': os.environ['NEXBOTIX_API_KEY']},
    json={
        'contacts': contacts,
        'message': {'text': 'Hi {{name}}, your order #8921 is confirmed!'},
    }
)
print(response.json())`,

    go: `package main

import (
    "bytes"
    "encoding/json"
    "net/http"
    "os"
)

type Contact struct {
    Phone string \`json:"phone"\`
    Name  string \`json:"name"\`
}

func main() {
    payload := map[string]any{
        "contacts": []Contact{
            {Phone: "919876543210", Name: "Rahul"},
            {Phone: "919123456789", Name: "Priya"},
        },
        "message": map[string]string{
            "text": "Hi {{name}}, your order #8921 is confirmed!",
        },
    }
    body, _ := json.Marshal(payload)
    req, _ := http.NewRequest("POST", "${BASE}/api/v1/send", bytes.NewBuffer(body))
    req.Header.Set("X-API-Key", os.Getenv("NEXBOTIX_API_KEY"))
    req.Header.Set("Content-Type", "application/json")
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
}`,
  },

  schedule_send: {
    curl: `curl -X POST ${BASE}/api/v1/send \\
  -H "X-API-Key: bsk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "919876543210",
    "message": {"text": "Your legal consultation reminder for tomorrow!"},
    "schedule_at": "2026-10-15T09:00:00Z"
  }'`,

    'node-fetch': `const res = await fetch('${BASE}/api/v1/send', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.NEXBOTIX_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone: '919876543210',
    message: { text: 'Your legal consultation reminder for tomorrow!' },
    schedule_at: '2026-10-15T09:00:00Z', // ISO 8601 UTC
  }),
});
const data = await res.json();
console.log(data); // HTTP 202: { success: true, scheduled: true, job_id: "..." }`,

    python: `import os
import requests

response = requests.post(
    '${BASE}/api/v1/send',
    headers={'X-API-Key': os.environ['NEXBOTIX_API_KEY']},
    json={
        'phone': '919876543210',
        'message': {'text': 'Your legal consultation reminder for tomorrow!'},
        'schedule_at': '2026-10-15T09:00:00Z',
    }
)
print(response.json())`,

    go: `body, _ := json.Marshal(map[string]any{
    "phone":       "919876543210",
    "message":     map[string]string{"text": "Your legal consultation reminder for tomorrow!"},
    "schedule_at": "2026-10-15T09:00:00Z",
})
req, _ := http.NewRequest("POST", "${BASE}/api/v1/send", bytes.NewBuffer(body))
req.Header.Set("X-API-Key", os.Getenv("NEXBOTIX_API_KEY"))
req.Header.Set("Content-Type", "application/json")
resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()`,
  },

  email_send: {
    curl: `curl -X POST ${BASE}/api/v1/email/send \\
  -H "X-API-Key: bsk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "client@example.com",
    "subject": "Your Legal Analysis Report",
    "body": "<h2>Legal Analysis Report</h2><p>Here are the compliance findings requested...</p>",
    "isHtml": true
  }'`,

    'node-fetch': `const res = await fetch('${BASE}/api/v1/email/send', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.NEXBOTIX_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: 'client@example.com',
    subject: 'Your Legal Analysis Report',
    body: '<h2>Legal Analysis Report</h2><p>Here are the compliance findings requested...</p>',
    isHtml: true,
  }),
});
const data = await res.json();
console.log(data); // { success: true, message: "Email queued / sent successfully" }`,

    python: `import os
import requests

response = requests.post(
    '${BASE}/api/v1/email/send',
    headers={'X-API-Key': os.environ['NEXBOTIX_API_KEY']},
    json={
        'to': 'client@example.com',
        'subject': 'Your Legal Analysis Report',
        'body': '<h2>Legal Analysis Report</h2><p>Here are the compliance findings requested...</p>',
        'isHtml': True,
    }
)
print(response.json())`,

    go: `body, _ := json.Marshal(map[string]any{
    "to":      "client@example.com",
    "subject": "Your Legal Analysis Report",
    "body":    "<h2>Legal Analysis Report</h2><p>Here are the compliance findings requested...</p>",
    "isHtml":  true,
})
req, _ := http.NewRequest("POST", "${BASE}/api/v1/email/send", bytes.NewBuffer(body))
req.Header.Set("X-API-Key", os.Getenv("NEXBOTIX_API_KEY"))
req.Header.Set("Content-Type", "application/json")
resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()`,
  },

  chatbot_chat: {
    curl: `curl -X POST ${BASE}/api/website-chatbot/chat \\
  -H "X-API-Key: bsk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "What are your services and consultation pricing?",
    "sessionId": "session_user_9921",
    "chatHistory": [
      {"role": "user", "content": "Hello"},
      {"role": "model", "content": "Welcome! How may I assist you today?"}
    ]
  }'`,

    'node-fetch': `const res = await fetch('${BASE}/api/website-chatbot/chat', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.NEXBOTIX_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'What are your services and consultation pricing?',
    sessionId: 'session_user_9921',
    chatHistory: [],
  }),
});
const { data } = await res.json();
console.log(data.reply); // AI or In-House AI generated reply
console.log(data.showLeadForm); // true if lead capture condition met`,

    python: `import os
import requests

response = requests.post(
    '${BASE}/api/website-chatbot/chat',
    headers={'X-API-Key': os.environ['NEXBOTIX_API_KEY']},
    json={
        'message': 'What are your services and consultation pricing?',
        'sessionId': 'session_user_9921',
        'chatHistory': [],
    }
)
data = response.json()
print("Bot reply:", data['data']['reply'])`,

    go: `body, _ := json.Marshal(map[string]any{
    "message":   "What are your services and consultation pricing?",
    "sessionId": "session_user_9921",
})
req, _ := http.NewRequest("POST", "${BASE}/api/website-chatbot/chat", bytes.NewBuffer(body))
req.Header.Set("X-API-Key", os.Getenv("NEXBOTIX_API_KEY"))
req.Header.Set("Content-Type", "application/json")
resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()`,
  },

  inhouse_ai_server: {
    python: `# Example FastAPI in-house Legal / Specialty AI Webhook Server
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

class ChatMsg(BaseModel):
    role: str
    content: str

class QueryPayload(BaseModel):
    legalQuery: str
    sessionId: str
    history: Optional[List[ChatMsg]] = []

@app.post("/v1/legal-ai")
async def handle_legal_ai(payload: QueryPayload, authorization: Optional[str] = Header(None)):
    # 1. Verify your secret header
    if authorization != "Bearer your_secret_internal_token":
        raise HTTPException(status_code=401, detail="Unauthorized")

    # 2. Query your in-house Legal RAG / custom fine-tuned model
    user_question = payload.legalQuery
    legal_answer = f"According to our legal compliance database for '{user_question}': clause 14 applies."

    # 3. Return JSON response format matching your panel config (e.g. response field "data.answer")
    return {
        "success": True,
        "data": {
            "answer": legal_answer,
            "citations": ["Sec 4.2", "NDA-2026"]
        }
    }`,

    'node-fetch': `// Example Node.js / Express in-house AI Webhook Server
import express from 'express';

const app = express();
app.use(express.json());

app.post('/v1/legal-ai', (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== 'Bearer your_secret_internal_token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { legalQuery, sessionId, history } = req.body;

  // Process query with your in-house AI model
  const legalAnswer = \`Legal assessment for "\${legalQuery}": Complies with standard corporate policy.\`;

  // Return response matching your extraction path (e.g. "data.answer" or "reply")
  return res.json({
    success: true,
    data: {
      answer: legalAnswer
    }
  });
});

app.listen(8080, () => console.log('In-House AI webhook listening on port 8080'));`,
  },

  mcp_config: {
    curl: `// Claude Desktop Configuration (claude_desktop_config.json)
{
  "mcpServers": {
    "nexbotix": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "${BASE}/api/mcp",
        "--header",
        "X-API-Key: bsk_your_key_here"
      ]
    }
  }
}`,

    'node-fetch': `// Direct MCP Tool execution via HTTP stream
const res = await fetch('${BASE}/api/mcp', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.NEXBOTIX_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "send_whatsapp_message",
      arguments: {
        phone: "919876543210",
        message: "Automated alert from MCP Agent"
      }
    }
  }),
});
console.log(await res.json());`,
  },
};

const TABS = [
  { id: 'curl', label: 'cURL' },
  { id: 'node-fetch', label: 'Node.js' },
  { id: 'python', label: 'Python' },
  { id: 'go', label: 'Go' },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="relative group">
      <pre className="bg-gray-950 text-green-400 text-xs sm:text-sm p-5 rounded-b-xl overflow-x-auto leading-relaxed font-mono whitespace-pre">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs rounded-lg transition-colors shadow-sm"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

function CodeExample({ snippetKey, defaultTab = 'curl' }: { snippetKey: string; defaultTab?: string }) {
  const [tab, setTab] = useState(defaultTab);
  const code = snippets[snippetKey]?.[tab] ?? snippets[snippetKey]?.['curl'] ?? '';
  const availableTabs = TABS.filter(t => snippets[snippetKey]?.[t.id] !== undefined);
  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden shadow-sm">
      <div className="flex overflow-x-auto bg-gray-900 border-b border-gray-800 scrollbar-hide">
        {(availableTabs.length > 0 ? availableTabs : TABS).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2.5 text-xs font-medium transition-colors ${
              tab === t.id
                ? 'text-green-400 border-b-2 border-green-400 bg-gray-950'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <CodeBlock code={code} />
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  badge,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-all">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/80 hover:bg-gray-100/80 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-semibold text-gray-900 text-base">{title}</span>
            {badge && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800 rounded-full border border-green-200">
                {badge}
              </span>
            )}
          </div>
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
      </button>
      {open && <div className="px-6 py-6 space-y-6 bg-white">{children}</div>}
    </div>
  );
}

function IC({ children }: { children: React.ReactNode }) {
  return <code className="bg-gray-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>;
}

// ─── Main Developer Documentation Page ─────────────────────────────────────────

export function DevDocsPage() {
  useSEO({
    title: 'Developer API Documentation - NexBotix',
    description: 'Comprehensive documentation for NexBotix WhatsApp, Email, Website Chatbot, In-House AI Integration, MCP Server, and Marketing APIs.',
    url: 'https://nexbotix.online/docs',
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white py-16 px-4 border-b border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium mb-6">
            <Terminal className="w-3.5 h-3.5" />
            NexBotix Developer Platform — v1 REST &amp; MCP
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
            API Documentation &amp; SDKs
          </h1>
          <p className="text-base sm:text-lg text-gray-300 max-w-3xl leading-relaxed">
            Build and automate with WhatsApp bulk &amp; scheduled messaging, omnichannel transactional email, embeddable website chatbots with in-house custom AI endpoints, and Model Context Protocol (MCP) tooling for AI agents.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
        {/* AI Agent Prompt Box */}
        <AIPromptBlock />

        {/* 1. Quick Start & Authentication */}
        <Section title="Authentication &amp; Quick Start" icon={Shield} badge="Core" defaultOpen>
          <p className="text-sm text-gray-600">
            All programmatic requests must include your secret API key in the <IC>X-API-Key</IC> header. Keys start with <IC>bsk_</IC> and can be generated instantly from your <a href="/subscription" className="text-green-600 underline font-medium">Subscription page → Developer API</a>.
          </p>

          <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Header</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Value</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Requirement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900">X-API-Key</td>
                <td className="px-4 py-3 text-gray-600"><IC>bsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</IC></td>
                <td className="px-4 py-3 text-green-600 font-semibold">Required</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900">Content-Type</td>
                <td className="px-4 py-3 text-gray-600"><IC>application/json</IC></td>
                <td className="px-4 py-3 text-green-600 font-semibold">Required</td>
              </tr>
            </tbody>
          </table>

          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <p><strong>Security Note:</strong> Your API key grants programmatic messaging and chatbot access. Store it exclusively in secure server-side environment variables (<IC>process.env.NEXBOTIX_API_KEY</IC> or <IC>os.environ['NEXBOTIX_API_KEY']</IC>). Never commit it to public code repositories.</p>
          </div>
        </Section>

        {/* 2. WhatsApp Messaging API */}
        <Section title="WhatsApp Messaging &amp; Bulk Personalisation" icon={MessageSquare} badge="WhatsApp" defaultOpen>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">POST</span>
              <IC>/api/v1/send</IC>
            </div>
            <p className="text-sm text-gray-600">
              Dispatches WhatsApp messages immediately to a single contact or batches up to 50 contacts per API request with automatic rate-limiting and <IC>{'{{name}}'}</IC> template substitution.
            </p>

            <h4 className="font-semibold text-gray-800 text-sm">Send a Single Message</h4>
            <CodeExample snippetKey="send_single" />

            <h4 className="font-semibold text-gray-800 text-sm pt-2">Send Bulk Personalised Messages</h4>
            <CodeExample snippetKey="send_bulk" defaultTab="node-fetch" />

            <h4 className="font-semibold text-gray-800 text-sm pt-2">Request Body Schema</h4>
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Field</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                <tr>
                  <td className="px-4 py-3 font-mono text-green-700 font-bold">phone</td>
                  <td className="px-4 py-3 text-gray-500">string</td>
                  <td className="px-4 py-3 text-gray-600">Single recipient phone number with country code without spaces (e.g. <IC>919876543210</IC>).</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-green-700 font-bold">contacts</td>
                  <td className="px-4 py-3 text-gray-500">array</td>
                  <td className="px-4 py-3 text-gray-600">Array of objects <IC>{`{phone: string, name?: string}`}</IC>. Max 50 items per call.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-green-700 font-bold">message.text</td>
                  <td className="px-4 py-3 text-gray-500">string</td>
                  <td className="px-4 py-3 text-gray-600">Message content. Supports variable placeholders like <IC>{'{{name}}'}</IC>.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-gray-500">message.imageUrl</td>
                  <td className="px-4 py-3 text-gray-500">string</td>
                  <td className="px-4 py-3 text-gray-600">Optional public URL of an image attachment.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* 3. Scheduled WhatsApp Messaging */}
        <Section title="Scheduled Messaging API" icon={Clock} badge="WhatsApp">
          <p className="text-sm text-gray-600">
            Add <IC>schedule_at</IC> in ISO 8601 UTC format to any <IC>/api/v1/send</IC> request. The server returns HTTP <IC>202 Accepted</IC> with a persistent <IC>job_id</IC>.
          </p>

          <CodeExample snippetKey="schedule_send" defaultTab="node-fetch" />

          <h4 className="font-semibold text-gray-800 text-sm pt-2">Schedule Management Endpoints</h4>
          <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden text-xs">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-green-700">GET /api/v1/schedules</td>
                <td className="px-4 py-3 text-gray-600">List last 50 scheduled jobs and their execution states (<IC>pending</IC>, <IC>running</IC>, <IC>done</IC>, <IC>cancelled</IC>).</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-red-700">DELETE /api/v1/schedules/:job_id</td>
                <td className="px-4 py-3 text-gray-600">Cancel a pending scheduled message before execution begins.</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* 4. Omnichannel Email API */}
        <Section title="Omnichannel Email API" icon={Mail} badge="Email">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">POST</span>
              <IC>/api/v1/email/send</IC>
            </div>
            <p className="text-sm text-gray-600">
              Send transactional and notification emails via your configured SMTP/Hostinger server using your developer API key.
            </p>

            <CodeExample snippetKey="email_send" defaultTab="node-fetch" />

            <h4 className="font-semibold text-gray-800 text-sm">Parameters</h4>
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden text-xs">
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-4 py-3 font-mono text-green-700 font-bold">to</td><td className="px-4 py-3 text-gray-600">Recipient email address (e.g. <IC>client@example.com</IC>).</td></tr>
                <tr><td className="px-4 py-3 font-mono text-green-700 font-bold">subject</td><td className="px-4 py-3 text-gray-600">Email subject line.</td></tr>
                <tr><td className="px-4 py-3 font-mono text-green-700 font-bold">body</td><td className="px-4 py-3 text-gray-600">Email body (HTML or plain text).</td></tr>
                <tr><td className="px-4 py-3 font-mono text-gray-500">isHtml</td><td className="px-4 py-3 text-gray-600">Boolean (default: <IC>true</IC>).</td></tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* 5. Website Chatbot & Custom In-House AI Integration */}
        <Section title="Website Chatbot &amp; In-House AI Integration" icon={Cpu} badge="AI Webhook" defaultOpen>
          <div className="space-y-5">
            <p className="text-sm text-gray-600 leading-relaxed">
              NexBotix allows you to integrate your own <strong>in-house AI</strong> (e.g., specialized Legal AI, Medical AI, internal RAG pipeline, custom LLMs) into the website chatbot widget.
            </p>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-xs text-purple-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-purple-800">
                <Sparkles size={14} /> How In-House AI Integration Works:
              </p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>When a website visitor sends a query in the widget, NexBotix formats your custom JSON payload template.</li>
                <li>NexBotix issues a secure HTTP POST/GET request to your in-house AI endpoint with your custom headers (e.g., Bearer auth).</li>
                <li>NexBotix parses your AI response using your specified dot-notation path (e.g. <IC>data.answer</IC>, <IC>choices[0].message.content</IC>, <IC>reply</IC>) and delivers the answer back to the visitor.</li>
                <li>If your AI server is temporarily unavailable, NexBotix can automatically fall back to built-in AI.</li>
              </ol>
            </div>

            <h4 className="font-semibold text-gray-800 text-sm">Example: In-House AI Webhook Server Implementation</h4>
            <p className="text-xs text-gray-500">Here is a complete example of a Python/FastAPI and Node.js webhook backend that you can deploy for your in-house AI:</p>
            <CodeExample snippetKey="inhouse_ai_server" defaultTab="python" />

            <h4 className="font-semibold text-gray-800 text-sm pt-2">Chatbot Public Chat API</h4>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">POST</span>
              <IC>/api/website-chatbot/chat</IC>
            </div>
            <CodeExample snippetKey="chatbot_chat" defaultTab="node-fetch" />

            <h4 className="font-semibold text-gray-800 text-sm pt-2">Website Widget Script Embed</h4>
            <div className="relative group">
              <pre className="bg-gray-950 text-green-400 text-xs p-4 rounded-xl font-mono overflow-x-auto">
{`<script src="${BASE}/api/website-chatbot/script?apikey=YOUR_API_KEY" async></script>`}
              </pre>
            </div>

            <h4 className="font-semibold text-gray-800 text-sm pt-2">Client-side JavaScript SDK API</h4>
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden text-xs">
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-4 py-3 font-mono font-bold text-gray-900">window.NexBotix.open()</td><td className="px-4 py-3 text-gray-600">Opens the chat popup window.</td></tr>
                <tr><td className="px-4 py-3 font-mono font-bold text-gray-900">window.NexBotix.close()</td><td className="px-4 py-3 text-gray-600">Closes the chat window.</td></tr>
                <tr><td className="px-4 py-3 font-mono font-bold text-gray-900">window.NexBotix.toggle()</td><td className="px-4 py-3 text-gray-600">Toggles open/closed state.</td></tr>
                <tr><td className="px-4 py-3 font-mono font-bold text-gray-900">window.NexBotix.setUser({`{name, email, phone}`})</td><td className="px-4 py-3 text-gray-600">Pre-fills logged-in user contact information for lead capture.</td></tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* 6. Model Context Protocol (MCP) Server */}
        <Section title="Model Context Protocol (MCP) Server" icon={Bot} badge="Agentic AI">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">POST</span>
              <IC>/api/mcp</IC>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              NexBotix exposes a full RFC-compliant <strong>Model Context Protocol (MCP)</strong> server over streamable HTTP transport. Connect Claude Desktop, Cursor, Windsurf, or Autonomous AI agents directly to your NexBotix tools.
            </p>

            <h4 className="font-semibold text-gray-800 text-sm">Claude Desktop / Cursor Configuration</h4>
            <CodeExample snippetKey="mcp_config" defaultTab="curl" />

            <h4 className="font-semibold text-gray-800 text-sm pt-2">Exposed MCP Tools</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['send_whatsapp_message', 'Send instant text/media WhatsApp message to any phone number.'],
                ['schedule_whatsapp_message', 'Schedule a message for automatic future delivery with ISO UTC timestamp.'],
                ['list_scheduled_messages', 'Retrieve pending and executed scheduled message jobs.'],
                ['cancel_scheduled_message', 'Cancel a pending scheduled message by job ID.'],
                ['send_email', 'Send single or bulk transactional emails via configured SMTP.'],
                ['get_bot_status', 'Check WhatsApp and AI Bot online/pairing connectivity status.'],
              ].map(([tool, desc]) => (
                <div key={tool} className="border border-gray-200 rounded-xl p-3 bg-gray-50/60 text-xs">
                  <span className="font-mono font-bold text-purple-700">{tool}</span>
                  <p className="text-gray-600 mt-1">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* 7. Marketing, Quora & Medium AI APIs */}
        <Section title="Marketing &amp; AI Content APIs (Quora, Medium, SEO)" icon={Sparkles} badge="Outreach">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Automate multi-channel content generation and performance tracking across Quora, Medium, and SEO analytics.
            </p>

            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Endpoint</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Method</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">/api/v1/quora/generate-answer</td>
                  <td className="px-4 py-3 font-mono text-green-700">POST</td>
                  <td className="px-4 py-3 text-gray-600">Generates high-authority contextual answers for Quora threads.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">/api/v1/medium/generate-post</td>
                  <td className="px-4 py-3 font-mono text-green-700">POST</td>
                  <td className="px-4 py-3 text-gray-600">Generates long-form SEO articles with markdown formatting for Medium.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">/api/seo/track</td>
                  <td className="px-4 py-3 font-mono text-green-700">POST</td>
                  <td className="px-4 py-3 text-gray-600">Ingests Core Web Vitals telemetry (LCP, FID, CLS, TTFB, INP).</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono font-bold text-gray-900">/api/calendar/public/:user/:slug/book</td>
                  <td className="px-4 py-3 font-mono text-green-700">POST</td>
                  <td className="px-4 py-3 text-gray-600">Books calendar appointments and generates Google Meet links.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* 8. Error Codes Reference */}
        <Section title="HTTP Status Codes &amp; Error Handling" icon={AlertCircle}>
          <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Meaning</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Troubleshooting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-green-700">200 OK / 202 Accepted</td>
                <td className="px-4 py-3 text-gray-600">Request processed or queued</td>
                <td className="px-4 py-3 text-gray-500">For bulk calls, verify <IC>failed: 0</IC> in response body.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-amber-600">400 Bad Request</td>
                <td className="px-4 py-3 text-gray-600">Invalid payload or missing parameters</td>
                <td className="px-4 py-3 text-gray-500">Check phone format, required fields, or max 50 contacts limit.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-red-600">401 Unauthorized</td>
                <td className="px-4 py-3 text-gray-600">Invalid or missing API key</td>
                <td className="px-4 py-3 text-gray-500">Verify <IC>X-API-Key</IC> header matches your active key from dashboard.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-red-600">403 Forbidden</td>
                <td className="px-4 py-3 text-gray-600">Subscription expired or domain not whitelisted</td>
                <td className="px-4 py-3 text-gray-500">Renew subscription or check allowed domains in chatbot settings.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono font-bold text-red-600">503 Service Unavailable</td>
                <td className="px-4 py-3 text-gray-600">WhatsApp session disconnected</td>
                <td className="px-4 py-3 text-gray-500">Scan QR code in NexBotix Dashboard to pair your WhatsApp number.</td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* CTA Footer */}
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900">Start Building Today</h3>
          <p className="text-gray-600 text-sm max-w-xl mx-auto">
            Create an API key in seconds, copy the AI Agent prompt into Cursor or Claude Desktop, and integrate NexBotix services into your stack.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="/subscription"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-md shadow-green-600/25 text-sm"
            >
              <Zap className="w-4 h-4" /> Get Developer API Key
            </a>
            <a
              href="/website-chatbot"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl border border-gray-300 transition-all text-sm"
            >
              <Cpu className="w-4 h-4 text-purple-600" /> Setup Website Chatbot &amp; In-House AI
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
