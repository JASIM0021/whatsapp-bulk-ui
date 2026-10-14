import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, apiFetch } from '@/config/api';
import { Check, ArrowLeft, Loader2, CreditCard, Calendar, Code, Copy, ChevronDown, ChevronUp, Trash2, Plus, ExternalLink, Sparkles } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditsPanel, type CreditsInfo } from '@/components/billing/CreditsPanel';

interface SubscriptionInfo {
  creditMode?: boolean;
  credits?: CreditsInfo;
  plan: string;
  status: string;
  expiryDate: string;
  isActive: boolean;
  daysLeft: number;
  messagesUsed: number;
  messageLimit: number;
  botRepliesUsed?: number;
  botRepliesLimit?: number;
  isBYOKActive?: boolean;
  enabledServices?: string[];
}

interface PayUFormData {
  gateway: 'payu';
  action: string;
  key: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  hash: string;
  udf1: string;
  udf2: string;
  udf3: string;
  udf4: string;
  udf5: string;
}

interface RazorpayOrderData {
  gateway: 'razorpay';
  orderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
  txnId: string;
  description: string;
  prefillName: string;
  prefillEmail: string;
  prefillPhone: string;
}

type PaymentInitData = PayUFormData | RazorpayOrderData;

const loadRazorpayScript = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if ((window as any).Razorpay) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });

interface PaymentRecord {
  id: string;
  txnId: string;
  amount: number;
  plan: string;
  status: string;
  createdAt: string;
}

interface PublicPlan {
  plan: string;
  name: string;
  description: string;
  amount: number;
  messageLimit: number;
  durationDays: number;
  services: string[];
  features: string[];
  highlight: boolean;
  isVisible: boolean;
  isAdminOnly: boolean;
  displayOrder: number;
}

type LivePricing = Record<string, PublicPlan>;


