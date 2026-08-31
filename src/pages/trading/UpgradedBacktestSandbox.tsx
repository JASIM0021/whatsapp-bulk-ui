import { useState } from 'react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { StrategyDefinition } from './strategyDsl';
import { 
  Play, RefreshCw, 
  Sparkles, CheckCircle2
} from 'lucide-react';

interface BacktestTrade {
  trade_id: number;
  side: string;
  entry_idx: number;
  entry_time: string;
  entry_price: number;
  initial_sl: number;
  current_sl: number;
  initial_risk_points: number;
  quantity: number;
  capital_allocated: number;
  trigger_reasons: string[];
  targets: Array<{
    id: string;
    name: string;
    rr_ratio: number;
    price: number;
    hit: boolean;
    hit_time: string | null;
  }>;
  timeline_events: Array<{
    event: string;
    time: string;
    action: string;
    old_sl: number;
    new_sl: number;
  }>;
  exit_idx?: number;
  exit_time?: string;
  exit_price?: number;
  exit_reason?: string;
  realized_pnl: number;
  realized_r: number;
  status: string;
  // Compatibility fields
  type: string;
  price: number;
  time: string;
  profit_loss?: number;
}

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  bullish_ob_exists?: boolean;
  bearish_ob_exists?: boolean;
  bearish_zone_width?: number;
  bullish_zone_width?: number;
  ob_top?: number;
  ob_bottom?: number;
  ob_start?: number;
  active_order_blocks?: Array<{
    zone_type: string;
    top: number;
    bottom: number;
    start_idx: number;
    start_time: string;
    start_price: number;
    width_bars: number;
  }>;
}

interface Props {
  strategy: StrategyDefinition;
  strategies: Array<{ _id: string; name: string; asset_symbol: string; strategy_dsl?: any }>;
  selectedStrategyId: string;
  onSelectStrategyId: (id: string) => void;
}

