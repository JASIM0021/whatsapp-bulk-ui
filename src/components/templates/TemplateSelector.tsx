import { useState, useEffect } from 'react';
import { CheckCircle, PlusCircle } from 'lucide-react';
import { Template, TemplateCategory } from '@/types/template';
import { TemplatePreview } from './TemplatePreview';

const CATEGORY_COLORS: Record<string, string> = {
  Marketing: 'bg-purple-100 text-purple-700',
  Utility: 'bg-blue-100 text-blue-700',
  Authentication: 'bg-yellow-100 text-yellow-700',
  Custom: 'bg-gray-100 text-gray-700',
};

const CATEGORIES: Array<TemplateCategory | 'All'> = ['All', 'Marketing', 'Utility', 'Authentication', 'Custom'];

interface TemplateSelectorProps {
  templates: Template[];
  selected: Template | null;
  onSelect: (template: Template | null) => void;
  resolvedText: string;
  variableValues: Record<string, string>;
  onVariableChange: (name: string, value: string) => void;
  onCreateTemplate?: () => void;
}

export function TemplateSelector({
  templates,
  selected,
  onSelect,
  resolvedText,
  variableValues,
  onVariableChange,
  onCreateTemplate,
}: TemplateSelectorProps) {
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | 'All'>('All');

  const filtered = templates.filter(
    (t) => categoryFilter === 'All' || t.category === categoryFilter
  );

  // Variables that need filling (exclude 'name' — backend handles it per-contact)
  const fillableVars = selected
    ? selected.variables.filter((v) => v !== 'name')
    : [];

  // Reset variable values when template changes
  useEffect(() => {
    if (!selected) return;
    const vars = selected.variables.filter((v) => v !== 'name');
    vars.forEach((v) => {
      if (!(v in variableValues)) {
        onVariableChange(v, '');
      }
    });
  }, [selected, variableValues, onVariableChange]);

  return (
    <div className="space-y-4">
      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
        {onCreateTemplate && (
          <button
            onClick={onCreateTemplate}
            className="ml-auto flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium"
          >
            <PlusCircle size={14} />
            New Template
          </button>
        )}
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(selected?.id === t.id ? null : t)}
            className={`text-left p-3 rounded-lg border-2 transition-all ${
              selected?.id === t.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900 leading-tight">{t.name}</span>
              {selected?.id === t.id && (
                <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
              )}
            </div>
            <span
              className={`inline-block text-xs px-2 py-0.5 rounded-full mb-2 ${
                CATEGORY_COLORS[t.category] || CATEGORY_COLORS.Custom
              }`}
            >
              {t.category}
            </span>
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{t.body}</p>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-8 text-gray-400 text-sm">
            No templates in this category
          </div>
        )}
      </div>

      {/* Variable inputs */}
      {selected && fillableVars.length > 0 && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Fill in variables
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fillableVars.map((v) => (
              <div key={v}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {`{{${v}}}`}
                </label>
                <input
                  type="text"
                  value={variableValues[v] || ''}
                  onChange={(e) => onVariableChange(v, e.target.value)}
                  placeholder={`Enter ${v}`}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            <span className="font-medium">{'{{name}}'}</span> is automatically replaced with each contact's name.
          </p>
        </div>
      )}

      {/* Live preview */}
      {selected && (
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Preview</p>
          <TemplatePreview text={resolvedText} />
        </div>
      )}
    </div>
  );
}
