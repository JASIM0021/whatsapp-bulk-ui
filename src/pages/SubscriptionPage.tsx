import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, apiFetch } from '@/config/api';
import { Check, Crown, Zap, Shield, ArrowLeft, Loader2, CreditCard, Calendar, Tag, X, Code, Copy, ChevronDown, ChevronUp, Trash2, Plus, ExternalLink } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface SubscriptionInfo {
  plan: string;
  status: string;
  expiryDate: string;
  isActive: boolean;
  daysLeft: number;
  messagesUsed: number;
  messageLimit: number;
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

const plans = [
  {
    id: 'free',
    monthlyId: 'free',
    yearlyId: 'free',
    name: 'Free Trial',
    monthlyPrice: 0,
    yearlyPrice: 0,
    msgLimit: '10 messages total',
    features: [
      'Send up to 10 messages total',
      'Basic templates',
      'File upload (Excel/CSV)',
      'WhatsApp QR connect',
    ],
    icon: Shield,
    color: 'from-gray-500 to-gray-600',
    btnClass: 'bg-gray-500 hover:bg-gray-600',
  },
  {
    id: 'starter',
    monthlyId: 'starter',
    yearlyId: 'starter_yearly',
    name: 'Starter',
    monthlyPrice: 599,
    yearlyPrice: 5990,
    msgLimit: '1,000 messages/month',
    features: [
      '1,000 messages per month',
      'All templates + custom',
      'File upload (Excel/CSV)',
      'WhatsApp QR connect',
      'Basic support',
      'API access',
    ],
    icon: Zap,
    color: 'from-sky-500 to-sky-600',
    btnClass: 'bg-sky-600 hover:bg-sky-700',
  },
  {
    id: 'growth',
    monthlyId: 'growth',
    yearlyId: 'growth_yearly',
    name: 'Growth',
    monthlyPrice: 1299,
    yearlyPrice: 12990,
    msgLimit: '5,000 messages/month',
    features: [
      '5,000 messages per month',
      'All templates + custom',
      'Image & media attachments',
      'Message scheduling',
      'Detailed analytics',
      'Priority support',
      'API access',
    ],
    icon: Crown,
    color: 'from-violet-500 to-violet-600',
    btnClass: 'bg-violet-600 hover:bg-violet-700',
    popular: true,
  },
  {
    id: 'business',
    monthlyId: 'business',
    yearlyId: 'business_yearly',
    name: 'Business',
    monthlyPrice: 1999,
    yearlyPrice: 19990,
    msgLimit: '15,000 messages/month',
    features: [
      '15,000 messages per month',
      'Everything in Growth',
      'Advanced automation',
      'Bulk import up to 10K',
      'Early access to features',
      'Priority support',
      'API access',
    ],
    icon: Zap,
    color: 'from-amber-500 to-amber-600',
    btnClass: 'bg-amber-600 hover:bg-amber-700',
  },
];

interface LivePricing {
  [plan: string]: { amount: number; messageLimit: number };
}

interface APIKeyInfo {
  id: string;
  name: string;
  key?: string;       // only present on creation
  keyPreview: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

interface ValidatePromoResponse {
  valid: boolean;
  code: string;
  discountType: string;
  discountValue: number;
  originalAmount: number;
  finalAmount: number;
  discountAmount: number;
  message?: string;
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
console.log(data); // { success: true, sent: 1, failed: 0, total: 1 }`,

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

// ─────────────────────────────────────────────────────────────────────────────

export function SubscriptionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [livePricing, setLivePricing] = useState<LivePricing | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promoValidation, setPromoValidation] = useState<ValidatePromoResponse | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [apiKeys, setApiKeys] = useState<APIKeyInfo[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    fetchData();
    fetchApiKeys();
    // Fetch live pricing (public endpoint, no auth needed)
    fetch(API_ENDPOINTS.subscription.plans)
      .then(r => r.json())
      .then(data => { if (data.success && data.data) setLivePricing(data.data); })
      .catch(() => {});
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

  const applyPromo = async (plan: string) => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoValidation(null);
    try {
      const res = await apiFetch(
        `${API_ENDPOINTS.subscription.validatePromo}?code=${encodeURIComponent(code)}&plan=${plan}`
      );
      const data = await res.json();
      if (data.success && data.data) {
        setPromoValidation(data.data);
      }
    } catch {
      // ignore
    } finally {
      setPromoLoading(false);
    }
  };

  const clearPromo = () => {
    setPromoInput('');
    setPromoValidation(null);
  };

  const handleUpgrade = async (plan: string) => {
    if (plan === 'free') return;
    setPaying(plan);
    const appliedPromo = promoValidation?.valid && promoValidation.code ? promoValidation.code : '';
    try {
      const res = await apiFetch(API_ENDPOINTS.subscription.initiate, {
        method: 'POST',
        body: JSON.stringify({ plan, promoCode: appliedPromo }),
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
          name: 'BulkSend',
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
          <span className="text-sm text-gray-500">Logged in as {user?.email}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Current Subscription Status */}
        {subscription && (
          <div className={`mb-8 p-6 rounded-2xl border ${subscription.isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Current Plan: <span className="capitalize">{subscription.plan}</span>
                </h2>
                <p className={`text-sm mt-1 ${subscription.isActive ? 'text-green-700' : 'text-red-700'}`}>
                  {subscription.isActive
                    ? subscription.messageLimit > 0
                      ? `Active — ${subscription.messageLimit - subscription.messagesUsed} of ${subscription.messageLimit} messages remaining`
                      : `Active — ${subscription.daysLeft} day${subscription.daysLeft !== 1 ? 's' : ''} remaining (expires ${subscription.expiryDate})`
                    : subscription.messageLimit > 0
                      ? `Quota exhausted (${subscription.messagesUsed}/${subscription.messageLimit} messages used). Upgrade or buy more messages.`
                      : `Expired — Please upgrade to continue using the app`}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${subscription.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {subscription.isActive ? 'Active' : 'Expired'}
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Choose Your Plan</h1>
        <p className="text-gray-500 text-center mb-6">Unlock the full power of WhatsApp Bulk Messaging</p>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setBilling('monthly')}
            className={`text-sm font-medium transition-colors ${billing === 'monthly' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Monthly
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={billing === 'yearly'}
            onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${billing === 'yearly' ? 'bg-violet-600' : 'bg-gray-300'}`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${billing === 'yearly' ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`text-sm font-medium transition-colors ${billing === 'yearly' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Yearly <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">Save ~17%</span>
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const activePlanId = billing === 'yearly' && plan.id !== 'free' ? plan.yearlyId : plan.monthlyId;
            const isCurrent = (subscription?.plan === plan.monthlyId || subscription?.plan === plan.yearlyId) && subscription?.isActive;
            const planRank: Record<string, number> = {
              free: 0,
              starter: 1, starter_yearly: 1,
              growth: 2, growth_yearly: 2,
              business: 3, business_yearly: 3,
              monthly: 1, yearly: 1,
            };
            const currentRank = planRank[subscription?.plan ?? 'free'] ?? 0;
            const isLowerThan = subscription?.isActive && planRank[plan.id] < currentRank;
            const defaultPrice = billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
            const livePrice = plan.id !== 'free' ? (livePricing?.[activePlanId]?.amount ?? defaultPrice) : 0;
            const freeMsgLimit = livePricing?.['free']?.messageLimit ?? 10;
            const displayPrice = plan.id === 'free' ? 0 : livePrice;
            const displayFeatures = plan.id === 'free'
              ? [`Send up to ${freeMsgLimit} messages total`, ...plan.features.slice(1)]
              : plan.features;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col transition-all hover:shadow-lg ${
                  plan.popular ? 'border-sky-500 shadow-sky-100 shadow-lg' : 'border-gray-200'
                } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-sky-600 text-white text-xs font-bold px-4 py-1.5 rounded-full">MOST POPULAR</span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3.5 right-4">
                    <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">CURRENT</span>
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2 mb-1">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {displayPrice === 0 ? 'Free' : `₹${displayPrice.toLocaleString()}`}
                  </span>
                  {displayPrice > 0 && (
                    <span className="text-gray-500 text-sm">{billing === 'yearly' ? '/year' : '/month'}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-4">{plan.id === 'free' ? `${freeMsgLimit} messages` : plan.msgLimit}</p>

                <ul className="flex-1 space-y-3 mb-6">
                  {displayFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.id === 'free' ? (
                  <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-medium cursor-not-allowed">
                    {isCurrent ? 'Current Plan' : 'Trial Only'}
                  </button>
                ) : (
                  <>
                    {/* Promo code section */}
                    {!isCurrent && !isLowerThan && (
                      <div className="mb-4 border border-violet-200 rounded-xl p-3 bg-violet-50">
                        <p className="text-xs font-semibold text-violet-600 mb-2 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" /> Have a promo code?
                        </p>
                        {promoValidation?.valid && selectedPlan === activePlanId ? (
                          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                            <div>
                              <span className="text-xs font-semibold text-green-700">{promoValidation.code} applied!</span>
                              <p className="text-xs text-green-600 mt-0.5">
                                ₹{promoValidation.discountAmount} off — Pay <strong>₹{promoValidation.finalAmount.toLocaleString()}</strong> instead of ₹{promoValidation.originalAmount.toLocaleString()}
                              </p>
                            </div>
                            <button onClick={clearPromo} className="ml-2 text-green-500 hover:text-green-700 shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : promoValidation && !promoValidation.valid && selectedPlan === activePlanId ? (
                          <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            <span className="text-xs text-red-600">{promoValidation.message || 'Invalid promo code'}</span>
                            <button onClick={clearPromo} className="ml-2 text-red-400 hover:text-red-600 shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Enter code (e.g. SAVE20)"
                              value={selectedPlan === activePlanId ? promoInput : ''}
                              onChange={e => {
                                setSelectedPlan(activePlanId);
                                setPromoInput(e.target.value.toUpperCase());
                                setPromoValidation(null);
                              }}
                              onFocus={() => setSelectedPlan(activePlanId)}
                              onKeyDown={e => { if (e.key === 'Enter') { setSelectedPlan(activePlanId); applyPromo(activePlanId); } }}
                              className="flex-1 min-w-0 text-sm border border-violet-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white uppercase placeholder:normal-case placeholder:text-gray-400"
                            />
                            <button
                              onClick={() => { setSelectedPlan(activePlanId); applyPromo(activePlanId); }}
                              disabled={promoLoading || !(selectedPlan === activePlanId ? promoInput : '').trim()}
                              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg disabled:opacity-40 whitespace-nowrap transition-colors"
                            >
                              {promoLoading && selectedPlan === activePlanId
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : 'Apply'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => handleUpgrade(activePlanId)}
                      disabled={paying !== null || isCurrent || isLowerThan}
                      className={`w-full py-3 rounded-xl font-medium transition-all ${
                        isCurrent
                          ? 'bg-green-500 text-white cursor-not-allowed'
                          : isLowerThan
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : `${plan.btnClass} text-white`
                      } disabled:opacity-80`}
                    >
                      {paying === activePlanId ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : isCurrent ? (
                        'Current Plan'
                      ) : isLowerThan ? (
                        'Not Available'
                      ) : promoValidation?.valid && selectedPlan === activePlanId ? (
                        `Pay ₹${promoValidation.finalAmount.toLocaleString()}`
                      ) : (
                        `Get ${plan.name}`
                      )}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Extra Messages Add-On */}
        {subscription?.isActive && subscription.messageLimit > 0 && subscription.plan !== 'free' && (
          <div className="mb-8 p-5 rounded-2xl border border-amber-200 bg-amber-50 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-amber-900">Need more messages?</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Buy an extra 1,000 messages for ₹{(livePricing?.['addon_messages']?.amount ?? 199).toLocaleString()} — added instantly to your current plan.
              </p>
            </div>
            <button
              onClick={() => handleUpgrade('addon_messages')}
              disabled={paying !== null}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl disabled:opacity-60 transition-colors"
            >
              {paying === 'addon_messages' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <>+ Buy 1,000 Messages</>
              )}
            </button>
          </div>
        )}

        {/* Developer API Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Code className="w-5 h-5" />
            Developer API Access
          </h2>

          {(!subscription?.isActive) ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
              <Code className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">API access requires an active subscription.</p>
              <p className="text-sm text-gray-400 mt-1">Subscribe to any plan to enable developer API access.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
              <p className="text-sm text-gray-600">
                Use your API key to send WhatsApp messages directly from your own software — OTP delivery, promotional campaigns, and more.
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
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Key label (e.g. Production)"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  className="flex-1 max-w-xs text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
                <button
                  onClick={handleCreateKey}
                  disabled={creatingKey}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors"
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
                <div className="overflow-x-auto">
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
              ) : (
                <p className="text-sm text-gray-400">No API keys yet. Generate one above.</p>
              )}

              {/* Multi-language code examples */}
              <CodeExamples />
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
