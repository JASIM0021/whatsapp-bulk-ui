# Bot Activation Setup Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a sticky 3-step `/setup` page that guides new users from "bot created" through connecting WhatsApp to activating their bot, redirecting back to `/setup` on every login until all 3 steps are complete.

**Architecture:** A `useSetupStatus` hook derives completion state from existing APIs (no new backend). `SetupPage` is a standalone full-screen page with 3 inline steps. A `SetupGuard` component inside `AppRoutes` silently redirects incomplete users to `/setup`. `LoginPage` navigates directly to `/setup` after new registrations with a bot draft.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, react-router-dom v6, lucide-react, Server-Sent Events (existing SSE_BASE_URL pattern)

---

## File Map

| Action | File |
|--------|------|
| Create | `src/hooks/useSetupStatus.ts` |
| Create | `src/pages/SetupPage.tsx` |
| Modify | `src/main.tsx` — add `/setup` route + `SetupGuard` |
| Modify | `src/components/auth/LoginPage.tsx` — post-auth navigate to `/setup` when `hasBotDraft` |

---

## Task 1: `useSetupStatus` hook

**Files:**
- Create: `src/hooks/useSetupStatus.ts`

This hook fetches bot config and WhatsApp status in parallel and returns derived completion flags. Used by `SetupGuard` (to decide when to redirect) and by `SetupPage` (to determine the starting step).

- [ ] **Step 1: Create the hook file**

Create `src/hooks/useSetupStatus.ts` with this exact content:

```typescript
import { useState, useCallback, useEffect } from 'react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

export interface SetupStatus {
  step1Done: boolean;  // bot.businessName is non-empty
  step2Done: boolean;  // whatsapp isConnected && isReady
  step3Done: boolean;  // bot.isEnabled === true
  isComplete: boolean; // all three true
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export function useSetupStatus(): SetupStatus {
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [botRes, waRes] = await Promise.all([
        apiFetch(API_ENDPOINTS.bot.get),
        apiFetch(API_ENDPOINTS.whatsapp.status),
      ]);
      const botData = await botRes.json();
      const waData = await waRes.json();

      const bot = botData.success ? botData.data : null;
      const wa = waData.success ? waData.data : null;

      setStep1Done(!!bot?.businessName);
      setStep2Done(!!(wa?.isConnected && wa?.isReady));
      setStep3Done(!!bot?.isEnabled);
    } catch {
      // leave defaults (false) — safe failure
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return {
    step1Done,
    step2Done,
    step3Done,
    isComplete: step1Done && step2Done && step3Done,
    isLoading,
    refresh,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui
git add src/hooks/useSetupStatus.ts
git commit -m "feat: add useSetupStatus hook for bot activation flow"
```

---

## Task 2: `SetupPage` — scaffold + Steps 1 & 2

**Files:**
- Create: `src/pages/SetupPage.tsx`

Creates the full-screen setup page with a 3-step progress indicator. Implements Step 1 (review/edit bot config) and Step 2 (inline WhatsApp QR scan). Step 3 is added in Task 3.

Key patterns to follow:
- `SSE_BASE_URL` (not `API_ENDPOINTS`) for the QR EventSource URL — same as `QRCodeModal.tsx` which notes "Vercel rewrites buffer responses and don't support SSE streaming"
- `apiFetch` for all other API calls
- `useAuth` to get `token` for the SSE URL query param

- [ ] **Step 1: Create `src/pages/SetupPage.tsx`**

```tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Check, ArrowRight, Plus, X as XIcon,
  Loader, CheckCircle, Smartphone,
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS, SSE_BASE_URL } from '@/config/api';
import { useAuth } from '@/contexts/AuthContext';

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
      {/* Business Name */}
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

      {/* Description */}
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

      {/* Services */}
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

      {/* Website */}
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

// ── Step 2: Connect WhatsApp (inline QR) ──────────────────────────────────────

type QRPhase = 'idle' | 'loading' | 'qr' | 'authenticated' | 'ready' | 'error';

function Step2ConnectWhatsApp({ onContinue }: { onContinue: () => void }) {
  const { token } = useAuth();
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
          retryTimerRef.current = setTimeout(onContinue, 800);
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
      cleanup();
      setPhase('error');
    };
  }, [token, onContinue, cleanup]);

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
    <div className="space-y-5 text-center">
      <div>
        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Smartphone size={24} className="text-green-600" />
        </div>
        <h3 className="font-semibold text-gray-900">Connect your WhatsApp</h3>
        <p className="text-gray-500 text-sm mt-1 leading-relaxed">
          Open WhatsApp → Linked Devices → Link a Device → scan this code
        </p>
      </div>

      {phase === 'idle' && (
        <button
          onClick={handleConnect}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all"
        >
          Connect WhatsApp
        </button>
      )}

      {phase === 'loading' && (
        <div className="w-64 h-64 mx-auto border-4 border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader size={32} className="animate-spin text-green-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Generating QR code…</p>
          </div>
        </div>
      )}

      {(phase === 'qr' || phase === 'authenticated') && qrCode && (
        <div className="relative w-64 h-64 mx-auto">
          <img
            src={qrCode}
            alt="WhatsApp QR Code"
            className="w-64 h-64 border-4 border-gray-200 rounded-xl"
          />
          {phase === 'authenticated' && (
            <div className="absolute inset-0 bg-white/90 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-semibold">Authenticated!</p>
                <p className="text-gray-500 text-sm">Connecting…</p>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'qr' && (
        <p className="text-xs text-gray-400 animate-pulse">Waiting for scan…</p>
      )}

      {phase === 'ready' && (
        <div className="py-6">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-3" />
          <p className="text-green-700 font-semibold text-lg">Connected ✓</p>
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
  );
}

// ── Step 3 placeholder — added in Task 3 ──────────────────────────────────────

function Step3ActivateBot() {
  return (
    <div className="py-8 text-center text-gray-400 text-sm">
      Step 3 — coming in next task
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui
git add src/pages/SetupPage.tsx
git commit -m "feat: add SetupPage with step 1 (review bot) and step 2 (connect WhatsApp QR)"
```

---

## Task 3: `SetupPage` — Step 3 (Activate + success)

**Files:**
- Modify: `src/pages/SetupPage.tsx`

Replaces the `Step3ActivateBot` placeholder with the real implementation: a summary card, activate button, success animation, and redirect to `/app`.

- [ ] **Step 1: Replace `Step3ActivateBot` placeholder**

In `src/pages/SetupPage.tsx`, find the placeholder `Step3ActivateBot` function:

```tsx
// ── Step 3 placeholder — added in Task 3 ──────────────────────────────────────

function Step3ActivateBot() {
  return (
    <div className="py-8 text-center text-gray-400 text-sm">
      Step 3 — coming in next task
    </div>
  );
}
```

Replace it with:

```tsx
// ── Step 3: Activate bot ──────────────────────────────────────────────────────

function Step3ActivateBot() {
  const navigate = useNavigate();
  const [botName, setBotName] = useState('Your Bot');
  const [services, setServices] = useState<string[]>([]);
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
        body: JSON.stringify({ isEnabled: true }),
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
      {/* Bot summary card */}
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
```

Also remove the comment line `// ── Step 3 placeholder — added in Task 3 ──` (just the comment, the function is fully replaced above).

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui
git add src/pages/SetupPage.tsx
git commit -m "feat: add step 3 activate bot with success redirect to SetupPage"
```

---

## Task 4: `/setup` route + `SetupGuard` in `main.tsx`

**Files:**
- Modify: `src/main.tsx`

Adds the `/setup` route and a `SetupGuard` component that silently redirects authenticated users with incomplete setup to `/setup`.

**How `SetupGuard` works:**
1. Only runs when auth has resolved (`!isLoading`)
2. Checks `localStorage.getItem('botx_setup_complete')` — if set, skips the API check (fast path for users who already completed setup)
3. If not cached, calls `useSetupStatus` — if `step1Done && !isComplete` → navigate to `/setup`
4. If `isComplete`, caches `botx_setup_complete` in localStorage
5. Never redirects if already on `/setup` (prevents loops)

- [ ] **Step 1: Add import for `SetupPage` and `useSetupStatus`**

In `src/main.tsx`, add these imports after the existing page imports (around line 32):

```tsx
import { SetupPage } from './pages/SetupPage';
import { useSetupStatus } from './hooks/useSetupStatus';
import { useLocation } from 'react-router-dom';
```

Note: `useNavigate` is already available from the existing import `import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'` — you will need to add `useNavigate` to that import if it's not already there.

