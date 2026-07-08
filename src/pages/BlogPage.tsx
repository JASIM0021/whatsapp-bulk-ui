import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Clock, ArrowRight, Sparkles, BookOpen, Bot, ShieldCheck } from 'lucide-react';
import { BLOG_POSTS } from '../data/blogPosts';

export default function BlogPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const cats = new Set(BLOG_POSTS.map(post => post.category));
    return ['All', ...Array.from(cats)];
  }, []);

  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter(post => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const featuredPost = useMemo(() => {
    return BLOG_POSTS.find(post => post.featured) || BLOG_POSTS[0];
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all">
              <Bot className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Nex<span className="text-emerald-400">Botix</span>
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-emerald-400/80 font-bold -mt-1">
                AI & MCP Platform
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <button onClick={() => navigate('/')} className="hover:text-emerald-400 transition-colors">Home</button>
            <button onClick={() => navigate('/pricing')} className="hover:text-emerald-400 transition-colors">Pricing</button>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 inline" /> Blog
            </span>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/login?signup=true')}
              className="relative group overflow-hidden rounded-xl p-px font-semibold text-sm"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 rounded-xl animate-pulse group-hover:opacity-100 opacity-80 transition-opacity" />
              <span className="relative block px-5 py-2.5 rounded-[11px] bg-slate-950 text-emerald-400 group-hover:bg-transparent group-hover:text-slate-950 transition-all font-bold">
                Start Free Trial
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative pt-16 pb-12 overflow-hidden border-b border-slate-800/60 bg-gradient-to-b from-slate-900/40 to-slate-950">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" /> Engineering & AI Growth Blog
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
            Mastering <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">WhatsApp MCP</span> & AI Agent Automation
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
            Expert guides, architectural deep-dives, and proven growth strategies for developers and brands building autonomous communication workflows.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search articles by keyword, topic, or AI model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-emerald-500/60 rounded-2xl py-4 pl-12 pr-4 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {/* Featured Post Banner (only show when not filtering/searching) */}
        {selectedCategory === 'All' && !searchQuery && featuredPost && (
          <div className="mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Featured Article
            </h2>
            <div 
              onClick={() => navigate(`/blog/${featuredPost.slug}`)}
              className="group relative bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 hover:border-emerald-500/40 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-6 cursor-pointer transition-all duration-500 shadow-2xl hover:shadow-emerald-500/10"
            >
              <div className="lg:col-span-7 relative min-h-[300px] sm:min-h-[380px] overflow-hidden">
                <img 
                  src={featuredPost.image} 
                  alt={featuredPost.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent lg:hidden" />
              </div>
              
              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                      {featuredPost.category}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {featuredPost.readTime}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white group-hover:text-emerald-400 transition-colors leading-snug mb-4">
                    {featuredPost.title}
                  </h3>

                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed line-clamp-3 mb-6">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <img 
                      src={featuredPost.author.avatar} 
                      alt={featuredPost.author.name} 
                      className="w-10 h-10 rounded-full object-cover border border-emerald-500/30"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">{featuredPost.author.name}</h4>
                      <p className="text-xs text-slate-500">{featuredPost.author.role}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                    Read Article <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none border-b border-slate-800/60">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800/60">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4 stroke-1" />
            <h3 className="text-xl font-bold text-white mb-2">No articles found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              We couldn't find any articles matching "{searchQuery}" in this category. Try adjusting your search keywords.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="px-6 py-2.5 bg-emerald-500 text-slate-950 font-bold text-sm rounded-xl hover:bg-emerald-400 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 rounded-3xl overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5"
              >
                <div>
                  {/* Image Banner */}
                  <div className="relative h-52 overflow-hidden bg-slate-950">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[11px] font-extrabold tracking-wide uppercase">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 sm:p-7">
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-3 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" /> {post.publishedAt}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" /> {post.readTime}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug mb-3">
                      {post.title}
                    </h3>

                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-6">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                {/* Footer / Author */}
                <div className="px-6 sm:px-7 pb-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-700"
                    />
                    <span className="text-xs font-bold text-slate-300">{post.author.name}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Read <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Bottom CTA Section */}
      <section className="bg-gradient-to-b from-slate-950 to-slate-900 py-16 border-t border-slate-800/80 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
            
            <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to Control WhatsApp with AI Agents?
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-base sm:text-lg mb-8">
              Get instant access to our built-in Model Context Protocol (MCP) server, automated chat flows, and 3 days of unlimited free trial access.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/login?signup=true')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/25 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                Start 3-Day Free Trial <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/pricing')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-white font-bold text-base border border-slate-700/80 transition-all"
              >
                View Pricing Plans
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              No credit card required for trial • Instant API key generation • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-10 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 NexBotix Inc. All rights reserved. Powered by Model Context Protocol (MCP).</p>
          <div className="flex items-center gap-6 text-slate-400">
            <button onClick={() => navigate('/')} className="hover:text-emerald-400 transition-colors">Home</button>
            <button onClick={() => navigate('/pricing')} className="hover:text-emerald-400 transition-colors">Pricing</button>
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">Sitemap</a>
            <a href="/rss.xml" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">RSS Feed</a>
            <a href="/llms.txt" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">LLMs.txt</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
