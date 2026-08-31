/**
 * Canonical Strategy DSL & Component Model for Dhan Studio.
 * Single source of truth across Visual Builder, AI Agents, PineScript Importer, and Backtest Engine.
 */

export type SizingMethod = 'fixed_qty' | 'fixed_capital' | 'pct_capital' | 'risk_pct' | 'risk_amount' | 'dynamic';

export type StopLossType =
  | 'order_block_start'
  | 'order_block_top'
  | 'order_block_bottom'
  | 'order_block_end'
  | 'prev_swing_high'
  | 'prev_swing_low'
  | 'prev_candle_high'
  | 'prev_candle_low'
  | 'fixed_points'
  | 'percentage'
  | 'atr_multiple'
  | 'highest_high_n'
  | 'lowest_low_n'
  | 'custom_condition';

export type MoveSLAction =
  | 'entry'
  | 'plus_1r'
  | 'plus_2r'
  | 'plus_3r'
  | 'previous_tp'
  | 'none'
  | 'custom';

export type OperatorType =
  | '>'
  | '<'
  | '>='
  | '<='
  | '=='
  | '!='
  | 'crosses_above'
  | 'crosses_below'
  | 'inside'
  | 'outside'
  | 'touches'
  | 'breaks'
  | 'pct_above'
  | 'pct_below'
  | 'pts_above'
  | 'pts_below'
  | 'exists';

export interface Operand {
  kind: 'market' | 'indicator' | 'price_action' | 'order_block' | 'number' | 'string' | 'boolean';
  field: string;
  indicator_id?: string;
  params?: Record<string, any>;
  bar_offset?: number;
  value?: number | string | boolean;
  unit?: string;
}

export interface ConditionRule {
  type: 'rule';
  id: string;
  left: Operand;
  operator: OperatorType;
  right?: Operand;
  tolerance?: number;
  description?: string;
}

export interface ConditionGroup {
  type: 'group';
  id: string;
  logical_op: 'AND' | 'OR';
  negate?: boolean;
  conditions: (ConditionRule | ConditionGroup)[];
}

export interface IndicatorConfig {
  id: string;
  type: 'order_block' | 'ema' | 'sma' | 'rsi' | 'macd' | 'vwap' | 'bollinger' | 'supertrend' | 'atr' | 'stochastic' | 'custom';
  name: string;
  params: Record<string, any>;
  outputs: string[];
}

export interface StopLossConfig {
  type: StopLossType;
  value?: number;
  buffer_points: number;
  buffer_pct: number;
  lookback_bars?: number;
  reference?: 'start' | 'top' | 'bottom' | 'end';
  price_point?: 'last_position' | 'start';
}

export interface TakeProfitAction {
  move_stop_loss_to: MoveSLAction;
  custom_price_ref?: string;
  enable_trailing?: boolean;
}

export interface TakeProfitTarget {
  id: string;
  name: string;
  rr_ratio: number;
  close_qty_pct: number;
  action_on_hit: TakeProfitAction;
}

export interface TakeProfitConfig {
  method: 'rr_ladder' | 'fixed_points' | 'percentage' | 'rr_single' | 'indicator_level' | 'price_level' | 'prev_high_low' | 'dynamic';
  targets: TakeProfitTarget[];
  continue_until_final_target: boolean;
  close_remaining_at_final: boolean;
  enable_trailing_stop: boolean;
  trailing_stop_trigger_r?: number;
  trailing_stop_distance_r?: number;
}

export interface RiskConfig {
  sizing_method: SizingMethod;
  sizing_value: number;
  capital: number;
  max_risk_per_trade?: number;
  stop_loss: StopLossConfig;
  take_profit: TakeProfitConfig;
}

export interface TradeManagementRule {
  id: string;
  event: string;
  action: string;
  params?: Record<string, any>;
  description?: string;
}

export interface EntryConfig {
  side: 'BUY' | 'SELL';
  condition_tree: ConditionGroup;
}

