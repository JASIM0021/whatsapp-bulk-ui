import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface BotDraft {
  businessName: string;
  description: string;
  services: string[];
  website: string;
  completedAt?: string;
}

export interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
}

const STORAGE_KEY = 'botx_bot_draft';
const SKIP_KEY = 'botx_onboarding_skipped';

const EMPTY_DRAFT: BotDraft = {
  businessName: '',
  description: '',
  services: [],
  website: '',
};

function loadDraft(): BotDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...EMPTY_DRAFT, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...EMPTY_DRAFT };
}

function saveDraft(draft: BotDraft) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function useBotxOnboarding() {
  const { isAuthenticated, isLoading } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1-4 = wizard, 5 = preview
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState<BotDraft>(loadDraft);
  const [isTyping, setIsTyping] = useState(false);
  const [serviceInput, setServiceInput] = useState('');

  // Open modal on mount when unauthenticated and not skipped this session
  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) return;
    if (sessionStorage.getItem(SKIP_KEY)) return;

    setIsOpen(true);
    setMessages([{ role: 'bot', text: "Hi! 👋 What's your business name?" }]);
  }, [isAuthenticated, isLoading]);

  // Register global re-open function for the homepage CTA
  useEffect(() => {
    (window as any).__botxOpenOnboarding = () => {
      sessionStorage.removeItem(SKIP_KEY);
      setIsOpen(true);
      setMessages([{ role: 'bot', text: "Hi! 👋 What's your business name?" }]);
      setStep(1);
    };
    return () => {
      delete (window as any).__botxOpenOnboarding;
    };
  }, []);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(SKIP_KEY, '1');
    setIsOpen(false);
  }, []);

  const addBotMessage = useCallback((text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'bot', text }]);
    }, 650);
  }, []);

  const submitAnswer = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);

    if (step !== 4) {
      setDraft(prev => {
        let updated = { ...prev };
        if (step === 1) updated.businessName = trimmed;
        if (step === 2) updated.description = trimmed;
        saveDraft(updated);
        return updated;
      });
    }

    if (step === 1) {
      addBotMessage(`Got it! Describe what ${trimmed} does in one sentence.`);
      setStep(2);
    } else if (step === 2) {
      addBotMessage("What are your top services or products? Add up to 4, one at a time — then click Done.");
      setStep(3);
    } else if (step === 4) {
      setDraft(prev => {
        const updated = { ...prev, website: trimmed, completedAt: new Date().toISOString() };
        saveDraft(updated);
        return updated;
      });
      setStep(5);
    }
  }, [step, addBotMessage]);

  const skipWebsite = useCallback(() => {
    setMessages(prev => [...prev, { role: 'user', text: '(skipped)' }]);
    setDraft(prev => {
      const updated = { ...prev, completedAt: new Date().toISOString() };
      saveDraft(updated);
      return updated;
    });
    setStep(5);
  }, []);

  const addService = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setDraft(prev => {
      if (prev.services.length >= 4) return prev;
      const updated = { ...prev, services: [...prev.services, trimmed] };
      saveDraft(updated);
      return updated;
    });
    setServiceInput('');
  }, []);

  const doneServices = useCallback(() => {
    if (draft.services.length === 0) return;
    setMessages(prev => [
      ...prev,
      { role: 'user', text: draft.services.join(', ') },
    ]);
    addBotMessage(`Do you have a website or booking link? (optional — press Skip to continue)`);
    setStep(4);
  }, [draft.services, addBotMessage]);

  const open = useCallback(() => {
    sessionStorage.removeItem(SKIP_KEY);
    setIsOpen(true);
    setMessages([{ role: 'bot', text: "Hi! 👋 What's your business name?" }]);
    setStep(1);
  }, []);

  return {
    isOpen,
    step,
    messages,
    draft,
    isTyping,
    serviceInput,
    setServiceInput,
    open,
    dismiss,
    submitAnswer,
    addService,
    doneServices,
    skipWebsite,
  };
}
