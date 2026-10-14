import {
  MessageCircle, Webhook, Clock, BookOpen, Sparkles, Split, GitBranch, Cpu, Variable,
  Reply, Send, Mail, BellRing, CalendarCheck, Globe, Plug, type LucideIcon,
} from 'lucide-react';

// Every step the studio offers. Types and config keys must match the Go
// engine (whatsapp-bulk-server-go/internal/service/agent_engine.go).

// Step settings are free-form JSON shared with the Go engine.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StepConfig = Record<string, any>;

export type FieldType =
  | 'text' | 'textarea' | 'template' | 'select' | 'number' | 'toggle' | 'list' | 'connector' | 'eventType';

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  placeholder?: string;
  rows?: number;
  options?: { value: string; label: string }[];
  showIf?: (cfg: StepConfig) => boolean;
  advanced?: boolean;
}

export interface Branch { id: string; label: string }

export interface NodeDef {
  type: string;
  group: 'trigger' | 'think' | 'do';
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string; // hex
  defaults: StepConfig;
  fields: Field[];
  outputs: { key: string; label: string }[];
  summary: (cfg: StepConfig) => string;
  branches?: (cfg: StepConfig) => Branch[];
  credits?: string;
}

export const asList = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.map(String).map(s => s.trim()).filter(Boolean)
    : typeof v === 'string'
      ? v.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
      : [];

export const intentHandle = (intent: string) => `intent:${intent.trim().toLowerCase()}`;

const clip = (s: unknown, n = 60) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
};

const CHANNELS = [
  { value: 'any', label: 'Any channel (WhatsApp and website chat)' },
  { value: 'whatsapp', label: 'WhatsApp only' },
  { value: 'chatbot', label: 'Website chat only' },
];

const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney', 'UTC']
  .map(z => ({ value: z, label: z }));

