import { useState, useRef } from 'react';
import { Send, Image, Link, CalendarClock, X, Loader2, CheckCircle2, AlertCircle, Upload } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { FacebookSessionHook } from '@/hooks/useFacebookSession';

interface Props { isPaid: boolean; session: FacebookSessionHook; onSwitchTab: (tab: 'connect' | 'compose' | 'schedule' | 'posts' | 'analytics') => void }

function getPostType(message: string, link: string, imageUrl: string): string {
  if (imageUrl) return 'Photo post';
  if (link) return 'Link post';
  if (message.trim()) return 'Text post';
  return 'Post';
}

const POST_TYPE_STYLES: Record<string, string> = {
  'Photo post': 'bg-purple-50 text-purple-700 border-purple-200',
  'Link post':  'bg-blue-50 text-blue-700 border-blue-200',
  'Text post':  'bg-gray-50 text-gray-600 border-gray-200',
  'Post':       'bg-gray-50 text-gray-400 border-gray-100',
};

const MAX_CHARS = 63206;

export function FacebookComposePage({ isPaid, session, onSwitchTab }: Props) {
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ success: boolean; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const minDateTime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);
  const postType = getPostType(message, link, imageUrl);
  const charCount = message.length;
  const charOver = charCount > MAX_CHARS;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('image', file);
    try {
      const res = await apiFetch(API_ENDPOINTS.upload.image, { method: 'POST', body: form });
      const data = await res.json();
      if (data.success && data.url) setImageUrl(data.url);
    } catch { /* ignore */ }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!message.trim() || charOver) return;
    setSending(true);
    setDone(null);
    try {
      const payload: Record<string, string> = { message };
      if (link.trim()) payload.link = link.trim();
      if (imageUrl) payload.imageUrl = imageUrl;

      const endpoint = scheduleEnabled && scheduledAt
        ? API_ENDPOINTS.facebook.schedule
        : API_ENDPOINTS.facebook.posts;

      if (scheduleEnabled && scheduledAt) {
        payload.scheduledAt = new Date(scheduledAt).toISOString();
      }

      const res = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        setDone({ success: true, message: scheduleEnabled ? 'Post scheduled successfully!' : 'Post published successfully!' });
        setMessage(''); setLink(''); setImageUrl(''); setScheduleEnabled(false); setScheduledAt('');
      } else {
        setDone({ success: false, message: data.message || 'Failed to publish post.' });
      }
    } catch {
      setDone({ success: false, message: 'Network error. Please try again.' });
    }
    setSending(false);
  };

  if (!isPaid) {
    return (
      <div className="text-center py-16">
        <Send size={40} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 font-medium">Available on paid plans</p>
      </div>
    );
  }

  if (!session.isConnected) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center max-w-md mx-auto mt-6">
        <div className="w-12 h-12 rounded-full bg-[#1877f2] flex items-center justify-center text-white mx-auto mb-4">
          <Send size={20} />
        </div>
        <h3 className="font-bold text-gray-900 mb-2">Connect a Facebook Page first</h3>
        <p className="text-sm text-gray-500 mb-4">You need to connect a Facebook Page before creating posts.</p>
        <button onClick={() => onSwitchTab('connect')} className="px-5 py-2.5 bg-[#1877f2] text-white rounded-xl text-sm font-semibold hover:bg-[#166fe5] transition-colors">
          Connect Page
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Create Post</h2>
        {(message || link || imageUrl) && (
          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${POST_TYPE_STYLES[postType]}`}>
            {postType}
          </span>
        )}
      </div>

      {/* Page badge */}
      {session.selectedPageName && (
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white rounded-xl border border-gray-200 px-3 py-2">
          {session.selectedPagePicture && (
            <img src={session.selectedPagePicture} alt="" className="w-6 h-6 rounded-full object-cover" />
          )}
          <span>Posting as <span className="font-semibold text-gray-800">{session.selectedPageName}</span></span>
        </div>
      )}

      {/* Message */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="What's on your mind? Write your post here…"
          rows={6}
          className="w-full px-4 pt-4 pb-2 text-sm text-gray-800 resize-none focus:outline-none placeholder-gray-300"
        />
        <div className="px-4 pb-3 flex justify-end">
          <span className={`text-xs font-medium ${charOver ? 'text-red-500' : charCount > MAX_CHARS * 0.9 ? 'text-amber-500' : 'text-gray-400'}`}>
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Link */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
          <Link size={15} />Link (optional)
        </label>
        <input
          type="url"
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="https://example.com"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#1877f2] transition-colors"
        />
      </div>

      {/* Image */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
          <Image size={15} />Photo (optional)
        </label>
        {imageUrl ? (
          <div className="relative inline-block">
            <img src={imageUrl} alt="Upload preview" className="w-32 h-32 object-cover rounded-xl border border-gray-200" />
            <button onClick={() => setImageUrl('')} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600">
              <X size={12} />
            </button>
          </div>
        ) : (
          <>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#1877f2] hover:text-[#1877f2] transition-colors"
            >
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {uploading ? 'Uploading…' : 'Upload Image'}
            </button>
          </>
        )}
      </div>

      {/* Schedule toggle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <CalendarClock size={15} />Schedule for later
          </label>
          <button
            onClick={() => setScheduleEnabled(v => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors ${scheduleEnabled ? 'bg-[#1877f2]' : 'bg-gray-200'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${scheduleEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {scheduleEnabled && (
          <input
            type="datetime-local"
            value={scheduledAt}
            min={minDateTime}
            onChange={e => setScheduledAt(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#1877f2] transition-colors"
          />
        )}
      </div>

      {/* Result */}
      {done && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${done.success ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
          {done.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {done.message}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={sending || !message.trim() || charOver || (scheduleEnabled && !scheduledAt)}
        className="flex items-center gap-2 px-6 py-3 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-100"
      >
        {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {sending ? 'Publishing…' : scheduleEnabled ? 'Schedule Post' : 'Publish Now'}
      </button>
    </div>
  );
}
