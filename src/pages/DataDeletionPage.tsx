import { useState } from 'react';
import { Shield, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { API_ENDPOINTS } from '@/config/api';

export function DataDeletionPage() {
  useSEO({
    title: 'Data Deletion Request - NexBotix',
    description: 'Request deletion of your personal data from NexBotix.',
    url: 'https://nexbotix.todayintech.in/data-deletion',
  });

  const [form, setForm] = useState({ name: '', email: '', reason: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch(API_ENDPOINTS.dataDeletion.submit, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setForm({ name: '', email: '', reason: '' });
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to submit request. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-gray-950 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-red-400 tracking-wide uppercase mb-3">Privacy</p>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">Data Deletion Request</h1>
          <p className="text-gray-400">
            You have the right to request deletion of your personal data. Fill in the form below and our team will process your request within 30 days.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* What gets deleted */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 mb-10">
          <div className="flex items-start gap-3 mb-4">
            <Trash2 size={20} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-red-900 mb-1">What will be deleted</h2>
              <p className="text-sm text-red-700">Once approved, the following data associated with your account will be permanently removed:</p>
            </div>
          </div>
          <ul className="ml-8 space-y-1.5 text-sm text-red-700 list-disc">
            <li>Your account profile (name, email, password)</li>
            <li>All WhatsApp session data and connection history</li>
            <li>Message templates you created</li>
            <li>Saved contacts and uploaded files</li>
            <li>Subscription and payment records</li>
            <li>API keys and scheduled messages</li>
            <li>Bot configurations and chatbot data</li>
          </ul>
        </div>

        {/* What stays */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-10">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-blue-900 mb-1">Important notes</h2>
              <ul className="space-y-1.5 text-sm text-blue-700 list-disc ml-4">
                <li>Requests are processed within <strong>30 days</strong> of submission.</li>
                <li>Once deleted, data <strong>cannot be recovered</strong>.</li>
                <li>Financial records may be retained for legal/tax compliance purposes.</li>
                <li>You will lose access to all services immediately upon deletion.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        {status === 'success' ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">Request submitted successfully</h3>
            <p className="text-sm text-green-700">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition"
              />
              <p className="mt-1.5 text-xs text-gray-500">Enter the email address associated with your NexBotix account.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for deletion <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                rows={4}
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Tell us why you'd like your data deleted..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none transition resize-none"
              />
            </div>

            {status === 'error' && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Submit Deletion Request
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-400">
              By submitting this form you confirm that you understand this action is irreversible.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
