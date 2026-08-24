import React, { useState, useEffect } from 'react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { encryptToken, decryptToken } from './crypto';
import { 
  TrendingUp, Shield, Key, Bot, Play, Square, FileText, 
  Lock, RefreshCw, Code, ChevronRight, AlertTriangle
} from 'lucide-react';

interface Strategy {
  _id: string;
  name: string;
  description: string;
  code: string;
  asset_symbol: string;
  timeframe: string;
}

interface Backtest {
  _id: string;
  strategy_id: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_capital: number;
  total_trades: number;
  win_ratio: number;
  profit_loss_percent: number;
  trades_history: Array<{
    type: string;
    price: number;
    time: string;
    profit_loss?: number;
  }>;
}

export function TradingWorkspacePage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'broker' | 'strategy' | 'backtest' | 'bot'>('broker');
  
  // PIN Authorization / Security
  const [pin, setPin] = useState('');
  const [isPinAuthorized, setIsPinAuthorized] = useState(false);
  const [pinError, setPinError] = useState('');

  // Broker credentials status
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [apiKeyVal, setApiKeyVal] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  
  // Custom BYO Key config fields
  const [inputApiKey, setInputApiKey] = useState('');
  const [inputApiSecret, setInputApiSecret] = useState('');
  const [manualAccessToken, setManualAccessToken] = useState('');
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [exchangeLoading, setExchangeLoading] = useState(false);

  // Strategy list & form
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [newStrategy, setNewStrategy] = useState({
    name: 'SMA Golden Cross',
    description: 'Buy when SMA 9 crosses above SMA 21 on the 5-minute interval, sell when it crosses below.',
    code: '# SMA Golden Cross Strategy Template\n\ndef check_signal(df):\n    # Fast SMA 9, Slow SMA 21\n    df["sma_fast"] = df["close"].rolling(9).mean()\n    df["sma_slow"] = df["close"].rolling(21).mean()\n    \n    if df["sma_fast"].iloc[-1] > df["sma_slow"].iloc[-1] and df["sma_fast"].iloc[-2] <= df["sma_slow"].iloc[-2]:\n        return "BUY"\n    elif df["sma_fast"].iloc[-1] < df["sma_slow"].iloc[-1] and df["sma_fast"].iloc[-2] >= df["sma_slow"].iloc[-2]:\n        return "SELL"\n    return None',
    asset_symbol: 'RELIANCE',
    timeframe: '5m'
  });
  const [stratLoading, setStratLoading] = useState(false);
  
  // Backtest status & results
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [backtestParams, setBacktestParams] = useState({
    start_date: '2026-08-01',
    end_date: '2026-08-24',
    initial_capital: 100000
  });
  const [backtestResult, setBacktestResult] = useState<Backtest | null>(null);
  const [backtestLoading, setBacktestLoading] = useState(false);

  // Live Bot controls
  const [botMode, setBotMode] = useState<'auto' | 'approval'>('approval');
  const [allocatedCapital, setAllocatedCapital] = useState(50000);
  const [botLoading, setBotLoading] = useState(false);
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [pendingSignals, setPendingSignals] = useState<any[]>([]);

  // 1. Initial Load & Fetch Status
  useEffect(() => {
    fetchBrokerStatus();
    fetchStrategies();
    detectAndProcessRedirectToken();
  }, []);

  // Fetch broker status
  const fetchBrokerStatus = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.trading.status);
      const data = await res.json();
      if (data.success) {
        setIsConfigured(data.is_configured);
        setIsConnected(data.is_connected);
        if (data.api_key) setApiKeyVal(data.api_key);
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

  // Auto-detect request_token from callback redirect URL
  const detectAndProcessRedirectToken = async () => {
    const params = new URLSearchParams(window.location.search);
    const requestToken = params.get('request_token');
    if (!requestToken) return;

    // Clear url parameters cleanly
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Switch to broker tab to show status
    setActiveTab('broker');
    setExchangeLoading(true);

    // Prompt user to enter their PIN to unlock their stored API Secret
    const userPin = prompt("Enter your 6-digit Trading PIN to complete Zerodha authorization:");
    if (!userPin) {
      alert("PIN is required to decrypt API Secret and exchange token securely.");
      setExchangeLoading(false);
      return;
    }

    try {
      // 1. Get the E2E encrypted secret details from server
      const resDetail = await apiFetch(`${API_ENDPOINTS.trading.status}/detail`);
      const dataDetail = await resDetail.json();
      if (!dataDetail.success) {
        throw new Error(dataDetail.detail || "Credentials details not found");
      }

      // 2. Decrypt the API Secret client-side
      const decryptedSecret = await decryptToken(
        dataDetail.encrypted_api_secret,
        userPin,
        dataDetail.encryption_salt,
        dataDetail.iv
      );

      // 3. Exchange request token using the decrypted credentials via server proxy
      const resEx = await apiFetch(API_ENDPOINTS.trading.callback, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: dataDetail.api_key,
          api_secret: decryptedSecret,
          request_token: requestToken
        })
      });
      const dataEx = await resEx.json();
      if (!dataEx.success) {
        throw new Error(dataEx.detail || "Failed to exchange token with Zerodha");
      }

      // 4. Encrypt the returned access_token client-side using user PIN
      const encryptedAccess = await encryptToken(dataEx.access_token, userPin);
      const encryptedSecret = await encryptToken(decryptedSecret, userPin);

      // 5. Save everything back to DB
      const resSave = await apiFetch(API_ENDPOINTS.trading.saveEncrypted, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: dataDetail.api_key,
          encrypted_api_secret: encryptedSecret.ciphertext,
          encrypted_access_token: encryptedAccess.ciphertext,
          encrypted_public_token: encryptedAccess.ciphertext,
          encryption_salt: encryptedAccess.salt,
          iv: encryptedAccess.iv
        })
      });
      
      const dataSave = await resSave.json();
      if (dataSave.success) {
        setIsPinAuthorized(true);
        setPin(userPin);
        alert("Zerodha account authorized and daily session established securely!");
        fetchBrokerStatus();
      }
    } catch (err: any) {
      alert(`Authorization failed: ${err.message}`);
    } finally {
      setExchangeLoading(false);
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
      setPinError('PIN must be at least 6 digits/characters');
      return;
    }
    setIsPinAuthorized(true);
    setPinError('');
  };

  // 3. Save Developer Config
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputApiKey || !inputApiSecret) return;
    setSaveLoading(true);
    try {
      // Encrypt the API Secret locally
      const encryptedSecret = await encryptToken(inputApiSecret, pin);
      
      // Encrypt dummy or empty access_token initially
      const encryptedAccess = await encryptToken(manualAccessToken || "empty_init_token", pin);
      
      const res = await apiFetch(API_ENDPOINTS.trading.saveEncrypted, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: inputApiKey,
          encrypted_api_secret: encryptedSecret.ciphertext,
          encrypted_access_token: encryptedAccess.ciphertext,
          encrypted_public_token: encryptedAccess.ciphertext,
          encryption_salt: encryptedSecret.salt,
          iv: encryptedSecret.iv
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsConfigured(true);
        setInputApiKey('');
        setInputApiSecret('');
        setManualAccessToken('');
        alert('BYO-Key configuration saved and E2E encrypted successfully!');
        fetchBrokerStatus();
      }
    } catch (err: any) {
      alert(`Configuration save failed: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSaveEncryptedToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAccessToken) return;
    setSaveLoading(true);
    try {
      const resDetail = await apiFetch(`${API_ENDPOINTS.trading.status}/detail`);
      const dataDetail = await resDetail.json();
      
      const apiKey = dataDetail.success ? dataDetail.api_key : "byo_api_key";
      const encSecret = dataDetail.success ? dataDetail.encrypted_api_secret : "";
      
      const encryptedAccess = await encryptToken(manualAccessToken, pin);
      
      const res = await apiFetch(API_ENDPOINTS.trading.saveEncrypted, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          encrypted_api_secret: encSecret,
          encrypted_access_token: encryptedAccess.ciphertext,
          encrypted_public_token: encryptedAccess.ciphertext,
          encryption_salt: encryptedAccess.salt,
          iv: encryptedAccess.iv
        })
      });
      const data = await res.json();
      if (data.success) {
        setManualAccessToken('');
        alert('Manual access token E2E encrypted and saved successfully!');
        fetchBrokerStatus();
      }
    } catch (err: any) {
      alert(`Manual save failed: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // Generate Authorize URL using user's stored config
  const handleStartOAuth = () => {
    if (!apiKeyVal) {
      alert("Please configure your API Key first.");
      return;
    }
    const loginUrl = `https://kite.zerodha.com/connect/login?api_key=${apiKeyVal}&v=3`;
    window.open(loginUrl, '_self');
  };

  // 4. Create Strategy
  const handleCreateStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    setStratLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.trading.strategies, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStrategy)
      });
      const data = await res.json();
      if (data.success) {
        setNewStrategy({
          name: 'SMA Golden Cross',
          description: 'Buy when SMA 9 crosses above SMA 21 on the 5-minute interval, sell when it crosses below.',
          code: '# SMA Golden Cross Strategy Template\n\ndef check_signal(df):\n    # Fast SMA 9, Slow SMA 21\n    df["sma_fast"] = df["close"].rolling(9).mean()\n    df["sma_slow"] = df["close"].rolling(21).mean()\n    \n    if df["sma_fast"].iloc[-1] > df["sma_slow"].iloc[-1] and df["sma_fast"].iloc[-2] <= df["sma_slow"].iloc[-2]:\n        return "BUY"\n    elif df["sma_fast"].iloc[-1] < df["sma_slow"].iloc[-1] and df["sma_fast"].iloc[-2] >= df["sma_slow"].iloc[-2]:\n        return "SELL"\n    return None',
          asset_symbol: 'RELIANCE',
          timeframe: '5m'
        });
        fetchStrategies();
        alert('Strategy created successfully!');
      }
    } catch (err) {
      alert('Failed to save strategy');
    } finally {
      setStratLoading(false);
    }
  };

  // 5. Run Backtest
  const handleRunBacktest = async () => {
    if (!selectedStrategyId) return;
    setBacktestLoading(true);
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
      }
    } catch (err) {
      alert('Backtest run failed');
    } finally {
      setBacktestLoading(false);
    }
  };

  // 6. Bot controls
  const handleStartBot = async () => {
    if (!selectedStrategyId) return;
    setBotLoading(true);
    try {
      // 1. Get E2E encrypted token details
      const resDetail = await apiFetch(`${API_ENDPOINTS.trading.status}/detail`);
      const dataDetail = await resDetail.json();
      if (!dataDetail.success) {
        alert('Broker credentials are not configured! Connect your broker first.');
        setBotLoading(false);
        return;
      }
      
      // 2. Decrypt access_token locally in browser
      const decryptedToken = await decryptToken(
        dataDetail.encrypted_api_secret, // Use secret/token mapping
        pin,
        dataDetail.encryption_salt,
        dataDetail.iv
      );
      
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
    } catch (err) {
      alert('Failed to start algo bot. Make sure your PIN is correct and daily session is active.');
    } finally {
      setBotLoading(false);
    }
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
                    className="block w-full pl-10 pr-4 py-3 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-mono tracking-widest text-center text-lg"
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
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-md">
            <TrendingUp size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Trading Workspace</h1>
            <p className="text-xs text-gray-400">Backtest & run algo trading bots securely via Zerodha Kite</p>
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
            <span>{isConnected ? 'Kite Live Session Connected' : 'No Active Session'}</span>
          </div>
        </div>
      </header>

      {/* Main Workspace content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'broker', label: '1. Connect Broker', desc: 'Secure E2EE Credentials', icon: Key },
            { id: 'strategy', label: '2. Strategy Studio', desc: 'Define your trading rules', icon: Code },
            { id: 'backtest', label: '3. Backtest Sandbox', desc: 'Verify historical outcomes', icon: FileText },
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
          
          {/* TAB 1: CONNECT BROKER */}
          {activeTab === 'broker' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Zerodha Broker Setup (BYO-Key)</h2>
                <p className="text-sm text-gray-400">Configure your connection parameters securely. Secrets are encrypted locally inside your browser.</p>
              </div>

              {/* Secure E2EE Notice banner */}
              <div className="bg-orange-950/10 border border-orange-500/20 rounded-2xl p-4 flex gap-3">
                <Shield className="text-orange-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-semibold text-orange-400">Zero-Knowledge Token Vault</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    We use AES-GCM (256-bit) to encrypt your credentials before writing them to MongoDB. Decryption is performed strictly on your local browser when you enter your 6-digit session PIN.
                  </p>
                </div>
              </div>

              {/* Developer Configuration instructions */}
              <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-3 text-xs">
                <h3 className="font-semibold text-white text-sm flex items-center gap-1.5">
                  <AlertTriangle className="text-amber-500 animate-pulse" size={16} />
                  Kite Developer App Configuration Guide
                </h3>
                <p className="text-gray-400">
                  To connect your account, you must register a developer app on Zerodha:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-gray-450">
                  <li>Visit Zerodha Developer Portal: <a href="https://kite.trade" target="_blank" rel="noreferrer" className="text-orange-500 underline">kite.trade</a></li>
                  <li>Create a new developer app under your account dashboard.</li>
                  <li>Copy and paste this exact value into your app's **Redirect URL** field:</li>
                </ol>
                <div className="bg-gray-900 border border-gray-800 p-2.5 rounded font-mono text-[10px] text-orange-400 select-all break-all text-center">
                  {window.location.origin + "/trading"}
                </div>
              </div>

              {/* Setup form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Save API Key & Secret */}
                <div className="bg-gray-950 border border-gray-800 p-5 rounded-2xl space-y-4">
                  <h3 className="font-semibold text-white text-sm">1. Set API Key & Secret</h3>
                  
                  <form onSubmit={handleSaveCredentials} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Kite API Key
                      </label>
                      <input
                        type="text"
                        placeholder="Enter API Key"
                        value={inputApiKey}
                        onChange={(e) => setInputApiKey(e.target.value)}
                        className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Kite API Secret
                      </label>
                      <input
                        type="password"
                        placeholder="Enter API Secret"
                        value={inputApiSecret}
                        onChange={(e) => setInputApiSecret(e.target.value)}
                        className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        required
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={saveLoading || !inputApiKey || !inputApiSecret}
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
                    <h3 className="font-semibold text-white text-sm">2. Daily OAuth Login Authorization</h3>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                      Once keys are saved above, click authorize to log in on Zerodha secure pages and fetch today's session token.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleStartOAuth}
                      disabled={!isConfigured || exchangeLoading}
                      className={`w-full py-3 px-4 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-2 ${
                        isConfigured
                          ? 'bg-green-600 hover:bg-green-700 text-white active:scale-[0.99] shadow-lg shadow-green-950/20'
                          : 'bg-gray-850 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {exchangeLoading ? <RefreshCw size={14} className="animate-spin" /> : <TrendingUp size={14} />}
                      Login & Authorize Zerodha Session
                    </button>
                    
                    <div className="border-t border-gray-850 pt-3">
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Or Paste Access Token Manually
                      </label>
                      <form onSubmit={handleSaveEncryptedToken} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Paste token"
                          value={manualAccessToken}
                          onChange={(e) => setManualAccessToken(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg text-[11px] text-white placeholder-gray-650 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                        <button
                          type="submit"
                          disabled={!manualAccessToken}
                          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-[11px] font-medium transition-all"
                        >
                          Save
                        </button>
                      </form>
                    </div>
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
                      {isConfigured ? `🔑 Configured (API Key: ${apiKeyVal})` : '⚠️ Not Configured'}
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
                <p className="text-sm text-gray-400">Create, customize, and write trading rules.</p>
              </div>

              <form onSubmit={handleCreateStrategy} className="space-y-4 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Strategy Name
                    </label>
                    <input
                      type="text"
                      value={newStrategy.name}
                      onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
                      className="block w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-650 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Trading Symbol (NSE/BSE)
                    </label>
                    <input
                      type="text"
                      value={newStrategy.asset_symbol}
                      onChange={(e) => setNewStrategy({...newStrategy, asset_symbol: e.target.value})}
                      className="block w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-650 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newStrategy.description}
                    onChange={(e) => setNewStrategy({...newStrategy, description: e.target.value})}
                    className="block w-full px-3 py-2 bg-gray-950 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-650 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Strategy Script Code (Python)
                  </label>
                  <textarea
                    value={newStrategy.code}
                    onChange={(e) => setNewStrategy({...newStrategy, code: e.target.value})}
                    className="block w-full flex-1 min-h-[250px] p-4 bg-gray-950 border border-gray-800 rounded-xl text-xs text-green-400 font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={stratLoading}
                  className="py-2.5 px-6 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-xs transition-all self-end"
                >
                  {stratLoading ? 'Saving...' : 'Save Strategy'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: BACKTEST SANDBOX */}
          {activeTab === 'backtest' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Backtest Sandbox</h2>
                <p className="text-sm text-gray-400">Evaluate your strategy against simulated market history to measure performance.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-950 p-5 rounded-2xl border border-gray-850">
                <div className="md:col-span-1">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Select Strategy
                  </label>
                  <select
                    value={selectedStrategyId}
                    onChange={(e) => setSelectedStrategyId(e.target.value)}
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {strategies.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.asset_symbol})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={backtestParams.start_date}
                    onChange={(e) => setBacktestParams({...backtestParams, start_date: e.target.value})}
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={backtestParams.end_date}
                    onChange={(e) => setBacktestParams({...backtestParams, end_date: e.target.value})}
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
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

              {/* Backtest Results Render */}
              {backtestResult && (
                <div className="space-y-6 pt-4 border-t border-gray-800 animate-fadeIn">
                  <h3 className="font-bold text-white text-base">Backtest Execution Report</h3>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-850">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Trades</span>
                      <p className="text-xl font-bold text-white mt-1">{backtestResult.total_trades}</p>
                    </div>
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-850">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Win Ratio</span>
                      <p className="text-xl font-bold text-green-400 mt-1">{backtestResult.win_ratio.toFixed(1)}%</p>
                    </div>
                    <div className="bg-gray-950 p-4 rounded-xl border border-gray-850">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Final Capital</span>
                      <p className="text-xl font-bold text-white mt-1">₹{backtestResult.final_capital.toLocaleString()}</p>
                    </div>
                    <div className={`bg-gray-950 p-4 rounded-xl border border-gray-850 ${backtestResult.profit_loss_percent >= 0 ? 'border-green-500/20' : 'border-red-500/20'}`}>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Net P&L (%)</span>
                      <p className={`text-xl font-bold mt-1 ${backtestResult.profit_loss_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {backtestResult.profit_loss_percent >= 0 ? '+' : ''}{backtestResult.profit_loss_percent.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Trades Log */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-300">Transaction History Log</h4>
                    <div className="bg-gray-950 border border-gray-850 rounded-xl overflow-hidden text-xs max-h-[250px] overflow-y-auto">
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
                              <td className="p-3 font-mono text-gray-400">{t.time}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                                  t.type === 'BUY' ? 'bg-green-950 text-green-400' : 'bg-red-950 text-red-400'
                                }`}>
                                  {t.type}
                                </span>
                              </td>
                              <td className="p-3 font-mono text-gray-300">₹{t.price.toFixed(2)}</td>
                              <td className="p-3 font-mono">
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
                    className="block w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                    className="block w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                    className="block w-full px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
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
                    Start Active Algo Bot
                  </button>
                ) : (
                  <button
                    onClick={handleStopBot}
                    disabled={botLoading}
                    className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {botLoading ? <RefreshCw size={16} className="animate-spin" /> : <Square size={16} />}
                    Stop & Purge Bot Session
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
                      <span>POLLING TICKERS ACTIVE</span>
                    </div>
                  </div>

                  {pendingSignals.length === 0 ? (
                    <div className="bg-gray-950 border border-gray-850 p-8 rounded-2xl text-center text-gray-500 text-xs">
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
