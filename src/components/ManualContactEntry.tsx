import { useState } from 'react';
import { UserPlus, Trash2, PlusCircle } from 'lucide-react';
import { Contact } from '@/types/contact';
import { validateAndFormatPhone } from '@/lib/validation';

interface ManualContactEntryProps {
  onAdd: (contacts: Contact[]) => void;
}

interface Row {
  name: string;
  phone: string;
}

export function ManualContactEntry({ onAdd }: ManualContactEntryProps) {
  const [rows, setRows] = useState<Row[]>([{ name: '', phone: '' }]);
  const [error, setError] = useState('');

  const updateRow = (index: number, field: keyof Row, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    setError('');
  };

  const addRow = () => setRows((prev) => [...prev, { name: '', phone: '' }]);

  const removeRow = (index: number) =>
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? [{ name: '', phone: '' }] : next;
    });

  const handleSubmit = () => {
    const filled = rows.filter((r) => r.phone.trim() !== '');
    if (filled.length === 0) {
      setError('Please enter at least one phone number.');
      return;
    }

    const contacts: Contact[] = filled.map((r, i) => {
      const validation = validateAndFormatPhone(r.phone.trim());
      return {
        id: `manual-${Date.now()}-${i}`,
        name: r.name.trim() || undefined,
        phone: r.phone.trim(),
        formattedPhone: validation.formattedPhone,
        isValid: validation.isValid,
        validationError: validation.error,
        row: i + 1,
      };
    });

    onAdd(contacts);
    setRows([{ name: '', phone: '' }]);
    setError('');
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <UserPlus size={18} className="text-primary-600" />
        <span className="text-sm font-semibold text-gray-800">Add Contacts Manually</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr_36px] gap-2 px-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name (optional)</span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone *</span>
          <span />
        </div>

        {/* Rows */}
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_36px] gap-2 items-center">
              <input
                type="text"
                placeholder="John Doe"
                value={row.name}
                onChange={(e) => updateRow(idx, 'name', e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="tel"
                placeholder="919876543210"
                value={row.phone}
                onChange={(e) => updateRow(idx, 'phone', e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              />
              <button
                onClick={() => removeRow(idx)}
                title="Remove row"
                className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={addRow}
            className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            <PlusCircle size={16} />
            Add another row
          </button>

          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <UserPlus size={16} />
            Add to List
          </button>
        </div>
      </div>
    </div>
  );
}
