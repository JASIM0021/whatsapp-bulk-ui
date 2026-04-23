import { useState } from 'react';
import { Mail, Phone, MessageSquare, Send, CheckCircle, MapPin } from 'lucide-react';

export function ContactPage() {
  const [form, setForm] = useState({ email: '', phone: '', query: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-950 to-gray-900 pt-16 pb-20 border-b border-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-green-400 tracking-wide uppercase mb-3">Get in Touch</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Have a question, feature request, or need help? Drop us a message and we'll get back to you within 24 hours.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* Left: info */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-6">How can we help?</h2>
              <div className="space-y-5">
                {[
                  { icon: Mail, label: 'Email Support', value: 'contact@todayintech.in' },
                  { icon: Phone, label: 'WhatsApp', value: '+91 76793 49780' },
                  { icon: MapPin, label: 'Based in', value: 'India' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-gray-200">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
              <p className="text-sm font-semibold text-white mb-2">Prefer WhatsApp?</p>
              <p className="text-sm text-gray-400 mb-4">Try our live AI bot for instant answers.</p>
              <a
                href="https://wa.me/917679349780?text=Hi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Right: form */}
          <div className="lg:col-span-3">
            {status === 'success' ? (
              <div className="bg-gray-900/60 border border-green-500/30 rounded-2xl p-10 text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Message sent!</h3>
                <p className="text-gray-400 text-sm max-w-xs">
                  We've received your query and sent a confirmation to <span className="text-white">{form.email}</span>. Our team will respond within 24 hours.
                </p>
                <button
                  onClick={() => { setForm({ email: '', phone: '', query: '' }); setStatus('idle'); }}
                  className="mt-2 px-5 py-2.5 text-sm font-semibold text-gray-300 border border-gray-700 rounded-xl hover:bg-white/5 transition-all"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 space-y-5"
              >
                <h2 className="text-lg font-bold text-white mb-1">Send us a message</h2>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Email address <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Phone (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Phone number <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Query */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Your message <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MessageSquare size={16} className="absolute left-3.5 top-3.5 text-gray-500" />
                    <textarea
                      required
                      rows={5}
                      value={form.query}
                      onChange={e => setForm(f => ({ ...f, query: e.target.value }))}
                      placeholder="Describe your question or issue..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors resize-none"
                    />
                  </div>
                </div>

                {status === 'error' && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-2 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-500 hover:to-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-green-600/20 transition-all"
                >
                  {status === 'loading' ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Sending…
                    </span>
                  ) : (
                    <>
                      Send Message
                      <Send size={16} />
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  We'll also send a confirmation to your email address.
                </p>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
