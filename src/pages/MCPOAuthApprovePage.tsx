import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, apiFetch } from '@/config/api';
import { ShieldCheck, Bot, Check, X, Lock, AlertCircle, User, Sparkles, Key, Share2, ArrowRight, MessageCircle, Smartphone, Crown, ExternalLink, Ban } from 'lucide-react';
import { clearPostAuthRedirect } from '@/lib/postAuthRedirect';

/** Public info about a trusted partner app (GET /api/oauth/client-info). */
interface TrustedAppInfo {
  client_id: string;
  name: string;
  trusted: boolean;
  scope: string;
  logo_url?: string;
  description?: string;
}

export function MCPOAuthApprovePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientID = searchParams.get('client_id') || '';
  const redirectURI = searchParams.get('redirect_uri') || '';
  const scope = searchParams.get('scope') || 'mcp whatsapp offline_access';
  const state = searchParams.get('state') || '';
  const codeChallenge = searchParams.get('code_challenge') || '';
  const codeChallengeMethod = searchParams.get('code_challenge_method') || '';

  // Trusted partner apps (e.g. Tuition Manager) get their own consent screen; AI agents keep the one below.
  const [appInfo, setAppInfo] = useState<TrustedAppInfo | null | undefined>(clientID ? undefined : null);
  useEffect(() => {
    clearPostAuthRedirect(); // we're back from login/signup
    if (!clientID) return;
    apiFetch(API_ENDPOINTS.oauth.clientInfo(clientID))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAppInfo(d && d.success && d.trusted ? (d as TrustedAppInfo) : null))
      .catch(() => setAppInfo(null));
  }, [clientID]);

  // Derive friendly app name
  const getAppName = (id: string) => {
    if (id.toLowerCase().includes('chatgpt') || id.toLowerCase().includes('openai')) return 'ChatGPT App / Custom Connector';
    if (id.toLowerCase().includes('opencode')) return 'OpenCode AI Agent';
    if (id.toLowerCase().includes('cursor') || id.toLowerCase().includes('windsurf')) return 'IDE AI Assistant';
    if (id.toLowerCase().includes('claude') || id.toLowerCase().includes('anthropic')) return 'Claude Web Connector';
    return id || 'AI Agent Application';
  };

  const appName = getAppName(clientID);

  const handleAuthorize = async () => {
    if (!clientID || !redirectURI) {
      setError('Missing required OAuth parameters: client_id and redirect_uri.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch(API_ENDPOINTS.oauth.approve, {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientID,
          redirect_uri: redirectURI,
          scope,
          state,
          code_challenge: codeChallenge,
          code_challenge_method: codeChallengeMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate authorization code.');
      }

      // Redirect browser to AI client callback URL
      window.location.href = data.redirect_url;
    } catch (err: any) {
      setError(err.message || 'An error occurred during authorization.');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (redirectURI) {
      const separator = redirectURI.includes('?') ? '&' : '?';
      const cancelURL = `${redirectURI}${separator}error=access_denied&error_description=User%20denied%20access${state ? `&state=${encodeURIComponent(state)}` : ''}`;
      window.location.href = cancelURL;
    } else {
      navigate('/dashboard');
    }
  };

  if (!clientID || !redirectURI) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900/80 border border-red-500/30 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Invalid OAuth Request</h1>
          <p className="text-slate-400 text-sm mb-6">
            This page must be opened by an AI application (like ChatGPT or OpenCode) during the connection setup flow. Missing <code className="text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded">client_id</code> or <code className="text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded">redirect_uri</code>.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (appInfo === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (appInfo) {
    return (
      <TrustedAppConsent
        app={appInfo}
        userEmail={user?.email}
        loading={loading}
        error={error}
        onApprove={handleAuthorize}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-2xl relative z-10">
        {/* Header badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI AGENT OAUTH 2.0 CONNECT</span>
          </div>
        </div>

        {/* App Info & User Profile */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col items-center justify-center text-slate-500">
              <Share2 className="w-5 h-5 animate-pulse text-emerald-400" />
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Authorize Access</h1>
          <p className="text-slate-400 text-sm">
            <span className="text-white font-semibold">{appName}</span> is requesting permission to connect to your NexBotix account.
          </p>
        </div>

        {/* Logged in user box */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
              <User className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Connected Account</div>
              <div className="text-sm font-medium text-white">{user?.name || user?.email || 'NexBotix User'}</div>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium">
            Active
          </span>
        </div>

        {/* Requested Permissions List */}
        <div className="mb-8">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>Requested Permissions</span>
          </div>
          <div className="space-y-3 bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">WhatsApp MCP Server Automation</div>
                <div className="text-xs text-slate-400">Read & write messages, send templates, and manage bulk campaigns.</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">AI Marketing & Scheduling</div>
                <div className="text-xs text-slate-400">Execute automated workflows, scheduler jobs, and omnichannel campaigns.</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Secure Bearer Token Authentication</div>
                <div className="text-xs text-slate-400">No static API keys stored; tokens can be revoked at any time.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-500/40 rounded-xl flex items-start gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleAuthorize}
            disabled={loading}
            className="flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Authorize Access</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>End-to-End Encrypted OAuth 2.0 Flow • RFC 7636 PKCE Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}


interface WAStatus {
  linked: boolean;
}
interface PlanStatus {
  plan: string;
  isActive: boolean;
  daysLeft: number;
  hasWhatsApp: boolean;
}

/** What a partner app may do with each scope, in plain language. */
const SCOPE_CAN: Record<string, string[]> = {
  whatsapp: ['Send WhatsApp messages from your linked number (reminders, alerts, receipts)', 'See whether your WhatsApp is linked and your plan status'],
};
const CANNOT = ['Read your WhatsApp chats or contacts', 'Access your campaigns, bots, email or other NexBotix data', 'See your password or payment details'];

function TrustedAppConsent({
  app,
  userEmail,
  loading,
  error,
  onApprove,
  onCancel,
}: {
  app: TrustedAppInfo;
  userEmail?: string;
  loading: boolean;
  error: string | null;
  onApprove: () => void;
  onCancel: () => void;
}) {
  const [wa, setWa] = useState<WAStatus | null>(null);
  const [plan, setPlan] = useState<PlanStatus | null>(null);

  useEffect(() => {
    apiFetch(API_ENDPOINTS.whatsapp.status)
      .then((r) => r.json())
      .then((r) => setWa({ linked: !!(r?.success && r.data?.isConnected && r.data?.isReady) }))
      .catch(() => setWa({ linked: false }));
    apiFetch(API_ENDPOINTS.subscription.status)
      .then((r) => r.json())
      .then((r) => {
        const d = r?.data || r;
        if (d && typeof d === 'object' && 'plan' in d)
          setPlan({ plan: d.plan, isActive: !!d.isActive, daysLeft: d.daysLeft ?? 0, hasWhatsApp: (d.enabledServices || []).includes('whatsapp') });
      })
      .catch(() => {});
  }, []);

  const can = SCOPE_CAN[app.scope] || [`Use: ${app.scope}`];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-2xl">
        <div className="flex items-center justify-center gap-3 mb-5">
          {app.logo_url ? (
            <img src={app.logo_url} alt="" className="w-14 h-14 rounded-2xl bg-white p-1" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
          )}
          <ArrowRight className="w-5 h-5 text-slate-500" />
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <MessageCircle className="w-7 h-7 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-center text-xl font-bold">Connect {app.name} to NexBotix</h1>
        {app.description && <p className="text-center text-sm text-slate-400 mt-1.5">{app.description}</p>}
        {userEmail && <p className="text-center text-xs text-slate-500 mt-2">Signed in as {userEmail}</p>}

        <div className="mt-6 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{app.name} will be able to</div>
          {can.map((c) => (
            <div key={c} className="flex items-start gap-2.5 text-sm text-slate-200">
              <Check className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" /> {c}
            </div>
          ))}
          <div className="pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">It will not be able to</div>
          {CANNOT.map((c) => (
            <div key={c} className="flex items-start gap-2.5 text-sm text-slate-400">
              <Ban className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" /> {c}
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-2">
          <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm ${wa?.linked ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-200'}`}>
            <Smartphone className="w-4 h-4 shrink-0" />
            {wa === null ? (
              'Checking your WhatsApp…'
            ) : wa.linked ? (
              'Your WhatsApp is linked — messages will send automatically.'
            ) : (
              <span>
                WhatsApp is not linked yet. You can connect now and link it after:{' '}
                <a href="/app" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">
                  scan the QR code <ExternalLink className="w-3 h-3" />
                </a>
              </span>
            )}
          </div>
          {plan && (
            <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm ${plan.isActive && plan.hasWhatsApp ? 'bg-slate-800 text-slate-300' : 'bg-red-500/10 text-red-200'}`}>
              <Crown className="w-4 h-4 shrink-0" />
              {!plan.isActive ? (
                <span>
                  Your NexBotix plan has expired.{' '}
                  <a href="/subscription" target="_blank" rel="noreferrer" className="underline">Renew</a> to send messages.
                </span>
              ) : !plan.hasWhatsApp ? (
                <span>
                  Your plan doesn’t include WhatsApp.{' '}
                  <a href="/subscription" target="_blank" rel="noreferrer" className="underline">Upgrade</a> to send messages.
                </span>
              ) : plan.plan === 'trial' ? (
                `Free trial — ${plan.daysLeft} day${plan.daysLeft === 1 ? '' : 's'} left`
              ) : (
                `Plan: ${plan.plan}${plan.daysLeft ? ` · ${plan.daysLeft} days left` : ''}`
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} disabled={loading} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={onApprove}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Allow & connect <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          <Lock className="inline w-3 h-3 mr-1" />
          You can disconnect {app.name} at any time from either app.
        </p>
      </div>
    </div>
  );
}
