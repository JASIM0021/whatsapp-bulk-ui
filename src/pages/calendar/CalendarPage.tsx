import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Code,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  Layers,
  Palette
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import {
  EventType,
  AvailabilitySchedule,
  CalendarBranding,
  Booking,
  CalendarWebhook,
  CalendarAccount,
  CustomQuestion
} from '@/types/calendar';

export function CalendarPage() {
  const [activeTab, setActiveTab] = useState<'events' | 'availability' | 'bookings' | 'google' | 'branding' | 'embed'>('events');
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Data states
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySchedule | null>(null);
  const [branding, setBranding] = useState<CalendarBranding | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingFilter, setBookingFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [account, setAccount] = useState<CalendarAccount | null>(null);
  const [webhooks, setWebhooks] = useState<CalendarWebhook[]>([]);

  // Event modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventType | null>(null);
  const [eventForm, setEventForm] = useState<Partial<EventType>>({
    title: '',
    slug: '',
    description: '',
    durationMinutes: 30,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    locationType: 'google_meet',
    locationDetails: '',
    color: '#10B981',
    isActive: true,
    customQuestions: [],
    requiresConfirmation: false,
    price: 0,
    currency: 'USD',
  });

  // Webhook modal state
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['booking.created', 'booking.cancelled']);

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [eventsRes, availRes, brandRes, bookRes, accRes, whRes] = await Promise.all([
        apiFetch(API_ENDPOINTS.calendar.eventTypes),
        apiFetch(API_ENDPOINTS.calendar.availability),
        apiFetch(API_ENDPOINTS.calendar.branding),
        apiFetch(API_ENDPOINTS.calendar.bookings),
        apiFetch(API_ENDPOINTS.calendar.status),
        apiFetch(API_ENDPOINTS.calendar.webhooks),
      ]);

      const [eventsData, availData, brandData, bookData, accData, whData] = await Promise.all([
        eventsRes.json(),
        availRes.json(),
        brandRes.json(),
        bookRes.json(),
        accRes.json(),
        whRes.json(),
      ]);

      if (eventsData.success) setEventTypes(eventsData.data || []);
      if (availData.success) setAvailability(availData.data);
      if (brandData.success) setBranding(brandData.data);
      if (bookData.success) setBookings(bookData.data || []);
      if (accData.success) setAccount(accData.data);
      if (whData.success) setWebhooks(whData.data || []);
    } catch (e) {
      console.error('Failed to load calendar data', e);
      showToast('Failed to load calendar data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Event Type Actions ───────────────────────────────────────────────────────

  const openCreateEventModal = () => {
    setEditingEvent(null);
    setEventForm({
      title: '',
      slug: '',
      description: '',
      durationMinutes: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 5,
      locationType: 'google_meet',
      locationDetails: '',
      color: '#10B981',
      isActive: true,
      customQuestions: [],
      requiresConfirmation: false,
      price: 0,
      currency: 'USD',
    });
    setShowEventModal(true);
  };

  const openEditEventModal = (et: EventType) => {
    setEditingEvent(et);
    setEventForm({ ...et });
    setShowEventModal(true);
  };

  const saveEventType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title) {
      showToast('Title is required', 'error');
      return;
    }
    setSaveLoading(true);
    try {
      let res;
      if (editingEvent && editingEvent.id) {
        res = await apiFetch(API_ENDPOINTS.calendar.eventType(editingEvent.id), {
          method: 'PUT',
          body: JSON.stringify(eventForm),
        });
      } else {
        res = await apiFetch(API_ENDPOINTS.calendar.eventTypes, {
          method: 'POST',
          body: JSON.stringify(eventForm),
        });
      }
      const data = await res.json();
      if (data.success) {
        showToast(editingEvent ? 'Event type updated!' : 'Event type created!');
        setShowEventModal(false);
        fetchAllData();
      } else {
        showToast(data.error || 'Failed to save event type', 'error');
      }
    } catch {
      showToast('Server connection error', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const deleteEventType = async (id?: string) => {
    if (!id || !confirm('Are you sure you want to delete this event type?')) return;
    try {
      const res = await apiFetch(API_ENDPOINTS.calendar.eventType(id), { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Event type deleted');
        setEventTypes(eventTypes.filter((et) => et.id !== id));
      } else {
        showToast(data.error || 'Failed to delete', 'error');
      }
    } catch {
      showToast('Error deleting event type', 'error');
    }
  };

  const addCustomQuestion = () => {
    const q: CustomQuestion = {
      id: Math.random().toString(36).substring(2, 9),
      label: 'Additional Information',
      type: 'text',
      required: false,
      placeholder: 'Tell us a bit more...',
    };
    setEventForm({
      ...eventForm,
      customQuestions: [...(eventForm.customQuestions || []), q],
    });
  };

  const removeCustomQuestion = (idx: number) => {
    const updated = [...(eventForm.customQuestions || [])];
    updated.splice(idx, 1);
    setEventForm({ ...eventForm, customQuestions: updated });
  };

  // ── Availability Actions ─────────────────────────────────────────────────────

  const toggleDayEnabled = (dayIdx: number) => {
    if (!availability) return;
    const updated = [...availability.weeklyHours];
    updated[dayIdx].isEnabled = !updated[dayIdx].isEnabled;
    if (updated[dayIdx].isEnabled && updated[dayIdx].ranges.length === 0) {
      updated[dayIdx].ranges = [{ start: '09:00', end: '17:00' }];
    }
    setAvailability({ ...availability, weeklyHours: updated });
  };

  const updateDayRange = (dayIdx: number, rangeIdx: number, field: 'start' | 'end', val: string) => {
    if (!availability) return;
    const updated = [...availability.weeklyHours];
    updated[dayIdx].ranges[rangeIdx][field] = val;
    setAvailability({ ...availability, weeklyHours: updated });
  };

  const addDayRange = (dayIdx: number) => {
    if (!availability) return;
    const updated = [...availability.weeklyHours];
    updated[dayIdx].ranges.push({ start: '13:00', end: '17:00' });
    setAvailability({ ...availability, weeklyHours: updated });
  };

  const removeDayRange = (dayIdx: number, rangeIdx: number) => {
    if (!availability) return;
    const updated = [...availability.weeklyHours];
    updated[dayIdx].ranges.splice(rangeIdx, 1);
    if (updated[dayIdx].ranges.length === 0) {
      updated[dayIdx].isEnabled = false;
    }
    setAvailability({ ...availability, weeklyHours: updated });
  };

  const saveAvailability = async () => {
    if (!availability) return;
    setSaveLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.calendar.availability, {
        method: 'PUT',
        body: JSON.stringify(availability),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Availability schedule saved successfully!');
        setAvailability(data.data);
      } else {
        showToast(data.error || 'Failed to save availability', 'error');
      }
    } catch {
      showToast('Error saving availability', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Branding Actions ─────────────────────────────────────────────────────────

  const saveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branding) return;
    setSaveLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.calendar.branding, {
        method: 'PUT',
        body: JSON.stringify(branding),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Branding updated successfully!');
        setBranding(data.data);
      } else {
        showToast(data.error || 'Failed to save branding', 'error');
      }
    } catch {
      showToast('Error updating branding', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Google Calendar OAuth ────────────────────────────────────────────────────

  const handleConnectGoogle = async () => {
    try {
      const res = await apiFetch(API_ENDPOINTS.calendar.oauthUrl);
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        showToast('Failed to get Google authorization URL', 'error');
      }
    } catch {
      showToast('Connection error', 'error');
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect your Google Calendar?')) return;
    try {
      const res = await apiFetch(API_ENDPOINTS.calendar.disconnect, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Google Calendar disconnected');
        setAccount(null);
      } else {
        showToast(data.error || 'Failed to disconnect', 'error');
      }
    } catch {
      showToast('Error disconnecting Google Calendar', 'error');
    }
  };

  // ── Webhook Actions ──────────────────────────────────────────────────────────

  const saveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl) return;
    try {
      const res = await apiFetch(API_ENDPOINTS.calendar.webhooks, {
        method: 'POST',
        body: JSON.stringify({ url: webhookUrl, events: webhookEvents }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Webhook endpoint added!');
        setShowWebhookModal(false);
        setWebhookUrl('');
        fetchAllData();
      } else {
        showToast(data.error || 'Failed to create webhook', 'error');
      }
    } catch {
      showToast('Error saving webhook', 'error');
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('Delete this webhook?')) return;
    try {
      const res = await apiFetch(API_ENDPOINTS.calendar.webhook(id), { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Webhook deleted');
        setWebhooks(webhooks.filter((w) => w.id !== id));
      }
    } catch {
      showToast('Error deleting webhook', 'error');
    }
  };

  // Cancel booking
  const cancelBooking = async (id: string) => {
    const reason = prompt('Please enter a cancellation reason:');
    if (reason === null) return;
    try {
      const res = await apiFetch(API_ENDPOINTS.calendar.cancelBooking(id), {
        method: 'POST',
        body: JSON.stringify({ reason: reason || 'Host cancelled' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Meeting cancelled successfully');
        fetchAllData();
      } else {
        showToast(data.error || 'Failed to cancel meeting', 'error');
      }
    } catch {
      showToast('Error cancelling booking', 'error');
    }
  };

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nexbotix.online';
  const username = branding?.username || 'user';

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'all') return true;
    return b.status === bookingFilter;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium transition-all ${
            toastMsg.type === 'error'
              ? 'bg-red-950/90 border-red-500/50 text-red-200'
              : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
          }`}
        >
          {toastMsg.type === 'error' ? <XCircle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Main Header */}
      <header className="border-b border-gray-800/80 bg-gray-900/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Nexbot Calendar</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Calendly-Grade
                </span>
              </div>
              <p className="text-xs text-gray-400">Scheduling, Google Meet 2-way sync, custom branding & website embed</p>
            </div>
          </div>

          {/* Quick Share Link */}
          {branding && (
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl p-1.5 pl-3">
              <span className="text-xs text-gray-400">My Page:</span>
              <code className="text-xs font-mono text-emerald-400 truncate max-w-[200px]">
                /book/{branding.username}
              </code>
              <button
                onClick={() => copyToClipboard(`${originUrl}/book/${branding.username}/${eventTypes[0]?.slug || 'meeting'}`, 'quick-link')}
                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-300 hover:text-white transition"
                title="Copy first event link"
              >
                {copiedId === 'quick-link' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={`/book/${branding.username}/${eventTypes[0]?.slug || 'meeting'}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-300 hover:text-white transition"
                title="Preview public page"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2 border-t border-gray-800/60 pt-2">
          {[
            { id: 'events', label: 'Event Types', icon: Layers, count: eventTypes.length },
            { id: 'availability', label: 'Availability Hours', icon: Clock },
            { id: 'bookings', label: 'Bookings', icon: CalendarCheck, count: bookings.length },
            { id: 'google', label: 'Google Calendar Sync', icon: RefreshCw, badge: account?.isConnected ? 'Active' : 'Offline' },
            { id: 'branding', label: 'Branding & UI', icon: Palette },
            { id: 'embed', label: 'Embed & Hooks', icon: Code },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-900/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-800 text-gray-300">{tab.count}</span>
                )}
                {tab.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${
                      account?.isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
            <p className="text-gray-400 text-sm">Loading calendar workspace...</p>
          </div>
        ) : (
          <>
            {/* ── TAB 1: EVENT TYPES ────────────────────────────────────────── */}
            {activeTab === 'events' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Event Types</h2>
                    <p className="text-sm text-gray-400">Configure bookable meeting formats, durations, and intake questions.</p>
                  </div>
                  <button
                    onClick={openCreateEventModal}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-950/40 transition transform active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Event Type</span>
                  </button>
                </div>

                {eventTypes.length === 0 ? (
                  <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-gray-800 bg-gray-900/30">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Layers className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1">No Event Types Yet</h3>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
                      Create your first meeting type (e.g. 15-min Quick Chat or 30-min Product Demo) to start accepting bookings.
                    </p>
                    <button
                      onClick={openCreateEventModal}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Event Type</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eventTypes.map((et) => {
                      const eventLink = `${originUrl}/book/${username}/${et.slug}`;
                      return (
                        <div
                          key={et.id}
                          className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition flex flex-col justify-between relative group"
                        >
                          {/* Left colored border accent line */}
                          <div
                            className="absolute top-0 left-0 bottom-0 w-1.5 rounded-l-2xl"
                            style={{ backgroundColor: et.color || '#10B981' }}
                          />

                          <div>
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div>
                                <h3 className="font-semibold text-white text-base leading-snug">{et.title}</h3>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">/{et.slug}</p>
                              </div>
                              <span
                                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                  et.isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-gray-800 text-gray-400'
                                }`}
                              >
                                {et.isActive ? 'Active' : 'Paused'}
                              </span>
                            </div>

                            {et.description && (
                              <p className="text-xs text-gray-300 line-clamp-2 mb-4">{et.description}</p>
                            )}

                            <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-4">
                              <span className="flex items-center gap-1 bg-gray-800/80 px-2.5 py-1 rounded-lg">
                                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                {et.durationMinutes} mins
                              </span>
                              <span className="flex items-center gap-1 bg-gray-800/80 px-2.5 py-1 rounded-lg">
                                <Video className="w-3.5 h-3.5 text-blue-400" />
                                {et.locationType === 'google_meet' ? 'Google Meet' : et.locationType}
                              </span>
                              {et.customQuestions && et.customQuestions.length > 0 && (
                                <span className="bg-gray-800/80 px-2.5 py-1 rounded-lg">
                                  {et.customQuestions.length} Questions
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between gap-2">
                            <button
                              onClick={() => copyToClipboard(eventLink, et.id || et.slug)}
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/30 transition"
                            >
                              {copiedId === (et.id || et.slug) ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedId === (et.id || et.slug) ? 'Copied' : 'Copy Link'}</span>
                            </button>

                            <div className="flex items-center gap-1">
                              <a
                                href={eventLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition"
                                title="Open Booking Page"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => openEditEventModal(et)}
                                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition"
                                title="Edit Event"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteEventType(et.id)}
                                className="p-2 hover:bg-red-950/40 rounded-lg text-gray-400 hover:text-red-400 transition"
                                title="Delete Event"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: AVAILABILITY SCHEDULE ────────────────────────────────── */}
            {activeTab === 'availability' && availability && (
              <div className="max-w-4xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Weekly Working Hours</h2>
                    <p className="text-sm text-gray-400">Set the days and time intervals when you are available for meetings.</p>
                  </div>
                  <button
                    onClick={saveAvailability}
                    disabled={saveLoading}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg transition"
                  >
                    {saveLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>Save Schedule</span>
                  </button>
                </div>

                {/* Global Settings (Timezone, Notice, Intervals) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Timezone</label>
                    <select
                      value={availability.timezone}
                      onChange={(e) => setAvailability({ ...availability, timezone: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="UTC">UTC (Universal Coordinated Time)</option>
                      <option value="America/New_York">America/New York (EST/EDT)</option>
                      <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                      <option value="America/Denver">America/Denver (MST/MDT)</option>
                      <option value="America/Los_Angeles">America/Los Angeles (PST/PDT)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                      <option value="Europe/Berlin">Europe/Berlin (CET/CEST)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Minimum Notice</label>
                    <select
                      value={availability.minNoticeHours}
                      onChange={(e) => setAvailability({ ...availability, minNoticeHours: parseInt(e.target.value) || 0 })}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="0">0 hours (Instant booking)</option>
                      <option value="1">1 hour in advance</option>
                      <option value="2">2 hours in advance</option>
                      <option value="4">4 hours in advance</option>
                      <option value="12">12 hours in advance</option>
                      <option value="24">24 hours in advance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Max Advance Booking</label>
                    <select
                      value={availability.maxAdvanceDays}
                      onChange={(e) => setAvailability({ ...availability, maxAdvanceDays: parseInt(e.target.value) || 30 })}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="14">14 days into future</option>
                      <option value="30">30 days into future</option>
                      <option value="60">60 days into future</option>
                      <option value="90">90 days into future</option>
                    </select>
                  </div>
                </div>

                {/* Day-by-Day Hours */}
                <div className="space-y-3 bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                  {availability.weeklyHours.map((dayObj, dayIdx) => {
                    const dayCapitalized = dayObj.day.charAt(0).toUpperCase() + dayObj.day.slice(1);
                    return (
                      <div
                        key={dayObj.day}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl border transition ${
                          dayObj.isEnabled
                            ? 'bg-gray-950/60 border-gray-800'
                            : 'bg-gray-950/20 border-transparent opacity-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 w-40">
                          <input
                            type="checkbox"
                            checked={dayObj.isEnabled}
                            onChange={() => toggleDayEnabled(dayIdx)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-700 bg-gray-900"
                          />
                          <span className="text-sm font-semibold text-white">{dayCapitalized}</span>
                        </div>

                        {dayObj.isEnabled ? (
                          <div className="flex-1 space-y-2">
                            {dayObj.ranges.map((range, rangeIdx) => (
                              <div key={rangeIdx} className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={range.start}
                                  onChange={(e) => updateDayRange(dayIdx, rangeIdx, 'start', e.target.value)}
                                  className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                                <span className="text-xs text-gray-500">&ndash;</span>
                                <input
                                  type="time"
                                  value={range.end}
                                  onChange={(e) => updateDayRange(dayIdx, rangeIdx, 'end', e.target.value)}
                                  className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeDayRange(dayIdx, rangeIdx)}
                                  className="p-1 hover:bg-gray-800 text-gray-500 hover:text-red-400 rounded transition"
                                  title="Remove time block"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex-1 text-xs text-gray-500 italic">Unavailable</div>
                        )}

                        {dayObj.isEnabled && (
                          <button
                            type="button"
                            onClick={() => addDayRange(dayIdx)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 self-start sm:self-center"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Block</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TAB 3: BOOKINGS MANAGER ─────────────────────────────────────── */}
            {activeTab === 'bookings' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-white">Bookings & Meetings</h2>
                    <p className="text-sm text-gray-400">View and manage all scheduled client appointments.</p>
                  </div>

                  <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-xl border border-gray-800">
                    {(['all', 'confirmed', 'cancelled'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setBookingFilter(filter)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                          bookingFilter === filter
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-gray-800 bg-gray-900/30">
                    <CalendarCheck className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                    <h3 className="text-base font-semibold text-white mb-1">No Bookings Found</h3>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      When users schedule meetings through your booking link, they will appear here with instant Google Meet links.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((b) => {
                      const startDate = new Date(b.startTime);
                      return (
                        <div
                          key={b.id}
                          className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex flex-col items-center justify-center text-emerald-400 shrink-0">
                              <span className="text-[10px] font-bold uppercase">{startDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                              <span className="text-base font-black leading-none">{startDate.getDate()}</span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-white text-base">{b.eventTitle}</h3>
                                <span
                                  className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${
                                    b.status === 'confirmed'
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}
                                >
                                  {b.status}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mt-1">
                                <span className="font-medium text-gray-200">With {b.inviteeName}</span>
                                <span>&bull;</span>
                                <span className="text-gray-400">{b.inviteeEmail}</span>
                                {b.inviteePhone && (
                                  <>
                                    <span>&bull;</span>
                                    <span>{b.inviteePhone}</span>
                                  </>
                                )}
                              </div>

                              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                                {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ({b.durationMinutes} mins)
                              </p>

                              {b.inviteeNotes && (
                                <p className="text-xs text-gray-300 mt-2 bg-gray-950/60 p-2 rounded-lg border border-gray-800 max-w-xl">
                                  <span className="font-semibold text-gray-400">Notes:</span> {b.inviteeNotes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-center">
                            {b.meetLink && b.status === 'confirmed' && (
                              <a
                                href={b.meetLink}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
                              >
                                <Video className="w-4 h-4" />
                                <span>Join Meet</span>
                              </a>
                            )}
                            {b.status === 'confirmed' && (
                              <button
                                onClick={() => cancelBooking(b.id)}
                                className="px-3 py-2 rounded-xl bg-gray-800 hover:bg-red-950/40 text-gray-300 hover:text-red-400 text-xs font-medium border border-gray-700 transition"
                              >
                                Cancel Meeting
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 4: GOOGLE CALENDAR SYNC ─────────────────────────────────── */}
            {activeTab === 'google' && (
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white">Google Calendar Integration</h2>
                  <p className="text-sm text-gray-400">
                    Connect your Google account for real-time 2-way sync: automatically block busy slots and generate Google Meet video links.
                  </p>
                </div>

                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 mb-6">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2.5 shadow">
                        <svg className="w-full h-full" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-white">Google Calendar & Google Meet</h3>
                        <p className="text-xs text-gray-400">
                          {account?.isConnected
                            ? `Connected as ${account.email}`
                            : 'Not connected'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        account?.isConnected
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {account?.isConnected ? 'Synced' : 'Disconnected'}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs text-gray-300 mb-6 bg-gray-950/60 p-4 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>2-Way Conflict Detection: Busy times in your Google Calendar are automatically removed from booking options.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Auto Google Meet links: Every confirmed booking gets a unique video conference room generated instantly.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Calendar Reminders: Both you and your client receive native Google Calendar invites and push reminders.</span>
                    </div>
                  </div>

                  {account?.isConnected ? (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <span className="text-xs text-emerald-400 font-medium">✓ Active synchronization active</span>
                      <button
                        onClick={handleDisconnectGoogle}
                        className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/40 text-red-400 font-medium text-xs border border-red-500/30 transition"
                      >
                        Disconnect Account
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnectGoogle}
                      className="w-full py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                      <span>Connect Google Calendar</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 5: BRANDING & CUSTOMIZATION ────────────────────────────── */}
            {activeTab === 'branding' && branding && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Form */}
                <div className="lg:col-span-7">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white">Booking Page Branding</h2>
                    <p className="text-sm text-gray-400">Customize how your public schedule and embed widgets look to visitors.</p>
                  </div>

                  <form onSubmit={saveBranding} className="space-y-4 bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Username / URL Slug</label>
                        <div className="flex items-center bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-400">
                          <span>/book/</span>
                          <input
                            type="text"
                            value={branding.username}
                            onChange={(e) => setBranding({ ...branding, username: e.target.value })}
                            className="bg-transparent text-white font-medium focus:outline-none w-full ml-1"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Display Name</label>
                        <input
                          type="text"
                          value={branding.displayName}
                          onChange={(e) => setBranding({ ...branding, displayName: e.target.value })}
                          className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Avatar / Profile Picture URL</label>
                      <input
                        type="url"
                        placeholder="https://example.com/avatar.jpg"
                        value={branding.avatarUrl}
                        onChange={(e) => setBranding({ ...branding, avatarUrl: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Bio / Introduction</label>
                      <textarea
                        rows={2}
                        value={branding.bio}
                        onChange={(e) => setBranding({ ...branding, bio: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Brand Accent Color</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={branding.brandColor || '#10B981'}
                            onChange={(e) => setBranding({ ...branding, brandColor: e.target.value })}
                            className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={branding.brandColor}
                            onChange={(e) => setBranding({ ...branding, brandColor: e.target.value })}
                            className="flex-1 bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white font-mono uppercase"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Theme Mode</label>
                        <select
                          value={branding.themeMode}
                          onChange={(e) => setBranding({ ...branding, themeMode: e.target.value as any })}
                          className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="light">Light Theme</option>
                          <option value="dark">Dark Theme</option>
                          <option value="auto">Auto (Match Visitor OS)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">Custom Welcome Headline</label>
                      <input
                        type="text"
                        value={branding.welcomeHeadline}
                        onChange={(e) => setBranding({ ...branding, welcomeHeadline: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                      <button
                        type="submit"
                        disabled={saveLoading}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-lg"
                      >
                        {saveLoading ? 'Saving...' : 'Save Branding Changes'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right: Live Preview Card */}
                <div className="lg:col-span-5">
                  <div className="sticky top-28">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Live Preview
                    </label>
                    <div className="bg-white text-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        {branding.avatarUrl ? (
                          <img src={branding.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover shadow" />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: branding.brandColor || '#10B981' }}
                          >
                            {branding.displayName.charAt(0) || 'U'}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-gray-900 text-base">{branding.displayName || 'Your Name'}</h4>
                          <p className="text-xs text-gray-500">{branding.companyName || 'Nexbot Calendar Host'}</p>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                        {branding.bio || 'Schedule a meeting with me directly.'}
                      </p>

                      <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 mb-4">
                        <h5 className="font-bold text-sm text-gray-900 mb-1">
                          {branding.welcomeHeadline || 'Select a Date & Time'}
                        </h5>
                        <p className="text-xs text-gray-500">Pick an open slot on the calendar.</p>
                      </div>

                      <button
                        type="button"
                        style={{ backgroundColor: branding.brandColor || '#10B981' }}
                        className="w-full py-2.5 rounded-xl text-white font-semibold text-xs shadow transition"
                      >
                        Confirm Booking Preview
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 6: EMBED & WEBHOOKS ─────────────────────────────────────── */}
            {activeTab === 'embed' && (
              <div className="space-y-8 max-w-4xl">
                <div>
                  <h2 className="text-lg font-semibold text-white">Embed Widget on Any Website</h2>
                  <p className="text-sm text-gray-400">
                    Add meeting scheduling directly to WordPress, Shopify, Webflow, React, Next.js, or any HTML site.
                  </p>
                </div>

                {/* Option 1: Inline Embed */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">1. Inline Embed Script</h3>
                      <p className="text-xs text-gray-400">Renders the booking calendar directly inside any container on your page.</p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `<div data-nexbot-user="${username}" data-nexbot-event="${eventTypes[0]?.slug || 'meeting'}" data-nexbot-mode="inline" style="width: 100%; height: 720px;"></div>\n<script src="${originUrl}/api/calendar/embed.js" async></script>`,
                          'inline-code'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-emerald-400 font-medium flex items-center gap-1.5 transition"
                    >
                      {copiedId === 'inline-code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'inline-code' ? 'Copied' : 'Copy HTML'}</span>
                    </button>
                  </div>

                  <pre className="bg-gray-950 p-4 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto border border-gray-800">
                    {`<!-- Nexbot Calendar Inline Embed -->
<div data-nexbot-user="${username}" data-nexbot-event="${eventTypes[0]?.slug || 'meeting'}" data-nexbot-mode="inline" style="width: 100%; height: 720px;"></div>
<script src="${originUrl}/api/calendar/embed.js" async></script>`}
                  </pre>
                </div>

                {/* Option 2: Floating Popup Badge */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">2. Floating Popup Button</h3>
                      <p className="text-xs text-gray-400">Adds a floating 'Schedule Meeting' badge at the bottom corner of your website.</p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `<script src="${originUrl}/api/calendar/embed.js"></script>\n<script>\n  window.addEventListener('DOMContentLoaded', function() {\n    NexbotCalendar.initButton({\n      user: '${username}',\n      event: '${eventTypes[0]?.slug || 'meeting'}',\n      text: 'Schedule Meeting',\n      color: '${branding?.brandColor || '#10B981'}'\n    });\n  });\n</script>`,
                          'popup-code'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-emerald-400 font-medium flex items-center gap-1.5 transition"
                    >
                      {copiedId === 'popup-code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'popup-code' ? 'Copied' : 'Copy HTML'}</span>
                    </button>
                  </div>

                  <pre className="bg-gray-950 p-4 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto border border-gray-800">
                    {`<script src="${originUrl}/api/calendar/embed.js"></script>
<script>
  window.addEventListener('DOMContentLoaded', function() {
    NexbotCalendar.initButton({
      user: '${username}',
      event: '${eventTypes[0]?.slug || 'meeting'}',
      text: 'Schedule Meeting',
      color: '${branding?.brandColor || '#10B981'}'
    });
  });
</script>`}
                  </pre>
                </div>

                {/* Option 3: React / Next.js Hook */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">3. React / Next.js Hook & SDK</h3>
                      <p className="text-xs text-gray-400">Trigger booking modal programmatically from any button in your React code.</p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `import { useNexbotCalendar } from '@/hooks/useNexbotCalendar';\n\nfunction BookMeetingButton() {\n  const { openBookingModal } = useNexbotCalendar('${originUrl}');\n\n  return (\n    <button onClick={() => openBookingModal({ user: '${username}', event: '${eventTypes[0]?.slug || 'meeting'}' })}>\n      Book a Demo\n    </button>\n  );\n}`,
                          'react-code'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-emerald-400 font-medium flex items-center gap-1.5 transition"
                    >
                      {copiedId === 'react-code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'react-code' ? 'Copied' : 'Copy React Hook'}</span>
                    </button>
                  </div>

                  <pre className="bg-gray-950 p-4 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto border border-gray-800">
                    {`import { useNexbotCalendar } from '@/hooks/useNexbotCalendar';

function BookMeetingButton() {
  const { openBookingModal } = useNexbotCalendar('${originUrl}');

  return (
    <button 
      onClick={() => openBookingModal({ 
        user: '${username}', 
        event: '${eventTypes[0]?.slug || 'meeting'}',
        onBookingComplete: (booking) => {
          console.log('Booked!', booking);
        }
      })}
    >
      Book a Demo
    </button>
  );
}`}
                  </pre>
                </div>

                {/* Webhooks Section */}
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-white">Automation Webhooks</h3>
                      <p className="text-xs text-gray-400">Receive HTTP POST payloads when meetings are scheduled, cancelled, or rescheduled.</p>
                    </div>
                    <button
                      onClick={() => setShowWebhookModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Webhook</span>
                    </button>
                  </div>

                  {webhooks.length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-4">No webhooks registered.</p>
                  ) : (
                    <div className="space-y-3">
                      {webhooks.map((wh) => (
                        <div
                          key={wh.id}
                          className="flex items-center justify-between gap-4 p-3 rounded-xl bg-gray-950 border border-gray-800"
                        >
                          <div>
                            <p className="font-mono text-xs text-emerald-400 truncate max-w-md">{wh.url}</p>
                            <div className="flex gap-2 mt-1">
                              {wh.events.map((e) => (
                                <span key={e} className="px-2 py-0.5 text-[10px] rounded bg-gray-800 text-gray-400">
                                  {e}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => deleteWebhook(wh.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── MODAL: CREATE / EDIT EVENT TYPE ───────────────────────────────────── */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-5">
              <h3 className="text-lg font-bold text-white">
                {editingEvent ? 'Edit Event Type' : 'Create Event Type'}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={saveEventType} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. 30 Minute Strategy Consultation"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">URL Slug</label>
                  <input
                    type="text"
                    placeholder="30min-consult"
                    value={eventForm.slug}
                    onChange={(e) => setEventForm({ ...eventForm, slug: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Duration</label>
                  <select
                    value={eventForm.durationMinutes}
                    onChange={(e) => setEventForm({ ...eventForm, durationMinutes: parseInt(e.target.value) || 30 })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes (1 hour)</option>
                    <option value="90">90 minutes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  rows={2}
                  placeholder="Tell invitees what this meeting is about..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Location</label>
                  <select
                    value={eventForm.locationType}
                    onChange={(e) => setEventForm({ ...eventForm, locationType: e.target.value as any })}
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="google_meet">📹 Google Meet (Auto-generated)</option>
                    <option value="phone">📞 Phone Call</option>
                    <option value="in_person">📍 In-person Meeting</option>
                    <option value="custom">🌐 Custom Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Card Accent Color</label>
                  <input
                    type="color"
                    value={eventForm.color || '#10B981'}
                    onChange={(e) => setEventForm({ ...eventForm, color: e.target.value })}
                    className="w-full h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Custom Questions Section */}
              <div className="pt-3 border-t border-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Custom Booking Questions</label>
                  <button
                    type="button"
                    onClick={addCustomQuestion}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>

                {eventForm.customQuestions && eventForm.customQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {eventForm.customQuestions.map((q, qIdx) => (
                      <div key={q.id || qIdx} className="p-3 bg-gray-950 border border-gray-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            placeholder="Question label..."
                            value={q.label}
                            onChange={(e) => {
                              const updated = [...(eventForm.customQuestions || [])];
                              updated[qIdx].label = e.target.value;
                              setEventForm({ ...eventForm, customQuestions: updated });
                            }}
                            className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-white flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeCustomQuestion(qIdx)}
                            className="text-gray-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <select
                            value={q.type}
                            onChange={(e) => {
                              const updated = [...(eventForm.customQuestions || [])];
                              updated[qIdx].type = e.target.value as any;
                              setEventForm({ ...eventForm, customQuestions: updated });
                            }}
                            className="bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-white text-xs"
                          >
                            <option value="text">Single line text</option>
                            <option value="textarea">Multi-line textarea</option>
                            <option value="phone">Phone number</option>
                          </select>

                          <label className="flex items-center gap-1.5 text-gray-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={(e) => {
                                const updated = [...(eventForm.customQuestions || [])];
                                updated[qIdx].required = e.target.checked;
                                setEventForm({ ...eventForm, customQuestions: updated });
                              }}
                              className="rounded text-emerald-600 bg-gray-900"
                            />
                            <span>Required</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">Invitee name and email are asked by default.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg transition"
                >
                  {saveLoading ? 'Saving...' : 'Save Event Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD WEBHOOK ─────────────────────────────────────────────────── */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
              <h3 className="text-base font-bold text-white">Add Webhook Endpoint</h3>
              <button onClick={() => setShowWebhookModal(false)} className="text-gray-400 hover:text-white text-xl">
                &times;
              </button>
            </div>

            <form onSubmit={saveWebhook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Target Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://api.yourdomain.com/webhooks/nexbot"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">Subscribed Events</label>
                <div className="space-y-1.5 text-xs text-gray-300">
                  {['booking.created', 'booking.cancelled', 'booking.rescheduled'].map((evt) => (
                    <label key={evt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={webhookEvents.includes(evt)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWebhookEvents([...webhookEvents, evt]);
                          } else {
                            setWebhookEvents(webhookEvents.filter((x) => x !== evt));
                          }
                        }}
                        className="rounded text-emerald-600 bg-gray-950 border-gray-700"
                      />
                      <span className="font-mono">{evt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg"
                >
                  Add Endpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
