import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, Sparkles, TrendingUp, DollarSign, Globe, Coins, ShieldCheck, X } from 'lucide-react';

export interface MarketInstrument {
  symbol: string;
  name: string;
  category: 'crypto' | 'forex' | 'commodity' | 'indian_equity' | 'us_equity';
  exchange?: string;
  icon?: string;
  popular?: boolean;
}

export const POPULAR_INSTRUMENTS: MarketInstrument[] = [
  // Commodities
  { symbol: 'XAUUSD', name: 'Gold Spot / US Dollar', category: 'commodity', exchange: 'Metals', popular: true },
  { symbol: 'SILVER', name: 'Silver Spot (XAGUSD)', category: 'commodity', exchange: 'Metals', popular: true },
  { symbol: 'CRUDEOIL', name: 'WTI Crude Oil', category: 'commodity', exchange: 'NYMEX', popular: false },
  { symbol: 'NATGAS', name: 'Natural Gas', category: 'commodity', exchange: 'NYMEX', popular: false },
  { symbol: 'COPPER', name: 'Copper Futures', category: 'commodity', exchange: 'COMEX', popular: false },

  // Crypto
  { symbol: 'BTCUSDT', name: 'Bitcoin / Tether', category: 'crypto', exchange: 'Binance', popular: true },
  { symbol: 'ETHUSDT', name: 'Ethereum / Tether', category: 'crypto', exchange: 'Binance', popular: true },
  { symbol: 'SOLUSDT', name: 'Solana / Tether', category: 'crypto', exchange: 'Binance', popular: true },
  { symbol: 'BNBUSDT', name: 'BNB / Tether', category: 'crypto', exchange: 'Binance', popular: false },
  { symbol: 'XRPUSDT', name: 'Ripple / Tether', category: 'crypto', exchange: 'Binance', popular: false },
  { symbol: 'ADAUSDT', name: 'Cardano / Tether', category: 'crypto', exchange: 'Binance', popular: false },
  { symbol: 'DOGEUSDT', name: 'Dogecoin / Tether', category: 'crypto', exchange: 'Binance', popular: false },
  { symbol: 'AVAXUSDT', name: 'Avalanche / Tether', category: 'crypto', exchange: 'Binance', popular: false },

  // Forex
  { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'forex', exchange: 'Forex', popular: true },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'forex', exchange: 'Forex', popular: true },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'forex', exchange: 'Forex', popular: false },
  { symbol: 'AUDUSD', name: 'Australian Dollar / USD', category: 'forex', exchange: 'Forex', popular: false },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', category: 'forex', exchange: 'Forex', popular: false },

  // Indian Equities & Indices
  { symbol: 'NIFTY', name: 'NIFTY 50 Index', category: 'indian_equity', exchange: 'NSE', popular: true },
  { symbol: 'BANKNIFTY', name: 'NIFTY Bank Index', category: 'indian_equity', exchange: 'NSE', popular: true },
  { symbol: 'FINNIFTY', name: 'NIFTY Financial Services', category: 'indian_equity', exchange: 'NSE', popular: false },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', category: 'indian_equity', exchange: 'NSE', popular: true },
  { symbol: 'TCS', name: 'Tata Consultancy Services', category: 'indian_equity', exchange: 'NSE', popular: false },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', category: 'indian_equity', exchange: 'NSE', popular: false },
  { symbol: 'INFY', name: 'Infosys Limited', category: 'indian_equity', exchange: 'NSE', popular: false },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', category: 'indian_equity', exchange: 'NSE', popular: false },

  // US Equities & ETFs
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', category: 'us_equity', exchange: 'NYSE', popular: true },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq 100)', category: 'us_equity', exchange: 'NASDAQ', popular: true },
  { symbol: 'AAPL', name: 'Apple Inc.', category: 'us_equity', exchange: 'NASDAQ', popular: false },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'us_equity', exchange: 'NASDAQ', popular: true },
  { symbol: 'TSLA', name: 'Tesla, Inc.', category: 'us_equity', exchange: 'NASDAQ', popular: true },
  { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'us_equity', exchange: 'NASDAQ', popular: false },
];

