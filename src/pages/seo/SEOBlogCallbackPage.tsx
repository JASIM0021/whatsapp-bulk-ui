import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

export function SEOBlogCallbackPage() {
  const navigate = useNavigate();
  const installationId = new URLSearchParams(window.location.search).get('installation_id');
  const [error, setError] = useState(
    installationId ? '' : 'No installation_id received from GitHub. Please try connecting again.'
  );

  useEffect(() => {
    if (!installationId) return;

    apiFetch(API_ENDPOINTS.seoBlog.callback, {
      method: 'POST',
      body: JSON.stringify({ installationId: parseInt(installationId, 10) }),
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          navigate('/seo?tab=blog', { replace: true });
        } else {
          setError(json.error || 'Failed to save GitHub App installation.');
        }
      })
      .catch(() => setError('Network error while saving GitHub App installation.'));
  }, [installationId, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
            <h2 className="text-base font-bold text-gray-900">GitHub App Connection Failed</h2>
          </div>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/seo?tab=blog')}
            className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            Back to SEO Blog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
        <p className="text-slate-300 text-sm">Connecting GitHub App...</p>
      </div>
    </div>
  );
}
