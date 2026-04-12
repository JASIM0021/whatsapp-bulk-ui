import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, apiFetch } from '@/config/api';
import { Check, Crown, Zap, Shield, ArrowLeft, Loader2, CreditCard, Calendar, Tag, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    name: 'Free Trial',
    price: 0,
    period: '5 messages',
    features: [
      'Send up to 5 messages total',
      'Basic templates',
      'File upload (Excel/CSV)',
      'WhatsApp QR connect',
    ],
    icon: Shield,
    color: 'from-gray-500 to-gray-600',
    btnClass: 'bg-gray-500 hover:bg-gray-600',
  },
  {
    id: 'monthly',
    name: 'Pro Monthly',
    price: 500,
    period: '/month',
    features: [
      'Unlimited messages',
      'All templates + custom',
      'Image & media attachments',
      'Priority support',
      'Message scheduling',
      'Detailed analytics',
    ],
    icon: Zap,
    color: 'from-sky-500 to-sky-600',
    btnClass: 'bg-sky-600 hover:bg-sky-700',
    popular: true,
  },
  {
    id: 'yearly',
    name: 'Pro Yearly',
    price: 5000,
    period: '/year',
    features: [
      'Everything in Monthly',
      'Save ₹1,000/year',
      'Priority support',
      'Early access to features',
      'Bulk import up to 10K',
      'API access (coming soon)',
    ],
    icon: Crown,
    color: 'from-amber-500 to-amber-600',
    btnClass: 'bg-amber-600 hover:bg-amber-700',
  },
];

interface LivePricing {
  [plan: string]: { amount: number; messageLimit: number };
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

  useEffect(() => {
    fetchData();
    // Fetch live pricing (public endpoint, no auth needed)
    fetch(API_ENDPOINTS.subscription.plans)
      .then(r => r.json())
      .then(data => { if (data.success && data.data) setLivePricing(data.data); })
      .catch(() => {});
  }, []);

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
    // Clear promo if it was for a different plan
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
      // Submit PayU form
      const formData: PayUFormData = data.data;
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
                    ? subscription.plan === 'free'
                      ? `Active — ${subscription.messageLimit - subscription.messagesUsed} of ${subscription.messageLimit} messages remaining`
                      : `Active — ${subscription.daysLeft} day${subscription.daysLeft !== 1 ? 's' : ''} remaining (expires ${subscription.expiryDate})`
                    : subscription.plan === 'free'
                      ? `Free trial exhausted (${subscription.messagesUsed}/${subscription.messageLimit} messages used). Upgrade to continue.`
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
        <p className="text-gray-500 text-center mb-10">Unlock the full power of WhatsApp Bulk Messaging</p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = subscription?.plan === plan.id && subscription.isActive;
            const livePrice = plan.id !== 'free' ? (livePricing?.[plan.id]?.amount ?? plan.price) : 0;
            const freeMsgLimit = livePricing?.['free']?.messageLimit ?? 5;
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
                <div className="mt-2 mb-4">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {displayPrice === 0 ? 'Free' : `₹${displayPrice.toLocaleString()}`}
                  </span>
                  {displayPrice > 0 && <span className="text-gray-500 text-sm">{plan.period}</span>}
                  {plan.id === 'free' && <span className="text-gray-500 text-sm ml-1">{freeMsgLimit} messages</span>}
                </div>

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
                    {!isCurrent && (
                      <div className="mb-4 border border-violet-200 rounded-xl p-3 bg-violet-50">
                        <p className="text-xs font-semibold text-violet-600 mb-2 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" /> Have a promo code?
                        </p>
                        {promoValidation?.valid && selectedPlan === plan.id ? (
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
                        ) : promoValidation && !promoValidation.valid && selectedPlan === plan.id ? (
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
                              value={selectedPlan === plan.id ? promoInput : ''}
                              onChange={e => {
                                setSelectedPlan(plan.id);
                                setPromoInput(e.target.value.toUpperCase());
                                setPromoValidation(null);
                              }}
                              onFocus={() => setSelectedPlan(plan.id)}
                              onKeyDown={e => { if (e.key === 'Enter') { setSelectedPlan(plan.id); applyPromo(plan.id); } }}
                              className="flex-1 min-w-0 text-sm border border-violet-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-white uppercase placeholder:normal-case placeholder:text-gray-400"
                            />
                            <button
                              onClick={() => { setSelectedPlan(plan.id); applyPromo(plan.id); }}
                              disabled={promoLoading || !(selectedPlan === plan.id ? promoInput : '').trim()}
                              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg disabled:opacity-40 whitespace-nowrap transition-colors"
                            >
                              {promoLoading && selectedPlan === plan.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : 'Apply'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={paying !== null || isCurrent}
                      className={`w-full py-3 rounded-xl text-white font-medium transition-all ${
                        isCurrent
                          ? 'bg-green-500 cursor-not-allowed'
                          : plan.btnClass
                      } disabled:opacity-60`}
                    >
                      {paying === plan.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : isCurrent ? (
                        'Current Plan'
                      ) : promoValidation?.valid && selectedPlan === plan.id ? (
                        `Pay ₹${promoValidation.finalAmount.toLocaleString()}`
                      ) : (
                        `Upgrade to ${plan.name}`
                      )}
                    </button>
                  </>
                )}
              </div>
            );
          })}
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