Update the react-router-dom import line to include `useNavigate` and `useLocation`:

```tsx
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
```

- [ ] **Step 2: Add `SetupGuard` component**

After the `PublicRoute` function (around line 69) and before `AppRoutes`, add:

```tsx
function SetupGuard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { step1Done, isComplete, isLoading: statusLoading } = useSetupStatus();

  useEffect(() => {
    if (authLoading || statusLoading) return;
    if (!isAuthenticated) return;
    if (location.pathname === '/setup') return; // already there — don't loop

    // Fast path: cached completion flag
    if (localStorage.getItem('botx_setup_complete')) return;

    if (!step1Done) return; // no bot config — skip setup guard

    if (isComplete) {
      localStorage.setItem('botx_setup_complete', '1');
      return;
    }

    navigate('/setup', { replace: true });
  }, [authLoading, statusLoading, isAuthenticated, step1Done, isComplete, navigate, location.pathname]);

  return null;
}
```

- [ ] **Step 3: Add `<SetupGuard />` to `AppRoutes` and add the `/setup` route**

In `AppRoutes`, add `<SetupGuard />` right after `<BotOnboardingModal />`:

```tsx
function AppRoutes() {
  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://nexbotix.todayintech.in/api/website-chatbot/script?apikey=bsk_9db5bdcaf9b80908495b62d7c42223d4';
    s.async = true;
    document.body.appendChild(s);
    return () => {
      document.body.removeChild(s);
    };
  }, []);

  return (
    <>
      <BotOnboardingModal />
      <SetupGuard />
      <Routes>
        {/* Public landing pages */}
        <Route path="/" element={<LandingLayout><HomePage /></LandingLayout>} />
        <Route path="/privacy" element={<LandingLayout><PrivacyPolicy /></LandingLayout>} />
        <Route path="/terms" element={<LandingLayout><TermsConditions /></LandingLayout>} />
        <Route path="/refund" element={<LandingLayout><RefundPolicy /></LandingLayout>} />
        <Route path="/docs" element={<LandingLayout><DevDocsPage /></LandingLayout>} />
        <Route path="/contact" element={<LandingLayout><ContactPage /></LandingLayout>} />
        <Route path="/about" element={<LandingLayout><AboutPage /></LandingLayout>} />

        {/* Public chatbot demo tool (no auth required) */}
        <Route path="/check-chatbot" element={<CheckChatbotPage />} />
        <Route path="/demo/:id" element={<ChatbotDemoPage />} />

        {/* Login / Signup */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><LoginPage /></PublicRoute>} />

        {/* Setup flow — protected, no app shell */}
        <Route path="/setup" element={<ProtectedRoute><SetupPage /></ProtectedRoute>} />

        {/* Payment result pages */}
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />

        {/* Protected routes */}
        <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/bot" element={<ProtectedRoute><BotSetupPage /></ProtectedRoute>} />
        <Route path="/bot/detection" element={<ProtectedRoute><BotDetectionPage /></ProtectedRoute>} />
        <Route path="/security" element={<ProtectedRoute><SecurityPage /></ProtectedRoute>} />
        <Route path="/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
        <Route path="/email" element={<ProtectedRoute><AppProvider><EmailPage /></AppProvider></ProtectedRoute>} />
        <Route path="/website-chatbot" element={<ProtectedRoute><WebsiteChatbotSetupPage /></ProtectedRoute>} />
        <Route path="/website-chatbot/leads" element={<ProtectedRoute><WebsiteChatbotLeadsPage /></ProtectedRoute>} />
        <Route path="/website-chatbot/embed" element={<ProtectedRoute><WebsiteChatbotEmbedPage /></ProtectedRoute>} />
        <Route path="/app" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/whatsapp" element={<ProtectedRoute><AppProvider><App /></AppProvider></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
```

