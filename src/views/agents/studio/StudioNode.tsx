import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AlertTriangle, CircleAlert, CheckCircle2, XCircle } from 'lucide-react';
import { getDef, type StepConfig } from './catalog';

export interface StudioNodeData extends Record<string, unknown> {
  stepType: string; // engine node type; the React Flow type is always "step"
  label: string;
  config: StepConfig;
  issues?: { severity: 'error' | 'warning'; message: string }[];
  runStatus?: 'success' | 'failed';
}

// One component renders every step; the catalog supplies icon, colour,
// summary and (for branching steps) one output handle per branch.
function StudioNodeImpl({ data, selected }: NodeProps) {
  const d = data as StudioNodeData;
  const type = d.stepType;
  const def = getDef(type);
  const Icon = def?.icon ?? CircleAlert;
  const accent = def?.accent ?? '#9ca3af';
  const cfg = d.config ?? {};
  const branches = def?.branches?.(cfg) ?? null;
  const isTrigger = def?.group === 'trigger';
  const errors = d.issues?.filter(i => i.severity === 'error').length ?? 0;
  const warnings = d.issues?.filter(i => i.severity === 'warning').length ?? 0;

  return (
    <div
      className="relative w-[260px] rounded-2xl border bg-gray-900 shadow-xl transition-[border-color,box-shadow]"
      style={{ borderColor: selected ? accent : errors ? '#ef4444' : '#374151', ...(selected ? { boxShadow: `0 0 0 2px ${accent}55` } : {}) }}
    >
      {!isTrigger && (
        <Handle type="target" position={Position.Top} className="!h-3.5 !w-3.5 !border-2 !border-gray-900" style={{ background: accent }} />
      )}

      <div className="flex items-start gap-3 px-3.5 pt-3 pb-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: `${accent}22`, color: accent }}>
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>
              {isTrigger ? 'Trigger · ' : ''}{def?.title ?? type}
            </span>
          </div>
          <div className="truncate text-[13px] font-semibold text-white">{d.label || def?.title}</div>
          <div className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-400">{def ? def.summary(cfg) : 'Unsupported step: delete it'}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {errors > 0 && <span title={d.issues?.map(i => i.message).join('\n')}><CircleAlert size={15} className="text-red-400" /></span>}
          {!errors && warnings > 0 && <span title={d.issues?.map(i => i.message).join('\n')}><AlertTriangle size={15} className="text-amber-400" /></span>}
          {d.runStatus === 'success' && <CheckCircle2 size={15} className="text-emerald-400" />}
          {d.runStatus === 'failed' && <XCircle size={15} className="text-red-400" />}
        </div>
      </div>

      {branches ? (
        <div className="flex border-t border-gray-800">
          {branches.map(b => (
            <div key={b.id} className="relative flex-1 px-1 pb-3 pt-1.5 text-center">
              <span className="block truncate text-[10px] font-medium text-gray-300" title={b.label}>{b.label}</span>
              <Handle
                id={b.id}
                type="source"
                position={Position.Bottom}
                className="!h-3.5 !w-3.5 !border-2 !border-gray-900"
                style={{ background: accent, left: '50%' }}
              />
            </div>
          ))}
        </div>
      ) : (
        <Handle type="source" position={Position.Bottom} className="!h-3.5 !w-3.5 !border-2 !border-gray-900" style={{ background: accent }} />
      )}
    </div>
  );
}

export const StudioNode = memo(StudioNodeImpl);
