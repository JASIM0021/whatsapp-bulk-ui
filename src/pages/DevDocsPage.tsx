import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronRight, Terminal, Zap, Shield, Code2, BookOpen, AlertCircle } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

// ─── Code snippets ─────────────────────────────────────────────────────────────

const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';

const snippets: Record<string, Record<string, string>> = {
  send_single: {
    curl: `curl -X POST ${BASE}/api/v1/send \\
  -H "X-API-Key: bsk_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"919876543210","message":{"text":"Hello! Your OTP is 1234"}}'`,

    'node-fetch': `const res = await fetch('${BASE}/api/v1/send', {
  method: 'POST',
  headers: {
    'X-API-Key': 'bsk_your_key_here',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone: '919876543210',
    message: { text: 'Hello! Your OTP is 1234' },
  }),
});
const data = await res.json();
console.log(data);`,

    axios: `const axios = require('axios');

const { data } = await axios.post('${BASE}/api/v1/send', {
  phone: '919876543210',
  message: { text: 'Hello! Your OTP is 1234' },
}, {
  headers: { 'X-API-Key': 'bsk_your_key_here' },
});
console.log(data);`,

    python: `import requests

response = requests.post(
    '${BASE}/api/v1/send',
    headers={'X-API-Key': 'bsk_your_key_here'},
    json={
        'phone': '919876543210',
        'message': {'text': 'Hello! Your OTP is 1234'},
    }
)
print(response.json())`,

    php: `<?php
$ch = curl_init('${BASE}/api/v1/send');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'X-API-Key: bsk_your_key_here',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'phone'   => '919876543210',
        'message' => ['text' => 'Hello! Your OTP is 1234'],
    ]),
]);
echo curl_exec($ch);`,

    go: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    body, _ := json.Marshal(map[string]any{
        "phone":   "919876543210",
        "message": map[string]string{"text": "Hello! Your OTP is 1234"},
    })
    req, _ := http.NewRequest("POST", "${BASE}/api/v1/send", bytes.NewBuffer(body))
    req.Header.Set("X-API-Key", "bsk_your_key_here")
    req.Header.Set("Content-Type", "application/json")
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,

    ruby: `require 'net/http'
require 'json'
require 'uri'

uri  = URI('${BASE}/api/v1/send')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = uri.scheme == 'https'

req = Net::HTTP::Post.new(uri)
req['X-API-Key']    = 'bsk_your_key_here'
req['Content-Type'] = 'application/json'
req.body = { phone: '919876543210', message: { text: 'Hello! Your OTP is 1234' } }.to_json

res = http.request(req)
puts res.body`,
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
    "message": {"text":"Hi {{name}}, your order is confirmed!"}
  }'`,

    'node-fetch': `const contacts = [
  { phone: '919876543210', name: 'Rahul' },
  { phone: '919123456789', name: 'Priya' },
  { phone: '918765432109', name: 'Amit'  },
];

const res = await fetch('${BASE}/api/v1/send', {
  method: 'POST',
  headers: {
    'X-API-Key': 'bsk_your_key_here',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    contacts,
    message: { text: 'Hi {{name}}, your order is confirmed!' },
  }),
});
const data = await res.json();
// { success: true, sent: 3, failed: 0, total: 3 }
console.log(data);`,

    axios: `const axios = require('axios');

const { data } = await axios.post('${BASE}/api/v1/send', {
  contacts: [
    { phone: '919876543210', name: 'Rahul' },
    { phone: '919123456789', name: 'Priya' },
  ],
  message: { text: 'Hi {{name}}, your order is confirmed!' },
}, {
  headers: { 'X-API-Key': 'bsk_your_key_here' },
});
console.log(data);`,

    python: `import requests

contacts = [
    {'phone': '919876543210', 'name': 'Rahul'},
    {'phone': '919123456789', 'name': 'Priya'},
]

response = requests.post(
    '${BASE}/api/v1/send',
    headers={'X-API-Key': 'bsk_your_key_here'},
    json={
        'contacts': contacts,
        'message': {'text': 'Hi {{name}}, your order is confirmed!'},
    }
)
print(response.json())`,

    php: `<?php
$contacts = [
    ['phone' => '919876543210', 'name' => 'Rahul'],
    ['phone' => '919123456789', 'name' => 'Priya'],
];

$ch = curl_init('${BASE}/api/v1/send');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'X-API-Key: bsk_your_key_here',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'contacts' => $contacts,
        'message'  => ['text' => 'Hi {{name}}, your order is confirmed!'],
    ]),
]);
echo curl_exec($ch);`,

    go: `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
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
            "text": "Hi {{name}}, your order is confirmed!",
        },
    }
    body, _ := json.Marshal(payload)
    req, _ := http.NewRequest("POST", "${BASE}/api/v1/send", bytes.NewBuffer(body))
    req.Header.Set("X-API-Key", "bsk_your_key_here")
    req.Header.Set("Content-Type", "application/json")
    resp, _ := http.DefaultClient.Do(req)
    defer resp.Body.Close()
    fmt.Println(resp.Status)
}`,

    ruby: `require 'net/http'
require 'json'
require 'uri'

uri = URI('${BASE}/api/v1/send')
http = Net::HTTP.new(uri.host, uri.port)
http.use_ssl = uri.scheme == 'https'

req = Net::HTTP::Post.new(uri)
req['X-API-Key']    = 'bsk_your_key_here'
req['Content-Type'] = 'application/json'
req.body = {
  contacts: [
    { phone: '919876543210', name: 'Rahul' },
    { phone: '919123456789', name: 'Priya' },
  ],
  message: { text: 'Hi {{name}}, your order is confirmed!' },
}.to_json

puts http.request(req).body`,
  },
};

