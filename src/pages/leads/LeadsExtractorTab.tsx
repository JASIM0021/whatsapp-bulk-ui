import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, MapPin, Search, CheckCircle2, Lock, ShieldCheck,
  Zap, AlertCircle, RefreshCw, Layers, PlusCircle, Coins, Award
} from 'lucide-react';
import { API_ENDPOINTS, apiFetch } from '@/config/api';

interface LeadQuotaInfo {
  isEnterprise: boolean;
  canEditLeadSources: boolean;
  allowedLeadSources: string[];
  leadBalance: number;
  freeLeadsClaimed: boolean;
  freeLeadsAvailable: number;
  totalStoredLeads: number;
  dailyLimit: number;
  todayCount: number;
}

interface UserLeadConfig {
  userId: string;
  enabled: boolean;
  source: string;
  keyword: string;
  location: string;
  targetCount: number;
  status: string;
  lastRunAt?: string;
  lastExtractedCount?: number;
  lastError?: string;
}

export function LeadsExtractorTab() {
  const [quota, setQuota] = useState<LeadQuotaInfo | null>(null);
  const [config, setConfig] = useState<UserLeadConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [claimingTrial, setClaimingTrial] = useState(false);
  const [purchasingAddon, setPurchasingAddon] = useState(false);
  const [addonPacks, setAddonPacks] = useState(1);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addonSuccess, setAddonSuccess] = useState<string | null>(null);

  // Form states
  const [enabled, setEnabled] = useState(false);
  const [source, setSource] = useState('balanced_maps');
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [targetCount, setTargetCount] = useState(25);

  const fetchQuotaAndConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [qRes, cRes] = await Promise.all([
        apiFetch(API_ENDPOINTS.leads.quota),
        apiFetch(API_ENDPOINTS.leads.config),
      ]);

      const qData = await qRes.json();
      const cData = await cRes.json();

      if (qData.success) {
        setQuota(qData.data);
      }
      if (cData.success && cData.data) {
        setConfig(cData.data);
        setEnabled(cData.data.enabled ?? false);
        setSource(cData.data.source || 'balanced_maps');
        setKeyword(cData.data.keyword || '');
        setLocation(cData.data.location || '');
        setTargetCount(cData.data.targetCount || 25);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load extraction settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotaAndConfig();
  }, [fetchQuotaAndConfig]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const res = await apiFetch(API_ENDPOINTS.leads.config, {
        method: 'POST',
        body: JSON.stringify({
          enabled,
          source,
          keyword,
          location,
          targetCount: Number(targetCount),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }
      setConfig(data.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || 'Network error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleClaimFreeTrial = async () => {
    setClaimingTrial(true);
    setError(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.leads.claimTrial, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Could not claim free trial');
      }
      await fetchQuotaAndConfig();
    } catch (err: any) {
      setError(err.message || 'Error claiming trial');
    } finally {
      setClaimingTrial(false);
    }
  };

  const handlePurchaseAddon = async () => {
    setPurchasingAddon(true);
    setError(null);
    setAddonSuccess(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.leads.addon, {
        method: 'POST',
        body: JSON.stringify({ packs: addonPacks }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Purchase failed');
      }
      setAddonSuccess(`Successfully added ${addonPacks * 1000} leads to your balance!`);
      await fetchQuotaAndConfig();
      setTimeout(() => setAddonSuccess(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Error purchasing addon');
    } finally {
      setPurchasingAddon(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="animate-spin mb-3 text-amber-500" size={32} />
        <p className="text-sm font-medium">Loading Smart Extractor engine...</p>
      </div>
    );
  }

  const isEnterprise = quota?.isEnterprise || quota?.canEditLeadSources;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                <Sparkles size={22} />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  Automated Lead Extractor
                  {isEnterprise && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-sm">
                      ENTERPRISE UNLOCKED
                    </span>
                  )}
                </h1>
                <p className="text-slate-400 text-sm">
                  Server-side high-speed business extraction with smart deduplication & OSINT email enrichment.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchQuotaAndConfig}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-2 transition-colors border border-slate-700"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Free Trial Callout Banner if not claimed */}
      {quota && !quota.freeLeadsClaimed && (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Award size={28} className="text-amber-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Claim 10 Free Trial Leads</h3>
              <p className="text-amber-100 text-xs mt-0.5">
                New user welcome bonus! Activate your trial now to extract your first 10 verified B2B leads at zero cost.
              </p>
            </div>
          </div>
          <button
            onClick={handleClaimFreeTrial}
            disabled={claimingTrial}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-amber-900 hover:bg-amber-50 font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 flex-shrink-0"
          >
            {claimingTrial ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
            Claim 10 Free Leads
          </button>
        </div>
      )}

      {/* Error and Feedback Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {saveSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-400 text-sm">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <p>Autopilot extraction criteria saved successfully! Extraction will run on the scheduled daily cycle.</p>
        </div>
      )}
      {addonSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-400 text-sm">
          <CheckCircle2 size={18} className="flex-shrink-0" />
          <p>{addonSuccess}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Extractor Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveConfig} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers size={18} className="text-amber-400" />
                  Extraction Criteria
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure your business niche and location for daily automatic harvesting.
                </p>
              </div>

              {/* Master Active Switch */}
              <label className="flex items-center gap-3 cursor-pointer">
                <span className="text-xs font-semibold text-slate-300">
                  {enabled ? 'Extractor Enabled' : 'Extractor Paused'}
                </span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* Keyword / Niche */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Target Business Keyword / Niche
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. Digital Marketing Agencies, Dental Clinics, Cafes & Restaurants"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                The smart engine will prioritize existing verified leads in the master database before scraping fresh ones.
              </p>
            </div>

            {/* Target Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Target Geographic Location / City
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. California, USA or Bangalore, India or London, UK"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Source Selection (Locked for Normal, Selectable for Enterprise) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Lead Source Selection
                </label>
                {isEnterprise ? (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <ShieldCheck size={13} /> Enterprise Source Selector Unlocked
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-400/90 flex items-center gap-1 font-medium">
                    <Lock size={12} /> Auto-Balanced (50% Google Maps + 50% Bing Maps)
                  </span>
                )}
              </div>

              {isEnterprise ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'gmap', label: 'Google Maps', desc: 'Local businesses & stores' },
                    { id: 'bing', label: 'Bing Maps', desc: 'Global corporate listings' },
                    { id: 'balanced_maps', label: '50/50 Balanced Maps', desc: 'Google + Bing split' },
                    { id: 'trustpilot', label: 'Trustpilot', desc: 'Verified reviews & e-commerce' },
                    { id: 'googleplaystore', label: 'Google Play Store', desc: 'App developers & publishers' },
                    { id: 'all', label: 'All Sources', desc: 'Multi-channel aggregation' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSource(s.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        source === s.id
                          ? 'bg-amber-600/20 border-amber-500 text-white shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <p className="text-xs font-bold leading-tight">{s.label}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{s.desc}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                      <Lock size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Auto-Balanced (50% Google Maps + 50% Bing Maps)</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Default balanced mode automatically distributes lead volume 50/50 across top maps providers.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded bg-slate-900 text-amber-300 border border-amber-500/30 whitespace-nowrap font-mono">
                    LOCKED
                  </span>
                </div>
              )}
            </div>

            {/* Target Count */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Target Daily Volume: {targetCount} Leads
                </label>
                <span className="text-[11px] text-slate-400">Min: 5 | Max: 500</span>
              </div>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Saving Configuration...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Save & Schedule Automated Extractor
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Last Run Summary */}
          {config && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${config.status === 'running' ? 'bg-amber-400 animate-ping' : config.enabled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span>
                  Status: <strong className="text-white capitalize">{config.status || 'idle'}</strong>
                </span>
              </div>
              <div>
                Last Run: <strong className="text-white">{config.lastRunAt ? new Date(config.lastRunAt).toLocaleDateString() + ' ' + new Date(config.lastRunAt).toLocaleTimeString() : 'Never'}</strong>
                {config.lastExtractedCount !== undefined && config.lastExtractedCount > 0 && (
                  <span className="ml-2 text-emerald-400">({config.lastExtractedCount} leads assigned)</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Balance & Addon Store */}
        <div className="space-y-6">
          {/* Balance Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Coins size={16} className="text-amber-400" />
              Lead Quota & Credits
            </h3>

            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Available Extraction Balance</p>
              <p className="text-3xl font-extrabold text-white mt-1">
                {isEnterprise ? 'Unlimited' : (quota?.leadBalance ?? 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-amber-400/90 mt-1 font-medium">
                {isEnterprise ? 'Enterprise Plan Active' : 'Credits consume only on verified lead assignment'}
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span>Total Stored Leads</span>
                <strong className="text-white">{quota?.totalStoredLeads ?? 0}</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span>Daily Extraction Cap</span>
                <strong className="text-white">{quota?.dailyLimit ?? 10} / day</strong>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span>Free Trial Status</span>
                <strong className={quota?.freeLeadsClaimed ? 'text-emerald-400' : 'text-amber-400'}>
                  {quota?.freeLeadsClaimed ? 'Claimed' : '10 Free Leads Ready'}
                </strong>
              </div>
            </div>
          </div>

          {/* Add-on Pack Purchase Widget */}
          {!isEnterprise && (
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <PlusCircle size={18} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white">Purchase Leads Add-On</h3>
              </div>
              <p className="text-xs text-slate-400">
                Need more leads? Add high-volume extraction credits at flat rates.
              </p>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
                <p className="text-xs font-bold text-amber-300">Rate: ₹500 INR per 1,000 Leads</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Deduplicated, enriched with email & phone numbers</p>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">Select Package</label>
                <select
                  value={addonPacks}
                  onChange={(e) => setAddonPacks(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>1,000 Leads (₹500)</option>
                  <option value={2}>2,000 Leads (₹1,000)</option>
                  <option value={5}>5,000 Leads (₹2,500)</option>
                  <option value={10}>10,000 Leads (₹5,000)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handlePurchaseAddon}
                disabled={purchasingAddon}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                {purchasingAddon ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Zap size={14} />
                )}
                Purchase {(addonPacks * 1000).toLocaleString()} Leads (₹{addonPacks * 500})
              </button>
            </div>
          )}

          {/* Deduplication Guarantee Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <p className="font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-400" />
              Smart Deduplication Guarantee
            </p>
            <p className="text-[11px] leading-relaxed">
              Our single master database automatically matches domain names, phone numbers, and addresses. You will never be charged for duplicate leads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
