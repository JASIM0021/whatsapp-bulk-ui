import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Clock,
  Video,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Globe,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  CalendarPlus
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { PublicEventInfo, AvailableSlot } from '@/types/calendar';

export function PublicBookingPage() {
  const { username, slug } = useParams<{ username: string; slug: string }>();

  const [info, setInfo] = useState<PublicEventInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar selection state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // "YYYY-MM-DD"
  const [selectedTimezone, setSelectedTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );

  // Slots state
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  // Step state: 'pick-time' -> 'form' -> 'confirmed'
  const [step, setStep] = useState<'pick-time' | 'form' | 'confirmed'>('pick-time');

  // Invitee form state
  const [inviteeName, setInviteeName] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [inviteePhone, setInviteePhone] = useState('');
  const [inviteeNotes, setInviteeNotes] = useState('');
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Fetch Event Info
  useEffect(() => {
    if (!username || !slug) return;
    fetchEventInfo();
  }, [username, slug]);

  const fetchEventInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.calendar.publicEvent(username!, slug!));
      const data = await res.json();
      if (data.success && data.data) {
        setInfo(data.data);
        if (data.data.timezone) {
          // If local timezone is detected, use local or host
        }
      } else {
        setError(data.error || 'Event not found or inactive');
      }
    } catch {
      setError('Failed to connect to booking server');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Slots when date or timezone changes
  useEffect(() => {
    if (!username || !slug || !selectedDate) return;
    fetchSlots(selectedDate, selectedTimezone);
  }, [selectedDate, selectedTimezone]);

  const fetchSlots = async (dateStr: string, tz: string) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.calendar.publicSlots(username!, slug!, dateStr, tz));
      const data = await res.json();
      if (data.success) {
        setSlots(data.data || []);
      } else {
        setSlots([]);
      }
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Month navigation
  const prevMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(d);
  };

  const nextMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d);
  };

  // Build Month Days Matrix
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isPast: boolean }[] = [];

    // Padding previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ dateStr: '', dayNum: 0, isCurrentMonth: false, isPast: true });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isPast = dateStr < todayStr;
      days.push({ dateStr, dayNum: d, isCurrentMonth: true, isPast });
    }

    return days;
  }, [currentMonth]);

  // Submit Booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !username || !slug) return;

    setSubmitting(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.calendar.publicBook(username, slug), {
        method: 'POST',
        body: JSON.stringify({
          startTime: selectedSlot.startTime,
          timezone: selectedTimezone,
          inviteeName,
          inviteeEmail,
          inviteePhone,
          inviteeNotes,
          customAnswers,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setConfirmedBooking(data.data);
        setStep('confirmed');

        // Notify parent iframe if embedded
        if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
          window.parent.postMessage(
            { type: 'nexbot:booking-completed', payload: data.data },
            '*'
          );
        }
      } else {
        alert(data.error || 'Failed to complete booking. Please choose another time.');
      }
    } catch {
      alert('Error submitting booking request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Google Calendar Web Link Generator
  const generateGoogleCalendarUrl = (booking: any) => {
    if (!booking) return '#';
    const start = new Date(booking.startTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(booking.endTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const title = encodeURIComponent(`${booking.eventTitle} with ${booking.hostName}`);
    const details = encodeURIComponent(
      `Nexbot Calendar Meeting\n\nMeet Link: ${booking.meetLink || 'N/A'}\nHost: ${booking.hostName}\nInvitee: ${booking.inviteeName}`
    );
    const location = encodeURIComponent(booking.meetLink || 'Google Meet');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  };

  // Download .ics Calendar File
  const downloadICS = (booking: any) => {
    if (!booking) return;
    const start = new Date(booking.startTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = new Date(booking.endTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nexbot Calendar//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${booking.eventTitle} with ${booking.hostName}`,
      `DESCRIPTION:Nexbot Meeting: ${booking.meetLink || ''}`,
      `LOCATION:${booking.meetLink || 'Online'}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `UID:${booking.id}@nexbotix.online`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${booking.eventSlug || 'meeting'}-invite.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">Loading booking page...</p>
        </div>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl border border-gray-100 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Booking Link Unavailable</h2>
          <p className="text-sm text-gray-500 mb-6">{error || 'This event type was not found or is currently paused.'}</p>
          <a
            href="/"
            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-medium text-xs hover:bg-gray-800 transition inline-block"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  const { host, event } = info;
  const brandColor = host.brandColor || '#10B981';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 py-6 sm:py-12 px-3 sm:px-6 flex items-center justify-center font-sans text-gray-800">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col md:flex-row">
        {/* Left Column: Host Branding & Event Details */}
        <div className="w-full md:w-[320px] lg:w-[360px] p-6 sm:p-8 bg-gray-50/80 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col justify-between">
          <div>
            {step === 'form' && (
              <button
                type="button"
                onClick={() => setStep('pick-time')}
                className="mb-4 text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Calendar</span>
              </button>
            )}

            {/* Host Avatar & Name */}
            <div className="flex items-center gap-3 mb-6">
              {host.avatarUrl ? (
                <img src={host.avatarUrl} alt={host.displayName} className="w-12 h-12 rounded-full object-cover shadow" />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                  style={{ backgroundColor: brandColor }}
                >
                  {host.displayName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Host</p>
                <h3 className="font-bold text-gray-900 text-base">{host.displayName}</h3>
              </div>
            </div>

            {/* Event Title */}
            <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
              {event.title}
            </h1>

            {/* Meta Tags */}
            <div className="space-y-2.5 text-xs text-gray-600 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{event.durationMinutes} Minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{event.locationType === 'google_meet' ? 'Google Meet Video Call' : event.locationType}</span>
              </div>
            </div>

            {/* Event Description */}
            {event.description && (
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line mb-6 bg-white/60 p-3.5 rounded-xl border border-gray-200">
                {event.description}
              </p>
            )}

            {/* Timezone Selector in Left Sidebar */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-gray-500" />
                <span>Timezone</span>
              </label>
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value={selectedTimezone}>{selectedTimezone} (Your Local Time)</option>
                <option value="America/New_York">America/New York (EST/EDT)</option>
                <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                <option value="America/Denver">America/Denver (MST/MDT)</option>
                <option value="America/Los_Angeles">America/Los Angeles (PST/PDT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
              </select>
            </div>
          </div>

          {!host.hideNexbotBranding && (
            <div className="pt-6 mt-6 border-t border-gray-200 text-center">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-medium text-gray-400 hover:text-gray-600 transition"
              >
                Powered by <span className="font-bold text-emerald-600">Nexbot Calendar</span>
              </a>
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Steps */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
          {/* ── STEP 1: DATE & TIME SELECTOR ─────────────────────────────────── */}
          {step === 'pick-time' && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-4">Select a Date & Time</h2>

              <div className="flex flex-col lg:flex-row gap-8">
                {/* Month Calendar */}
                <div className="flex-1">
                  {/* Month Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={prevMonth}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={nextMonth}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Day Names */}
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400 mb-2">
                    <span>SUN</span>
                    <span>MON</span>
                    <span>TUE</span>
                    <span>WED</span>
                    <span>THU</span>
                    <span>FRI</span>
                    <span>SAT</span>
                  </div>

                  {/* Days Matrix */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarDays.map((day, idx) => {
                      if (!day.isCurrentMonth) {
                        return <div key={idx} className="h-10" />;
                      }

                      const isSelected = selectedDate === day.dateStr;
                      const isAvailable = info.availableDays?.includes(day.dateStr);
                      const isDisabled = day.isPast;

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedDate(day.dateStr)}
                          style={
                            isSelected
                              ? { backgroundColor: brandColor, color: '#ffffff' }
                              : undefined
                          }
                          className={`h-10 rounded-xl text-xs font-bold transition flex items-center justify-center relative ${
                            isSelected
                              ? 'shadow-md shadow-emerald-500/20'
                              : isAvailable
                              ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-extrabold ring-1 ring-emerald-300/60'
                              : isDisabled
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>{day.dayNum}</span>
                          {isAvailable && !isSelected && (
                            <span
                              className="absolute bottom-1 w-1 h-1 rounded-full"
                              style={{ backgroundColor: brandColor }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Slots Column */}
                <div className="w-full lg:w-[220px]">
                  {selectedDate ? (
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </h4>

                      {slotsLoading ? (
                        <div className="py-8 flex flex-col items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-gray-400">Finding open slots...</span>
                        </div>
                      ) : slots.length === 0 ? (
                        <p className="text-xs text-gray-500 italic py-6">No slots available on this date.</p>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                          {slots.map((slot) => (
                            <button
                              key={slot.startTime}
                              type="button"
                              onClick={() => {
                                setSelectedSlot(slot);
                                setStep('form');
                              }}
                              className="w-full py-2.5 px-3 rounded-xl border border-emerald-500/30 hover:border-emerald-600 bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs shadow-sm hover:shadow transition flex items-center justify-center gap-1 group"
                            >
                              <span>{slot.formatted}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center p-4 border border-dashed border-gray-200 rounded-2xl">
                      <p className="text-xs text-gray-400">Select a date on the calendar to see open timeslots.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: INVITEE DETAILS FORM ─────────────────────────────────── */}
          {step === 'form' && selectedSlot && (
            <div>
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900">Enter Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Scheduled for{' '}
                  <strong className="text-emerald-700 font-bold">
                    {new Date(selectedSlot.startTime).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>{' '}
                  ({selectedTimezone})
                </p>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={inviteeName}
                    onChange={(e) => setInviteeName(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="jane@example.com"
                    value={inviteeEmail}
                    onChange={(e) => setInviteeEmail(e.target.value)}
                    required
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={inviteePhone}
                    onChange={(e) => setInviteePhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Additional Notes / Agenda
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Please share anything that will help prepare for our meeting..."
                    value={inviteeNotes}
                    onChange={(e) => setInviteeNotes(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                {/* Custom Dynamic Questions */}
                {event.customQuestions?.map((q) => (
                  <div key={q.id}>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      {q.label} {q.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={q.type === 'phone' ? 'tel' : 'text'}
                      placeholder={q.placeholder || ''}
                      required={q.required}
                      value={customAnswers[q.id] || ''}
                      onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                ))}

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ backgroundColor: brandColor }}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg hover:opacity-95 transition transform active:scale-98 disabled:opacity-50"
                  >
                    {submitting ? 'Scheduling Meeting...' : 'Schedule Event'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── STEP 3: CONFIRMATION SCREEN ─────────────────────────────────── */}
          {step === 'confirmed' && confirmedBooking && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h2 className="text-2xl font-black text-gray-900 mb-2">You are scheduled!</h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
                A calendar invitation has been sent to your email address (<strong>{confirmedBooking.inviteeEmail}</strong>).
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-left max-w-md mx-auto mb-6 space-y-3">
                <h3 className="font-bold text-gray-900 text-base">{confirmedBooking.eventTitle}</h3>
                
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CalendarIcon className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">
                    {new Date(confirmedBooking.startTime).toLocaleString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    ({confirmedBooking.timezone || 'UTC'})
                  </span>
                </div>

                {confirmedBooking.meetLink && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Web conferencing details:</p>
                    <a
                      href={confirmedBooking.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                    >
                      <Video className="w-4 h-4" />
                      <span>{confirmedBooking.meetLink}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Add to Calendar buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <a
                  href={generateGoogleCalendarUrl(confirmedBooking)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <CalendarPlus className="w-4 h-4 text-red-500" />
                  <span>Google Calendar</span>
                </a>

                <button
                  type="button"
                  onClick={() => downloadICS(confirmedBooking)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <CalendarPlus className="w-4 h-4 text-blue-500" />
                  <span>Download .ICS (Outlook/Apple)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
