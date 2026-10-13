import { useState, useEffect, useCallback } from 'react';
import { Copy, CheckCircle, TrendingUp, DollarSign, Users, Clock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS, apiFetch } from '@/config/api';

interface Commission {
  id: string;
  userEmail: string;
  userName: string;
  txnId: string;
  plan: string;
  promoCode: string;
  paymentAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'paid';
  paidAt?: string;
  createdAt: string;
}

interface InfluencerProfile {
  id: string;
  name: string;
  email: string;
  promoCode: string;
  commissionRate: number;
  status: string;
  upiId?: string;
  totalEarned: number;
  totalPaid: number;
  totalPending: number;
  totalReferrals: number;
  createdAt: string;
}

interface Dashboard {
  profile: InfluencerProfile;
  commissions: Commission[];
}

function StatCard({ label, value, sub, color, icon: Icon }: {
  label: string; value: string; sub?: string; color: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InfluencerDashboard() {
  const navigate = useNavigate();
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.influencer.dashboard);
      const json = await res.json();
      if (!json.success) { setError(json.error || 'Not enrolled as an influencer'); return; }
      setDash(json.data);
    } catch {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyCode = () => {
    if (!dash) return;
    navigator.clipboard.writeText(dash.profile.promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !dash) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400 text-lg">{error || 'Not enrolled as an influencer'}</p>
        <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
          <ArrowLeft size={16} /> Go to dashboard
        </button>
      </div>
    );
  }

  const { profile, commissions } = dash;
  const commissionPct = Math.round(profile.commissionRate * 100);

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app')} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold">Influencer Dashboard</h1>
            <p className="text-xs text-slate-400">Hi {profile.name} — {commissionPct}% commission on every referral</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${profile.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {profile.status}
        </span>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Promo code banner */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
          <p className="text-sm text-slate-400 mb-1">Your referral promo code</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold tracking-widest text-blue-300">{profile.promoCode}</span>
            <button onClick={copyCode} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Share this code with your audience. When they use it at checkout, you earn {commissionPct}% of every payment.</p>
          {profile.upiId && (
            <p className="text-xs text-slate-400 mt-2">Payout UPI: <span className="text-white font-mono">{profile.upiId}</span></p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Earned" value={fmt(profile.totalEarned)} color="bg-blue-600" icon={DollarSign} />
          <StatCard label="Pending Payout" value={fmt(profile.totalPending)} sub="awaiting payment" color="bg-yellow-600" icon={Clock} />
          <StatCard label="Total Paid Out" value={fmt(profile.totalPaid)} color="bg-green-600" icon={CheckCircle} />
          <StatCard label="Total Referrals" value={String(profile.totalReferrals)} color="bg-purple-600" icon={Users} />
        </div>

        {/* Commissions table */}
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-400" />
            <h2 className="font-semibold text-sm">Commission History</h2>
            <span className="ml-auto text-xs text-slate-500">{commissions.length} records</span>
          </div>

          {commissions.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 text-sm">
              No commissions yet. Share your promo code to start earning!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase border-b border-slate-700">
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">User</th>
                    <th className="px-6 py-3 text-left">Plan</th>
                    <th className="px-6 py-3 text-right">Paid</th>
                    <th className="px-6 py-3 text-right">Commission</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-white">{c.userName || '—'}</p>
                        <p className="text-xs text-slate-500">{c.userEmail}</p>
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 bg-slate-700 rounded text-xs font-mono">{c.plan}</span>
                      </td>
                      <td className="px-6 py-3 text-right text-slate-300">{fmt(c.paymentAmount)}</td>
                      <td className="px-6 py-3 text-right font-semibold text-green-400">{fmt(c.commissionAmount)}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {c.status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
