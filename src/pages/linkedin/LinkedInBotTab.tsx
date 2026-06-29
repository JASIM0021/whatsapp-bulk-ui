import { useState, useEffect } from 'react';
import {
  Loader2, Bot, Play, Save, Plus, X, Clock, Image, Zap, AlertCircle,
  CheckCircle2, Globe, Calendar, Megaphone,
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { LinkedInSessionHook } from '@/hooks/useLinkedInSession';
import { LinkedInBotConfig, LinkedInBotRunResult } from '@/types/linkedin';

const GEO_OPTIONS = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'IN', label: 'India' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'DE', label: 'Germany' },
  { code: 'SG', label: 'Singapore' },
  { code: 'AE', label: 'UAE' },
];

interface Props {
  isPaid: boolean;
  session: LinkedInSessionHook;
}

export function LinkedInBotTab({ isPaid, session }: Props) {
  const [config, setConfig] = useState<LinkedInBotConfig>({
    isEnabled: false,
    keywords: [],
    geos: ['US'],
    postsPerDay: 1,
    schedule: 'off',
    postTime: '09:00',
    postGapMinutes: 120,
    generateImage: true,
    adText: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [lastRun, setLastRun] = useState<LinkedInBotRunResult | null>(null);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.linkedin.bot);
        const data = await res.json();
        if (data.success && data.data) setConfig(data.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    if (config.keywords.length === 0) {
      setError('Add at least one keyword before saving.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.linkedin.bot, {
        method: 'POST',
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to save configuration');
      } else {
        setConfig(data.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      setError('Failed to save configuration');
    }
    setSaving(false);
  };

  const handleRunNow = async () => {
    if (config.keywords.length === 0) {
      setError('Add at least one keyword to run the bot.');
      return;
    }
    setError('');
    setRunning(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.linkedin.botRun, { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Bot run failed');
      } else {
        setLastRun(data.data);
      }
    } catch {
      setError('Failed to run the bot');
    }
    setRunning(false);
  };

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (!kw || config.keywords.includes(kw)) return;
    setConfig(c => ({ ...c, keywords: [...c.keywords, kw] }));
    setNewKeyword('');
  };

  const removeKeyword = (kw: string) => {
    setConfig(c => ({ ...c, keywords: c.keywords.filter(k => k !== kw) }));
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={28} className="animate-spin text-[#0A66C2]" />
    </div>
  );

  if (!session.isConnected) return (
    <div className="max-w-lg mx-auto py-12 text-center">
      <Bot size={40} className="text-gray-300 mx-auto mb-4" />
      <h3 className="text-base font-bold text-gray-800 mb-2">Connect LinkedIn First</h3>
      <p className="text-sm text-gray-500">Connect your LinkedIn account from the Connect tab to use the automation bot.</p>
    </div>
  );

  if (!isPaid) return (
    <div className="max-w-lg mx-auto py-12 text-center">
      <Zap size={40} className="text-amber-400 mx-auto mb-4" />
      <h3 className="text-base font-bold text-gray-800 mb-2">Pro Feature</h3>
      <p className="text-sm text-gray-500 mb-4">LinkedIn automation is available on the Pro plan.</p>
      <a href="/subscription" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">
        <Zap size={14} /> Upgrade to Pro
      </a>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-5">

      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A66C2] to-[#004182] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="font-bold text-base leading-none">LinkedIn Automation Bot</h2>
            <p className="text-blue-200 text-xs mt-0.5">AI-generated posts from keywords + Google Trends</p>
          </div>
        </div>
        <p className="text-sm text-blue-100 mt-3">
          The bot automatically creates professional LinkedIn posts based on your keywords and current trending topics, with AI-generated images. Up to 3 posts per day.
        </p>
      </div>

      {/* Last run result */}
      {lastRun && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <span className="font-semibold text-green-800 text-sm">Post published successfully!</span>
            {lastRun.hasImage && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">With image</span>
            )}
          </div>
          <p className="text-xs text-green-700 line-clamp-3 mb-2">{lastRun.postText}</p>
          {lastRun.postUrl && (
            <a
              href={lastRun.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0A66C2] hover:underline font-medium"
            >
              View on LinkedIn →
            </a>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Keywords */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#0A66C2] text-white text-xs flex items-center justify-center font-bold">1</span>
          Content Keywords
        </h3>
        <p className="text-xs text-gray-500">The bot rotates through these keywords daily to generate varied content.</p>

        {/* Keyword tags */}
        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {config.keywords.map(kw => (
            <span key={kw} className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-[#0A66C2] text-xs font-semibold px-3 py-1.5 rounded-full">
              {kw}
              <button onClick={() => removeKeyword(kw)} className="hover:text-red-500 transition-colors">
                <X size={11} />
              </button>
            </span>
          ))}
          {config.keywords.length === 0 && (
            <span className="text-xs text-gray-400 italic">No keywords yet — add some below</span>
          )}
        </div>

        {/* Add keyword input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            placeholder="e.g. AI in healthcare, remote work, startup tips…"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
          />
          <button
            onClick={addKeyword}
            disabled={!newKeyword.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0A66C2] text-white text-sm font-semibold rounded-xl hover:bg-[#004182] transition-colors disabled:opacity-50"
          >
            <Plus size={15} /> Add
          </button>
        </div>
      </div>

      {/* Geo + Image settings */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#0A66C2] text-white text-xs flex items-center justify-center font-bold">2</span>
          Targeting & Content
        </h3>

        {/* Geo */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
            <Globe size={12} /> Trending region (for Google Trends)
          </label>
          <div className="flex flex-wrap gap-2">
            {GEO_OPTIONS.map(g => (
              <button
                key={g.code}
                onClick={() => setConfig(c => ({ ...c, geos: [g.code] }))}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  config.geos[0] === g.code
                    ? 'bg-[#0A66C2] text-white border-[#0A66C2]'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#0A66C2] hover:text-[#0A66C2]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Generate image toggle */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Image size={16} className="text-gray-500" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Generate AI image</p>
              <p className="text-xs text-gray-400">DALL-E 3 → Pexels stock photo (uses whichever key is configured)</p>
            </div>
          </div>
          <button
            onClick={() => setConfig(c => ({ ...c, generateImage: !c.generateImage }))}
            className={`relative w-10 h-6 rounded-full transition-colors ${config.generateImage ? 'bg-[#0A66C2]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.generateImage ? 'left-5' : 'left-1'}`} />
          </button>
        </div>

        {/* Advertisement injection */}
        <div className="pt-3 border-t border-gray-100 space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <Megaphone size={12} /> Advertisement injection <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            value={config.adText ?? ''}
            onChange={e => setConfig(c => ({ ...c, adText: e.target.value }))}
            rows={4}
            placeholder={`Paste your ad text here — links, promo copy, anything.\nThe AI will intelligently weave it into each post naturally.\n\nExample: "Try Acme Pro free for 30 days → https://acme.io/trial"`}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent resize-none placeholder:text-gray-400 text-gray-800"
          />
          {config.adText && config.adText.trim().length > 0 && (
            <p className="text-xs text-amber-600 flex items-start gap-1.5">
              <Megaphone size={11} className="flex-shrink-0 mt-0.5" />
              Ad will be woven into every auto-generated post. Keep it concise for best results.
            </p>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#0A66C2] text-white text-xs flex items-center justify-center font-bold">3</span>
          Schedule
        </h3>

        {/* Posts per day */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
            <Clock size={12} /> Posts per day
          </label>
          <div className="flex gap-2">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                onClick={() => setConfig(c => ({ ...c, postsPerDay: n }))}
                className={`w-12 h-10 rounded-xl text-sm font-bold border transition-colors ${
                  config.postsPerDay === n
                    ? 'bg-[#0A66C2] text-white border-[#0A66C2]'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#0A66C2]'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Post time */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
              <Clock size={12} /> First post time <span className="font-normal text-gray-400">(UTC)</span>
            </label>
            <input
              type="time"
              value={config.postTime}
              onChange={e => setConfig(c => ({ ...c, postTime: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
            />
          </div>

          {/* Gap between posts — only shown when postsPerDay > 1 */}
          {config.postsPerDay > 1 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                <Clock size={12} /> Gap between posts
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '30m', value: 30 },
                  { label: '1h',  value: 60 },
                  { label: '2h',  value: 120 },
                  { label: '3h',  value: 180 },
                  { label: '4h',  value: 240 },
                  { label: '6h',  value: 360 },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setConfig(c => ({ ...c, postGapMinutes: opt.value }))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                      config.postGapMinutes === opt.value
                        ? 'bg-[#0A66C2] text-white border-[#0A66C2]'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#0A66C2] hover:text-[#0A66C2]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Schedule toggle */}
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Auto-run daily</p>
              <p className="text-xs text-gray-400">Bot runs automatically at the scheduled time(s)</p>
            </div>
          </div>
          <button
            onClick={() => setConfig(c => ({ ...c, schedule: c.schedule === 'daily' ? 'off' : 'daily', isEnabled: c.schedule !== 'daily' }))}
            className={`relative w-10 h-6 rounded-full transition-colors ${config.schedule === 'daily' ? 'bg-[#0A66C2]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${config.schedule === 'daily' ? 'left-5' : 'left-1'}`} />
          </button>
        </div>

        {config.schedule === 'daily' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
            <Zap size={13} className="flex-shrink-0 mt-0.5 text-blue-500" />
            <span>
              Daily automation is enabled. Posts at{' '}
              <strong>{config.postTime} UTC</strong>
              {config.postsPerDay > 1 && (
                <> × {config.postsPerDay} posts every{' '}
                  <strong>
                    {config.postGapMinutes < 60
                      ? `${config.postGapMinutes}min`
                      : `${config.postGapMinutes / 60}h`}
                  </strong>
                </>
              )}.
            </span>
          </div>
        )}

        {config.lastRunAt && (
          <p className="text-xs text-gray-400">
            Last run: {new Date(config.lastRunAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saveSuccess ? 'Saved!' : 'Save Config'}
        </button>

        <button
          onClick={handleRunNow}
          disabled={running || config.keywords.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 shadow-md shadow-blue-200"
        >
          {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
          {running ? 'Generating post…' : 'Run Now'}
        </button>
      </div>

      {/* How it works */}
      <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">How it works</h4>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-[#0A66C2] text-white text-[9px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</span>
            <span>Picks a keyword from your list (rotates daily for variety)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-[#0A66C2] text-white text-[9px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</span>
            <span>Fetches trending topics from Google Trends for context</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-[#0A66C2] text-white text-[9px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</span>
            <span>Generates a professional LinkedIn post using AI (GPT-4o-mini or Gemini)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-[#0A66C2] text-white text-[9px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">4</span>
            <span>Optionally generates an image (DALL-E 3 → Pexels fallback) and attaches it to the post</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-[#0A66C2] text-white text-[9px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">5</span>
            <span>Publishes to LinkedIn (max 3 posts/day enforced automatically)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
