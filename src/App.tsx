import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ContactsTable } from '@/components/ContactsTable';
import { MessageComposer } from '@/components/MessageComposer';
import { QRCodeModal } from '@/components/QRCodeModal';
import { SendProgress } from '@/components/SendProgress';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/contexts/AppContext';
import { parseFile } from '@/lib/fileParser';
import { API_ENDPOINTS } from '@/config/api';
import { Message, SendProgress as SendProgressType } from '@/types/message';
import { MessageSquare, Smartphone, Upload as UploadIcon, Trash2 } from 'lucide-react';
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

  const [isFileUploading, setIsFileUploading] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showMessageComposer, setShowMessageComposer] = useState(false);
  const [showSendProgress, setShowSendProgress] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // Check WhatsApp status on mount and periodically
  useEffect(() => {
    checkWhatsAppStatus();

    // Poll status every 5 seconds
    const interval = setInterval(() => {
      checkWhatsAppStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const checkWhatsAppStatus = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.whatsapp.status);
      const result = await response.json();
      const isConnected = result.success && result.data?.isConnected && result.data?.isReady;
      setIsWhatsAppConnected(isConnected);
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      console.log('WhatsApp Status:', result.data);
    } catch (error) {
      console.error('Failed to check WhatsApp status:', error);
      setIsWhatsAppConnected(false);
      setConnectionStatus('disconnected');
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsFileUploading(true);
    try {
      const parsedContacts = await parseFile(file);
      setContacts(parsedContacts);

      // Auto-select valid contacts
      const autoSelection: Record<string, boolean> = {};
      parsedContacts.forEach((contact) => {
        if (contact.isValid) {
          autoSelection[contact.id] = true;
        }
      });
      setSelection(autoSelection);
    } catch (error) {
      console.error('File upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to parse file');
    } finally {
      setIsFileUploading(false);
    }
  };

  const handleConnectWhatsApp = async () => {
    setConnectionStatus('connecting');
    try {
      // Initialize WhatsApp client
      await fetch(API_ENDPOINTS.whatsapp.init, { method: 'POST' });
      setShowQRModal(true);
    } catch (error) {
      console.error('Failed to initialize WhatsApp:', error);
      alert('Failed to connect to WhatsApp');
      setConnectionStatus('disconnected');
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      await fetch(API_ENDPOINTS.whatsapp.disconnect, { method: 'POST' });
      setIsWhatsAppConnected(false);
      setConnectionStatus('disconnected');
    } catch (error) {
      console.error('Failed to disconnect WhatsApp:', error);
    }
  };

  const handleQRModalClose = () => {
    setShowQRModal(false);
    // Wait a bit for backend to fully connect
    setTimeout(() => {
      checkWhatsAppStatus();
    }, 1000);
  };

  const handleSendMessages = (message: Message) => {
    setCurrentMessage(message);
    setShowMessageComposer(false);
    setShowSendProgress(true);
  };

  const handleSendComplete = (progress: SendProgressType) => {
    console.log('Send complete:', progress);
    // Optionally clear selection after sending
    setSelection({});
  };

  const handleClearContacts = () => {
    if (confirm('Are you sure you want to clear all contacts?')) {
      setContacts([]);
      setSelection({});
    }
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
                <h1 className="text-2xl font-bold text-gray-900">
                  WhatsApp Bulk Messenger
                </h1>
                <p className="text-sm text-gray-600">
                  Send bulk messages efficiently
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isWhatsAppConnected ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-green-700">
                      Connected
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDisconnectWhatsApp}
                  >
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Step 1: Upload Contacts */}
          <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-700 font-bold">1</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Upload Contacts
                  </h2>
                  <p className="text-sm text-gray-600">
                    Upload Excel or CSV file with contact information
                  </p>
                </div>
              </div>
            </div>

            <FileUpload
              onFileUpload={handleFileUpload}
              isLoading={isFileUploading}
            />
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
                    <h2 className="text-xl font-semibold text-gray-900">
                      Review & Select Contacts
                    </h2>
                    <p className="text-sm text-gray-600">
                      {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClearContacts}
                >
                  <Trash2 className="mr-2" size={16} />
                  Clear All
                </Button>
              </div>

              <ContactsTable
                contacts={contacts}
                selection={selection}
                onSelectionChange={setSelection}
              />
            </section>
          )}

          {/* Step 3: Send Messages */}
          {selectedCount > 0 && (
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-bold">3</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Compose & Send Messages
                    </h2>
                    <p className="text-sm text-gray-600">
                      Create your message and send to selected contacts
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <MessageSquare className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to send messages
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setShowMessageComposer(true)}
                    disabled={!isWhatsAppConnected}
                  >
                    <MessageSquare className="mr-2" size={20} />
                    Compose Message
                  </Button>
                  {!isWhatsAppConnected && (
                    <p className="text-sm text-red-600 mt-3">
                      Please connect WhatsApp first
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Empty State */}
          {contacts.length === 0 && (
            <div className="text-center py-16">
              <UploadIcon className="mx-auto mb-4 text-gray-400" size={64} />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No contacts uploaded
              </h3>
              <p className="text-gray-600">
                Upload an Excel or CSV file to get started
              </p>
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
    </div>
  );
}

export default App;
