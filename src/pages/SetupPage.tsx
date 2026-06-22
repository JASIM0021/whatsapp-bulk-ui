import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Check, ArrowRight, Plus, X as XIcon,
  Loader, CheckCircle, Smartphone, QrCode, Info,
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS, SSE_BASE_URL } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';
import { PhoneTab } from '@/components/whatsapp/PhoneTab';

// ── Shared types ─────────────────────────────────────────────────────────────

interface BotConfig {
  businessName: string;
  description: string;
  services: string[];
  website: string;
}

// ── Step progress indicator ───────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps: { n: 1 | 2 | 3; label: string }[] = [
    { n: 1, label: 'Review Bot' },
    { n: 2, label: 'Connect WhatsApp' },
    { n: 3, label: 'Activate' },
  ];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${
                s.n < current
                  ? 'bg-green-600 border-green-600 text-white'
                  : s.n === current
                  ? 'bg-white border-green-600 text-green-600'
                  : 'bg-white border-gray-200 text-gray-400'
              }`}
            >
              {s.n < current ? <Check size={15} /> : s.n}
            </div>
            <span
              className={`text-xs mt-1.5 font-medium whitespace-nowrap ${
                s.n === current ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-14 h-0.5 mb-5 mx-1 ${
                s.n < current ? 'bg-green-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Review bot config ─────────────────────────────────────────────────

function Step1ReviewBot({ onContinue }: { onContinue: () => void }) {
  const [config, setConfig] = useState<BotConfig>({
    businessName: '', description: '', services: [], website: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [serviceInput, setServiceInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(API_ENDPOINTS.bot.get)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setConfig({
            businessName: d.data.businessName || '',
            description: d.data.description || '',
            services: Array.isArray(d.data.services) ? d.data.services : [],
            website: d.data.website || '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const addService = () => {
    const trimmed = serviceInput.trim();
    if (!trimmed || config.services.length >= 4) return;
    setConfig(p => ({ ...p, services: [...p.services, trimmed] }));
    setServiceInput('');
  };

  const removeService = (i: number) =>
    setConfig(p => ({ ...p, services: p.services.filter((_, idx) => idx !== i) }));

  const handleContinue = async () => {
    if (!config.businessName.trim()) { setError('Business name is required'); return; }
    if (!config.description.trim()) { setError('Description is required'); return; }
    setError('');
    setIsSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.bot.upsert, {
        method: 'POST',
        body: JSON.stringify({
          businessName: config.businessName.trim(),
          description: config.description.trim(),
          services: config.services.filter(s => s.trim()),
          website: config.website.trim(),
          isEnabled: false,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save — try again');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size={24} className="animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Business Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={config.businessName}
          onChange={e => setConfig(p => ({ ...p, businessName: e.target.value }))}
          placeholder="Acme Café"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={config.description}
          onChange={e => setConfig(p => ({ ...p, description: e.target.value }))}
          placeholder="What your business does in one sentence"
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Services <span className="text-gray-400 font-normal">(up to 4)</span>
        </label>
        {config.services.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {config.services.map((s, i) => (
              <span
                key={s + i}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-full"
              >
                {s}
                <button
                  onClick={() => removeService(i)}
                  className="text-green-500 hover:text-green-700 ml-0.5"
                  aria-label={`Remove ${s}`}
                >
                  <XIcon size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
        {config.services.length < 4 && (
          <div className="flex gap-2">
            <input
              type="text"
              value={serviceInput}
              onChange={e => setServiceInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addService(); } }}
              placeholder="Add a service…"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
            <button
              onClick={addService}
              disabled={!serviceInput.trim()}
              className="px-3 py-2.5 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 disabled:opacity-40 transition-colors"
              aria-label="Add service"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Website <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="url"
          value={config.website}
          onChange={e => setConfig(p => ({ ...p, website: e.target.value }))}
          placeholder="https://yourbusiness.com"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleContinue}
        disabled={isSaving}
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 transition-all"
      >
        {isSaving
          ? <Loader size={16} className="animate-spin" />
          : <>Looks good, continue <ArrowRight size={16} /></>}
      </button>
    </div>
  );
}

// ── Step 2: Connect WhatsApp — QR tab ─────────────────────────────────────────

type QRPhase = 'idle' | 'loading' | 'qr' | 'authenticated' | 'ready' | 'error';

function QRTab({ onConnected, token }: { onConnected: () => void; token?: string | null }) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phase, setPhase] = useState<QRPhase>('idle');
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startSSE = useCallback(() => {
    cleanup();
    const qrUrl = token
      ? `${SSE_BASE_URL}/api/whatsapp/qr?token=${token}`
      : `${SSE_BASE_URL}/api/whatsapp/qr`;
    const es = new EventSource(qrUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'qr') {
          setQrCode(data.data);
          setPhase('qr');
        } else if (data.type === 'authenticated') {
          setPhase('authenticated');
        } else if (data.type === 'ready') {
          setPhase('ready');
          cleanup();
          retryTimerRef.current = setTimeout(onConnected, 800);
        } else if (data.type === 'timeout') {
          setQrCode(null);
          setPhase('loading');
          cleanup();
          retryTimerRef.current = setTimeout(startSSE, 2000);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        cleanup();
        setPhase('error');
      }
    };
  }, [token, onConnected, cleanup]);

  const handleConnect = async () => {
    setPhase('loading');
    try {
      await apiFetch(API_ENDPOINTS.whatsapp.init, { method: 'POST' });
      startSSE();
    } catch {
      setPhase('error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Instructions tooltip */}
      <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
        <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 space-y-1 leading-relaxed">
          <p className="font-semibold">How to scan the QR code:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-blue-600">
            <li>Open <strong>WhatsApp</strong> on your phone</li>
            <li>Tap <strong>⋮ Menu</strong> (Android) or <strong>Settings</strong> (iPhone)</li>
            <li>Tap <strong>Linked Devices → Link a Device</strong></li>
            <li>Point your phone camera at the QR code below</li>
          </ol>
        </div>
      </div>

      <div className="text-center">
        {phase === 'idle' && (
          <button
            onClick={handleConnect}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all"
          >
            <QrCode size={18} /> Generate QR Code
          </button>
        )}

        {phase === 'loading' && (
          <div className="w-56 h-56 mx-auto border-4 border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader size={28} className="animate-spin text-green-600 mx-auto mb-2" />
              <p className="text-gray-500 text-xs">Generating QR code…</p>
            </div>
          </div>
        )}

        {(phase === 'qr' || phase === 'authenticated') && qrCode && (
          <div className="relative w-56 h-56 mx-auto">
            <img
              src={qrCode}
              alt="WhatsApp QR Code"
              className="w-56 h-56 border-4 border-gray-200 rounded-xl"
            />
            {phase === 'authenticated' && (
              <div className="absolute inset-0 bg-white/90 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle size={40} className="text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-semibold text-sm">Authenticated!</p>
                  <p className="text-gray-500 text-xs">Connecting…</p>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'qr' && (
          <p className="text-xs text-gray-400 mt-2 animate-pulse">Waiting for scan…</p>
        )}

        {phase === 'ready' && (
          <div className="py-4">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-semibold">Connected ✓</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="space-y-3">
            <p className="text-red-600 text-sm">Connection failed. Please try again.</p>
            <button
              onClick={() => { setPhase('idle'); setQrCode(null); }}
              className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 2: Connect WhatsApp — Phone tab tooltip wrapper ──────────────────────

function PhoneTabWithTooltip({ onConnected, token }: { onConnected: () => void; token?: string | null }) {
  return (
    <div className="space-y-4">
      {/* Instructions tooltip */}
      <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
        <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700 space-y-1 leading-relaxed">
          <p className="font-semibold">How to use the pairing code:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-blue-600">
            <li>Enter your WhatsApp phone number below</li>
            <li>Open <strong>WhatsApp</strong> on your phone</li>
            <li>Tap <strong>⋮ Menu → Linked Devices → Link a Device</strong></li>
            <li>Tap <strong>"Link with phone number"</strong> instead of scanning</li>
            <li>Enter the 8-character code shown here</li>
          </ol>
        </div>
      </div>
      <PhoneTab onConnected={onConnected} token={token} />
    </div>
  );
}

// ── Step 2: Connect WhatsApp — tab container ──────────────────────────────────

type ConnectTab = 'phone' | 'qr';

function Step2ConnectWhatsApp({ onContinue }: { onContinue: () => void }) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<ConnectTab>('phone');

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Smartphone size={18} className="text-green-600" />
        <p className="text-sm text-gray-500">Choose how to link your WhatsApp account</p>
      </div>

      {/* Tab toggle */}
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          onClick={() => setActiveTab('phone')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'phone'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Smartphone size={14} /> Phone Number
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'qr'
              ? 'bg-white shadow text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <QrCode size={14} /> QR Code
        </button>
      </div>

      {activeTab === 'phone' ? (
        <PhoneTabWithTooltip onConnected={onContinue} token={token} />
      ) : (
        <QRTab onConnected={onContinue} token={token} />
      )}
    </div>
  );
}

// ── Step 3: Activate bot ──────────────────────────────────────────────────────

function Step3ActivateBot() {
  const navigate = useNavigate();
  const [botName, setBotName] = useState('Your Bot');
  const [services, setServices] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fullConfig, setFullConfig] = useState<Record<string, any>>({});
  const [isActivating, setIsActivating] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(API_ENDPOINTS.bot.get)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setBotName(d.data.businessName || 'Your Bot');
          setServices(Array.isArray(d.data.services) ? d.data.services : []);
          setFullConfig(d.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleActivate = async () => {
    setIsActivating(true);
    setError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.bot.upsert, {
        method: 'POST',
        body: JSON.stringify({ ...fullConfig, isEnabled: true }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Activation failed');
      localStorage.setItem('botx_setup_complete', '1');
      setIsActivated(true);
      setTimeout(() => navigate('/app'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate — try again');
    } finally {
      setIsActivating(false);
    }
  };

  if (isActivated) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={36} className="text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Your bot is live! 🎉</h3>
          <p className="text-gray-500 text-sm mt-1">Redirecting to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{botName}</p>
            <p className="text-xs text-green-700">WhatsApp connected · ready to activate</p>
          </div>
        </div>
        {services.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {services.map(s => (
              <span
                key={s}
                className="px-2.5 py-0.5 bg-white border border-green-200 text-green-700 text-xs font-medium rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500 text-center leading-relaxed">
        Once activated, your bot will automatically reply to WhatsApp messages from your customers.
      </p>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      <button
        onClick={handleActivate}
        disabled={isActivating}
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-600/20 disabled:opacity-50 transition-all"
      >
        {isActivating
          ? <Loader size={18} className="animate-spin" />
          : <>Activate My Bot <ArrowRight size={18} /></>}
      </button>
    </div>
  );
}

// ── SetupPage ─────────────────────────────────────────────────────────────────

const STEP_TITLES: Record<1 | 2 | 3, string> = {
  1: 'Review your bot config',
  2: 'Connect your WhatsApp',
  3: 'Activate your bot',
};

export function SetupPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal header */}
      <div className="flex-none bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Bot size={15} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">botx</span>
        </div>
        <span className="text-xs text-gray-400 font-medium">Step {currentStep} of 3</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 pt-10 pb-12">
        <div className="w-full max-w-lg">
          <StepIndicator current={currentStep} />

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              {STEP_TITLES[currentStep]}
            </h2>

            {currentStep === 1 && (
              <Step1ReviewBot onContinue={() => setCurrentStep(2)} />
            )}
            {currentStep === 2 && (
              <Step2ConnectWhatsApp onContinue={() => setCurrentStep(3)} />
            )}
            {currentStep === 3 && <Step3ActivateBot />}
          </div>
        </div>
      </div>
    </div>
  );
}
