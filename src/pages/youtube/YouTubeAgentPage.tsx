import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  TrendingUp, 
  Search, 
  FileText, 
  Video, 
  SearchCode, 
  Tag, 
  Image, 
  Copy, 
  Check, 
  Zap,
  RefreshCw,
  Compass,
  FileVideo2,
  Tv
} from 'lucide-react';

export function YouTubeAgentPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'trends' | 'seo' | 'thumbnail'>('trends');
  const [showTuberCoach, setShowTuberCoach] = useState(() => {
    return localStorage.getItem('showTuberCoach') !== 'false';
  });

  // Trend Finder State
  const [searchKeyword, setSearchKeyword] = useState('AI coding assistant');
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(true);
  const [selectedTrend, setSelectedTrend] = useState<any>(null);
  const [scriptPrompt, setScriptPrompt] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string>('');

  // SEO State
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [isAnalyzingSeo, setIsAnalyzingSeo] = useState(false);
  const [seoResult, setSeoResult] = useState<any>(null);
  
  // Thumbnail State
  const [thumbnailTopic, setThumbnailTopic] = useState('Building AI Coding Agents');
  const [thumbnailStyle, setThumbnailStyle] = useState('Bold High Contrast');
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [thumbnailPromptText, setThumbnailPromptText] = useState('');
  
  // Clipboard copied indicators
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedThumb, setCopiedThumb] = useState(false);

  // Mock Trend List Data
  const mockTrends = [
    { id: 1, keyword: 'AI Coding Assistant agentic loops', views: '240K', growth: '+142%', category: 'Tech & Development', engagement: '9.2%', viralMultiplier: '3.4x' },
    { id: 2, keyword: 'Google Antigravity setup tutorial', views: '110K', growth: '+280%', category: 'SaaS Tools', engagement: '11.5%', viralMultiplier: '4.8x' },
    { id: 3, keyword: 'Vite React production deployment guide', views: '480K', growth: '+45%', category: 'Web Dev', engagement: '6.8%', viralMultiplier: '1.9x' },
    { id: 4, keyword: 'Full Stack AI digital employee squad', views: '95K', growth: '+310%', category: 'Futurism', engagement: '12.4%', viralMultiplier: '5.2x' },
  ];

  const handleSearchTrends = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setSearched(true);
    }, 800);
  };

  const handleGenerateScript = (keyword: string) => {
    setSelectedTrend(keyword);
    setScriptPrompt(`Create a 5-minute video script about: ${keyword}. Focus on hooks and engagement loops.`);
    setIsGeneratingScript(true);
    setGeneratedScript('');
    
    setTimeout(() => {
      setIsGeneratingScript(false);
      setGeneratedScript(`# VIDEO SCRIPT: "${keyword.toUpperCase()}"
      
[0:00 - 0:30] Hook & Intro
Wait! Stop writing boilerplate code manually in 2026. What if I told you that you could deploy an entire autonomous AI coding squad to do it for you, while you grab a coffee? Today we are breaking down the exact agentic loops that power modern developer employees...

[0:30 - 2:00] The Core Problem
Most developers use basic autocomplete AI. But autocomplete gets stuck. It doesn't compile code, check tests, or push fixes to Git. That's where agentic loops come in...

[2:00 - 4:00] The Agentic Solution & Workflow
1. Autonomously read repo files using semantic indexers.
2. Formulate step-by-step implementation plans.
3. Edit code, verify compilation via local tests, and fix TypeScript lints.
4. Auto-commit and push cleanly directly to master.

[4:00 - 5:00] Call To Action & Conclusion
If you want to 10x your dev speed, make sure to hit that Subscribe button and deploy these templates from the link in our description. Let me know in the comments: would you trust an AI employee with your master branch? Let's discuss below!`);
    }, 1500);
  };

  const handleSeoAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl) return;
    setIsAnalyzingSeo(true);
    setSeoResult(null);

    setTimeout(() => {
      setIsAnalyzingSeo(false);
      setSeoResult({
        score: 84,
        details: {
          title: { status: 'Excellent', text: 'Title length is perfect (54 chars) and contains core key phrases.' },
          description: { status: 'Warning', text: 'Missing structured links and timestamps in the first 200 characters.' },
          tags: { status: 'Average', text: 'Contains general terms but lacks long-tail search matches.' }
        },
        suggestedTags: [
          'ai coding agent', 'autonomous coding assistant', 'agentic developer loop', 
          'react app deployment', 'vercel build auto-git', 'ai employee squad', 
          'google deepmind coding', 'tailwind dark mode studio'
        ],
        optimizedTitle: 'I Deployed an AI Coding Agent Squad to My Git Repo (And It Worked!)',
        optimizedDescription: `Deploying an autonomous AI coding agent directly to our code repository! In this video, we test how an agentic workflow plans edits, compiles React frontends, resolves TypeScript errors, and pushes commits directly to Git.

Chapters:
0:00 - AI Coding Agent Hooks
1:15 - Boilerplate vs Agentic Loops
2:45 - Live Git Build & Push Test
4:10 - Outro & Template Access

Follow NextBotix for more AI growth automation updates!`
      });
    }, 1500);
  };

  const handleGenerateThumbnail = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingThumbnail(true);
    setThumbnailPromptText('');

    setTimeout(() => {
      setIsGeneratingThumbnail(false);
      setThumbnailPromptText(
        `Close-up cinematic rendering of a modern white robot face merged with a glowing red YouTube play button, high tech glowing elements, neon light reflection, dark cyber background with abstract code streams, bold yellow 3D text overlay saying '10x FASTER!', ultra-detailed, 8k resolution, photorealistic studio lighting.`
      );
    }, 1200);
  };

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const closeTuberCoach = () => {
    setShowTuberCoach(false);
    localStorage.setItem('showTuberCoach', 'false');
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col font-sans">
      
      {/* Header bar */}
      <header className="border-b border-gray-900 bg-[#0c0d14] px-4 py-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-red-500/20 shadow-md">
              <img src="/agents/agent-youtube.jpg?v=2" alt="Tuber" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-white text-base">Tuber</h1>
                <span className="text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-950/50 px-1.5 py-0.5 rounded border border-red-900/30">
                  YouTube Creator AI
                </span>
              </div>
              <p className="text-[11px] text-gray-500 hidden sm:block">Automate content discovery, script compositions, and YouTube SEO</p>
            </div>
          </div>
        </div>

        {/* Tab navigation sidebar / pills */}
        <div className="flex bg-gray-950 p-1.5 rounded-full border border-gray-900/80">
          <button 
            onClick={() => setActiveTab('trends')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-all ${activeTab === 'trends' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            <TrendingUp size={13} />
            <span>Viral Scriptwriter</span>
          </button>
          <button 
            onClick={() => setActiveTab('seo')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-all ${activeTab === 'seo' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            <SearchCode size={13} />
            <span>SEO Link Check</span>
          </button>
          <button 
            onClick={() => setActiveTab('thumbnail')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-all ${activeTab === 'thumbnail' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            <Image size={13} />
            <span>Thumbnail Studio</span>
          </button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
        
        {activeTab === 'trends' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left trend column */}
            <div className="lg:col-span-5 bg-[#0c0d14] border border-gray-900 rounded-3xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Compass size={16} className="text-red-500" />
                  YouTube Trend Lookup
                </h2>
                <span className="text-[10px] text-gray-500 font-medium">Real-time mock index</span>
              </div>

              <form onSubmit={handleSearchTrends} className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Search keywords or topics..."
                    className="w-full bg-gray-950 border border-gray-900 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {isSearching ? <RefreshCw size={12} className="animate-spin" /> : <Search size={12} />}
                  <span>Find</span>
                </button>
              </form>

              {/* Trend results cards */}
              {searched && (
                <div className="flex flex-col gap-3 mt-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Trending keywords for "{searchKeyword}"</span>
                  
                  {mockTrends.map((trend) => (
                    <div 
                      key={trend.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${selectedTrend === trend.keyword ? 'bg-red-950/20 border-red-500/30' : 'bg-gray-950/50 border-gray-900 hover:border-gray-800'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-white leading-tight">{trend.keyword}</h4>
                          <span className="text-[9px] text-gray-500 mt-1 block">{trend.category}</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/45 px-1.5 py-0.5 rounded border border-emerald-900/30">
                          {trend.growth}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-t border-gray-900/60 pt-2 text-[10px] text-gray-400">
                        <div>
                          <span className="text-gray-600 block text-[9px] uppercase font-medium">Vol Views</span>
                          <span className="font-bold text-white">{trend.views}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 block text-[9px] uppercase font-medium">Engagement</span>
                          <span className="font-bold text-white">{trend.engagement}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 block text-[9px] uppercase font-medium">Viral Index</span>
                          <span className="font-bold text-red-400">{trend.viralMultiplier}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleGenerateScript(trend.keyword)}
                        className="w-full mt-1 bg-gray-900 hover:bg-gray-800 text-white py-1.5 rounded-lg text-[11px] font-semibold border border-gray-800 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={11} className="text-red-500" />
                        <span>Write Script</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right script column */}
            <div className="lg:col-span-7 bg-[#0c0d14] border border-gray-900 rounded-3xl p-5 flex flex-col gap-4 min-h-[500px]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText size={16} className="text-red-500" />
                  Script Composer & Teleprompter
                </h2>
                {generatedScript && (
                  <button
                    onClick={() => copyToClipboard(generatedScript, setCopiedScript)}
                    className="text-gray-400 hover:text-white text-xs flex items-center gap-1.5 transition-all"
                  >
                    {copiedScript ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                  </button>
                )}
              </div>

              {/* Script input config */}
              <div className="bg-gray-950 p-4 rounded-2xl border border-gray-900 flex flex-col gap-3">
                <textarea
                  value={scriptPrompt}
                  onChange={(e) => setScriptPrompt(e.target.value)}
                  placeholder="Select a trend or write customized instructions for Tuber to compose a script..."
                  className="w-full h-16 bg-transparent text-xs text-white placeholder-gray-600 resize-none focus:outline-none"
                />
                <div className="flex items-center justify-between border-t border-gray-900/60 pt-3">
                  <span className="text-[10px] text-gray-500">Output: Structured video hooks & pacing timestamps</span>
                  <button
                    onClick={() => handleGenerateScript(scriptPrompt || searchKeyword)}
                    disabled={isGeneratingScript || !scriptPrompt}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    {isGeneratingScript ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    <span>Generate Script</span>
                  </button>
                </div>
              </div>

              {/* Script content view */}
              <div className="flex-1 bg-gray-950 rounded-2xl border border-gray-900 p-4 font-mono text-[11px] leading-relaxed text-gray-300 overflow-y-auto max-h-[350px]">
                {isGeneratingScript ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 py-12">
                    <RefreshCw size={20} className="text-red-500 animate-spin" />
                    <p className="text-gray-500 animate-pulse text-xs">Tuber is researching coding loops and structuring hook timestamps...</p>
                  </div>
                ) : generatedScript ? (
                  <pre className="whitespace-pre-wrap">{generatedScript}</pre>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 py-12 text-center text-gray-600">
                    <FileText size={24} className="opacity-40" />
                    <p className="text-xs">No script generated yet. Click "Write Script" on any trend or prompt Tuber to write.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'seo' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* SEO Link Input */}
            <div className="lg:col-span-5 bg-[#0c0d14] border border-gray-900 rounded-3xl p-5 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <SearchCode size={16} className="text-red-500" />
                Published Video SEO Audit
              </h2>
              <p className="text-[11px] text-gray-500">Paste any published YouTube video URL to inspect SEO optimization performance</p>

              <form onSubmit={handleSeoAnalysis} className="flex flex-col gap-3">
                <div className="relative">
                  <Video size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="url"
                    required
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-gray-950 border border-gray-900 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAnalyzingSeo}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  {isAnalyzingSeo ? <RefreshCw size={12} className="animate-spin" /> : <Zap size={12} />}
                  <span>Run SEO Health Check</span>
                </button>
              </form>

              {/* SEO Score report summary */}
              {seoResult && (
                <div className="mt-4 p-4 bg-gray-950 rounded-2xl border border-gray-900 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-emerald-950/20 shadow-md">
                    <span className="font-bold text-white text-base">{seoResult.score}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">SEO Score: Good</h4>
                    <p className="text-[10px] text-gray-500 mt-1">Excellent title, but description lacks search tags and timeline index.</p>
                  </div>
                </div>
              )}
            </div>

            {/* SEO Report Card detail column */}
            <div className="lg:col-span-7 bg-[#0c0d14] border border-gray-900 rounded-3xl p-5 flex flex-col gap-5 min-h-[500px]">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileVideo2 size={16} className="text-red-500" />
                Optimized Copy & Keyword Suggestions
              </h2>

              {!seoResult ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-gray-600">
                  <SearchCode size={28} className="opacity-40" />
                  <p className="text-xs">Paste video link and execute audit to review tag suggestions & optimized descriptions.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  
                  {/* Score details */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Audit Details</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {Object.entries(seoResult.details).map(([key, val]: any) => (
                        <div key={key} className="bg-gray-950/60 p-3 rounded-xl border border-gray-900">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 capitalize font-medium">{key}</span>
                            <span className={`text-[9px] font-bold ${val.status === 'Excellent' ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {val.status}
                            </span>
                          </div>
                          <p className="text-[9px] text-gray-500 mt-1.5 leading-tight">{val.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Title suggestion */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Optimized Headline</span>
                    <div className="p-3 bg-gray-950 rounded-xl border border-gray-900 text-xs font-semibold text-white flex items-center justify-between">
                      <span>{seoResult.optimizedTitle}</span>
                    </div>
                  </div>

                  {/* Description builder */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 font-medium">Recommended Description</span>
                      <button 
                        onClick={() => copyToClipboard(seoResult.optimizedDescription, setCopiedDesc)}
                        className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedDesc ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span>{copiedDesc ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-gray-950 rounded-xl border border-[#1b1c24] text-[10px] leading-relaxed text-gray-400 font-sans max-h-36 overflow-y-auto whitespace-pre-wrap">
                      {seoResult.optimizedDescription}
                    </pre>
                  </div>

                  {/* Suggested tags */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 font-medium">Suggested Viral Tags</span>
                      <button 
                        onClick={() => copyToClipboard(seoResult.suggestedTags.join(', '), setCopiedTags)}
                        className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedTags ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span>{copiedTags ? 'Copied!' : 'Copy All'}</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {seoResult.suggestedTags.map((tag: string, index: number) => (
                        <span key={index} className="text-[10px] text-gray-300 bg-gray-950 px-2.5 py-1 rounded-full border border-gray-900 flex items-center gap-1">
                          <Tag size={9} className="text-red-500" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'thumbnail' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Prompt Config Column */}
            <div className="lg:col-span-5 bg-[#0c0d14] border border-gray-900 rounded-3xl p-5 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Image size={16} className="text-red-500" />
                Thumbnail Designer Studio
              </h2>
              <p className="text-[11px] text-gray-500">Generate high-impact image prompts and text overlay layouts to optimize CTR</p>

              <form onSubmit={handleGenerateThumbnail} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Video Core Subject</label>
                  <input
                    type="text"
                    value={thumbnailTopic}
                    onChange={(e) => setThumbnailTopic(e.target.value)}
                    placeholder="e.g. Building AI Agents"
                    className="w-full bg-gray-950 border border-gray-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Visual Theme Style</label>
                  <select
                    value={thumbnailStyle}
                    onChange={(e) => setThumbnailStyle(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Bold High Contrast">Bold High Contrast (Extreme CTR)</option>
                    <option value="Minimalist Vector">Minimalist Flat Vector</option>
                    <option value="3D Render Sparkle">3D Cartoon / Blender Sparkle</option>
                    <option value="Cyberpunk Glossy">Cyberpunk / Dark Tech Glossy</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingThumbnail}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  {isGeneratingThumbnail ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  <span>Generate Design Prompt</span>
                </button>
              </form>
            </div>

            {/* Design prompt output */}
            <div className="lg:col-span-7 bg-[#0c0d14] border border-gray-900 rounded-3xl p-5 flex flex-col gap-5 min-h-[500px]">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Tv size={16} className="text-red-500" />
                Thumbnail Composition Prompt
              </h2>

              {!thumbnailPromptText && !isGeneratingThumbnail ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 text-gray-600">
                  <Image size={28} className="opacity-40" />
                  <p className="text-xs">Select your styling and generate to compose Midjourney / DALL-E image prompts.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-5 flex-1 justify-between">
                  
                  {/* Generated Prompt */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 font-medium">AI Generator Prompt</span>
                      <button 
                        onClick={() => copyToClipboard(thumbnailPromptText, setCopiedThumb)}
                        className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedThumb ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span>{copiedThumb ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    {isGeneratingThumbnail ? (
                      <div className="p-12 border border-dashed border-gray-800 rounded-xl bg-gray-950 flex flex-col items-center justify-center gap-2">
                        <RefreshCw size={18} className="text-red-500 animate-spin" />
                        <span className="text-xs text-gray-600">Composing photography styling...</span>
                      </div>
                    ) : (
                      <p className="p-4 bg-gray-950 rounded-xl border border-gray-900 text-xs text-gray-300 font-mono leading-relaxed">
                        {thumbnailPromptText}
                      </p>
                    )}
                  </div>

                  {/* Mock layout preview */}
                  <div className="flex flex-col gap-2 mt-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 font-medium">CTR Mockup Composition Preview</span>
                    <div className="relative aspect-video w-full max-w-md mx-auto bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center group">
                      
                      {/* Simulated graphics background */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-black via-red-950/20 to-gray-950 flex items-center justify-center opacity-70" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-red-600/10 rounded-full blur-3xl" />
                      
                      <div className="absolute bottom-4 left-4 z-10 max-w-[60%] flex flex-col gap-1.5">
                        <span className="bg-red-600 text-white font-black text-sm uppercase px-3 py-1 skew-x-[-10deg] shadow-lg w-fit leading-none">
                          10x FASTER!
                        </span>
                        <span className="bg-white text-black font-black text-xs uppercase px-2 py-1 skew-x-[-10deg] shadow-lg w-fit leading-none">
                          AI CODE LOOPS
                        </span>
                      </div>

                      {/* Mock robot silhouette overlay */}
                      <div className="absolute bottom-0 right-0 h-[85%] aspect-square flex items-end justify-center pointer-events-none opacity-40 group-hover:scale-105 transition-all duration-500">
                        <img src="/agents/agent-youtube.jpg?v=2" alt="Mock" className="h-full object-contain" />
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center z-10 opacity-30">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest bg-gray-900/80 px-4 py-2 border border-gray-800 rounded-xl">Visual Background Canvas</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Floating Onboarding Coach (Tuber) */}
      {showTuberCoach ? (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border border-red-500/20">
                <img src="/agents/agent-youtube.jpg?v=2" alt="Tuber" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Tuber - YouTube Creator</h3>
                <span className="text-[10px] text-red-400 font-medium tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Ready to Grow Your Channel
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-400 leading-relaxed flex flex-col gap-2">
            <p>Hey there! I am **Tuber**, your AI YouTube Growth Assistant.</p>
            <p>Here is what I can do for you:</p>
            <ul className="list-disc list-inside flex flex-col gap-1 text-gray-300 mt-1 pl-1">
              <li>**Viral Scriptwriter**: Find high-CTR trends & write full scripts.</li>
              <li>**SEO Link Check**: paste published videos to analyze SEO details & tags.</li>
              <li>**Thumbnail Studio**: generate high-impact graphic design prompts.</li>
            </ul>
          </div>

          <div className="flex gap-2 mt-1">
            <button
              onClick={closeTuberCoach}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl text-xs transition-all"
            >
              Let's Start!
            </button>
            <button
              onClick={closeTuberCoach}
              className="px-4 bg-gray-800 hover:bg-gray-800 text-gray-400 hover:text-white rounded-xl text-xs transition-all border border-gray-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowTuberCoach(true)}
          title="Tuber (AI YouTube Growth Coach)"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full overflow-hidden border-2 border-red-500/30 hover:border-red-500 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 bg-gray-900 group"
        >
          <img src="/agents/agent-youtube.jpg?v=2" alt="Tuber" className="w-full h-full object-cover" />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 border-2 border-gray-900 rounded-full animate-pulse" />
        </button>
      )}

    </div>
  );
}
