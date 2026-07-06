import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Share2, Check, BookOpen, Sparkles, ArrowRight, Bot } from 'lucide-react';
import { BLOG_POSTS } from '../data/blogPosts';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const post = useMemo(() => {
    return BLOG_POSTS.find(p => p.slug === slug);
  }, [slug]);

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return BLOG_POSTS
      .filter(p => p.id !== post.id && (p.category === post.category || p.featured))
      .slice(0, 3);
  }, [post]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (post) {
      document.title = post.metaTitle || `${post.title} | NexBotix Blog`;
    }
  }, [post, slug]);

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <BookOpen className="w-16 h-16 text-slate-600 mb-4 stroke-1" />
        <h1 className="text-3xl font-black text-white mb-2">Article Not Found</h1>
        <p className="text-slate-400 text-sm max-w-md text-center mb-8">
          The blog article you are looking for does not exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/blog')}
          className="px-6 py-3 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </button>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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
            <button onClick={() => navigate('/blog')} className="text-emerald-400 font-bold flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 inline" /> Blog
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/blog')}
              className="text-sm font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-colors bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" /> All Articles
            </button>
          </div>
        </div>
      </header>

      {/* Article Header */}
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 flex-1 w-full">
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
              {post.category}
            </span>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" /> Share Article
                </>
              )}
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-8">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
            <div className="flex items-center gap-4">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
              />
              <div>
                <h3 className="text-base font-extrabold text-white">{post.author.name}</h3>
                <p className="text-xs text-slate-400">{post.author.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs sm:text-sm font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" /> {post.publishedAt}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" /> {post.readTime}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Banner Image */}
        <div className="relative h-[320px] sm:h-[450px] lg:h-[520px] rounded-3xl overflow-hidden border border-slate-800/80 mb-12 shadow-2xl bg-slate-950">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Content & Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Body */}
          <div className="lg:col-span-8">
            <div 
              className="prose prose-invert prose-lg max-w-none 
                prose-headings:font-black prose-headings:text-white prose-headings:tracking-tight 
                prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-slate-800/80 prose-h2:pb-3
                prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-emerald-300
                prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-emerald-400 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white prose-strong:font-extrabold
                prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2 prose-ul:text-slate-300
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-3 prose-ol:text-slate-300
                prose-code:text-emerald-300 prose-code:bg-slate-900 prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-sm
                prose-blockquote:border-l-4 prose-blockquote:border-emerald-500 prose-blockquote:bg-slate-900/50 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-r-2xl prose-blockquote:italic"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags Footer */}
            <div className="mt-12 pt-8 border-t border-slate-800/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Related Topics</h4>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => navigate('/blog')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky Sidebar */}
          <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-28">
            {/* Try MCP Server CTA Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none" />
              
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>

              <h3 className="text-xl font-black text-white mb-2">
                Deploy WhatsApp MCP in Your AI Agent
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                Connect Claude Desktop, Cursor, or Windsurf directly to WhatsApp. Automate OTPs, bulk broadcasts, and customer support in minutes.
              </p>

              <ul className="space-y-2.5 text-xs text-slate-300 font-medium mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> 3-Day Unlimited Free Trial
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Streamable HTTP MCP Endpoint
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Zero Boilerplate API Integration
                </li>
              </ul>

              <button
                onClick={() => navigate('/login?signup=true')}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Author Bio Box */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 text-center">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border-2 border-emerald-500/30"
              />
              <h4 className="text-base font-bold text-white">{post.author.name}</h4>
              <p className="text-xs text-emerald-400 font-semibold mb-3">{post.author.role}</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Passionate about autonomous AI systems, Model Context Protocol (MCP), and building scalable messaging infrastructure for modern enterprises.
              </p>
            </div>
          </aside>
        </div>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-slate-800/80">
            <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-400" /> Read Next
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => navigate(`/blog/${rel.slug}`)}
                  className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="h-36 overflow-hidden bg-slate-950 relative">
                      <img
                        src={rel.image}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5">
                      <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block mb-2">
                        {rel.category}
                      </span>
                      <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                        {rel.title}
                      </h4>
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-2 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>{rel.readTime}</span>
                    <span className="text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Read <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-10 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 NexBotix Inc. All rights reserved. Powered by Model Context Protocol (MCP).</p>
          <div className="flex items-center gap-6 text-slate-400">
            <button onClick={() => navigate('/')} className="hover:text-emerald-400 transition-colors">Home</button>
            <button onClick={() => navigate('/pricing')} className="hover:text-emerald-400 transition-colors">Pricing</button>
            <button onClick={() => navigate('/blog')} className="hover:text-emerald-400 transition-colors">Blog</button>
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">Sitemap</a>
            <a href="/rss.xml" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">RSS Feed</a>
            <a href="/llms.txt" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">LLMs.txt</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
