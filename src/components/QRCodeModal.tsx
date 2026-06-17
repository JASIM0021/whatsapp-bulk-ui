import { useEffect, useState, useRef, useCallback } from 'react';
import { CheckCircle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { PhoneTab } from '@/components/whatsapp/PhoneTab';
import { SSE_BASE_URL } from '@/config/api';

type ConnectTab = 'phone' | 'qr';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
  token?: string | null;
}

export function QRCodeModal({ isOpen, onClose, onConnected, token }: QRCodeModalProps) {
  const [activeTab, setActiveTab] = useState<ConnectTab>('phone');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCloseRef = useRef(onClose);
  const onConnectedRef = useRef(onConnected);

  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => { onConnectedRef.current = onConnected; });

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const qrUrl = token
      ? `${SSE_BASE_URL}/api/whatsapp/qr?token=${token}`
      : `${SSE_BASE_URL}/api/whatsapp/qr`;
    const eventSource = new EventSource(qrUrl);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'qr') {
          setQrCode(data.data);
          setIsAuthenticated(false);
          setIsReady(false);
          setRetryCount(0);
        } else if (data.type === 'authenticated') {
          setIsAuthenticated(true);
        } else if (data.type === 'ready') {
          setIsReady(true);
          if (onConnectedRef.current) onConnectedRef.current();
          setTimeout(() => {
            eventSource.close();
            onCloseRef.current();
          }, 2000);
        } else if (data.type === 'timeout') {
          eventSource.close();
          setQrCode(null);
          retryTimerRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        }
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setRetryCount(prev => {
        if (prev < 5) {
          retryTimerRef.current = setTimeout(() => {
            setRetryCount(c => c + 1);
          }, 3000);
        }
        return prev;
      });
    };
  }, [token]);

  // QR tab: connect SSE when open and on QR tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'qr') {
      setQrCode(null);
      setIsAuthenticated(false);
      setIsReady(false);
      setRetryCount(0);
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      return;
    }
    connectSSE();
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [isOpen, activeTab, connectSSE, retryCount]);

  // Reset to phone tab when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('phone');
    }
  }, [isOpen]);

  const handleConnected = () => {
    if (onConnected) onConnected();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect WhatsApp" maxWidth="md">
      <div className="space-y-5">
        {/* Tab toggle */}
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => setActiveTab('phone')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'phone'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Phone Number
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'qr'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            QR Code
          </button>
        </div>

        {/* Phone tab */}
        {activeTab === 'phone' && (
          <PhoneTab onConnected={handleConnected} token={token} />
        )}

        {/* QR tab */}
        {activeTab === 'qr' && (
          <>
            {!isReady ? (
              <>
                <div className="text-center">
                  <p className="text-gray-700 mb-4">
                    Scan the QR code with your WhatsApp mobile app
                  </p>
                  <ol className="text-sm text-gray-600 text-left space-y-2 mb-6">
                    <li>1. Open WhatsApp on your phone</li>
                    <li>2. Tap Menu or Settings and select Linked Devices</li>
                    <li>3. Tap Link a Device</li>
                    <li>4. Point your phone at this screen to scan the QR code</li>
                  </ol>
                </div>

                <div className="flex justify-center">
                  {qrCode ? (
                    <div className="relative">
                      <img
                        src={qrCode}
                        alt="QR Code"
                        className="w-64 h-64 border-4 border-gray-200 rounded-lg"
                      />
                      {isAuthenticated && (
                        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
                          <div className="text-center">
                            <CheckCircle className="text-green-500 mx-auto mb-2" size={48} />
                            <p className="text-green-700 font-medium">Authenticated!</p>
                            <p className="text-sm text-gray-600">Connecting...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-64 h-64 border-4 border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
                        <p className="text-gray-600">Generating QR code...</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Connected Successfully!
                </h3>
                <p className="text-gray-600">
                  Your WhatsApp is now connected and ready to send messages.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
