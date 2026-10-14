// Display helpers for subscription plans (credit billing + legacy plans).

const CREDIT_PLAN_NAMES: Record<string, string> = {
  credit_trial: 'Free trial',
  credits_free: 'Pay as you go',
  credits_starter: 'Starter',
  credits_starter_yr: 'Starter',
  credits_growth: 'Growth',
  credits_growth_yr: 'Growth',
  credits_pro: 'Pro',
  credits_pro_yr: 'Pro',
};

export const isCreditPlan = (plan?: string) => !!plan && (plan.startsWith('credits_') || plan === 'credit_trial');

export function planLabel(plan?: string): string {
  if (!plan) return 'Free';
  if (CREDIT_PLAN_NAMES[plan]) return CREDIT_PLAN_NAMES[plan];
  if (plan === 'free' || plan === 'trial') return 'Trial';
  if (plan.includes('yearly')) return 'Yearly';
  if (plan.includes('monthly')) return 'Monthly';
  if (plan.includes('chatbot')) return 'Chatbot';
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export const formatCredits = (n: number) => `${n.toLocaleString('en-IN')} credit${n === 1 ? '' : 's'}`;
