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
import { MessageSquare, Smartphone, Upload as UploadIcon, Trash2, LogOut, User, HelpCircle, Crown, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TourGuide } from '@/components/TourGuide';
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
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [showTour, setShowTour] = useState(false);

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
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to parse file');
    } finally {
      setIsFileUploading(false);
    }
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

  const handleSendMessages = (message: Message) => {
    setCurrentMessage(message);
    setShowMessageComposer(false);
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

  const selectedContacts = contacts.filter((c) => selection[c.id]);
  const selectedCount = selectedContacts.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-green-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">WhatsApp Bulk Messenger</h1>
                <p className="text-sm text-gray-600">Send bulk messages efficiently</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div data-tour="step-connect">
                {isWhatsAppConnected ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-green-700">Connected</span>
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleDisconnectWhatsApp}>
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleConnectWhatsApp}
                    disabled={connectionStatus === 'connecting'}
                  >
                    <Smartphone className="mr-2" size={20} />
                    {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect WhatsApp'}
                  </Button>
                )}
              </div>

              {/* Subscription + User info + logout */}
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <button
                  onClick={() => navigate('/subscription')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    !user?.subscription?.isActive
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : user?.subscription?.plan === 'free'
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  <Crown size={14} />
                  <span className="capitalize">
                    {user?.subscription?.plan === 'free' ? 'Trial' : user?.subscription?.plan || 'free'}
                  </span>
                  {user?.subscription?.isActive && (
                    <span className={user.subscription.daysLeft <= 3 ? 'text-red-600' : ''}>
                      ({user.subscription.daysLeft}d left)
                    </span>
                  )}
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                  >
                    <Shield size={14} />
                    Admin
                  </button>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <User size={16} className="text-gray-400" />
                  <span className="font-medium">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Subscription Banners */}
      {user?.subscription && !user.subscription.isActive && (
        <div className="bg-red-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <p className="text-sm font-medium">
              Your subscription has expired. Upgrade now to continue sending messages.
            </p>
            <button
              onClick={() => navigate('/subscription')}
              className="px-4 py-1.5 bg-white text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors shrink-0"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}
      {user?.subscription?.isActive && user.subscription.plan === 'free' && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
            <p className="text-sm font-medium">
              Free trial — {user.subscription.daysLeft} day{user.subscription.daysLeft !== 1 ? 's' : ''} remaining. Upgrade for unlimited access.
            </p>
            <button
              onClick={() => navigate('/subscription')}
              className="px-4 py-1.5 bg-white text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors shrink-0"
            >
              View Plans
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Step 1: Upload Contacts */}
          <section data-tour="step-upload" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-bold">1</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Upload Contacts</h2>
                  <p className="text-sm text-gray-600">Upload Excel or CSV file with contact information</p>
                </div>
              </div>
            </div>
            <FileUpload onFileUpload={handleFileUpload} isLoading={isFileUploading} />
          </section>

          {/* Step 2: Review & Select Contacts */}
          {contacts.length > 0 && (
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-bold">2</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Review & Select Contacts</h2>
                    <p className="text-sm text-gray-600">
                      {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={handleClearContacts}>
                  <Trash2 className="mr-2" size={16} />
                  Clear All
                </Button>
              </div>
              <ContactsTable contacts={contacts} selection={selection} onSelectionChange={setSelection} />
            </section>
          )}

          {/* Step 3: Send Messages */}
          {selectedCount > 0 && (
            <section data-tour="step-compose" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-bold">3</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Compose & Send Messages</h2>
                    <p className="text-sm text-gray-600">Create your message and send to selected contacts</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to send messages</h3>
                  <p className="text-sm text-gray-600 mb-6">
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
                    <p className="text-sm text-red-600 mt-3">Please connect WhatsApp first</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Empty State */}
          {contacts.length === 0 && (
            <div className="text-center py-16">
              <UploadIcon className="mx-auto mb-4 text-gray-400" size={64} />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No contacts uploaded</h3>
              <p className="text-gray-600">Upload an Excel or CSV file to get started</p>
            </div>
          )}
        </div>
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

      {currentMessage && (
        <SendProgress
          isOpen={showSendProgress}
          onClose={() => setShowSendProgress(false)}
          onComplete={handleSendComplete}
          contacts={selectedContacts}
          message={currentMessage}
        />
      )}

      {/* Tour Guide */}
      <TourGuide forceShow={showTour} />

      {/* Help button to replay tour */}
      <button
        onClick={() => {
          localStorage.removeItem('bulksend_tour_completed');
          setShowTour(true);
          setTimeout(() => setShowTour(false), 100);
        }}
        title="Show Guide"
        className="fixed bottom-6 right-6 w-12 h-12 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 hover:shadow-xl flex items-center justify-center transition-all z-50"
      >
        <HelpCircle size={22} />
      </button>
    </div>
  );
}

export default App;
