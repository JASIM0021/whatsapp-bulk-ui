import { useState, useEffect } from 'react';
import { API_ENDPOINTS, apiFetch } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

interface Session {
  id: string;
  userId: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

export default function SessionManager() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [token]);

  const fetchSessions = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.auth.sessions);
      const data = await res.json();
      if (data.success) {
        setSessions(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch sessions');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('Are you sure you want to logout from all devices? You will remain logged in on this device.')) {
      return;
    }

    setLoggingOutAll(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.auth.logoutAll, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Logged out from all devices successfully');
        fetchSessions(); // Refresh the session list
      } else {
        setError(data.error || 'Failed to logout from all devices');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoggingOutAll(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCurrentSession = (session: Session) => {
    // We can't directly compare tokens since they're not exposed in the session list
    // For now, we'll assume the first session is the current one
    return sessions.indexOf(session) === 0;
  };

  const getDeviceIcon = (deviceInfo: string) => {
    switch (deviceInfo) {
      case 'Mobile Device':
        return '📱';
      case 'Tablet':
        return '📱';
      case 'Windows PC':
        return '💻';
      case 'Mac':
        return '🍎';
      case 'Linux PC':
        return '🐧';
      default:
        return '🖥️';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Active Sessions</h1>
            <p className="text-gray-600 mt-1">
              Manage your active sessions across different devices
            </p>
          </div>
          <button
            onClick={handleLogoutAll}
            disabled={loggingOutAll || sessions.length <= 1}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loggingOutAll ? 'Logging out...' : 'Logout All Devices'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No active sessions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">
                      {getDeviceIcon(session.deviceInfo)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {session.deviceInfo}
                        {isCurrentSession(session) && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>IP: {session.ipAddress}</div>
                        <div className="text-xs mt-1">
                          Last active: {formatDate(session.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>Expires: {formatDate(session.expiresAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="text-blue-600 mr-3">ℹ️</div>
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">About Sessions</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Sessions automatically expire after 7 days</li>
                <li>Use "Logout All Devices" to revoke access from all other devices</li>
                <li>Your current session will remain active when using "Logout All"</li>
                <li>Each session shows the device type and IP address</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}