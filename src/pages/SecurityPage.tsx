import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, Clock, ToggleLeft, ToggleRight, Loader, Info } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

export function SecurityPage() {
  const navigate = useNavigate();
  const [autoLogoutEnabled, setAutoLogoutEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggeling, setIsToggeling] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.security.settings);
        const json = await res.json();
        if (json.success && json.data) {
          setAutoLogoutEnabled(json.data.autoLogoutEnabled ?? false);
        }
      } catch {
        // ignore — default to false
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggle = async () => {
    const newVal = !autoLogoutEnabled;
    setAutoLogoutEnabled(newVal);
    setIsToggeling(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.security.settings, {
        method: 'POST',
        body: JSON.stringify({ autoLogoutEnabled: newVal }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          newVal
            ? 'Auto-logout enabled — WhatsApp will disconnect after 10 min of inactivity'
            : 'Auto-logout disabled — session stays active',
          true
        );
      } else {
        setAutoLogoutEnabled(!newVal); // revert
        showToast(json.error || 'Failed to update setting', false);
      }
    } catch {
      setAutoLogoutEnabled(!newVal);
      showToast('Network error — could not update setting', false);
    } finally {
      setIsToggeling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader size={32} className="animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/app')}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center shadow-sm">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Security Settings</h1>
              <p className="text-xs text-gray-500">Protect your WhatsApp session</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* Auto-logout toggle card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <Clock size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Auto-Logout on Idle</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {autoLogoutEnabled
                    ? 'WhatsApp session will disconnect after 10 minutes of inactivity'
                    : 'Session stays active indefinitely — auto-logout is off'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              disabled={isToggeling}
              className={`shrink-0 transition-colors disabled:opacity-60 ${
                autoLogoutEnabled ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {isToggeling
                ? <Loader size={40} className="animate-spin" />
                : autoLogoutEnabled
                  ? <ToggleRight size={40} />
                  : <ToggleLeft size={40} />}
            </button>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 space-y-1">
            <p className="font-medium">How auto-logout works</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Your activity is tracked as long as the web app is open.</li>
              <li>If the app is closed or you stop interacting, the idle timer starts.</li>
              <li>After <strong>10 minutes</strong> of inactivity, your WhatsApp session is automatically disconnected from the server.</li>
              <li>You can reconnect anytime by opening the app and scanning the QR code again.</li>
            </ul>
          </div>
        </div>

      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-sm text-white font-medium transition-all ${
          toast.ok ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
