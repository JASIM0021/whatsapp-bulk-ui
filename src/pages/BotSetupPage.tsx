import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus, Trash2, Save, ArrowLeft, Crown, Globe, BookOpen, ShoppingBag, Calendar, ToggleLeft, ToggleRight, Loader } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

interface BotConfig {
  id?: string;
  businessName: string;
  description: string;
  website: string;
  services: string[];
  bookingLink: string;
  productLink: string;
  isEnabled: boolean;
}

const EMPTY: BotConfig = {
  businessName: '',
  description: '',
  website: '',
  services: [''],
  bookingLink: '',
  productLink: '',
  isEnabled: false,
};

export function BotSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [config, setConfig] = useState<BotConfig>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isToggeling, setIsToggeling] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const isYearly = user?.subscription?.plan === 'yearly' && user?.subscription?.isActive;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.bot.get);
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setConfig({
            businessName: d.businessName || '',
            description: d.description || '',
            website: d.website || '',
            services: d.services?.length ? d.services : [''],
            bookingLink: d.bookingLink || '',
            productLink: d.productLink || '',
            isEnabled: d.isEnabled ?? false,
          });
        }
      } catch {
        // no config yet — use empty
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    if (!config.businessName.trim() || !config.description.trim()) {
      showToast('Business name and description are required', false);
      return;
    }
    const cleanServices = config.services.map(s => s.trim()).filter(Boolean);

    setIsSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.bot.upsert, {
        method: 'POST',
        body: JSON.stringify({
          ...config,
          services: cleanServices,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Bot configuration saved!', true);
        if (json.data?.services) {
          setConfig(prev => ({ ...prev, services: json.data.services.length ? json.data.services : [''] }));
        }
      } else {
        showToast(json.error || 'Failed to save', false);
      }
    } catch {
      showToast('Network error — could not save', false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!config.businessName.trim() || !config.description.trim()) {
      showToast('Save your business info before enabling the bot', false);
      return;
    }
    const newEnabled = !config.isEnabled;
    setConfig(prev => ({ ...prev, isEnabled: newEnabled }));
    setIsToggeling(true);
    try {
      const cleanServices = config.services.map(s => s.trim()).filter(Boolean);
      const res = await apiFetch(API_ENDPOINTS.bot.upsert, {
        method: 'POST',
        body: JSON.stringify({ ...config, isEnabled: newEnabled, services: cleanServices }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(newEnabled ? 'Bot enabled — auto-replies are active' : 'Bot disabled — auto-replies stopped', newEnabled);
      } else {
        // Revert on failure
        setConfig(prev => ({ ...prev, isEnabled: !newEnabled }));
        showToast(json.error || 'Failed to update bot status', false);
      }
    } catch {
      setConfig(prev => ({ ...prev, isEnabled: !newEnabled }));
      showToast('Network error — could not update bot status', false);
    } finally {
      setIsToggeling(false);
    }
  };

  const addService = () => setConfig(prev => ({ ...prev, services: [...prev.services, ''] }));
  const removeService = (i: number) =>
    setConfig(prev => ({ ...prev, services: prev.services.filter((_, idx) => idx !== i) }));
  const updateService = (i: number, val: string) =>
    setConfig(prev => ({ ...prev, services: prev.services.map((s, idx) => idx === i ? val : s) }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader size={32} className="animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/app')}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">WhatsApp Bot Setup</h1>
              <p className="text-xs text-gray-500">AI-powered auto-reply for your business</p>
            </div>
          </div>
          {isYearly && (
            <span className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
              <Crown size={12} /> Yearly Plan
            </span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Yearly plan gate */}
        {!isYearly && (
          <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-4">
            <Crown size={24} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Yearly Plan Required</p>
              <p className="text-sm text-amber-700 mt-1">
                The WhatsApp chatbot feature is available exclusively on the yearly plan. Upgrade to unlock AI-powered auto-replies for your customers.
              </p>
              <button
                onClick={() => navigate('/subscription')}
                className="mt-3 px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
              >
                Upgrade to Yearly
              </button>
            </div>
          </div>
        )}

        <div className={!isYearly ? 'opacity-50 pointer-events-none select-none' : ''}>
          {/* Enable/Disable toggle */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Bot Status</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {config.isEnabled
                    ? 'Bot is active and will auto-reply to incoming messages'
                    : 'Bot is disabled — no auto-replies will be sent'}
                </p>
              </div>
              <button
                onClick={handleToggle}
                disabled={isToggeling}
                className={`transition-colors disabled:opacity-60 ${config.isEnabled ? 'text-green-600' : 'text-gray-400'}`}
              >
                {isToggeling
                  ? <Loader size={40} className="animate-spin" />
                  : config.isEnabled
                    ? <ToggleRight size={40} />
                    : <ToggleLeft size={40} />}
              </button>
            </div>
          </div>

          {/* Business Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-500" /> Business Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={config.businessName}
                onChange={e => setConfig(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="e.g. Acme Enterprises"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={config.description}
                onChange={e => setConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your business, what you do, and what makes you unique…"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Globe size={13} /> Website <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="url"
                value={config.website}
                onChange={e => setConfig(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourwebsite.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <ShoppingBag size={16} className="text-indigo-500" /> Key Services / Products
              <span className="ml-auto text-xs text-gray-400 font-normal">Add 4–5 for best results</span>
            </h2>
            <div className="space-y-2.5">
              {config.services.map((svc, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={svc}
                    onChange={e => updateService(i, e.target.value)}
                    placeholder={`Service ${i + 1} — e.g. Website Design`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  {config.services.length > 1 && (
                    <button
                      onClick={() => removeService(i)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addService}
              className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <Plus size={15} /> Add another service
            </button>
          </div>

          {/* Optional Links */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6 space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" /> Optional Links
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking / Appointment Link
              </label>
              <input
                type="url"
                value={config.bookingLink}
                onChange={e => setConfig(prev => ({ ...prev, bookingLink: e.target.value }))}
                placeholder="https://calendly.com/yourbusiness"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Products / Store Link
              </label>
              <input
                type="url"
                value={config.productLink}
                onChange={e => setConfig(prev => ({ ...prev, productLink: e.target.value }))}
                placeholder="https://yourstore.com/products"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60 shadow-sm"
          >
            {isSaving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? 'Saving…' : 'Save Bot Configuration'}
          </button>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-sm text-white font-medium transition-all ${
          toast.ok ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