Note: Copy ALL existing routes exactly — the above shows the complete `AppRoutes` return with `/setup` inserted. Do not drop any existing routes.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui
git add src/main.tsx
git commit -m "feat: add /setup route and SetupGuard redirect for incomplete bot setup"
```

---

## Task 5: Post-auth redirect to `/setup` in `LoginPage.tsx`

**Files:**
- Modify: `src/components/auth/LoginPage.tsx`

When a new user registers (via email+OTP or Google OAuth) and a bot draft was present, navigate to `/setup` instead of `/app`. This covers the initial registration flow. The `SetupGuard` (Task 4) handles all subsequent logins.

**Key insight:** `LoginPage.tsx` already computes `hasBotDraft` (reads `botx_bot_draft` from localStorage). At the time `loginWithToken` is called after registration, the draft hasn't been cleared yet (clearing happens asynchronously inside `applyBotDraft`). So `hasBotDraft` is reliable as a signal that this is a new registration with a completed bot.

**The 3 navigation points in `LoginPage.tsx` that need updating:**

1. **Google Login** (around line 129): `navigate(redirectTo)` after `loginWithToken(data.data.token, data.data.user)`
2. **OTP Signup verify** (around line 195): `navigate(redirectTo)` after `loginWithToken(data.data.token, data.data.user)`
3. **Regular login** (around line 146): `navigate(redirectTo)` after `await login(email, password)` — leave this unchanged (returning users are handled by `SetupGuard`)

- [ ] **Step 1: Add `getPostAuthDest` helper inside `LoginPage`**

In `src/components/auth/LoginPage.tsx`, after the `hasBotDraft` computation (around line 31), add:

```tsx
const getPostAuthDest = () => {
  if (hasBotDraft) return '/setup';
  return redirectTo;
};
```

- [ ] **Step 2: Update Google Login navigation**

Find the Google Login handler (around line 128-129):

```tsx
loginWithToken(data.data.token, data.data.user);
navigate(redirectTo);
```

Replace with:

```tsx
loginWithToken(data.data.token, data.data.user);
navigate(getPostAuthDest());
```

- [ ] **Step 3: Update OTP signup verification navigation**

Find the OTP verify handler (around line 194-195):

```tsx
loginWithToken(data.data.token, data.data.user);
navigate(redirectTo);
```

Replace with:

```tsx
loginWithToken(data.data.token, data.data.user);
navigate(getPostAuthDest());
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui
git add src/components/auth/LoginPage.tsx
git commit -m "feat: redirect new registrations with bot draft to /setup after auth"
```

---

## Spec Coverage Checklist

| Requirement | Task |
|-------------|------|
| Dedicated `/setup` page (not modal, not dashboard card) | Task 2, Task 4 |
| 3 steps: Review Bot → Connect WhatsApp → Activate | Tasks 2, 3 |
| Step 1: editable bot config pre-filled from API | Task 2 (`Step1ReviewBot`) |
| Step 1: validates name + description before continuing | Task 2 |
| Step 1: saves changes via `POST /api/bot` | Task 2 |
| Step 2: inline QR (not a modal) | Task 2 (`Step2ConnectWhatsApp`) |
| Step 2: calls `POST /api/whatsapp/init` then SSE | Task 2 |
| Step 2: auto-advances on `ready` event | Task 2 |
| Step 2: handles QR timeout with auto-reconnect | Task 2 |
| Step 2: handles SSE error with retry button | Task 2 |
| Step 3: bot summary card + activate button | Task 3 |
| Step 3: `POST /api/bot` with `isEnabled: true` | Task 3 |
| Step 3: success animation + redirect to `/app` | Task 3 |
| Sticky redirect on every login until complete | Task 4 (`SetupGuard`) |
| No redirect for users without a bot config | Task 4 (`if (!step1Done) return`) |
| Fast path cache (`botx_setup_complete`) | Task 4 |
| New registrations with bot draft → `/setup` | Task 5 |
| Google OAuth registration → `/setup` | Task 5 |
| Email+OTP registration → `/setup` | Task 5 |
| Regular login → `SetupGuard` handles redirect | Task 4 |
| No new backend endpoints needed | All tasks (uses existing APIs only) |
