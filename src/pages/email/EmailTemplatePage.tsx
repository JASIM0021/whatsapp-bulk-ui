import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Loader2, X, Variable } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

interface EmailTemplate { id: string; name: string; category: string; subject: string; bodyHtml: string; variables: string[]; createdAt: string }

const DEFAULT_HTML = `<h2 style="color:#1e3a8a">Hello {{name}}!</h2>
<p style="color:#374151">Thank you for being with us.</p>
<p>{{custom_message}}</p>
<br/>
<p style="color:#6b7280;font-size:13px">Best regards,<br/>The Team</p>`;

export function EmailTemplatePage({ isPaid }: { isPaid: boolean }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<EmailTemplate | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Marketing', subject: '', bodyHtml: DEFAULT_HTML, variables: '' });

  useEffect(() => { if (isPaid) load(); }, [isPaid]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.templates);
      const d = await r.json();
      if (d.success) setTemplates(d.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const save = async () => {
    if (!form.name.trim() || !form.subject.trim()) { alert('Name and subject required'); return; }
    setSaving(true);
    const vars = form.variables.split(',').map(v => v.trim()).filter(Boolean);
    try {
      const r = await apiFetch(API_ENDPOINTS.email.templates, {
        method: 'POST',
        body: JSON.stringify({ name: form.name, category: form.category, subject: form.subject, bodyHtml: form.bodyHtml, variables: vars }),
      });
      const d = await r.json();
      if (d.success) { setTemplates(t => [d.data, ...t]); setShowForm(false); setForm({ name: '', category: 'Marketing', subject: '', bodyHtml: DEFAULT_HTML, variables: '' }); }
      else alert(d.error);
    } catch { alert('Failed to save'); }
    setSaving(false);
  };

  const del = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    setDeleting(id);
    try {
      await apiFetch(API_ENDPOINTS.email.deleteTemplate(id), { method: 'DELETE' });
      setTemplates(t => t.filter(tmpl => tmpl.id !== id));
    } catch { /* ignore */ }
    setDeleting(null);
  };

  if (!isPaid) return <div className="text-center py-16"><FileText size={40} className="mx-auto mb-4 text-gray-300" /><p className="text-gray-400">Available on paid plans</p></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Email Templates</h2>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancel' : 'New Template'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Create Email Template</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Template Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Welcome Email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                {['Marketing', 'Transactional', 'Newsletter', 'Promotional', 'Follow-up'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Email subject line"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-600">HTML Body</label>
              <span className="text-xs text-gray-400 flex items-center gap-1"><Variable size={11} />Use {'{{name}}'}, {'{{custom_var}}'} etc.</span>
            </div>
            <textarea value={form.bodyHtml} onChange={e => setForm(f => ({ ...f, bodyHtml: e.target.value }))} rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Variables (comma-separated)</label>
            <input value={form.variables} onChange={e => setForm(f => ({ ...f, variables: e.target.value }))} placeholder="name, custom_message, link"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {/* Preview */}
          {form.bodyHtml && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500">{'Preview ({{name}} = "John")'}</div>
              <div className="p-4 text-sm" dangerouslySetInnerHTML={{ __html: form.bodyHtml.replace(/{{name}}/g, 'John') }} />
            </div>
          )}

          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-blue-500" /></div>
      ) : templates.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 text-center py-16">
          <FileText size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No templates yet</p>
          <p className="text-gray-400 text-sm mt-1">Create reusable HTML email templates with dynamic variables</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">{t.category}</span>
                </div>
                <button onClick={() => del(t.id)} disabled={deleting === t.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                  {deleting === t.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-2 truncate">{t.subject}</p>
              {t.variables?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {t.variables.map(v => <span key={v} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono">{'{{'}{v}{'}}'}</span>)}
                </div>
              )}
              <button onClick={() => setPreview(t)}
                className="w-full mt-1 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors border border-blue-100">
                Preview HTML
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div><p className="font-semibold text-gray-900">{preview.name}</p><p className="text-xs text-gray-500">Subject: {preview.subject}</p></div>
              <button onClick={() => setPreview(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="text-sm" dangerouslySetInnerHTML={{ __html: preview.bodyHtml.replace(/{{name}}/g, 'John') }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
