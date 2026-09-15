import { useState } from 'react';
import { apiFetch } from '@/config/api';
import { StrategyDefinition } from './strategyDsl';
import {
  Sparkles, Play, CheckCircle2, AlertCircle,
  Layers, Zap, Sliders, Target, ShieldCheck,
  RefreshCw, BarChart2, Cpu, Activity, Award, BookmarkPlus,
  Compass, ArrowRight
} from 'lucide-react';

interface AIStrategyTrainerTabProps {
  onLoadStrategyToBacktest: (strategy: StrategyDefinition, symbol: string, startDate: string, endDate: string, initialCapital: number) => void;
  onLoadStrategyToComposer: (strategy: StrategyDefinition) => void;
  onSaveStrategy: (strategy: StrategyDefinition) => Promise<void>;
}

interface EpochTelemetry {
  epoch: number;
  best_fitness: number;
  avg_fitness: number;
  best_win_rate: number;
  best_net_profit: number;
  best_trades: number;
  policy_loss: number;
}

interface TrainingResult {
  success: boolean;
  strategy: StrategyDefinition;
  metrics: {
    initial_capital: number;
    final_capital: number;
    net_profit: number;
    net_return_pct: number;
    total_trades: number;
    win_count: number;
    loss_count: number;
    win_ratio: number;
    profit_factor: number;
    max_drawdown_pct: number;
    average_r: number;
  };
  trades: any[];
  candles: any[];
  equity_curve: number[];
  training_telemetry: {
    epochs: EpochTelemetry[];
    total_epochs: number;
    initial_capital: number;
    final_capital: number;
    net_profit: number;
    win_rate: number;
    profit_factor: number;
    max_drawdown: number;
    total_trades: number;
    fitness_score: number;
    discovered_pattern_summary: string;
  };
}

