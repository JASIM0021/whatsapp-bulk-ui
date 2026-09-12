import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Copy,
  Check,
  Zap,
  Shield,
  AlertCircle,
  Clock,
  Bot,
  Mail,
  MessageSquare,
  Cpu,
  Sparkles,
  Calendar,
  Key,
  Terminal,
} from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

// ─── Base URL ─────────────────────────────────────────────────────────────────
const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://nexbotix.online';

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

// ─── Comprehensive Code Snippets ───────────────────────────────────────────────
const snippets: Record<string, Record<string, string>> = {
  // WhatsApp Single
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

  // WhatsApp Bulk
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

  // WhatsApp Schedule
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

  // WhatsApp Schedule Management
  schedule_mgmt: {
    curl: `# 1. List scheduled jobs
curl -X GET ${BASE}/api/v1/schedules \\
  -H "X-API-Key: bsk_your_key_here"

# 2. Cancel a pending job
curl -X DELETE ${BASE}/api/v1/schedules/job_6739ac9210 \\
  -H "X-API-Key: bsk_your_key_here"`,

    'node-fetch': `// 1. List all active schedules
const listRes = await fetch('${BASE}/api/v1/schedules', {
  headers: { 'X-API-Key': process.env.NEXBOTIX_API_KEY }
});
const { data: schedules } = await listRes.json();
console.log(schedules);

// 2. Cancel a specific job
const cancelRes = await fetch('${BASE}/api/v1/schedules/job_6739ac9210', {
  method: 'DELETE',
  headers: { 'X-API-Key': process.env.NEXBOTIX_API_KEY }
});
console.log(await cancelRes.json());`,

    python: `import os
import requests

api_key = os.environ['NEXBOTIX_API_KEY']
headers = {'X-API-Key': api_key}

# 1. List schedules
res = requests.get('${BASE}/api/v1/schedules', headers=headers)
print(res.json())

# 2. Cancel schedule
cancel_res = requests.delete('${BASE}/api/v1/schedules/job_6739ac9210', headers=headers)
print(cancel_res.json())`,

    go: `// List schedules
req, _ := http.NewRequest("GET", "${BASE}/api/v1/schedules", nil)
req.Header.Set("X-API-Key", os.Getenv("NEXBOTIX_API_KEY"))
resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()`,
  },

  // Email Send
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

  // Website Chatbot Chat API
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

  // Website Chatbot Leads Submit
  chatbot_leads: {
    curl: `curl -X POST ${BASE}/api/website-chatbot/leads/submit \\
  -H "X-API-Key: bsk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Sarah Jenkins",
    "email": "sarah@acmelegal.com",
    "phone": "+14155552671",
    "message": "Interested in corporate retainer package"
  }'`,

    'node-fetch': `const res = await fetch('${BASE}/api/website-chatbot/leads/submit', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.NEXBOTIX_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Sarah Jenkins',
    email: 'sarah@acmelegal.com',
    phone: '+14155552671',
    message: 'Interested in corporate retainer package',
  }),
});
const data = await res.json();
console.log(data); // { success: true, message: "Lead recorded" }`,

    python: `import os
import requests

response = requests.post(
    '${BASE}/api/website-chatbot/leads/submit',
    headers={'X-API-Key': os.environ['NEXBOTIX_API_KEY']},
    json={
        'name': 'Sarah Jenkins',
        'email': 'sarah@acmelegal.com',
        'phone': '+14155552671',
        'message': 'Interested in corporate retainer package'
    }
)
print(response.json())`,

    go: `body, _ := json.Marshal(map[string]string{
    "name":    "Sarah Jenkins",
    "email":   "sarah@acmelegal.com",
    "phone":   "+14155552671",
    "message": "Interested in corporate retainer package",
})
req, _ := http.NewRequest("POST", "${BASE}/api/website-chatbot/leads/submit", bytes.NewBuffer(body))
req.Header.Set("X-API-Key", os.Getenv("NEXBOTIX_API_KEY"))
req.Header.Set("Content-Type", "application/json")
resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()`,
  },

  // In-House AI Server Example
  inhouse_ai_server: {
    python: `# Python / FastAPI In-House Legal / Specialty AI Webhook Server
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="In-House Legal AI Server")

class ChatMsg(BaseModel):
    role: str
    content: str

class QueryPayload(BaseModel):
    legalQuery: str
    sessionId: str
    history: Optional[List[ChatMsg]] = []

@app.post("/v1/legal-ai")
async def handle_legal_ai(payload: QueryPayload, authorization: Optional[str] = Header(None)):
    # 1. Authenticate with your secret header token (AES-256-GCM encrypted in NexBotix panel)
    if authorization != "Bearer your_secret_internal_token":
        raise HTTPException(status_code=401, detail="Unauthorized")

    # 2. Query your in-house Legal RAG / proprietary LLM
    user_question = payload.legalQuery
    legal_answer = f"According to our legal database regarding '{user_question}': Section 4.2 compliance applies."

    # 3. Return JSON response format matching your panel response path (e.g. "data.answer")
    return {
        "success": True,
        "data": {
            "answer": legal_answer,
            "citations": ["Sec 4.2", "Corporate Governance 2026"]
        }
    }`,

    'node-fetch': `// Node.js / Express In-House AI Webhook Server
import express from 'express';

const app = express();
app.use(express.json());

app.post('/v1/legal-ai', (req, res) => {
  // 1. Verify your secret header token
  const auth = req.headers.authorization;
  if (auth !== 'Bearer your_secret_internal_token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { legalQuery, sessionId, history } = req.body;

  // 2. Query your in-house AI model
  const legalAnswer = \`Legal assessment for "\${legalQuery}": Compliant under standard NDA terms.\`;

  // 3. Return response matching extraction path (e.g. "data.answer" or "reply")
  return res.json({
    success: true,
    data: {
      answer: legalAnswer
    }
  });
});

app.listen(8080, () => console.log('In-House AI webhook running on port 8080'));`,

    go: `// Go / Gin In-House AI Webhook Server
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type LegalRequest struct {
    LegalQuery string \`json:"legalQuery"\`
    SessionID  string \`json:"sessionId"\`
}

func main() {
    r := gin.Default()
    r.POST("/v1/legal-ai", func(c *gin.Context) {
        if c.GetHeader("Authorization") != "Bearer your_secret_internal_token" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
            return
        }

        var req LegalRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        c.JSON(http.StatusOK, gin.H{
            "success": true,
            "data": gin.H{
                "answer": "Legal evaluation completed for query: " + req.LegalQuery,
            },
        })
    })
    r.Run(":8080")
}`,
  },

  // MCP Claude & Cursor Configs
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

    'node-fetch': `// Cursor IDE Configuration (.cursor/mcp.json)
{
  "mcpServers": {
    "nexbotix-agent": {
      "url": "${BASE}/api/mcp",
      "headers": {
        "X-API-Key": "bsk_your_key_here"
      }
    }
  }
}`,

    python: `# Direct MCP Tool Execution via Streamable HTTP Transport
import requests
import json

response = requests.post(
    "${BASE}/api/mcp",
    headers={
        "X-API-Key": "bsk_your_key_here",
        "Content-Type": "application/json"
    },
    json={
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "send_whatsapp_message",
            "arguments": {
                "phone": "919876543210",
                "message": "Automated alert from autonomous Python agent"
            }
        }
    }
)
print(response.json())`,

    go: `// Direct MCP JSON-RPC 2.0 invocation in Go
payload := \`{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"send_whatsapp_message","arguments":{"phone":"919876543210","message":"Hello from Go MCP Agent"}}}\`
req, _ := http.NewRequest("POST", "${BASE}/api/mcp", bytes.NewBufferString(payload))
req.Header.Set("X-API-Key", os.Getenv("NEXBOTIX_API_KEY"))
req.Header.Set("Content-Type", "application/json")
resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()`,
  },

  // Calendar Booking API
  calendar_booking: {
    curl: `curl -X POST ${BASE}/api/calendar/public/acmelaw/consultation-30m/book \\
  -H "Content-Type: application/json" \\
  -d '{
    "clientName": "David Miller",
    "clientEmail": "david@company.com",
    "clientPhone": "+14159821039",
    "startTime": "2026-10-18T14:30:00Z",
    "notes": "Discussion regarding IP patent filing"
  }'`,

    'node-fetch': `const res = await fetch('${BASE}/api/calendar/public/acmelaw/consultation-30m/book', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientName: 'David Miller',
    clientEmail: 'david@company.com',
    clientPhone: '+14159821039',
    startTime: '2026-10-18T14:30:00Z',
    notes: 'Discussion regarding IP patent filing',
  }),
});
const data = await res.json();
console.log(data); // Returns booking ID, Google Meet link & calendar confirmation`,

    python: `import requests

response = requests.post(
    '${BASE}/api/calendar/public/acmelaw/consultation-30m/book',
    json={
        'clientName': 'David Miller',
        'clientEmail': 'david@company.com',
        'clientPhone': '+14159821039',
        'startTime': '2026-10-18T14:30:00Z',
        'notes': 'Discussion regarding IP patent filing'
    }
)
print(response.json())`,

    go: `body, _ := json.Marshal(map[string]string{
    "clientName":  "David Miller",
    "clientEmail": "david@company.com",
    "startTime":   "2026-10-18T14:30:00Z",
})
req, _ := http.NewRequest("POST", "${BASE}/api/calendar/public/acmelaw/consultation-30m/book", bytes.NewBuffer(body))
req.Header.Set("Content-Type", "application/json")
resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()`,
  },

  // Marketing & Content AI
  marketing_ai: {
    curl: `# 1. Quora Contextual Answer Generator
curl -X POST ${BASE}/api/v1/quora/generate-answer \\
  -H "X-API-Key: bsk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "What are the essential terms in a software SaaS contract?",
    "productUrl": "https://nexbotix.online",
    "productName": "NexBotix"
  }'

# 2. Medium SEO Article Generator
curl -X POST ${BASE}/api/v1/medium/generate-post \\
  -H "X-API-Key: bsk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "topic": "Automating Multi-Channel Client Communication in 2026",
    "keywords": ["AI Chatbots", "WhatsApp API", "MCP Server"]
  }'`,

    'node-fetch': `// Generate Quora Authority Answer
const quoraRes = await fetch('${BASE}/api/v1/quora/generate-answer', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.NEXBOTIX_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    question: 'What are the essential terms in a software SaaS contract?',
    productName: 'NexBotix',
  }),
});
const { data: quoraAnswer } = await quoraRes.json();
console.log(quoraAnswer);`,

    python: `import os
import requests

# Generate Medium SEO Post
response = requests.post(
    '${BASE}/api/v1/medium/generate-post',
    headers={'X-API-Key': os.environ['NEXBOTIX_API_KEY']},
    json={
        'topic': 'Automating Multi-Channel Client Communication in 2026',
        'keywords': ['AI Chatbots', 'WhatsApp API', 'MCP Server']
    }
)
print(response.json())`,

    go: `// Ingest SEO Core Web Vitals Beacon
payload := \`{"url":"https://mysite.com","lcp":1.2,"fid":12,"cls":0.02,"ttfb":180}\`
req, _ := http.NewRequest("POST", "${BASE}/api/seo/track", bytes.NewBufferString(payload))
req.Header.Set("X-API-Key", os.Getenv("NEXBOTIX_API_KEY"))
req.Header.Set("Content-Type", "application/json")
resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()`,
  },
};

