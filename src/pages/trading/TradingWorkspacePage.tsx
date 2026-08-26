import React, { useState, useEffect } from 'react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { encryptToken, decryptToken } from './crypto';
import { 
  TrendingUp, Shield, Key, Bot, Play, Square, FileText, 
  Lock, RefreshCw, Code, ChevronRight, AlertTriangle, Sparkles, BarChart2, Sliders, Cpu
} from 'lucide-react';

interface Strategy {
  _id: string;
  name: string;
  description: string;
  code: string;
  asset_symbol: string;
  timeframe: string;
}

interface BacktestTrade {
  type: string;
  price: number;
  time: string;
  quantity?: number;
  profit_loss?: number;
}

interface Backtest {
  _id: string;
  strategy_id: string;
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_capital: number;
  total_trades: number;
  win_ratio: number;
  profit_loss_percent: number;
  trades_history: BacktestTrade[];
}

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function TradingWorkspacePage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'broker' | 'strategy' | 'backtest' | 'bot'>('broker');
  
  // Strategy Studio sub-tabs
  const [stratSubTab, setStratSubTab] = useState<'visual' | 'ai' | 'code'>('visual');

  // PIN Authorization / Security
  const [pin, setPin] = useState('');
  const [isPinAuthorized, setIsPinAuthorized] = useState(false);
  const [pinError, setPinError] = useState('');

  // Broker credentials status (Dhan)
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [dhanClientIdVal, setDhanClientIdVal] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [fundBalance, setFundBalance] = useState<number | null>(null);
  
  // Custom Dhan config fields
  const [inputClientId, setInputClientId] = useState('');
  const [inputAccessToken, setInputAccessToken] = useState('');
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  // Strategy list & form
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [newStrategy, setNewStrategy] = useState({
    name: 'SMA Golden Cross',
    description: 'Buy when SMA 9 crosses above SMA 21, sell when it crosses below.',
    code: 'def check_signal(df):\n    df["sma_fast"] = df["close"].rolling(9).mean()\n    df["sma_slow"] = df["close"].rolling(21).mean()\n    \n    if df["sma_fast"].iloc[-1] > df["sma_slow"].iloc[-1] and df["sma_fast"].iloc[-2] <= df["sma_slow"].iloc[-2]:\n        return "BUY"\n    elif df["sma_fast"].iloc[-1] < df["sma_slow"].iloc[-1] and df["sma_fast"].iloc[-2] >= df["sma_slow"].iloc[-2]:\n        return "SELL"\n    return None',
    asset_symbol: 'RELIANCE.NS',
    timeframe: '1d'
  });
  const [stratSavingLoading, setStratSavingLoading] = useState(false);

  // Visual strategy builder parameters
  const [visualIndicator, setVisualIndicator] = useState<'sma' | 'ema' | 'rsi'>('sma');
  const [paramFast, setParamFast] = useState(9);
  const [paramSlow, setParamSlow] = useState(21);
  const [paramRsiPeriod, setParamRsiPeriod] = useState(14);
  const [rsiOversold, setRsiOversold] = useState(30);
  const [rsiOverbought, setRsiOverbought] = useState(70);

  // AI strategy prompt
  const [aiPrompt, setAiPrompt] = useState('Create a strategy that buys when the 9-day EMA crosses above the 21-day EMA, and sells when it crosses below.');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Backtest params & results
  const [backtestParams, setBacktestParams] = useState({
    symbol: 'RELIANCE.NS',
    start_date: '2026-06-01',
    end_date: '2026-08-25',
    initial_capital: 100000,
    interval: '1d'
  });
  const [backtestResult, setBacktestResult] = useState<Backtest | null>(null);
  const [backtestCandles, setBacktestCandles] = useState<Candle[]>([]);
  const [backtestLoading, setBacktestLoading] = useState(false);

  // Live Bot controls
  const [botMode, setBotMode] = useState<'auto' | 'approval'>('approval');
  const [allocatedCapital, setAllocatedCapital] = useState(50000);
  const [botLoading, setBotLoading] = useState(false);
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [pendingSignals, setPendingSignals] = useState<any[]>([]);

  // Chart ref & sizing
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);

  // 1. Initial Load & Fetch Status
  useEffect(() => {
    fetchBrokerStatus();
    fetchStrategies();
  }, []);

  // Fetch broker status
  const fetchBrokerStatus = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.trading.status);
      const data = await res.json();
      if (data.success) {
        setIsConfigured(data.is_configured);
        setIsConnected(data.is_connected);
        if (data.client_id) setDhanClientIdVal(data.client_id);
        if (data.updated_at) {
          setUpdatedAt(new Date(data.updated_at).toLocaleString());
        }
      }
    } catch (err) {
      console.error('Failed to fetch broker status:', err);
    }
  };

  // Fetch strategies
  const fetchStrategies = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.trading.strategies);
      const data = await res.json();
      if (data.success) {
        setStrategies(data.strategies);
        if (data.strategies.length > 0 && !selectedStrategyId) {
          setSelectedStrategyId(data.strategies[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch strategies:', err);
    }
  };

  // Poll pending signals if bot is running
  useEffect(() => {
    let timer: any;
    if (isBotRunning) {
      const fetchSignals = async () => {
        try {
          const res = await apiFetch(API_ENDPOINTS.trading.signals);
          const data = await res.json();
          if (data.success) {
            setPendingSignals(data.signals);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchSignals();
      timer = setInterval(fetchSignals, 10000);
    }
    return () => clearInterval(timer);
  }, [isBotRunning]);

  // 2. PIN Authorization / Authentication
  const handlePinAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 6) {
      setPinError('PIN must be at least 6 digits');
      return;
    }
    setIsPinAuthorized(true);
    setPinError('');
  };

  // 3. Save Dhan Config
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputClientId || !inputAccessToken) return;
    setSaveLoading(true);
    try {
      // Encrypt the Access Token client-side
      const encryptedAccess = await encryptToken(inputAccessToken, pin);
      
      const res = await apiFetch(API_ENDPOINTS.trading.saveEncrypted, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: inputClientId,
          encrypted_access_token: encryptedAccess.ciphertext,
          encryption_salt: encryptedAccess.salt,
          iv: encryptedAccess.iv
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsConfigured(true);
        setInputClientId('');
        setInputAccessToken('');
        alert('Dhan E2EE configuration saved successfully!');
        fetchBrokerStatus();
      }
    } catch (err: any) {
      alert(`Configuration save failed: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // Connect / Unlock Session with Dhan
  const handleConnectDhan = async () => {
    setConnectLoading(true);
    try {
      // 1. Fetch E2EE encrypted token details
      const resDetail = await apiFetch(`${API_ENDPOINTS.trading.status}/detail`);
      const dataDetail = await resDetail.json();
      if (!dataDetail.success) {
        throw new Error("No configured credentials found");
      }

      // 2. Decrypt token locally
      const decryptedToken = await decryptToken(
        dataDetail.encrypted_access_token,
        pin,
        dataDetail.encryption_salt,
        dataDetail.iv
      );

      // 3. Post decryption to connect handler validating Dhan limits
      const resConnect = await apiFetch(API_ENDPOINTS.trading.callback.replace('callback', 'connect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: dataDetail.client_id,
          decrypted_access_token: decryptedToken
        })
      });
      const dataConnect = await resConnect.json();
      if (dataConnect.success) {
        setIsConnected(true);
        // Safely extract limit/balance
        const avlLimit = dataConnect.funds?.availabelLimit || dataConnect.funds?.availableLimit || 0;
        setFundBalance(Number(avlLimit));
        alert('Live Dhan Session successfully established!');
        fetchBrokerStatus();
      } else {
        alert(dataConnect.detail || 'Connection validation failed');
      }
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setConnectLoading(false);
    }
  };

  // 4. Auto-generate python code from Visual drop-down configuration
  useEffect(() => {
    if (stratSubTab !== 'visual') return;
    
    let generated = '';
    if (visualIndicator === 'sma') {
      generated = `def check_signal(df):\n    # Simple Moving Average Golden/Death Cross\n    df["sma_fast"] = df["close"].rolling(window=${paramFast}).mean()\n    df["sma_slow"] = df["close"].rolling(window=${paramSlow}).mean()\n    \n    if df["sma_fast"].iloc[-1] > df["sma_slow"].iloc[-1] and df["sma_fast"].iloc[-2] <= df["sma_slow"].iloc[-2]:\n        return "BUY"\n    elif df["sma_fast"].iloc[-1] < df["sma_slow"].iloc[-1] and df["sma_fast"].iloc[-2] >= df["sma_slow"].iloc[-2]:\n        return "SELL"\n    return None`;
    } else if (visualIndicator === 'ema') {
      generated = `def check_signal(df):\n    # Exponential Moving Average Golden/Death Cross\n    df["ema_fast"] = df["close"].ewm(span=${paramFast}, adjust=False).mean()\n    df["ema_slow"] = df["close"].ewm(span=${paramSlow}, adjust=False).mean()\n    \n    if df["ema_fast"].iloc[-1] > df["ema_slow"].iloc[-1] and df["ema_fast"].iloc[-2] <= df["ema_slow"].iloc[-2]:\n        return "BUY"\n    elif df["ema_fast"].iloc[-1] < df["ema_slow"].iloc[-1] and df["ema_fast"].iloc[-2] >= df["ema_slow"].iloc[-2]:\n        return "SELL"\n    return None`;
    } else if (visualIndicator === 'rsi') {
      generated = `def check_signal(df):\n    # Relative Strength Index (RSI) Overbought/Oversold Crossover\n    delta = df["close"].diff()\n    gain = (delta.where(delta > 0, 0)).rolling(window=${paramRsiPeriod}).mean()\n    loss = (-delta.where(delta < 0, 0)).rolling(window=${paramRsiPeriod}).mean()\n    rs = gain / (loss + 1e-10)\n    df["rsi"] = 100 - (100 / (1 + rs))\n    \n    # Buy if crosses below oversold (${rsiOversold}) and then back up\n    if df["rsi"].iloc[-1] >= ${rsiOversold} and df["rsi"].iloc[-2] < ${rsiOversold}:\n        return "BUY"\n    # Sell if crosses above overbought (${rsiOverbought}) and then back down\n    elif df["rsi"].iloc[-1] <= ${rsiOverbought} and df["rsi"].iloc[-2] > ${rsiOverbought}:\n        return "SELL"\n    return None`;
    }
    setNewStrategy(prev => ({ ...prev, code: generated }));
  }, [visualIndicator, paramFast, paramSlow, paramRsiPeriod, rsiOversold, rsiOverbought, stratSubTab]);

  // 5. Generate strategy code using Gemini AI Prompts
  const handleGenerateStrategyAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.trading.strategyGenerateAI, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (data.success && data.code) {
        setNewStrategy(prev => ({
          ...prev,
          code: data.code,
          description: `AI Generated: ${aiPrompt.substring(0, 80)}...`
        }));
        setStratSubTab('code'); // Switch to editor to show generated code
      } else {
        alert("Gemini failed to translate strategy prompt.");
      }
    } catch (err) {
      alert("AI generation request failed.");
    } finally {
      setAiGenerating(false);
    }
  };

  // 6. Save Strategy
  const handleCreateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    setStratSavingLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.trading.strategies, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStrategy)
      });
      const data = await res.json();
      if (data.success) {
        fetchStrategies();
        alert('Strategy saved successfully to database!');
        // Pre-fill backtest symbol with strategy target
        setBacktestParams(prev => ({ ...prev, symbol: newStrategy.asset_symbol }));
      }
    } catch (err) {
      alert('Failed to save strategy');
    } finally {
      setStratSavingLoading(false);
    }
  };

  // 7. Run Sandbox Backtest Simulation
  const handleRunBacktest = async () => {
    if (!selectedStrategyId) {
      alert("Please select or create a strategy first.");
      return;
    }
    setBacktestLoading(true);
    setBacktestResult(null);
    setBacktestCandles([]);
    try {
      const res = await apiFetch(API_ENDPOINTS.trading.backtest, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy_id: selectedStrategyId,
          ...backtestParams
        })
      });
      const data = await res.json();
      if (data.success) {
        setBacktestResult(data.backtest);
        if (data.candles) setBacktestCandles(data.candles);
      } else {
        alert(data.detail || 'Backtest simulation error');
      }
    } catch (err) {
      alert('Backtest run failed');
    } finally {
      setBacktestLoading(false);
    }
  };

  // 8. Live Bot controls
  const handleStartBot = async () => {
    if (!selectedStrategyId) return;
    botLoadingAction(async (decryptedToken) => {
      const res = await apiFetch(API_ENDPOINTS.trading.botStart, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy_id: selectedStrategyId,
          mode: botMode,
          capital_allocated: allocatedCapital,
          decrypted_access_token: decryptedToken
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsBotRunning(true);
        fetchBrokerStatus();
      }
    });
  };

  const handleStopBot = async () => {
    setBotLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.trading.botStop, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsBotRunning(false);
        setPendingSignals([]);
        fetchBrokerStatus();
      }
    } catch (err) {
      alert('Failed to stop bot');
    } finally {
      setBotLoading(false);
    }
  };

  const handleSignalAction = async (token: string, action: 'approve' | 'reject') => {
    try {
      const res = await apiFetch(`${API_ENDPOINTS.trading.signalAction}?token=${token}&action=${action}`);
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setPendingSignals(prev => prev.filter(s => s.token !== token));
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Signal action execution failed');
    }
  };

  const botLoadingAction = async (callback: (token: string) => Promise<void>) => {
    setBotLoading(true);
    try {
      const resDetail = await apiFetch(`${API_ENDPOINTS.trading.status}/detail`);
      const dataDetail = await resDetail.json();
      if (!dataDetail.success) {
        alert('Broker credentials are not configured! Connect your broker first.');
        setBotLoading(false);
        return;
      }
      
      const decryptedToken = await decryptToken(
        dataDetail.encrypted_access_token,
        pin,
        dataDetail.encryption_salt,
        dataDetail.iv
      );
      
      await callback(decryptedToken);
    } catch (err) {
      alert('Action failed. Check your Trading PIN.');
    } finally {
      setBotLoading(false);
    }
  };

  // Custom Interactive Candlestick Chart Renderer (SVG)
  const renderCandlestickChart = () => {
    if (backtestCandles.length === 0) return null;

    const width = 800;
    const height = 350;
    const paddingLeft = 60;
    const paddingRight = 30;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Retrieve boundaries
    const prices = backtestCandles.flatMap(c => [c.open, c.high, c.low, c.close]);
    const maxPrice = Math.max(...prices) * 1.02;
    const minPrice = Math.min(...prices) * 0.98;
    const priceDiff = maxPrice - minPrice;

    // Convert data coordinate to chart coordinates
    const getX = (index: number) => paddingLeft + (index / (backtestCandles.length - 1)) * chartWidth;
    const getY = (price: number) => paddingTop + chartHeight - ((price - minPrice) / priceDiff) * chartHeight;

    // Group signals by trade time for visual markers overlays
    const tradesByTime: Record<string, BacktestTrade> = {};
    if (backtestResult && backtestResult.trades_history) {
      backtestResult.trades_history.forEach(t => {
        // Standardize key to date match
        const dateStr = t.time.split(' ')[0];
        tradesByTime[dateStr] = t;
      });
    }

    return (
      <div className="relative bg-gray-950 p-4 rounded-3xl border border-gray-800">
        {/* Hover info strip */}
        <div className="flex justify-between items-center mb-2 px-3 text-[11px] text-gray-400 font-mono h-5 bg-gray-900/60 rounded-lg">
          {hoveredCandle ? (
            <>
              <span>Date: <strong className="text-white">{hoveredCandle.time.split(' ')[0]}</strong></span>
              <span>Open: <strong className="text-white">₹{hoveredCandle.open.toFixed(2)}</strong></span>
              <span>High: <strong className="text-green-400">₹{hoveredCandle.high.toFixed(2)}</strong></span>
              <span>Low: <strong className="text-red-400">₹{hoveredCandle.low.toFixed(2)}</strong></span>
              <span>Close: <strong className="text-white">₹{hoveredCandle.close.toFixed(2)}</strong></span>
              <span>Vol: <strong className="text-gray-200">{(hoveredCandle.volume / 1000).toFixed(0)}k</strong></span>
            </>
          ) : (
            <span className="text-gray-500 italic">Hover over candles for OHLC details</span>
          )}
        </div>

        {/* SVG Drawing Canvas */}
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const p = minPrice + ratio * priceDiff;
            const y = getY(p);
            return (
              <g key={i}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#1f2937" strokeDasharray="3 3" />
                <text x={paddingLeft - 10} y={y + 4} fill="#6b7280" fontSize="9" textAnchor="end" className="font-mono">
                  ₹{p.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Candle Bars Loop */}
          {backtestCandles.map((candle, idx) => {
            const x = getX(idx);
            const yOpen = getY(candle.open);
            const yClose = getY(candle.close);
            const yHigh = getY(candle.high);
            const yLow = getY(candle.low);

            const isGreen = candle.close >= candle.open;
            const candleColor = isGreen ? '#10b981' : '#ef4444';
            const candleWidth = Math.max(2, (chartWidth / backtestCandles.length) * 0.7);

            // Fetch signals overlays
            const dateOnly = candle.time.split(' ')[0];
            const signalTrade = tradesByTime[dateOnly];

            return (
              <g 
                key={idx}
                onMouseEnter={() => setHoveredCandle(candle)}
                onMouseLeave={() => setHoveredCandle(null)}
                className="cursor-pointer group"
              >
                {/* High/Low wick line */}
                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={candleColor} strokeWidth="1.5" />

                {/* Open/Close solid body rect */}
                <rect 
                  x={x - candleWidth / 2} 
                  y={Math.min(yOpen, yClose)} 
                  width={candleWidth} 
                  height={Math.max(1.5, Math.abs(yOpen - yClose))} 
                  fill={candleColor} 
                />

                {/* Interactive transparent overlay for easier hovering */}
                <rect
                  x={x - (chartWidth / backtestCandles.length) / 2}
                  y={paddingTop}
                  width={chartWidth / backtestCandles.length}
                  height={chartHeight}
                  fill="transparent"
                />

                {/* Buy / Sell signal Overlay markers */}
                {signalTrade && (
                  <g>
                    {signalTrade.type === 'BUY' ? (
                      <>
                        {/* Green up arrow overlay */}
                        <circle cx={x} cy={yLow + 16} r="8" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                        <text x={x} y={yLow + 19} fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">B</text>
                      </>
                    ) : (
                      <>
                        {/* Red down arrow overlay */}
                        <circle cx={x} cy={yHigh - 16} r="8" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                        <text x={x} y={yHigh - 13} fill="#ef4444" fontSize="9" fontWeight="bold" textAnchor="middle">S</text>
                      </>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* X-axis date labels */}
          {backtestCandles.filter((_, idx) => idx % Math.ceil(backtestCandles.length / 5) === 0).map((candle, i) => {
            const idx = backtestCandles.indexOf(candle);
            const x = getX(idx);
            const dateStr = candle.time.split(' ')[0];
            return (
              <g key={i}>
                <line x1={x} y1={paddingTop + chartHeight} x2={x} y2={paddingTop + chartHeight + 5} stroke="#374151" />
                <text x={x} y={paddingTop + chartHeight + 16} fill="#6b7280" fontSize="9" textAnchor="middle" className="font-mono">
                  {dateStr}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // If session is locked by PIN, show PIN entry first
  if (!isPinAuthorized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-3xl border border-gray-800 p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-950/40 rounded-2xl border border-orange-500/20 flex items-center justify-center mb-6">
              <TrendingUp className="text-orange-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">AI Trading Workspace</h1>
            <p className="text-sm text-gray-400 mb-8 max-w-sm">
              Your credentials are secured with client-side End-to-End Encryption (E2EE). Enter your Trading PIN to unlock this session.
            </p>
            
            <form onSubmit={handlePinAuth} className="w-full space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-left">
                  Trading Session PIN
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    maxLength={10}
                    placeholder="Enter 6-digit PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-650 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono tracking-widest text-center text-lg"
                  />
                </div>
                {pinError && <p className="text-xs text-red-500 mt-2 text-left">{pinError}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-semibold rounded-xl shadow-lg shadow-orange-950/20 transition-all flex items-center justify-center gap-2"
              >
                <Key size={18} />
                Unlock Trading Workspace
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Top Highlight strip */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-white to-green-600 w-full" />
      
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-650 rounded-xl flex items-center justify-center shadow-md">
            <TrendingUp size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Trading Workspace (Dhan API)</h1>
            <p className="text-xs text-gray-400">Build visual strategies, backtest with Yahoo Finance & execute live via Dhan</p>
          </div>
        </div>
        
        {/* Status flags */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800/80 border border-gray-700 text-xs">
            <Shield size={13} className="text-orange-500" />
            <span className="font-mono text-gray-300">E2EE ACTIVE</span>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${
            isConnected 
              ? 'bg-green-950/40 border-green-500/20 text-green-400' 
              : 'bg-red-950/40 border-red-500/20 text-red-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span>{isConnected ? `Dhan Live (Fund: ₹${fundBalance?.toLocaleString() || 0})` : 'No Active Session'}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'broker', label: '1. Connect Dhan Broker', desc: 'Secure E2EE Credentials', icon: Key },
            { id: 'strategy', label: '2. Strategy Studio', desc: 'Visual & AI Prompt Editor', icon: Code },
            { id: 'backtest', label: '3. Backtest Sandbox', desc: 'Run Candlestick simulator', icon: FileText },
            { id: 'bot', label: '4. Algo Bot Control', desc: 'Start live automated trades', icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                  activeTab === tab.id
                    ? 'bg-orange-950/30 border-orange-500/30 text-white shadow-md'
                    : 'bg-gray-900 border-gray-800 hover:border-gray-700 text-gray-400'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === tab.id ? 'bg-orange-500/20 text-orange-500' : 'bg-gray-800 text-gray-400'}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{tab.label}</h3>
                  <p className="text-xs opacity-75">{tab.desc}</p>
                </div>
                <ChevronRight size={14} className="ml-auto opacity-50" />
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 bg-gray-900 rounded-3xl border border-gray-800 p-6 flex flex-col min-h-[500px]">
          
          {/* TAB 1: CONNECT DHAN BROKER */}
          {activeTab === 'broker' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Dhan Broker Connection Settings</h2>
                <p className="text-sm text-gray-400">Configure your connection parameters securely. Plaintext secrets are E2EE encrypted inside your browser before sending to MongoDB.</p>
              </div>

              {/* Secure E2EE Notice banner */}
              <div className="bg-orange-950/10 border border-orange-500/20 rounded-2xl p-4 flex gap-3">
                <Shield className="text-orange-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-semibold text-orange-400">Zero-Knowledge Security Vault</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Decryption is performed strictly on your local browser using your 6-digit session PIN. The backend microservice caches the decrypted token in volatile memory to run execution loops.
                  </p>
                </div>
              </div>

              {/* Developer Configuration instructions */}
              <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-3 text-xs">
                <h3 className="font-semibold text-white text-sm flex items-center gap-1.5">
                  <AlertTriangle className="text-amber-500 animate-pulse" size={16} />
                  Dhan API Access Token Guide
                </h3>
                <p className="text-gray-400">
                  Dhan allows you to generate a Personal Access Token directly from the Dhan Portal:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-gray-450">
                  <li>Visit Dhan Web Portal: <a href="https://web.dhan.co" target="_blank" rel="noreferrer" className="text-orange-500 underline">web.dhan.co</a></li>
                  <li>Navigate to **API Settings** under your Profile Menu.</li>
                  <li>Copy your **Dhan Client ID** and generate a **Personal Access Token**.</li>
                  <li>Paste the values below, enter your PIN, and encrypt-save.</li>
                </ol>
              </div>

              {/* Setup form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Save API Key & Secret */}
                <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-4">
                  <h3 className="font-semibold text-white text-sm">Configure Dhan Connection</h3>
                  
                  <form onSubmit={handleSaveCredentials} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Dhan Client ID
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Client ID"
                        value={inputClientId}
                        onChange={(e) => setInputClientId(e.target.value)}
                        className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Dhan Personal Access Token
                      </label>
                      <input
                        type="password"
                        placeholder="Enter Access Token"
                        value={inputAccessToken}
                        onChange={(e) => setInputAccessToken(e.target.value)}
                        className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-655 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={saveLoading || !inputClientId || !inputAccessToken}
                      className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                    >
                      {saveLoading ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
                      E2E Encrypt & Save Config
                    </button>
                  </form>
                </div>

                {/* OAuth Connect Action */}
                <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white text-sm">Validate Dhan connection</h3>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                      Click the verification button to decrypt your token in-browser and test order placement endpoints.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleConnectDhan}
                      disabled={!isConfigured || connectLoading}
                      className={`w-full py-3 px-4 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 ${
                        isConfigured
                          ? 'bg-green-600 hover:bg-green-700 text-white active:scale-[0.99] shadow-lg shadow-green-950/20'
                          : 'bg-gray-850 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {connectLoading ? <RefreshCw size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                      Verify Connection & Sync Funds
                    </button>
                  </div>
                </div>
              </div>

              {/* Status details */}
              <div className="border-t border-gray-800 pt-6">
                <h4 className="text-sm font-semibold text-white mb-3">Stored Configuration Information</h4>
                <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Config Status:</span>
                    <span className="font-semibold text-gray-300">
                      {isConfigured ? `🔑 Configured (Client ID: ${dhanClientIdVal})` : '⚠️ Not Configured'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Synced:</span>
                    <span className="font-mono text-gray-300">{updatedAt || 'Never'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STRATEGY STUDIO */}
          {activeTab === 'strategy' && (
            <div className="space-y-6 flex-1 flex flex-col">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Strategy Studio</h2>
                <p className="text-sm text-gray-400">Design your logic using Visual components, AI prompts, or custom Python code.</p>
              </div>

              {/* Sub tabs selectors */}
              <div className="flex border-b border-gray-800">
                <button 
                  onClick={() => setStratSubTab('visual')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                    stratSubTab === 'visual' ? 'border-orange-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-350'
                  }`}
                >
                  <Sliders size={14} />
                  Visual Builder
                </button>
                <button 
                  onClick={() => setStratSubTab('ai')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                    stratSubTab === 'ai' ? 'border-orange-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-355'
                  }`}
                >
                  <Sparkles size={14} />
                  AI Prompt Editor
                </button>
                <button 
                  onClick={() => setStratSubTab('code')}
                  className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
                    stratSubTab === 'code' ? 'border-orange-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-355'
                  }`}
                >
                  <Code size={14} />
                  Python Editor
                </button>
              </div>

              {/* SUB TAB: VISUAL BUILDER */}
              {stratSubTab === 'visual' && (
                <div className="space-y-5 bg-gray-950 p-5 rounded-2xl border border-gray-850">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <Sliders size={16} className="text-orange-500" />
                    Configure Strategy Logic Blocks
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Select Indicator
                      </label>
                      <select 
                        value={visualIndicator} 
                        onChange={(e) => setVisualIndicator(e.target.value as any)}
                        className="block w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="sma">Simple Moving Average (SMA)</option>
                        <option value="ema">Exponential Moving Average (EMA)</option>
                        <option value="rsi">Relative Strength Index (RSI)</option>
                      </select>
                    </div>

                    {visualIndicator !== 'rsi' ? (
                      <>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Fast Line Period
                          </label>
                          <input 
                            type="number" 
                            value={paramFast} 
                            onChange={(e) => setParamFast(Number(e.target.value))}
                            className="block w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Slow Line Period
                          </label>
                          <input 
                            type="number" 
                            value={paramSlow} 
                            onChange={(e) => setParamSlow(Number(e.target.value))}
                            className="block w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            RSI Period
                          </label>
                          <input 
                            type="number" 
                            value={paramRsiPeriod} 
                            onChange={(e) => setParamRsiPeriod(Number(e.target.value))}
                            className="block w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Oversold / Overbought Bounds
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              placeholder="Oversold"
                              value={rsiOversold} 
                              onChange={(e) => setRsiOversold(Number(e.target.value))}
                              className="block w-1/2 px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                            <input 
                              type="number" 
                              placeholder="Overbought"
                              value={rsiOverbought} 
                              onChange={(e) => setRsiOverbought(Number(e.target.value))}
                              className="block w-1/2 px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-orange-400 bg-orange-950/20 border border-orange-500/10 p-3 rounded-lg leading-relaxed">
                    ✨ Selecting parameter combinations automatically constructs clean Python signal logic. Switch to the **Python Editor** tab to customize it manually!
                  </div>
                </div>
              )}

              {/* SUB TAB: AI GENERATOR */}
              {stratSubTab === 'ai' && (
                <div className="space-y-4 bg-gray-950 p-5 rounded-2xl border border-gray-850">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <Cpu size={16} className="text-orange-500" />
                    English to Python Strategy Compiler
                  </h3>
                  <textarea
                    placeholder="Describe your strategy..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="block w-full min-h-[80px] p-3 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <button
                    onClick={handleGenerateStrategyAI}
                    disabled={aiGenerating}
                    className="py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl text-xs transition-all flex items-center justify-center gap-2 self-start"
                  >
                    {aiGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Generate Strategy Code (Gemini)
                  </button>
                </div>
              )}

              {/* SUB TAB: EDITOR & SAVE FORM */}
              <form onSubmit={handleCreateStrategy} className="space-y-4 flex-1 flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Strategy Name
                    </label>
                    <input
                      type="text"
                      value={newStrategy.name}
                      onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
                      className="block w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Target Ticker (Yahoo)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. RELIANCE.NS, TSLA"
                      value={newStrategy.asset_symbol}
                      onChange={(e) => setNewStrategy({...newStrategy, asset_symbol: e.target.value.toUpperCase()})}
                      className="block w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Timeframe (Interval)
                    </label>
                    <select
                      value={newStrategy.timeframe}
                      onChange={(e) => setNewStrategy({...newStrategy, timeframe: e.target.value})}
                      className="block w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="1d">1 Day (NSE/BSE Daily)</option>
                      <option value="1h">60 Minutes</option>
                      <option value="15m">15 Minutes</option>
                      <option value="5m">5 Minutes</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Python strategy script code
                  </label>
                  <textarea
                    value={newStrategy.code}
                    onChange={(e) => setNewStrategy({...newStrategy, code: e.target.value})}
                    className="block w-full flex-1 min-h-[250px] p-4 bg-gray-950 border border-gray-800 rounded-xl text-xs text-green-400 font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={stratSavingLoading}
                  className="py-2.5 px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-xs transition-all self-end"
                >
                  {stratSavingLoading ? 'Saving...' : 'Save Strategy Script'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: BACKTEST SANDBOX */}
          {activeTab === 'backtest' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Backtest Sandbox (Yahoo Finance)</h2>
                <p className="text-sm text-gray-400">Evaluate strategy indicators against real Yahoo Finance candles history.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end bg-gray-950 p-5 rounded-2xl border border-gray-850">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Select Strategy
                  </label>
                  <select
                    value={selectedStrategyId}
                    onChange={(e) => {
                      setSelectedStrategyId(e.target.value);
                      const selected = strategies.find(s => s._id === e.target.value);
                      if (selected) {
                        setBacktestParams(prev => ({ ...prev, symbol: selected.asset_symbol }));
                      }
                    }}
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Choose Strategy --</option>
                    {strategies.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Ticker Ticker
                  </label>
                  <input
                    type="text"
                    value={backtestParams.symbol}
                    onChange={(e) => setBacktestParams({...backtestParams, symbol: e.target.value.toUpperCase()})}
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={backtestParams.start_date}
                    onChange={(e) => setBacktestParams({...backtestParams, start_date: e.target.value})}
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={backtestParams.end_date}
                    onChange={(e) => setBacktestParams({...backtestParams, end_date: e.target.value})}
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleRunBacktest}
                  disabled={backtestLoading || !selectedStrategyId}
                  className="py-2.5 px-4 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                >
                  {backtestLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                  Run Backtest Simulation
                </button>
              </div>

              {/* Render Candlestick Chart */}
              {backtestCandles.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <BarChart2 size={16} className="text-orange-500" />
                    Market Candlestick History Chart
                  </h3>
                  {renderCandlestickChart()}
                </div>
              )}

              {/* Backtest Results Stats */}
              {backtestResult && (
                <div className="space-y-6 pt-4 border-t border-gray-800 animate-fadeIn">
                  <h3 className="font-bold text-white text-base">Simulation Metrics Summary</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-855">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Trades</span>
                      <p className="text-xl font-bold text-white mt-1">{backtestResult.total_trades}</p>
                    </div>
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-855">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Win Ratio</span>
                      <p className="text-xl font-bold text-green-400 mt-1">{backtestResult.win_ratio.toFixed(1)}%</p>
                    </div>
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-855">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Final Capital</span>
                      <p className="text-xl font-bold text-white mt-1">₹{backtestResult.final_capital.toLocaleString()}</p>
                    </div>
                    <div className={`bg-gray-950 p-4 rounded-xl border border-gray-855 ${backtestResult.profit_loss_percent >= 0 ? 'border-green-500/20' : 'border-red-500/20'}`}>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Net P&L (%)</span>
                      <p className={`text-xl font-bold mt-1 ${backtestResult.profit_loss_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {backtestResult.profit_loss_percent >= 0 ? '+' : ''}{backtestResult.profit_loss_percent.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Trades Log */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-300">Transaction History Log</h4>
                    <div className="bg-gray-950 border border-gray-855 rounded-xl overflow-hidden text-xs max-h-[250px] overflow-y-auto font-mono">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-900 border-b border-gray-800 text-gray-500 uppercase tracking-wider text-[10px] font-semibold">
                            <th className="p-3">Time</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Execution Price</th>
                            <th className="p-3">Net Gain/Loss</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-850">
                          {backtestResult.trades_history.map((t, idx) => (
                            <tr key={idx} className="hover:bg-gray-900/50">
                              <td className="p-3 text-gray-400">{t.time}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                                  t.type === 'BUY' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'
                                }`}>
                                  {t.type}
                                </span>
                              </td>
                              <td className="p-3 text-gray-300">₹{t.price.toFixed(2)}</td>
                              <td className="p-3">
                                {t.profit_loss !== undefined ? (
                                  <span className={t.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}>
                                    {t.profit_loss >= 0 ? '₹+' : '₹'}{t.profit_loss.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-gray-600">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BOT CONTROL */}
          {activeTab === 'bot' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Algo Bot Engine Controls</h2>
                <p className="text-sm text-gray-400">Launch real-time trading loops based on your active strategies.</p>
              </div>

              {/* Controls Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-950 p-6 rounded-2xl border border-gray-850">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Trading Strategy
                  </label>
                  <select
                    disabled={isBotRunning}
                    value={selectedStrategyId}
                    onChange={(e) => setSelectedStrategyId(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    {strategies.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.asset_symbol})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Execution Mode
                  </label>
                  <select
                    disabled={isBotRunning}
                    value={botMode}
                    onChange={(e) => setBotMode(e.target.value as any)}
                    className="block w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="approval">5-min Session Approval (Email alert)</option>
                    <option value="auto">Fully Autonomous / Auto Execution</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Allocated Capital (₹)
                  </label>
                  <input
                    type="number"
                    disabled={isBotRunning}
                    value={allocatedCapital}
                    onChange={(e) => setAllocatedCapital(Number(e.target.value))}
                    className="block w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                {!isBotRunning ? (
                  <button
                    onClick={handleStartBot}
                    disabled={botLoading || !selectedStrategyId}
                    className="flex-1 py-3 px-6 bg-green-600 hover:bg-green-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {botLoading ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                    Start Dhan Algo Bot
                  </button>
                ) : (
                  <button
                    onClick={handleStopBot}
                    disabled={botLoading}
                    className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {botLoading ? <RefreshCw size={16} className="animate-spin" /> : <Square size={16} />}
                    Stop & Purge Dhan Session
                  </button>
                )}
              </div>

              {/* Bot Session Active Logs / Signals list */}
              {isBotRunning && (
                <div className="pt-6 border-t border-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base">Active Bot Logs & Pending Alerts</h3>
                    <div className="flex items-center gap-1.5 text-xs text-orange-400 bg-orange-950/20 border border-orange-500/20 px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                      <span>POLLING Dhan TICKERS ACTIVE</span>
                    </div>
                  </div>

                  {pendingSignals.length === 0 ? (
                    <div className="bg-gray-950 border border-gray-855 p-8 rounded-2xl text-center text-gray-500 text-xs">
                      No pending execution requests. Signals will alert here when parameters match.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingSignals.map((sig) => (
                        <div key={sig._id} className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider ${
                                sig.signal_type === 'BUY' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'
                              }`}>
                                {sig.signal_type} SIGNAL
                              </span>
                              <span className="text-xs font-semibold text-white">{sig.symbol}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">
                              Qty: <span className="text-gray-300 font-semibold">{sig.quantity}</span> @ price: <span className="text-gray-300 font-semibold">₹{sig.price.toFixed(2)}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-gray-500">Expires in &lt; 5m</span>
                            <button
                              onClick={() => handleSignalAction(sig.token, 'approve')}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleSignalAction(sig.token, 'reject')}
                              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-all"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
