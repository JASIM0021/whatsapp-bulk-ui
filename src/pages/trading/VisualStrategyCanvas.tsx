import React, { useState } from 'react';
import { 
  StrategyDefinition, ConditionRule, 
  STRATEGY_BUILDER_PALETTE, PaletteItem, StopLossType, MoveSLAction, 
  TakeProfitTarget, OperatorType
} from './strategyDsl';
import { validateStrategyDSL, ValidationResult } from './strategyValidator';
import { 
  Sliders, Plus, Trash2, 
  Sparkles, CheckCircle2, AlertTriangle, XCircle, 
  Layers, GitBranch, RefreshCw, Eye, CornerDownRight
} from 'lucide-react';

interface Props {
  strategy: StrategyDefinition;
  onChange: (updated: StrategyDefinition) => void;
  onSave: () => void;
  onOpenAi: () => void;
  onOpenPineScript: () => void;
  onRunBacktest: () => void;
  isSaving?: boolean;
}

export function VisualStrategyCanvas({
  strategy,
  onChange,
  onSave,
  onOpenAi,
  onOpenPineScript,
  onRunBacktest,
  isSaving = false,
}: Props) {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'ORDER BLOCK / SMART MONEY' | 'PRICE ACTION' | 'INDICATORS' | 'MARKET'>('ALL');
  const [showDiagramModal, setShowDiagramModal] = useState(false);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  const validation: ValidationResult = validateStrategyDSL(strategy);

  // Helper to add condition from palette
  const handleAddFromPalette = (item: PaletteItem) => {
    const newRule: ConditionRule = {
      type: 'rule',
      id: `c_${Date.now()}_${item.id}`,
      left: {
        kind: item.kind,
        field: item.field,
        indicator_id: item.kind === 'order_block' ? 'ind_ob_1' : undefined,
      },
      operator: item.defaultOperator,
      right: { ...item.defaultRight },
      description: item.name,
    };

    const updated = { ...strategy };
    updated.entry.condition_tree.conditions.push(newRule);
    onChange(updated);
  };

  // Helper to remove condition
  const handleRemoveCondition = (index: number) => {
    const updated = { ...strategy };
    updated.entry.condition_tree.conditions.splice(index, 1);
    onChange(updated);
  };

  // Helper to update condition rule
  const handleUpdateRule = (index: number, updatedRule: ConditionRule) => {
    const updated = { ...strategy };
    updated.entry.condition_tree.conditions[index] = updatedRule;
    onChange(updated);
  };

  // Helper to add Take Profit Target
  const handleAddTarget = () => {
    const targets = strategy.risk.take_profit.targets || [];
    const nextNum = targets.length + 1;
    const prevR = targets.length > 0 ? targets[targets.length - 1].rr_ratio : 0;
    const nextR = prevR + 1.0;

    let defaultAction: MoveSLAction = 'entry';
    if (nextNum === 2) defaultAction = 'plus_1r';
    else if (nextNum === 3) defaultAction = 'plus_2r';
    else if (nextNum >= 4) defaultAction = 'plus_3r';

    const newTarget: TakeProfitTarget = {
      id: `tp_${Date.now()}`,
      name: `Target ${nextNum}`,
      rr_ratio: nextR,
      close_qty_pct: 25.0,
      action_on_hit: { move_stop_loss_to: defaultAction },
    };

    const updated = { ...strategy };
    updated.risk.take_profit.targets.push(newTarget);
    
    // Add trade management rule
    updated.trade_management.push({
      id: `tm_tp_${nextNum}`,
      event: `tp${nextNum}_hit`,
      action: defaultAction === 'entry' ? 'move_sl_to_entry' : `move_sl_to_${nextNum - 1}r`,
      description: `Move SL to ${defaultAction === 'entry' ? 'Entry (0R)' : `+${nextNum - 1}R`} when Target ${nextNum} hits`,
    });

    onChange(updated);
  };

  // Helper to remove Take Profit Target
  const handleRemoveTarget = (index: number) => {
    const updated = { ...strategy };
    updated.risk.take_profit.targets.splice(index, 1);
    if (updated.trade_management.length > index) {
      updated.trade_management.splice(index, 1);
    }
    onChange(updated);
  };

  const filteredPalette = activeCategory === 'ALL'
    ? STRATEGY_BUILDER_PALETTE
    : STRATEGY_BUILDER_PALETTE.filter(p => p.category === activeCategory);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Creation Mode Selector Bar */}
      <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Visual Strategy Studio
            </span>
            <span className="text-[10px] text-gray-500 font-mono">v{strategy.version || 1}.0</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">{strategy.name}</h2>
          <p className="text-xs text-gray-400 max-w-xl">{strategy.description}</p>
        </div>

        {/* 3 Entry Point Actions & Save */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenAi}
            className="px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
          >
            <Sparkles size={13} className="text-purple-400" />
            <span>Describe with AI</span>
          </button>

          <button
            type="button"
            onClick={onOpenPineScript}
            className="px-3 py-1.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
          >
            <GitBranch size={13} className="text-blue-400" />
            <span>Import PineScript</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDiagramModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Eye size={13} className="text-gray-300" />
            <span>View Diagram</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-emerald-950/50"
          >
            {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            <span>Save Strategy</span>
          </button>
        </div>
      </div>

      {/* Validation Status Strip */}
      <div className={`p-3.5 rounded-xl border flex flex-wrap justify-between items-center gap-3 text-xs font-mono ${
        validation.valid 
          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
          : 'bg-rose-950/20 border-rose-500/20 text-rose-400'
      }`}>
        <div className="flex items-center gap-2">
          {validation.valid ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={16} className="text-rose-400 shrink-0" />}
          <div>
            <strong className="text-white uppercase tracking-wider font-bold">
              {validation.valid ? '✓ Strategy Valid' : '⚠️ Strategy Requires Attention'}
            </strong>
            <span className="ml-2 text-gray-400 text-[11px]">
              ({validation.stats.ruleCount} Rules | {validation.stats.targetCount} Targets | Anti-Lookahead Guaranteed)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowValidationDetails(!showValidationDetails)}
            className="text-[11px] underline text-gray-300 hover:text-white"
          >
            {showValidationDetails ? 'Hide Details' : 'View Rule Breakdown'}
          </button>
          
          <button
            type="button"
            onClick={onRunBacktest}
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            Backtest Strategy →
          </button>
        </div>
      </div>

      {/* Expandable Validation Details Drawer */}
      {showValidationDetails && (
        <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2 text-xs font-mono animate-fadeIn">
          {validation.errors.map((err, i) => (
            <p key={`err-${i}`} className="text-rose-400 flex items-center gap-2">
              <XCircle size={13} className="shrink-0" /> {err}
            </p>
          ))}
          {validation.warnings.map((warn, i) => (
            <p key={`warn-${i}`} className="text-amber-400 flex items-center gap-2">
              <AlertTriangle size={13} className="shrink-0" /> {warn}
            </p>
          ))}
          {validation.valid && (
            <p className="text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={13} /> All mathematical conditions and multi-target ladders passed anti-lookahead verification.
            </p>
          )}
        </div>
      )}

      {/* MAIN TWO-COLUMN VISUAL BUILDER CANVAS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (8 cols): Canvas Blocks (Entry, Stop Loss, Take Profit, Trade Management, Risk Sizing) */}
        <div className="xl:col-span-8 space-y-6">

          {/* SECTION 1: ENTRY SIGNAL CONDITION BUILDER */}
          <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-xl space-y-5">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">WHEN (Entry Conditions)</h3>
                  <p className="text-[11px] text-gray-400">Trigger market order when all conditions below evaluate to true.</p>
                </div>
              </div>

              {/* Side Selector (BUY vs SELL) */}
              <div className="flex items-center gap-1.5 p-1 bg-gray-900 rounded-xl border border-gray-800 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => onChange({ ...strategy, entry: { ...strategy.entry, side: 'BUY' } })}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    strategy.entry.side === 'BUY' 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...strategy, entry: { ...strategy.entry, side: 'SELL' } })}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    strategy.entry.side === 'SELL' 
                      ? 'bg-rose-600 text-white shadow-md' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  SELL / SHORT
                </button>
              </div>
            </div>

            {/* Visual Condition Cards Stack */}
            <div className="space-y-3">
              {strategy.entry.condition_tree.conditions.map((item, idx) => {
                if (item.type !== 'rule') return null;
                const rule = item as ConditionRule;
                return (
                  <React.Fragment key={rule.id || idx}>
                    {idx > 0 && (
                      <div className="flex items-center justify-center py-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-900 border border-gray-800 text-emerald-400 text-[10px] font-mono font-bold tracking-widest">
                          AND
                        </span>
                      </div>
                    )}

                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800/80 hover:border-gray-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md group">
                      <div className="flex items-center gap-3 flex-wrap flex-1">
                        {/* Left Operand Block */}
                        <div className="px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 font-mono text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                          <Layers size={13} className="text-emerald-400" />
                          <span>{rule.description || rule.left.field}</span>
                        </div>

                        {/* Operator Select */}
                        <select
                          value={rule.operator}
                          onChange={(e) => {
                            const updatedRule = { ...rule, operator: e.target.value as OperatorType };
                            handleUpdateRule(idx, updatedRule);
                          }}
                          className="px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500/50"
                        >
                          <option value=">">&gt; (Greater than)</option>
                          <option value="<">&lt; (Less than)</option>
                          <option value=">=">&gt;= (Greater or equal)</option>
                          <option value="<=">&lt;= (Less or equal)</option>
                          <option value="==">== (Equals)</option>
                          <option value="!=">!= (Not equal)</option>
                          <option value="crosses_above">Crosses Above</option>
                          <option value="crosses_below">Crosses Below</option>
                          <option value="exists">Exists</option>
                        </select>

                        {/* Right Operand Block / Value */}
                        {rule.right && (
                          <div className="px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 font-mono text-xs text-blue-300 font-semibold flex items-center gap-1.5">
                            {rule.right.kind === 'number' ? (
                              <input
                                type="number"
                                value={rule.right.value as number}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  const updatedRule = {
                                    ...rule,
                                    right: { ...rule.right!, value: val },
                                    description: `${rule.left.field} ${rule.operator} ${val}`,
                                  };
                                  handleUpdateRule(idx, updatedRule);
                                }}
                                className="w-16 bg-transparent text-white font-bold focus:outline-none text-center"
                              />
                            ) : (
                              <span>{rule.right.field || String(rule.right.value)}</span>
                            )}
                            {rule.right.unit && <span className="text-[10px] text-gray-500">{rule.right.unit}</span>}
                          </div>
                        )}
                      </div>

                      {/* Delete Rule Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(idx)}
                        className="opacity-60 hover:opacity-100 p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-all"
                        title="Delete Condition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Resulting THEN Action Card */}
            <div className="pt-3 border-t border-gray-800 flex justify-center items-center gap-3">
              <span className="text-gray-500 text-xs font-mono font-bold">THEN EXECUTE:</span>
              <div className={`px-4 py-1.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg ${
                strategy.entry.side === 'SELL' 
                  ? 'bg-rose-950/60 border border-rose-500/40 text-rose-300' 
                  : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
              }`}>
                <span>{strategy.entry.side} ORDER</span>
              </div>
            </div>
          </div>

          {/* SECTION 2: VISUAL STOP LOSS BUILDER */}
          <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">STOP LOSS (Risk Boundary)</h3>
                  <p className="text-[11px] text-gray-400">Select structural reference level or dynamic buffer.</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-900 text-gray-400 font-mono border border-gray-800">
                1R Base Anchor
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                  Stop Loss Type
                </label>
                <select
                  value={strategy.risk.stop_loss.type}
                  onChange={(e) => {
                    const updated = { ...strategy };
                    updated.risk.stop_loss.type = e.target.value as StopLossType;
                    onChange(updated);
                  }}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white font-semibold focus:outline-none focus:border-rose-500/50"
                >
                  <option value="order_block_start">Order Block Start</option>
                  <option value="order_block_top">Order Block Top</option>
                  <option value="order_block_bottom">Order Block Bottom</option>
                  <option value="prev_swing_high">Previous Swing High</option>
                  <option value="prev_swing_low">Previous Swing Low</option>
                  <option value="prev_candle_high">Previous Candle High</option>
                  <option value="prev_candle_low">Previous Candle Low</option>
                  <option value="fixed_points">Fixed Points</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="atr_multiple">ATR Multiple</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                  Buffer (Points)
                </label>
                <input
                  type="number"
                  value={strategy.risk.stop_loss.buffer_points}
                  onChange={(e) => {
                    const updated = { ...strategy };
                    updated.risk.stop_loss.buffer_points = Number(e.target.value);
                    onChange(updated);
                  }}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white font-bold focus:outline-none focus:border-rose-500/50"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                  Buffer (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={strategy.risk.stop_loss.buffer_pct}
                  onChange={(e) => {
                    const updated = { ...strategy };
                    updated.risk.stop_loss.buffer_pct = Number(e.target.value);
                    onChange(updated);
                  }}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white font-bold focus:outline-none focus:border-rose-500/50"
                  placeholder="0.0"
                />
              </div>
            </div>

            {/* Visual SL Representation Diagram */}
            <div className="bg-gray-900/80 p-3.5 rounded-xl border border-gray-800/80 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-gray-400">Anchor Level:</span>
                <strong className="text-white uppercase">{strategy.risk.stop_loss.type.replace(/_/g, ' ')}</strong>
                {strategy.risk.stop_loss.buffer_points > 0 && (
                  <span className="text-rose-400 font-semibold">(+{strategy.risk.stop_loss.buffer_points} pts buffer)</span>
                )}
              </div>
              <span className="text-gray-500 text-[11px]">Initial Risk = |Entry - SL|</span>
            </div>
          </div>

          {/* SECTION 3: VISUAL TAKE PROFIT & PROGRESSIVE R:R SYSTEM */}
          <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider">TAKE PROFIT & PROGRESSIVE R:R LADDER</h3>
                  <p className="text-[11px] text-gray-400">Multi-target sequential scale-out with dynamic Stop Loss adjustments.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddTarget}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Plus size={13} />
                <span>+ ADD TARGET</span>
              </button>
            </div>

            {/* Target Ladder Cards Stack */}
            <div className="space-y-3">
              {strategy.risk.take_profit.targets.map((target, idx) => (
                <div 
                  key={target.id || idx}
                  className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-950 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <strong className="text-white">{target.name}</strong>
                      <span className="ml-2 text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                        +{target.rr_ratio}R
                      </span>
                    </div>
                  </div>

                  {/* Sizing & After Hit Action Controls */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-500 uppercase">R:R</span>
                      <input
                        type="number"
                        step="0.5"
                        value={target.rr_ratio}
                        onChange={(e) => {
                          const updated = { ...strategy };
                          updated.risk.take_profit.targets[idx].rr_ratio = Number(e.target.value);
                          onChange(updated);
                        }}
                        className="w-16 px-2 py-1 bg-gray-950 border border-gray-800 rounded-lg text-white font-bold text-center focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-500 uppercase">After Hit:</span>
                      <select
                        value={target.action_on_hit.move_stop_loss_to}
                        onChange={(e) => {
                          const updated = { ...strategy };
                          const act = e.target.value as MoveSLAction;
                          updated.risk.take_profit.targets[idx].action_on_hit.move_stop_loss_to = act;
                          onChange(updated);
                        }}
                        className="px-2.5 py-1 bg-gray-950 border border-gray-800 rounded-lg text-blue-400 font-bold text-xs focus:outline-none"
                      >
                        <option value="entry">Move SL to Entry (0R)</option>
                        <option value="plus_1r">Move SL to +1R</option>
                        <option value="plus_2r">Move SL to +2R</option>
                        <option value="plus_3r">Move SL to +3R</option>
                        <option value="none">Keep Existing SL</option>
                      </select>
                    </div>

                    {strategy.risk.take_profit.targets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTarget(idx)}
                        className="text-gray-500 hover:text-rose-400 p-1 rounded transition-colors"
                        title="Remove Target"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Ladder options toggles */}
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-gray-400 font-mono">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={strategy.risk.take_profit.continue_until_final_target}
                  onChange={(e) => {
                    const updated = { ...strategy };
                    updated.risk.take_profit.continue_until_final_target = e.target.checked;
                    onChange(updated);
                  }}
                  className="rounded bg-gray-900 border-gray-700 text-emerald-500 focus:ring-0"
                />
                <span>Continue until final target</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={strategy.risk.take_profit.close_remaining_at_final}
                  onChange={(e) => {
                    const updated = { ...strategy };
                    updated.risk.take_profit.close_remaining_at_final = e.target.checked;
                    onChange(updated);
                  }}
                  className="rounded bg-gray-900 border-gray-700 text-emerald-500 focus:ring-0"
                />
                <span>Close remaining position at final target</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={strategy.risk.take_profit.enable_trailing_stop}
                  onChange={(e) => {
                    const updated = { ...strategy };
                    updated.risk.take_profit.enable_trailing_stop = e.target.checked;
                    onChange(updated);
                  }}
                  className="rounded bg-gray-900 border-gray-700 text-emerald-500 focus:ring-0"
                />
                <span>Enable trailing stop</span>
              </label>
            </div>
          </div>

          {/* SECTION 4: TRADE MANAGEMENT TIMELINE */}
          <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-800 pb-3">
              <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                4
              </span>
              <div>
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">TRADE MANAGEMENT TIMELINE</h3>
                <p className="text-[11px] text-gray-400">Step-by-step visual execution flow for every order.</p>
              </div>
            </div>

            {/* Stepper Flowchart */}
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-800 font-mono text-xs">
              <div className="relative flex items-center gap-3">
                <span className="absolute -left-6 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-gray-950" />
                <div className="bg-gray-900 p-2.5 rounded-xl border border-gray-800 flex-1 flex justify-between items-center">
                  <span className="font-bold text-white">{strategy.entry.side} ENTRY TRIGGERED</span>
                  <span className="text-gray-400 text-[11px]">SL = Initial ({strategy.risk.stop_loss.type.replace(/_/g, ' ')})</span>
                </div>
              </div>

              {strategy.risk.take_profit.targets.map((t, idx) => (
                <div key={idx} className="relative flex items-center gap-3">
                  <span className="absolute -left-6 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-gray-950" />
                  <div className="bg-gray-900 p-2.5 rounded-xl border border-gray-800 flex-1 flex justify-between items-center">
                    <span className="text-blue-400 font-bold">{t.name} HIT (+{t.rr_ratio}R)</span>
                    <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-semibold">
                      <CornerDownRight size={12} />
                      SL Moved → {t.action_on_hit.move_stop_loss_to === 'entry' ? 'Entry (0R)' : t.action_on_hit.move_stop_loss_to.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: RISK MANAGEMENT & POSITION SIZING */}
          <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-gray-800 pb-3">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                5
              </span>
              <div>
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">RISK MANAGEMENT & SIZING</h3>
                <p className="text-[11px] text-gray-400">Position sizing calculated dynamically from Entry - Stop Loss.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                  Sizing Method
                </label>
                <select
                  value={strategy.risk.sizing_method}
                  onChange={(e) => {
                    const updated = { ...strategy };
                    updated.risk.sizing_method = e.target.value as any;
                    onChange(updated);
                  }}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white font-semibold focus:outline-none"
                >
                  <option value="risk_pct">Risk % per Trade</option>
                  <option value="fixed_qty">Fixed Quantity</option>
                  <option value="pct_capital">% of Capital</option>
                  <option value="fixed_capital">Fixed Capital</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                  Risk Value ({strategy.risk.sizing_method === 'risk_pct' ? '%' : 'Units'})
                </label>
                <input
                  type="number"
                  value={strategy.risk.sizing_value}
                  onChange={(e) => {
                    const updated = { ...strategy };
                    updated.risk.sizing_value = Number(e.target.value);
                    onChange(updated);
                  }}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                  Initial Capital (₹)
                </label>
                <input
                  type="number"
                  value={strategy.risk.capital}
                  onChange={(e) => {
                    const updated = { ...strategy };
                    updated.risk.capital = Number(e.target.value);
                    onChange(updated);
                  }}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white font-bold focus:outline-none"
                />
              </div>
            </div>

            {/* Position Sizing Interactive Formula Preview */}
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 font-mono text-xs space-y-2">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Dynamic Position Size Calculation:</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-[11px]">
                <div>
                  <span className="text-gray-400 block">Capital:</span>
                  <strong className="text-white">₹{validation.stats.sizingSummary.capital.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Max Risk ({strategy.risk.sizing_value}%):</span>
                  <strong className="text-rose-400">₹{validation.stats.sizingSummary.maxRisk.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Sample Risk/Unit:</span>
                  <strong className="text-amber-400">₹{validation.stats.sizingSummary.sampleRiskPerUnit.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-gray-400 block">Calculated Size:</span>
                  <strong className="text-emerald-400 font-bold">{validation.stats.sizingSummary.samplePositionSize} Units</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Palette of Modular Blocks */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 shadow-xl space-y-4 sticky top-6">
            <div className="border-b border-gray-800 pb-3">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={14} className="text-emerald-400" />
                Block Palette
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Click any block to add it directly to your entry conditions.</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'ORDER BLOCK / SMART MONEY', 'PRICE ACTION', 'INDICATORS', 'MARKET'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat as any)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all ${
                    activeCategory === cat 
                      ? 'bg-emerald-600 text-white shadow' 
                      : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat === 'ORDER BLOCK / SMART MONEY' ? 'Smart Money' : cat}
                </button>
              ))}
            </div>

            {/* Blocks List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredPalette.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAddFromPalette(p)}
                  className="w-full text-left p-3 rounded-xl bg-gray-900 hover:bg-gray-850 border border-gray-800 hover:border-emerald-500/40 transition-all group flex items-center justify-between"
                >
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-mono font-bold block mb-0.5">
                      {p.category}
                    </span>
                    <strong className="text-white text-xs block group-hover:text-emerald-300 transition-colors">
                      {p.name}
                    </strong>
                    <span className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                      {p.description}
                    </span>
                  </div>
                  <Plus size={16} className="text-gray-500 group-hover:text-emerald-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Live Strategy Diagram Flowchart Modal */}
      {showDiagramModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-emerald-400" />
                Strategy Execution Flowchart
              </h3>
              <button
                type="button"
                onClick={() => setShowDiagramModal(false)}
                className="text-gray-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-950 p-6 rounded-xl border border-gray-800 text-center font-mono space-y-3">
              {strategy.entry.condition_tree.conditions.map((c, i) => (
                <React.Fragment key={i}>
                  <div className="inline-block px-4 py-2 rounded-xl bg-gray-900 border border-emerald-500/30 text-emerald-300 text-xs font-bold shadow">
                    {(c as ConditionRule).description || (c as ConditionRule).left?.field}
                  </div>
                  <div className="text-gray-600 font-bold">↓</div>
                </React.Fragment>
              ))}

              <div className="inline-block px-6 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm shadow-lg">
                {strategy.entry.side} ENTRY
              </div>
              <div className="text-gray-600 font-bold">↓</div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold">
                  SL = {strategy.risk.stop_loss.type.replace(/_/g, ' ')}
                </div>
                <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-bold">
                  TP1 = +{strategy.risk.take_profit.targets[0]?.rr_ratio || 1}R
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDiagramModal(false)}
              className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold"
            >
              Close Flowchart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
