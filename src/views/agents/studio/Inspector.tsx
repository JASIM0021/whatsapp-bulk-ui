import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Trash2, X, ChevronDown, CircleAlert, AlertTriangle, Coins } from 'lucide-react';
import { asList, getDef, type Field, type StepConfig } from './catalog';

export interface VariableOption { key: string; label: string; from: string }

interface Props {
  nodeId: string;
  type: string;
  label: string;
  config: StepConfig;
  issues: { severity: 'error' | 'warning'; message: string }[];
  variables: VariableOption[];
  connectors: { id: string; name: string }[];
  eventTypes: { slug: string; title: string }[];
  onChange: (patch: { label?: string; config?: StepConfig }) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onClose: () => void;
}

const inputCls =
  'w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-[13px] text-gray-100 placeholder:text-gray-600 focus:border-emerald-500 focus:outline-none';

// Settings form for the selected step, generated from the catalog.
export function Inspector({ nodeId, type, label, config, issues, variables, connectors, eventTypes, onChange, onDelete, onDuplicate, onClose }: Props) {
  const def = getDef(type);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLTextAreaElement | HTMLInputElement | null>>({});
  const set = (key: string, value: unknown) => onChange({ config: { ...config, [key]: value } });

  const insertVar = (key: string, v: string) => {
    const el = fieldRefs.current[key];
    const cur = String(config[key] ?? '');
    const token = `{{${v}}}`;
    if (!el) return set(key, cur + token);
    const start = el.selectionStart ?? cur.length;
    const end = el.selectionEnd ?? cur.length;
    set(key, cur.slice(0, start) + token + cur.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  if (!def) {
    return (
      <Panel title="Unsupported step" onClose={onClose}>
        <p className="text-[13px] text-gray-400">This step type ({type}) isn’t supported any more. Delete it and use a step from the left.</p>
        <DeleteRow onDelete={onDelete} onDuplicate={onDuplicate} />
      </Panel>
    );
  }

  const visible = def.fields.filter(f => (!f.showIf || f.showIf(config)));
  const basic = visible.filter(f => !f.advanced);
  const advanced = visible.filter(f => f.advanced);
  const Icon = def.icon;

  const renderField = (f: Field) => {
    const v = config[f.key];
    switch (f.type) {
      case 'select':
        return (
          <select value={v ?? f.options?.[0]?.value ?? ''} onChange={e => set(f.key, e.target.value)} className={inputCls}>
            {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      case 'number':
        return <input type="number" min={0} value={v ?? ''} onChange={e => set(f.key, e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />;
      case 'toggle':
        return (
          <button
            type="button"
            role="switch"
            aria-checked={v !== false && v !== undefined ? !!v : false}
            onClick={() => set(f.key, !v)}
            className="flex w-full items-start gap-3 text-left"
          >
            <span className={`mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${v ? 'bg-emerald-500' : 'bg-gray-700'}`}>
              <span className={`h-4 w-4 rounded-full bg-white transition-transform ${v ? 'translate-x-4' : ''}`} />
            </span>
            <span className="text-[13px] text-gray-200">{f.label}</span>
          </button>
        );
      case 'list':
        return (
          <textarea
            rows={4}
            value={Array.isArray(v) ? v.join('\n') : String(v ?? '')}
            onChange={e => set(f.key, e.target.value.split('\n'))}
            onBlur={e => set(f.key, asList(e.target.value))}
            className={`${inputCls} resize-y`}
          />
        );
      case 'connector':
        return connectors.length ? (
          <select value={v ?? ''} onChange={e => set(f.key, e.target.value)} className={inputCls}>
            <option value="">Choose a connector…</option>
            {connectors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        ) : (
          <p className="rounded-xl border border-dashed border-gray-700 p-3 text-[12px] text-gray-400">
            You have no saved connectors. <Link to="/connectors" className="text-emerald-400 underline">Create one</Link> from a cURL command, then come back.
          </p>
        );
      case 'eventType':
        return (
          <>
            <select value={v ?? ''} onChange={e => set(f.key, e.target.value)} className={inputCls}>
              <option value="">My first active meeting type</option>
              {eventTypes.map(e => <option key={e.slug} value={e.slug}>{e.title}</option>)}
            </select>
            {!eventTypes.length && (
              <p className="mt-1.5 text-[11px] text-amber-300">No meeting types yet. <Link to="/calendar" className="underline">Set up Calendar</Link> first.</p>
            )}
          </>
        );
      case 'template':
      case 'textarea':
      case 'text': {
        const multi = f.type === 'textarea' || (f.type === 'template' && (f.rows ?? 2) > 1);
        const common = {
          ref: (el: HTMLTextAreaElement | HTMLInputElement | null) => { fieldRefs.current[f.key] = el; },
          value: v ?? '',
          placeholder: f.placeholder,
          onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => set(f.key, e.target.value),
        };
        return (
          <>
            {multi
              ? <textarea {...common} rows={f.rows ?? 3} className={`${inputCls} resize-y font-[inherit]`} />
              : <input {...common} type="text" className={inputCls} />}
            {f.type === 'template' && variables.length > 0 && (
              <VariableChips variables={variables} onPick={k => insertVar(f.key, k)} />
            )}
          </>
        );
      }
    }
  };

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${def.accent}22`, color: def.accent }}><Icon size={14} /></span>
          {def.title}
        </span>
      }
      onClose={onClose}
    >
      <p className="text-[12px] leading-relaxed text-gray-400">{def.description}</p>
      {def.credits && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-300"><Coins size={12} /> Uses {def.credits}</p>
      )}

      {issues.length > 0 && (
        <ul className="space-y-1.5">
          {issues.map((i, k) => (
            <li key={k} className={`flex gap-2 rounded-lg px-2.5 py-2 text-[12px] ${i.severity === 'error' ? 'bg-red-500/10 text-red-300' : 'bg-amber-500/10 text-amber-200'}`}>
              {i.severity === 'error' ? <CircleAlert size={14} className="mt-px shrink-0" /> : <AlertTriangle size={14} className="mt-px shrink-0" />}
              {i.message}
            </li>
          ))}
        </ul>
      )}

      <label className="block">
        <span className="mb-1 block text-[12px] font-medium text-gray-300">Step name</span>
        <input value={label} onChange={e => onChange({ label: e.target.value })} className={inputCls} />
      </label>

      {basic.map(f => (
        <div key={f.key}>
          {f.type !== 'toggle' && <span className="mb-1 block text-[12px] font-medium text-gray-300">{f.label}</span>}
          {renderField(f)}
          {f.help && <p className="mt-1 text-[11px] leading-snug text-gray-500">{f.help}</p>}
        </div>
      ))}

      {advanced.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowAdvanced(s => !s)} className="flex items-center gap-1 text-[12px] font-medium text-gray-400 hover:text-gray-200">
            <ChevronDown size={13} className={showAdvanced ? 'rotate-180' : ''} /> Advanced
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-4">
              {advanced.map(f => (
                <div key={f.key}>
                  {f.type !== 'toggle' && <span className="mb-1 block text-[12px] font-medium text-gray-300">{f.label}</span>}
                  {renderField(f)}
                  {f.help && <p className="mt-1 text-[11px] text-gray-500">{f.help}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {def.outputs.length > 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Later steps can use</p>
          <ul className="mt-1.5 space-y-1">
            {def.outputs.map(o => (
              <li key={o.key} className="flex justify-between gap-2 text-[12px]">
                <code className="text-emerald-300">{`{{${config.output_var && o.key === 'ai_response' ? config.output_var : o.key}}}`}</code>
                <span className="text-right text-gray-500">{o.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <DeleteRow onDelete={onDelete} onDuplicate={onDuplicate} />
      <p className="text-center text-[10px] text-gray-600">Step ID {nodeId}</p>
    </Panel>
  );
}

function VariableChips({ variables, onPick }: { variables: VariableOption[]; onPick: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const shown = open ? variables : variables.slice(0, 4);
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      <span className="text-[10px] text-gray-500">Insert:</span>
      {shown.map(v => (
        <button
          key={v.key}
          type="button"
          title={`${v.label} (from ${v.from})`}
          onClick={() => onPick(v.key)}
          className="rounded-md border border-gray-700 bg-gray-900 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300 hover:border-emerald-500"
        >
          {v.key}
        </button>
      ))}
      {variables.length > 4 && (
        <button type="button" onClick={() => setOpen(o => !o)} className="text-[10px] text-gray-400 underline">
          {open ? 'less' : `+${variables.length - 4} more`}
        </button>
      )}
    </div>
  );
}

function Panel({ title, onClose, children }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode }) {
  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-gray-800 bg-gray-900/95">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <h3 className="text-[13px] font-semibold text-white">{title}</h3>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-gray-500 hover:bg-gray-800 hover:text-white"><X size={16} /></button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">{children}</div>
    </aside>
  );
}

function DeleteRow({ onDelete, onDuplicate }: { onDelete: () => void; onDuplicate: () => void }) {
  return (
    <div className="flex gap-2 border-t border-gray-800 pt-4">
      <button type="button" onClick={onDuplicate} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-700 py-2 text-[12px] text-gray-300 hover:bg-gray-800">
        <Copy size={13} /> Duplicate
      </button>
      <button type="button" onClick={onDelete} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-[12px] text-red-300 hover:bg-red-500/20">
        <Trash2 size={13} /> Delete step
      </button>
    </div>
  );
}
