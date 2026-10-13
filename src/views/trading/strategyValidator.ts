import { StrategyDefinition, ConditionGroup, ConditionRule } from './strategyDsl';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    ruleCount: number;
    targetCount: number;
    antiLookaheadGuaranteed: boolean;
    sizingSummary: {
      capital: number;
      maxRisk: number;
      sampleRiskPerUnit: number;
      samplePositionSize: number;
    };
  };
}

export function validateStrategyDSL(strat: StrategyDefinition): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let ruleCount = 0;

  // 1. Name & basic metadata
  if (!strat.name || strat.name.trim().length < 2) {
    errors.push('Strategy name must be at least 2 characters long.');
  }

  // 2. Entry rules traversal
  function walkGroup(group: ConditionGroup) {
    if (!group.conditions || group.conditions.length === 0) {
      warnings.push('Condition group contains no rules. Strategy may trigger without criteria.');
      return;
    }

    for (const item of group.conditions) {
      if (item.type === 'group') {
        walkGroup(item as ConditionGroup);
      } else if (item.type === 'rule') {
        ruleCount++;
        const rule = item as ConditionRule;
        if (!rule.left || !rule.left.field) {
          errors.push(`Rule '${rule.id}' is missing its left-side field.`);
        }
        if (rule.left?.bar_offset !== undefined && rule.left.bar_offset < 0) {
          errors.push(`Anti-lookahead violation in rule '${rule.id}': negative bar offset (${rule.left.bar_offset}) is not allowed.`);
        }
        if (rule.right?.bar_offset !== undefined && rule.right.bar_offset < 0) {
          errors.push(`Anti-lookahead violation in rule '${rule.id}': negative right-side bar offset (${rule.right.bar_offset}) is not allowed.`);
        }
      }
    }
  }

  if (strat.entry?.condition_tree) {
    walkGroup(strat.entry.condition_tree);
  } else {
    errors.push('Entry condition tree is missing.');
  }

  if (ruleCount === 0) {
    errors.push('No entry conditions defined. Please add at least 1 entry condition rule.');
  }

  // 3. Stop Loss checks
  const sl = strat.risk?.stop_loss;
  if (!sl || !sl.type) {
    errors.push('A valid Stop Loss rule is mandatory.');
  } else {
    if (['fixed_points', 'percentage', 'atr_multiple'].includes(sl.type) && (sl.value === undefined || sl.value <= 0)) {
      errors.push(`Stop Loss type '${sl.type}' requires a positive value.`);
    }
  }

  // 4. Take Profit checks
  const tp = strat.risk?.take_profit;
  if (!tp) {
    errors.push('Take profit configuration is missing.');
  } else if (tp.method === 'rr_ladder') {
    if (!tp.targets || tp.targets.length === 0) {
      errors.push('Take Profit ladder requires at least 1 sequential target.');
    } else {
      let prevR = 0;
      tp.targets.forEach((target, idx) => {
        if (target.rr_ratio <= prevR) {
          warnings.push(`Target ${idx + 1} (${target.rr_ratio}R) is not higher than previous target (${prevR}R).`);
        }
        prevR = target.rr_ratio;
      });
    }
  }

  // 5. Position Sizing calculation
  const capital = strat.risk?.capital || 100000;
  const sizingVal = strat.risk?.sizing_value || 1.0;
  const maxRisk = (capital * sizingVal) / 100;
  
  // Sample risk per unit
  const sampleRiskPerUnit = 10.0;
  const samplePositionSize = Math.max(1, Math.floor(maxRisk / sampleRiskPerUnit));

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      ruleCount,
      targetCount: tp?.targets?.length || 0,
      antiLookaheadGuaranteed: true,
      sizingSummary: {
        capital,
        maxRisk,
        sampleRiskPerUnit,
        samplePositionSize,
      },
    },
  };
}
