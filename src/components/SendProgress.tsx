import { useEffect, useState, useRef } from 'react';
import { Modal } from './ui/Modal';
import { ProgressBar } from './ui/ProgressBar';
import { CheckCircle, XCircle, Loader, Layers, Mail } from 'lucide-react';
import { SendProgress as SendProgressType } from '@/types/message';
import { Button } from './ui/Button';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

interface SendProgressProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (progress: SendProgressType) => void;
  onWorkInBackground?: (jobId: string) => void;
  contacts: any[];
  messages: any[];
}

export function SendProgress({
  isOpen,
  onClose,
  onComplete,
  onWorkInBackground,
  contacts,
  messages,
}: SendProgressProps) {
  const [progress, setProgress] = useState<SendProgressType>({
    total: contacts.length,
    sent: 0,
    failed: 0,
    errors: [],
  });
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bgMode, setBgMode] = useState<null | 'loading' | 'active'>(null);

  const hasSentRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen || contacts.length === 0) return;

    if (hasSentRef.current) {
      console.log('Skipping duplicate send request');
      return;
    }
    hasSentRef.current = true;

    setProgress({ total: contacts.length, sent: 0, failed: 0, errors: [] });
    setIsComplete(false);
    setError(null);
    setBgMode(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    apiFetch(API_ENDPOINTS.whatsapp.send, {
      method: 'POST',
      body: JSON.stringify({ contacts, messages }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to start sending messages');
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');
        const decoder = new TextDecoder();
        let buffer = '';

        function readStream(): Promise<void> {
          return reader!.read().then(({ done, value }) => {
            if (done) return;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            lines.forEach((line) => {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'progress') {
                    setProgress({ ...data.data, errors: data.data.errors || [] });
                  } else if (data.type === 'complete') {
                    setProgress({ ...data.data, errors: data.data.errors || [] });
                    setIsComplete(true);
                    onComplete(data.data);
                  } else if (data.type === 'error') {
                    setError(typeof data.data === 'string' ? data.data : data.data?.error || 'Unknown error');
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
        if (err.name === 'AbortError') return;
        console.error('Send error:', err);
        setError(err.message || 'Failed to send messages');
        setIsComplete(true);
      });

    return () => {
      if (!isOpen) hasSentRef.current = false;
    };
  }, [isOpen, contacts, messages, onComplete]);

  const handleClose = () => {
    if (isComplete || bgMode === 'active') {
      hasSentRef.current = false;
      onClose();
    }
  };

  const handleWorkInBackground = async () => {
    setBgMode('loading');
    try {
      const res = await apiFetch(API_ENDPOINTS.whatsapp.sendBg, {
        method: 'POST',
        body: JSON.stringify({ contacts, messages }),
      });
      const json = await res.json();
      if (json.success && json.data?.jobId) {
        // Abort the SSE stream now that background job has started
        abortControllerRef.current?.abort();
        setBgMode('active');
        onWorkInBackground?.(json.data.jobId);
        setTimeout(() => {
          hasSentRef.current = false;
          onClose();
        }, 3000);
      } else {
        setBgMode(null);
        setError(json.error || 'Failed to move to background');
      }
    } catch {
      setBgMode(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Sending Messages"
      maxWidth="xl"
    >
      {bgMode === 'active' ? (
        /* Background confirmation screen */
        <div className="py-8 flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="text-blue-600" size={30} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sending in the Background!
            </h3>
            <p className="text-sm text-gray-600 max-w-xs mx-auto">
              No worries — we'll send you an email once all messages are delivered.
              Track progress or stop anytime from the panel at the bottom-right.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg">
            <Loader className="animate-spin shrink-0" size={13} />
            <span>Closing automatically…</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress bar */}
          <ProgressBar
            current={progress.sent + progress.failed}
            total={progress.total}
            label="Overall Progress"
          />

          {/* Current contact indicator */}
          {!isComplete && progress.current && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader className="animate-spin text-blue-600 shrink-0" size={22} />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Sending to: {progress.current?.name || progress.current?.phone}
                </p>
                <p className="text-xs text-blue-700">Please wait… Messages are being sent with delays</p>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <CheckCircle className="text-green-600 mx-auto mb-1 sm:mb-2" size={24} />
              <p className="text-xl sm:text-2xl font-bold text-green-900">{progress.sent}</p>
              <p className="text-xs sm:text-sm text-green-700">Sent</p>
            </div>
            <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <XCircle className="text-red-600 mx-auto mb-1 sm:mb-2" size={24} />
              <p className="text-xl sm:text-2xl font-bold text-red-900">{progress.failed}</p>
              <p className="text-xs sm:text-sm text-red-700">Failed</p>
            </div>
            <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <Loader className="text-gray-600 mx-auto mb-1 sm:mb-2" size={24} />
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {progress.total - progress.sent - progress.failed}
              </p>
              <p className="text-xs sm:text-sm text-gray-700">Remaining</p>
            </div>
          </div>

          {/* Failed message list */}
          {progress.errors && progress.errors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Failed Messages ({progress.errors.length}):
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {progress.errors.map((err, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                    <p className="font-medium text-red-900">{err}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900">Error:</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Completion state */}
          {isComplete && !error && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <CheckCircle className="text-green-600 mx-auto mb-2" size={48} />
              <h3 className="text-lg font-semibold text-green-900 mb-1">Messages Sent!</h3>
              <p className="text-sm text-green-700">
                Successfully sent {progress.sent} out of {progress.total} messages
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Work in Background — only while sending is active */}
            {!isComplete && !error && (
              <Button
                variant="secondary"
                onClick={handleWorkInBackground}
                disabled={bgMode === 'loading'}
                className="flex items-center gap-2"
              >
                {bgMode === 'loading' ? (
                  <Loader className="animate-spin shrink-0" size={15} />
                ) : (
                  <Layers size={15} className="shrink-0" />
                )}
                {bgMode === 'loading' ? 'Moving to background…' : 'Work in Background'}
              </Button>
            )}

            {isComplete && (
              <Button variant="primary" onClick={handleClose} className="ml-auto">
                Close
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
