import { useState, useEffect, useRef, useMemo } from 'react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { StrategyDefinition } from './strategyDsl';
import { 
  Play, Pause, FastForward, RotateCcw, RefreshCw, 
  Sparkles, CheckCircle2, Zap,
  ChevronLeft, ChevronRight, Sliders
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
    hit_idx?: number | null;
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
  type?: string;
  price?: number;
  time?: string;
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
  const [currency, setCurrency] = useState<'USDT' | 'USD' | 'INR'>('USDT');
  const [capital, setCapital] = useState<number>(1000);
  const [tradeSizeMode, setTradeSizeMode] = useState<'fixed_capital' | 'pct_capital' | 'risk_pct' | 'fixed_qty'>('fixed_capital');
  const [tradeSizeValue, setTradeSizeValue] = useState<number>(100);
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [interval, setInterval] = useState(strategy.timeframe || '1h');
  const [intrabarModel, setIntrabarModel] = useState(strategy.intrabar_model || 'conservative');

  // Sync state when strategy changes
  useEffect(() => {
    if (strategy.asset_symbol) setSymbol(strategy.asset_symbol);
    if (strategy.timeframe) setInterval(strategy.timeframe);
    if (strategy.intrabar_model) setIntrabarModel(strategy.intrabar_model);
    if (strategy.risk?.capital) setCapital(strategy.risk.capital);
    if (strategy.risk?.sizing_value) setTradeSizeValue(strategy.risk.sizing_value);
    if (strategy.risk?.sizing_method) setTradeSizeMode(strategy.risk.sizing_method as any);
  }, [strategy]);

  const [loading, setLoading] = useState(false);
  const [backtestResult, setBacktestResult] = useState<any | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [trades, setTrades] = useState<BacktestTrade[]>([]);

  // --- Live Playback / Candle Replay Engine State ---
  const [isLiveReplayActive, setIsLiveReplayActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(5); // 1x, 2x, 5x, 10x, 25x, 50x, 100x
  const [chartViewMode, setChartViewMode] = useState<'replay' | 'full'>('replay');
  const [liveFlashEvent, setLiveFlashEvent] = useState<{ text: string; type: 'entry' | 'exit' | 'tp' | 'sl'; id: number } | null>(null);

  const playbackTimerRef = useRef<number | null>(null);

  // Trade Inspector Modal
  const [selectedTrade, setSelectedTrade] = useState<BacktestTrade | null>(null);

  // AI Analyst Drawer
  const [showAiAnalyst, setShowAiAnalyst] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const [aiAnalystLoading, setAiAnalystLoading] = useState(false);

  // Chart Hover Crosshair
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Quick Preset Handlers
  const applyPresetDate = (type: '2y' | '1y' | '6m' | '3m' | 'ytd') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setEndDate(todayStr);

    if (type === '2y') {
      const past = new Date();
      past.setFullYear(today.getFullYear() - 2);
      setStartDate(past.toISOString().split('T')[0]);
    } else if (type === '1y') {
      const past = new Date();
      past.setFullYear(today.getFullYear() - 1);
      setStartDate(past.toISOString().split('T')[0]);
    } else if (type === '6m') {
      const past = new Date();
      past.setMonth(today.getMonth() - 6);
      setStartDate(past.toISOString().split('T')[0]);
    } else if (type === '3m') {
      const past = new Date();
      past.setMonth(today.getMonth() - 3);
      setStartDate(past.toISOString().split('T')[0]);
    } else if (type === 'ytd') {
      setStartDate(`${today.getFullYear()}-01-01`);
    }
  };

  // Run Backtest
  const handleRunBacktest = async () => {
    setLoading(true);
    setBacktestResult(null);
    setCandles([]);
    setTrades([]);
    setSelectedTrade(null);
    setIsPlaying(false);
    setIsLiveReplayActive(false);

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
          trade_size_method: tradeSizeMode,
          trade_size_value: tradeSizeValue,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBacktestResult(data.backtest || data.metrics);
        const candleList = data.candles || [];
        setCandles(candleList);
        setTrades(data.trades || []);

        if (candleList.length > 0) {
          const initialIdx = Math.min(20, candleList.length - 1);
          setPlaybackIndex(initialIdx);
          setIsLiveReplayActive(true);
          setIsPlaying(true);
        }
      } else {
        alert(data.detail || 'Backtest failed');
      }
    } catch (err: any) {
      alert(`Backtest error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Candle Replay Interval Loop ---
  useEffect(() => {
    if (playbackTimerRef.current !== null) {
      window.clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }

    if (!isPlaying || candles.length === 0) return;

    // Calculate delay in ms based on speed
    // 0.5x = 800ms, 1x = 400ms, 2x = 200ms, 5x = 80ms, 10x = 40ms, 25x = 16ms, 50x = 8ms, 100x = 3ms
    const speedMap: Record<number, number> = {
      0.5: 800,
      1: 400,
      2: 200,
      5: 80,
      10: 40,
      25: 16,
      50: 8,
      100: 3,
    };
    const delay = speedMap[playbackSpeed] || 50;

    playbackTimerRef.current = window.setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= candles.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, delay);

    return () => {
      if (playbackTimerRef.current !== null) {
        window.clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, candles.length]);

  // Flash Notifications on Entry / Exit Events as index changes
  useEffect(() => {
    if (!isLiveReplayActive || candles.length === 0) return;

    // Check if a trade entered at this exact candle index
    const enteringTrade = trades.find((t) => t.entry_idx === playbackIndex);
    if (enteringTrade) {
      setLiveFlashEvent({
        text: `🟢 ${enteringTrade.side} SIGNAL ENTRY @ ${currency === 'INR' ? '₹' : '$'}${enteringTrade.entry_price.toFixed(2)} (Allocated: ${currency === 'INR' ? '₹' : '$'}${enteringTrade.capital_allocated})`,
        type: 'entry',
        id: Date.now(),
      });
      return;
    }

    // Check if a trade exited at this exact candle index
    const exitingTrade = trades.find((t) => t.exit_idx === playbackIndex);
    if (exitingTrade) {
      const isWin = exitingTrade.realized_pnl >= 0;
      setLiveFlashEvent({
        text: `${isWin ? '🎯' : '🛑'} TRADE #${exitingTrade.trade_id} ${isWin ? 'TAKE PROFIT / CLOSED' : 'STOPPED OUT'} (${isWin ? '+' : ''}${currency === 'INR' ? '₹' : '$'}${exitingTrade.realized_pnl.toFixed(2)} | ${exitingTrade.realized_r}R)`,
        type: isWin ? 'tp' : 'sl',
        id: Date.now(),
      });
    }
  }, [playbackIndex, trades, isLiveReplayActive, currency, candles.length]);

  // Derived Real-Time Statistics up to playbackIndex
  const liveStats = useMemo(() => {
    if (candles.length === 0) {
      return {
        currentCandle: null,
        visibleCandles: [],
        closedTrades: [],
        activeTrade: null,
        liveBalance: capital,
        unrealizedPnl: 0,
        realizedPnl: 0,
        winRate: 0,
        totalClosed: 0,
        winCount: 0,
        lossCount: 0,
      };
    }

    const currentCandle = candles[playbackIndex] || candles[candles.length - 1];
    const visibleCandles = chartViewMode === 'full' ? candles : candles.slice(0, playbackIndex + 1);

    // Filter trades that have exited on or before playbackIndex
    const closedTrades = trades.filter((t) => t.exit_idx !== undefined && t.exit_idx <= playbackIndex);

    // Find if there is an active trade open right now at playbackIndex
    const activeTrade = trades.find(
      (t) => t.entry_idx <= playbackIndex && (t.exit_idx === undefined || t.exit_idx > playbackIndex)
    ) || null;

    let realizedPnl = 0;
    let winCount = 0;
    let lossCount = 0;

    closedTrades.forEach((t) => {
      realizedPnl += t.realized_pnl;
      if (t.realized_pnl >= 0) winCount++;
      else lossCount++;
    });

    let unrealizedPnl = 0;
    if (activeTrade && currentCandle) {
      const currentPrice = currentCandle.close;
      if (activeTrade.side === 'BUY') {
        unrealizedPnl = (currentPrice - activeTrade.entry_price) * activeTrade.quantity;
      } else {
        unrealizedPnl = (activeTrade.entry_price - currentPrice) * activeTrade.quantity;
      }
    }

    const liveBalance = capital + realizedPnl + unrealizedPnl;
    const totalClosed = closedTrades.length;
    const winRate = totalClosed > 0 ? (winCount / totalClosed) * 100 : 0;

    return {
      currentCandle,
      visibleCandles,
      closedTrades,
      activeTrade,
      liveBalance,
      unrealizedPnl,
      realizedPnl,
      winRate,
      totalClosed,
      winCount,
      lossCount,
    };
  }, [candles, trades, playbackIndex, capital, chartViewMode]);

  // Jump handlers
  const jumpToNextTrade = () => {
    const nextTrade = trades.find((t) => t.entry_idx > playbackIndex);
    if (nextTrade) {
      setPlaybackIndex(nextTrade.entry_idx);
    } else {
      setPlaybackIndex(candles.length - 1);
    }
  };

  const jumpToPrevTrade = () => {
    const prevTrades = trades.filter((t) => t.entry_idx < playbackIndex);
    if (prevTrades.length > 0) {
      const last = prevTrades[prevTrades.length - 1];
      setPlaybackIndex(last.entry_idx);
    } else {
      setPlaybackIndex(0);
    }
  };

  const resetReplay = () => {
    setIsPlaying(false);
    setPlaybackIndex(Math.min(20, candles.length - 1));
  };

  const finishReplay = () => {
    setIsPlaying(false);
    setPlaybackIndex(candles.length - 1);
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

  // Render High-Resolution Interactive Candlestick Chart with Live Playback
  const renderChart = () => {
    if (candles.length === 0) return null;

    const displayCandles = liveStats.visibleCandles;
    if (displayCandles.length === 0) return null;

    const width = 950;
    const height = 440;
    const paddingLeft = 70;
    const paddingRight = 75;
    const paddingTop = 35;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Compute dynamic min/max prices of the visible window
    const prices = displayCandles.flatMap((c) => [c.open, c.high, c.low, c.close]);
    const maxPrice = Math.max(...prices) * 1.008;
    const minPrice = Math.min(...prices) * 0.992;
    const priceDiff = maxPrice - minPrice || 1;

    const getX = (idx: number) => paddingLeft + (idx / Math.max(1, displayCandles.length - 1)) * chartWidth;
    const getY = (price: number) => paddingTop + chartHeight - ((price - minPrice) / priceDiff) * chartHeight;

    const isOrderBlockStrategy = (strategy?.indicators || []).some((ind: any) => ind.type === 'order_block') || (strategy?.name || '').toLowerCase().includes('order block');

    const activeHoverCandle = hoverIndex !== null && displayCandles[hoverIndex] ? displayCandles[hoverIndex] : null;

    // Active trades index map
    const entryTradesMap: Record<number, BacktestTrade> = {};
    const exitTradesMap: Record<number, BacktestTrade> = {};

    trades.forEach((t) => {
      if (t.entry_idx < displayCandles.length) {
        entryTradesMap[t.entry_idx] = t;
      }
      if (t.exit_idx !== undefined && t.exit_idx < displayCandles.length) {
        exitTradesMap[t.exit_idx] = t;
      }
    });

    const activeTrade = liveStats.activeTrade;

    return (
      <div className="relative bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-2xl space-y-4">
        {/* Flash Event Banner */}
        {liveFlashEvent && (
          <div className="animate-bounce bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-2">
              <Zap size={14} className="text-amber-400 animate-pulse" />
              {liveFlashEvent.text}
            </span>
            <span className="text-[10px] text-gray-400">Live Simulation</span>
          </div>
        )}

        {/* Top Status & Live Legend Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-950 p-4 rounded-xl border border-gray-800 text-xs font-mono">
          <div>
            <span className="text-gray-500 uppercase">Symbol / Timeframe:</span>
            <strong className="text-white block mt-0.5">{symbol} ({interval})</strong>
          </div>
          <div>
            <span className="text-gray-500 uppercase">Visible Range:</span>
            <strong className="text-white block mt-0.5">
              {currency === 'INR' ? '₹' : '$'}{minPrice.toFixed(2)} - {currency === 'INR' ? '₹' : '$'}{maxPrice.toFixed(2)}
            </strong>
          </div>
          <div>
            <span className="text-gray-500 uppercase">Replay Progress:</span>
            <strong className="text-emerald-400 block mt-0.5">
              Bar {playbackIndex + 1} of {candles.length} ({(((playbackIndex + 1) / candles.length) * 100).toFixed(0)}%)
            </strong>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
              <span className="text-gray-400 text-[10px]">Buy Entry</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
              <span className="text-gray-400 text-[10px]">Sell Entry</span>
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
              <span>Open: <strong className="text-white">{currency === 'INR' ? '₹' : '$'}{activeHoverCandle.open.toFixed(2)}</strong></span>
              <span>High: <strong className="text-emerald-400">{currency === 'INR' ? '₹' : '$'}{activeHoverCandle.high.toFixed(2)}</strong></span>
              <span>Low: <strong className="text-rose-400">{currency === 'INR' ? '₹' : '$'}{activeHoverCandle.low.toFixed(2)}</strong></span>
              <span>Close: <strong className="text-white">{currency === 'INR' ? '₹' : '$'}{activeHoverCandle.close.toFixed(2)}</strong></span>
              {hoverIndex !== null && entryTradesMap[hoverIndex] && (
                <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                  entryTradesMap[hoverIndex].side === 'BUY'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-950 text-rose-400 border border-rose-500/20'
                }`}>
                  Entry Trade #{entryTradesMap[hoverIndex].trade_id} ({entryTradesMap[hoverIndex].side} @ {currency === 'INR' ? '₹' : '$'}{entryTradesMap[hoverIndex].entry_price})
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500 italic flex items-center gap-1.5">
              <Sparkles size={12} className="text-emerald-400" />
              Hover cursor over candles to inspect real-time Order Blocks, entry signals, and SL/TP triggers
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
              let idx = Math.round(pct * (displayCandles.length - 1));
              if (idx < 0) idx = 0;
              if (idx >= displayCandles.length) idx = displayCandles.length - 1;
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
                    {currency === 'INR' ? '₹' : '$'}{p.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* ORDER BLOCK RECTANGULAR ZONES (Only rendered for Order Block / SMC strategies) */}
            {isOrderBlockStrategy && displayCandles.map((candle, idx) => {
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
                    opacity="0.12"
                    stroke={isBear ? '#ef4444' : '#10b981'}
                    strokeWidth="0.8"
                    strokeDasharray="2 2"
                  />
                );
              });
            })}

            {/* CANDLESTICKS */}
            {displayCandles.map((candle, idx) => {
              const x = getX(idx);
              const yOpen = getY(candle.open);
              const yClose = getY(candle.close);
              const yHigh = getY(candle.high);
              const yLow = getY(candle.low);

              const isGreen = candle.close >= candle.open;
              const color = isGreen ? '#10b981' : '#ef4444';
              const candleWidth = Math.max(2.5, (chartWidth / displayCandles.length) * 0.7);

              const entryTrade = entryTradesMap[idx];
              const exitTrade = exitTradesMap[idx];

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

                  {/* PROMINENT ENTRY SIGNAL MARKER */}
                  {entryTrade && (
                    <g 
                      className="cursor-pointer group"
                      onClick={() => setSelectedTrade(entryTrade)}
                    >
                      {entryTrade.side === 'SELL' ? (
                        <>
                          {/* Stem line */}
                          <line x1={x} y1={yHigh} x2={x} y2={yHigh - 10} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="1 1" />
                          {/* Badge pill */}
                          <rect x={x - 18} y={yHigh - 26} width="36" height="15" rx="4" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" className="filter drop-shadow-md" />
                          <text x={x} y={yHigh - 15} fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle" className="font-mono">▼ SELL</text>
                        </>
                      ) : (
                        <>
                          {/* Stem line */}
                          <line x1={x} y1={yLow} x2={x} y2={yLow + 10} stroke="#10b981" strokeWidth="1.5" strokeDasharray="1 1" />
                          {/* Badge pill */}
                          <rect x={x - 16} y={yLow + 11} width="32" height="15" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" className="filter drop-shadow-md" />
                          <text x={x} y={yLow + 22} fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle" className="font-mono">▲ BUY</text>
                        </>
                      )}
                    </g>
                  )}

                  {/* PROMINENT EXIT SIGNAL MARKER */}
                  {exitTrade && (
                    <g 
                      className="cursor-pointer"
                      onClick={() => setSelectedTrade(exitTrade)}
                    >
                      {exitTrade.realized_pnl >= 0 ? (
                        <>
                          <circle cx={x} cy={exitTrade.side === 'BUY' ? yHigh - 14 : yLow + 14} r="8" fill="#065f46" stroke="#34d399" strokeWidth="1.5" />
                          <text x={x} y={exitTrade.side === 'BUY' ? yHigh - 10 : yLow + 18} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">✓</text>
                        </>
                      ) : (
                        <>
                          <circle cx={x} cy={exitTrade.side === 'BUY' ? yHigh - 14 : yLow + 14} r="8" fill="#991b1b" stroke="#f87171" strokeWidth="1.5" />
                          <text x={x} y={exitTrade.side === 'BUY' ? yHigh - 10 : yLow + 18} fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">✕</text>
                        </>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* ACTIVE TRADE LIVE PROJECTION LINES (SL & TP TARGETS EXTENDING TO CURRENT BAR) */}
            {activeTrade && (
              <g key="active-trade-projections">
                {/* Projected Entry Line */}
                <line
                  x1={getX(activeTrade.entry_idx)}
                  y1={getY(activeTrade.entry_price)}
                  x2={getX(displayCandles.length - 1)}
                  y2={getY(activeTrade.entry_price)}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={getX(displayCandles.length - 1) + 6}
                  y={getY(activeTrade.entry_price) + 3}
                  fill="#38bdf8"
                  fontSize="9"
                  className="font-mono font-bold"
                >
                  ENTRY @ {activeTrade.entry_price.toFixed(2)}
                </text>

                {/* Projected Current Stop Loss Line */}
                <line
                  x1={getX(activeTrade.entry_idx)}
                  y1={getY(activeTrade.current_sl)}
                  x2={getX(displayCandles.length - 1)}
                  y2={getY(activeTrade.current_sl)}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                <text
                  x={getX(displayCandles.length - 1) + 6}
                  y={getY(activeTrade.current_sl) + 3}
                  fill="#ef4444"
                  fontSize="9"
                  className="font-mono font-bold"
                >
                  SL @ {activeTrade.current_sl.toFixed(2)}
                </text>

                {/* Projected Take Profit Targets */}
                {activeTrade.targets.map((tgt, tIdx) => (
                  <g key={`active-tp-${tIdx}`}>
                    <line
                      x1={getX(activeTrade.entry_idx)}
                      y1={getY(tgt.price)}
                      x2={getX(displayCandles.length - 1)}
                      y2={getY(tgt.price)}
                      stroke={tgt.hit ? '#10b981' : '#60a5fa'}
                      strokeWidth={tgt.hit ? '1' : '1.2'}
                      strokeDasharray="3 3"
                    />
                    <text
                      x={getX(displayCandles.length - 1) + 6}
                      y={getY(tgt.price) + 3}
                      fill={tgt.hit ? '#10b981' : '#60a5fa'}
                      fontSize="9"
                      className="font-mono font-bold"
                    >
                      {tgt.name} ({tgt.rr_ratio}R) {tgt.hit ? '✓ HIT' : ''}
                    </text>
                  </g>
                ))}
              </g>
            )}

            {/* Interactive Crosshair Tracking */}
            {hoverIndex !== null && displayCandles[hoverIndex] && (
              <>
                <line x1={getX(hoverIndex)} y1={paddingTop} x2={getX(hoverIndex)} y2={paddingTop + chartHeight} stroke="#4b5563" strokeDasharray="2 2" strokeWidth="1.2" />
                <line x1={paddingLeft} y1={getY(displayCandles[hoverIndex].close)} x2={width - paddingRight} y2={getY(displayCandles[hoverIndex].close)} stroke="#4b5563" strokeDasharray="2 2" strokeWidth="1.2" />
                <circle cx={getX(hoverIndex)} cy={getY(displayCandles[hoverIndex].close)} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              </>
            )}

            {/* X-axis date labels */}
            {displayCandles.map((c, idx) => {
              if (idx % Math.max(1, Math.ceil(displayCandles.length / 6)) !== 0 && idx !== displayCandles.length - 1) {
                return null;
              }
              const x = getX(idx);
              return (
                <g key={`x-lbl-${idx}`}>
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
      <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-xl space-y-5">
        <div className="border-b border-gray-800 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Sliders size={16} className="text-emerald-400" />
              Backtest Execution Sandbox & Live Replay Engine
            </h3>
            <p className="text-xs text-gray-400">
              Configure initial capital (e.g. 1000 USDT), custom trade sizing, and test over your selected date range.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 font-mono border border-emerald-500/30">
              Anti-Lookahead Engine Active
            </span>
          </div>
        </div>

        {/* Date Presets Quick Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-gray-500 text-[10px] uppercase font-bold mr-1">Date Presets:</span>
          <button
            type="button"
            onClick={() => applyPresetDate('2y')}
            className="px-2.5 py-1 rounded-lg border border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white text-[11px] transition-all"
          >
            Last 2 Years
          </button>
          <button
            type="button"
            onClick={() => applyPresetDate('1y')}
            className="px-2.5 py-1 rounded-lg border border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white text-[11px] transition-all"
          >
            Last 1 Year
          </button>
          <button
            type="button"
            onClick={() => applyPresetDate('6m')}
            className="px-2.5 py-1 rounded-lg border border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white text-[11px] transition-all"
          >
            Last 6 Months
          </button>
          <button
            type="button"
            onClick={() => applyPresetDate('3m')}
            className="px-2.5 py-1 rounded-lg border border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white text-[11px] transition-all"
          >
            Last 3 Months
          </button>
          <button
            type="button"
            onClick={() => applyPresetDate('ytd')}
            className="px-2.5 py-1 rounded-lg border border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white text-[11px] transition-all"
          >
            YTD
          </button>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 font-mono text-xs items-end">
          {/* Strategy */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
              Select Strategy
            </label>
            <select
              value={selectedStrategyId}
              onChange={(e) => onSelectStrategyId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none truncate"
            >
              {strategies.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Symbol */}
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
              Symbol
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. XAUUSD"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white font-bold focus:outline-none"
            />
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
              Timeframe
            </label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-amber-400 font-bold focus:outline-none"
            >
              <option value="1h">1 Hour (1h)</option>
              <option value="1d">Daily (1d)</option>
              <option value="15m">15 Min (15m)</option>
              <option value="5m">5 Min (5m)</option>
              <option value="1m">1 Min (1m)</option>
              <option value="1wk">Weekly (1wk)</option>
            </select>
          </div>

          {/* Capital & Currency */}
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1 flex justify-between">
              <span>Initial Capital</span>
              <span className="text-emerald-400 font-bold">{currency}</span>
            </label>
            <div className="flex">
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
                placeholder="1000"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-l-xl text-emerald-400 font-bold focus:outline-none"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="px-2 py-2 bg-gray-800 border border-gray-700 rounded-r-xl text-white text-[11px] focus:outline-none"
              >
                <option value="USDT">USDT</option>
                <option value="USD">USD</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>

          {/* Trade Size Mode & Value */}
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
              Trade Sizing
            </label>
            <div className="flex">
              <select
                value={tradeSizeMode}
                onChange={(e) => setTradeSizeMode(e.target.value as any)}
                className="w-1/2 px-2 py-2 bg-gray-900 border border-gray-800 rounded-l-xl text-[10px] text-gray-300 focus:outline-none"
              >
                <option value="fixed_capital">Fixed Amount</option>
                <option value="pct_capital">% Capital</option>
                <option value="risk_pct">Risk % (SL)</option>
                <option value="fixed_qty">Fixed Qty</option>
              </select>
              <input
                type="number"
                value={tradeSizeValue}
                onChange={(e) => setTradeSizeValue(parseFloat(e.target.value) || 0)}
                placeholder="100"
                className="w-1/2 px-2 py-2 bg-gray-900 border border-gray-800 rounded-r-xl text-white font-bold text-center focus:outline-none"
              />
            </div>
          </div>

          {/* Start Date */}
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

          {/* End Date */}
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

          {/* Run Button */}
          <button
            type="button"
            onClick={handleRunBacktest}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-800 text-white font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            Run Strategy
          </button>
        </div>
      </div>

      {/* Interactive Live Replay Simulation HUD & Control Toolbar */}
      {candles.length > 0 && (
        <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-2xl space-y-6 animate-fadeIn">
          {/* Top Live Ticker HUD */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 font-mono text-xs">
            {/* Live Portfolio Balance */}
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Live Balance</span>
              <p className={`text-lg font-bold mt-1 ${liveStats.liveBalance >= capital ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currency === 'INR' ? '₹' : '$'}{liveStats.liveBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[10px] text-gray-400">
                {liveStats.liveBalance >= capital ? '+' : ''}
                {(((liveStats.liveBalance - capital) / (capital || 1)) * 100).toFixed(2)}% ROI
              </span>
            </div>

            {/* Floating Unrealized PnL */}
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Unrealized Floating</span>
              <p className={`text-lg font-bold mt-1 ${liveStats.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {liveStats.unrealizedPnl >= 0 ? '+' : ''}{currency === 'INR' ? '₹' : '$'}{liveStats.unrealizedPnl.toFixed(2)}
              </p>
              <span className="text-[10px] text-gray-400">
                {liveStats.activeTrade ? `Active in Trade #${liveStats.activeTrade.trade_id}` : 'Position Flat'}
              </span>
            </div>

            {/* Realized Net PnL */}
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Realized Net P&L</span>
              <p className={`text-lg font-bold mt-1 ${liveStats.realizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {liveStats.realizedPnl >= 0 ? '+' : ''}{currency === 'INR' ? '₹' : '$'}{liveStats.realizedPnl.toFixed(2)}
              </p>
              <span className="text-[10px] text-gray-400">{liveStats.totalClosed} closed trades</span>
            </div>

            {/* Live Win Rate */}
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Win Rate</span>
              <p className="text-lg font-bold text-emerald-400 mt-1">
                {liveStats.winRate.toFixed(1)}%
              </p>
              <span className="text-[10px] text-gray-400">
                {liveStats.winCount}W / {liveStats.lossCount}L
              </span>
            </div>

            {/* Current Price & Date */}
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Replay Date</span>
              <p className="text-sm font-bold text-white mt-1">
                {liveStats.currentCandle ? liveStats.currentCandle.time.split(' ')[0] : '-'}
              </p>
              <span className="text-[10px] text-emerald-400">
                Close: {currency === 'INR' ? '₹' : '$'}{liveStats.currentCandle ? liveStats.currentCandle.close.toFixed(2) : '-'}
              </span>
            </div>

            {/* Active Position Tracker */}
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Position State</span>
              {liveStats.activeTrade ? (
                <div className="mt-1">
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] border ${
                    liveStats.activeTrade.side === 'BUY'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-950 text-rose-400 border-rose-500/30'
                  }`}>
                    {liveStats.activeTrade.side} {liveStats.activeTrade.quantity} @ {liveStats.activeTrade.entry_price}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">
                    SL: {liveStats.activeTrade.current_sl.toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-bold text-gray-400 mt-1">FLAT / WAITING</p>
              )}
            </div>
          </div>

          {/* Interactive Playback Controller Bar */}
          <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800 space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              {/* Play / Pause / Step Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-5 py-2.5 rounded-xl font-bold uppercase text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
                    isPlaying ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  {isPlaying ? 'Pause Simulation' : 'Live Play'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setPlaybackIndex((prev) => Math.max(0, prev - 1));
                  }}
                  title="Step Backward (1 Candle)"
                  className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setPlaybackIndex((prev) => Math.min(candles.length - 1, prev + 1));
                  }}
                  title="Step Forward (1 Candle)"
                  className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
                >
                  <ChevronRight size={16} />
                </button>

                <button
                  type="button"
                  onClick={jumpToPrevTrade}
                  title="Jump to Previous Trade"
                  className="px-2.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[10px] font-mono"
                >
                  ⏮ Prev Trade
                </button>

                <button
                  type="button"
                  onClick={jumpToNextTrade}
                  title="Jump to Next Trade"
                  className="px-2.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[10px] font-mono"
                >
                  ⏭ Next Trade
                </button>

                <button
                  type="button"
                  onClick={resetReplay}
                  title="Reset to Beginning"
                  className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
                >
                  <RotateCcw size={14} />
                </button>

                <button
                  type="button"
                  onClick={finishReplay}
                  title="Jump to Final Outcome"
                  className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
                >
                  <FastForward size={14} />
                </button>
              </div>

              {/* Speed Multipliers */}
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                <span className="text-gray-500 text-[10px] uppercase font-bold mr-1">Speed:</span>
                {[0.5, 1, 2, 5, 10, 25, 50, 100].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPlaybackSpeed(s)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      playbackSpeed === s
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Replay View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-xl font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => setChartViewMode('replay')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    chartViewMode === 'replay' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Streaming
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('full')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    chartViewMode === 'full' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Full Overview
                </button>
              </div>
            </div>

            {/* Scrubbing Timeline Progress Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                <span>{startDate} (Start)</span>
                <span className="text-emerald-400 font-bold">
                  {liveStats.currentCandle ? liveStats.currentCandle.time.split(' ')[0] : ''} (Bar {playbackIndex + 1}/{candles.length})
                </span>
                <span>{endDate} (End)</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, candles.length - 1)}
                value={playbackIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setPlaybackIndex(parseInt(e.target.value, 10));
                }}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* Candlestick & Live Signals Chart */}
          {renderChart()}

          {/* AI Backtest Analyst Quick Bar */}
          <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles size={18} className="text-purple-400 animate-pulse" />
              <div>
                <strong className="text-white text-xs font-bold font-mono">Ask Dhana AI About This Backtest:</strong>
                <p className="text-[11px] text-gray-400">Deep mathematical analysis of actual backtest trade results across the selected date range.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Why did losses happen?', q: 'Why did losing trades happen in this backtest period?' },
                { label: 'Compare 1R vs 2R vs 3R', q: 'Compare 1R, 2R and 3R target efficiency' },
                { label: 'Capital drawdown review', q: 'What was the maximum drawdown and how to reduce risk?' },
                { label: 'Sizing optimization', q: 'How would varying trade size from 100 USDT affect the win rate and Sharpe ratio?' },
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

          {/* Trade History Ledger Table */}
          <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <div>
                <h4 className="font-bold text-white uppercase tracking-wider">Executed Trades Ledger</h4>
                <p className="text-[11px] text-gray-400">
                  Displaying {liveStats.closedTrades.length} completed trades up to current replay bar.
                </p>
              </div>
              <span className="text-[11px] text-gray-500">Click any row to open Trade Inspector</span>
            </div>

            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-900 border-b border-gray-800 text-gray-500 uppercase text-[10px] font-bold">
                    <th className="p-3">Trade #</th>
                    <th className="p-3">Entry Time</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Entry Price</th>
                    <th className="p-3">Initial SL</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Allocated</th>
                    <th className="p-3">Exit Reason</th>
                    <th className="p-3">Realized P&L</th>
                    <th className="p-3">R-Multiple</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {liveStats.closedTrades.map((t, idx) => (
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
                      <td className="p-3 text-white font-semibold">{currency === 'INR' ? '₹' : '$'}{t.entry_price.toFixed(2)}</td>
                      <td className="p-3 text-rose-400">{currency === 'INR' ? '₹' : '$'}{t.initial_sl.toFixed(2)}</td>
                      <td className="p-3 text-gray-300">{t.quantity}</td>
                      <td className="p-3 text-gray-300">{currency === 'INR' ? '₹' : '$'}{t.capital_allocated.toFixed(2)}</td>
                      <td className="p-3 text-gray-400 truncate max-w-xs">{t.exit_reason || 'CLOSED'}</td>
                      <td className={`p-3 font-bold ${t.realized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.realized_pnl >= 0 ? '+' : ''}{currency === 'INR' ? '₹' : '$'}{t.realized_pnl.toFixed(2)}
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
                  <p className="text-white font-bold mt-0.5">{currency === 'INR' ? '₹' : '$'}{selectedTrade.entry_price.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-500 uppercase text-[10px]">Initial Stop Loss:</span>
                  <p className="text-rose-400 font-bold mt-0.5">{currency === 'INR' ? '₹' : '$'}{selectedTrade.initial_sl.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-500 uppercase text-[10px]">Capital Allocated:</span>
                  <p className="text-amber-400 font-bold mt-0.5">{currency === 'INR' ? '₹' : '$'}{selectedTrade.capital_allocated.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-500 uppercase text-[10px]">Realized Result:</span>
                  <p className={`font-bold mt-0.5 ${selectedTrade.realized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedTrade.realized_pnl >= 0 ? '+' : ''}{currency === 'INR' ? '₹' : '$'}{selectedTrade.realized_pnl.toFixed(2)} ({selectedTrade.realized_r}R)
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
