import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Loader2, BarChart2, TrendingUp, ArrowUpDown } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { FacebookPost, FacebookPostInsights } from '@/types/facebook';
import { FacebookSessionHook } from '@/hooks/useFacebookSession';

interface Props { isPaid: boolean; session: FacebookSessionHook }

interface PostRow extends FacebookPost { insights?: FacebookPostInsights }

type SortKey = 'createdTime' | 'reach' | 'impressions' | 'reactions' | 'comments' | 'shares';

const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' });

function ReachBar({ value, max }: { value: number; max: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (max === 0) return;
    const ratio = Math.min(value / max, 1);
    const targetW = w * ratio;

    let currentW = 0;
    const step = targetW / 30;

    const animate = () => {
      currentW = Math.min(currentW + step, targetW);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(24, 119, 242, 0.15)';
      ctx.beginPath();
      ctx.roundRect(0, 0, w, h, 4);
      ctx.fill();
      if (currentW > 0) {
        ctx.fillStyle = '#1877f2';
        ctx.beginPath();
        ctx.roundRect(0, 0, currentW, h, 4);
        ctx.fill();
      }
      if (currentW < targetW) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, max]);

  useEffect(() => { draw(); }, [draw]);

  return <canvas ref={canvasRef} width={100} height={16} className="rounded" />;
}

export function FacebookAnalyticsPage({ isPaid, session }: Props) {
  const [rows, setRows] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('createdTime');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => { if (isPaid && session.isConnected) load(); }, [isPaid, session.isConnected]);

  const load = async () => {
    setLoading(true);
    try {
      const postsRes = await apiFetch(API_ENDPOINTS.facebook.posts);
      const postsData = await postsRes.json();
      if (!postsData.success) { setLoading(false); return; }
      const posts: FacebookPost[] = postsData.data || [];

      const withInsights = await Promise.all(
        posts.map(async post => {
          try {
            const r = await apiFetch(API_ENDPOINTS.facebook.postInsights(post.id));
            const d = await r.json();
            return { ...post, insights: d.success ? d.data : undefined } as PostRow;
          } catch {
            return post as PostRow;
          }
        })
      );
      setRows(withInsights);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sorted = [...rows].sort((a, b) => {
    let va: number, vb: number;
    if (sortKey === 'createdTime') {
      va = new Date(a.createdTime).getTime();
      vb = new Date(b.createdTime).getTime();
    } else {
      va = a.insights?.[sortKey] ?? 0;
      vb = b.insights?.[sortKey] ?? 0;
    }
    return sortAsc ? va - vb : vb - va;
  });

  const maxReach = Math.max(...rows.map(r => r.insights?.reach ?? 0), 1);

  if (!isPaid) {
    return (
      <div className="text-center py-16">
        <BarChart2 size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-400">Available on paid plans</p>
      </div>
    );
  }

  if (!session.isConnected) {
    return (
      <div className="text-center py-16">
        <BarChart2 size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-400">Connect a Facebook Page to view analytics</p>
      </div>
    );
  }

  const SortBtn = ({ col }: { col: SortKey }) => (
    <button onClick={() => handleSort(col)} className="ml-1 text-gray-400 hover:text-gray-600 transition-colors">
      <ArrowUpDown size={12} className={sortKey === col ? 'text-[#1877f2]' : ''} />
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-[#1877f2]" />
          <h2 className="text-xl font-bold text-gray-900">Post Analytics</h2>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 font-medium transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {rows.some(r => !r.insights) && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          Some insights are unavailable. Make sure your Facebook App has the <code className="bg-amber-100 px-1 rounded">read_insights</code> permission approved.
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-[#1877f2]" /></div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
          <BarChart2 size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No posts to analyse yet</p>
          <p className="text-gray-400 text-sm mt-1">Publish posts from the Compose tab first</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-semibold">Post</th>
                  <th className="text-left px-4 py-3 font-semibold">
                    Date<SortBtn col="createdTime" />
                  </th>
                  <th className="text-right px-4 py-3 font-semibold">
                    Reach<SortBtn col="reach" />
                  </th>
                  <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">
                    Impressions<SortBtn col="impressions" />
                  </th>
                  <th className="text-right px-4 py-3 font-semibold hidden md:table-cell">
                    Reactions<SortBtn col="reactions" />
                  </th>
                  <th className="text-right px-4 py-3 font-semibold hidden md:table-cell">
                    Comments<SortBtn col="comments" />
                  </th>
                  <th className="text-right px-4 py-3 font-semibold hidden lg:table-cell">
                    Shares<SortBtn col="shares" />
                  </th>
                  <th className="px-4 py-3 hidden sm:table-cell"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-gray-800 font-medium line-clamp-1 text-xs">{row.message || row.story || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmt(row.createdTime)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-[#1877f2]">{(row.insights?.reach ?? 0).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 hidden sm:table-cell">{(row.insights?.impressions ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-600 hidden md:table-cell">{(row.insights?.reactions ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-600 hidden md:table-cell">{(row.insights?.comments ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-600 hidden lg:table-cell">{(row.insights?.shares ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <ReachBar value={row.insights?.reach ?? 0} max={maxReach} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
