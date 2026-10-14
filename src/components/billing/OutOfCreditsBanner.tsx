import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, X } from 'lucide-react';

// App-wide notice shown when any API call answers 402 (out of credits).
// apiFetch dispatches the event; this listens and offers a top-up.
export const OUT_OF_CREDITS_EVENT = 'nexbotix:out-of-credits';

export function OutOfCreditsBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OUT_OF_CREDITS_EVENT, show);
    return () => window.removeEventListener(OUT_OF_CREDITS_EVENT, show);
  }, []);

  if (!open) return null;
  return (
    <div role="alert" className="fixed bottom-4 left-1/2 z-[100] flex w-[min(92vw,520px)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-amber-200 bg-white p-4 shadow-2xl">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Coins className="h-5 w-5" /></span>
      <div className="flex-1 text-sm">
        <p className="font-semibold text-gray-900">You’re out of credits</p>
        <p className="text-gray-600">Top up or choose a plan to keep your AI employees working.</p>
      </div>
      <Link to="/subscription" onClick={() => setOpen(false)} className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700">
        Get credits
      </Link>
      <button onClick={() => setOpen(false)} aria-label="Dismiss" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
    </div>
  );
}