export interface StrategyMetadata {
  author?: string;
  source?: 'visual' | 'ai' | 'pinescript' | 'template';
  source_pinescript?: string;
  changelog?: string;
  parent_version_id?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface StrategyDefinition {
  id?: string;
  name: string;
  description?: string;
  version: number;
  timeframe: string;
  asset_symbol: string;
  intrabar_model: 'conservative' | 'ohlc_deterministic' | 'lower_timeframe' | 'custom_priority';
  indicators: IndicatorConfig[];
  entry: EntryConfig;
  risk: RiskConfig;
  trade_management: TradeManagementRule[];
  metadata?: StrategyMetadata;
}

/**
 * Returns the canonical Bearish Order Block Momentum Short strategy
 * requested in Section 5 of the Master Prompt.
 */
export function getDefaultOrderBlockStrategy(): StrategyDefinition {
  return {
    name: 'Bearish Order Block Momentum Short',
    description: 'SELL when Bearish Order Block exists, Red zone width > Green zone width, >=2 consecutive red candles, and candle range <= 20 points. Stop Loss at Order Block Start, Take Profit 1R -> 2R -> 3R -> 4R with progressive SL moves.',
    version: 1,
    timeframe: '1m',
    asset_symbol: 'XAUUSD',
    intrabar_model: 'conservative',
    indicators: [
      {
        id: 'ind_ob_1',
        type: 'order_block',
        name: 'Volumized Order Blocks',
        params: {
          swing_lookback: 5,
          volume_threshold: 1.2,
          mitigation_mode: 'wick_or_close',
          show_breakers: true,
        },
        outputs: [
          'bullish_ob_exists',
          'bearish_ob_exists',
          'bearish_zone_width',
          'bullish_zone_width',
          'ob_top',
          'ob_bottom',
          'ob_start',
          'ob_volume',
        ],
      },
    ],
    entry: {
      side: 'SELL',
      condition_tree: {
        type: 'group',
        id: 'root_group',
        logical_op: 'AND',
        conditions: [
          {
            type: 'rule',
            id: 'c_ob_bear_exists',
            left: { kind: 'order_block', field: 'bearish_ob_exists', indicator_id: 'ind_ob_1' },
            operator: '==',
            right: { kind: 'boolean', field: 'true', value: true },
            description: 'Bearish Order Block exists',
          },
          {
            type: 'rule',
            id: 'c_ob_width_cmp',
            left: { kind: 'order_block', field: 'bearish_zone_width', indicator_id: 'ind_ob_1' },
            operator: '>',
            right: { kind: 'order_block', field: 'bullish_zone_width', indicator_id: 'ind_ob_1' },
            description: 'Red Bearish Zone Width > Green Bullish Zone Width',
          },
          {
            type: 'rule',
            id: 'c_consec_bearish',
            left: { kind: 'price_action', field: 'consecutive_bearish_candles' },
            operator: '>=',
            right: { kind: 'number', field: 'value', value: 2 },
            description: 'Consecutive Bearish Candles >= 2',
          },
          {
            type: 'rule',
            id: 'c_candle_range',
            left: { kind: 'price_action', field: 'candle_range_points', params: { lookback: 2 } },
            operator: '<=',
            right: { kind: 'number', field: 'value', value: 20, unit: 'points' },
            description: 'Candle Range <= 20 points',
          },
        ],
      },
    },
    risk: {
      sizing_method: 'risk_pct',
      sizing_value: 1.0,
      capital: 100000,
      max_risk_per_trade: 1000,
      stop_loss: {
        type: 'order_block_start',
        reference: 'start',
        price_point: 'start',
        buffer_points: 0,
        buffer_pct: 0,
      },
      take_profit: {
        method: 'rr_ladder',
        targets: [
          {
            id: 'tp_1',
            name: 'Target 1',
            rr_ratio: 1.0,
            close_qty_pct: 25.0,
            action_on_hit: { move_stop_loss_to: 'entry' },
          },
          {
            id: 'tp_2',
            name: 'Target 2',
            rr_ratio: 2.0,
            close_qty_pct: 25.0,
            action_on_hit: { move_stop_loss_to: 'plus_1r' },
          },
          {
            id: 'tp_3',
            name: 'Target 3',
            rr_ratio: 3.0,
            close_qty_pct: 25.0,
            action_on_hit: { move_stop_loss_to: 'plus_2r' },
          },
          {
            id: 'tp_4',
            name: 'Target 4',
            rr_ratio: 4.0,
            close_qty_pct: 25.0,
            action_on_hit: { move_stop_loss_to: 'plus_3r' },
          },
        ],
        continue_until_final_target: true,
        close_remaining_at_final: true,
        enable_trailing_stop: true,
        trailing_stop_trigger_r: 1.0,
        trailing_stop_distance_r: 1.0,
      },
    },
    trade_management: [
      {
        id: 'tm_tp1',
        event: 'tp1_hit',
        action: 'move_sl_to_entry',
        description: 'Move SL to Entry (0R) when Target 1 hits (+1R)',
      },
      {
        id: 'tm_tp2',
        event: 'tp2_hit',
        action: 'move_sl_to_1r',
        description: 'Move SL to +1R when Target 2 hits (+2R)',
      },
      {
        id: 'tm_tp3',
        event: 'tp3_hit',
        action: 'move_sl_to_2r',
        description: 'Move SL to +2R when Target 3 hits (+3R)',
      },
      {
        id: 'tm_tp4',
        event: 'tp4_hit',
        action: 'close_remaining',
        description: 'Close remaining position at Target 4 (+4R)',
      },
    ],
    metadata: {
      source: 'visual',
      tags: ['order_block', 'momentum', 'smart_money'],
      changelog: 'Initial version',
    },
  };
}

/**
 * Palette categories and items for the Visual Block Builder
 */
export interface PaletteItem {
  id: string;
  name: string;
  kind: Operand['kind'];
  field: string;
  category: 'MARKET' | 'INDICATORS' | 'PRICE ACTION' | 'ORDER BLOCK / SMART MONEY';
  description: string;
  defaultOperator: OperatorType;
  defaultRight: Operand;
}

export const STRATEGY_BUILDER_PALETTE: PaletteItem[] = [
  // 1. ORDER BLOCK / SMART MONEY
  {
    id: 'ob_bearish_exists',
    name: 'Bearish Order Block',
    kind: 'order_block',
    field: 'bearish_ob_exists',
    category: 'ORDER BLOCK / SMART MONEY',
    description: 'Triggers when a qualified Bearish Order Block zone exists',
    defaultOperator: '==',
    defaultRight: { kind: 'boolean', field: 'true', value: true },
  },
  {
    id: 'ob_bullish_exists',
    name: 'Bullish Order Block',
    kind: 'order_block',
    field: 'bullish_ob_exists',
    category: 'ORDER BLOCK / SMART MONEY',
    description: 'Triggers when a qualified Bullish Order Block zone exists',
    defaultOperator: '==',
    defaultRight: { kind: 'boolean', field: 'true', value: true },
  },
  {
    id: 'ob_red_gt_green_width',
    name: 'Red Zone Width > Green Zone Width',
    kind: 'order_block',
    field: 'bearish_zone_width',
    category: 'ORDER BLOCK / SMART MONEY',
    description: 'Bearish OB horizontal width is greater than Bullish OB width',
    defaultOperator: '>',
    defaultRight: { kind: 'order_block', field: 'bullish_zone_width' },
  },
  {
    id: 'ob_price_inside_zone',
    name: 'Price Inside Zone',
    kind: 'order_block',
    field: 'price_inside_zone',
    category: 'ORDER BLOCK / SMART MONEY',
    description: 'Current market price is inside an active Order Block zone',
    defaultOperator: '==',
    defaultRight: { kind: 'boolean', field: 'true', value: true },
  },
  {
    id: 'ob_volume_weight',
    name: 'Order Block Volume',
    kind: 'order_block',
    field: 'ob_volume',
    category: 'ORDER BLOCK / SMART MONEY',
    description: 'Volume stored within the Order Block base candle',
    defaultOperator: '>=',
    defaultRight: { kind: 'number', field: 'value', value: 1000 },
  },

  // 2. PRICE ACTION
  {
    id: 'consec_bearish_candles',
    name: 'Consecutive Bearish Candles',
    kind: 'price_action',
    field: 'consecutive_bearish_candles',
    category: 'PRICE ACTION',
    description: 'Count of consecutive red candles in sequence',
    defaultOperator: '>=',
    defaultRight: { kind: 'number', field: 'value', value: 2 },
  },
  {
    id: 'consec_bullish_candles',
    name: 'Consecutive Bullish Candles',
    kind: 'price_action',
    field: 'consecutive_bullish_candles',
    category: 'PRICE ACTION',
    description: 'Count of consecutive green candles in sequence',
    defaultOperator: '>=',
    defaultRight: { kind: 'number', field: 'value', value: 2 },
  },
  {
    id: 'candle_range_points',
    name: 'Candle Range (Points)',
    kind: 'price_action',
    field: 'candle_range_points',
    category: 'PRICE ACTION',
    description: 'High-low price distance across recent consecutive candles',
    defaultOperator: '<=',
    defaultRight: { kind: 'number', field: 'value', value: 20, unit: 'points' },
  },
  {
    id: 'candle_body_size',
    name: 'Candle Body Size',
    kind: 'price_action',
    field: 'body_size',
    category: 'PRICE ACTION',
    description: 'Absolute distance between candle open and close',
    defaultOperator: '>=',
    defaultRight: { kind: 'number', field: 'value', value: 5, unit: 'points' },
  },
  {
    id: 'breakout_high',
    name: 'Breakout Previous High',
    kind: 'price_action',
    field: 'close',
    category: 'PRICE ACTION',
    description: 'Close price breaks above previous swing high',
    defaultOperator: '>',
    defaultRight: { kind: 'market', field: 'high', bar_offset: 1 },
  },
  {
    id: 'breakdown_low',
    name: 'Breakdown Previous Low',
    kind: 'price_action',
    field: 'close',
    category: 'PRICE ACTION',
    description: 'Close price breaks below previous swing low',
    defaultOperator: '<',
    defaultRight: { kind: 'market', field: 'low', bar_offset: 1 },
  },

  // 3. INDICATORS
  {
    id: 'ema_crossover',
    name: 'EMA 9 Crosses Above EMA 21',
    kind: 'indicator',
    field: 'ema_9',
    category: 'INDICATORS',
    description: 'Fast 9-period EMA crosses above slow 21-period EMA',
    defaultOperator: 'crosses_above',
    defaultRight: { kind: 'indicator', field: 'ema_21' },
  },
  {
    id: 'ema_crossunder',
    name: 'EMA 9 Crosses Below EMA 21',
    kind: 'indicator',
    field: 'ema_9',
    category: 'INDICATORS',
    description: 'Fast 9-period EMA crosses below slow 21-period EMA',
    defaultOperator: 'crosses_below',
    defaultRight: { kind: 'indicator', field: 'ema_21' },
  },
  {
    id: 'rsi_oversold',
    name: 'RSI <= 30 (Oversold)',
    kind: 'indicator',
    field: 'rsi_14',
    category: 'INDICATORS',
    description: '14-period RSI is in oversold territory (<= 30)',
    defaultOperator: '<=',
    defaultRight: { kind: 'number', field: 'value', value: 30 },
  },
  {
    id: 'rsi_overbought',
    name: 'RSI >= 70 (Overbought)',
    kind: 'indicator',
    field: 'rsi_14',
    category: 'INDICATORS',
    description: '14-period RSI is in overbought territory (>= 70)',
    defaultOperator: '>=',
    defaultRight: { kind: 'number', field: 'value', value: 70 },
  },
  {
    id: 'macd_signal_cross',
    name: 'MACD Line > Signal Line',
    kind: 'indicator',
    field: 'macd_line',
    category: 'INDICATORS',
    description: 'MACD line is above MACD 9-period signal line',
    defaultOperator: '>',
    defaultRight: { kind: 'indicator', field: 'macd_signal' },
  },
  {
    id: 'supertrend_bullish',
    name: 'Supertrend Bullish',
    kind: 'indicator',
    field: 'supertrend_direction',
    category: 'INDICATORS',
    description: 'Supertrend indicates active bullish trend',
    defaultOperator: '==',
    defaultRight: { kind: 'number', field: 'value', value: 1 },
  },

  // 4. MARKET
  {
    id: 'market_close_gt_open',
    name: 'Bullish Candle (Close > Open)',
    kind: 'market',
    field: 'close',
    category: 'MARKET',
    description: 'Candle close price is greater than open price',
    defaultOperator: '>',
    defaultRight: { kind: 'market', field: 'open' },
  },
  {
    id: 'market_volume_surge',
    name: 'Volume > Average Volume',
    kind: 'market',
    field: 'volume',
    category: 'MARKET',
    description: 'Volume is higher than 20-period average volume',
    defaultOperator: '>',
    defaultRight: { kind: 'indicator', field: 'vol_sma_20' },
  },
  {
    id: 'market_price_above_vwap',
    name: 'Price Above VWAP',
    kind: 'market',
    field: 'close',
    category: 'MARKET',
    description: 'Price is trading above Volume Weighted Average Price',
    defaultOperator: '>',
    defaultRight: { kind: 'indicator', field: 'vwap' },
  },
];
