import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

export function FacebookCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const fbError = searchParams.get('error_description') || searchParams.get('error');

    if (fbError) {
      setError(fbError);
      return;
    }

    if (!code) {
      setError('No authorization code received from Facebook.');
      return;
    }

    apiFetch(API_ENDPOINTS.facebook.exchangeToken, {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          navigate('/facebook?tab=connect', { replace: true });
        } else {
          setError(data.message || 'Failed to connect Facebook account.');
        }
      })
      .catch(() => setError('Network error. Please try again.'));
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm px-6">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Connection Failed</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Link
            to="/facebook"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1877f2] text-white rounded-xl text-sm font-semibold hover:bg-[#166fe5] transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 size={36} className="animate-spin text-[#1877f2] mx-auto mb-4" />
        <p className="text-sm font-medium text-gray-600">Connecting your Facebook account…</p>
      </div>
    </div>
  );
}
