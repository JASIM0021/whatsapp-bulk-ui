import { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Loader2, FileText } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { LinkedInPost } from '@/types/linkedin';
import { LinkedInSessionHook } from '@/hooks/useLinkedInSession';

interface Props { isPaid: boolean; session: LinkedInSessionHook }

const PAGE_SIZE = 10;
const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

export function LinkedInPostsPage({ isPaid, session }: Props) {
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => { if (isPaid && session.isConnected) load(); }, [isPaid, session.isConnected]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch(API_ENDPOINTS.linkedin.posts);
      const d = await r.json();
      if (d.success) setPosts(d.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (!isPaid) {
    return (
      <div className="text-center py-16">
        <FileText size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 text-sm">Upgrade to Pro to view your published posts.</p>
        <a href="/subscription" className="inline-block mt-4 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors">Upgrade</a>
      </div>
    );
  }

  if (!session.isConnected) {
    return (
      <div className="text-center py-16">
        <FileText size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 text-sm">Connect your LinkedIn account to view posts.</p>
      </div>
    );
  }

  const paged = posts.slice(0, page * PAGE_SIZE);
  const hasMore = paged.length < posts.length;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">Published Posts</h2>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[#0A66C2]" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
          <FileText size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 text-sm">No posts yet.</p>
          <p className="text-gray-400 text-xs mt-1">Published posts will appear here after you create them.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paged.map(post => (
              <div key={post.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <p className="text-sm text-gray-800 line-clamp-3">{post.text}</p>
                <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
                  <span>{fmt(post.createdAt)}</span>
                  {post.postUrl && (
                    <a href={post.postUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[#0A66C2] hover:underline">
                      <ExternalLink size={10} /> View on LinkedIn
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-2">
              <button onClick={() => setPage(p => p + 1)} className="px-5 py-2 text-sm text-[#0A66C2] border border-[#0A66C2] rounded-xl hover:bg-blue-50 transition-colors font-medium">
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
