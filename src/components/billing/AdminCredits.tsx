import { useCallback, useEffect, useState } from 'react';
import { Coins, Loader2, Save } from 'lucide-react';
import { API_ENDPOINTS, apiFetch } from '@/config/api';

// Admin panel pieces for credit billing: a user's wallet (with adjust + history)
// and the editable cost-per-action table.

interface Balance { plan: number; topup: number; total: number; monthlyGrant: number; periodEnd?: string; unlimited: boolean }
interface Ledger { id: string; delta: number; kind: string; action?: string; quantity?: number; note?: string; balanceAfter: number; createdAt: string }
interface CostRow { action: string; label: string; credits: number }

const n = (v: number) => v.toLocaleString('en-IN');
const when = (d: string) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function AdminUserCredits({ userId, onChanged }: { userId: string; onChanged?: () => void }) {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [history, setHistory] = useState<Ledger[]>([]);
  const [amount, setAmount] = useState('1000');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.credits.adminUser(userId));
      const data = await res.json();
      if (data.success) {
        setBalance(data.data.balance);
        setHistory(data.data.history || []);
      }
    } catch {
      // ignore
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const adjust = async (sign: 1 | -1) => {
    const value = Math.floor(Number(amount));
    if (!value || value < 1) {
      setMsg({ ok: false, text: 'Enter a whole number of credits (1 or more).' });
      return;
    }
    setSaving(true); setMsg(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.credits.adminUser(userId), {
        method: 'POST',
        body: JSON.stringify({ amount: sign * value, note: note.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setMsg({ ok: false, text: data.error || 'Failed to update credits' });
        return;
      }
      setNote('');
      setMsg({ ok: true, text: `${sign > 0 ? 'Added' : 'Removed'} ${n(value)} credits. New balance: ${n(data.data.total)}.` });
      await load();
      onChanged?.();
    } catch {
      setMsg({ ok: false, text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 pb-6 border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Coins size={14} className="text-emerald-500" /> Credits
        </p>
        {balance && (
          <span className="text-xs text-gray-500">
            {balance.unlimited ? <span className="font-bold text-emerald-700">Unlimited (admin/enterprise)</span> : <>Total <span className="font-bold text-emerald-700">{n(balance.total)}</span> · plan {n(balance.plan)} · top-up {n(balance.topup)}</>}
          </span>
        )}
      </div>
      {balance && balance.monthlyGrant > 0 && balance.periodEnd && (
        <p className="mb-2 text-[11px] text-gray-500">Plan credits reset to {n(balance.monthlyGrant)} on {new Date(balance.periodEnd).toLocaleDateString('en-GB')}.</p>
      )}
      <div className="flex gap-2 mb-2">
        <input type="number" min={1} step={1} value={amount} onChange={e => setAmount(e.target.value)} aria-label="Number of credits"
          className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500" />
        <input type="text" value={note} onChange={e => setNote(e.target.value)} maxLength={200} placeholder="Note (optional), e.g. goodwill, refund"
          className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => adjust(1)} disabled={saving}
          className="flex-1 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Add top-up credits'}
        </button>
        <button type="button" onClick={() => adjust(-1)} disabled={saving || !balance || balance.total < 1}
          className="px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 disabled:opacity-50">
          Remove
        </button>
      </div>
      {msg && <p className={`mt-2 text-xs rounded-lg px-3 py-2 ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{msg.text}</p>}
      {history.length > 0 && (
        <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-gray-100">
          <table className="w-full text-[11px]">
            <tbody className="divide-y divide-gray-50">
              {history.slice(0, 30).map(h => (
                <tr key={h.id}>
                  <td className="px-2 py-1.5 text-gray-400 whitespace-nowrap">{when(h.createdAt)}</td>
                  <td className="px-2 py-1.5 text-gray-600">{h.kind}{h.action ? ` · ${h.action}` : ''}{h.quantity && h.quantity > 1 ? ` ×${h.quantity}` : ''}{h.note ? ` · ${h.note}` : ''}</td>
                  <td className={`px-2 py-1.5 text-right font-semibold ${h.delta < 0 ? 'text-gray-800' : 'text-emerald-700'}`}>{h.delta > 0 ? '+' : ''}{n(h.delta)}</td>
                  <td className="px-2 py-1.5 text-right text-gray-400">{n(h.balanceAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function CreditCostsTab() {
  const [rows, setRows] = useState<CostRow[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch(API_ENDPOINTS.credits.adminCosts);
    const data = await res.json();
    if (data.success) {
      setRows(data.data);
      setDraft(Object.fromEntries((data.data as CostRow[]).map(r => [r.action, String(r.credits)])));
    }
  }, []);
  useEffect(() => { load().catch(() => {}); }, [load]);

  const changed = rows.filter(r => draft[r.action] !== undefined && Number(draft[r.action]) !== r.credits);

  const save = async () => {
    const costs: Record<string, number> = {};
    for (const r of changed) {
      const v = Number(draft[r.action]);
      if (!Number.isInteger(v) || v < 0) {
        setMsg({ ok: false, text: `${r.label}: enter a whole number, 0 or more` });
        return;
      }
      costs[r.action] = v;
    }
    setSaving(true); setMsg(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.credits.adminCosts, { method: 'PUT', body: JSON.stringify({ costs }) });
      const data = await res.json();
      if (!data.success) {
        setMsg({ ok: false, text: data.error || 'Failed to save' });
        return;
      }
      setMsg({ ok: true, text: `Saved ${changed.length} change${changed.length === 1 ? '' : 's'}. New costs apply within a minute.` });
      await load();
    } catch {
      setMsg({ ok: false, text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Credit costs</h2>
        <p className="text-sm text-gray-500">
          How many credits each action uses. 1 credit ≈ ₹0.20 (a ₹199 top-up buys 1,000). Set 0 to make an action free.
          Plans and top-ups (how many credits they give) are edited in the Plans tab.
        </p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr><th className="px-4 py-3">Action</th><th className="px-4 py-3 w-40">Credits per use</th><th className="px-4 py-3 w-32 text-right">≈ Cost</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(r => (
              <tr key={r.action}>
                <td className="px-4 py-2.5"><span className="text-gray-900">{r.label || r.action}</span> <span className="ml-1 font-mono text-[11px] text-gray-400">{r.action}</span></td>
                <td className="px-4 py-2.5">
                  <input type="number" min={0} step={1} value={draft[r.action] ?? ''} onChange={e => setDraft(d => ({ ...d, [r.action]: e.target.value }))}
                    className={`w-28 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${Number(draft[r.action]) !== r.credits ? 'border-amber-400 bg-amber-50' : 'border-gray-300'}`} />
                </td>
                <td className="px-4 py-2.5 text-right text-gray-500">₹{(Number(draft[r.action] || 0) * 0.199).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving || changed.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save changes
        </button>
        {msg && <span className={`text-sm ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</span>}
      </div>
    </div>
  );
}
