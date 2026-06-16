import { useState, useRef, useEffect } from 'react';
import { X, Bot, Plus, ArrowRight, Sparkles } from 'lucide-react';
import { useBotxOnboarding } from './useBotxOnboarding';
import type { BotDraft } from './useBotxOnboarding';
import { useNavigate } from 'react-router-dom';

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
        <Bot size={13} className="text-white" />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepInput({
  step,
  draft,
  serviceInput,
  setServiceInput,
  onSubmit,
  onAddService,
  onDoneServices,
  onSkipWebsite,
}: {
  step: number;
  draft: BotDraft;
  serviceInput: string;
  setServiceInput: (v: string) => void;
  onSubmit: (v: string) => void;
  onAddService: (v: string) => void;
  onDoneServices: () => void;
  onSkipWebsite: () => void;
}) {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    setInputVal('');
  }, [step]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (step !== 3) onSubmit(inputVal);
    }
  };

  if (step === 2) {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. We help small businesses automate their customer support via WhatsApp"
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
        />
        <button
          onClick={() => onSubmit(inputVal)}
          disabled={!inputVal.trim()}
          className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-500 hover:to-emerald-500 disabled:opacity-40 transition-all"
        >
          Continue <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="flex flex-col gap-2">
        {draft.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1">
            {draft.services.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-full"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        {draft.services.length < 4 && (
          <div className="flex gap-2">
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={serviceInput}
              onChange={e => setServiceInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddService(serviceInput);
                }
              }}
              placeholder={`Service ${draft.services.length + 1} — e.g. WhatsApp Support`}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
            <button
              onClick={() => onAddService(serviceInput)}
              disabled={!serviceInput.trim()}
              className="p-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 disabled:opacity-40 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        )}
        <button
          onClick={onDoneServices}
          disabled={draft.services.length === 0}
          className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-500 hover:to-emerald-500 disabled:opacity-40 transition-all"
        >
          Done with services <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="url"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://yourbusiness.com"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
        />
        <button
          onClick={() => onSubmit(inputVal)}
          disabled={!inputVal.trim()}
          className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-500 hover:to-emerald-500 disabled:opacity-40 transition-all"
        >
          Continue <ArrowRight size={16} />
        </button>
        <button
          onClick={onSkipWebsite}
          className="text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          Skip for now
        </button>
      </div>
    );
  }

  // Step 1 — default text input
  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. Acme Café, ZenFit Studio…"
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
      />
      <button
        onClick={() => onSubmit(inputVal)}
        disabled={!inputVal.trim()}
        className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-500 hover:to-emerald-500 disabled:opacity-40 transition-all"
      >
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}

function PreviewScreen({ draft, onDismiss }: { draft: BotDraft; onDismiss: () => void }) {
  const navigate = useNavigate();
  const s0 = draft.services[0] || 'our services';
  const s1 = draft.services[1] || 'more';

  const previewMessages = [
    {
      role: 'bot' as const,
      text: `Hi! 👋 I'm the AI assistant for ${draft.businessName}. I can help you with ${s0}, ${s1}, and more! How can I help you today?`,
    },
    { role: 'user' as const, text: 'What services do you offer?' },
    {
      role: 'bot' as const,
      text: draft.services.length > 0
        ? `We offer ${draft.services.slice(0, 3).join(', ')}. Would you like more details or to book an appointment?`
        : `We'd love to help you! Would you like more details or to book an appointment?`,
    },
  ];

  return (
    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
      <div className="flex-none bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Your bot is ready! 🎉</p>
              <p className="text-green-100 text-xs">Sign up to activate it</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your Bot Config</p>
          <p className="font-bold text-gray-900 text-sm">{draft.businessName}</p>
          <p className="text-gray-500 text-xs mt-1 leading-relaxed">{draft.description}</p>
          {draft.services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {draft.services.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-0.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Preview — how your bot replies</p>

        <div className="space-y-3">
          {previewMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.role === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={13} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'bot'
                    ? 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-br-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-none px-5 py-4 border-t border-gray-100 space-y-2">
        <button
          onClick={() => navigate('/signup')}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-500 hover:to-emerald-500 shadow-lg shadow-green-600/25 transition-all"
        >
          Activate My Bot <ArrowRight size={16} />
        </button>
        <button
          onClick={() => navigate('/login')}
          className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors py-1"
        >
          Already have an account? Log in
        </button>
      </div>
    </div>
  );
}

export function BotOnboardingModal() {
  const {
    isOpen,
    step,
    messages,
    draft,
    isTyping,
    serviceInput,
    setServiceInput,
    dismiss,
    submitAnswer,
    addService,
    doneServices,
    skipWebsite,
  } = useBotxOnboarding();

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  if (step === 5) {
    return (
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        onKeyDown={(e) => { if (e.key === 'Escape') dismiss(); }}
        tabIndex={-1}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />
        <PreviewScreen draft={draft} onDismiss={dismiss} />
      </div>
    );
  }

  const TOTAL_STEPS = 4;
  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onKeyDown={(e) => { if (e.key === 'Escape') dismiss(); }}
      tabIndex={-1}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Modal card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="botx-modal-title"
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
      >

        {/* Header */}
        <div className="flex-none bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <p id="botx-modal-title" className="text-white font-bold text-sm leading-tight">Build Your WhatsApp Bot</p>
                <p className="text-green-100 text-xs">Free · 2 min · No signup needed yet</p>
              </div>
            </div>
            <button
              onClick={dismiss}
              aria-label="Close"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-green-100 text-xs font-medium whitespace-nowrap">
              Step {step} of {TOTAL_STEPS}
            </span>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 min-h-0">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-end gap-2 mb-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.role === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={13} className="text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'bot'
                    ? 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    : 'bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-br-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isTyping && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div className="flex-none px-4 pb-4 pt-2 border-t border-gray-100 bg-white">
          <StepInput
            step={step}
            draft={draft}
            serviceInput={serviceInput}
            setServiceInput={setServiceInput}
            onSubmit={submitAnswer}
            onAddService={addService}
            onDoneServices={doneServices}
            onSkipWebsite={skipWebsite}
          />
          {step <= 4 && (
            <button
              onClick={dismiss}
              className="w-full text-center text-xs text-gray-300 hover:text-gray-500 transition-colors mt-2 py-1"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