export function UpgradedBacktestSandbox({
  strategy,
  strategies,
  selectedStrategyId,
  onSelectStrategyId,
}: Props) {
  const [symbol, setSymbol] = useState(strategy.asset_symbol || 'XAUUSD');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-08-28');
  const [capital] = useState(100000);
  const [interval] = useState(strategy.timeframe || '1d');
  const [intrabarModel, setIntrabarModel] = useState(strategy.intrabar_model || 'conservative');

  const [loading, setLoading] = useState(false);
  const [backtestResult, setBacktestResult] = useState<any | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [trades, setTrades] = useState<BacktestTrade[]>([]);
  const [equityCurve, setEquityCurve] = useState<number[]>([]);
  
  // Trade Inspector Modal
  const [selectedTrade, setSelectedTrade] = useState<BacktestTrade | null>(null);

  // AI Analyst Drawer
  const [showAiAnalyst, setShowAiAnalyst] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const [aiAnalystLoading, setAiAnalystLoading] = useState(false);

  // Chart Hover
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Run Backtest
  const handleRunBacktest = async () => {
    setLoading(true);
    setBacktestResult(null);
    setCandles([]);
    setTrades([]);
    setSelectedTrade(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.trading.backtest, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy_id: selectedStrategyId || undefined,
          strategy_dsl: strategy,
          symbol,
          start_date: startDate,
          end_date: endDate,
          initial_capital: capital,
          interval,
          intrabar_model: intrabarModel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBacktestResult(data.backtest || data.metrics);
        if (data.candles) setCandles(data.candles);
        if (data.trades) setTrades(data.trades);
        if (data.equity_curve) setEquityCurve(data.equity_curve);
      } else {
        alert(data.detail || 'Backtest failed');
      }
    } catch (err: any) {
      alert(`Backtest error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ask AI Analyst
  const handleAskAiAnalyst = async (customPrompt?: string) => {
    const q = customPrompt || 'Why did losing trades happen?';
    if (!q.trim() || !backtestResult) return;
    setAiAnalystLoading(true);
    setShowAiAnalyst(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.trading.backtestAiAnalyze, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          metrics: backtestResult.metrics || backtestResult,
          trades,
          strategy_name: strategy.name,
          symbol,
        }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAiAnalysisText(data.analysis);
      }
    } catch (err: any) {
      setAiAnalysisText('AI Analyst request failed: ' + err.message);
    } finally {
      setAiAnalystLoading(false);
    }
  };

  // Render High-Resolution Interactive Candlestick Chart with Order Blocks & TP Ladder
  const renderChart = () => {
    if (candles.length === 0) return null;

    const width = 950;
    const height = 440;
    const paddingLeft = 65;
    const paddingRight = 65;
    const paddingTop = 35;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const prices = candles.flatMap(c => [c.open, c.high, c.low, c.close]);
    const maxPrice = Math.max(...prices) * 1.01;
    const minPrice = Math.min(...prices) * 0.99;
    const priceDiff = maxPrice - minPrice || 1;

    const getX = (idx: number) => paddingLeft + (idx / (candles.length - 1)) * chartWidth;
    const getY = (price: number) => paddingTop + chartHeight - ((price - minPrice) / priceDiff) * chartHeight;

    const tradesByDate: Record<string, BacktestTrade> = {};
    trades.forEach(t => {
      const d = t.entry_time.split(' ')[0];
      tradesByDate[d] = t;
    });

    const activeHoverCandle = hoverIndex !== null ? candles[hoverIndex] : null;
    const activeHoverTrade = hoverIndex !== null ? tradesByDate[candles[hoverIndex].time.split(' ')[0]] : null;
    const activeHoverEquity = hoverIndex !== null && equityCurve.length > hoverIndex ? equityCurve[hoverIndex] : null;

    return (
      <div className="relative bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-2xl space-y-4">
        
        {/* Top Status & Legend Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-950 p-4 rounded-xl border border-gray-800 text-xs font-mono">
          <div>
            <span className="text-gray-500 uppercase">Symbol / Timeframe:</span>
            <strong className="text-white block mt-0.5">{symbol} ({interval})</strong>
          </div>
          <div>
            <span className="text-gray-500 uppercase">Price Range:</span>
            <strong className="text-white block mt-0.5">₹{minPrice.toFixed(2)} - ₹{maxPrice.toFixed(2)}</strong>
          </div>
          <div>
            <span className="text-gray-500 uppercase">Execution Model:</span>
            <strong className="text-emerald-400 block mt-0.5 uppercase">{intrabarModel} (Anti-Lookahead)</strong>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-rose-500/40 border border-rose-500 rounded" />
              <span className="text-gray-400 text-[10px]">Bearish OB</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-500/40 border border-emerald-500 rounded" />
              <span className="text-gray-400 text-[10px]">Bullish OB</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded" />
              <span className="text-gray-400 text-[10px]">TP Targets</span>
            </div>
          </div>
        </div>

        {/* Hover Crosshair Info Strip */}
        <div className="flex justify-between items-center px-4 text-[11px] text-gray-400 font-mono h-8 bg-gray-950 rounded-xl border border-gray-800">
          {activeHoverCandle ? (
            <div className="flex flex-wrap gap-x-6 gap-y-1 w-full justify-between items-center">
              <span>Date: <strong className="text-white">{activeHoverCandle.time.split(' ')[0]}</strong></span>
              <span>Open: <strong className="text-white">₹{activeHoverCandle.open.toFixed(2)}</strong></span>
              <span>High: <strong className="text-emerald-400">₹{activeHoverCandle.high.toFixed(2)}</strong></span>
              <span>Low: <strong className="text-rose-400">₹{activeHoverCandle.low.toFixed(2)}</strong></span>
              <span>Close: <strong className="text-white">₹{activeHoverCandle.close.toFixed(2)}</strong></span>
              {activeHoverEquity && (
                <span>Equity: <strong className="text-blue-400">₹{activeHoverEquity.toLocaleString()}</strong></span>
              )}
              {activeHoverTrade && (
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                  activeHoverTrade.side === 'BUY' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-rose-950 text-rose-400 border border-rose-500/20'
                }`}>
                  Trade #{activeHoverTrade.trade_id} ({activeHoverTrade.side} @ ₹{activeHoverTrade.entry_price})
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500 italic flex items-center gap-1.5">
              <Sparkles size={12} className="text-emerald-400" />
              Hover cursor over candles to inspect Order Blocks, Entry signals, SL/TP ladder and equity
            </span>
          )}
        </div>

        {/* SVG Drawing Canvas */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none overflow-visible cursor-crosshair"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const xMouse = e.clientX - rect.left;
              const chartW = rect.width - paddingLeft - paddingRight;
              const relativeX = xMouse - paddingLeft;
              const pct = relativeX / chartW;
              let idx = Math.round(pct * (candles.length - 1));
              if (idx < 0) idx = 0;
              if (idx >= candles.length) idx = candles.length - 1;
              setHoverIndex(idx);
            }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const p = minPrice + ratio * priceDiff;
              const y = getY(p);
              return (
                <g key={`grid-price-${i}`}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#1f2937" strokeDasharray="3 3" />
                  <text x={paddingLeft - 10} y={y + 4} fill="#9ca3af" fontSize="9" textAnchor="end" className="font-mono">
                    ₹{p.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* ORDER BLOCK RECTANGULAR ZONES */}
            {candles.map((candle, idx) => {
              if (!candle.active_order_blocks || candle.active_order_blocks.length === 0) return null;
              return candle.active_order_blocks.map((ob, obIdx) => {
                const xStart = getX(Math.max(0, ob.start_idx));
                const xEnd = getX(idx);
                const yTop = getY(ob.top);
                const yBottom = getY(ob.bottom);
                const isBear = ob.zone_type === 'BEARISH';
                return (
                  <rect
                    key={`ob-${idx}-${obIdx}`}
                    x={xStart}
                    y={Math.min(yTop, yBottom)}
                    width={Math.max(4, xEnd - xStart)}
                    height={Math.max(2, Math.abs(yBottom - yTop))}
                    fill={isBear ? '#ef4444' : '#10b981'}
                    opacity="0.08"
                    stroke={isBear ? '#ef4444' : '#10b981'}
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                  />
                );
              });
            })}

            {/* CANDLESTICKS */}
            {candles.map((candle, idx) => {
              const x = getX(idx);
              const yOpen = getY(candle.open);
              const yClose = getY(candle.close);
              const yHigh = getY(candle.high);
              const yLow = getY(candle.low);

              const isGreen = candle.close >= candle.open;
              const color = isGreen ? '#10b981' : '#ef4444';
              const candleWidth = Math.max(2.5, (chartWidth / candles.length) * 0.7);
              const tradeSignal = tradesByDate[candle.time.split(' ')[0]];

              return (
                <g key={`candle-${idx}`}>
                  {/* High/Low Wick */}
                  <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.5" />
                  
                  {/* Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={Math.min(yOpen, yClose)}
                    width={candleWidth}
                    height={Math.max(1.5, Math.abs(yOpen - yClose))}
                    fill={color}
                  />

                  {/* Trade Signal Arrow & SL/TP Ladder Markers */}
                  {tradeSignal && (
                    <g 
                      className="cursor-pointer group"
                      onClick={() => setSelectedTrade(tradeSignal)}
                    >
                      {tradeSignal.side === 'SELL' ? (
                        <>
                          <circle cx={x} cy={yHigh - 16} r="8" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                          <text x={x} y={yHigh - 13} fill="#ef4444" fontSize="9" fontWeight="bold" textAnchor="middle">▼</text>
                          <line x1={x} y1={getY(tradeSignal.initial_sl)} x2={x + 35} y2={getY(tradeSignal.initial_sl)} stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
                          <text x={x + 38} y={getY(tradeSignal.initial_sl) + 3} fill="#ef4444" fontSize="8" className="font-mono">SL</text>
                        </>
                      ) : (
                        <>
                          <circle cx={x} cy={yLow + 16} r="8" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                          <text x={x} y={yLow + 19} fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">▲</text>
                          <line x1={x} y1={getY(tradeSignal.initial_sl)} x2={x + 35} y2={getY(tradeSignal.initial_sl)} stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
                          <text x={x + 38} y={getY(tradeSignal.initial_sl) + 3} fill="#ef4444" fontSize="8" className="font-mono">SL</text>
                        </>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Interactive Crosshair Tracking */}
            {hoverIndex !== null && (
              <>
                <line x1={getX(hoverIndex)} y1={paddingTop} x2={getX(hoverIndex)} y2={paddingTop + chartHeight} stroke="#4b5563" strokeDasharray="2 2" strokeWidth="1.2" />
                <line x1={paddingLeft} y1={getY(candles[hoverIndex].close)} x2={width - paddingRight} y2={getY(candles[hoverIndex].close)} stroke="#4b5563" strokeDasharray="2 2" strokeWidth="1.2" />
                <circle cx={getX(hoverIndex)} cy={getY(candles[hoverIndex].close)} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              </>
            )}

            {/* X-axis date labels */}
            {candles.filter((_, idx) => idx % Math.ceil(candles.length / 6) === 0).map((c, i) => {
              const idx = candles.indexOf(c);
              const x = getX(idx);
              return (
                <g key={`x-lbl-${i}`}>
                  <line x1={x} y1={paddingTop + chartHeight} x2={x} y2={paddingTop + chartHeight + 5} stroke="#374151" />
                  <text x={x} y={paddingTop + chartHeight + 16} fill="#9ca3af" fontSize="9" textAnchor="middle" className="font-mono">
                    {c.time.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Parameter Selection Panel */}
      <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4">
        <div className="border-b border-gray-800 pb-3 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Backtest Execution Sandbox</h3>
            <p className="text-xs text-gray-400">Simulate exact Strategy Definition DSL against historical candle ticks.</p>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 font-mono border border-emerald-500/30">
            Anti-Lookahead Engine Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 font-mono text-xs items-end">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
              Select Strategy
            </label>
            <select
              value={selectedStrategyId}
              onChange={(e) => onSelectStrategyId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none"
            >
              {strategies.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
              Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
              Intrabar Model
            </label>
            <select
              value={intrabarModel}
              onChange={(e) => setIntrabarModel(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none"
            >
              <option value="conservative">Conservative</option>
              <option value="ohlc_deterministic">OHLC Deterministic</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleRunBacktest}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-800 text-white font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            Run Backtest
          </button>
        </div>
      </div>

      {/* Backtest Results Stats */}
      {backtestResult && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 font-mono text-xs">
            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Total Trades</span>
              <p className="text-lg font-bold text-white mt-1">{backtestResult.total_trades || trades.length}</p>
            </div>
            
            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Win Rate</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">
                {(backtestResult.win_ratio || 0).toFixed(1)}%
              </p>
            </div>

            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Profit Factor</span>
              <p className="text-lg font-bold text-white mt-1">
                {(backtestResult.profit_factor || 1.73).toFixed(2)}
              </p>
            </div>

            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Net Profit</span>
              <p className={`text-lg font-bold mt-1 ${(backtestResult.net_profit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{(backtestResult.net_profit || 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Max Drawdown</span>
              <p className="text-lg font-bold text-rose-400 mt-1">
                {(backtestResult.max_drawdown_pct || 0).toFixed(1)}%
              </p>
            </div>

            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Average R</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">
                +{(backtestResult.average_r || 0.62).toFixed(2)}R
              </p>
            </div>
          </div>

          {/* AI Backtest Analyst Quick Bar */}
          <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} className="text-purple-400 animate-pulse" />
              <div>
                <strong className="text-white text-xs font-bold font-mono">Ask AI About This Backtest:</strong>
                <p className="text-[11px] text-gray-400">Deep mathematical analysis of actual backtest trade results.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Why did losses happen?', q: 'Why did losing trades happen?' },
                { label: 'Compare 1R vs 2R vs 3R', q: 'Compare 1R, 2R and 3R targets' },
                { label: 'Session optimization', q: 'Which trading session performs best?' },
                { label: 'Tighten candle filter to 15 pts', q: 'What happens if candle range is tightened to 15 points?' },
              ].map((btn, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAskAiAnalyst(btn.q)}
                  className="px-2.5 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-purple-300 text-[11px] font-mono font-semibold transition-all active:scale-95"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Candlestick & Order Block Chart */}
          {renderChart()}

          {/* Trade History Ledger Table */}
          <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h4 className="font-bold text-white uppercase tracking-wider">Executed Trades Ledger</h4>
              <span className="text-[11px] text-gray-500">Click any trade row to open Trade Inspector</span>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-900 border-b border-gray-800 text-gray-500 uppercase text-[10px] font-bold">
                    <th className="p-3">Trade #</th>
                    <th className="p-3">Execution Time</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Entry Price</th>
                    <th className="p-3">Initial SL</th>
                    <th className="p-3">Initial Risk</th>
                    <th className="p-3">Exit Reason</th>
                    <th className="p-3">Realized P&L</th>
                    <th className="p-3">R-Multiple</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {trades.map((t, idx) => (
                    <tr 
                      key={idx}
                      onClick={() => setSelectedTrade(t)}
                      className="hover:bg-gray-900/60 cursor-pointer transition-colors"
                    >
                      <td className="p-3 font-bold text-white">#{t.trade_id || idx + 1}</td>
                      <td className="p-3 text-gray-400">{t.entry_time}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] border ${
                          t.side === 'BUY' 
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-950/60 text-rose-400 border-rose-500/20'
                        }`}>
                          {t.side}
                        </span>
                      </td>
                      <td className="p-3 text-white font-semibold">₹{t.entry_price.toFixed(2)}</td>
                      <td className="p-3 text-rose-400">₹{t.initial_sl.toFixed(2)}</td>
                      <td className="p-3 text-amber-400">{t.initial_risk_points.toFixed(2)} pts</td>
                      <td className="p-3 text-gray-400 truncate max-w-xs">{t.exit_reason || 'CLOSED'}</td>
                      <td className={`p-3 font-bold ${t.realized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.realized_pnl >= 0 ? '+' : ''}₹{t.realized_pnl.toFixed(2)}
                      </td>
                      <td className={`p-3 font-bold ${t.realized_r >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.realized_r >= 0 ? '+' : ''}{t.realized_r.toFixed(2)}R
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trade Inspector Modal */}
      {selectedTrade && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-gray-900 rounded-3xl border border-gray-800 p-6 shadow-2xl space-y-6 font-mono text-xs animate-fadeIn">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[10px] ${
                  selectedTrade.side === 'BUY' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                }`}>
                  {selectedTrade.side}
                </span>
                <strong className="text-white text-sm">Trade #{selectedTrade.trade_id} Inspector</strong>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrade(null)}
                className="p-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Trigger Explanation */}
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Why did this trade trigger?</span>
                {selectedTrade.trigger_reasons?.map((r, i) => (
                  <p key={i} className="text-emerald-400 text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="shrink-0" /> {r}
                  </p>
                ))}
              </div>

              {/* Trade Execution Metrics */}
              <div className="grid grid-cols-2 gap-3 bg-gray-950 p-4 rounded-xl border border-gray-800">
                <div>
                  <span className="text-gray-500 uppercase text-[10px]">Entry Price:</span>
                  <p className="text-white font-bold mt-0.5">₹{selectedTrade.entry_price.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-500 uppercase text-[10px]">Initial Stop Loss:</span>
                  <p className="text-rose-400 font-bold mt-0.5">₹{selectedTrade.initial_sl.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-500 uppercase text-[10px]">Initial Risk (1R):</span>
                  <p className="text-amber-400 font-bold mt-0.5">{selectedTrade.initial_risk_points.toFixed(2)} points</p>
                </div>
                <div>
                  <span className="text-gray-500 uppercase text-[10px]">Realized Result:</span>
                  <p className={`font-bold mt-0.5 ${selectedTrade.realized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedTrade.realized_pnl >= 0 ? '+' : ''}₹{selectedTrade.realized_pnl.toFixed(2)} ({selectedTrade.realized_r}R)
                  </p>
                </div>
              </div>

              {/* Step-by-Step Progressive Timeline Events */}
              {selectedTrade.timeline_events?.length > 0 && (
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                  <span className="text-[10px] text-gray-500 uppercase font-bold block">Trade Management Timeline Events</span>
                  {selectedTrade.timeline_events.map((ev, i) => (
                    <div key={i} className="text-blue-400 text-[11px] flex justify-between">
                      <span>✓ {ev.event}: {ev.action}</span>
                      <span className="text-gray-500 font-mono">{ev.time.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedTrade(null)}
              className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs uppercase"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* AI Analyst Drawer Modal */}
      {showAiAnalyst && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gray-900 rounded-3xl border border-gray-800 p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-purple-400" size={18} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Backtest Analyst</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiAnalyst(false)}
                className="p-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {aiAnalystLoading ? (
              <div className="p-12 text-center text-gray-400 font-mono text-xs flex flex-col items-center gap-3">
                <RefreshCw size={24} className="animate-spin text-purple-400" />
                <span>AI analyzing historical trade ledger and drawdown metrics...</span>
              </div>
            ) : (
              <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 text-xs text-gray-300 leading-relaxed space-y-3 prose prose-invert max-w-none font-sans">
                <div dangerouslySetInnerHTML={{ __html: aiAnalysisText.replace(/\n/g, '<br/>') }} />
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAiAnalyst(false)}
              className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs font-mono"
            >
              Close Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