const LANG_TABS = [
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
  const code = snippets[snippetKey]?.[tab] || snippets[snippetKey]?.curl || '';

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden my-3 shadow-md">
      <div className="flex items-center justify-between bg-gray-900 px-4 py-2 border-b border-gray-800">
        <div className="flex gap-1">
          {LANG_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-gray-800 text-green-400 shadow-sm border border-gray-700'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-mono text-gray-400 hidden sm:inline">HTTPS REST API</span>
      </div>
      <CodeBlock code={code} />
    </div>
  );
}

function IC({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-mono border border-gray-200">
      {children}
    </code>
  );
}

// ─── Main DevDocsPage Component ───────────────────────────────────────────────

export function DevDocsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'overview';
  const activeTab = ['overview', 'chatbot', 'whatsapp', 'email', 'mcp', 'calendar', 'marketing'].includes(rawTab)
    ? rawTab
    : 'overview';

  const setTab = (t: string) => {
    setSearchParams({ tab: t });
  };

  useSEO({
    title: 'Developer API Documentation — NexBotix',
    description:
      'Complete REST API and MCP documentation for NexBotix WhatsApp messaging, Website Chatbot widgets, In-House AI integration, Omnichannel Email, and Calendar booking.',
  });

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const copyPrompt = () => {
    navigator.clipboard.writeText(AI_AGENT_PROMPT).then(() => {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    });
  };

  const navTabs = [
    { id: 'overview', label: 'Overview & AI Prompt', icon: Bot, badge: 'Quickstart' },
    { id: 'chatbot', label: 'Chatbot & In-House AI', icon: Cpu, badge: 'Webhooks' },
    { id: 'whatsapp', label: 'WhatsApp Messaging', icon: MessageSquare, badge: 'REST' },
    { id: 'email', label: 'Email Sending API', icon: Mail, badge: 'SMTP' },
    { id: 'mcp', label: 'Model Context Protocol', icon: Terminal, badge: 'MCP' },
    { id: 'calendar', label: 'Calendar Booking', icon: Calendar, badge: 'Meet' },
    { id: 'marketing', label: 'Quora, Medium & SEO', icon: Sparkles, badge: 'Growth' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
      {/* Top Header Hero */}
      <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white border-b border-gray-800 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={13} /> Developer Portal &amp; Documentation
            </span>
            <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-semibold">
              v1.0.0 Public
            </span>
            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-semibold">
              Live Production
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              NexBotix Developer Documentation
            </h1>
            <p className="text-base sm:text-lg text-gray-300 max-w-3xl leading-relaxed">
              Integrate WhatsApp automation, Website Chatbot widgets, custom In-House AI endpoints, transactional email delivery, Calendar booking, and Model Context Protocol (MCP) agents into any tech stack.
            </p>
          </div>

          {/* Quick Metrics / Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-800/80">
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3">
              <p className="text-[11px] text-gray-400 uppercase font-semibold">Base URL</p>
              <p className="text-xs font-mono font-bold text-green-400 truncate mt-0.5">{BASE}</p>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3">
              <p className="text-[11px] text-gray-400 uppercase font-semibold">Auth Header</p>
              <p className="text-xs font-mono font-bold text-purple-300 truncate mt-0.5">X-API-Key: bsk_...</p>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3">
              <p className="text-[11px] text-gray-400 uppercase font-semibold">Security</p>
              <p className="text-xs font-mono font-bold text-blue-300 truncate mt-0.5">AES-256-GCM at rest</p>
            </div>
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3">
              <p className="text-[11px] text-gray-400 uppercase font-semibold">Protocols</p>
              <p className="text-xs font-mono font-bold text-amber-300 truncate mt-0.5">REST + MCP Stream</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Tab Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3">
            {navTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-gray-950 text-white shadow-md shadow-gray-950/20'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-green-400' : 'text-gray-500'} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      isActive ? 'bg-gray-800 text-green-300' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* =========================================================================
            TAB 1: OVERVIEW & AI PROMPT
           ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* AI Agent Integration Box */}
            <div className="border border-violet-200 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-violet-200 bg-white/70">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-base">One-Click AI Agent Prompt</h2>
                    <p className="text-xs text-gray-500">
                      Copy into Cursor, Windsurf, Claude Desktop, or Copilot for instant turnkey integration
                    </p>
                  </div>
                </div>
                <button
                  onClick={copyPrompt}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
                    copiedPrompt
                      ? 'bg-green-600 text-white shadow-green-600/30'
                      : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/30'
                  }`}
                >
                  {copiedPrompt ? <Check size={16} /> : <Copy size={16} />}
                  {copiedPrompt ? 'Copied Prompt!' : 'Copy Integration Prompt'}
                </button>
              </div>

              <div className="p-6 space-y-4">
                <pre className="p-4 bg-gray-950 text-gray-200 text-xs font-mono rounded-xl max-h-72 overflow-y-auto leading-relaxed border border-gray-800">
                  {AI_AGENT_PROMPT}
                </pre>
                <div className="flex items-center gap-2 text-xs text-violet-800 bg-violet-100/60 px-3 py-2 rounded-lg border border-violet-200">
                  <Sparkles size={14} className="shrink-0 text-violet-600" />
                  <span>
                    When you paste this prompt into your AI coding agent, it will automatically set up environment variables, create client wrappers, and wire up endpoints across your project.
                  </span>
                </div>
              </div>
            </div>

            {/* Authentication & Security */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Authentication &amp; API Key Management</h3>
                  <p className="text-xs text-gray-500">How to authenticate all API requests to the NexBotix platform</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                All requests to NexBotix API endpoints must include your API Key in the <IC>X-API-Key</IC> HTTP header. Keys always begin with the <IC>bsk_</IC> prefix and can be generated from the dashboard.
              </p>

              <div className="bg-gray-900 text-gray-200 rounded-xl p-4 font-mono text-xs space-y-2 border border-gray-800">
                <p className="text-gray-400"># Required HTTP Header in all requests</p>
                <p className="text-green-400 font-bold">X-API-Key: bsk_live_991823019283019238</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <Shield size={16} className="text-green-600" /> AES-256-GCM Encryption
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    All authentication tokens, third-party webhook headers, and SMTP credentials stored in NexBotix are encrypted at rest using industry-grade AES-256-GCM encryption.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" /> Rate Limits &amp; Quotas
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    API calls are rated per subscription tier. Bulk endpoints allow batching up to 50 recipients per single HTTP request for optimal throughput.
                  </p>
                </div>
              </div>
            </div>

            {/* HTTP Status Codes Table */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Standard HTTP Status Codes &amp; Errors</h3>
                  <p className="text-xs text-gray-500">Common status responses and troubleshooting steps</p>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Meaning</th>
                      <th className="px-4 py-3">Troubleshooting Guide</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-normal text-gray-700">
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-green-700">200 OK / 202 Accepted</td>
                      <td className="px-4 py-3">Request completed or queued for scheduling</td>
                      <td className="px-4 py-3 text-gray-500">Payload accepted; check job_id or response body.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-amber-600">400 Bad Request</td>
                      <td className="px-4 py-3">Invalid JSON structure or missing parameters</td>
                      <td className="px-4 py-3 text-gray-500">Verify phone format, recipient email, or max batch limits.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-red-600">401 Unauthorized</td>
                      <td className="px-4 py-3">Missing or invalid API key</td>
                      <td className="px-4 py-3 text-gray-500">Ensure <IC>X-API-Key</IC> header starts with <IC>bsk_</IC>.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-red-600">403 Forbidden</td>
                      <td className="px-4 py-3">Subscription expired or domain not whitelisted</td>
                      <td className="px-4 py-3 text-gray-500">Verify plan status or whitelist domain in chatbot settings.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-red-600">503 Service Unavailable</td>
                      <td className="px-4 py-3">WhatsApp session is disconnected or offline</td>
                      <td className="px-4 py-3 text-gray-500">Pair your WhatsApp session in the NexBotix Dashboard.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: CHATBOT WIDGET & IN-HOUSE AI
           ========================================================================= */}
        {activeTab === 'chatbot' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header Description */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-md space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/30 text-purple-300 flex items-center justify-center">
                  <Cpu size={22} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Website Chatbot &amp; In-House AI Integration</h2>
                  <p className="text-xs sm:text-sm text-purple-200">
                    Embed the AI chatbot on your website and route queries to your own proprietary AI backend (e.g. Legal AI, Medical AI, RAG server).
                  </p>
                </div>
              </div>
            </div>

            {/* In-House AI Routing Protocol Deep Dive */}
            <div className="bg-white border border-purple-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">How In-House AI Webhook Protocol Works</h3>
                  <p className="text-xs text-gray-500">Connect specialized legal models, private vector databases, or custom LLMs</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  {
                    step: '1',
                    title: 'Visitor Message',
                    desc: 'A user asks a specialized question in your website chatbot widget.',
                  },
                  {
                    step: '2',
                    title: 'Payload Templating',
                    desc: 'NexBotix replaces {{message}}, {{sessionId}}, etc. in your custom template.',
                  },
                  {
                    step: '3',
                    title: 'Webhook Request',
                    desc: 'NexBotix forwards request to your AI server with decrypted auth tokens.',
                  },
                  {
                    step: '4',
                    title: 'Response Extraction',
                    desc: 'Extracts the reply via dot-notation path and delivers answer to visitor.',
                  },
                ].map(item => (
                  <div key={item.step} className="bg-purple-50/50 border border-purple-100 rounded-xl p-4 text-xs space-y-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold inline-flex items-center justify-center text-[10px]">
                      {item.step}
                    </span>
                    <h4 className="font-bold text-purple-950 text-sm">{item.title}</h4>
                    <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-purple-100 pt-4 space-y-3">
                <h4 className="font-bold text-sm text-gray-900">Supported Dynamic Variable Tags</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <code className="font-bold text-purple-700">{`{{message}}`}</code>
                    <p className="text-gray-600 mt-1">The visitor&apos;s latest question or input query.</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <code className="font-bold text-purple-700">{`{{sessionId}}`}</code>
                    <p className="text-gray-600 mt-1">Unique conversation session identifier for memory tracking.</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <code className="font-bold text-purple-700">{`{{chatHistory}}`}</code>
                    <p className="text-gray-600 mt-1">Full chronological multi-turn message context array.</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <code className="font-bold text-purple-700">{`{{businessName}}`}</code>
                    <p className="text-gray-600 mt-1">Your configured business or firm identity name.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* In-House AI Backend Server Code */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900">
                Sample In-House AI Webhook Server Implementation
              </h3>
              <p className="text-xs text-gray-600">
                Deploy this lightweight server in Python (FastAPI), Node.js (Express), or Go to serve your internal models directly to NexBotix:
              </p>
              <CodeExample snippetKey="inhouse_ai_server" defaultTab="python" />
            </div>

            {/* Chatbot Public REST API */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">POST</span>
                <IC>/api/website-chatbot/chat</IC>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Programmatically submit questions to your configured chatbot (which routes to your in-house AI or built-in model).
              </p>
              <CodeExample snippetKey="chatbot_chat" defaultTab="curl" />
            </div>

            {/* Chatbot Leads Submit API */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">POST</span>
                <IC>/api/website-chatbot/leads/submit</IC>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Capture high-intent customer leads from your website forms or automated chatbot interactions.
              </p>
              <CodeExample snippetKey="chatbot_leads" defaultTab="curl" />
            </div>

            {/* Client-Side JavaScript Embed & SDK */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900">Website Embed Script &amp; Client SDK</h3>
              <p className="text-xs text-gray-600">
                Paste this one-line snippet before the closing <IC>&lt;/body&gt;</IC> tag of any website:
              </p>
              <div className="bg-gray-950 text-green-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
{`<script src="${BASE}/api/website-chatbot/script?apikey=YOUR_API_KEY" async></script>`}
              </div>

              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 pt-2">JavaScript SDK Methods</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5">Method</th>
                      <th className="px-4 py-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    <tr>
                      <td className="px-4 py-2.5 text-purple-700 font-bold">window.NexBotix.open()</td>
                      <td className="px-4 py-2.5 font-sans text-gray-600">Opens the chatbot popup modal programmatically.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-purple-700 font-bold">window.NexBotix.close()</td>
                      <td className="px-4 py-2.5 font-sans text-gray-600">Minimizes the chatbot modal.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-purple-700 font-bold">window.NexBotix.toggle()</td>
                      <td className="px-4 py-2.5 font-sans text-gray-600">Toggles open/close state.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 text-purple-700 font-bold">window.NexBotix.setUser({`{name, email, phone}`})</td>
                      <td className="px-4 py-2.5 font-sans text-gray-600">Pre-populates logged-in visitor details for automatic lead attribution.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: WHATSAPP MESSAGING
           ========================================================================= */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-900 to-green-950 text-white rounded-2xl p-6 sm:p-8 shadow-md space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/30 text-green-300 flex items-center justify-center">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">WhatsApp Messaging &amp; Automated Scheduling API</h2>
                  <p className="text-xs sm:text-sm text-green-200">
                    Send single text/media messages, broadcast personalized batch messages, and schedule future campaigns.
                  </p>
                </div>
              </div>
            </div>

            {/* 1. Single Message Send */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">POST</span>
                <IC>/api/v1/send</IC>
                <span className="text-xs text-gray-400">Single Message</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Send an immediate transactional message to any international phone number with country code.
              </p>
              <CodeExample snippetKey="send_single" defaultTab="curl" />
            </div>

            {/* 2. Bulk Personalized Messages */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">POST</span>
                <IC>/api/v1/send</IC>
                <span className="text-xs text-purple-600 font-semibold">Bulk Personalized (Max 50 / call)</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Send personalized messages using <IC>{`{{name}}`}</IC> dynamic variable substitution per recipient contact.
              </p>
              <CodeExample snippetKey="send_bulk" defaultTab="node-fetch" />
            </div>

            {/* 3. Scheduled Messages */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">POST</span>
                <IC>/api/v1/send</IC>
                <span className="text-xs text-blue-600 font-semibold">Scheduled ISO 8601 UTC</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Schedule messages for automatic future execution by supplying a valid ISO 8601 UTC timestamp in <IC>schedule_at</IC>.
              </p>
              <CodeExample snippetKey="schedule_send" defaultTab="curl" />
            </div>

            {/* 4. Schedule Management */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900">List &amp; Cancel Scheduled Message Jobs</h3>
              <p className="text-xs text-gray-600">
                Retrieve active scheduled jobs with their execution states (<IC>pending</IC>, <IC>running</IC>, <IC>done</IC>) or cancel a pending job.
              </p>
              <CodeExample snippetKey="schedule_mgmt" defaultTab="curl" />
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: EMAIL SENDING API
           ========================================================================= */}
        {activeTab === 'email' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-md space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/30 text-blue-300 flex items-center justify-center">
                  <Mail size={22} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Omnichannel Email Sending API</h2>
                  <p className="text-xs sm:text-sm text-blue-200">
                    Send transactional, order confirmation, and marketing emails routed through your configured SMTP or Hostinger servers.
                  </p>
                </div>
              </div>
            </div>

            {/* Email Send Endpoint */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">POST</span>
                <IC>/api/v1/email/send</IC>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Trigger transactional emails with customizable HTML content, subject line, and recipient headers.
              </p>

              <CodeExample snippetKey="email_send" defaultTab="curl" />

              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 pt-2">Payload Parameters</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5">Field</th>
                      <th className="px-4 py-2.5">Type</th>
                      <th className="px-4 py-2.5">Required</th>
                      <th className="px-4 py-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-normal">
                    <tr>
                      <td className="px-4 py-2.5 font-mono font-bold text-purple-700">to</td>
                      <td className="px-4 py-2.5 font-mono text-gray-600">string</td>
                      <td className="px-4 py-2.5 text-red-600 font-bold">Yes</td>
                      <td className="px-4 py-2.5 text-gray-600">Recipient email address (e.g. <IC>client@example.com</IC>).</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-mono font-bold text-purple-700">subject</td>
                      <td className="px-4 py-2.5 font-mono text-gray-600">string</td>
                      <td className="px-4 py-2.5 text-red-600 font-bold">Yes</td>
                      <td className="px-4 py-2.5 text-gray-600">Subject line of the email.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-mono font-bold text-purple-700">body</td>
                      <td className="px-4 py-2.5 font-mono text-gray-600">string</td>
                      <td className="px-4 py-2.5 text-red-600 font-bold">Yes</td>
                      <td className="px-4 py-2.5 text-gray-600">HTML or plain text message content.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-mono text-gray-700">isHtml</td>
                      <td className="px-4 py-2.5 font-mono text-gray-600">boolean</td>
                      <td className="px-4 py-2.5 text-gray-400">Optional</td>
                      <td className="px-4 py-2.5 text-gray-600">Default: <IC>true</IC>. Enable HTML rendering for styled templates.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: MODEL CONTEXT PROTOCOL (MCP)
           ========================================================================= */}
        {activeTab === 'mcp' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-gray-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/30 text-purple-300 flex items-center justify-center">
                  <Terminal size={22} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Model Context Protocol (MCP) Server</h2>
                  <p className="text-xs sm:text-sm text-gray-300">
                    Connect autonomous AI coding agents (Claude Desktop, Cursor, Windsurf, LangChain) directly to NexBotix via streamable HTTP transport.
                  </p>
                </div>
              </div>
            </div>

            {/* MCP Endpoint & IDE Configs */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">POST</span>
                <IC>/api/mcp</IC>
                <span className="text-xs text-purple-600 font-semibold">Streamable HTTP Transport</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Exposes standard JSON-RPC 2.0 tools for autonomous agents to execute WhatsApp messaging, scheduling, bot health checks, and email delivery.
              </p>

              <h4 className="font-bold text-sm text-gray-900 pt-2">Agent &amp; IDE Configurations</h4>
              <CodeExample snippetKey="mcp_config" defaultTab="curl" />

              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 pt-3">Exposed MCP Tools &amp; Schemas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    name: 'send_whatsapp_message',
                    desc: 'Deliver an instant WhatsApp text/media message to any international phone number.',
                  },
                  {
                    name: 'schedule_whatsapp_message',
                    desc: 'Schedule a future WhatsApp message with an ISO 8601 UTC timestamp.',
                  },
                  {
                    name: 'list_scheduled_messages',
                    desc: 'Retrieve all queued, pending, and completed scheduled message jobs.',
                  },
                  {
                    name: 'cancel_scheduled_message',
                    desc: 'Cancel an upcoming scheduled message before execution begins.',
                  },
                  {
                    name: 'send_email',
                    desc: 'Send a transactional or notification email via configured SMTP server.',
                  },
                  {
                    name: 'get_bot_status',
                    desc: 'Verify if WhatsApp pairing and AI support bot are online and healthy.',
                  },
                ].map(tool => (
                  <div key={tool.name} className="border border-gray-200 rounded-xl p-3.5 bg-gray-50/70 text-xs space-y-1">
                    <span className="font-mono font-bold text-purple-800">{tool.name}</span>
                    <p className="text-gray-600 leading-relaxed">{tool.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: CALENDAR BOOKING API
           ========================================================================= */}
        {activeTab === 'calendar' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-amber-900 to-stone-900 text-white rounded-2xl p-6 sm:p-8 shadow-md space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center">
                  <Calendar size={22} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Calendar &amp; Meeting Booking API</h2>
                  <p className="text-xs sm:text-sm text-amber-200">
                    Book consultations, query time-slot availability, and generate Google Meet links automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* Public Booking Endpoint */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">POST</span>
                <IC>/api/calendar/public/:user/:slug/book</IC>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Allow clients or third-party web apps to schedule calendar events, generate automated Google Meet links, and send calendar invites.
              </p>

              <CodeExample snippetKey="calendar_booking" defaultTab="curl" />

              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 pt-2">Public Booking Embed Iframe</h4>
              <div className="bg-gray-950 text-green-400 p-4 rounded-xl font-mono text-xs overflow-x-auto">
{`<iframe
  src="${BASE}/book/YOUR_USERNAME/YOUR_EVENT_SLUG"
  style="width: 100%; height: 700px; border: none; border-radius: 12px;"
></iframe>`}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: MARKETING, QUORA & MEDIUM AI
           ========================================================================= */}
        {activeTab === 'marketing' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-pink-900 to-rose-950 text-white rounded-2xl p-6 sm:p-8 shadow-md space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/30 text-pink-300 flex items-center justify-center">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Marketing, Quora &amp; Medium AI APIs</h2>
                  <p className="text-xs sm:text-sm text-pink-200">
                    Automate high-authority contextual Quora answers, Medium blog posts, and ingest Core Web Vitals telemetry.
                  </p>
                </div>
              </div>
            </div>

            {/* Endpoints */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-gray-900">Content Generation &amp; SEO Endpoints</h3>
              <CodeExample snippetKey="marketing_ai" defaultTab="curl" />

              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-700 pt-2">Available Endpoints Reference</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5">Endpoint</th>
                      <th className="px-4 py-2.5">Method</th>
                      <th className="px-4 py-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    <tr>
                      <td className="px-4 py-2.5 font-bold text-gray-900">/api/v1/quora/generate-answer</td>
                      <td className="px-4 py-2.5 text-green-700">POST</td>
                      <td className="px-4 py-2.5 font-sans text-gray-600">Generates contextual high-authority answers for Quora threads.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-bold text-gray-900">/api/v1/medium/generate-post</td>
                      <td className="px-4 py-2.5 text-green-700">POST</td>
                      <td className="px-4 py-2.5 font-sans text-gray-600">Generates long-form SEO articles with markdown formatting for Medium.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-bold text-gray-900">/api/seo/track</td>
                      <td className="px-4 py-2.5 text-green-700">POST</td>
                      <td className="px-4 py-2.5 font-sans text-gray-600">Ingests Core Web Vitals telemetry (LCP, FID, CLS, TTFB, INP).</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-bold text-gray-900">/api/seo/script</td>
                      <td className="px-4 py-2.5 text-blue-700">GET</td>
                      <td className="px-4 py-2.5 font-sans text-gray-600">Serves client-side Core Web Vitals telemetry tracking script.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA Box */}
        <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900">Ready to build?</h3>
          <p className="text-gray-600 text-sm max-w-xl mx-auto">
            Generate your developer API key, copy the prompt into your AI agent or IDE, and integrate NexBotix services today.
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
