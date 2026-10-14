import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Rocket, MessageCircle, Globe, Webhook, Clock, Copy, Check, CircleAlert, Info, PauseCircle } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import type { AgentDeployment, GraphIssue } from '@/types/agent';

export interface DeployChoice { whatsapp: boolean; chatbot: boolean; webhook: boolean; schedule: boolean }

interface Props {
  status: 'draft' | 'active' | 'paused';
  deployment?: AgentDeployment;
  available: DeployChoice; // which channels the flow has a trigger for
  errors: GraphIssue[];
  result: { issues: GraphIssue[]; notes: string[]; error?: string } | null;
  busy: boolean;
  onDeploy: (c: DeployChoice) => void;
  onPause: () => void;
  onClose: () => void;
}

const OPTIONS: { key: keyof DeployChoice; title: string; text: string; needs: string; icon: typeof Globe; link?: { to: string; label: string } }[] = [
  { key: 'whatsapp', title: 'WhatsApp', text: 'Answers messages that arrive on your connected WhatsApp number. Replaces the classic WhatsApp AI bot while live.', needs: 'Needs a “Message received” trigger set to WhatsApp or Any channel.', icon: MessageCircle, link: { to: '/whatsapp', label: 'Connect WhatsApp' } },
  { key: 'chatbot', title: 'Website chat', text: 'Answers visitors in the chat widget on your website.', needs: 'Needs a “Message received” trigger set to Website chat or Any channel.', icon: Globe, link: { to: '/website-chatbot', label: 'Set up the website chatbot' } },
  { key: 'webhook', title: 'Webhook URL', text: 'Runs whenever another app POSTs JSON to a private URL.', needs: 'Needs a “Webhook received” trigger.', icon: Webhook },
  { key: 'schedule', title: 'Schedule', text: 'Runs by itself at the times set in the schedule trigger.', needs: 'Needs an “On a schedule” trigger.', icon: Clock },
];

export function DeployDialog({ status, deployment, available, errors, result, busy, onDeploy, onPause, onClose }: Props) {
  const live = status === 'active';
  const [choice, setChoice] = useState<DeployChoice>(() => {
    const d = deployment;
    if (d && (d.whatsapp || d.chatbot || d.webhook || d.schedule)) {
      return { whatsapp: d.whatsapp && available.whatsapp, chatbot: d.chatbot && available.chatbot, webhook: d.webhook && available.webhook, schedule: d.schedule && available.schedule };
    }
    // Sensible default: every channel the flow can serve, except website
    // chat, which needs the chatbot set up first.
    return { whatsapp: available.whatsapp, chatbot: false, webhook: available.webhook, schedule: available.schedule };
  });
  const [copied, setCopied] = useState('');
  const any = Object.values(choice).some(Boolean);
  const blocking = errors.filter(e => e.severity === 'error');
  const hookUrl = deployment?.webhookToken ? API_ENDPOINTS.agents.hook(deployment.webhookToken) : '';
  const curl = hookUrl ? `curl -X POST '${hookUrl}' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"name": "Priya", "phone": "919876543210", "message": "Hi"}'` : '';

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(''), 1500); });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="deploy-title">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <h2 id="deploy-title" className="flex items-center gap-2 text-[15px] font-bold text-white"><Rocket size={17} className="text-emerald-400" /> {live ? 'Live settings' : 'Deploy this employee'}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1 text-gray-500 hover:bg-gray-800 hover:text-white"><X size={17} /></button>
        </div>

        <div className="space-y-4 p-5">
          {blocking.length > 0 && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-[13px] font-semibold text-red-200">Fix these first:</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[12px] text-red-200">
                {blocking.map((e, i) => <li key={i}>{e.message}</li>)}
              </ul>
            </div>
          )}

          <p className="text-[13px] text-gray-300">Where should it work?</p>
          <div className="space-y-2">
            {OPTIONS.map(o => {
              const ok = available[o.key];
              const on = choice[o.key];
              const Icon = o.icon;
              return (
                <label key={o.key} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${on ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-gray-800'} ${ok ? '' : 'cursor-not-allowed opacity-50'}`}>
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-emerald-500" disabled={!ok} checked={on} onChange={e => setChoice(c => ({ ...c, [o.key]: e.target.checked }))} />
                  <span className="flex-1">
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-white"><Icon size={14} /> {o.title}</span>
                    <span className="mt-0.5 block text-[12px] text-gray-400">{ok ? o.text : o.needs}</span>
                    {ok && o.link && on && <Link to={o.link.to} className="mt-1 inline-block text-[11px] text-emerald-400 underline">{o.link.label}</Link>}
                  </span>
                </label>
              );
            })}
          </div>

          {result?.error && (
            <p className="flex gap-2 rounded-xl bg-red-500/10 p-3 text-[12px] text-red-200"><CircleAlert size={14} className="mt-px shrink-0" /> {result.error}</p>
          )}
          {result?.issues?.filter(i => i.severity === 'error' && !i.nodeId).map((i, k) => (
            <p key={k} className="flex gap-2 rounded-xl bg-red-500/10 p-3 text-[12px] text-red-200"><CircleAlert size={14} className="mt-px shrink-0" /> {i.message}</p>
          ))}
          {result?.notes?.map((n, k) => (
            <p key={k} className="flex gap-2 rounded-xl bg-amber-500/10 p-3 text-[12px] text-amber-100"><Info size={14} className="mt-px shrink-0" /> {n}</p>
          ))}

          {live && deployment?.webhook && hookUrl && (
            <div className="space-y-2 rounded-xl border border-gray-800 bg-gray-950 p-3">
              <p className="text-[12px] font-semibold text-white">Your webhook URL</p>
              <p className="text-[11px] text-gray-400">Keep it private: anyone with the URL can start this employee.</p>
              <div className="flex gap-2">
                <code className="flex-1 truncate rounded-lg bg-black/40 px-2 py-1.5 text-[11px] text-emerald-300">{hookUrl}</code>
                <button type="button" onClick={() => copy('url', hookUrl)} className="rounded-lg border border-gray-700 px-2 text-gray-300 hover:bg-gray-800" aria-label="Copy URL">
                  {copied === 'url' ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
              <pre className="relative overflow-x-auto rounded-lg bg-black/40 p-2 text-[10px] text-gray-300">{curl}</pre>
              <button type="button" onClick={() => copy('curl', curl)} className="text-[11px] text-emerald-400 underline">{copied === 'curl' ? 'Copied' : 'Copy example request'}</button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-gray-800 px-5 py-4">
          {live ? (
            <button type="button" onClick={onPause} disabled={busy} className="flex items-center gap-1.5 rounded-xl border border-gray-700 px-3 py-2 text-[13px] text-gray-200 hover:bg-gray-800 disabled:opacity-50">
              <PauseCircle size={15} /> Pause
            </button>
          ) : <span />}
          <button
            type="button"
            onClick={() => onDeploy(choice)}
            disabled={busy || !any || blocking.length > 0}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            <Rocket size={14} /> {busy ? 'Deploying…' : live ? 'Update live settings' : 'Deploy now'}
          </button>
        </div>
      </div>
    </div>
  );
}
