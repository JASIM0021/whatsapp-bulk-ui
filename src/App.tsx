import { useState, useEffect, useCallback } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ContactsTable } from '@/components/ContactsTable';
import { MessageComposer } from '@/components/MessageComposer';
import { QRCodeModal } from '@/components/QRCodeModal';
import { SendProgress } from '@/components/SendProgress';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { parseFile } from '@/lib/fileParser';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { Message, SendProgress as SendProgressType } from '@/types/message';
import { Contact } from '@/types/contact';
import { MessageSquare, Smartphone, Upload as UploadIcon, Trash2, LogOut, User, HelpCircle, Crown, Shield, BookUser, Users, CalendarClock, X, Bot, Lock, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TourGuide } from '@/components/TourGuide';
import { ManualContactEntry } from '@/components/ManualContactEntry';
import { SavedContactsDrawer } from '@/components/SavedContactsDrawer';
import { WhatsAppContactsDrawer } from '@/components/WhatsAppContactsDrawer';
import { ScheduledJobsDrawer } from '@/components/ScheduledJobsDrawer';
import './App.css';

function App() {
  const {
    contacts,
    setContacts,
    selection,
    setSelection,
    isWhatsAppConnected,
    setIsWhatsAppConnected,
  } = useApp();
  const { user, token, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [isFileUploading, setIsFileUploading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [showSendProgress, setShowSendProgress] = useState(false);
  const [showSavedContacts, setShowSavedContacts] = useState(false);
  const [showWAContacts, setShowWAContacts] = useState(false);
  const [showScheduledJobs, setShowScheduledJobs] = useState(false);
  const [scheduleToast, setScheduleToast] = useState('');
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [showTour, setShowTour] = useState(false);
  const [mobileTab, setMobileTab] = useState<'send' | 'contacts' | 'schedule' | 'more'>('send');

  // Define before useEffect so the closure captures the correct binding
  const checkWhatsAppStatus = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.whatsapp.status);
      const result = await response.json();
      const isConnected = result.success && result.data?.isConnected && result.data?.isReady;
      setIsWhatsAppConnected(isConnected);
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } catch {
      setIsWhatsAppConnected(false);
      setConnectionStatus('disconnected');
    }
  }, [setIsWhatsAppConnected]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    checkWhatsAppStatus();
    const interval = setInterval(checkWhatsAppStatus, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isLoading, checkWhatsAppStatus]);

  // Heartbeat for auto-logout: send activity ping to backend on user interaction.
  // The backend's idle checker disconnects WhatsApp if no heartbeat for 10 minutes.
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    let lastHeartbeat = 0;
    const HEARTBEAT_INTERVAL = 2 * 60 * 1000; // 2 minutes

    const sendHeartbeat = () => {
      const now = Date.now();
      if (now - lastHeartbeat < HEARTBEAT_INTERVAL) return;
      lastHeartbeat = now;
      apiFetch(API_ENDPOINTS.security.heartbeat, { method: 'POST' }).catch(() => {});
    };

    // Send on mount (page open/refresh counts as activity)
    sendHeartbeat();

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, sendHeartbeat, { passive: true }));
    return () => events.forEach(evt => window.removeEventListener(evt, sendHeartbeat));
  }, [isAuthenticated, isLoading]);

  // Save contacts to the user's persistent contacts book (fire-and-forget)
  const saveContactsToBook = useCallback(async (contactsToSave: Contact[]) => {
    const valid = contactsToSave
      .filter((c) => c.isValid)
      .map((c) => ({ name: c.name || '', phone: c.formattedPhone || c.phone }));
    if (valid.length === 0) return;
    try {
      await apiFetch(API_ENDPOINTS.contacts.save, {
        method: 'POST',
        body: JSON.stringify({ contacts: valid }),
      });
    } catch {
      // Non-critical — silently ignore
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsFileUploading(true);
    try {
      const parsedContacts = await parseFile(file);
      setContacts(parsedContacts);
      const autoSelection: Record<string, boolean> = {};
      parsedContacts.forEach((contact) => {
        if (contact.isValid) autoSelection[contact.id] = true;
      });
      setSelection(autoSelection);
      // Auto-save valid contacts to the contacts book
      saveContactsToBook(parsedContacts);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to parse file');
    } finally {
      setIsFileUploading(false);
    }
  };

  const handleManualAdd = (newContacts: Contact[]) => {
    // Merge new contacts with existing ones (avoid duplicate phone numbers in session)
    const existingPhones = new Set(contacts.map((c) => c.formattedPhone || c.phone));
    const unique = newContacts.filter((c) => !existingPhones.has(c.formattedPhone || c.phone));
    const merged = [...contacts, ...unique];
    setContacts(merged);
    const autoSelection: Record<string, boolean> = { ...selection };
    unique.forEach((contact) => {
      if (contact.isValid) autoSelection[contact.id] = true;
    });
    setSelection(autoSelection);
    // Save to contacts book
    saveContactsToBook(newContacts);
  };

  const handleSavedContactsLoad = (loaded: Contact[]) => {
    // Merge saved contacts into session without duplicating phone numbers
    const existingPhones = new Set(contacts.map((c) => c.formattedPhone || c.phone));
    const unique = loaded.filter((c) => !existingPhones.has(c.formattedPhone || c.phone));
    const merged = [...contacts, ...unique];
    setContacts(merged);
    const autoSelection: Record<string, boolean> = { ...selection };
    unique.forEach((contact) => {
      if (contact.isValid) autoSelection[contact.id] = true;
    });
    setSelection(autoSelection);
  };

  const handleConnectWhatsApp = async () => {
    setConnectionStatus('connecting');
    try {
      await apiFetch(API_ENDPOINTS.whatsapp.init, { method: 'POST' });
      setShowQRModal(true);
    } catch {
      alert('Failed to connect to WhatsApp');
      setConnectionStatus('disconnected');
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      await apiFetch(API_ENDPOINTS.whatsapp.disconnect, { method: 'POST' });
      setIsWhatsAppConnected(false);
      setConnectionStatus('disconnected');
    } catch {
      // ignore
    }
  };

  const handleQRModalClose = () => {
    setShowQRModal(false);
    setTimeout(checkWhatsAppStatus, 1000);
  };

  const handleSendMessages = async (messages: Message[], scheduledAt?: Date) => {
    setShowMessageComposer(false);

    if (scheduledAt) {
      // Schedule the job via API
      try {
        const res = await apiFetch(API_ENDPOINTS.schedule.create, {
          method: 'POST',
          body: JSON.stringify({
            contacts: selectedContacts.map(c => ({ phone: c.formattedPhone || c.phone, name: c.name || '' })),
            messages,
            scheduledAt: scheduledAt.toISOString(),
          }),
        });
        const json = await res.json();
        if (json.success) {
          setScheduleToast(`Scheduled for ${scheduledAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`);
          setTimeout(() => setScheduleToast(''), 5000);
        } else {
          setScheduleToast(`Failed to schedule: ${json.error || 'unknown error'}`);
          setTimeout(() => setScheduleToast(''), 5000);
        }
      } catch {
        setScheduleToast('Network error — could not schedule');
        setTimeout(() => setScheduleToast(''), 5000);
      }
      return;
    }

    // Immediate send
    setCurrentMessages(messages);
    setShowSendProgress(true);
  };

  const handleSendComplete = (progress: SendProgressType) => {
    console.log('Send complete:', progress);
    setSelection({});
  };

  const handleClearContacts = () => {
    if (confirm('Are you sure you want to clear all contacts?')) {
      setContacts([]);
      setSelection({});
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMobileTab = (tab: 'send' | 'contacts' | 'schedule' | 'more') => {
    setMobileTab(tab);
    if (tab === 'contacts') setShowSavedContacts(true);
    else if (tab === 'schedule') setShowScheduledJobs(true);
  };

  const handleSavedContactsClose = () => {
    setShowSavedContacts(false);
    setMobileTab('send');
  };

  const handleScheduledJobsClose = () => {
    setShowScheduledJobs(false);
    setMobileTab('send');
  };

  const selectedContacts = contacts.filter((c) => selection[c.id]);
  const selectedCount = selectedContacts.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Desktop header */}
          <div className="hidden md:flex items-center justify-between gap-4">

            {/* Left: Logo + title */}
            <div className="flex items-center gap-2.5 shrink-0">
              <img src="/icon-192.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">WhatsApp Bulk Messenger</h1>
                <p className="text-[11px] text-gray-400">Send bulk messages efficiently</p>
              </div>
            </div>

            {/* Right: all controls */}
            <div className="flex items-center gap-2">

              {/* WhatsApp connection */}
              <div data-tour="step-connect">
                {isWhatsAppConnected ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-green-700">Connected</span>
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleDisconnectWhatsApp}>
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button variant="primary" size="sm" onClick={handleConnectWhatsApp} disabled={connectionStatus === 'connecting'}>
                    <Smartphone className="mr-1.5" size={15} />
                    {connectionStatus === 'connecting' ? 'Connecting…' : 'Connect WhatsApp'}
                  </Button>
                )}
              </div>

              <div className="w-px h-5 bg-gray-200 mx-1" />

              {/* Icon nav buttons */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setShowScheduledJobs(true)}
                  title="Scheduled messages"
                  className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <CalendarClock size={17} />
                </button>
                {user?.subscription?.isActive && (
                  <button
                    onClick={() => navigate('/bot')}
                    title="AI Chatbot"
                    className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <Bot size={17} />
                  </button>
                )}
                <button
                  onClick={() => navigate('/security')}
                  title="Security Settings"
                  className="p-2 rounded-lg text-gray-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Lock size={17} />
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => navigate('/admin')}
                    title="Admin Panel"
                    className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    <Shield size={17} />
                  </button>
                )}
              </div>

              <div className="w-px h-5 bg-gray-200 mx-1" />

              {/* Subscription badge */}
              <button
                onClick={() => navigate('/subscription')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  !user?.subscription?.isActive
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    : user?.subscription?.plan === 'free'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                }`}
              >
                <Crown size={13} />
                <span className="capitalize">
                  {user?.subscription?.plan === 'free' ? 'Trial' : user?.subscription?.plan || 'Free'}
                </span>
                {user?.subscription?.isActive && (
                  user?.subscription?.plan === 'free' ? (
                    <span className={user.subscription.messagesUsed >= user.subscription.messageLimit - 10 ? 'text-red-600 font-semibold' : ''}>
                      · {user.subscription.messagesUsed}/{user.subscription.messageLimit}
                    </span>
                  ) : (
                    <span className={user.subscription.daysLeft <= 3 ? 'text-red-600 font-semibold' : ''}>
                      · {user.subscription.daysLeft}d
                    </span>
                  )
                )}
              </button>

              {/* User avatar + name */}
              <div className="flex items-center gap-2 pl-1">
                <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <User size={14} className="text-primary-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">{user?.name}</span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>

          {/* Mobile: simplified header */}
          <div className="md:hidden">
            {/* Row 1: Logo + WA status + avatar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <img src="/icon-192.png" alt="Logo" className="w-8 h-8 rounded-lg object-contain shrink-0" />
                <h1 className="text-base font-bold text-gray-900 truncate">Bulk Messenger</h1>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* WA status dot */}
                <div
                  data-tour="step-connect"
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border ${
                    isWhatsAppConnected
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${isWhatsAppConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  {isWhatsAppConnected ? 'Connected' : 'Disconnected'}
                </div>
                <button
                  onClick={() => setMobileTab('more')}
                  className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center"
                >
                  <User size={15} className="text-primary-600" />
                </button>
              </div>
            </div>

            {/* Row 2: WhatsApp connect/disconnect */}
            <div className="mt-2 pt-2 border-t border-gray-100" data-tour="step-connect">
              {isWhatsAppConnected ? (
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={handleDisconnectWhatsApp} className="flex-1">
                    Disconnect WhatsApp
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConnectWhatsApp}
                  disabled={connectionStatus === 'connecting'}
                  className="w-full"
                >
                  <Smartphone className="mr-1.5" size={16} />
                  {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect WhatsApp'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Subscription Banners */}
      {user?.subscription && !user.subscription.isActive && (
        <div className="bg-red-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs sm:text-sm font-medium">
              Your subscription has expired. Upgrade now to continue.
            </p>
            <button
              onClick={() => navigate('/subscription')}
              className="px-3 sm:px-4 py-1.5 bg-white text-red-600 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-50 transition-colors shrink-0"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}
      {user?.subscription?.isActive && user.subscription.plan === 'free' && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs sm:text-sm font-medium">
              Free trial — {user.subscription.messageLimit - user.subscription.messagesUsed} of {user.subscription.messageLimit} messages remaining. Upgrade for unlimited access.
            </p>
            <button
              onClick={() => navigate('/subscription')}
              className="px-3 sm:px-4 py-1.5 bg-white text-amber-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-amber-50 transition-colors shrink-0"
            >
              View Plans
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 md:pb-8">

        {/* ── Mobile: More tab ── */}
        {mobileTab === 'more' && (
          <div className="md:hidden space-y-3">
            {/* User card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-4 py-4 flex items-center gap-3 border-b border-gray-100">
                <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <User size={20} className="text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Subscription */}
              <button
                onClick={() => navigate('/subscription')}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 border-b border-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Crown size={18} className="text-amber-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">Subscription</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.subscription?.plan === 'free' ? 'Trial' : user?.subscription?.plan || 'Free'}
                      {user?.subscription?.isActive && user.subscription.plan === 'free'
                        ? ` · ${user.subscription.messagesUsed}/${user.subscription.messageLimit} msgs`
                        : user?.subscription?.isActive
                        ? ` · ${user?.subscription?.daysLeft}d left`
                        : ' · Expired'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>

              {/* Bot */}
              {user?.subscription?.isActive && (
                <button
                  onClick={() => navigate('/bot')}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Bot size={18} className="text-indigo-500" />
                    <p className="text-sm font-medium text-gray-800">AI Chatbot</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              )}

              {/* Security */}
              <button
                onClick={() => navigate('/security')}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 border-b border-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Lock size={18} className="text-slate-500" />
                  <p className="text-sm font-medium text-gray-800">Security</p>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>

              {/* Admin */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-purple-500" />
                    <p className="text-sm font-medium text-gray-800">Admin Panel</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              )}

              {/* Help */}
              <button
                onClick={() => {
                  localStorage.removeItem('bulksend_tour_completed');
                  setShowTour(true);
                  setTimeout(() => setShowTour(false), 100);
                  setMobileTab('send');
                }}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle size={18} className="text-green-500" />
                  <p className="text-sm font-medium text-gray-800">Help & Tour</p>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-medium text-sm hover:bg-red-100 transition-colors"
            >
              <LogOut size={17} />
              Log Out
            </button>
          </div>
        )}

        {/* ── Main workflow (Send tab on mobile, always on desktop) ── */}
        <div className={`${mobileTab !== 'send' ? 'hidden md:block' : ''} space-y-4 sm:space-y-8`}>
          {/* Step 1: Upload Contacts */}
          <section data-tour="step-upload" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-primary-700 font-bold text-sm sm:text-base">1</span>
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-semibold text-gray-900">Upload Contacts</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Upload Excel/CSV or add manually</p>
                </div>
              </div>
              {/* Contact source buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSavedContacts(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <BookUser size={16} />
                  <span className="hidden sm:inline">My Contacts</span>
                </button>
                <button
                  onClick={() => setShowWAContacts(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                  title="Import from WhatsApp"
                >
                  <Users size={16} />
                  <span className="hidden sm:inline">WhatsApp Contacts</span>
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <FileUpload onFileUpload={handleFileUpload} isLoading={isFileUploading} />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-xs text-gray-500 font-medium">OR</span>
                </div>
              </div>
              <ManualContactEntry onAdd={handleManualAdd} />
            </div>
          </section>

          {/* Step 2: Review & Select Contacts */}
          {contacts.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-primary-700 font-bold text-sm sm:text-base">2</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-xl font-semibold text-gray-900">Review & Select</h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={handleClearContacts}>
                  <Trash2 className="sm:mr-2" size={16} />
                  <span className="hidden sm:inline">Clear All</span>
                </Button>
              </div>
              <ContactsTable contacts={contacts} selection={selection} onSelectionChange={setSelection} />
            </section>
          )}

          {/* Step 3: Send Messages */}
          {selectedCount > 0 && (
            <section data-tour="step-compose" className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-primary-700 font-bold text-sm sm:text-base">3</span>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-xl font-semibold text-gray-900">Compose & Send</h2>
                    <p className="text-xs sm:text-sm text-gray-600">Create your message and send to selected contacts</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center p-6 sm:p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-3 sm:mb-4 text-gray-400" size={40} />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Ready to send messages</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                    {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setShowMessageComposer(true)}
                    disabled={!isWhatsAppConnected}
                    data-tour="step-send"
                  >
                    <MessageSquare className="mr-2" size={20} />
                    Compose Message
                  </Button>
                  {!isWhatsAppConnected && (
                    <p className="text-xs sm:text-sm text-red-600 mt-3">Please connect WhatsApp first</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Empty State */}
          {contacts.length === 0 && (
            <div className="text-center py-10 sm:py-16">
              <UploadIcon className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">No contacts uploaded</h3>
              <p className="text-sm text-gray-600">Upload an Excel or CSV file to get started</p>
            </div>
          )}
        </div>{/* end workflow div */}
      </main>

      {/* Modals */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={handleQRModalClose}
        onConnected={() => {
          setIsWhatsAppConnected(true);
          setConnectionStatus('connected');
        }}
        token={token}
      />

      <MessageComposer
        isOpen={showMessageComposer}
        onClose={() => setShowMessageComposer(false)}
        onSend={handleSendMessages}
        selectedCount={selectedCount}
      />

      {currentMessages.length > 0 && (
        <SendProgress
          isOpen={showSendProgress}
          onClose={() => setShowSendProgress(false)}
          onComplete={handleSendComplete}
          contacts={selectedContacts}
          messages={currentMessages}
        />
      )}

      {/* Saved Contacts Drawer */}
      <SavedContactsDrawer
        isOpen={showSavedContacts}
        onClose={handleSavedContactsClose}
        onLoad={handleSavedContactsLoad}
      />

      {/* WhatsApp Contacts Drawer */}
      <WhatsAppContactsDrawer
        isOpen={showWAContacts}
        onClose={() => setShowWAContacts(false)}
        onLoad={handleSavedContactsLoad}
        isWhatsAppConnected={isWhatsAppConnected}
      />

      {/* Scheduled Jobs Drawer */}
      <ScheduledJobsDrawer
        isOpen={showScheduledJobs}
        onClose={handleScheduledJobsClose}
      />

      {/* Schedule success/error toast */}
      {scheduleToast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-2xl">
          <CalendarClock size={16} className="text-blue-400 shrink-0" />
          <span>{scheduleToast}</span>
          <button onClick={() => setScheduleToast('')} className="ml-2 text-gray-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Tour Guide */}
      <TourGuide forceShow={showTour} />

      {/* Help button to replay tour — desktop only */}
      <button
        onClick={() => {
          localStorage.removeItem('bulksend_tour_completed');
          setShowTour(true);
          setTimeout(() => setShowTour(false), 100);
        }}
        title="Show Guide"
        className="hidden md:flex fixed bottom-6 right-6 w-12 h-12 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 hover:shadow-xl items-center justify-center transition-all z-50"
      >
        <HelpCircle size={22} />
      </button>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-stretch h-16">
          {/* Send tab */}
          <button
            onClick={() => setMobileTab('send')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              mobileTab === 'send' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${mobileTab === 'send' ? 'bg-primary-50' : ''}`}>
              <MessageSquare size={20} strokeWidth={mobileTab === 'send' ? 2.5 : 1.8} />
            </div>
            <span className={`text-[10px] font-medium leading-none ${mobileTab === 'send' ? 'text-primary-600' : 'text-gray-400'}`}>Send</span>
          </button>

          {/* Contacts tab */}
          <button
            onClick={() => handleMobileTab('contacts')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              mobileTab === 'contacts' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${mobileTab === 'contacts' ? 'bg-primary-50' : ''}`}>
              <BookUser size={20} strokeWidth={mobileTab === 'contacts' ? 2.5 : 1.8} />
            </div>
            <span className={`text-[10px] font-medium leading-none ${mobileTab === 'contacts' ? 'text-primary-600' : 'text-gray-400'}`}>Contacts</span>
          </button>

          {/* Schedule tab */}
          <button
            onClick={() => handleMobileTab('schedule')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              mobileTab === 'schedule' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${mobileTab === 'schedule' ? 'bg-blue-50' : ''}`}>
              <CalendarClock size={20} strokeWidth={mobileTab === 'schedule' ? 2.5 : 1.8} />
            </div>
            <span className={`text-[10px] font-medium leading-none ${mobileTab === 'schedule' ? 'text-blue-600' : 'text-gray-400'}`}>Schedule</span>
          </button>

          {/* More tab */}
          <button
            onClick={() => setMobileTab(mobileTab === 'more' ? 'send' : 'more')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              mobileTab === 'more' ? 'text-gray-700' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-colors ${mobileTab === 'more' ? 'bg-gray-100' : ''}`}>
              <MoreHorizontal size={20} strokeWidth={mobileTab === 'more' ? 2.5 : 1.8} />
            </div>
            <span className={`text-[10px] font-medium leading-none ${mobileTab === 'more' ? 'text-gray-700' : 'text-gray-400'}`}>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