export function AIStrategyTrainerTab({
  onLoadStrategyToBacktest,
  onLoadStrategyToComposer,
  onSaveStrategy
}: AIStrategyTrainerTabProps) {
  // Input parameters
  const [symbol, setSymbol] = useState('XAUUSD');
  const [timeframe, setTimeframe] = useState('1d');
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [tradeSizeValue, setTradeSizeValue] = useState(1000);
  const [objective, setObjective] = useState<'balanced' | 'win_rate' | 'profit_factor' | 'low_drawdown' | 'max_profit'>('balanced');
  const [maxEpochs, setMaxEpochs] = useState(10);
  const populationSize = 14;

  // Training state & progress simulation
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentStatusMsg, setCurrentStatusMsg] = useState('');
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Quick Date Preset Selectors
  const handleDatePreset = (preset: '2025_2026' | '1y' | '2y' | 'ytd') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === '2025_2026') {
      setStartDate('2025-01-01');
      setEndDate('2026-12-31');
    } else if (preset === '1y') {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === '2y') {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 2);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'ytd') {
      setStartDate(`${today.getFullYear()}-01-01`);
      setEndDate(todayStr);
    }
  };

  // Launch AI Reinforcement Training
  const handleStartTraining = async () => {
    setIsTraining(true);
    setTrainingProgress(5);
    setTrainingError(null);
    setTrainingResult(null);
    setSaveSuccess(false);
    setCurrentStatusMsg(`Initializing genetic policy pool across ${symbol} market memory...`);

    // Simulated step animation while training executes in backend
    const progressInterval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 90) return prev;
        const inc = Math.floor(Math.random() * 12) + 5;
        const next = Math.min(90, prev + inc);
        if (next > 25 && next <= 50) {
          setCurrentStatusMsg(`Evaluating generation policies against SMC & Multi-Timeframe indicators...`);
        } else if (next > 50 && next <= 75) {
          setCurrentStatusMsg(`Crossover & mutation: Optimizing R:R targets and stop loss triggers...`);
        } else if (next > 75) {
          setCurrentStatusMsg(`Synthesizing highest fitness alpha pattern strategy...`);
        }
        return next;
      });
    }, 1200);

    try {
      const res = await apiFetch('/api/trading/ai/train-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          timeframe,
          start_date: startDate,
          end_date: endDate,
          initial_capital: Number(initialCapital),
          objective,
          max_epochs: Number(maxEpochs),
          population_size: Number(populationSize),
          trade_size_method: 'fixed_capital',
          trade_size_value: Number(tradeSizeValue)
        })
      });

      clearInterval(progressInterval);
      setTrainingProgress(100);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.detail || data.error || 'Failed to complete reinforcement training.');
      }

      setTrainingResult(data.training_result);
      setCurrentStatusMsg('Reinforcement model successfully converged on high-probability alpha policy!');
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('RL Training error:', err);
      setTrainingError(err.message || 'Error occurred during training.');
    } finally {
      setIsTraining(false);
    }
  };

  // Handle Save Discovered Strategy
  const handleSaveWinningStrategy = async () => {
    if (!trainingResult?.strategy) return;
    setIsSaving(true);
    try {
      await onSaveStrategy(trainingResult.strategy);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-950/40 via-purple-950/30 to-blue-950/30 p-6 rounded-3xl border border-emerald-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Cpu size={12} className="animate-pulse" />
              REINFORCEMENT LEARNING v2.0
            </span>
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
              Autonomous Alpha Search
            </span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="text-purple-400" size={20} />
            AI Decision Engine & Reinforcement Strategy Trainer
          </h1>
          <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
            Provide historical market data (e.g. 2025 to 2026 for <span className="text-emerald-400 font-mono font-bold">XAUUSD</span> with <span className="text-emerald-400 font-mono font-bold">$10,000</span> capital). The autonomous engine simulates hundreds of candidate indicator combinations across multiple policy epochs, discovers the mathematical edge, and outputs an executable winning strategy.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartTraining}
          disabled={isTraining}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xl transition-all relative z-10 ${
            isTraining
              ? 'bg-purple-950/50 border border-purple-500/30 text-purple-300 cursor-not-allowed animate-pulse'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-gray-950 shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-95'
          }`}
        >
          {isTraining ? (
            <>
              <RefreshCw size={15} className="animate-spin text-purple-400" />
              <span>Training Model (Epochs Running)...</span>
            </>
          ) : (
            <>
              <Zap size={16} className="fill-current" />
              <span>Start AI Reinforcement Training</span>
            </>
          )}
        </button>
      </div>

      {/* Control Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-gray-950 p-5 rounded-3xl border border-gray-800/80 shadow-inner">
        {/* Symbol & Timeframe */}
        <div className="space-y-3">
          <label className="text-[10px] font-mono uppercase text-gray-400 font-bold flex items-center gap-1.5">
            <Compass size={13} className="text-emerald-400" />
            1. Target Symbol & Timeframe
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-mono text-gray-500 block mb-1">Symbol</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="XAUUSD">XAUUSD (Gold)</option>
                <option value="BTCUSDT">BTCUSDT (Crypto)</option>
                <option value="ETHUSD">ETHUSD (Ethereum)</option>
                <option value="NIFTY">NIFTY 50 (Index)</option>
                <option value="BANKNIFTY">BANK NIFTY</option>
                <option value="RELIANCE">RELIANCE.NS</option>
                <option value="EURUSD">EURUSD (Forex)</option>
                <option value="SILVER">SILVER (XAGUSD)</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-mono text-gray-500 block mb-1">Timeframe</label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="1d">1 Day (1d)</option>
                <option value="1h">1 Hour (1h)</option>
                <option value="15m">15 Min (15m)</option>
                <option value="5m">5 Min (5m)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date Range & Presets */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-mono uppercase text-gray-400 font-bold flex items-center gap-1.5">
              <BarChart2 size={13} className="text-purple-400" />
              2. Training Horizon
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => handleDatePreset('2025_2026')}
                className="px-1.5 py-0.5 bg-purple-950/40 border border-purple-500/30 text-purple-300 text-[9px] font-mono rounded hover:bg-purple-900/60"
              >
                2025-2026
              </button>
              <button
                type="button"
                onClick={() => handleDatePreset('1y')}
                className="px-1.5 py-0.5 bg-gray-900 border border-gray-800 text-gray-400 text-[9px] font-mono rounded hover:bg-gray-800"
              >
                1Y
              </button>
              <button
                type="button"
                onClick={() => handleDatePreset('2y')}
                className="px-1.5 py-0.5 bg-gray-900 border border-gray-800 text-gray-400 text-[9px] font-mono rounded hover:bg-gray-800"
              >
                2Y
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-mono text-gray-500 block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-[9px] font-mono text-gray-500 block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Capital & Sizing */}
        <div className="space-y-3">
          <label className="text-[10px] font-mono uppercase text-gray-400 font-bold flex items-center gap-1.5">
            <Target size={13} className="text-amber-400" />
            3. Capital & Trade Sizing
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-mono text-gray-500 block mb-1">Initial Capital ($)</label>
              <input
                type="number"
                min={100}
                step={500}
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[9px] font-mono text-gray-500 block mb-1">Trade Size ($)</label>
              <input
                type="number"
                min={50}
                step={100}
                value={tradeSizeValue}
                onChange={(e) => setTradeSizeValue(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Optimization Objective & Epochs */}
        <div className="space-y-3">
          <label className="text-[10px] font-mono uppercase text-gray-400 font-bold flex items-center gap-1.5">
            <Sliders size={13} className="text-blue-400" />
            4. Reward Policy Objective
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-mono text-gray-500 block mb-1">Target Objective</label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value as any)}
                className="w-full px-2 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500"
              >
                <option value="balanced">Balanced Sharpe</option>
                <option value="win_rate">High Win Rate %</option>
                <option value="profit_factor">Profit Factor</option>
                <option value="low_drawdown">Low Max Drawdown</option>
                <option value="max_profit">Max Net Profit</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-mono text-gray-500 block mb-1">Max Epochs</label>
              <select
                value={maxEpochs}
                onChange={(e) => setMaxEpochs(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              >
                <option value={6}>6 Epochs (Fast)</option>
                <option value={10}>10 Epochs (Deep)</option>
                <option value={15}>15 Epochs (Ultra)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Live Training Progress Bar & Status */}
      {isTraining && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 border border-purple-500/30 shadow-2xl space-y-4 animate-pulse">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-purple-400 font-bold flex items-center gap-2">
              <Activity size={15} className="animate-spin text-purple-400" />
              Reinforcement Evolutionary Simulation in Progress...
            </span>
            <span className="text-white font-black bg-purple-950/60 px-3 py-1 rounded-full border border-purple-500/40">
              {trainingProgress}%
            </span>
          </div>

          <div className="w-full bg-gray-900 rounded-full h-3.5 overflow-hidden p-0.5 border border-purple-900/50">
            <div
              className="bg-gradient-to-r from-purple-500 via-emerald-400 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${trainingProgress}%` }}
            />
          </div>

          <p className="text-xs font-mono text-gray-400 italic">
            &gt; {currentStatusMsg}
          </p>
        </div>
      )}

      {/* Error Banner */}
      {trainingError && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-3">
          <AlertCircle size={16} className="text-rose-400 shrink-0" />
          <span>{trainingError}</span>
        </div>
      )}

      {/* Discovered Winning Strategy Results Card */}
      {trainingResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Winning Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-gray-950 via-emerald-950/20 to-gray-950 border border-emerald-500/30 shadow-2xl space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Award size={12} />
                    CONVERGED ALPHA POLICY
                  </span>
                  <span className="text-[11px] font-mono text-gray-400">
                    {symbol} • {timeframe} • {startDate} to {endDate}
                  </span>
                </div>
                <h2 className="text-lg font-black text-white tracking-tight">
                  {trainingResult.strategy.name}
                </h2>
                <p className="text-xs text-gray-400 max-w-2xl">
                  {trainingResult.strategy.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    onLoadStrategyToBacktest(
                      trainingResult.strategy,
                      symbol,
                      startDate,
                      endDate,
                      initialCapital
                    )
                  }
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-gray-950 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Play size={14} className="fill-current" />
                  <span>Run Live Replay Backtest</span>
                  <ArrowRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => onLoadStrategyToComposer(trainingResult.strategy)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 active:scale-95 transition-all"
                >
                  <Layers size={14} className="text-purple-400" />
                  <span>Edit in Strategy Composer</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveWinningStrategy}
                  disabled={isSaving || saveSuccess}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border active:scale-95 transition-all ${
                    saveSuccess
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : 'bg-purple-950/30 border-purple-500/30 text-purple-300 hover:bg-purple-900/50'
                  }`}
                >
                  {saveSuccess ? (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span>Saved in Strategy Library!</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus size={14} />
                      <span>{isSaving ? 'Saving...' : 'Save Strategy'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Performance HUD Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
              <div className="bg-gray-900/90 p-4 rounded-2xl border border-gray-800/80 shadow-inner">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block mb-1">
                  Net Profit
                </span>
                <span
                  className={`text-base font-black ${
                    trainingResult.metrics.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {trainingResult.metrics.net_profit >= 0 ? '+' : ''}$
                  {trainingResult.metrics.net_profit.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  ({trainingResult.metrics.net_return_pct >= 0 ? '+' : ''}
                  {trainingResult.metrics.net_return_pct.toFixed(2)}%)
                </span>
              </div>

              <div className="bg-gray-900/90 p-4 rounded-2xl border border-gray-800/80 shadow-inner">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block mb-1">
                  Win Rate
                </span>
                <span className="text-base font-black text-white">
                  {trainingResult.metrics.win_ratio.toFixed(1)}%
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">
                  {trainingResult.metrics.win_count}W / {trainingResult.metrics.loss_count}L
                </span>
              </div>

              <div className="bg-gray-900/90 p-4 rounded-2xl border border-gray-800/80 shadow-inner">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block mb-1">
                  Profit Factor
                </span>
                <span className="text-base font-black text-purple-300">
                  {trainingResult.metrics.profit_factor.toFixed(2)}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Gross Win/Loss
                </span>
              </div>

              <div className="bg-gray-900/90 p-4 rounded-2xl border border-gray-800/80 shadow-inner">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block mb-1">
                  Total Trades
                </span>
                <span className="text-base font-black text-white">
                  {trainingResult.metrics.total_trades}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Sample Size
                </span>
              </div>

              <div className="bg-gray-900/90 p-4 rounded-2xl border border-gray-800/80 shadow-inner">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block mb-1">
                  Max Drawdown
                </span>
                <span className="text-base font-black text-rose-400">
                  {trainingResult.metrics.max_drawdown_pct.toFixed(2)}%
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Controlled Risk
                </span>
              </div>

              <div className="bg-gray-900/90 p-4 rounded-2xl border border-gray-800/80 shadow-inner">
                <span className="text-[9px] text-gray-400 uppercase tracking-wider block mb-1">
                  Average R
                </span>
                <span className="text-base font-black text-amber-300">
                  +{trainingResult.metrics.average_r.toFixed(2)}R
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Risk-Reward
                </span>
              </div>
            </div>

            {/* Pattern Discovery Summary Banner */}
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 text-xs font-mono space-y-2">
              <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck size={14} />
                Mathematical Pattern Discovery & Alpha Edge
              </span>
              <p className="text-gray-300 leading-relaxed text-[11px]">
                {trainingResult.training_telemetry.discovered_pattern_summary}
              </p>
            </div>

            {/* Strategy Structure Specs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Entry Conditions */}
              <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 space-y-2">
                <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                  Entry Signals ({trainingResult.strategy.entry.side})
                </span>
                <ul className="space-y-1.5 text-xs text-gray-300 font-mono">
                  {trainingResult.strategy.entry.condition_tree.conditions.map((c: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{c.description || `${c.left?.field} ${c.operator} ${c.right?.field || c.right?.value}`}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stop Loss Config */}
              <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 space-y-2">
                <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                  Dynamic Risk & Stop Loss
                </span>
                <div className="text-xs text-gray-300 font-mono space-y-1">
                  <p>
                    <span className="text-gray-500">SL Type:</span>{' '}
                    <span className="text-rose-400 font-bold uppercase">
                      {trainingResult.strategy.risk.stop_loss.type.replace(/_/g, ' ')}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500">Position Sizing:</span>{' '}
                    <span className="text-white">
                      ${trainingResult.strategy.risk.sizing_value} ({trainingResult.strategy.risk.sizing_method})
                    </span>
                  </p>
                </div>
              </div>

              {/* Take Profit Targets */}
              <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800 space-y-2">
                <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                  Take Profit Ladder (R:R)
                </span>
                <div className="space-y-1 text-xs text-gray-300 font-mono">
                  {trainingResult.strategy.risk.take_profit.targets.map((t: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-400">{t.name}:</span>
                      <span className="text-emerald-400 font-bold">+{t.rr_ratio}R ({t.close_qty_pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Epoch Progression Table */}
            <div className="space-y-2 pt-3 border-t border-gray-800">
              <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block">
                Policy Epoch Progression History ({trainingResult.training_telemetry.epochs.length} Epochs)
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 text-[9px] uppercase">
                      <th className="py-2 px-3">Epoch</th>
                      <th className="py-2 px-3">Best Fitness</th>
                      <th className="py-2 px-3">Avg Fitness</th>
                      <th className="py-2 px-3">Win Rate</th>
                      <th className="py-2 px-3">Net Profit</th>
                      <th className="py-2 px-3">Trades</th>
                      <th className="py-2 px-3">Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60 text-gray-300">
                    {trainingResult.training_telemetry.epochs.map((ep) => (
                      <tr key={ep.epoch} className="hover:bg-gray-850">
                        <td className="py-1.5 px-3 font-bold text-white">Epoch #{ep.epoch}</td>
                        <td className="py-1.5 px-3 text-emerald-400 font-bold">{ep.best_fitness.toFixed(2)}</td>
                        <td className="py-1.5 px-3 text-gray-400">{ep.avg_fitness.toFixed(2)}</td>
                        <td className="py-1.5 px-3 text-purple-300">{ep.best_win_rate.toFixed(1)}%</td>
                        <td className="py-1.5 px-3 text-emerald-400">+${ep.best_net_profit.toFixed(2)}</td>
                        <td className="py-1.5 px-3">{ep.best_trades}</td>
                        <td className="py-1.5 px-3 text-gray-500">{ep.policy_loss}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
