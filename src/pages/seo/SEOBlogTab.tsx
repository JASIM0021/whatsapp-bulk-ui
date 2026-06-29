import { useState, useEffect, useRef } from 'react';
import {
  Loader2, Github, CheckCircle2, AlertCircle, ExternalLink,
  Play, RefreshCw, ToggleLeft, ToggleRight, Search, Lock, Scan,
  Eye, X, Palette, Zap,
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { SEOBlogConfig, SEOBlogPost, SEOBlogRepo } from '@/types/seo';

const FILE_FORMATS = ['md', 'mdx'] as const;
const POSTS_PER_RUN_OPTIONS = [1, 2, 3];

const COUNTRIES = [
  { code: 'IN', name: 'India',          flag: '🇮🇳' },
  { code: 'US', name: 'United States',  flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia',      flag: '🇦🇺' },
  { code: 'CA', name: 'Canada',         flag: '🇨🇦' },
  { code: 'DE', name: 'Germany',        flag: '🇩🇪' },
  { code: 'FR', name: 'France',         flag: '🇫🇷' },
  { code: 'JP', name: 'Japan',          flag: '🇯🇵' },
  { code: 'BR', name: 'Brazil',         flag: '🇧🇷' },
];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

export function SEOBlogTab({ isPaid = false }: { isPaid?: boolean }) {
  const [config, setConfig] = useState<SEOBlogConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState('');

  // Edit form state
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [branch, setBranch] = useState('main');
  const [blogFolder, setBlogFolder] = useState('src/content/blog');
  const [fileFormat, setFileFormat] = useState<'md' | 'mdx'>('md');
  const [postsPerRun, setPostsPerRun] = useState(1);
  const [isEnabled, setIsEnabled] = useState(false);
  const [targetCountries, setTargetCountries] = useState<string[]>([]);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [schedule, setSchedule] = useState<'daily' | 'weekly' | 'off'>('off');
  const [sitemapPath, setSitemapPath] = useState('');
  const [feedPath, setFeedPath] = useState('');
  const [customCSS, setCustomCSS] = useState('');
  const [showDesign, setShowDesign] = useState(false);
  const [detecting, setDetecting] = useState(false);

  // Blog post HTML preview modal
  const [previewPost, setPreviewPost] = useState<SEOBlogPost | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  // Trending keyword picker
  const [trendingKws, setTrendingKws] = useState<string[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [trendsLoaded, setTrendsLoaded] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState('');
  const [testOk, setTestOk] = useState(false);

  const [posts, setPosts] = useState<SEOBlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState('');

  const [connecting, setConnecting] = useState(false);
  const [showManualId, setShowManualId] = useState(false);
  const [manualId, setManualId] = useState('');
  const [manualSaving, setManualSaving] = useState(false);

  // Repo search combobox
  const [repos, setRepos] = useState<SEOBlogRepo[]>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const repoInputRef = useRef<HTMLInputElement>(null);
  const repoDropdownRef = useRef<HTMLDivElement>(null);

  const loadConfig = async () => {
    setLoadingConfig(true);
    setConfigError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.seoBlog.config);
      const json = await res.json();
      if (json.success && json.data) {
        const cfg: SEOBlogConfig = json.data;
        setConfig(cfg);
        setRepoOwner(cfg.repoOwner || '');
        setRepoName(cfg.repoName || '');
        setRepoSearch(cfg.repoOwner && cfg.repoName ? `${cfg.repoOwner}/${cfg.repoName}` : '');
        setBranch(cfg.branch || 'main');
        setBlogFolder(cfg.blogFolder || 'src/content/blog');
        setFileFormat(cfg.fileFormat || 'md');
        setPostsPerRun(cfg.postsPerRun || 1);
        setIsEnabled(cfg.isEnabled || false);
        setTargetCountries(cfg.targetCountries || []);
        setCustomKeywords(cfg.customKeywords || []);
        setSchedule(cfg.schedule || 'off');
        setSitemapPath(cfg.sitemapPath || '');
        setFeedPath(cfg.feedPath || '');
        setCustomCSS(cfg.customCSS || '');
        if (cfg.isConnected) loadRepos();
      }
    } catch {
      setConfigError('Failed to load blog config');
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.seoBlog.posts);
      const json = await res.json();
      if (json.success) setPosts(json.data || []);
    } catch {
      // silent
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchTrends = async (countries: string[]) => {
    if (countries.length === 0) return;
    setLoadingTrends(true);
    setTrendsLoaded(false);
    setTrendingKws([]); // clear old list immediately on every new fetch
    try {
      const seen = new Set<string>(); // fresh set — no carry-over from previous results
      const results: string[] = [];
      await Promise.all(
        countries.map(async geo => {
          try {
            const res = await apiFetch(API_ENDPOINTS.seo.trends(geo));
            const json = await res.json();
            if (json.success && Array.isArray(json.data?.items)) {
              for (const item of json.data.items as { title: string }[]) {
                if (item.title && !seen.has(item.title)) {
                  seen.add(item.title);
                  results.push(item.title);
                }
              }
            }
          } catch { /* silent per-country failure */ }
        })
      );
      setTrendingKws(results);
      setTrendsLoaded(true);
    } finally {
      setLoadingTrends(false);
    }
  };

  const loadRepos = async () => {
    setLoadingRepos(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.seoBlog.repos);
      const json = await res.json();
      if (json.success) setRepos(json.data || []);
    } catch {
      // silent
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    loadConfig();
    loadPosts();
  }, []);

  // Close repo dropdown when clicking outside
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        repoDropdownRef.current && !repoDropdownRef.current.contains(e.target as Node) &&
        repoInputRef.current && !repoInputRef.current.contains(e.target as Node)
      ) {
        setRepoDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Pass the current frontend origin so the backend can redirect back here
      // (works for both localhost dev and production).
      const origin = encodeURIComponent(window.location.origin);
      const res = await apiFetch(`${API_ENDPOINTS.seoBlog.installUrl}?origin=${origin}`);
      const json = await res.json();
      if (json.success && json.data?.url) {
        window.location.href = json.data.url;
      } else {
        setConfigError(json.error || 'Failed to get install URL');
        setConnecting(false);
      }
    } catch {
      setConfigError('Network error');
      setConnecting(false);
    }
  };

  const handleManualConnect = async () => {
    const id = parseInt(manualId.trim(), 10);
    if (!id || isNaN(id)) {
      setConfigError('Please enter a valid installation ID (number)');
      return;
    }
    setManualSaving(true);
    setConfigError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.seoBlog.callback, {
        method: 'POST',
        body: JSON.stringify({ installationId: id }),
      });
      const json = await res.json();
      if (json.success) {
        await loadConfig();
        setShowManualId(false);
        setManualId('');
      } else {
        setConfigError(json.error || 'Failed to save installation ID');
      }
    } catch {
      setConfigError('Network error');
    } finally {
      setManualSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await apiFetch(API_ENDPOINTS.seoBlog.config, {
        method: 'POST',
        body: JSON.stringify({ repoOwner, repoName, branch, blogFolder, fileFormat, postsPerRun, isEnabled, targetCountries, customKeywords, schedule, sitemapPath, feedPath, customCSS }),
      });
      const json = await res.json();
      if (json.success) {
        setSaveMsg('Saved');
        if (json.data) setConfig(json.data);
      } else {
        setSaveMsg(json.error || 'Save failed');
      }
    } catch {
      setSaveMsg('Network error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestMsg('');
    setTestOk(false);
    try {
      const res = await apiFetch(API_ENDPOINTS.seoBlog.test, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setTestMsg('Repository accessible');
        setTestOk(true);
      } else {
        setTestMsg(json.error || 'Connection failed');
      }
    } catch {
      setTestMsg('Network error');
    } finally {
      setTesting(false);
    }
  };

  const handleDetect = async () => {
    setDetecting(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.seoBlog.detect);
      const json = await res.json();
      if (json.success && json.data) {
        setSitemapPath(json.data.sitemapPath || 'public/sitemap.xml');
        setFeedPath(json.data.feedPath || 'public/feed.xml');
      }
    } catch {
      // silent — keep existing values
    } finally {
      setDetecting(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setRunMsg('');
    try {
      const res = await apiFetch(API_ENDPOINTS.seoBlog.run, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data) {
        const newPosts: SEOBlogPost[] = json.data.posts || [];
        if (newPosts.length > 0) {
          setRunMsg(`Generated ${newPosts.length} post${newPosts.length > 1 ? 's' : ''} and committed to GitHub`);
          setPosts(prev => [...newPosts, ...prev]);
        } else {
          setRunMsg('No posts generated. Check that your SEO Bot has geo targets configured.');
        }
      } else {
        setRunMsg(json.error || 'Run failed');
      }
    } catch {
      setRunMsg('Network error');
    } finally {
      setRunning(false);
    }
  };

  const openPreview = async (post: SEOBlogPost) => {
    setPreviewPost(post);
    setPreviewHtml('');
    setPreviewLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.seoBlog.preview(post.id));
      const html = await res.text();
      setPreviewHtml(html);
    } catch {
      setPreviewHtml('<p style="color:red;padding:2rem">Failed to load preview.</p>');
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!isPaid) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
          <Zap size={28} className="text-amber-500" />
        </div>
        <h3 className="text-base font-bold text-gray-900">Blog Bot is a Premium Feature</h3>
        <p className="text-sm text-gray-500">Upgrade to a plan that includes <strong>seo_bot</strong> to unlock AI-powered blog publishing to GitHub repositories.</p>
        <a href="/subscription" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">
          <Zap size={14} /> Upgrade Plan
        </a>
      </div>
    );
  }

  const isConnected = config?.isConnected ?? false;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6">

      {/* ── Blog post HTML preview modal ─────────────────────────────────── */}
      {previewPost && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-950">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Eye size={15} className="text-emerald-400 flex-shrink-0" />
              <span className="text-sm font-medium text-gray-100 truncate">{previewPost.title}</span>
              <span className="px-2 py-0.5 bg-blue-900/60 text-blue-300 border border-blue-700 rounded-full text-xs">{previewPost.keyword}</span>
            </div>
            <button
              onClick={() => { setPreviewPost(null); setPreviewHtml(''); }}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 ml-3"
            >
              <X size={17} />
            </button>
          </div>
          {/* iframe */}
          <div className="flex-1 relative">
            {previewLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <Loader2 size={28} className="animate-spin text-emerald-400" />
              </div>
            )}
            {previewHtml && (
              <iframe
                srcDoc={previewHtml}
                title="Blog preview"
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
              />
            )}
          </div>
        </div>
      )}

      {/* GitHub Connection card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Github size={20} className="text-gray-700" />
          <h3 className="text-base font-bold text-gray-900">GitHub Repository</h3>
        </div>

        {configError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{configError}</p>
          </div>
        )}

        {isConnected ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700">GitHub App Connected</span>
              </div>
              {config?.repoOwner && config?.repoName && (
                <span className="text-xs text-gray-500 font-mono">{config.repoOwner}/{config.repoName}</span>
              )}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Install the botx GitHub App on your repository to allow the SEO bot to commit AI-generated blog posts directly to your codebase.
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {connecting ? <Loader2 size={15} className="animate-spin" /> : <Github size={15} />}
              {connecting ? 'Redirecting...' : 'Install GitHub App'}
            </button>

            {/* Manual recovery — for users who already installed but the callback wasn't saved */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              {!showManualId ? (
                <button
                  onClick={() => setShowManualId(true)}
                  className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                >
                  Already installed? Enter installation ID manually
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    Find your installation ID in the GitHub URL when viewing the app:
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded ml-1">github.com/settings/installations/<strong>12345678</strong></span>
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={manualId}
                      onChange={e => setManualId(e.target.value)}
                      placeholder="12345678"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                    />
                    <button
                      onClick={handleManualConnect}
                      disabled={manualSaving || !manualId.trim()}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {manualSaving ? <Loader2 size={14} className="animate-spin" /> : 'Connect'}
                    </button>
                    <button
                      onClick={() => { setShowManualId(false); setManualId(''); }}
                      className="px-3 py-2 text-gray-400 hover:text-gray-600 text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Repository Config card */}
      {isConnected && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900">Blog Configuration</h3>

          {/* Repo search combobox — auto-fetches repos from GitHub installation */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Repository</label>
            <div className="relative">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                {loadingRepos && (
                  <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                )}
                <input
                  ref={repoInputRef}
                  type="text"
                  value={repoSearch}
                  onChange={e => {
                    setRepoSearch(e.target.value);
                    setRepoDropdownOpen(true);
                    // Clear selection if user is typing a new search
                    if (!repos.find(r => r.fullName === e.target.value)) {
                      setRepoOwner('');
                      setRepoName('');
                    }
                  }}
                  onFocus={() => { setRepoDropdownOpen(true); if (repos.length === 0) loadRepos(); }}
                  placeholder="Search repositories…"
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                />
              </div>

              {repoDropdownOpen && (
                <div
                  ref={repoDropdownRef}
                  className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto"
                >
                  {loadingRepos && repos.length === 0 ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                      <Loader2 size={14} className="animate-spin" /> Loading repositories…
                    </div>
                  ) : (() => {
                    const q = repoSearch.toLowerCase();
                    const filtered = repos.filter(r =>
                      r.fullName.toLowerCase().includes(q) ||
                      r.name.toLowerCase().includes(q) ||
                      r.owner.toLowerCase().includes(q)
                    );
                    if (filtered.length === 0) {
                      return (
                        <div className="px-4 py-3 text-sm text-gray-400">
                          {repos.length === 0 ? 'No repositories found' : 'No match'}
                        </div>
                      );
                    }
                    return filtered.map(repo => (
                      <button
                        key={repo.fullName}
                        onMouseDown={e => e.preventDefault()}
                        onClick={async () => {
                          setRepoOwner(repo.owner);
                          setRepoName(repo.name);
                          setRepoSearch(repo.fullName);
                          setRepoDropdownOpen(false);
                          // Auto-save the repo selection immediately so Generate Post Now works
                          try {
                            await apiFetch(API_ENDPOINTS.seoBlog.config, {
                              method: 'POST',
                              body: JSON.stringify({
                                repoOwner: repo.owner,
                                repoName: repo.name,
                                branch, blogFolder, fileFormat, postsPerRun, isEnabled,
                                targetCountries, customKeywords, schedule, sitemapPath, feedPath, customCSS,
                              }),
                            });
                          } catch { /* silent — user can still manually save */ }
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                          repoSearch === repo.fullName ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Github size={13} className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-800 truncate">{repo.fullName}</span>
                        </div>
                        {repo.private && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 ml-2 flex-shrink-0">
                            <Lock size={10} /> Private
                          </span>
                        )}
                      </button>
                    ));
                  })()}
                </div>
              )}
            </div>
            {repoOwner && repoName && (
              <p className="text-xs text-emerald-600 mt-1.5 font-medium">
                ✓ {repoOwner}/{repoName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Branch</label>
              <input
                type="text"
                value={branch}
                onChange={e => setBranch(e.target.value)}
                placeholder="main"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Blog Folder</label>
              <input
                type="text"
                value={blogFolder}
                onChange={e => setBlogFolder(e.target.value)}
                placeholder="src/content/blog"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">File Format</p>
              <div className="flex gap-2">
                {FILE_FORMATS.map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setFileFormat(fmt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      fileFormat === fmt
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                    }`}
                  >
                    .{fmt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Posts per Run</p>
              <div className="flex gap-2">
                {POSTS_PER_RUN_OPTIONS.map(n => (
                  <button
                    key={n}
                    onClick={() => setPostsPerRun(n)}
                    className={`w-9 h-9 rounded-lg text-sm font-bold border transition-colors ${
                      postsPerRun === n
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Enable</span>
              <button onClick={() => setIsEnabled(v => !v)}>
                {isEnabled
                  ? <ToggleRight size={28} className="text-emerald-500" />
                  : <ToggleLeft size={28} className="text-gray-300" />
                }
              </button>
            </div>
          </div>

          {/* Target Countries */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Target Countries</p>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map(c => {
                const selected = targetCountries.includes(c.code);
                return (
                  <button
                    key={c.code}
                    onClick={() => setTargetCountries(prev =>
                      selected ? prev.filter(x => x !== c.code) : [...prev, c.code]
                    )}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      selected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
                    }`}
                  >
                    <span>{c.flag}</span>
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Keywords */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Custom Keywords</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && keywordInput.trim()) {
                    const kw = keywordInput.trim();
                    if (!customKeywords.includes(kw)) setCustomKeywords(prev => [...prev, kw]);
                    setKeywordInput('');
                  }
                }}
                placeholder="Add keyword…"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              />
              <button
                onClick={() => {
                  const kw = keywordInput.trim();
                  if (kw && !customKeywords.includes(kw)) setCustomKeywords(prev => [...prev, kw]);
                  setKeywordInput('');
                }}
                disabled={!keywordInput.trim()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-40"
              >
                + Add
              </button>
            </div>
            {customKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {customKeywords.map(kw => (
                  <span
                    key={kw}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-medium"
                  >
                    {kw}
                    <button
                      onClick={() => setCustomKeywords(prev => prev.filter(k => k !== kw))}
                      className="text-emerald-400 hover:text-emerald-700 leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Trending Keywords picker */}
          {targetCountries.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500">Trending Keywords</p>
                <button
                  onClick={() => fetchTrends(targetCountries)}
                  disabled={loadingTrends}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors disabled:opacity-50"
                >
                  {loadingTrends
                    ? <><Loader2 size={12} className="animate-spin" /> Fetching…</>
                    : <><RefreshCw size={12} /> Update List</>
                  }
                </button>
              </div>
              {!trendsLoaded && !loadingTrends && (
                <p className="text-xs text-gray-400 italic">Click "Update List" to fetch trending keywords for selected countries</p>
              )}
              {trendingKws.length > 0 && (
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-0.5">
                  {trendingKws.map(kw => {
                    const alreadyAdded = customKeywords.includes(kw);
                    return (
                      <button
                        key={kw}
                        disabled={alreadyAdded}
                        onClick={() => {
                          if (!alreadyAdded) setCustomKeywords(prev => [...prev, kw]);
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          alreadyAdded
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600 cursor-default'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
                        }`}
                      >
                        {alreadyAdded ? '✓ ' : '+ '}{kw}
                      </button>
                    );
                  })}
                </div>
              )}
              {trendsLoaded && trendingKws.length === 0 && (
                <p className="text-xs text-gray-400">No trending keywords found for selected countries</p>
              )}
            </div>
          )}

          {/* Run Schedule */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Run Schedule</p>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'off'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSchedule(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border capitalize transition-all ${
                    schedule === s
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Site Files — blog sitemap & RSS feed location */}
          <div className="pt-1 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500">Site Files (Blog Sitemap &amp; RSS Feed)</p>
              <button
                onClick={handleDetect}
                disabled={detecting || !repoOwner || !repoName}
                title={!repoOwner || !repoName ? 'Select a repo first' : 'Auto-detect from repo structure'}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors disabled:opacity-40"
              >
                {detecting
                  ? <><Loader2 size={12} className="animate-spin" /> Detecting…</>
                  : <><Scan size={12} /> Auto Detect</>
                }
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Blog sitemap path</label>
                <input
                  type="text"
                  value={sitemapPath}
                  onChange={e => setSitemapPath(e.target.value)}
                  placeholder="public/sitemap-blog.xml"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">RSS feed path</label>
                <input
                  type="text"
                  value={feedPath}
                  onChange={e => setFeedPath(e.target.value)}
                  placeholder="public/feed.xml"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
                />
              </div>
            </div>
            <div className="mt-2 px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-[11px] text-blue-700 leading-relaxed">
                <strong>botx never modifies your main <code className="bg-blue-100 px-0.5 rounded">sitemap.xml</code>.</strong>
                {' '}A separate <code className="bg-blue-100 px-0.5 rounded">sitemap-blog.xml</code> is generated for blog posts,
                and a <code className="bg-blue-100 px-0.5 rounded">sitemap-index.xml</code> is created at your repo root
                referencing both. Submit <code className="bg-blue-100 px-0.5 rounded">sitemap-index.xml</code> to Google Search Console.
              </p>
            </div>
          </div>

          {/* Design / Custom CSS accordion */}
          <div className="pt-1 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowDesign(v => !v)}
              className="flex items-center gap-2 w-full text-left text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Palette size={13} />
              Blog Template Design
              <span className="ml-auto text-gray-300">{showDesign ? '▲' : '▼'}</span>
            </button>
            {showDesign && (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-gray-400">
                  Add custom CSS to override the default blog template styles. Changes apply to new posts generated after saving.
                </p>
                <textarea
                  value={customCSS}
                  onChange={e => setCustomCSS(e.target.value)}
                  placeholder={`/* Example: change brand color */\n:root { --brand: #6366f1; --brand-d: #4f46e5; }\n.hero { background: linear-gradient(135deg,#1e1b4b,#312e81); }`}
                  rows={8}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-y"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              Save Config
            </button>
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Test Connection
            </button>
            {saveMsg && (
              <span className={`text-xs font-semibold ${saveMsg === 'Saved' ? 'text-emerald-600' : 'text-red-500'}`}>
                {saveMsg}
              </span>
            )}
            {testMsg && (
              <span className={`text-xs font-semibold ${testOk ? 'text-emerald-600' : 'text-red-500'}`}>
                {testMsg}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Blog Posts card */}
      {isConnected && isEnabled && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Blog Posts</h3>
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {running ? 'Generating...' : 'Generate Post Now'}
            </button>
          </div>

          {runMsg && (
            <div className={`mx-6 mt-4 flex items-center gap-2 rounded-xl px-4 py-3 border text-sm font-medium ${
              runMsg.startsWith('Generated')
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              {runMsg.startsWith('Generated') ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {runMsg}
            </div>
          )}

          {loadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-emerald-500" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Github size={22} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-1">No posts generated yet</p>
              <p className="text-xs text-gray-400 max-w-xs">
                Click "Generate Post Now" to create your first AI blog post. The SEO Bot uses your Google Trends geo targets to pick trending keywords.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Keyword</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Words</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">File</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {posts.map(post => (
                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 max-w-[200px]">
                        <p className="text-sm font-medium text-gray-900 truncate" title={post.title}>{post.title}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
                          {post.keyword}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 font-medium">{post.wordCount.toLocaleString()}</td>
                      <td className="px-4 py-3.5">
                        {post.commitUrl ? (
                          <a
                            href={post.commitUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-mono text-emerald-600 hover:text-emerald-700 truncate max-w-[140px]"
                            title={post.filePath}
                          >
                            <span className="truncate">{post.filePath.split('/').pop()}</span>
                            <ExternalLink size={10} className="flex-shrink-0" />
                          </a>
                        ) : (
                          <span className="text-xs font-mono text-gray-400 truncate block max-w-[140px]">{post.filePath.split('/').pop()}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(post.createdAt)}</td>
                      <td className="px-3 py-3.5">
                        <button
                          onClick={() => openPreview(post)}
                          title="Preview HTML"
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Hint when connected but not enabled */}
      {isConnected && !isEnabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Blog posting is disabled</p>
            <p className="text-xs text-amber-600 mt-0.5">Enable it in the config above and save to start generating posts.</p>
          </div>
        </div>
      )}
    </div>
  );
}
