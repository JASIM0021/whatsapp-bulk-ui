import { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Trash2, Loader2, Image, Link, Type, FileText } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { FacebookPost } from '@/types/facebook';
import { FacebookSessionHook } from '@/hooks/useFacebookSession';

interface Props { isPaid: boolean; session: FacebookSessionHook }

const PAGE_SIZE = 10;

const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

function postTypeLabel(post: FacebookPost) {
  if (post.fullPicture) return { label: 'Photo', icon: <Image size={11} />, cls: 'bg-purple-50 text-purple-700 border-purple-200' };
  if (post.story) return { label: 'Story', icon: <FileText size={11} />, cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (post.message?.startsWith('http')) return { label: 'Link', icon: <Link size={11} />, cls: 'bg-blue-50 text-blue-700 border-blue-200' };
  return { label: 'Text', icon: <Type size={11} />, cls: 'bg-gray-50 text-gray-600 border-gray-200' };
}

export function FacebookPostsPage({ isPaid, session }: Props) {
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { if (isPaid && session.isConnected) load(); }, [isPaid, session.isConnected]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch(API_ENDPOINTS.facebook.posts);
      const d = await r.json();
      if (d.success) setPosts(d.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await apiFetch(API_ENDPOINTS.facebook.post(id), { method: 'DELETE' });
      setPosts(p => p.filter(post => post.id !== id));
    } catch { /* ignore */ }
    setDeleting(null);
  };

  if (!isPaid) {
    return (
      <div className="text-center py-16">
        <FileText size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-400">Available on paid plans</p>
      </div>
    );
  }

  if (!session.isConnected) {
    return (
      <div className="text-center py-16">
        <FileText size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-400">Connect a Facebook Page to view posts</p>
      </div>
    );
  }

  const paged = posts.slice(0, page * PAGE_SIZE);
  const hasMore = paged.length < posts.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Published Posts</h2>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 font-medium transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {loading && !posts.length ? (
        <div className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-[#1877f2]" /></div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
          <FileText size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No posts yet</p>
          <p className="text-gray-400 text-sm mt-1">Published posts from the Compose tab will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paged.map(post => {
            const type = postTypeLabel(post);
            return (
              <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
                {post.fullPicture && (
                  <img src={post.fullPicture} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-gray-100" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${type.cls}`}>
                      {type.icon}{type.label}
                    </span>
                    <span className="text-xs text-gray-400">{fmt(post.createdTime)}</span>
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-2">{post.message || post.story || '—'}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a href={post.permalinkUrl} target="_blank" rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-[#1877f2] hover:bg-blue-50 rounded-lg transition-colors" title="View on Facebook">
                    <ExternalLink size={15} />
                  </a>
                  <button onClick={() => handleDelete(post.id)} disabled={deleting === post.id}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete post">
                    {deleting === post.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            );
          })}
          {hasMore && (
            <button onClick={() => setPage(p => p + 1)} className="w-full py-2.5 text-sm text-[#1877f2] font-medium hover:bg-blue-50 rounded-xl transition-colors border border-blue-100">
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
