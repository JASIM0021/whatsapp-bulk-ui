import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Upload, Smartphone, MessageSquare, Send } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="step-connect"]',
    title: 'Step 1: Connect WhatsApp',
    description: 'First, click "Connect WhatsApp" to link your WhatsApp account. You\'ll scan a QR code with your phone — just like WhatsApp Web. Your session stays active even after you close the browser.',
    icon: <Smartphone size={20} />,
  },
  {
    target: '[data-tour="step-upload"]',
    title: 'Step 2: Upload Contacts',
    description: 'Upload an Excel (.xlsx) or CSV file with your contacts. Need the right format? Click "Download Sample Template" to get a ready-made file you can fill in with Name and Phone columns.',
    icon: <Upload size={20} />,
  },
  {
    target: '[data-tour="step-compose"]',
    title: 'Step 3: Compose Message',
    description: 'Once contacts are uploaded and WhatsApp is connected, click "Compose Message". You can use templates, add images, links, and personalize with {{name}} for each contact.',
    icon: <MessageSquare size={20} />,
  },
  {
    target: '[data-tour="step-send"]',
    title: 'Step 4: Send & Track',
    description: 'Hit send and watch real-time progress. Messages are sent with smart delays (3-5 seconds) to keep your account safe. You\'ll see exactly which messages succeeded or failed.',
    icon: <Send size={20} />,
  },
];

const TOUR_STORAGE_KEY = 'bulksend_tour_completed';

interface TourGuideProps {
  forceShow?: boolean;
}

export function TourGuide({ forceShow }: TourGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      setCurrentStep(0);
      return;
    }
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const measure = useCallback(() => {
    if (!isVisible) return;
    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(step.target);

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // Small delay after scroll to get correct position
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect(r);

        // Position tooltip
        const tooltipW = 380;
        const tooltipH = tooltipRef.current?.offsetHeight || 220;
        const gap = 16;

        let top = r.bottom + gap;
        let left = r.left;

        // If tooltip goes below viewport, place it above the element
        if (top + tooltipH > window.innerHeight - 16) {
          top = r.top - tooltipH - gap;
        }

        // If still off-screen (element is tall), just center vertically
        if (top < 16) {
          top = Math.max(16, r.top + r.height / 2 - tooltipH / 2);
        }

        // Clamp left so tooltip doesn't overflow horizontally
        left = Math.max(16, Math.min(left, window.innerWidth - tooltipW - 16));

        setTooltipPos({ top, left });
      });
    } else {
      setRect(null);
      setTooltipPos({
        top: window.innerHeight / 2 - 110,
        left: window.innerWidth / 2 - 190,
      });
    }
  }, [currentStep, isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    measure();
    // Re-measure after scroll settles
    const t = setTimeout(measure, 400);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [isVisible, currentStep, measure]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  // Spotlight cutout dimensions
  const pad = 10;
  const cx = rect ? rect.left - pad : 0;
  const cy = rect ? rect.top - pad : 0;
  const cw = rect ? rect.width + pad * 2 : 0;
  const ch = rect ? rect.height + pad * 2 : 0;

  return (
    <>
      {/* Backdrop with cutout — use box-shadow trick instead of SVG for reliability */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={handleClose}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Cutout (transparent hole) using a positioned div with massive box-shadow */}
        {rect && (
          <div
            className="absolute rounded-xl"
            style={{
              top: cy,
              left: cx,
              width: cw,
              height: ch,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
              background: 'transparent',
              zIndex: 1,
              transition: 'all 0.3s ease',
            }}
          />
        )}
      </div>

      {/* Highlight ring */}
      {rect && (
        <div
          className="fixed z-[9999] pointer-events-none rounded-xl ring-2 ring-green-400 ring-offset-4 ring-offset-transparent"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            transition: 'all 0.3s ease',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10000] w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          transition: 'top 0.3s ease, left 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white">
              {step.icon}
            </div>
            <h3 className="text-white font-bold text-sm">{step.title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep ? 'bg-green-500' : i < currentStep ? 'bg-green-300' : 'bg-gray-200'
                }`}
              />
            ))}
            <span className="text-xs text-gray-400 ml-2">{currentStep + 1}/{TOUR_STEPS.length}</span>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={14} />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              {isLast ? 'Got it!' : 'Next'}
              {!isLast && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
