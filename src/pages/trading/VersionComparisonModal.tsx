import { useState, useEffect } from 'react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { StrategyDefinition } from './strategyDsl';
import { History, RefreshCw, Undo2, CheckCircle2, X } from 'lucide-react';

interface VersionDoc {
  _id: string;
  strategy_id: string;
  version: number;
  name: string;
  strategy_dsl: StrategyDefinition;
  changelog: string;
  created_at: string;
}

interface Props {
  strategyId: string;
  currentStrategy?: StrategyDefinition;
  isOpen: boolean;
  onClose: () => void;
  onRestoreVersion: (strategy: StrategyDefinition) => void;
}

export function VersionComparisonModal({
  strategyId,
  isOpen,
  onClose,
  onRestoreVersion,
}: Props) {
  const [versions, setVersions] = useState<VersionDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<VersionDoc | null>(null);

  useEffect(() => {
    if (isOpen && strategyId) {
      fetchVersions();
    }
  }, [isOpen, strategyId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.trading.strategyVersions(strategyId));
      const data = await res.json();
      if (data.success && data.versions) {
        setVersions(data.versions);
        if (data.versions.length > 0) {
          setSelectedVersion(data.versions[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch versions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl p-6 space-y-6 flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <History size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Strategy Version History & Comparison</h3>
              <p className="text-[11px] text-gray-400">Track and restore AI modifications, parameter tweaks, and rule revisions.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden font-mono text-xs">
          
          {/* Versions List */}
          <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 space-y-3 overflow-y-auto max-h-[500px]">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Snapshots</span>
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <RefreshCw size={16} className="animate-spin mx-auto mb-2 text-emerald-400" />
                Loading history...
              </div>
            ) : versions.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-[11px]">
                No previous snapshots yet. Saving changes will automatically record version milestones.
              </div>
            ) : (
              versions.map((v) => (
                <button
                  key={v._id}
                  type="button"
                  onClick={() => setSelectedVersion(v)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedVersion?._id === v._id
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-white'
                      : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-850'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <strong className="text-white">v{v.version}.0</strong>
                    <span className="text-[10px] text-gray-500">
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{v.changelog || 'Version snapshot'}</p>
                </button>
              ))
            )}
          </div>

          {/* Version Details & Comparison */}
          <div className="md:col-span-2 bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-4 overflow-y-auto max-h-[500px]">
            {selectedVersion ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-gray-800 pb-3">
                  <div>
                    <h4 className="text-white font-bold text-sm">v{selectedVersion.version}.0: {selectedVersion.name}</h4>
                    <p className="text-[10px] text-emerald-400 mt-0.5">{selectedVersion.changelog}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onRestoreVersion(selectedVersion.strategy_dsl);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <Undo2 size={13} />
                    Restore This Version
                  </button>
                </div>

                {/* Rules List Preview */}
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Entry Conditions ({selectedVersion.strategy_dsl.entry?.condition_tree?.conditions?.length || 0} Rules):</span>
                  {selectedVersion.strategy_dsl.entry?.condition_tree?.conditions?.map((c: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 text-[11px] flex items-center gap-2">
                      <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                      <span>{c.description || c.left?.field}</span>
                    </div>
                  ))}
                </div>

                {/* Stop Loss & Take Profit Specs */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
                  <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                    <span className="text-gray-500 uppercase text-[9px] font-bold block">Stop Loss Rule</span>
                    <strong className="text-rose-400 uppercase mt-0.5 block">
                      {selectedVersion.strategy_dsl.risk?.stop_loss?.type?.replace(/_/g, ' ') || 'Order Block Start'}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                    <span className="text-gray-500 uppercase text-[9px] font-bold block">Take Profit Targets</span>
                    <strong className="text-blue-400 mt-0.5 block">
                      {selectedVersion.strategy_dsl.risk?.take_profit?.targets?.length || 0} Sequential Targets
                    </strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                Select a version from the left panel to inspect details.
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs font-mono"
        >
          Close Version History
        </button>
      </div>
    </div>
  );
}
