import { useState, useEffect } from 'react';
import { Send, RefreshCw, Loader2, Mailbox, X } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

interface SentEmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  provider: 'hostinger' | 'smtp';
  sentAt: string;
}

interface HostingerSentMessage {
  uid: number;
  subject: string;
  from: string;
  date: string;
  size: number;
  seen: boolean;
}

interface MessageText {
  plain: string;
  html: string;
}

interface Viewer {
  subject: string;
  meta: string;
}

const PAGE_SIZE = 20;

const PROVIDER_STYLES: Record<string, string> = {
  hostinger: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  smtp: 'bg-gray-50 text-gray-600 border-gray-200',
};

export function EmailSentPage({ isPaid }: { isPaid: boolean }) {
  const [logs, setLogs] = useState<SentEmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [isHostinger, setIsHostinger] = useState(false);
  const [hostingerMessages, setHostingerMessages] = useState<HostingerSentMessage[]>([]);
  const [hostingerTotal, setHostingerTotal] = useState(0);
  const [hostingerPage, setHostingerPage] = useState(1);
  const [hostingerLoading, setHostingerLoading] = useState(false);
  const [showHostinger, setShowHostinger] = useState(false);

  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [viewerBody, setViewerBody] = useState<MessageText | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);

  useEffect(() => { if (isPaid) { load(1); checkProvider(); } }, [isPaid]);

  const checkProvider = async () => {
    try {
      const r = await apiFetch(API_ENDPOINTS.email.smtp);
      const d = await r.json();
      if (d.success && d.data?.host === 'hostinger-api') setIsHostinger(true);
    } catch { /* ignore */ }
  };

  const load = async (pageToLoad: number) => {
    setLoading(true);
    try {
      const r = await apiFetch(`${API_ENDPOINTS.email.sent}?page=${pageToLoad}&limit=${PAGE_SIZE}`);
      const d = await r.json();
      if (d.success) {
        setLogs(prev => pageToLoad === 1 ? (d.data || []) : [...prev, ...(d.data || [])]);
        setTotal(d.total || 0);
        setPage(pageToLoad);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const loadHostinger = async (pageToLoad: number) => {
    setHostingerLoading(true);
    try {
      const r = await apiFetch(`${API_ENDPOINTS.email.sentHostinger}?page=${pageToLoad}&perPage=${PAGE_SIZE}`);
      const d = await r.json();
      if (d.success) {
        setHostingerMessages(prev => pageToLoad === 1 ? (d.data || []) : [...prev, ...(d.data || [])]);
        setHostingerTotal(d.total || 0);
        setHostingerPage(pageToLoad);
      }
    } catch { /* ignore */ }
    setHostingerLoading(false);
  };

  const toggleHostinger = () => {
    const next = !showHostinger;
    setShowHostinger(next);
    if (next && hostingerMessages.length === 0) loadHostinger(1);
  };

  const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  const openLog = (log: SentEmailLog) => {
    setViewer({ subject: log.subject || '(no subject)', meta: `To: ${log.to} · ${fmt(log.sentAt)}` });
    setViewerBody({ plain: '', html: log.body || '' });
    setViewerLoading(false);
    setViewerError(null);
  };

  const openHostingerMessage = async (m: HostingerSentMessage) => {
    setViewer({ subject: m.subject || '(no subject)', meta: `From: ${m.from} · ${fmt(m.date)}` });
    setViewerBody(null);
    setViewerError(null);
    setViewerLoading(true);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.sentHostingerMessage(m.uid));
      const d = await r.json();
      if (d.success && d.data) setViewerBody(d.data);
      else setViewerError(d.error || 'Failed to load email content');
    } catch {
      setViewerError('Network error loading email content');
    }
    setViewerLoading(false);
  };

  const closeViewer = () => { setViewer(null); setViewerBody(null); setViewerError(null); };

  if (!isPaid) return <div className="text-center py-16"><Send size={40} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">Available on paid plans</p></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Sent Emails</h2>
        <button onClick={() => load(1)} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 font-medium transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {loading && !logs.length ? (
        <div className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-blue-500" /></div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
          <Send size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No emails sent yet</p>
          <p className="text-gray-400 text-sm mt-1">Sends from the Send tab will show up here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <button key={log.id} onClick={() => openLog(log)}
              className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-3 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${PROVIDER_STYLES[log.provider] || PROVIDER_STYLES.smtp}`}>
                    {log.provider === 'hostinger' ? 'Hostinger' : 'SMTP'}
                  </span>
                  <span className="text-xs text-gray-400">{fmt(log.sentAt)}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">{log.subject || '(no subject)'}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">To: {log.to}</p>
              </div>
            </button>
          ))}
          {logs.length < total && (
            <button onClick={() => load(page + 1)} disabled={loading}
              className="w-full py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              {loading ? 'Loading…' : `Load more (${logs.length} of ${total})`}
            </button>
          )}
        </div>
      )}

      {isHostinger && (
        <div className="bg-white rounded-xl border border-gray-200">
          <button onClick={toggleHostinger} className="w-full flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2">
              <Mailbox size={16} className="text-indigo-600" />
              <span className="text-sm font-bold text-gray-900">From Hostinger Mailbox</span>
              <span className="text-xs text-gray-400">(live INBOX.Sent — cross-check true delivery)</span>
            </div>
            <span className="text-xs text-blue-600 font-medium">{showHostinger ? 'Hide' : 'Show'}</span>
          </button>

          {showHostinger && (
            <div className="border-t border-gray-100 p-4 space-y-2">
              {hostingerLoading && !hostingerMessages.length ? (
                <div className="text-center py-8"><Loader2 size={20} className="animate-spin mx-auto text-blue-500" /></div>
              ) : hostingerMessages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">No messages found in INBOX.Sent</p>
              ) : (
                <>
                  {hostingerMessages.map(m => (
                    <button key={m.uid} onClick={() => openHostingerMessage(m)}
                      className="w-full text-left border border-gray-100 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{m.subject || '(no subject)'}</p>
                        <span className="text-xs text-gray-400 shrink-0">{fmt(m.date)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">From: {m.from}</p>
                    </button>
                  ))}
                  {hostingerMessages.length < hostingerTotal && (
                    <button onClick={() => loadHostinger(hostingerPage + 1)} disabled={hostingerLoading}
                      className="w-full py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      {hostingerLoading ? 'Loading…' : `Load more (${hostingerMessages.length} of ${hostingerTotal})`}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Message content viewer */}
      {viewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeViewer} />
          <div className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-100 shrink-0">
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{viewer.subject}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{viewer.meta}</p>
              </div>
              <button onClick={closeViewer} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 shrink-0">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col min-h-[200px]">
              {viewerLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span className="text-xs">Loading email content…</span>
                </div>
              ) : viewerError ? (
                <div className="flex-1 flex items-center justify-center text-sm text-red-500 text-center">{viewerError}</div>
              ) : viewerBody?.html ? (
                <iframe
                  title="Email Body"
                  srcDoc={viewerBody.html}
                  className="w-full flex-1 border border-gray-200 rounded-lg bg-white"
                  sandbox="allow-popups allow-popups-to-escape-sandbox"
                />
              ) : (
                <div className="w-full flex-1 border border-gray-200 rounded-lg bg-white p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono overflow-y-auto">
                  {viewerBody?.plain || '(Empty message)'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
