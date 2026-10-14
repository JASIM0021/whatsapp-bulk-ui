import { useEffect, useMemo, useState } from 'react';
import { Check, Coins, Loader2, Plus, Sparkles, Tag, X, History, Info } from 'lucide-react';
import { API_ENDPOINTS, apiFetch } from '@/config/api';

// Credit billing UI for the Subscription page: wallet, plans, top-ups,
// what each action costs, and credit history. Payment is delegated to
// onBuy (the page's existing Razorpay / PayU checkout).

export interface CreditsInfo {
  plan: number;
  topup: number;
  total: number;
  monthlyGrant: number;
  periodEnd?: string;
  unlimited: boolean;
}

export interface SubscriptionSummary {
  plan: string;
  isActive: boolean;
  expiryDate?: string;
  daysLeft?: number;
  messagesUsed?: number;
  messageLimit?: number;
  creditMode?: boolean;
  credits?: CreditsInfo;
}

interface PlanRow {
  plan: string;
  name: string;
  description?: string;
  amount: number;
  durationDays?: number;
  credits?: number;
  kind?: string;
  highlight?: boolean;
  displayOrder?: number;
  features?: string[];
}

interface CostRow { action: string; label: string; credits: number }
interface LedgerRow { id: string; delta: number; kind: string; action?: string; quantity?: number; note?: string; balanceAfter: number; createdAt: string }

interface PromoResult { valid: boolean; code?: string; finalAmount?: number; message?: string }

const PLAN_NAMES: Record<string, string> = {
  credit_trial: 'Free trial', credits_free: 'Pay as you go', credits_starter: 'Starter', credits_starter_yr: 'Starter (yearly)',
  credits_growth: 'Growth', credits_growth_yr: 'Growth (yearly)', credits_pro: 'Pro', credits_pro_yr: 'Pro (yearly)',
};

const KIND_LABEL: Record<string, string> = {
  charge: 'Used', refund: 'Refund', grant: 'Added', plan_reset: 'Monthly reset', migration: 'Converted', adjust: 'Adjustment',
};

