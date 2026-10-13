import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, User, AlertTriangle, Clock, TrendingUp, Loader, RefreshCw, Filter, Check } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

interface DetectionLog {
  id: string;
  userId: string;
  contactPhone: string;
  detectionReason: string;
  confidenceScore: number;
  messageCount: number;
  details: string;
  handoffInitiated: boolean;
  handoffMessage?: string;
  timestamp: string;
}

interface DetectionStats {
  totalDetections: number;
  totalHandoffs: number;
  handoffRate: number;
  reasonBreakdown: { [key: string]: number };
  periodDays: number;
}

export function BotDetectionPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<DetectionLog[]>([]);
  const [stats, setStats] = useState<DetectionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setIsLoadingStats(true);
    try {
      // Fetch logs
      const logsRes = await apiFetch(`${API_ENDPOINTS.bot.detectionLogs}?limit=50&offset=0`);
      const logsJson = await logsRes.json();
      if (logsJson.success) {
        setLogs(logsJson.data || []);
      }

      // Fetch stats
      const statsRes = await apiFetch(`${API_ENDPOINTS.bot.detectionStats}?days=30`);
      const statsJson = await statsRes.json();
      if (statsJson.success) {
        setStats(statsJson.data);
      }
    } catch (error) {
      console.error('Failed to load detection data:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingStats(false);
    }
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'rate_limit':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'response_time':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'pattern_analysis':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'keyword_handoff':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'rate_limit':
        return 'Rate Limit';
      case 'response_time':
        return 'Response Time';
      case 'pattern_analysis':
        return 'Pattern Analysis';
      case 'keyword_handoff':
        return 'Keyword Handoff';
      default:
        return reason;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatConfidence = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/app')}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bot Detection Logs</h1>
              <p className="text-xs text-gray-500">Monitor AI bot detections and handoffs</p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Detections</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalDetections}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Handoffs</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalHandoffs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Handoff Rate</p>
                  <p className="text-2xl font-bold text-green-600">{stats.handoffRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Period</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.periodDays} days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reason Breakdown */}
        {stats && stats.reasonBreakdown && Object.keys(stats.reasonBreakdown).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-8">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              Detection Breakdown by Reason
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(stats.reasonBreakdown).map(([reason, count]) => (
                <div key={reason} className={`px-3 py-2 rounded-lg border ${getReasonColor(reason)}`}>
                  <p className="text-xs font-medium">{getReasonLabel(reason)}</p>
                  <p className="text-lg font-bold">{count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detection Logs Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Recent Detection Events</h2>
          </div>

          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader size={32} className="animate-spin text-indigo-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <Shield size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Detection Events Yet</h3>
              <p className="text-sm text-gray-500">
                Bot detection events will appear here once the AI identifies potential bots or handoff requests.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Phone</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Handoff</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-sm font-mono text-gray-900">{log.contactPhone}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getReasonColor(log.detectionReason)}`}>
                          {getReasonLabel(log.detectionReason)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-900 font-medium">{formatConfidence(log.confidenceScore)}</td>
                      <td className="px-5 py-4">
                        {log.handoffInitiated ? (
                          <span className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium">
                            <Check size={14} />
                            Yes
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Empty State - No Stats */}
        {!stats && !isLoadingStats && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <AlertTriangle size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Statistics Available</h3>
            <p className="text-sm text-gray-500">
              Statistics will be calculated once detection events are recorded.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
