import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS, apiFetch } from '@/config/api';
import { ShieldCheck, Bot, Check, X, Lock, AlertCircle, User, Sparkles, Key, Share2, ArrowRight } from 'lucide-react';

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
