import { useState, useRef, useCallback, useEffect } from 'react';
import { Loader, CheckCircle } from 'lucide-react';
import { apiFetch, API_ENDPOINTS, SSE_BASE_URL } from '@/config/api';

interface PhoneTabProps {
  onConnected: () => void;
  token?: string | null;
}

type PhoneTabPhase = 'idle' | 'loading' | 'code_shown' | 'expired' | 'error' | 'connected';

export function PhoneTab({ onConnected, token }: PhoneTabProps) {
  const [phone, setPhone] = useState('');
  const [phase, setPhase] = useState<PhoneTabPhase>('idle');
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [errorMsg, setErrorMsg] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const openSSE = useCallback(() => {
    if (eventSourceRef.current) return;
    const qrUrl = token
      ? `${SSE_BASE_URL}/api/whatsapp/qr?token=${token}`
      : `${SSE_BASE_URL}/api/whatsapp/qr`;
    const es = new EventSource(qrUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ready') {
          setPhase('connected');
          cleanup();
          advanceTimerRef.current = setTimeout(onConnected, 800);
        } else if (data.type === 'timeout') {
          setPhase('expired');
          cleanup();
        }
      } catch {
        // ignore malformed SSE frames
      }
    };

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        cleanup();
        setPhase('error');
        setErrorMsg('Connection lost. Try again.');
      }
      // If readyState is CONNECTING, browser is auto-retrying — do nothing
    };
  }, [token, onConnected, cleanup]);

  const handleGetCode = async () => {
    if (!phone.trim()) { setErrorMsg('Enter your phone number'); return; }
    setErrorMsg('');
    setPhase('loading');

    try {
      const res = await apiFetch(API_ENDPOINTS.whatsapp.pairPhone, {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim() }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to get code');

      setCode(data.data.code as string);
      setSecondsLeft(120);
      setPhase('code_shown');

      // Countdown timer — expire at 0
      countdownRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            // Schedule expiry side-effects outside the updater (updaters must be pure)
            setTimeout(() => {
              if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
              setPhase(p => (p === 'code_shown' ? 'expired' : p));
              cleanup();
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      openSSE();
    } catch (err) {
      setPhase('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to get pairing code');
    }
  };

  const handleReset = () => {
    cleanup();
    setPhase('idle');
    setCode('');
    setErrorMsg('');
  };

  const formatCode = (c: string) =>
    c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (phase === 'idle' || phase === 'error') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Your WhatsApp number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleGetCode(); }}
            placeholder="+919876543210"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">Include country code (e.g. +91 for India)</p>
        </div>
        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        <button
          onClick={handleGetCode}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all"
        >
          Get Pairing Code
        </button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center py-8 gap-3">
        <Loader size={28} className="animate-spin text-green-600" />
        <p className="text-gray-500 text-sm">Generating pairing code…</p>
      </div>
    );
  }

  if (phase === 'code_shown') {
    return (
      <div className="space-y-4 text-center">
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl py-6 px-4">
          <p className="text-4xl font-mono font-bold tracking-widest text-gray-900 select-all">
            {formatCode(code)}
          </p>
        </div>
        <p className="text-sm text-gray-500">
          Expires in{' '}
          <span className="font-semibold text-gray-700">{formatTime(secondsLeft)}</span>
        </p>
        <ol className="text-sm text-gray-600 text-left space-y-1.5 bg-blue-50 rounded-xl p-4">
          <li>1. Open WhatsApp on your phone</li>
          <li>2. Tap <strong>Linked Devices</strong> → <strong>Link with Phone Number</strong></li>
          <li>3. Enter this code when prompted</li>
        </ol>
        <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
          <Loader size={12} className="animate-spin" />
          Waiting for connection…
        </div>
      </div>
    );
  }

  if (phase === 'expired') {
    return (
      <div className="text-center space-y-4 py-4">
        <p className="text-amber-600 text-sm font-medium">Code expired</p>
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 w-full py-3 border-2 border-green-500 text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors"
        >
          Get new code
        </button>
      </div>
    );
  }

  // connected
  return (
    <div className="py-8 text-center">
      <CheckCircle size={56} className="text-green-500 mx-auto mb-3" />
      <p className="text-green-700 font-semibold text-lg">Connected ✓</p>
    </div>
  );
}
