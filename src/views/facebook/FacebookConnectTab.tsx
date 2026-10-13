import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Users, ExternalLink, LogOut } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { FacebookPage } from '@/types/facebook';
import { FacebookSessionHook } from '@/hooks/useFacebookSession';

interface Props {
  session: FacebookSessionHook;
}

type State = 'idle' | 'redirecting' | 'select_page' | 'connected';

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12.07h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.875h2.773l-.443 2.89h-2.33v6.988C20.343 21.201 24 17.064 24 12.073z" />
    </svg>
  );
}

export function FacebookConnectTab({ session }: Props) {
  const [state, setState] = useState<State>('idle');
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [selectingPage, setSelectingPage] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (session.isLoading) return;
    if (session.isConnected && session.selectedPageId) {
      setState('connected');
    } else if (session.isConnected && !session.selectedPageId) {
      setState('select_page');
      loadPages();
    } else {
      setState('idle');
    }
  }, [session.isConnected, session.selectedPageId, session.isLoading]);

  const loadPages = async () => {
    setLoadingPages(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.facebook.pages);
      const data = await res.json();
      if (data.success) setPages(data.data || []);
    } catch { /* ignore */ }
    setLoadingPages(false);
  };

  const handleConnect = async () => {
    setState('redirecting');
    try {
      const res = await apiFetch(API_ENDPOINTS.facebook.oauthUrl);
      const data = await res.json();
      const url = data.data?.url || data.url;
      if (url) {
        window.location.href = url;
      } else {
        setState('idle');
      }
    } catch {
      setState('idle');
    }
  };

  const handleSelectPage = async (pageId: string) => {
    setSelectingPage(pageId);
    try {
      await apiFetch(API_ENDPOINTS.facebook.selectPage, {
        method: 'POST',
        body: JSON.stringify({ pageId }),
      });
      await session.refresh();
    } catch { /* ignore */ }
    setSelectingPage(null);
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await apiFetch(API_ENDPOINTS.facebook.disconnect, { method: 'POST' });
      await session.refresh();
    } catch { /* ignore */ }
    setDisconnecting(false);
  };

  if (session.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-[#1877f2]" />
      </div>
    );
  }

  if (state === 'connected') {
    return (
      <div className="max-w-lg mx-auto py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {session.selectedPagePicture ? (
                <img src={session.selectedPagePicture} alt={session.selectedPageName || ''} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#1877f2] flex items-center justify-center text-white">
                  <FacebookIcon size={30} />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                <CheckCircle2 size={12} className="text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{session.selectedPageName}</h3>
              <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                <CheckCircle2 size={13} /> Connected
              </p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-800">
            Your Facebook Page is connected. You can now create posts, schedule content, and view analytics from the tabs above.
          </div>

          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors font-medium"
          >
            {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            Disconnect Page
          </button>
        </div>
      </div>
    );
  }

  if (state === 'select_page') {
    return (
      <div className="max-w-lg mx-auto py-8 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Select a Facebook Page</h2>
          <p className="text-sm text-gray-500">Choose the page you want to manage posts for.</p>
        </div>

        {loadingPages ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[#1877f2]" />
          </div>
        ) : pages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <FacebookIcon size={40} />
            <p className="text-gray-500 mt-3 text-sm">No Pages found for your account.</p>
            <p className="text-gray-400 text-xs mt-1">Make sure you manage at least one Facebook Page.</p>
            <button onClick={() => { setState('idle'); session.refresh(); }} className="mt-4 text-sm text-[#1877f2] hover:underline">Try again</button>
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map(page => (
              <button
                key={page.id}
                onClick={() => handleSelectPage(page.id)}
                disabled={selectingPage !== null}
                className="w-full bg-white rounded-2xl border-2 border-gray-200 hover:border-[#1877f2] p-4 flex items-center gap-4 transition-all text-left group"
              >
                {page.picture?.data?.url ? (
                  <img src={page.picture.data.url} alt={page.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#1877f2] flex items-center justify-center text-white flex-shrink-0">
                    <FacebookIcon size={22} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 group-hover:text-[#1877f2] transition-colors">{page.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{page.category}</p>
                  {page.followerCount !== undefined && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Users size={10} /> {page.followerCount.toLocaleString()} followers
                    </p>
                  )}
                </div>
                {selectingPage === page.id ? (
                  <Loader2 size={18} className="animate-spin text-[#1877f2] flex-shrink-0" />
                ) : (
                  <ExternalLink size={16} className="text-gray-300 group-hover:text-[#1877f2] flex-shrink-0 transition-colors" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // idle / redirecting
  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
        <div className="w-20 h-20 rounded-full bg-[#1877f2] flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-blue-200">
          <FacebookIcon size={38} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Connect Facebook Page</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          Connect your Facebook Page to publish posts, schedule content, and track reach — all from here.
        </p>
        <button
          onClick={handleConnect}
          disabled={state === 'redirecting'}
          className="inline-flex items-center gap-3 px-6 py-3 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-xl font-semibold text-sm transition-colors shadow-md shadow-blue-200 disabled:opacity-60"
        >
          {state === 'redirecting' ? (
            <><Loader2 size={18} className="animate-spin" /> Redirecting…</>
          ) : (
            <><FacebookIcon size={18} /> Continue with Facebook</>
          )}
        </button>
        <p className="text-xs text-gray-400 mt-6">
          You'll be redirected to Facebook to authorize access to your Pages.
        </p>
      </div>
    </div>
  );
}