export const NODE_DEFS: NodeDef[] = [
  // ── Triggers ──
  {
    type: 'trigger_inbound', group: 'trigger', title: 'Message received',
    description: 'Starts when a customer messages you on WhatsApp or your website chat.',
    icon: MessageCircle, accent: '#10b981',
    defaults: { channel: 'any' },
    fields: [{ key: 'channel', label: 'Listen on', type: 'select', options: CHANNELS }],
    outputs: [
      { key: 'message', label: 'Their message' },
      { key: 'contact_phone', label: 'Their WhatsApp number' },
      { key: 'channel', label: 'Channel (whatsapp / chatbot)' },
    ],
    summary: c => CHANNELS.find(o => o.value === (c.channel || 'any'))?.label ?? 'Any channel',
  },
  {
    type: 'trigger_webhook', group: 'trigger', title: 'Webhook received',
    description: 'Starts when another app (a form, CRM or store) sends data to this employee’s URL.',
    icon: Webhook, accent: '#14b8a6',
    defaults: { sample: '{\n  "name": "Priya",\n  "phone": "919876543210",\n  "message": "Do you deliver to Pune?"\n}' },
    fields: [{
      key: 'sample', label: 'Example of the data you’ll send (JSON)', type: 'textarea', rows: 6,
      help: 'Each field becomes a variable, e.g. {{name}}. You get the URL when you deploy.',
    }],
    outputs: [],
    summary: () => 'POST JSON to this employee’s URL',
  },
  {
    type: 'trigger_schedule', group: 'trigger', title: 'On a schedule',
    description: 'Runs by itself every day at a set time, or every few minutes or hours.',
    icon: Clock, accent: '#0ea5e9',
    defaults: { mode: 'daily', time: '09:00', timezone: 'Asia/Kolkata', days: '' },
    fields: [
      { key: 'mode', label: 'Repeat', type: 'select', options: [{ value: 'daily', label: 'Every day at a time' }, { value: 'interval', label: 'Every few minutes / hours' }] },
      { key: 'time', label: 'Time (24-hour, HH:MM)', type: 'text', placeholder: '09:00', showIf: c => (c.mode || 'daily') === 'daily' },
      { key: 'days', label: 'Only on these days (optional)', type: 'text', placeholder: 'Mon, Tue, Wed, Thu, Fri', help: 'Leave empty for every day.', showIf: c => (c.mode || 'daily') === 'daily' },
      { key: 'timezone', label: 'Time zone', type: 'select', options: TIMEZONES, showIf: c => (c.mode || 'daily') === 'daily' },
      { key: 'interval_minutes', label: 'Every how many minutes (15 or more)', type: 'number', showIf: c => c.mode === 'interval' },
    ],
    outputs: [{ key: 'today', label: 'Today’s date' }],
    summary: c => c.mode === 'interval'
      ? `Every ${c.interval_minutes || 60} minutes`
      : `Daily at ${c.time || '09:00'}${asList(c.days).length ? ` (${asList(c.days).join(', ')})` : ''}`,
  },

  // ── Think ──
  {
    type: 'knowledge_rag', group: 'think', title: 'Look up business facts',
    description: 'Gives the AI your facts (prices, hours, policies) so it answers correctly.',
    icon: BookOpen, accent: '#8b5cf6',
    defaults: { knowledge: '', use_business_profile: true },
    fields: [
      { key: 'knowledge', label: 'Facts your employee should know', type: 'textarea', rows: 8, placeholder: 'We open 10am–8pm, Monday to Saturday.\nDelivery is free above ₹999 in Mumbai and Pune.\nRefunds within 7 days of delivery.' },
      { key: 'use_business_profile', label: 'Also use the business details from my Website Chatbot settings', type: 'toggle' },
    ],
    outputs: [{ key: 'knowledge_context', label: 'Relevant facts' }],
    summary: c => c.knowledge ? clip(c.knowledge) : c.use_business_profile !== false ? 'Uses your business profile' : 'No facts yet',
  },
  {
    type: 'llm_reasoning', group: 'think', title: 'AI writes a reply',
    description: 'The AI writes an answer using your instructions, the facts and the conversation so far.',
    icon: Sparkles, accent: '#3b82f6', credits: '1 credit per run',
    defaults: { system_prompt: 'You are a friendly assistant for this business. Answer in 1–4 short sentences, in the customer’s language. Never invent prices or policies.', prompt: '{{message}}', use_history: true },
    fields: [
      { key: 'system_prompt', label: 'How should the AI behave?', type: 'template', rows: 6, help: 'Describe its role, tone and rules.' },
      { key: 'prompt', label: 'What should it respond to?', type: 'template', rows: 2, help: 'Usually {{message}}: the customer’s message.' },
      { key: 'use_history', label: 'Remember earlier messages in the conversation', type: 'toggle' },
      { key: 'output_var', label: 'Save the answer as (variable name)', type: 'text', placeholder: 'ai_response', advanced: true },
    ],
    outputs: [{ key: 'ai_response', label: 'AI answer' }],
    summary: c => clip(c.system_prompt) || 'Write the AI instructions',
  },
  {
    type: 'intent_router', group: 'think', title: 'Sort by topic',
    description: 'The AI decides what the message is about and sends it down the matching path.',
    icon: Split, accent: '#a855f7', credits: '1 credit per run',
    defaults: { intents: ['Pricing or plans', 'Book a meeting'] },
    fields: [
      { key: 'intents', label: 'Topics (one per line)', type: 'list', help: 'Each topic gets its own path. Messages that fit none go to “Anything else”.' },
      { key: 'hint', label: 'Extra notes for sorting (optional)', type: 'text', placeholder: 'Questions about delivery count as Orders', advanced: true },
    ],
    outputs: [{ key: 'detected_intent', label: 'Detected topic' }],
    summary: c => asList(c.intents).join(' · ') || 'Add topics',
    branches: c => [...asList(c.intents).map(i => ({ id: intentHandle(i), label: i })), { id: 'other', label: 'Anything else' }],
  },
  {
    type: 'condition', group: 'think', title: 'If / else',
    description: 'Checks something (like whether the message mentions “refund”) and picks Yes or No.',
    icon: GitBranch, accent: '#f59e0b',
    defaults: { field: '{{message}}', operator: 'contains', value: '' },
    fields: [
      { key: 'field', label: 'Check this', type: 'template', rows: 1 },
      {
        key: 'operator', label: 'Rule', type: 'select', options: [
          { value: 'contains', label: 'contains any of' },
          { value: 'not_contains', label: 'does not contain' },
          { value: 'equals', label: 'is exactly' },
          { value: 'not_equals', label: 'is not' },
          { value: 'starts_with', label: 'starts with' },
          { value: 'is_empty', label: 'is empty' },
          { value: 'is_not_empty', label: 'is not empty' },
          { value: 'greater_than', label: 'is a number greater than' },
          { value: 'less_than', label: 'is a number less than' },
        ],
      },
      { key: 'value', label: 'Value (separate several with commas)', type: 'template', rows: 1, placeholder: 'refund, human, complaint', showIf: c => !['is_empty', 'is_not_empty'].includes(c.operator) },
    ],
    outputs: [{ key: 'condition_result', label: 'Result (true/false)' }],
    summary: c => `${clip(c.field, 20)} ${String(c.operator || 'contains').replace(/_/g, ' ')} ${clip(c.value, 24)}`,
    branches: () => [{ id: 'true', label: 'Yes' }, { id: 'false', label: 'No' }],
  },
  {
    type: 'inhouse_ai', group: 'think', title: 'Your own AI',
    description: 'Sends the message to your own AI model or API and uses its answer.',
    icon: Cpu, accent: '#06b6d4',
    defaults: { url: '', headers: '', body: '', response_path: '' },
    fields: [
      { key: 'url', label: 'Endpoint URL', type: 'text', placeholder: 'https://ai.yourcompany.com/chat' },
      { key: 'headers', label: 'Headers (one per line, Key: Value)', type: 'template', rows: 2, placeholder: 'Authorization: Bearer YOUR_KEY' },
      { key: 'body', label: 'Request body (optional)', type: 'template', rows: 3, help: 'Leave empty to send {"message", "query", "context"}.', advanced: true },
      { key: 'response_path', label: 'Where the answer is in the response', type: 'text', placeholder: 'data.reply', help: 'Leave empty to auto-detect reply/answer/message/text.' },
    ],
    outputs: [{ key: 'ai_response', label: 'Your AI’s answer' }],
    summary: c => clip(c.url) || 'Set the endpoint URL',
  },
  {
    type: 'set_variable', group: 'think', title: 'Save a value',
    description: 'Stores text in a variable you can use in later steps.',
    icon: Variable, accent: '#64748b',
    defaults: { name: '', value: '' },
    fields: [
      { key: 'name', label: 'Variable name', type: 'text', placeholder: 'greeting' },
      { key: 'value', label: 'Value', type: 'template', rows: 2 },
    ],
    outputs: [],
    summary: c => c.name ? `{{${c.name}}} = ${clip(c.value, 30)}` : 'Name the variable',
  },

  // ── Do ──
  {
    type: 'action_reply', group: 'do', title: 'Reply to sender',
    description: 'Sends a reply to the person who messaged (WhatsApp or website chat).',
    icon: Reply, accent: '#22c55e',
    defaults: { text: '{{ai_response}}' },
    fields: [{ key: 'text', label: 'Reply', type: 'template', rows: 3, help: 'Usually {{ai_response}}. For webhooks, the reply is returned in the response.' }],
    outputs: [{ key: 'reply', label: 'Reply sent' }],
    summary: c => clip(c.text) || 'Write the reply',
  },
  {
    type: 'action_whatsapp', group: 'do', title: 'Send WhatsApp',
    description: 'Sends a WhatsApp message to any number from your connected WhatsApp.',
    icon: Send, accent: '#16a34a', credits: '1 credit per message',
    defaults: { to: '{{contact_phone}}', text: '' },
    fields: [
      { key: 'to', label: 'To (number with country code)', type: 'template', rows: 1, placeholder: '{{phone}} or 919876543210' },
      { key: 'text', label: 'Message', type: 'template', rows: 4 },
    ],
    outputs: [],
    summary: c => c.text ? `To ${clip(c.to, 20)}: ${clip(c.text, 30)}` : 'Write the message',
  },
  {
    type: 'action_email', group: 'do', title: 'Send email',
    description: 'Sends an email from the email account you connected on the Email page.',
    icon: Mail, accent: '#0284c7', credits: '1 credit per email',
    defaults: { to: '', subject: '', body: '' },
    fields: [
      { key: 'to', label: 'To', type: 'template', rows: 1, placeholder: '{{email}}' },
      { key: 'subject', label: 'Subject', type: 'template', rows: 1 },
      { key: 'body', label: 'Message', type: 'template', rows: 5 },
    ],
    outputs: [],
    summary: c => c.subject ? `${clip(c.to, 20)} · ${clip(c.subject, 30)}` : 'Fill in the email',
  },
  {
    type: 'action_notify', group: 'do', title: 'Email me',
    description: 'Emails you (or your team) an alert, e.g. when a customer asks for a person.',
    icon: BellRing, accent: '#ef4444',
    defaults: { to: '', subject: 'Update from {{agent_name}}', body: '' },
    fields: [
      { key: 'to', label: 'Send to (leave empty for your account email)', type: 'template', rows: 1 },
      { key: 'subject', label: 'Subject', type: 'template', rows: 1 },
      { key: 'body', label: 'Message', type: 'template', rows: 5, placeholder: '{{contact_phone}} wrote: {{message}}' },
    ],
    outputs: [],
    summary: c => clip(c.subject) || 'Email me',
  },
  {
    type: 'action_calendar', group: 'do', title: 'Get booking link',
    description: 'Finds your next free times and booking link from NexBotix Calendar for the AI to share.',
    icon: CalendarCheck, accent: '#d946ef',
    defaults: { event_slug: '', slots: 3 },
    fields: [
      { key: 'event_slug', label: 'Meeting type', type: 'eventType', help: 'Set these up on the Calendar page.' },
      { key: 'slots', label: 'How many free times to offer', type: 'number' },
    ],
    outputs: [{ key: 'booking_url', label: 'Booking link' }, { key: 'available_slots', label: 'Next free times' }],
    summary: c => (c.event_slug ? `Meeting: ${c.event_slug}` : 'First active meeting type') + ` · ${c.slots ?? 3} times`,
  },
  {
    type: 'action_http', group: 'do', title: 'Call an API',
    description: 'Calls any web address, e.g. to look up an order or add a row to your CRM.',
    icon: Globe, accent: '#f97316',
    defaults: { method: 'POST', url: '', headers: '', body: '', continue_on_error: false, run_in_tests: false },
    fields: [
      { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => ({ value: m, label: m })) },
      { key: 'url', label: 'URL', type: 'template', rows: 1, placeholder: 'https://api.yourstore.com/orders?phone={{contact_phone}}' },
      { key: 'headers', label: 'Headers (one per line, Key: Value)', type: 'template', rows: 2 },
      { key: 'body', label: 'Body (JSON)', type: 'template', rows: 4, showIf: c => c.method !== 'GET', help: 'Leave empty to send all variables.' },
      { key: 'continue_on_error', label: 'Keep going if the API returns an error', type: 'toggle', advanced: true },
      { key: 'run_in_tests', label: 'Really call it during test runs', type: 'toggle', advanced: true, showIf: c => c.method !== 'GET' },
    ],
    outputs: [{ key: 'http_status', label: 'Status code' }, { key: 'http_response', label: 'Response (use {{http_response.field}})' }],
    summary: c => c.url ? `${c.method || 'POST'} ${clip(c.url, 40)}` : 'Enter the URL',
  },
  {
    type: 'action_connector', group: 'do', title: 'Use a saved connector',
    description: 'Runs one of your saved API connectors (set up on the Connectors page).',
    icon: Plug, accent: '#eab308',
    defaults: { connector_id: '', run_in_tests: false },
    fields: [
      { key: 'connector_id', label: 'Connector', type: 'connector' },
      { key: 'run_in_tests', label: 'Really call it during test runs', type: 'toggle', advanced: true },
    ],
    outputs: [{ key: 'connector_response', label: 'Response' }],
    summary: c => c.connector_id ? 'Saved connector' : 'Pick a connector',
  },
];

// Older flows used action_webhook for HTTP calls.
const LEGACY: Record<string, string> = { action_webhook: 'action_http' };

export const getDef = (type?: string): NodeDef | undefined =>
  NODE_DEFS.find(d => d.type === type) ?? NODE_DEFS.find(d => d.type === LEGACY[type ?? '']);

export const GROUPS: { id: NodeDef['group']; title: string; hint: string }[] = [
  { id: 'trigger', title: 'When this happens', hint: 'Every employee starts with one trigger' },
  { id: 'think', title: 'Think', hint: 'AI, facts and decisions' },
  { id: 'do', title: 'Do', hint: 'Reply, send and connect' },
];

// Variables every flow has, whatever the trigger.
export const BASE_VARIABLES = [
  { key: 'agent_name', label: 'This employee’s name' },
  { key: 'today', label: 'Today’s date' },
];

export const sampleKeys = (sample: unknown): string[] => {
  try {
    const obj = JSON.parse(String(sample || '{}'));
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? Object.keys(obj) : [];
  } catch {
    return [];
  }
};
