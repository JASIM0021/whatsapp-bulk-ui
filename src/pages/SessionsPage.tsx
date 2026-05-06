import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Monitor, Smartphone, Tablet, Globe, ArrowLeft, LogOut,
  LogIn, Loader, AlertTriangle, RefreshCw, MapPin, Clock,
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

interface Session {
  id: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  isCurrent?: boolean;
}

function deviceIcon(deviceInfo: string) {
  const d = deviceInfo.toLowerCase();
  if (d.includes('mobile') || d.includes('phone')) return <Smartphone size={18} />;
  if (d.includes('tablet')) return <Tablet size={18} />;
  return <Monitor size={18} />;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function SessionsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.auth.sessions);
      const json = await res.json();
      if (json.success) {
        setSessions(Array.isArray(json.data) ? json.data : (json.data?.sessions ?? []));
      } else {
        showToast(json.error || 'Failed to load sessions', false);
      }
    } catch {
      showToast('Network error — could not load sessions', false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  const handleLogoutSession = async (sessionId: string, isCurrent: boolean) => {
    setRevoking(sessionId);
    try {
      const res = await apiFetch(API_ENDPOINTS.auth.logout, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        if (isCurrent) {
          logout();
          navigate('/');
          return;
        }
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        showToast('Session revoked', true);
      } else {
        showToast(json.error || 'Failed to revoke session', false);
      }
    } catch {
      showToast('Network error', false);
    } finally {
      setRevoking(null);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('This will sign you out from all other devices. Continue?')) return;
    setRevokingAll(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.auth.logoutAll, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        const count = json.data?.revokedCount ?? 0;
        showToast(`Signed out from ${count} other device${count !== 1 ? 's' : ''}`, true);
        await loadSessions();
      } else {
        showToast(json.error || 'Failed to sign out from other devices', false);
      }
    } catch {
      showToast('Network error', false);
    } finally {
      setRevokingAll(false);
    }
  };

  const otherSessions = sessions.filter(s => !s.isCurrent);
  const currentSession = sessions.find(s => s.isCurrent);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-sm">
                <Globe size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Active Sessions</h1>
                <p className="text-xs text-gray-500">Devices logged in to your account</p>
              </div>
            </div>
          </div>
          <button
            onClick={loadSessions}
            disabled={isLoading}
            title="Refresh"
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader size={32} className="animate-spin text-indigo-500" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
            <AlertTriangle size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No active sessions found</p>
          </div>
        ) : (
          <>
            {/* Current session */}
            {currentSession && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Current session</p>
                <SessionCard
                  session={currentSession}
                  isCurrent
                  revoking={revoking === currentSession.id}
                  onRevoke={() => handleLogoutSession(currentSession.id, true)}
                />
              </div>
            )}

            {/* Other sessions */}
            {otherSessions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Other sessions ({otherSessions.length})
                  </p>
                  <button
                    onClick={handleLogoutAll}
                    disabled={revokingAll}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
                  >
                    {revokingAll
                      ? <Loader size={13} className="animate-spin" />
                      : <LogOut size={13} />}
                    Sign out all others
                  </button>
                </div>
                <div className="space-y-3">
                  {otherSessions.map(s => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      isCurrent={false}
                      revoking={revoking === s.id}
                      onRevoke={() => handleLogoutSession(s.id, false)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
              <p className="font-medium">About sessions</p>
              <ul className="list-disc list-inside text-blue-700 space-y-1 text-xs">
                <li>Each login from a new browser or device creates a separate session.</li>
                <li>Sessions expire automatically after 7 days.</li>
                <li>Signing out revokes the session immediately on all devices.</li>
              </ul>
            </div>
          </>
        )}
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

interface CardProps {
  session: Session;
  isCurrent: boolean;
  revoking: boolean;
  onRevoke: () => void;
}

function SessionCard({ session, isCurrent, revoking, onRevoke }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 flex items-start gap-4 ${
      isCurrent ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-gray-200'
    }`}>
      {/* Device icon */}
      <div className={`mt-0.5 w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
        isCurrent ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'
      }`}>
        {deviceIcon(session.deviceInfo)}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">{session.deviceInfo || 'Unknown Device'}</span>
          {isCurrent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-100 text-indigo-700">
              <LogIn size={10} />
              This device
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {session.ipAddress || 'Unknown IP'}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            Signed in {timeAgo(session.createdAt)} · {formatDate(session.createdAt)}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 truncate">{session.userAgent}</p>
      </div>

      {/* Revoke button */}
      <button
        onClick={onRevoke}
        disabled={revoking}
        title={isCurrent ? 'Sign out this device' : 'Revoke session'}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
          isCurrent
            ? 'border-red-200 text-red-600 hover:bg-red-50'
            : 'border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50'
        }`}
      >
        {revoking ? <Loader size={13} className="animate-spin" /> : <LogOut size={13} />}
        {isCurrent ? 'Sign out' : 'Revoke'}
      </button>
    </div>
  );
}
