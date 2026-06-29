import { useState } from 'react';
import {
  Loader2, CheckCircle2, LogOut, Linkedin, ExternalLink, Copy, Check,
  KeyRound, AlertCircle, ArrowRight, Info,
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { LinkedInSessionHook } from '@/hooks/useLinkedInSession';

interface Props {
  session: LinkedInSessionHook;
}

const CALLBACK_URL = 'https://bulksenderapi.todayintech.in/api/linkedin/callback';

export function LinkedInConnectTab({ session }: Props) {
  const isPlatformAuth = session.hasPlatformAuth === true;
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (session.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  // ── Connected state ──────────────────────────────────────────────────────────
  if (session.isConnected) {
    return (
      <div className="max-w-lg mx-auto py-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {session.profilePicture ? (
                <img
                  src={session.profilePicture}
                  alt={session.profileName || ''}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#0A66C2]"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#0A66C2] flex items-center justify-center text-white">
                  <Linkedin size={30} />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                <CheckCircle2 size={12} className="text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{session.profileName || 'LinkedIn Account'}</h3>
              {session.email && (
                <p className="text-xs text-gray-500 mt-0.5">{session.email}</p>
              )}
              <p className="text-sm text-green-600 font-medium flex items-center gap-1 mt-0.5">
                <CheckCircle2 size={13} /> Connected via OAuth2 API
              </p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-800">
            Your LinkedIn account is connected using the official API. You can now create and schedule posts from the tabs above.
          </div>

          <button
            onClick={async () => {
              setDisconnecting(true);
              try {
                await apiFetch(API_ENDPOINTS.linkedin.disconnect, { method: 'POST' });
                await session.refresh();
              } catch { /* ignore */ }
              setDisconnecting(false);
            }}
            disabled={disconnecting}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors font-medium"
          >
            {disconnecting ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            Disconnect Account
          </button>
        </div>
      </div>
    );
  }

  const handleConnect = async () => {
    setError('');
    setConnecting(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.linkedin.authUrl);
      const data = await res.json();
      if (!data.success || !data.url) {
        setError(data.error || 'Failed to get authorization URL');
        setConnecting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Failed to initiate OAuth flow');
      setConnecting(false);
    }
  };

  // ── Save credentials & connect (manual credentials flow) ─────────────────────
  const copyCallbackURL = async () => {
    await navigator.clipboard.writeText(session.callbackUrl || CALLBACK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim() || !clientSecret.trim()) return;
    setError('');
    setSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.linkedin.credentials, {
        method: 'POST',
        body: JSON.stringify({ clientId: clientId.trim(), clientSecret: clientSecret.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to save credentials');
        setSaving(false);
        return;
      }
    } catch {
      setError('Failed to save credentials');
      setSaving(false);
      return;
    }
    setSaving(false);
    handleConnect();
  };

  const callbackURL = session.callbackUrl || CALLBACK_URL;

  // ── Platform OAuth flow (platform-managed LinkedIn app) ───────────────────────
  if (isPlatformAuth) {
    return (
      <div className="max-w-lg mx-auto py-8 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#0A66C2] flex items-center justify-center mx-auto mb-5 shadow-lg">
            <Linkedin size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connect LinkedIn</h2>
          <p className="text-sm text-gray-500 mb-6">
            Sign in with your LinkedIn account to enable automated posting and scheduling.
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-700 text-left">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-semibold text-sm transition-colors shadow-md shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {connecting ? (
              <><Loader2 size={17} className="animate-spin" /> Redirecting to LinkedIn…</>
            ) : (
              <><Linkedin size={17} /> Sign in with LinkedIn <ArrowRight size={15} /></>
            )}
          </button>

          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-3 text-left">
            <div className="flex items-start gap-2">
              <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                You'll be redirected to LinkedIn to authorize the app. We request permission to create posts on your behalf. We never store your LinkedIn password.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Manual credentials flow ───────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto py-8 space-y-5">

      {/* Step 1: Create LinkedIn App */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
          <h3 className="font-bold text-gray-900">Create a LinkedIn Developer App</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4 ml-11">
          Go to the LinkedIn Developer Portal, create an app, and add the OAuth 2.0 product. Then add this redirect URL to your app's authorized redirect URLs:
        </p>

        {/* Callback URL display */}
        <div className="ml-11">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            OAuth Redirect URL — add this to your LinkedIn App
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 font-mono text-xs text-gray-700 truncate">
              {callbackURL}
            </div>
            <button
              type="button"
              onClick={copyCallbackURL}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition-colors"
            >
              {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <a
          href="https://developer.linkedin.com/apps/new"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 ml-11 inline-flex items-center gap-1.5 text-xs text-[#0A66C2] hover:underline font-medium"
        >
          Open LinkedIn Developer Portal <ExternalLink size={11} />
        </a>

        {/* Scopes info */}
        <div className="mt-4 ml-11 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <Info size={13} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800">
              <strong>Required scopes:</strong> <code className="bg-blue-100 px-1 rounded">openid</code> <code className="bg-blue-100 px-1 rounded">profile</code> <code className="bg-blue-100 px-1 rounded">email</code> <code className="bg-blue-100 px-1 rounded">w_member_social</code>
              <br />
              <span className="text-blue-600 mt-1 block">Enable the <strong>Sign In with LinkedIn using OpenID Connect</strong> and <strong>Share on LinkedIn</strong> products in your app.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Enter credentials */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
          <h3 className="font-bold text-gray-900">Enter Your App Credentials</h3>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 ml-11 text-sm text-red-700">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSaveAndConnect} className="space-y-4 ml-11">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <KeyRound size={13} className="inline mr-1" />Client ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              placeholder="86xxxxxxxxxxxxxxxx"
              required
              autoComplete="off"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <KeyRound size={13} className="inline mr-1" />Client Secret
            </label>
            <input
              type="password"
              value={clientSecret}
              onChange={e => setClientSecret(e.target.value)}
              placeholder="••••••••••••••••"
              required
              autoComplete="new-password"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving || connecting || !clientId.trim() || !clientSecret.trim()}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-3 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-semibold text-sm transition-colors shadow-md shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><Loader2 size={17} className="animate-spin" /> Saving credentials…</>
            ) : connecting ? (
              <><Loader2 size={17} className="animate-spin" /> Redirecting to LinkedIn…</>
            ) : (
              <><Linkedin size={17} /> Connect to LinkedIn <ArrowRight size={15} /></>
            )}
          </button>
        </form>

        {session.hasCredentials && !session.isConnected && (
          <p className="ml-11 mt-3 text-xs text-gray-400 flex items-center gap-1">
            <CheckCircle2 size={11} className="text-green-500" />
            Credentials already saved — you can click Connect again to re-authorize.
          </p>
        )}
      </div>
    </div>
  );
}
