import React, { useState, useEffect } from 'react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { encryptToken, decryptToken } from './crypto';
import { 
  TrendingUp, Shield, Key, Bot, Play, Square, FileText, 
  Lock, RefreshCw, Code, ChevronRight, Sparkles, BarChart2, Sliders, ArrowUpRight, ArrowDownRight, Layers, X
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
  const [activeTab, setActiveTab] = useState<'strategy' | 'backtest' | 'bot'>('strategy');
  const [showBrokerDropdown, setShowBrokerDropdown] = useState(false);
  const [showAgentCoach, setShowAgentCoach] = useState(() => {
    return localStorage.getItem('dhan_agent_coach_dismissed') !== 'true';
  });
  
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
    name: 'EMA Golden Cross',
    description: 'Buy when fast EMA crosses above slow EMA, sell when it crosses below.',
    code: '',
    asset_symbol: 'RELIANCE.NS',
    timeframe: '1d'
  });
  const [stratSavingLoading, setStratSavingLoading] = useState(false);

  // Asset autocomplete search state
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetSearchResults, setAssetSearchResults] = useState<any[]>([]);
  const [assetSearchLoading, setAssetSearchLoading] = useState(false);
  const [showAssetSuggestions, setShowAssetSuggestions] = useState(false);

  // Visual strategy builder parameters
  const [visualIndicator, setVisualIndicator] = useState<'sma' | 'ema' | 'rsi' | 'macd'>('ema');
  const [paramFast, setParamFast] = useState(9);
  const [paramSlow, setParamSlow] = useState(21);
  const [paramRsiPeriod, setParamRsiPeriod] = useState(14);
  const [rsiOversold, setRsiOversold] = useState(30);
  const [rsiOverbought, setRsiOverbought] = useState(70);
  const [paramMacdSignal, setParamMacdSignal] = useState(9);

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

  // SVG Chart Hover Crosshair State
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

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

  // Keypad Helper for PIN
  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setPin('');
    } else if (val === 'BACK') {
      setPin(prev => prev.slice(0, -1));
    } else {
      if (pin.length < 10) {
        setPin(prev => prev + val);
      }
    }
  };

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
      const resDetail = await apiFetch(`${API_ENDPOINTS.trading.status}/detail`);
      const dataDetail = await resDetail.json();
      if (!dataDetail.success) {
        throw new Error("No configured credentials found");
      }

      const decryptedToken = await decryptToken(
        dataDetail.encrypted_access_token,
        pin,
        dataDetail.encryption_salt,
        dataDetail.iv
      );

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

  // Predefined Visual Strategy Templates
  const applyTemplate = (type: 'ema_cross' | 'rsi_reversion' | 'macd_trend' | 'sma_cross') => {
    if (type === 'ema_cross') {
      setVisualIndicator('ema');
      setParamFast(9);
      setParamSlow(21);
      setNewStrategy({
        name: 'EMA 9/21 Golden Cross',
        description: 'Exponential Moving Average crossover strategy targeting quick momentum shifts.',
        code: '',
        asset_symbol: 'RELIANCE.NS',
        timeframe: '1d'
      });
    } else if (type === 'rsi_reversion') {
      setVisualIndicator('rsi');
      setParamRsiPeriod(14);
      setRsiOversold(30);
      setRsiOverbought(70);
      setNewStrategy({
        name: 'RSI Mean Reversion',
        description: 'Buy oversold below 30, sell overbought above 70.',
        code: '',
        asset_symbol: 'AAPL',
        timeframe: '1d'
      });
    } else if (type === 'macd_trend') {
      setVisualIndicator('macd');
      setParamFast(12);
      setParamSlow(26);
      setParamMacdSignal(9);
      setNewStrategy({
        name: 'MACD Momentum Follower',
        description: 'Standard MACD line crossing signal line to capture medium-term market swings.',
        code: '',
        asset_symbol: 'RELIANCE.NS',
        timeframe: '1d'
      });
    } else if (type === 'sma_cross') {
      setVisualIndicator('sma');
      setParamFast(50);
      setParamSlow(200);
      setNewStrategy({
        name: 'SMA Golden/Death Cross',
        description: 'Long-term trend confirmation using 50-day and 200-day Simple Moving Averages.',
        code: '',
        asset_symbol: 'INFY.NS',
        timeframe: '1d'
      });
    }
  };

  // 4. Auto-generate python code from Visual configuration
  useEffect(() => {
    if (stratSubTab !== 'visual') return;
    
    let generated = '';
    if (visualIndicator === 'sma') {
      generated = `def check_signal(df):\n    # Simple Moving Average Golden/Death Cross\n    df["sma_fast"] = df["close"].rolling(window=${paramFast}).mean()\n    df["sma_slow"] = df["close"].rolling(window=${paramSlow}).mean()\n    \n    if df["sma_fast"].iloc[-1] > df["sma_slow"].iloc[-1] and df["sma_fast"].iloc[-2] <= df["sma_slow"].iloc[-2]:\n        return "BUY"\n    elif df["sma_fast"].iloc[-1] < df["sma_slow"].iloc[-1] and df["sma_fast"].iloc[-2] >= df["sma_slow"].iloc[-2]:\n        return "SELL"\n    return None`;
    } else if (visualIndicator === 'ema') {
      generated = `def check_signal(df):\n    # Exponential Moving Average Golden/Death Cross\n    df["ema_fast"] = df["close"].ewm(span=${paramFast}, adjust=False).mean()\n    df["ema_slow"] = df["close"].ewm(span=${paramSlow}, adjust=False).mean()\n    \n    if df["ema_fast"].iloc[-1] > df["ema_slow"].iloc[-1] and df["ema_fast"].iloc[-2] <= df["ema_slow"].iloc[-2]:\n        return "BUY"\n    elif df["ema_fast"].iloc[-1] < df["ema_slow"].iloc[-1] and df["ema_fast"].iloc[-2] >= df["ema_slow"].iloc[-2]:\n        return "SELL"\n    return None`;
    } else if (visualIndicator === 'rsi') {
      generated = `def check_signal(df):\n    # Relative Strength Index (RSI) Overbought/Oversold Crossover\n    delta = df["close"].diff()\n    gain = (delta.where(delta > 0, 0)).rolling(window=${paramRsiPeriod}).mean()\n    loss = (-delta.where(delta < 0, 0)).rolling(window=${paramRsiPeriod}).mean()\n    rs = gain / (loss + 1e-10)\n    df["rsi"] = 100 - (100 / (1 + rs))\n    \n    if df["rsi"].iloc[-1] >= ${rsiOversold} and df["rsi"].iloc[-2] < ${rsiOversold}:\n        return "BUY"\n    elif df["rsi"].iloc[-1] <= ${rsiOverbought} and df["rsi"].iloc[-2] > ${rsiOverbought}:\n        return "SELL"\n    return None`;
    } else if (visualIndicator === 'macd') {
      generated = `def check_signal(df):\n    # MACD Line & Signal Line crossover indicator\n    ema_fast = df["close"].ewm(span=${paramFast}, adjust=False).mean()\n    ema_slow = df["close"].ewm(span=${paramSlow}, adjust=False).mean()\n    df["macd"] = ema_fast - ema_slow\n    df["signal"] = df["macd"].ewm(span=${paramMacdSignal}, adjust=False).mean()\n    \n    if df["macd"].iloc[-1] > df["signal"].iloc[-1] and df["macd"].iloc[-2] <= df["signal"].iloc[-2]:\n        return "BUY"\n    elif df["macd"].iloc[-1] < df["signal"].iloc[-1] and df["macd"].iloc[-2] >= df["signal"].iloc[-2]:\n        return "SELL"\n    return None`;
    }
    setNewStrategy(prev => ({ ...prev, code: generated }));
  }, [visualIndicator, paramFast, paramSlow, paramRsiPeriod, rsiOversold, rsiOverbought, paramMacdSignal, stratSubTab]);

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
        setStratSubTab('code');
        alert('Python script compiled successfully from AI prompt!');
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
        setBacktestParams(prev => ({ ...prev, symbol: newStrategy.asset_symbol }));
      }
    } catch (err) {
      alert('Failed to save strategy');
    } finally {
      setStratSavingLoading(false);
    }
  };

  // Asset search suggestion effect
  useEffect(() => {
    if (!assetSearchQuery.trim()) {
      setAssetSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setAssetSearchLoading(true);
      try {
        const res = await apiFetch(`${API_ENDPOINTS.trading.marketSearch}?q=${encodeURIComponent(assetSearchQuery)}`);
        const data = await res.json();
        if (data.success && data.results) {
          setAssetSearchResults(data.results);
        }
      } catch (err) {
        console.error("Failed to query symbols", err);
      } finally {
        setAssetSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [assetSearchQuery]);

  // Sync search input text with external newStrategy.asset_symbol updates
  useEffect(() => {
    if (newStrategy.asset_symbol !== assetSearchQuery.toUpperCase()) {
      setAssetSearchQuery(newStrategy.asset_symbol);
    }
  }, [newStrategy.asset_symbol]);

  // 7. Run Sandbox Backtest Simulation
  const handleRunBacktest = async () => {
    if (!selectedStrategyId) {
      alert("Please select or create a strategy first.");
      return;
    }
    setBacktestLoading(true);
    setBacktestResult(null);
    setBacktestCandles([]);
    setHoverIndex(null);
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

    const width = 850;
    const height = 400;
    const paddingLeft = 60;
    const paddingRight = 60;
    const paddingTop = 30;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Prices boundaries
    const prices = backtestCandles.flatMap(c => [c.open, c.high, c.low, c.close]);
    const maxPrice = Math.max(...prices) * 1.01;
    const minPrice = Math.min(...prices) * 0.99;
    const priceDiff = maxPrice - minPrice || 1;

    // Coordinate converters
    const getX = (index: number) => paddingLeft + (index / (backtestCandles.length - 1)) * chartWidth;
    const getY = (price: number) => paddingTop + chartHeight - ((price - minPrice) / priceDiff) * chartHeight;

    // Pre-calculate portfolio equity curve values
    const equityPoints: number[] = [];
    let currentCash = backtestResult ? backtestResult.initial_capital : 100000;
    let currentQty = 0;

    const tradeMap: Record<string, BacktestTrade[]> = {};
    if (backtestResult && backtestResult.trades_history) {
      backtestResult.trades_history.forEach(t => {
        const dateKey = t.time.split(' ')[0];
        if (!tradeMap[dateKey]) tradeMap[dateKey] = [];
        tradeMap[dateKey].push(t);
      });
    }

    backtestCandles.forEach((candle) => {
      const dateKey = candle.time.split(' ')[0];
      const dayTrades = tradeMap[dateKey] || [];
      
      dayTrades.forEach(t => {
        if (t.type === 'BUY') {
          const qty = t.quantity || Math.floor(currentCash / t.price);
          currentQty = qty;
          currentCash -= qty * t.price;
        } else if (t.type === 'SELL') {
          currentCash += currentQty * t.price;
          currentQty = 0;
        }
      });

      const assetVal = currentQty * candle.close;
      equityPoints.push(currentCash + assetVal);
    });

    const maxEquity = Math.max(...equityPoints, backtestResult ? backtestResult.initial_capital : 100000);
    const minEquity = Math.min(...equityPoints, backtestResult ? backtestResult.initial_capital : 100000);
    const equityDiff = maxEquity - minEquity || 1;

    const getEquityY = (val: number) => {
      return paddingTop + chartHeight - ((val - minEquity) / equityDiff) * chartHeight;
    };

    // Equity Curve Path String
    const pathD = equityPoints.map((val, idx) => {
      const prefix = idx === 0 ? 'M' : 'L';
      return `${prefix} ${getX(idx)} ${getEquityY(val)}`;
    }).join(' ');

    // Group signals by trade time for visual markers overlays
    const tradesByTime: Record<string, BacktestTrade> = {};
    if (backtestResult && backtestResult.trades_history) {
      backtestResult.trades_history.forEach(t => {
        const dateStr = t.time.split(' ')[0];
        tradesByTime[dateStr] = t;
      });
    }

    const currentHoverCandle = hoverIndex !== null ? backtestCandles[hoverIndex] : null;
    const currentHoverEquity = hoverIndex !== null ? equityPoints[hoverIndex] : null;
    const currentHoverTrade = hoverIndex !== null ? tradesByTime[backtestCandles[hoverIndex].time.split(' ')[0]] : null;

    return (
      <div className="relative bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-2xl">
        
        {/* Professional Header Status bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 bg-gray-950 p-4 rounded-xl border border-gray-800 text-xs font-mono">
          <div>
            <span className="text-gray-500 uppercase">Ticker Ticker:</span>
            <strong className="text-white block mt-0.5">{backtestParams.symbol}</strong>
          </div>
          <div>
            <span className="text-gray-500 uppercase">Price Range:</span>
            <strong className="text-white block mt-0.5">₹{minPrice.toFixed(0)} - ₹{maxPrice.toFixed(0)}</strong>
          </div>
          <div>
            <span className="text-gray-500 uppercase">Equity Performance:</span>
            <strong className="text-blue-400 block mt-0.5">₹{minEquity.toLocaleString(undefined, {maximumFractionDigits:0})} - ₹{maxEquity.toLocaleString(undefined, {maximumFractionDigits:0})}</strong>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded" />
              <span className="text-gray-400">Candles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded" />
              <span className="text-gray-400">Equity Curve</span>
            </div>
          </div>
        </div>

        {/* Hover info Tooltip strip */}
        <div className="flex justify-between items-center mb-2 px-3 text-[11px] text-gray-400 font-mono h-8 bg-gray-950 rounded-xl border border-gray-800">
          {currentHoverCandle ? (
            <div className="flex flex-wrap gap-x-6 gap-y-1 w-full justify-between items-center">
              <span>Date: <strong className="text-white">{currentHoverCandle.time.split(' ')[0]}</strong></span>
              <span>Open: <strong className="text-white">₹{currentHoverCandle.open.toFixed(2)}</strong></span>
              <span>High: <strong className="text-emerald-400">₹{currentHoverCandle.high.toFixed(2)}</strong></span>
              <span>Low: <strong className="text-rose-400">₹{currentHoverCandle.low.toFixed(2)}</strong></span>
              <span>Close: <strong className="text-white">₹{currentHoverCandle.close.toFixed(2)}</strong></span>
              <span>Equity: <strong className="text-blue-400">₹{currentHoverEquity?.toLocaleString(undefined, {maximumFractionDigits:2})}</strong></span>
              {currentHoverTrade && (
                <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${
                  currentHoverTrade.type === 'BUY' ? 'bg-emerald-950/85 text-emerald-400 border border-emerald-500/20' : 'bg-rose-950/85 text-rose-450 border border-rose-500/20'
                }`}>
                  {currentHoverTrade.type} @ ₹{currentHoverTrade.price.toFixed(2)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500 italic flex items-center gap-1.5">
              <Sparkles size={12} className="text-emerald-400" />
              Hover cursor over the chart to inspect prices, signals, and equity progression
            </span>
          )}
        </div>

        {/* SVG Drawing Canvas */}
        <div className="relative">
          <svg 
            viewBox={`0 0 ${width} ${height}`} 
            className="w-full h-auto select-none overflow-visible"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const xMouse = e.clientX - rect.left;
              const chartW = rect.width - paddingLeft - paddingRight;
              const relativeX = xMouse - paddingLeft;
              const pct = relativeX / chartW;
              let idx = Math.round(pct * (backtestCandles.length - 1));
              if (idx < 0) idx = 0;
              if (idx >= backtestCandles.length) idx = backtestCandles.length - 1;
              setHoverIndex(idx);
            }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Horizontal Grid lines (Prices) */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const p = minPrice + ratio * priceDiff;
              const y = getY(p);
              return (
                <g key={`grid-price-${i}`}>
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#111827" strokeWidth="1" />
                  <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#1f2937" strokeDasharray="3 3" />
                  <text x={paddingLeft - 10} y={y + 4} fill="#9ca3af" fontSize="9" textAnchor="end" className="font-mono">
                    ₹{p.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Right Y-Axis labels (Equity values) */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const eq = minEquity + ratio * equityDiff;
              const y = getEquityY(eq);
              return (
                <g key={`grid-equity-${i}`}>
                  <text x={width - paddingRight + 10} y={y + 4} fill="#60a5fa" fontSize="9" textAnchor="start" className="font-mono">
                    ₹{(eq / 1000).toFixed(0)}k
                  </text>
                </g>
              );
            })}

            {/* Equity Curve Line Area Fill (Gradient) */}
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity="0.15"/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity="0.0"/>
              </linearGradient>
            </defs>

            {/* Draw Area below equity curve */}
            {backtestResult && (
              <path 
                d={`${pathD} L ${getX(backtestCandles.length - 1)} ${paddingTop + chartHeight} L ${getX(0)} ${paddingTop + chartHeight} Z`}
                fill="url(#equityGradient)"
              />
            )}

            {/* Draw Equity Curve line path */}
            {backtestResult && (
              <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.8" />
            )}

            {/* Candles Loop */}
            {backtestCandles.map((candle, idx) => {
              const x = getX(idx);
              const yOpen = getY(candle.open);
              const yClose = getY(candle.close);
              const yHigh = getY(candle.high);
              const yLow = getY(candle.low);

              const isGreen = candle.close >= candle.open;
              const candleColor = isGreen ? '#10b981' : '#ef4444';
              const candleWidth = Math.max(2.5, (chartWidth / backtestCandles.length) * 0.7);

              const dateOnly = candle.time.split(' ')[0];
              const signalTrade = tradesByTime[dateOnly];

              return (
                <g key={idx}>
                  {/* High/Low wick line */}
                  <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={candleColor} strokeWidth="1.5" />

                  {/* Open/Close body rect */}
                  <rect 
                    x={x - candleWidth / 2} 
                    y={Math.min(yOpen, yClose)} 
                    width={candleWidth} 
                    height={Math.max(1.5, Math.abs(yOpen - yClose))} 
                    fill={candleColor} 
                  />

                  {/* Buy / Sell signal Overlay badges */}
                  {signalTrade && (
                    <g>
                      {signalTrade.type === 'BUY' ? (
                        <>
                          <circle cx={x} cy={yLow + 14} r="7" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                          <text x={x} y={yLow + 17} fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle">▲</text>
                        </>
                      ) : (
                        <>
                          <circle cx={x} cy={yHigh - 14} r="7" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
                          <text x={x} y={yHigh - 11} fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="middle">▼</text>
                        </>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Interactive Crosshair Tracking lines */}
            {hoverIndex !== null && (
              <>
                {/* Vertical Cursor line */}
                <line 
                  x1={getX(hoverIndex)} 
                  y1={paddingTop} 
                  x2={getX(hoverIndex)} 
                  y2={paddingTop + chartHeight} 
                  stroke="#4b5563" 
                  strokeDasharray="2 2" 
                  strokeWidth="1.2"
                />
                {/* Horizontal Cursor line */}
                <line 
                  x1={paddingLeft} 
                  y1={getY(backtestCandles[hoverIndex].close)} 
                  x2={width - paddingRight} 
                  y2={getY(backtestCandles[hoverIndex].close)} 
                  stroke="#4b5563" 
                  strokeDasharray="2 2" 
                  strokeWidth="1.2"
                />
                {/* Visual marker at coordinates */}
                <circle 
                  cx={getX(hoverIndex)} 
                  cy={getY(backtestCandles[hoverIndex].close)} 
                  r="5" 
                  fill="#10b981" 
                  stroke="#ffffff" 
                  strokeWidth="1.5"
                  className="animate-ping"
                />
                <circle 
                  cx={getX(hoverIndex)} 
                  cy={getY(backtestCandles[hoverIndex].close)} 
                  r="4" 
                  fill="#10b981" 
                  stroke="#ffffff" 
                  strokeWidth="1.5"
                />
              </>
            )}

            {/* X-axis date labels */}
            {backtestCandles.filter((_, idx) => idx % Math.ceil(backtestCandles.length / 5) === 0).map((candle, i) => {
              const idx = backtestCandles.indexOf(candle);
              const x = getX(idx);
              const dateStr = candle.time.split(' ')[0];
              return (
                <g key={i}>
                  <line x1={x} y1={paddingTop + chartHeight} x2={x} y2={paddingTop + chartHeight + 5} stroke="#374151" />
                  <text x={x} y={paddingTop + chartHeight + 16} fill="#9ca3af" fontSize="9" textAnchor="middle" className="font-mono">
                    {dateStr}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  // If session is locked by PIN, show Vault Unlock Screen
  if (!isPinAuthorized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-905 rounded-2xl border border-gray-800 p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="flex flex-col items-center text-center relative z-10">
            <div className="w-16 h-16 bg-emerald-950/20 rounded-2xl border border-emerald-500/30 flex items-center justify-center mb-6">
              <Lock className="text-emerald-400" size={28} />
            </div>
            
            <h1 className="text-xl font-bold text-white tracking-tight mb-2">SECURITY VAULT</h1>
            
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-950 border border-gray-800/80 text-[10px] text-gray-500 font-mono tracking-wider mb-6">
              <Shield size={10} className="text-emerald-400" />
              <span>ZERO KNOWLEDGE E2EE ACTIVE</span>
            </div>

            <p className="text-xs text-gray-400 mb-6 max-w-xs leading-relaxed">
              Your broker credentials are encrypted locally in your browser. Enter your 6-digit session PIN to unlock your secure key.
            </p>
            
            {/* Password input display */}
            <div className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 px-4 font-mono tracking-widest text-center text-lg text-white font-bold h-12 flex items-center justify-center mb-6">
              {pin ? '•'.repeat(pin.length) : <span className="text-gray-650 text-xs tracking-normal">Enter PIN</span>}
            </div>

            {pinError && <p className="text-xs text-red-400 mb-4">{pinError}</p>}

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-3 w-full mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', '⌫'].map((key) => {
                const isAction = key === 'CLR' || key === '⌫';
                const actionType = key === 'CLR' ? 'CLEAR' : 'BACK';
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => isAction ? handleKeypadPress(actionType) : handleKeypadPress(key)}
                    className={`py-3 rounded-xl font-mono text-sm font-semibold border transition-all active:scale-95 flex items-center justify-center ${
                      isAction
                        ? 'bg-gray-800 border-gray-800 text-gray-400 hover:text-white'
                        : 'bg-gray-950 border-gray-800 hover:border-gray-700 text-white hover:bg-gray-800'
                    }`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handlePinAuth}
              disabled={pin.length < 6}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-800 disabled:text-gray-650 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
            >
              <Key size={14} />
              Unlock Trading Studio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans select-none antialiased">
      {/* Top Border strip */}
      <div className="h-0.5 bg-emerald-500/20 w-full" />
      
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/40 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white leading-none">Dhan Studio</h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 border border-gray-800 text-gray-400 font-mono">v1.2</span>
            </div>
            <p className="hidden md:block text-xs text-gray-400 mt-1">Quantitative Strategy Composer & Sandbox</p>
          </div>
        </div>
        
        {/* Status flags */}
        <div className="flex items-center gap-3 flex-wrap relative">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-[10px] font-mono">
            <Shield size={12} className="text-emerald-400" />
            <span className="text-gray-400">E2EE VAULT</span>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowBrokerDropdown(!showBrokerDropdown)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-mono transition-all hover:brightness-110 active:scale-95 ${
                isConnected 
                  ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                  : 'bg-red-950/20 border-red-500/20 text-red-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span>{isConnected ? `CONNECTED: ₹${fundBalance?.toLocaleString() || 0}` : 'DISCONNECTED'}</span>
              <ChevronRight size={12} className={`transition-all ${showBrokerDropdown ? 'rotate-90' : ''}`} />
            </button>

            {showBrokerDropdown && (
              <div className="absolute right-0 top-10 mt-1 w-96 bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-2xl z-50 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Key size={14} className="text-emerald-400" />
                    Dhan Connection Settings
                  </h3>
                  <button 
                    type="button"
                    onClick={() => setShowBrokerDropdown(false)}
                    className="text-gray-500 hover:text-white text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-4 text-[11px]">
                  {/* Secure E2EE Notice banner */}
                  <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-xl p-3 flex gap-2.5">
                    <Shield className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      Decryption is client-side. Access tokens are cached strictly in server RAM loops and cleared upon disconnect.
                    </p>
                  </div>

                  {/* Stored credentials form */}
                  <form onSubmit={handleSaveCredentials} className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Dhan Client ID
                      </label>
                      <input
                        type="text"
                        placeholder="Enter Client ID"
                        value={inputClientId}
                        onChange={(e) => setInputClientId(e.target.value)}
                        className="block w-full px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Dhan Access Token
                      </label>
                      <input
                        type="password"
                        placeholder="Enter Access Token"
                        value={inputAccessToken}
                        onChange={(e) => setInputAccessToken(e.target.value)}
                        className="block w-full px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 font-mono"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={saveLoading || !inputClientId || !inputAccessToken}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      {saveLoading ? <RefreshCw size={12} className="animate-spin" /> : <Lock size={12} />}
                      Save E2EE Credentials
                    </button>
                  </form>

                  {/* Connect / Unlock session */}
                  <div className="border-t border-gray-800 pt-3 space-y-3">
                    <button
                      type="button"
                      onClick={handleConnectDhan}
                      disabled={!isConfigured || connectLoading}
                      className={`w-full py-2 px-3 font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        isConfigured
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
                          : 'bg-gray-800 border border-gray-800 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {connectLoading ? <RefreshCw size={12} className="animate-spin" /> : <TrendingUp size={12} />}
                      Verify & Sync Live Session
                    </button>
                  </div>

                  {/* Status details */}
                  <div className="border-t border-gray-800 pt-3 space-y-1.5 font-mono text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vault Configuration:</span>
                      <span className="font-semibold text-gray-300">
                        {isConfigured ? `🔒 SECURE KEY (ID: ${dhanClientIdVal})` : '⚠️ NOT CONFIGURED'}
                      </span>
                    </div>
                    {updatedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Staged:</span>
                        <span className="text-gray-300">{updatedAt}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 h-fit scrollbar-none mb-2 lg:mb-0">
          {[
            { id: 'strategy', label: 'Strategy Composer', icon: Code },
            { id: 'backtest', label: 'Backtest Sandbox', icon: FileText },
            { id: 'bot', label: 'Live Bot Control', icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-full lg:rounded-xl border transition-all flex items-center justify-center lg:justify-start gap-2 text-xs font-semibold ${
                  activeTab === tab.id
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 shadow-md'
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-900/60'
                }`}
              >
                <Icon size={14} className={activeTab === tab.id ? 'text-emerald-400' : 'text-gray-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 bg-gray-900 rounded-2xl border border-gray-800 p-6 flex flex-col min-h-[500px] shadow-xl">
          {/* TAB 1: STRATEGY COMPOSER */}
          {activeTab === 'strategy' && (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-gray-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">Strategy Composer</h2>
                  <p className="text-xs text-gray-400 font-medium">Configure rules, test templates, or compile custom strategies with AI assistant.</p>
                </div>
                {/* Templates Quick Selector */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { type: 'ema_cross', label: 'EMA Crossover' },
                    { type: 'rsi_reversion', label: 'RSI Reversion' },
                    { type: 'macd_trend', label: 'MACD Momentum' },
                    { type: 'sma_cross', label: 'SMA Golden Cross' },
                  ].map((tmpl) => (
                    <button
                      key={tmpl.type}
                      type="button"
                      onClick={() => applyTemplate(tmpl.type as any)}
                      className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-white text-[10px] font-semibold border border-gray-800 transition-all active:scale-95"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                {/* Column 1: Configuration Form */}
                <div className="space-y-5 bg-gray-950 p-5 rounded-xl border border-gray-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 border-b border-gray-800 pb-2">
                    <Sliders size={14} className="text-emerald-400" />
                    1. Configuration Parameters
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Strategy Name
                      </label>
                      <input
                        type="text"
                        value={newStrategy.name}
                        onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
                        className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500/50 font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Timeframe Interval
                      </label>
                      <select
                        value={newStrategy.timeframe}
                        onChange={(e) => setNewStrategy({...newStrategy, timeframe: e.target.value})}
                        className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      >
                        <option value="1d">1 Day</option>
                        <option value="1h">60 Minutes</option>
                        <option value="15m">15 Minutes</option>
                        <option value="5m">5 Minutes</option>
                      </select>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Target Ticker (Yahoo Symbol)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search asset symbol..."
                        value={assetSearchQuery || newStrategy.asset_symbol}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAssetSearchQuery(val);
                          setNewStrategy({...newStrategy, asset_symbol: val.toUpperCase()});
                          setShowAssetSuggestions(true);
                        }}
                        onFocus={() => setShowAssetSuggestions(true)}
                        onBlur={() => {
                          setTimeout(() => setShowAssetSuggestions(false), 200);
                        }}
                        className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-700 focus:outline-none focus:border-emerald-500/50 font-mono font-medium"
                        required
                      />
                      {assetSearchLoading && (
                        <div className="absolute right-3 top-2.5">
                          <RefreshCw className="animate-spin text-emerald-400" size={12} />
                        </div>
                      )}
                    </div>

                    {showAssetSuggestions && assetSearchResults.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-gray-950 border border-gray-800 rounded-lg shadow-2xl z-50 font-mono divide-y divide-gray-900">
                        {assetSearchResults.map((res, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setNewStrategy({ ...newStrategy, asset_symbol: res.symbol });
                              setAssetSearchQuery(res.symbol);
                              setShowAssetSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-900/60 transition-all flex justify-between items-center text-xs"
                          >
                            <div>
                              <p className="font-bold text-white leading-none mb-0.5">{res.symbol}</p>
                              <p className="text-[10px] text-gray-500 truncate max-w-xs">{res.name}</p>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-900 text-gray-400 font-bold shrink-0">
                              {res.exchange}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Indicator Parameters Sliders */}
                  <div className="space-y-4 pt-2 border-t border-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Indicator Type</span>
                      <select 
                        value={visualIndicator} 
                        onChange={(e) => setVisualIndicator(e.target.value as any)}
                        className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-[10px] text-gray-300 focus:outline-none"
                      >
                        <option value="sma">Simple Moving Average (SMA)</option>
                        <option value="ema">Exponential Moving Average (EMA)</option>
                        <option value="rsi">Relative Strength Index (RSI)</option>
                        <option value="macd">MACD Momentum</option>
                      </select>
                    </div>

                    {/* Parameters inputs depending on selection */}
                    {(visualIndicator === 'sma' || visualIndicator === 'ema' || visualIndicator === 'macd') && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-1">
                            <span>Fast Period</span>
                            <span className="text-white font-bold">{paramFast}</span>
                          </div>
                          <input 
                            type="range" 
                            min="3" 
                            max="100"
                            value={paramFast} 
                            onChange={(e) => setParamFast(Number(e.target.value))}
                            className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-1">
                            <span>Slow Period</span>
                            <span className="text-white font-bold">{paramSlow}</span>
                          </div>
                          <input 
                            type="range" 
                            min="10" 
                            max="300"
                            value={paramSlow} 
                            onChange={(e) => setParamSlow(Number(e.target.value))}
                            className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>
                      </div>
                    )}

                    {visualIndicator === 'rsi' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-1">
                            <span>RSI Lookback</span>
                            <span className="text-white font-bold">{paramRsiPeriod}</span>
                          </div>
                          <input 
                            type="range" 
                            min="2" 
                            max="50"
                            value={paramRsiPeriod} 
                            onChange={(e) => setParamRsiPeriod(Number(e.target.value))}
                            className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] text-gray-505 uppercase tracking-wider mb-1">Thresholds (L/H)</span>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={rsiOversold} 
                              onChange={(e) => setRsiOversold(Number(e.target.value))}
                              className="w-1/2 px-2 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-white text-center focus:outline-none"
                            />
                            <input 
                              type="number" 
                              value={rsiOverbought} 
                              onChange={(e) => setRsiOverbought(Number(e.target.value))}
                              className="w-1/2 px-2 py-1 bg-gray-900 border border-gray-800 rounded text-xs text-white text-center focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {visualIndicator === 'macd' && (
                      <div className="pt-2 border-t border-gray-800">
                        <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-1">
                          <span>MACD Signal Period</span>
                          <span className="text-white font-bold">{paramMacdSignal}</span>
                        </div>
                        <input 
                          type="range" 
                          min="3" 
                          max="50"
                          value={paramMacdSignal} 
                          onChange={(e) => setParamMacdSignal(Number(e.target.value))}
                          className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: AI Code Generation & Save Script */}
                <div className="space-y-4">
                  {/* Gemini AI assistant box */}
                  <div className="bg-gray-950 border border-gray-800 p-4 rounded-xl space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-400 animate-pulse" />
                      AI Strategy Assistant
                    </h4>
                    <textarea
                      placeholder="Describe trading rules in plain English (e.g. buy when RSI drops below 25, sell when MACD signal line crosses)..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="block w-full min-h-[75px] p-3 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateStrategyAI}
                      disabled={aiGenerating}
                      className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:bg-gray-850"
                    >
                      {aiGenerating ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      Compile Code with Gemini
                    </button>
                  </div>

                  {/* Code Editor and Save Form */}
                  <form onSubmit={handleCreateStrategy} className="space-y-4 flex flex-col">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                          Python Strategy Script
                        </label>
                        <span className="text-[9px] text-gray-600 font-mono">Syntax-ready</span>
                      </div>
                      <textarea
                        value={newStrategy.code}
                        onChange={(e) => setNewStrategy({...newStrategy, code: e.target.value})}
                        className="block w-full min-h-[220px] p-3 bg-gray-950 border border-gray-800 rounded-xl text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500/50 leading-relaxed"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={stratSavingLoading}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:bg-gray-800"
                    >
                      {stratSavingLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                      Save Strategy Script
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BACKTEST SANDBOX */}
          {activeTab === 'backtest' && (
            <div className="space-y-6">
              <div className="border-b border-gray-800 pb-4">
                <h2 className="text-lg font-bold text-white mb-1">Backtest Sandbox</h2>
                <p className="text-xs text-gray-400">Simulate strategy performance indicators against historical Yahoo Finance records.</p>
              </div>

              {/* Horizontal configuration parameters header panel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end bg-gray-950 p-5 rounded-2xl border border-gray-800">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
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
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">-- Choose Strategy --</option>
                    {strategies.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Ticker Symbol
                  </label>
                  <input
                    type="text"
                    value={backtestParams.symbol}
                    onChange={(e) => setBacktestParams({...backtestParams, symbol: e.target.value.toUpperCase()})}
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500/50 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={backtestParams.start_date}
                    onChange={(e) => setBacktestParams({...backtestParams, start_date: e.target.value})}
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={backtestParams.end_date}
                    onChange={(e) => setBacktestParams({...backtestParams, end_date: e.target.value})}
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>

                <button
                  onClick={handleRunBacktest}
                  disabled={backtestLoading || !selectedStrategyId}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                >
                  {backtestLoading ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                  Run Backtest
                </button>
              </div>

              {/* Render Candlestick Chart */}
              {backtestCandles.length > 0 && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart2 size={15} className="text-emerald-400" />
                    Market Candlesticks & Equity Curve
                  </h3>
                  {renderCandlestickChart()}
                </div>
              )}

              {/* Backtest Results Stats */}
              {backtestResult && (
                <div className="space-y-6 pt-4 border-t border-gray-800 animate-fadeIn">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">Total Trades</span>
                      <p className="text-base font-bold text-white mt-1.5">{backtestResult.total_trades}</p>
                    </div>
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">Win Ratio</span>
                      <p className="text-base font-bold text-green-400 mt-1.5">{backtestResult.win_ratio.toFixed(1)}%</p>
                    </div>
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">Final Capital</span>
                      <p className="text-base font-bold text-white mt-1.5">₹{backtestResult.final_capital.toLocaleString()}</p>
                    </div>
                    <div className={`bg-gray-950 p-4 rounded-xl border ${backtestResult.profit_loss_percent >= 0 ? 'border-green-500/20' : 'border-red-500/20'}`}>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">Net Returns (%)</span>
                      <p className={`text-base font-bold mt-1.5 flex items-center gap-1 ${backtestResult.profit_loss_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {backtestResult.profit_loss_percent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {backtestResult.profit_loss_percent >= 0 ? '+' : ''}{backtestResult.profit_loss_percent.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Trades Log */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Transaction Ledger History</h4>
                    <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden text-xs max-h-[250px] overflow-y-auto font-mono">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-900 border-b border-gray-800 text-gray-500 uppercase tracking-wider text-[9px] font-bold">
                            <th className="p-3">Execution Time</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Price</th>
                            <th className="p-3">Units</th>
                            <th className="p-3">Realized P&L</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {backtestResult.trades_history.map((t, idx) => (
                            <tr key={idx} className="hover:bg-gray-900/40">
                              <td className="p-3 text-gray-400">{t.time}</td>
                              <td className="p-3">
                                <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] border ${
                                  t.type === 'BUY' 
                                    ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/10' 
                                    : 'bg-rose-950/50 text-rose-450 border-rose-500/10'
                                  }`}>
                                  {t.type}
                                </span>
                              </td>
                              <td className="p-3 text-gray-350">₹{t.price.toFixed(2)}</td>
                              <td className="p-3 text-gray-400">{t.quantity || 1}</td>
                              <td className="p-3">
                                {t.profit_loss !== undefined ? (
                                  <span className={`font-bold ${t.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {t.profit_loss >= 0 ? '+' : ''}₹{t.profit_loss.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">-</span>
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

          {/* TAB 3: BOT CONTROL */}
          {activeTab === 'bot' && (
            <div className="space-y-6">
              <div className="border-b border-gray-800 pb-4">
                <h2 className="text-lg font-bold text-white mb-1">Algo Bot Controls</h2>
                <p className="text-xs text-gray-400">Deploy live trading loop tasks listening to your active strategy callback.</p>
              </div>

              {/* Controls Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-950 p-5 rounded-xl border border-gray-800">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Active Strategy
                  </label>
                  <select
                    disabled={isBotRunning}
                    value={selectedStrategyId}
                    onChange={(e) => setSelectedStrategyId(e.target.value)}
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none"
                  >
                    {strategies.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.asset_symbol})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Execution Mode
                  </label>
                  <select
                    disabled={isBotRunning}
                    value={botMode}
                    onChange={(e) => setBotMode(e.target.value as any)}
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="approval">5-min Session Approval (Email alert)</option>
                    <option value="auto">Fully Autonomous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Allocated Capital (₹)
                  </label>
                  <input
                    type="number"
                    disabled={isBotRunning}
                    value={allocatedCapital}
                    onChange={(e) => setAllocatedCapital(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                {!isBotRunning ? (
                  <button
                    onClick={handleStartBot}
                    disabled={botLoading || !selectedStrategyId}
                    className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {botLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                    Start Live Dhan Algo Bot
                  </button>
                ) : (
                  <button
                    onClick={handleStopBot}
                    disabled={botLoading}
                    className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {botLoading ? <RefreshCw size={14} className="animate-spin" /> : <Square size={14} />}
                    Stop & Purge Session Credentials
                  </button>
                )}
              </div>

              {/* Bot Session Active Logs / Signals list */}
              {isBotRunning && (
                <div className="pt-6 border-t border-gray-800 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={14} className="text-emerald-400" />
                      Live Execution Ledger
                    </h3>
                    <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 px-2.5 py-0.5 rounded font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>POLLING Dhan TICKERS ACTIVE</span>
                    </div>
                  </div>

                  {pendingSignals.length === 0 ? (
                    <div className="bg-gray-950 border border-gray-800 p-8 rounded-xl text-center text-gray-500 text-xs">
                      No pending execution requests. Signals will alert here when parameters match.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingSignals.map((sig) => (
                        <div key={sig._id} className="bg-gray-950 border border-gray-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded font-bold text-[9px] border ${
                                sig.signal_type === 'BUY' 
                                  ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/10' 
                                  : 'bg-rose-950/50 text-rose-450 border-rose-500/10'
                              }`}>
                                {sig.signal_type}
                              </span>
                              <span className="text-xs font-bold text-white">{sig.symbol}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1.5">
                              Units: <span className="text-gray-300 font-semibold">{sig.quantity}</span> @ Price: <span className="text-gray-350 font-semibold">₹{sig.price.toFixed(2)}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-gray-500">Exp &lt; 5m</span>
                            <button
                              onClick={() => handleSignalAction(sig.token, 'approve')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleSignalAction(sig.token, 'reject')}
                              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
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

      {/* Dhan AI Agent Coach Popover */}
      {showAgentCoach ? (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border border-emerald-500/20">
                <img src="/agents/agent-trading.jpg" alt="Dhana" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Dhana - Trading Assistant</h3>
                <span className="text-[10px] text-emerald-400 font-medium tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online & Ready to Teach
                </span>
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.setItem('dhan_agent_coach_dismissed', 'true');
                setShowAgentCoach(false);
              }}
              className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="bg-emerald-950/10 border border-emerald-500/10 rounded-2xl p-4 text-xs text-gray-300 leading-relaxed">
            <p className="font-medium text-white mb-2">👋 Welcome to your Dhan Trading workspace!</p>
            <p>I am <strong className="text-emerald-400">Dhana</strong>, your AI Quantitative Trading employee. I automate the composition, verification, and live execution of your trading ideas. Here is what I can do:</p>
            
            <ul className="mt-3 space-y-2.5">
              <li className="flex gap-2">
                <span className="text-emerald-500 font-bold">1.</span>
                <div>
                  <strong className="text-white">Compose Strategies</strong>: Define visual variables (MACD, RSI, EMA) or generate custom Python signals using my integrated Gemini AI engine.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 font-bold">2.</span>
                <div>
                  <strong className="text-white">Run Backtests</strong>: Verify custom code against historical Yahoo Finance candles instantly to see logs and P&L charts.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 font-bold">3.</span>
                <div>
                  <strong className="text-white">Deploy Live Order Loops</strong>: Connect your secure Dhan API token at the top right to execute signals in real time!
                </div>
              </li>
            </ul>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => {
                localStorage.setItem('dhan_agent_coach_dismissed', 'true');
                setShowAgentCoach(false);
              }}
              className="flex-1 py-2 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={() => setShowAgentCoach(false)}
              className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/10 transition-colors"
            >
              Let's Start!
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAgentCoach(true)}
          title="Dhana (AI Trading Employee Coach)"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500/30 hover:border-emerald-500 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 bg-gray-900 group"
        >
          <img src="/agents/agent-trading.jpg" alt="Dhana" className="w-full h-full object-cover" />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-gray-900 rounded-full animate-pulse" />
        </button>
      )}
    </div>
  );
}