interface APIKeyInfo {
  id: string;
  name: string;
  key?: string;       // only present on creation
  keyPreview: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

interface CurrencyInfo {
  country: string;
  currency: string;   // "INR" | "USD"
  symbol: string;     // "₹" | "$"
  exchangeRate: number; // multiplier from INR
  isIndia: boolean;
}

// ─── Code example tabs ────────────────────────────────────────────────────────

const BASE = typeof window !== 'undefined' ? window.location.origin : '';

const CODE_TABS = [
  { id: 'curl',       label: 'cURL' },
  { id: 'node-fetch', label: 'Node.js' },
  { id: 'axios',      label: 'Axios' },
  { id: 'python',     label: 'Python' },
  { id: 'php',        label: 'PHP' },
  { id: 'go',         label: 'Go' },
  { id: 'ruby',       label: 'Ruby' },
];

const CODE_SNIPPETS: Record<string, string> = {
  curl: `curl -X POST ${BASE}/api/v1/send \\
  -H "X-API-Key: nex_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"919876543210","message":{"text":"Hello! Your OTP is 1234"}}'`,

  'node-fetch': `const res = await fetch('${BASE}/api/v1/send', {
  method: 'POST',
  headers: {
    'X-API-Key': 'nex_your_key_here',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone: '919876543210',
    message: { text: 'Hello! Your OTP is 1234' },
  }),
});
const data = await res.json();
console.log(data); // { success: true, sent: 1, failed: 0, total: 1 }`,

  axios: `const axios = require('axios');

const { data } = await axios.post('${BASE}/api/v1/send', {
  phone: '919876543210',
  message: { text: 'Hello! Your OTP is 1234' },
}, {
  headers: { 'X-API-Key': 'nex_your_key_here' },
});
console.log(data);`,

  python: `import requests

response = requests.post(
    '${BASE}/api/v1/send',
    headers={'X-API-Key': 'nex_your_key_here'},
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
        'X-API-Key: nex_your_key_here',
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
    req.Header.Set("X-API-Key", "nex_your_key_here")
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
req['X-API-Key']    = 'nex_your_key_here'
req['Content-Type'] = 'application/json'
req.body = { phone: '919876543210', message: { text: 'Hello! Your OTP is 1234' } }.to_json

puts http.request(req).body`,
};

function CodeExamples() {
  const [tab, setTab] = useState('curl');
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(CODE_SNIPPETS[tab] || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
      >
        <span>Code examples — send a message</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && (
        <>
          {/* Language tabs */}
          <div className="flex overflow-x-auto bg-gray-900 border-b border-gray-800">
            {CODE_TABS.map(t => (
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
          {/* Code block */}
          <div className="relative">
            <pre className="bg-gray-950 text-green-400 text-xs p-4 overflow-x-auto leading-relaxed font-mono">
              {CODE_SNIPPETS[tab]}
            </pre>
            <button
              onClick={copy}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          {/* Full docs link */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">Bulk send, image attachments, personalisation and more</span>
            <Link to="/docs" className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium">
              Full API Docs <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// ── MCP Setup Card ────────────────────────────────────────────────────────────

const MCP_ENDPOINT = 'https://nexbotix.online/api/mcp';

const MCP_CLIENTS = [
  {
    key: 'claude',
    label: 'Claude Desktop',
    snippet: (key: string) => JSON.stringify({
      mcpServers: {
        'botx-whatsapp': {
          url: MCP_ENDPOINT,
          headers: { 'X-API-Key': key },
        },
      },
    }, null, 2),
    note: 'Add to ~/Library/Application Support/Claude/claude_desktop_config.json (Mac) or %APPDATA%\\Claude\\claude_desktop_config.json (Windows)',
  },
  {
    key: 'cursor',
    label: 'Cursor',
    snippet: (key: string) => JSON.stringify({
      mcpServers: {
        'botx-whatsapp': {
          url: MCP_ENDPOINT,
          headers: { 'X-API-Key': key },
        },
      },
    }, null, 2),
    note: 'Add to .cursor/mcp.json in your project root, or Cursor Settings → MCP',
  },
  {
    key: 'generic',
    label: 'Any MCP Client',
    snippet: (key: string) =>
`Server URL:  ${MCP_ENDPOINT}
Transport:   Streamable HTTP (POST)
Auth header: X-API-Key: ${key}

Supports: Claude Desktop 0.7+, Cursor 0.42+, Windsurf, and any MCP Streamable HTTP client.`,
    note: 'Paste the URL and header into your AI agent\'s MCP server settings',
  },
];

function MCPSetupCard({ apiKey }: { apiKey: string | null }) {
  const [open, setOpen] = useState(false);
  const [activeClient, setActiveClient] = useState('claude');
  const [copied, setCopied] = useState(false);
  const displayKey = apiKey ?? 'YOUR_API_KEY';
  const client = MCP_CLIENTS.find(c => c.key === activeClient)!;

  const copy = () => {
    navigator.clipboard.writeText(client.snippet(displayKey)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="border border-purple-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-900">MCP Server — Control WhatsApp from AI Agents</span>
          <span className="hidden sm:inline text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-medium">New</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-purple-600" /> : <ChevronDown className="w-4 h-4 text-purple-600" />}
      </button>

      {open && (
        <div className="p-4 space-y-4 bg-white">
          <p className="text-sm text-gray-600">
            Connect your AI agent to WhatsApp using the <strong>Model Context Protocol</strong>. Once connected, your agent can send messages, check status, manage schedules, and more — no code required.
          </p>

          <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Endpoint</span>
            <code className="text-xs font-mono text-gray-800 flex-1">{MCP_ENDPOINT}</code>
          </div>

          {/* Available tools */}
          <div className="flex flex-wrap gap-1.5">
            {['get_status', 'send_message', 'send_bulk', 'schedule_message', 'get_contacts', 'list_schedules', 'cancel_schedule'].map(t => (
              <span key={t} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{t}</span>
            ))}
          </div>

          {/* Client tabs */}
          <div className="flex gap-1 border-b border-gray-100 pb-0">
            {MCP_CLIENTS.map(c => (
              <button
                key={c.key}
                onClick={() => setActiveClient(c.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
                  activeClient === c.key
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Snippet */}
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
              {client.snippet(displayKey)}
            </pre>
            <button
              onClick={copy}
              className="absolute top-2 right-2 flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded text-xs transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <p className="text-xs text-gray-400">{client.note}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function SubscriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [livePricing, setLivePricing] = useState<LivePricing | null>(null);
  const [apiKeys, setApiKeys] = useState<APIKeyInfo[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo>({
    country: 'IN', currency: 'INR', symbol: '₹', exchangeRate: 1, isIndia: true,
  });
  // Helper: convert INR price → display string in user's currency
  const formatPrice = (inrAmount: number) => {
    if (currencyInfo.isIndia) return `₹${inrAmount.toLocaleString('en-IN')}`;
    const usd = inrAmount * currencyInfo.exchangeRate;
    return `$${usd.toFixed(2)}`;
  };

  useEffect(() => {
    fetchData();
    fetchApiKeys();
    // Fetch live pricing
    fetch(API_ENDPOINTS.subscription.plans)
      .then(r => r.json())
      .then(data => { if (data.success && data.data) setLivePricing(data.data); })
      .catch(() => {});
    // Detect user's currency — support ?testCurrency=US for local dev testing
    const testCountry = new URLSearchParams(window.location.search).get('testCurrency');
    const currencyUrl = `${API_ENDPOINTS.subscription.currency}${testCountry ? `?country=${testCountry}` : ''}`;
    fetch(currencyUrl)
      .then(r => r.json())
      .then(data => { if (data.success && data.data) setCurrencyInfo(data.data); })
      .catch(() => {}); // keep default INR on failure
  }, []);

  const fetchApiKeys = async () => {
    setApiKeysLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.apiKeys.list);
      const data = await res.json();
      if (data.success) setApiKeys(data.data || []);
    } catch {
      // ignore
    } finally {
      setApiKeysLoading(false);
    }
  };

  const handleCreateKey = async () => {
    setCreatingKey(true);
    setNewKeyValue(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.apiKeys.create, {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName.trim() || 'Default' }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to generate key');
        return;
      }
      setNewKeyValue(data.data.key);
      setNewKeyName('');
      setApiKeys(prev => [data.data, ...prev]);
    } catch {
      alert('Failed to generate key');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Revoke this API key? Any apps using it will stop working.')) return;
    try {
      const res = await apiFetch(API_ENDPOINTS.apiKeys.revoke(id), { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setApiKeys(prev => prev.map(k => k.id === id ? { ...k, isActive: false } : k));
      }
    } catch {
      // ignore
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    });
  };

  const fetchData = async () => {
    try {
      const [subRes, payRes] = await Promise.all([
        apiFetch(API_ENDPOINTS.subscription.status),
        apiFetch(API_ENDPOINTS.subscription.history),
      ]);
      const subData = await subRes.json();
      const payData = await payRes.json();
      if (subData.success) setSubscription(subData.data);
      if (payData.success) setPayments(payData.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string, appliedPromo = '') => {
    if (plan === 'free' || plan === 'trial') return;
    setPaying(plan);
    try {
      const res = await apiFetch(API_ENDPOINTS.subscription.initiate, {
        method: 'POST',
        body: JSON.stringify({ plan, promoCode: appliedPromo, currency: currencyInfo.currency }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to initiate payment');
        return;
      }

      const initData: PaymentInitData = data.data;

      if (initData.gateway === 'razorpay') {
        // ── Razorpay checkout ──────────────────────────────────────────────
        await loadRazorpayScript();
        const rzpData = initData as RazorpayOrderData;
        const options = {
          key: rzpData.keyId,
          amount: rzpData.amount,
          currency: rzpData.currency,
          name: 'NexBotix',
          description: rzpData.description,
          order_id: rzpData.orderId,
          prefill: {
            name: rzpData.prefillName,
            email: rzpData.prefillEmail,
            contact: rzpData.prefillPhone,
          },
          theme: { color: '#22c55e' },
          modal: { ondismiss: () => setPaying(null) },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              const verifyRes = await apiFetch(API_ENDPOINTS.subscription.razorpayVerify, {
                method: 'POST',
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  txnId: rzpData.txnId,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                window.location.href = `/payment/success?txnid=${verifyData.data.txnId}`;
              } else {
                window.location.href = `/payment/failure?error=${encodeURIComponent(verifyData.error || 'verification_failed')}`;
              }
            } catch {
              window.location.href = '/payment/failure?error=verification_error';
            }
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return; // setPaying handled by modal ondismiss or redirect
      }

      // ── PayU hidden form POST ──────────────────────────────────────────
      const formData = initData as PayUFormData;
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = formData.action;

      const fields: Record<string, string> = {
        key: formData.key,
        txnid: formData.txnid,
        amount: formData.amount,
        productinfo: formData.productinfo,
        firstname: formData.firstname,
        email: formData.email,
        phone: formData.phone,
        surl: formData.surl,
        furl: formData.furl,
        hash: formData.hash,
        udf1: formData.udf1,
        udf2: formData.udf2,
        udf3: formData.udf3,
        udf4: formData.udf4,
        udf5: formData.udf5,
      };

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch {
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setPaying(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-sky-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to App</span>
          </button>
          <div className="flex-1" />
          <span className="hidden sm:block text-sm text-gray-500 truncate max-w-[200px]">Logged in as {user?.email}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <CreditsPanel
          subscription={subscription}
          pricing={livePricing}
          formatPrice={formatPrice}
          paying={paying}
          onBuy={(plan, promo) => handleUpgrade(plan, promo)}
        />

        {/* Developer API Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Developer API Access
          </h2>

          {(!subscription?.isActive) ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
              <Code className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">API access requires an active subscription or free trial.</p>
              <p className="text-sm text-gray-400 mt-1">Subscribe to any plan or start a free trial to enable developer API access. Note: When your trial or subscription expires, API keys automatically cease to function.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
              <p className="text-sm text-gray-600">
                Use your API key to send WhatsApp messages directly from your own software — OTP delivery, promotional campaigns, and more.
                <span className="block mt-1 text-xs text-amber-600 font-medium">⚡ Free Trial Note: API keys created during a free trial will automatically cease to function when the trial expires.</span>
              </p>

              {/* New key shown once */}
              {newKeyValue && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
                  <p className="text-sm font-semibold text-amber-800 mb-2">Save this key — it won't be shown again</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm font-mono break-all">{newKeyValue}</code>
                    <button
                      onClick={() => copyToClipboard(newKeyValue)}
                      className="shrink-0 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      {copiedKey ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <button onClick={() => setNewKeyValue(null)} className="mt-2 text-xs text-amber-600 hover:text-amber-800 underline">Dismiss</button>
                </div>
              )}

              {/* Generate key form */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <input
                  type="text"
                  placeholder="Key label (e.g. Production)"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <button
                  onClick={handleCreateKey}
                  disabled={creatingKey}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors"
                >
                  {creatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Generate New Key
                </button>
              </div>

              {/* Keys table */}
              {apiKeysLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading keys...
                </div>
              ) : apiKeys.length > 0 ? (
                <>
                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-medium text-gray-500">Key</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">Name</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">Created</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">Last Used</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
                          <th className="py-2 px-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {apiKeys.map(k => (
                          <tr key={k.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 px-3 font-mono text-xs text-gray-700">{k.keyPreview}</td>
                            <td className="py-2 px-3 text-gray-700">{k.name}</td>
                            <td className="py-2 px-3 text-gray-500">{new Date(k.createdAt).toLocaleDateString()}</td>
                            <td className="py-2 px-3 text-gray-500">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : '—'}</td>
                            <td className="py-2 px-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${k.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {k.isActive ? 'Active' : 'Revoked'}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              {k.isActive && (
                                <button
                                  onClick={() => handleRevokeKey(k.id)}
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                  title="Revoke key"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Mobile cards */}
                  <div className="sm:hidden space-y-3">
                    {apiKeys.map(k => (
                      <div key={k.id} className="border border-gray-200 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-900 text-sm truncate">{k.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${k.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {k.isActive ? 'Active' : 'Revoked'}
                            </span>
                            {k.isActive && (
                              <button
                                onClick={() => handleRevokeKey(k.id)}
                                className="text-red-400 hover:text-red-600 transition-colors"
                                title="Revoke key"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="font-mono text-xs text-gray-500 break-all">{k.keyPreview}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                          <span>Used: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : '—'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400">No API keys yet. Generate one above.</p>
              )}

              {/* Multi-language code examples */}
              <CodeExamples />

              {/* MCP Server setup */}
              <MCPSetupCard apiKey={apiKeys[0]?.keyPreview ?? null} />
            </div>
          )}
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment History
            </h2>
            {/* Desktop table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Transaction ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Plan</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 px-4 font-mono text-xs">{p.txnId}</td>
                      <td className="py-3 px-4 capitalize">{p.plan}</td>
                      <td className="py-3 px-4 font-medium">₹{p.amount.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          p.status === 'success' ? 'bg-green-100 text-green-800' :
                          p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {payments.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="capitalize font-medium text-gray-900">{p.plan}</span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'success' ? 'bg-green-100 text-green-800' :
                      p.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-gray-900">₹{p.amount.toLocaleString()}</span>
                    <span className="text-gray-500 text-xs">{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="font-mono text-[10px] text-gray-400 truncate">{p.txnId}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
