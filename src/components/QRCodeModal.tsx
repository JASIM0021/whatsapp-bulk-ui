import { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
  token?: string | null;
}

export function QRCodeModal({ isOpen, onClose, onConnected, token }: QRCodeModalProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQrCode(null);
      setIsAuthenticated(false);
      setIsReady(false);
      return;
    }

    // Connect to SSE endpoint for QR code with token in query param
    const qrUrl = token 
      ? `${API_BASE_URL}/api/whatsapp/qr?token=${token}`
      : `${API_BASE_URL}/api/whatsapp/qr`;
    const eventSource = new EventSource(qrUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'qr') {
          setQrCode(data.data);
          setIsAuthenticated(false);
          setIsReady(false);
        } else if (data.type === 'authenticated') {
          setIsAuthenticated(true);
        } else if (data.type === 'ready') {
          setIsReady(true);
          if (onConnected) {
            onConnected();
          }
          setTimeout(() => {
            eventSource.close();
            onClose();
          }, 2000);
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [isOpen, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect WhatsApp" maxWidth="md">
      <div className="space-y-6">
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
      </div>
    </Modal>
  );
}
