import { useState } from 'react';
import { Send, CalendarClock, Loader2, CheckCircle2, AlertCircle, Linkedin } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { LinkedInSessionHook } from '@/hooks/useLinkedInSession';

interface Props {
  isPaid: boolean;
  session: LinkedInSessionHook;
  onSwitchTab: (tab: 'connect' | 'compose' | 'schedule' | 'posts') => void;
}

const MAX_CHARS = 3000;

export function LinkedInComposePage({ isPaid, session, onSwitchTab }: Props) {
  const [text, setText] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ success: boolean; message: string } | null>(null);

  const minDateTime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);
  const charCount = text.length;
  const charOver = charCount > MAX_CHARS;

  if (!isPaid) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="bg-white rounded-2xl border border-amber-200 p-8 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Linkedin size={28} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pro Feature</h2>
          <p className="text-sm text-gray-500 mb-6">Upgrade to Pro to publish and schedule LinkedIn posts.</p>
          <a href="/subscription" className="inline-flex px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors">Upgrade to Pro</a>
        </div>
      </div>
    );
  }

  if (!session.isConnected) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <Linkedin size={40} className="mx-auto mb-4 text-[#0A66C2]" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connect LinkedIn First</h2>
          <p className="text-sm text-gray-500 mb-6">Connect your LinkedIn account before creating posts.</p>
          <button onClick={() => onSwitchTab('connect')} className="px-5 py-2.5 bg-[#0A66C2] text-white rounded-xl text-sm font-semibold hover:bg-[#004182] transition-colors">
            Connect Account
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!text.trim() || charOver) return;
    setSending(true);
    setDone(null);

    const isScheduled = scheduleEnabled && scheduledAt;

    // Immediate posts need up to 90s for browser automation
    const controller = new AbortController();
    const timeout = isScheduled ? null : setTimeout(() => controller.abort(), 95_000);

    try {
      const payload: Record<string, string> = { text };
      if (isScheduled) {
        payload.scheduledAt = new Date(scheduledAt).toISOString();
      }

      const res = await apiFetch(API_ENDPOINTS.linkedin.posts, {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (timeout) clearTimeout(timeout);

      const data = await res.json();
      if (data.success) {
        setDone({ success: true, message: isScheduled ? 'Post scheduled!' : 'Post published to LinkedIn!' });
        setText(''); setScheduleEnabled(false); setScheduledAt('');
      } else {
        setDone({ success: false, message: data.error || 'Failed to publish post.' });
      }
    } catch (err: unknown) {
      if (timeout) clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        setDone({ success: false, message: 'Publishing timed out. LinkedIn may be slow — try again.' });
      } else {
        setDone({ success: false, message: 'Network error. Please try again.' });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">Create Post</h2>
          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${charOver ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-[#0A66C2] border-blue-200'}`}>
            {charCount}/{MAX_CHARS}
          </span>
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="What do you want to talk about?"
          rows={8}
          className={`w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent transition-colors ${charOver ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
        />

        {/* Schedule toggle */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={() => setScheduleEnabled(v => !v)}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${scheduleEnabled ? 'text-[#0A66C2]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <CalendarClock size={16} />
            {scheduleEnabled ? 'Scheduled' : 'Schedule for later'}
          </button>
          {scheduleEnabled && (
            <div className="mt-3">
              <input
                type="datetime-local"
                value={scheduledAt}
                min={minDateTime}
                onChange={e => setScheduledAt(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0A66C2] focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {done && (
        <div className={`flex items-center gap-2.5 p-4 rounded-xl border text-sm ${done.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {done.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {done.message}
          {done.success && !scheduleEnabled && (
            <button onClick={() => onSwitchTab('posts')} className="ml-auto text-xs underline">View posts</button>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || charOver || sending || (scheduleEnabled && !scheduledAt)}
          className="flex items-center gap-2 px-6 py-3 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-xl font-semibold text-sm transition-colors shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <><Loader2 size={16} className="animate-spin" />{scheduleEnabled ? 'Scheduling…' : 'Publishing… (may take ~30s)'}</>
          ) : (
            <><Send size={16} />{scheduleEnabled && scheduledAt ? 'Schedule Post' : 'Post Now'}</>
          )}
        </button>
      </div>
    </div>
  );
}
