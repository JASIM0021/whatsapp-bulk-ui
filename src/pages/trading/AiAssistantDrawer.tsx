import React, { useState } from 'react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { StrategyDefinition } from './strategyDsl';
import { 
  Sparkles, GitBranch, RefreshCw, CheckCircle2, AlertTriangle, 
  Undo2, Check, X
} from 'lucide-react';

interface Props {
  strategy: StrategyDefinition;
  isOpen: boolean;
  mode: 'ai_generate' | 'ai_modify' | 'pinescript';
  onClose: () => void;
  onApplyStrategy: (updated: StrategyDefinition) => void;
}

export function AiAssistantDrawer({
  strategy,
  isOpen,
  mode,
  onClose,
  onApplyStrategy,
}: Props) {
  const [activeTab, setActiveTab] = useState<'ai_generate' | 'ai_modify' | 'pinescript'>(mode);
  const [promptText, setPromptText] = useState(
    'Create a sell strategy when the bearish order block is larger than the bullish block, there are at least two consecutive red candles within 20 points, set stop loss at the order block start, target 1:1, then move stop to breakeven and target 2:1, then trail the stop by 1R.'
  );
  const [modifyPrompt, setModifyPrompt] = useState(
    'Keep the order block calculation but only generate a sell signal when there are two consecutive bearish candles and the candle movement is less than 20 points.'
  );
  const [pineScriptCode, setPineScriptCode] = useState(`//@version=5
indicator("Volumized Order Blocks | Flux Charts", overlay=true)
lookback = input.int(5, "Swing Lookback")
volumeThreshold = input.float(1.2, "Volume Threshold")
showBreakers = input.bool(true, "Show Breaker Blocks")
`);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // AI Generation Result State
  const [aiResult, setAiResult] = useState<{
    strategy: StrategyDefinition;
    explanation: Record<string, string[]>;
    summaryText: string;
  } | null>(null);

  // AI Modify Diff State
  const [modifyDiff, setModifyDiff] = useState<{
    modifiedStrategy: StrategyDefinition;
    diff: { added: string[]; unchanged: string[]; modified: string[] };
    summaryText: string;
  } | null>(null);

  // PineScript Result State
  const [pineResult, setPineResult] = useState<{
    strategy: StrategyDefinition;
    extractedInputs: Record<string, any>;
    warnings: string[];
  } | null>(null);

  // History for Undo
  const [previousStrategy, setPreviousStrategy] = useState<StrategyDefinition | null>(null);

  React.useEffect(() => {
    setActiveTab(mode);
  }, [mode]);

  // 1. Generate Strategy with AI
  const handleGenerateAI = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch(API_ENDPOINTS.trading.strategyAiGenerateDSL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, target_symbol: strategy.asset_symbol }),
      });
      const data = await res.json();
      if (data.success && data.strategy) {
        setAiResult({
          strategy: data.strategy,
          explanation: data.explanation || {},
          summaryText: data.summary_text || 'Strategy generated successfully!',
        });
      } else {
        setErrorMsg('Failed to compile strategy prompt.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'AI request failed');
    } finally {
      setLoading(false);
    }
  };

  // 2. Modify Strategy with AI
  const handleModifyAI = async () => {
    if (!modifyPrompt.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch(API_ENDPOINTS.trading.strategyAiModifyDSL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: modifyPrompt, current_strategy: strategy }),
      });
      const data = await res.json();
      if (data.success && data.modified_strategy) {
        setPreviousStrategy({ ...strategy });
        setModifyDiff({
          modifiedStrategy: data.modified_strategy,
          diff: data.diff || { added: [], unchanged: [], modified: [] },
          summaryText: data.summary_text || 'Modifications analyzed successfully.',
        });
      } else {
        setErrorMsg('Failed to process modification request.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'AI modification request failed');
    } finally {
      setLoading(false);
    }
  };

  // 3. Import PineScript
  const handleImportPineScript = async () => {
    if (!pineScriptCode.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch(API_ENDPOINTS.trading.strategyPineScriptToDSL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinescript_code: pineScriptCode }),
      });
      const data = await res.json();
      if (data.success && data.strategy) {
        setPineResult({
          strategy: data.strategy,
          extractedInputs: data.extracted_inputs || {},
          warnings: data.warnings || [],
        });
      } else {
        setErrorMsg(data.detail || 'Failed to parse PineScript.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'PineScript parsing failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header with Sub-Tabs */}
        <div className="p-5 bg-gray-950 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">AI Strategy Engineer</h3>
              <p className="text-[11px] text-gray-400">Generate, modify, or import PineScript into visual blocks.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-800 bg-gray-950/50 px-6 font-mono text-xs">
          {[
            { id: 'ai_generate', label: '1. Describe with AI', icon: Sparkles },
            { id: 'ai_modify', label: '2. Ask AI to Modify', icon: RefreshCw },
            { id: 'pinescript', label: '3. Import PineScript', icon: GitBranch },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setErrorMsg('');
                }}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 font-bold transition-all ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-400 font-mono flex items-center gap-2">
              <AlertTriangle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: DESCRIBE WITH AI */}
          {activeTab === 'ai_generate' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold font-mono">
                  Describe Trading Strategy in Plain English
                </label>
                <textarea
                  rows={4}
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="e.g. Create a sell strategy when bearish order block is larger than bullish block, 2 consecutive red candles <= 20 points, SL at order block start, target 1R, 2R, 3R..."
                  className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 resize-none font-sans leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={loading || !promptText.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Compile Structured Strategy Blocks
              </button>

              {aiResult && (
                <div className="mt-4 p-5 rounded-2xl bg-gray-950 border border-gray-800 space-y-4 font-mono animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <strong className="text-white text-sm font-sans">{aiResult.strategy.name}</strong>
                    <span className="text-[10px] text-emerald-400 font-bold">✓ Structured DSL Ready</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                    <div className="space-y-1.5">
                      <span className="text-gray-500 uppercase font-bold text-[9px] block">ENTRY RULES</span>
                      {aiResult.explanation.entry?.map((e, i) => (
                        <div key={i} className="text-emerald-400">{e}</div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-gray-500 uppercase font-bold text-[9px] block">STOP LOSS</span>
                      {aiResult.explanation.stop_loss?.map((s, i) => (
                        <div key={i} className="text-rose-400">{s}</div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-gray-500 uppercase font-bold text-[9px] block">TAKE PROFIT LADDER</span>
                      {aiResult.explanation.take_profit?.map((t, i) => (
                        <div key={i} className="text-blue-400">{t}</div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-gray-500 uppercase font-bold text-[9px] block">TRADE MANAGEMENT</span>
                      {aiResult.explanation.trade_management?.map((m, i) => (
                        <div key={i} className="text-amber-400">{m}</div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onApplyStrategy(aiResult.strategy);
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                  >
                    <CheckCircle2 size={14} />
                    Load Strategy onto Visual Canvas
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ASK AI TO MODIFY */}
          {activeTab === 'ai_modify' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold font-mono">
                  Describe Desired Modifications to {strategy.name}
                </label>
                <textarea
                  rows={3}
                  value={modifyPrompt}
                  onChange={(e) => setModifyPrompt(e.target.value)}
                  placeholder="e.g. Keep order block calculation but only sell when 2 consecutive bearish candles and movement <= 15 points..."
                  className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 resize-none font-sans leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleModifyAI}
                disabled={loading || !modifyPrompt.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-800 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Analyze & Apply Modifications
              </button>

              {modifyDiff && (
                <div className="mt-4 p-5 rounded-2xl bg-gray-950 border border-gray-800 space-y-4 font-mono animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <strong className="text-white text-xs uppercase tracking-wider font-bold">Rule Modifications Diff</strong>
                    <span className="text-[10px] text-gray-500">v{strategy.version || 1} → v{(strategy.version || 1) + 1}</span>
                  </div>

                  {/* Added Changes */}
                  {modifyDiff.diff.added.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-emerald-400 font-bold text-[10px] uppercase">Added:</span>
                      {modifyDiff.diff.added.map((a, i) => (
                        <div key={i} className="text-emerald-300 pl-2">{a}</div>
                      ))}
                    </div>
                  )}

                  {/* Modified Changes */}
                  {modifyDiff.diff.modified.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-amber-400 font-bold text-[10px] uppercase">Modified:</span>
                      {modifyDiff.diff.modified.map((m, i) => (
                        <div key={i} className="text-amber-300 pl-2">{m}</div>
                      ))}
                    </div>
                  )}

                  {/* Unchanged Rules */}
                  {modifyDiff.diff.unchanged.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-gray-400 font-bold text-[10px] uppercase">Unchanged:</span>
                      {modifyDiff.diff.unchanged.map((u, i) => (
                        <div key={i} className="text-gray-500 pl-2">{u}</div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    {previousStrategy && (
                      <button
                        type="button"
                        onClick={() => {
                          onApplyStrategy(previousStrategy);
                          setModifyDiff(null);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Undo2 size={13} />
                        Undo
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onApplyStrategy(modifyDiff.modifiedStrategy);
                        onClose();
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                    >
                      <Check size={14} />
                      Apply Changes to Canvas
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: IMPORT PINESCRIPT */}
          {activeTab === 'pinescript' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold font-mono">
                  Paste Complete PineScript Indicator / Strategy Code
                </label>
                <textarea
                  rows={8}
                  value={pineScriptCode}
                  onChange={(e) => setPineScriptCode(e.target.value)}
                  placeholder="//@version=5..."
                  className="w-full p-3.5 bg-gray-950 border border-gray-800 rounded-2xl text-emerald-400 font-mono text-[11px] placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleImportPineScript}
                disabled={loading || !pineScriptCode.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <GitBranch size={14} />}
                Parse & Convert PineScript into Strategy DSL
              </button>

              {pineResult && (
                <div className="mt-4 p-5 rounded-2xl bg-gray-950 border border-gray-800 space-y-4 font-mono animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <strong className="text-white text-xs uppercase tracking-wider font-bold">Import Summary</strong>
                    <span className="text-[10px] text-blue-400">✓ PineScript Normalized</span>
                  </div>

                  {pineResult.warnings.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-400 text-[11px] space-y-1">
                      {pineResult.warnings.map((w, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <AlertTriangle size={12} className="shrink-0" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onApplyStrategy(pineResult.strategy);
                      onClose();
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                  >
                    <CheckCircle2 size={14} />
                    Load Imported Strategy Blocks
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
