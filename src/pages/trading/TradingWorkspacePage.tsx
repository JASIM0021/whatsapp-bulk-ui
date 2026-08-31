import React, { useState, useEffect } from 'react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { encryptToken, decryptToken } from './crypto';
import { 
  StrategyDefinition, getDefaultOrderBlockStrategy 
} from './strategyDsl';
import { VisualStrategyCanvas } from './VisualStrategyCanvas';
import { AiAssistantDrawer } from './AiAssistantDrawer';
import { UpgradedBacktestSandbox } from './UpgradedBacktestSandbox';
import { VersionComparisonModal } from './VersionComparisonModal';
import { 
  TrendingUp, Shield, Key, Bot, Play, Square, FileText, 
  Lock, RefreshCw, Code, ChevronRight,
  X, History, Plus
} from 'lucide-react';

interface StrategyListItem {
  _id: string;
  name: string;
  description?: string;
  code?: string;
  asset_symbol: string;
  timeframe: string;
  strategy_dsl?: StrategyDefinition;
  version?: number;
}

export function TradingWorkspacePage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'strategy' | 'backtest' | 'bot'>('strategy');
  const [showBrokerDropdown, setShowBrokerDropdown] = useState(false);
  const [showAgentCoach, setShowAgentCoach] = useState(() => {
    return localStorage.getItem('dhan_agent_coach_dismissed') !== 'true';
  });

  // PIN Authorization / Security
  const [pin, setPin] = useState('');
  const [isPinAuthorized, setIsPinAuthorized] = useState(false);
  const [pinError, setPinError] = useState('');

  // Broker credentials status (Dhan)
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [fundBalance, setFundBalance] = useState<number | null>(null);
  
  // Custom Dhan config fields
  const [inputClientId, setInputClientId] = useState('');
  const [inputAccessToken, setInputAccessToken] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  // Strategy list & Active Strategy Definition (Canonical Single Source of Truth)
  const [strategies, setStrategies] = useState<StrategyListItem[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [currentStrategy, setCurrentStrategy] = useState<StrategyDefinition>(getDefaultOrderBlockStrategy());
  const [stratSavingLoading, setStratSavingLoading] = useState(false);

  // AI Assistant Drawer & Version Modal
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiDrawerMode, setAiDrawerMode] = useState<'ai_generate' | 'ai_modify' | 'pinescript'>('ai_generate');
  const [versionModalOpen, setVersionModalOpen] = useState(false);

  // Live Bot controls
  const [botMode, setBotMode] = useState<'auto' | 'approval'>('approval');
  const [allocatedCapital, setAllocatedCapital] = useState(50000);
  const [botLoading, setBotLoading] = useState(false);
  const [isBotRunning, setIsBotRunning] = useState(false);

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
      if (data.success && data.strategies) {
        setStrategies(data.strategies);
        if (data.strategies.length > 0) {
          const first = data.strategies[0];
          setSelectedStrategyId(first._id);
          if (first.strategy_dsl) {
            setCurrentStrategy(first.strategy_dsl);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch strategies:', err);
    }
  };

  // Switch Selected Strategy
  const handleSelectStrategy = (stratId: string) => {
    setSelectedStrategyId(stratId);
    const found = strategies.find(s => s._id === stratId);
    if (found && found.strategy_dsl) {
      setCurrentStrategy(found.strategy_dsl);
    }
  };

  // Save Strategy to Database
  const handleSaveCurrentStrategy = async () => {
    setStratSavingLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.trading.strategies, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedStrategyId || undefined,
          name: currentStrategy.name,
          description: currentStrategy.description,
          asset_symbol: currentStrategy.asset_symbol,
          timeframe: currentStrategy.timeframe,
          strategy_dsl: currentStrategy,
          version: currentStrategy.version || 1,
          changelog: currentStrategy.metadata?.changelog || 'Visual strategy configuration update',
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.strategy_id && !selectedStrategyId) {
          setSelectedStrategyId(data.strategy_id);
        }
        await fetchStrategies();
        alert('Strategy saved successfully into canonical DSL format!');
      } else {
        alert(data.detail || 'Failed to save strategy');
      }
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setStratSavingLoading(false);
    }
  };

  // Create New Empty Strategy
  const handleCreateNewStrategy = () => {
    const defaultStrat = getDefaultOrderBlockStrategy();
    defaultStrat.name = `Strategy ${strategies.length + 1}`;
    setSelectedStrategyId('');
    setCurrentStrategy(defaultStrat);
  };

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

  // PIN Authorization
  const handlePinAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 6) {
      setPinError('PIN must be at least 6 digits');
      return;
    }
    setIsPinAuthorized(true);
    setPinError('');
  };

  // Save Dhan Config
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
          iv: encryptedAccess.iv,
        }),
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
        throw new Error('No configured credentials found');
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
          decrypted_access_token: decryptedToken,
        }),
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

  // Live Bot Controls
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
          decrypted_access_token: decryptedToken,
        }),
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
        fetchBrokerStatus();
      }
    } catch (err) {
      alert('Failed to stop bot');
    } finally {
      setBotLoading(false);
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

  // If session is locked by PIN, show Vault Unlock Screen
  if (!isPinAuthorized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl border border-gray-800 p-8 shadow-2xl relative overflow-hidden">
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
            
            <div className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 px-4 font-mono tracking-widest text-center text-lg text-white font-bold h-12 flex items-center justify-center mb-6">
              {pin ? '•'.repeat(pin.length) : <span className="text-gray-600 text-xs tracking-normal">Enter PIN</span>}
            </div>
            {pinError && <p className="text-xs text-red-400 mb-4">{pinError}</p>}

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
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
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
      <div className="h-0.5 bg-emerald-500/20 w-full" />
      
      {/* Top Header */}
      <header className="border-b border-gray-800 bg-gray-900/40 backdrop-blur-md px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white leading-none">Dhan Studio</h1>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-mono font-bold">Visual AI Builder</span>
            </div>
            <p className="hidden md:block text-xs text-gray-400 mt-1">Non-Programmer Visual Strategy Composer & Backtest Engine</p>
          </div>
        </div>
        
        {/* Top Actions: Strategy Dropdown & Dhan Broker Status */}
        <div className="flex items-center gap-3 flex-wrap relative">
          
          {/* Strategy Quick Switcher */}
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5">
            <span className="text-[10px] text-gray-500 uppercase font-mono font-bold">Strategy:</span>
            <select
              value={selectedStrategyId}
              onChange={(e) => handleSelectStrategy(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-emerald-400 focus:outline-none cursor-pointer"
            >
              {strategies.map((s) => (
                <option key={s._id} value={s._id} className="bg-gray-900 text-white">
                  {s.name} ({s.asset_symbol})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCreateNewStrategy}
              className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
              title="Create New Strategy"
            >
              <Plus size={12} />
            </button>
            <button
              type="button"
              onClick={() => setVersionModalOpen(true)}
              className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
              title="Version History"
            >
              <History size={12} />
            </button>
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
              <div className="absolute right-0 top-10 mt-1 w-96 bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-2xl z-50 space-y-4 font-sans">
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
                        className="block w-full px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none font-mono"
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
                        className="block w-full px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none font-mono"
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

                  <div className="border-t border-gray-800 pt-3">
                    <button
                      type="button"
                      onClick={handleConnectDhan}
                      disabled={!isConfigured || connectLoading}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-800 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      {connectLoading ? <RefreshCw size={12} className="animate-spin" /> : <TrendingUp size={12} />}
                      Verify & Sync Live Session
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 h-fit mb-2 lg:mb-0">
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
                className={`whitespace-nowrap px-4 py-3 rounded-2xl border transition-all flex items-center justify-center lg:justify-start gap-2.5 text-xs font-semibold ${
                  activeTab === tab.id
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 shadow-lg'
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-850'
                }`}
              >
                <Icon size={16} className={activeTab === tab.id ? 'text-emerald-400' : 'text-gray-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Workspace Panel */}
        <div className="lg:col-span-3 bg-gray-900 rounded-3xl border border-gray-800 p-6 flex flex-col min-h-[600px] shadow-2xl">
          
          {/* TAB 1: VISUAL STRATEGY BUILDER */}
          {activeTab === 'strategy' && (
            <VisualStrategyCanvas
              strategy={currentStrategy}
              onChange={(updated) => setCurrentStrategy(updated)}
              onSave={handleSaveCurrentStrategy}
              onOpenAi={() => {
                setAiDrawerMode('ai_generate');
                setAiDrawerOpen(true);
              }}
              onOpenPineScript={() => {
                setAiDrawerMode('pinescript');
                setAiDrawerOpen(true);
              }}
              onRunBacktest={() => setActiveTab('backtest')}
              isSaving={stratSavingLoading}
            />
          )}

          {/* TAB 2: UPGRADED BACKTEST SANDBOX */}
          {activeTab === 'backtest' && (
            <UpgradedBacktestSandbox
              strategy={currentStrategy}
              strategies={strategies}
              selectedStrategyId={selectedStrategyId}
              onSelectStrategyId={handleSelectStrategy}
            />
          )}

          {/* TAB 3: LIVE BOT CONTROLS */}
          {activeTab === 'bot' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-gray-800 pb-4">
                <h2 className="text-lg font-bold text-white mb-1">Algo Bot Controls</h2>
                <p className="text-xs text-gray-400">Deploy real-time polling loops executing the canonical Strategy DSL.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-950 p-5 rounded-2xl border border-gray-800 font-mono text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Active Strategy
                  </label>
                  <select
                    disabled={isBotRunning}
                    value={selectedStrategyId}
                    onChange={(e) => handleSelectStrategy(e.target.value)}
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none"
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
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none"
                  >
                    <option value="approval">5-min Session Approval (Email Alert)</option>
                    <option value="auto">Fully Autonomous Order Execution</option>
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
                    className="block w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                {!isBotRunning ? (
                  <button
                    onClick={handleStartBot}
                    disabled={botLoading || !selectedStrategyId}
                    className="flex-1 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {botLoading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                    Start Live Dhan Algo Bot
                  </button>
                ) : (
                  <button
                    onClick={handleStopBot}
                    disabled={botLoading}
                    className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    {botLoading ? <RefreshCw size={14} className="animate-spin" /> : <Square size={14} />}
                    Stop & Purge Session Credentials
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* AI Assistant Drawer Modal */}
      <AiAssistantDrawer
        strategy={currentStrategy}
        isOpen={aiDrawerOpen}
        mode={aiDrawerMode}
        onClose={() => setAiDrawerOpen(false)}
        onApplyStrategy={(updated) => {
          setCurrentStrategy(updated);
        }}
      />

      {/* Version Comparison Modal */}
      {selectedStrategyId && (
        <VersionComparisonModal
          strategyId={selectedStrategyId}
          currentStrategy={currentStrategy}
          isOpen={versionModalOpen}
          onClose={() => setVersionModalOpen(false)}
          onRestoreVersion={(restored) => setCurrentStrategy(restored)}
        />
      )}

      {/* Dhana AI Agent Coach */}
      {showAgentCoach ? (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] bg-gray-900 border border-gray-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md border border-emerald-500/20">
                <img src="/agents/agent-trading.jpg?v=2" alt="Dhana" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Dhana - Visual AI Trading Coach</h3>
                <span className="text-[10px] text-emerald-400 font-medium tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Visual AI Canvas Active
                </span>
              </div>
            </div>
            <button 
              onClick={() => {
                localStorage.setItem('dhan_agent_coach_dismissed', 'true');
                setShowAgentCoach(false);
              }}
              className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="bg-emerald-950/10 border border-emerald-500/10 rounded-2xl p-4 text-xs text-gray-300 leading-relaxed">
            <p className="font-medium text-white mb-2">👋 Welcome to Visual AI Strategy Studio!</p>
            <p>You can now build complex trading strategies without typing any code:</p>
            
            <ul className="mt-3 space-y-2 font-mono text-[11px]">
              <li className="flex gap-2">
                <span className="text-emerald-500 font-bold">1.</span>
                <div><strong>Visual Blocks</strong>: Order Blocks, Consecutive Candles, Multi-Target R:R.</div>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 font-bold">2.</span>
                <div><strong>AI Strategy Assistant</strong>: Describe ideas or modify rules with instant diffs.</div>
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 font-bold">3.</span>
                <div><strong>PineScript Importer</strong>: Convert TradingView scripts directly into visual blocks.</div>
              </li>
            </ul>
          </div>

          <button
            onClick={() => setShowAgentCoach(false)}
            className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg"
          >
            Start Building Visually!
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAgentCoach(true)}
          title="Dhana (AI Trading Employee Coach)"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-500/30 hover:border-emerald-500 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 bg-gray-900 group"
        >
          <img src="/agents/agent-trading.jpg?v=2" alt="Dhana" className="w-full h-full object-cover" />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-gray-900 rounded-full animate-pulse" />
        </button>
      )}
    </div>
  );
}
