import { useMemo, useState } from 'react';
import { X, Phone, User, Braces, CheckCircle, XCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import type { Contact } from '@/types/contact';
import {
  type SheetData, type ColumnMapping,
  detectMapping, validateMapping, buildContacts, saveMapping, toVarKey,
} from '@/lib/fileParser';

interface ColumnMappingModalProps {
  sheet: SheetData;
  onCancel: () => void;
  onConfirm: (contacts: Contact[]) => void;
}

const PREVIEW_ROWS = 5;

export function ColumnMappingModal({ sheet, onCancel, onConfirm }: ColumnMappingModalProps) {
  const [mapping, setMapping] = useState<ColumnMapping>(() => detectMapping(sheet));

  const error = validateMapping(sheet, mapping);
  const contacts = useMemo(() => (error ? [] : buildContacts(sheet, mapping)), [sheet, mapping, error]);
  const validCount = contacts.filter(c => c.isValid).length;
  const varCols = Object.entries(mapping.vars).filter(([, k]) => k !== null) as [string, string][];

  const setPhone = (col: number) => setMapping(m => {
    const vars = { ...m.vars };
    // The old phone column becomes a normal column again; the new one stops being a variable.
    if (m.phone !== col) vars[m.phone] = null;
    delete vars[col];
    return { ...m, phone: col, name: m.name === col ? null : m.name, vars };
  });
  const setName = (col: number | null) => setMapping(m => {
    const vars = { ...m.vars };
    if (m.name !== null && m.name !== col) vars[m.name] = null;
    if (col !== null) delete vars[col];
    return { ...m, name: col, vars };
  });
  const setVar = (col: number, key: string | null) => setMapping(m => ({ ...m, vars: { ...m.vars, [col]: key } }));

  const confirm = () => {
    if (error || validCount === 0) return;
    saveMapping(sheet.headers, mapping);
    onConfirm(contacts);
  };

  const sampleOf = (col: number) => sheet.rows.find(r => (r[col] ?? '') !== '')?.[col] ?? '';
  const otherCols = sheet.headers.map((_, i) => i).filter(i => i !== mapping.phone && i !== mapping.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0"><FileSpreadsheet size={18} /></div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900">Map your columns</h2>
              <p className="text-xs text-gray-500 truncate">
                {sheet.fileName} · {sheet.rows.length} row{sheet.rows.length === 1 ? '' : 's'}
                {!sheet.hasHeaderRow && ' · no header row detected'}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Required fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-gray-600 flex items-center gap-1"><Phone size={12} />Phone number <span className="text-red-500">*</span></span>
              <select value={mapping.phone} onChange={e => setPhone(Number(e.target.value))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                {sheet.headers.map((h, i) => <option key={i} value={i}>{h}{sampleOf(i) ? ` — e.g. ${sampleOf(i).slice(0, 24)}` : ''}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-gray-600 flex items-center gap-1"><User size={12} />Name <span className="font-normal text-gray-400">(fills {'{{name}}'})</span></span>
              <select value={mapping.name ?? ''} onChange={e => setName(e.target.value === '' ? null : Number(e.target.value))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">No name column</option>
                {sheet.headers.map((h, i) => i !== mapping.phone && (
                  <option key={i} value={i}>{h}{sampleOf(i) ? ` — e.g. ${sampleOf(i).slice(0, 24)}` : ''}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Variables */}
          {otherCols.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-1"><Braces size={12} />Message variables</p>
              <p className="text-[11px] text-gray-500 mb-2">Each ticked column can be used in your message, e.g. “Hi {'{{name}}'}, your order {'{{order_id}}'} ships to {'{{city}}'}.”</p>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                {otherCols.map(col => {
                  const key = mapping.vars[col];
                  const on = key !== null && key !== undefined;
                  return (
                    <div key={col} className="flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 py-2">
                      <input type="checkbox" checked={on} className="h-4 w-4 text-green-600 rounded border-gray-300"
                        onChange={() => setVar(col, on ? null : toVarKey(sheet.headers[col]))} />
                      <div className="w-36 min-w-0">
                        <p className="text-sm text-gray-800 truncate" title={sheet.headers[col]}>{sheet.headers[col]}</p>
                        <p className="text-[11px] text-gray-400 truncate">{sampleOf(col) || 'empty'}</p>
                      </div>
                      <div className={`flex items-center flex-1 min-w-[160px] border rounded-lg px-2 ${on ? 'border-gray-300' : 'border-gray-100 bg-gray-50'}`}>
                        <span className="text-xs text-gray-400 font-mono">{'{{'}</span>
                        <input value={on ? key : ''} disabled={!on} maxLength={40}
                          onChange={e => setVar(col, e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                          placeholder={toVarKey(sheet.headers[col])}
                          className="flex-1 min-w-0 px-1 py-1.5 text-sm font-mono bg-transparent outline-none disabled:text-gray-300" />
                        <span className="text-xs text-gray-400 font-mono">{'}}'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-1.5"><AlertCircle size={14} />{error}</p>
          )}

          {/* Preview */}
          {!error && contacts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Preview</p>
              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Phone</th>
                      <th className="px-3 py-2 text-left font-medium">Name</th>
                      {varCols.map(([col, key]) => <th key={col} className="px-3 py-2 text-left font-medium font-mono">{`{{${key}}}`}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {contacts.slice(0, PREVIEW_ROWS).map(c => (
                      <tr key={c.id}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            {c.isValid ? <CheckCircle size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-500" />}
                            {c.formattedPhone || c.phone}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-700">{c.name || '—'}</td>
                        {varCols.map(([col, key]) => <td key={col} className="px-3 py-2 whitespace-nowrap text-gray-700 max-w-[160px] truncate">{c.vars?.[key] || '—'}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-600">
            {error ? 'Fix the mapping to continue.' : (
              <><b className="text-green-700">{validCount}</b> valid number{validCount === 1 ? '' : 's'}
                {contacts.length - validCount > 0 && <> · <span className="text-red-600">{contacts.length - validCount} invalid</span></>}
                {varCols.length > 0 && <> · {varCols.length} variable{varCols.length === 1 ? '' : 's'}</>}</>
            )}
          </p>
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-white">Cancel</button>
            <button onClick={confirm} disabled={!!error || validCount === 0}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400">
              Import {contacts.length} contact{contacts.length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
