'use client';

import dynamic from 'next/dynamic';

// Logged-in app routes: browser-only, exactly as the old Vite SPA ran them.
const SpaApp = dynamic(() => import('@/SpaApp'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function ClientOnlySpa() {
  return <SpaApp />;
}
