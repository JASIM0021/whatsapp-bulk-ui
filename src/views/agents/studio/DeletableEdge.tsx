import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow, type EdgeProps } from '@xyflow/react';
import { X } from 'lucide-react';

// Connection line with its branch name (for If / Sort by topic) and a
// remove button that appears once the line is selected (click it).
export function DeletableEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, selected, markerEnd, style }: EdgeProps) {
  const { deleteElements } = useReactFlow();
  const [path, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 14 });

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ strokeWidth: 2, stroke: selected ? '#34d399' : '#4b5563', ...style }} interactionWidth={24} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute flex items-center gap-1"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {label ? (
            <span className="rounded-full border border-gray-700 bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-gray-300">{String(label)}</span>
          ) : null}
          {selected && (
            <button
              type="button"
              aria-label="Remove connection"
              title="Remove connection (or press Delete)"
              onClick={() => deleteElements({ edges: [{ id }] })}
              className="flex h-5 w-5 items-center justify-center rounded-full border border-red-500/60 bg-gray-900 text-red-300 hover:bg-red-500/20"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
