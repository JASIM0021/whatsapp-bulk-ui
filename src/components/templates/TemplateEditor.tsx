import { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { Template, TemplateCategory, CreateTemplatePayload } from '@/types/template';
import { TemplatePreview } from './TemplatePreview';

const CATEGORIES: TemplateCategory[] = ['Marketing', 'Utility', 'Authentication', 'Custom'];

interface TemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateTemplatePayload) => Promise<void>;
  editingTemplate?: Template | null;
}

// Extract {{variable}} names from body
function extractVariables(body: string): string[] {
  const matches = body.match(/{{([^}]+)}}/g) || [];
  const unique = new Set(matches.map((m) => m.slice(2, -2).trim()));
  return Array.from(unique);
}

export function TemplateEditor({ isOpen, onClose, onSave, editingTemplate }: TemplateEditorProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('Marketing');
  const [body, setBody] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const detectedVars = extractVariables(body);

  useEffect(() => {
    if (editingTemplate) {
      setName(editingTemplate.name);
      setCategory(editingTemplate.category);
      setBody(editingTemplate.body);
    } else {
      setName('');
      setCategory('Marketing');
      setBody('');
    }
    setError('');
  }, [editingTemplate, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) { setError('Template name is required'); return; }
    if (!body.trim()) { setError('Template body is required'); return; }
    setError('');
    setIsSaving(true);
    try {
      await onSave({ name: name.trim(), category, body: body.trim(), variables: detectedVars });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingTemplate ? 'Edit Template' : 'Create Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Flash Sale Alert"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Body *</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message. Use {{variable}} for dynamic content."
                  rows={7}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use <code className="bg-gray-100 px-1 rounded">{'{{variable}}'}</code> syntax for placeholders.{' '}
                  <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code> is auto-replaced per contact.
                </p>
              </div>

              {/* Detected variables */}
              {detectedVars.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                    <Tag size={12} />
                    Detected variables
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {detectedVars.map((v) => (
                      <span key={v} className="px-2 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 text-xs rounded-full">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Preview */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Live Preview</p>
              <TemplatePreview text={body} />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : editingTemplate ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
