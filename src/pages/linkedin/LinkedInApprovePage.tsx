import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

export function LinkedInApprovePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const action = searchParams.get('action');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token || !action) {
      setErrorMsg('Invalid parameters. Missing token or action in the link.');
      setLoading(false);
      return;
    }

    if (action !== 'approve' && action !== 'delete') {
      setErrorMsg('Invalid action requested. Link action must be approve or delete.');
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await apiFetch(`${API_ENDPOINTS.linkedin.approveAction}?token=${token}&action=${action}`, {
          method: 'POST',
        });
        const data = await res.json();
        if (data.success) {
          setSuccess(true);
        } else {
          setErrorMsg(data.error || 'Failed to process request.');
        }
      } catch {
        setErrorMsg('Network error. Failed to connect to NexBotix API.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, action]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100 px-4 relative overflow-hidden">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glassmorphic Card Container */}
      <div className="w-full max-w-md bg-gray-900/40 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 text-center shadow-2xl relative z-10">
        
        {/* NexBotix Brand Header */}
        <div className="mb-8">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-wider">
            NEXBOTIX
          </span>
          <div className="h-0.5 w-12 bg-indigo-500 mx-auto mt-2 rounded-full" />
        </div>

        {loading ? (
          <div className="space-y-6 py-8">
            <Loader2 size={48} className="animate-spin text-blue-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-gray-200">Processing Request</h3>
              <p className="text-sm text-gray-400 mt-2">
                Communicating with the platform, validating token security, and processing your action...
              </p>
            </div>
          </div>
        ) : success ? (
          <div className="space-y-6 py-6 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-100">
                {action === 'approve' ? 'Post Approved & Published!' : 'Post Rejected & Deleted!'}
              </h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                {action === 'approve'
                  ? 'Your automated LinkedIn post has been successfully formatted, any generated visual assets uploaded, and the post is live.'
                  : 'The auto-generated post draft and associated media files have been permanently removed from the pending queues.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-6 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-2">
              {errorMsg.includes('expired') ? <AlertTriangle size={36} /> : <XCircle size={36} />}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-100">
                {errorMsg.includes('expired') ? 'Approval Token Expired' : 'Unable to Process'}
              </h3>
              <p className="text-sm text-red-400/90 mt-2 leading-relaxed bg-red-950/20 border border-red-900/20 rounded-2xl p-4">
                {errorMsg}
              </p>
              <p className="text-xs text-gray-400 mt-4 leading-relaxed">
                Tokens are valid for exactly <strong>10 minutes</strong> from sending. If this post expired, you can manually trigger a run inside the NexBotix LinkedIn Automation dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-gray-800/80">
          <a
            href="https://nexbotix.online/linkedin"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/20"
          >
            Go to LinkedIn Automation
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
