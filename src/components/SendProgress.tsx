import { useEffect, useState, useRef } from 'react';
import { Modal } from './ui/Modal';
import { ProgressBar } from './ui/ProgressBar';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { SendProgress as SendProgressType } from '@/types/message';
import { Button } from './ui/Button';
import { API_ENDPOINTS } from '@/config/api';

interface SendProgressProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (progress: SendProgressType) => void;
  contacts: any[];
  message: any;
}

export function SendProgress({
  isOpen,
  onClose,
  onComplete,
  contacts,
  message,
}: SendProgressProps) {
  const [progress, setProgress] = useState<SendProgressType>({
    total: contacts.length,
    sent: 0,
    failed: 0,
    errors: [],
  });
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to prevent duplicate sends (React StrictMode issue)
  const hasSentRef = useRef(false);
  const currentRequestRef = useRef<string>('');

  useEffect(() => {
    if (!isOpen || contacts.length === 0) {
      return;
    }

    // Create a unique request ID
    const requestId = `${Date.now()}-${contacts.length}`;

    // If this request has already been made, skip it
    if (hasSentRef.current && currentRequestRef.current === requestId) {
      console.log('Skipping duplicate send request');
      return;
    }

    // Mark as sent
    hasSentRef.current = true;
    currentRequestRef.current = requestId;

    // Reset state
    setProgress({
      total: contacts.length,
      sent: 0,
      failed: 0,
      errors: [],
    });
    setIsComplete(false);
    setError(null);

    console.log('Starting message send (Request ID:', requestId, ')');

    // Start sending
    fetch(API_ENDPOINTS.whatsapp.send, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contacts, message }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to start sending messages');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        function readStream(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) {
              return;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';

            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.type === 'progress') {
                    setProgress({
                      ...data.data,
                      errors: data.data.errors || []
                    });
                  } else if (data.type === 'complete') {
                    setProgress({
                      ...data.data,
                      errors: data.data.errors || []
                    });
                    setIsComplete(true);
                    onComplete(data.data);
                  } else if (data.type === 'error') {
                    setError(data.data.error);
                    setIsComplete(true);
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            });

            return readStream();
          });
        }

        return readStream();
      })
      .catch((err) => {
        console.error('Send error:', err);
        setError(err.message || 'Failed to send messages');
        setIsComplete(true);
      });

    // Cleanup function
    return () => {
      // Reset the flag when modal closes
      if (!isOpen) {
        hasSentRef.current = false;
        currentRequestRef.current = '';
      }
    };
  }, [isOpen, contacts, message, onComplete]);

  const handleClose = () => {
    if (isComplete) {
      // Reset the send flag when closing
      hasSentRef.current = false;
      currentRequestRef.current = '';
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Sending Messages"
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Progress bar */}
        <ProgressBar
          current={progress.sent + progress.failed}
          total={progress.total}
          label="Overall Progress"
        />

        {/* Current status */}
        {!isComplete && progress.current && (
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader className="animate-spin text-blue-600" size={24} />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Sending to: {progress.current}
              </p>
              <p className="text-xs text-blue-700">
                Please wait... Messages are being sent with delays
              </p>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <CheckCircle className="text-green-600 mx-auto mb-2" size={32} />
            <p className="text-2xl font-bold text-green-900">{progress.sent}</p>
            <p className="text-sm text-green-700">Sent</p>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <XCircle className="text-red-600 mx-auto mb-2" size={32} />
            <p className="text-2xl font-bold text-red-900">{progress.failed}</p>
            <p className="text-sm text-red-700">Failed</p>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <Loader className="text-gray-600 mx-auto mb-2" size={32} />
            <p className="text-2xl font-bold text-gray-900">
              {progress.total - progress.sent - progress.failed}
            </p>
            <p className="text-sm text-gray-700">Remaining</p>
          </div>
        </div>

        {/* Errors */}
        {progress.errors && progress.errors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Failed Messages ({progress.errors.length}):
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {progress.errors.map((err, index) => (
                <div
                  key={index}
                  className="p-3 bg-red-50 border border-red-200 rounded text-sm"
                >
                  <p className="font-medium text-red-900">{err.phone}</p>
                  <p className="text-red-700 text-xs">{err.error}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-900">Error:</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Complete message */}
        {isComplete && !error && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <CheckCircle className="text-green-600 mx-auto mb-2" size={48} />
            <h3 className="text-lg font-semibold text-green-900 mb-1">
              Messages Sent!
            </h3>
            <p className="text-sm text-green-700">
              Successfully sent {progress.sent} out of {progress.total} messages
            </p>
          </div>
        )}

        {/* Actions */}
        {isComplete && (
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