const fmtDate = (d?: string) => (d ? new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const n = (v: number) => v.toLocaleString('en-IN');

export function CreditsPanel({
  subscription,
  pricing,
  formatPrice,
  paying,
  onBuy,
}: {
  subscription: SubscriptionSummary | null;
  pricing: Record<string, PlanRow> | null;
  formatPrice: (inr: number) => string;
  paying: string | null;
  onBuy: (plan: string, promoCode: string) => void;
}) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [costs, setCosts] = useState<CostRow[]>([]);
  const [history, setHistory] = useState<LedgerRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoResult | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    apiFetch(API_ENDPOINTS.credits.me)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setCosts(d.data.costs || []);
          setHistory(d.data.history || []);
        }
      })
      .catch(() => {
        fetch(API_ENDPOINTS.credits.costs).then(r => r.json()).then(d => d.success && setCosts(d.data)).catch(() => {});
      });
  }, []);

  useEffect(() => { setPromo(null); setPromoInput(''); }, [selected]);

  const rows = useMemo(() => Object.values(pricing ?? {}), [pricing]);
  const plans = rows
    .filter(p => p.kind === 'credit_plan' && (cycle === 'yearly' ? p.plan.endsWith('_yr') : !p.plan.endsWith('_yr')))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const topups = rows.filter(p => p.kind === 'credit_topup').sort((a, b) => a.amount - b.amount);
  const cost = (action: string) => costs.find(c => c.action === action)?.credits ?? 0;

  const credits = subscription?.credits;
  const creditMode = !!subscription?.creditMode;
  const currentPlan = subscription?.plan ?? '';
  const selectedRow = rows.find(r => r.plan === selected);

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code || !selected) return;
    setPromoLoading(true);
    try {
      const res = await apiFetch(`${API_ENDPOINTS.subscription.validatePromo}?code=${encodeURIComponent(code)}&plan=${selected}`);
      const data = await res.json();
      setPromo(data.success && data.data ? data.data : { valid: false, message: data.error || 'Invalid code' });
    } catch {
      setPromo({ valid: false, message: 'Could not check the code' });
    } finally {
      setPromoLoading(false);
    }
  };

  // Rough "what you get" examples for a credit amount.
  const examples = (c: number) => {
    const msg = cost('whatsapp_message'), lead = cost('lead'), post = cost('seo_blog_post');
    return [
      msg > 0 && `${n(Math.floor(c / msg))} WhatsApp messages`,
      lead > 0 && `or ${n(Math.floor(c / lead))} leads`,
      post > 0 && `or ${n(Math.floor(c / post))} SEO blog posts`,
    ].filter(Boolean) as string[];
  };

  return (
    <div className="space-y-10">
      {/* Wallet */}
      <section className={`rounded-2xl border p-5 sm:p-6 ${subscription?.isActive ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Your credits</p>
            {credits?.unlimited ? (
              <p className="mt-1 text-3xl font-extrabold text-gray-900">Unlimited</p>
            ) : creditMode ? (
              <p className="mt-1 text-3xl font-extrabold text-gray-900">{n(credits?.total ?? 0)} <span className="text-base font-medium text-gray-500">credits</span></p>
            ) : (
              <p className="mt-1 text-xl font-bold text-gray-900">On your current plan</p>
            )}
            <p className="mt-1 text-sm text-gray-600">
              Plan: <strong className="text-gray-900">{PLAN_NAMES[currentPlan] ?? currentPlan}</strong>
              {subscription?.daysLeft ? ` · renews or ends ${fmtDate(subscription.expiryDate)}` : ''}
            </p>
          </div>
          {creditMode && credits && !credits.unlimited && (
            <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[320px]">
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs text-emerald-700">Plan credits</p>
                <p className="text-lg font-bold text-gray-900">{n(credits.plan)}</p>
                <p className="text-[11px] text-gray-500">{credits.periodEnd ? `Reset to ${n(credits.monthlyGrant)} on ${fmtDate(credits.periodEnd)}` : 'No active plan'}</p>
              </div>
              <div className="rounded-xl bg-sky-50 p-3">
                <p className="text-xs text-sky-700">Top-up credits</p>
                <p className="text-lg font-bold text-gray-900">{n(credits.topup)}</p>
                <p className="text-[11px] text-gray-500">Never expire · used after plan credits</p>
              </div>
            </div>
          )}
        </div>
        {!creditMode && (
          <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            Your current plan keeps working exactly as before{subscription?.expiryDate ? ` until ${fmtDate(subscription.expiryDate)}` : ''}. After that you’ll move to credits, where every service is included. Any lead or SEO credits you had are already in your credit balance.
          </p>
        )}
        {creditMode && !subscription?.isActive && (
          <p className="mt-4 text-sm font-medium text-red-700">You’re out of credits. Choose a plan or top up to keep your AI employees working.</p>
        )}
      </section>

      {/* Plans */}
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Choose a plan</h2>
            <p className="text-sm text-gray-500">Every plan includes every AI employee. Plans differ only in monthly credits.</p>
          </div>
          <div className="inline-flex self-start rounded-xl bg-gray-100 p-1 text-sm">
            {(['monthly', 'yearly'] as const).map(c => (
              <button key={c} onClick={() => setCycle(c)} className={`rounded-lg px-4 py-1.5 font-semibold ${cycle === c ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                {c === 'monthly' ? 'Monthly' : 'Yearly · 2 months free'}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {plans.map(p => {
            const isCurrent = currentPlan === p.plan && subscription?.isActive;
            return (
              <div key={p.plan} className={`relative flex flex-col rounded-2xl border bg-white p-6 ${p.highlight ? 'border-emerald-500 shadow-lg shadow-emerald-100' : 'border-gray-200'}`}>
                {p.highlight && <span className="absolute -top-3 left-6 rounded-full bg-emerald-600 px-3 py-0.5 text-[11px] font-bold text-white">Most popular</span>}
                <p className="text-lg font-bold text-gray-900">{p.name.replace(' (Yearly)', '')}</p>
                <p className="mt-2 text-3xl font-extrabold text-gray-900">{formatPrice(p.amount)}<span className="text-sm font-medium text-gray-500">/{cycle === 'yearly' ? 'year' : 'month'}</span></p>
                <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><Coins className="h-4 w-4" />{n(p.credits ?? 0)} credits every month</p>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm text-gray-600">
                  {examples(p.credits ?? 0).map(e => <li key={e} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{e}</li>)}
                  <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />All AI employees and services</li>
                </ul>
                <button
                  onClick={() => setSelected(p.plan)}
                  disabled={isCurrent || paying !== null}
                  className={`mt-5 rounded-xl py-2.5 text-sm font-bold transition ${isCurrent ? 'bg-gray-100 text-gray-500' : p.highlight ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
                >
                  {isCurrent ? 'Current plan' : `Choose ${p.name.replace(' (Yearly)', '')}`}
                </button>
              </div>
            );
          })}
          {plans.length === 0 && <p className="text-sm text-gray-500">Plans are loading…</p>}
        </div>
      </section>

      {/* Top-ups */}
      {topups.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900">Top up credits</h2>
          <p className="text-sm text-gray-500">One-time purchase. Top-up credits never expire and work with or without a plan.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {topups.map(t => (
              <div key={t.plan} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5">
                <div>
                  <p className="font-bold text-gray-900">{n(t.credits ?? 0)} credits</p>
                  <p className="text-sm text-gray-500">{formatPrice(t.amount)}</p>
                </div>
                <button onClick={() => setSelected(t.plan)} disabled={paying !== null}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                  <Plus className="h-3.5 w-3.5" /> Buy
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Checkout bar */}
      {selectedRow && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 p-4 shadow-2xl backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">{selectedRow.name} · {n(selectedRow.credits ?? 0)} credits{selectedRow.kind === 'credit_plan' ? ' / month' : ''}</p>
              <p className="text-xs text-gray-500">
                {promo?.valid && promo.finalAmount !== undefined
                  ? <>Total <s>{formatPrice(selectedRow.amount)}</s> <strong className="text-emerald-700">{formatPrice(promo.finalAmount)}</strong></>
                  : <>Total {formatPrice(selectedRow.amount)}</>}
                {promo && !promo.valid && <span className="ml-2 text-red-600">{promo.message || 'Invalid code'}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl border border-gray-200 px-2">
                <Tag className="h-4 w-4 text-gray-400" />
                <input value={promoInput} onChange={e => setPromoInput(e.target.value)} placeholder="Promo code" className="w-28 bg-transparent px-2 py-2 text-sm outline-none" />
                <button onClick={applyPromo} disabled={promoLoading || !promoInput.trim()} className="text-xs font-semibold text-emerald-700 disabled:opacity-50">
                  {promoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                </button>
              </div>
              <button onClick={() => onBuy(selectedRow.plan, promo?.valid && promo.code ? promo.code : '')} disabled={paying !== null}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Pay now
              </button>
              <button onClick={() => setSelected(null)} aria-label="Close" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* What uses credits */}
      {costs.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900">What uses credits</h2>
          <p className="text-sm text-gray-500">Simple tasks cost little; heavy AI work costs more. Replies from your own AI key or in-house AI are free.</p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {costs.map(c => (
                  <tr key={c.action}>
                    <td className="px-4 py-2.5 text-gray-700">{c.label || c.action}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{c.credits === 0 ? 'Free' : `${n(c.credits)} credit${c.credits === 1 ? '' : 's'}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* History */}
      {history.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900"><History className="h-5 w-5" /> Credit history</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <tr><th className="px-4 py-2.5">Date</th><th className="px-4 py-2.5">What</th><th className="px-4 py-2.5 text-right">Credits</th><th className="px-4 py-2.5 text-right">Balance</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(showAllHistory ? history : history.slice(0, 10)).map(h => {
                  const label = costs.find(c => c.action === h.action)?.label;
                  return (
                    <tr key={h.id}>
                      <td className="px-4 py-2.5 text-gray-500">{fmtDate(h.createdAt)}</td>
                      <td className="px-4 py-2.5 text-gray-700">{KIND_LABEL[h.kind] ?? h.kind}{label ? ` · ${label}` : ''}{h.quantity && h.quantity > 1 ? ` ×${n(h.quantity)}` : ''}{h.note ? <span className="text-gray-400"> · {h.note}</span> : null}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold ${h.delta < 0 ? 'text-gray-900' : 'text-emerald-700'}`}>{h.delta > 0 ? '+' : ''}{n(h.delta)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">{n(h.balanceAfter)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {history.length > 10 && (
            <button onClick={() => setShowAllHistory(v => !v)} className="mt-2 text-sm font-semibold text-emerald-700">{showAllHistory ? 'Show less' : `Show all ${history.length}`}</button>
          )}
        </section>
      )}
    </div>
  );
}