// ─── Tab labels ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'curl',       label: 'cURL' },
  { id: 'node-fetch', label: 'Node.js' },
  { id: 'axios',      label: 'Axios' },
  { id: 'python',     label: 'Python' },
  { id: 'php',        label: 'PHP' },
  { id: 'go',         label: 'Go' },
  { id: 'ruby',       label: 'Ruby' },
];

// ─── CodeBlock component ───────────────────────────────────────────────────────

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
        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs rounded-lg transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

// ─── Multi-tab code example ───────────────────────────────────────────────────

function CodeExample({ snippetKey, defaultTab = 'curl' }: { snippetKey: string; defaultTab?: string }) {
  const [tab, setTab] = useState(defaultTab);
  const code = snippets[snippetKey]?.[tab] ?? '';
  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden">
      {/* Tab bar */}
      <div className="flex overflow-x-auto bg-gray-900 border-b border-gray-800 scrollbar-hide">
        {TABS.map(t => (
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

// ─── Collapsible section ───────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, defaultOpen = false }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </button>
      {open && <div className="px-6 py-6 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Inline code ──────────────────────────────────────────────────────────────

function IC({ children }: { children: React.ReactNode }) {
  return <code className="bg-gray-100 text-green-700 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
}

// ─── Main docs page ───────────────────────────────────────────────────────────

export function DevDocsPage() {
  useSEO({
    title: 'Developer API Docs - WhatsApp Bulk Messenger',
    description: 'Documentation for integrating WhatsApp Bulk Messenger API to send automated basic and bulk messages programmatically.',
    url: 'https://bulksender.todayintech.in/docs'
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-950 to-gray-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium mb-6">
            <Terminal className="w-3.5 h-3.5" />
            Developer API — v1
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            API Documentation
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl">
            Send WhatsApp messages programmatically from any language. One endpoint, one API key, no browser required.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">

        {/* Quick start */}
        <Section title="Quick Start" icon={Zap} defaultOpen>
          <p className="text-gray-600 text-sm">
            Get your API key from the <a href="/subscription" className="text-green-600 underline">Subscription page → Developer API</a>. Then make a POST request to send your first message.
          </p>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Send a single message</h4>
            <CodeExample snippetKey="send_single" />
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            <strong>Response (success):</strong>
            <pre className="mt-2 font-mono text-xs bg-green-100 rounded-lg p-3 overflow-x-auto">
{`{
  "success": true,
  "sent": 1,
  "failed": 0,
  "total": 1
}`}
            </pre>
          </div>
        </Section>

        {/* Authentication */}
        <Section title="Authentication" icon={Shield}>
          <p className="text-sm text-gray-600">
            Every request must include your API key in the <IC>X-API-Key</IC> header. Keys start with <IC>bsk_</IC>.
          </p>
          <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Header</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Value</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Required</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 font-mono text-xs">X-API-Key</td>
                <td className="px-4 py-3 text-gray-600"><IC>bsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</IC></td>
                <td className="px-4 py-3 text-green-600 font-medium">Yes</td>
              </tr>
              <tr className="border-t border-gray-100">
                <td className="px-4 py-3 font-mono text-xs">Content-Type</td>
                <td className="px-4 py-3 text-gray-600"><IC>application/json</IC></td>
                <td className="px-4 py-3 text-green-600 font-medium">Yes</td>
              </tr>
            </tbody>
          </table>
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>Your API key carries full send access. Never expose it in client-side code or public repositories. Store it in environment variables.</p>
          </div>
        </Section>

        {/* Endpoint reference */}
        <Section title="Endpoint Reference" icon={BookOpen}>
          {/* POST /api/v1/send */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">POST</span>
              <IC>/api/v1/send</IC>
            </div>
            <p className="text-sm text-gray-600">
              Send a WhatsApp message to one or multiple recipients. Replies with a JSON summary after all messages are dispatched.
            </p>

            <h4 className="font-semibold text-gray-800 text-sm">Request body</h4>
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Field</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-green-700">phone</td>
                  <td className="px-4 py-3 text-gray-500">string</td>
                  <td className="px-4 py-3 text-gray-600">Single recipient phone with country code (e.g. <IC>919876543210</IC>). Use either <IC>phone</IC> or <IC>contacts</IC>.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-green-700">contacts</td>
                  <td className="px-4 py-3 text-gray-500">array</td>
                  <td className="px-4 py-3 text-gray-600">Array of <IC>{`{phone, name?}`}</IC> objects. Max 50 per call.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-green-700">message.text</td>
                  <td className="px-4 py-3 text-gray-500">string</td>
                  <td className="px-4 py-3 text-gray-600">Message text. Supports <IC>{'{{name}}'}</IC> placeholder replaced per contact.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">message.imageUrl</td>
                  <td className="px-4 py-3 text-gray-500">string</td>
                  <td className="px-4 py-3 text-gray-600">Optional public image URL to attach to every message.</td>
                </tr>
              </tbody>
            </table>

            <h4 className="font-semibold text-gray-800 text-sm">Response</h4>
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Field</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-4 py-3 font-mono text-xs">success</td><td className="px-4 py-3 text-gray-500">bool</td><td className="px-4 py-3 text-gray-600">True only if all messages sent without error.</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">sent</td><td className="px-4 py-3 text-gray-500">int</td><td className="px-4 py-3 text-gray-600">Number of messages successfully sent.</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">failed</td><td className="px-4 py-3 text-gray-500">int</td><td className="px-4 py-3 text-gray-600">Number of messages that failed.</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">total</td><td className="px-4 py-3 text-gray-500">int</td><td className="px-4 py-3 text-gray-600">Total contacts in the request.</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs">errors</td><td className="px-4 py-3 text-gray-500">string[]</td><td className="px-4 py-3 text-gray-600">Per-contact error messages (only present if failed &gt; 0).</td></tr>
              </tbody>
            </table>

            <h4 className="font-semibold text-gray-800 text-sm">HTTP status codes</h4>
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <tbody className="divide-y divide-gray-100">
                <tr><td className="px-4 py-3 font-mono text-xs text-green-700">200</td><td className="px-4 py-3 text-gray-600">Messages dispatched (check <IC>failed</IC> count for partial failures)</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs text-amber-600">400</td><td className="px-4 py-3 text-gray-600">Invalid request (missing fields, too many contacts)</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs text-red-600">401</td><td className="px-4 py-3 text-gray-600">Missing or invalid API key</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs text-red-600">403</td><td className="px-4 py-3 text-gray-600">Subscription expired</td></tr>
                <tr><td className="px-4 py-3 font-mono text-xs text-red-600">503</td><td className="px-4 py-3 text-gray-600">WhatsApp not connected — scan QR in dashboard first</td></tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Bulk messaging */}
        <Section title="Bulk Messaging with Name Personalisation" icon={Code2}>
          <p className="text-sm text-gray-600">
            Send up to <strong>50 contacts per call</strong>. Use <IC>{'{{name}}'}</IC> in your message text and it will be replaced with each contact's name automatically.
          </p>
          <CodeExample snippetKey="send_bulk" defaultTab="node-fetch" />
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <strong>Rate limiting:</strong> The API inserts a <strong>3–5 second delay</strong> between each message to comply with WhatsApp's guidelines. A request with 50 contacts can take up to <strong>~4 minutes</strong> to complete. Set your HTTP client timeout accordingly.
          </div>
        </Section>

        {/* Error handling */}
        <Section title="Error Handling" icon={AlertCircle}>
          <p className="text-sm text-gray-600">All errors return a JSON body with an <IC>error</IC> field:</p>
          <pre className="bg-gray-950 text-red-400 text-xs p-4 rounded-xl overflow-x-auto font-mono">
{`// 401 - missing/invalid key
{"success": false, "error": "invalid or inactive API key"}

// 403 - subscription expired
{"success": false, "error": "subscription_expired"}

// 503 - WhatsApp not connected
{"success": false, "error": "WhatsApp not connected. Please connect via the dashboard first."}

// 400 - too many contacts
{"success": false, "error": "maximum 50 contacts per call"}`}
          </pre>
          <p className="text-sm text-gray-600">
            For partial failures (some contacts sent, some failed), the HTTP status is still <IC>200</IC> but <IC>failed &gt; 0</IC> and the <IC>errors</IC> array contains per-contact details.
          </p>
        </Section>

        {/* Best practices */}
        <Section title="Best Practices" icon={Shield}>
          <ul className="space-y-3 text-sm text-gray-700">
            {[
              ['Store your API key in environment variables', 'Never hardcode bsk_... in client-side JavaScript or git repos.'],
              ['Pre-format phone numbers', 'Include the country code without + or spaces. India: 91XXXXXXXXXX, US: 1XXXXXXXXXX.'],
              ['Connect WhatsApp before calling the API', 'Scan the QR code in your dashboard. The API returns 503 if not connected.'],
              ['Batch wisely', 'Max 50 contacts per call. For larger lists, split into batches and call sequentially — the server already adds delays.'],
              ['Handle partial failures', 'Always check the failed field. A 200 response doesn\'t mean every message succeeded.'],
              ['Use {{name}} for personalisation', 'Pass name in each contact object and use {{name}} in your message text for per-contact personalisation.'],
            ].map(([title, desc]) => (
              <li key={title} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <div><strong className="text-gray-900">{title}:</strong> {desc}</div>
              </li>
            ))}
          </ul>
        </Section>

        {/* Get API key CTA */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to start?</h3>
          <p className="text-gray-600 text-sm mb-6">Generate your API key from the Subscription page and start sending in minutes.</p>
          <a
            href="/subscription"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-green-600/25"
          >
            <Zap className="w-4 h-4" />
            Get My API Key
          </a>
        </div>

      </div>
    </div>
  );
}