interface Props {
  value: string;
  onChange: (symbol: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  showQuickChips?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TradingSymbolAutocomplete: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'Search symbol (e.g. Gold, BTC, Nifty, NVDA)...',
  label,
  className = '',
  showQuickChips = true,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered list
  const filteredInstruments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return POPULAR_INSTRUMENTS.filter((inst) => {
      const matchesCategory =
        selectedCategory === 'all'
          ? true
          : selectedCategory === 'popular'
          ? inst.popular
          : inst.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!query) return true;

      return (
        inst.symbol.toLowerCase().includes(query) ||
        inst.name.toLowerCase().includes(query) ||
        (inst.exchange && inst.exchange.toLowerCase().includes(query))
      );
    });
  }, [searchQuery, selectedCategory]);

  const exactMatchExists = useMemo(() => {
    const cleanSearch = searchQuery.trim().toUpperCase();
    if (!cleanSearch) return true;
    return POPULAR_INSTRUMENTS.some((i) => i.symbol.toUpperCase() === cleanSearch);
  }, [searchQuery]);

  const handleSelect = (sym: string) => {
    onChange(sym.toUpperCase());
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleCustomSubmit = () => {
    if (searchQuery.trim()) {
      onChange(searchQuery.trim().toUpperCase());
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'commodity':
        return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Metals</span>;
      case 'crypto':
        return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Crypto</span>;
      case 'forex':
        return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Forex</span>;
      case 'indian_equity':
        return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">NSE</span>;
      case 'us_equity':
        return <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">US Stock</span>;
      default:
        return null;
    }
  };

  const activeInstrument = POPULAR_INSTRUMENTS.find((i) => i.symbol.toUpperCase() === value.toUpperCase());

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="text-[9px] font-mono text-gray-400 block mb-1 font-semibold">{label}</label>}

      {/* Main Trigger / Display Input */}
      <div className="relative flex items-center">
        <div
          onClick={() => {
            setIsOpen(!isOpen);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className={`w-full flex items-center justify-between cursor-pointer bg-gray-900 border rounded-xl font-mono text-white transition-all duration-150 ${
            isOpen ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10' : 'border-gray-800 hover:border-gray-700'
          } ${size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs font-bold'}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-emerald-400 font-bold font-mono tracking-wide">{value || 'SELECT SYMBOL'}</span>
            {activeInstrument && (
              <span className="text-[10px] text-gray-400 truncate max-w-[120px] sm:max-w-[180px] font-normal hidden xs:inline">
                • {activeInstrument.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            {activeInstrument && getCategoryBadge(activeInstrument.category)}
            <ChevronDown size={14} className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
          </div>
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-gray-950/98 backdrop-blur-md border border-gray-800 rounded-2xl shadow-2xl p-2.5 space-y-2 min-w-[280px] sm:min-w-[340px] animate-in fade-in zoom-in-95 duration-150">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (filteredInstruments.length > 0) {
                    handleSelect(filteredInstruments[0].symbol);
                  } else {
                    handleCustomSubmit();
                  }
                } else if (e.key === 'Escape') {
                  setIsOpen(false);
                }
              }}
              placeholder={placeholder}
              className="w-full pl-8 pr-7 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[10px] font-mono border-b border-gray-900">
            {[
              { id: 'all', label: 'All' },
              { id: 'popular', label: '🔥 Hot' },
              { id: 'commodity', label: 'Metals' },
              { id: 'crypto', label: 'Crypto' },
              { id: 'forex', label: 'Forex' },
              { id: 'indian_equity', label: 'NSE' },
              { id: 'us_equity', label: 'US' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
            {/* Custom Symbol Entry Option if query does not exactly match */}
            {searchQuery.trim() && !exactMatchExists && (
              <button
                type="button"
                onClick={handleCustomSubmit}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 text-left transition-colors mb-1"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={13} className="text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-mono font-bold text-emerald-300">
                      Use Custom Symbol: &quot;{searchQuery.trim().toUpperCase()}&quot;
                    </div>
                    <div className="text-[9px] text-emerald-500/80">Press Enter or click to auto-fill</div>
                  </div>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  CUSTOM
                </span>
              </button>
            )}

            {filteredInstruments.length > 0 ? (
              filteredInstruments.map((inst) => {
                const isSelected = inst.symbol.toUpperCase() === value.toUpperCase();
                return (
                  <button
                    key={inst.symbol}
                    type="button"
                    onClick={() => handleSelect(inst.symbol)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left ${
                      isSelected
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-white'
                        : 'hover:bg-gray-900 text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-white">{inst.symbol}</span>
                        {getCategoryBadge(inst.category)}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate mt-0.5">{inst.name}</div>
                    </div>
                    {isSelected && <Check size={14} className="text-emerald-400 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-gray-500 font-mono">
                No predefined symbols found.
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={handleCustomSubmit}
                    className="block mx-auto mt-2 text-emerald-400 underline font-bold"
                  >
                    Use &quot;{searchQuery.trim().toUpperCase()}&quot; anyway
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Selection Chips */}
      {showQuickChips && (
        <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto no-scrollbar py-0.5">
          {['XAUUSD', 'BTCUSDT', 'ETHUSDT', 'NIFTY', 'BANKNIFTY', 'EURUSD'].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => onChange(chip)}
              className={`text-[9px] font-mono px-2 py-0.5 rounded-lg border transition-colors ${
                value.toUpperCase() === chip
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                  : 'bg-gray-900/80 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
