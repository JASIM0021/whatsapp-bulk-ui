import { NexbotBooking, NexbotInlineOptions, NexbotPopupOptions, NexbotButtonOptions } from './types';

export class NexbotCalendarSDK {
  private static instance: NexbotCalendarSDK;
  private defaultHost: string;
  private listeners: Record<string, ((data: any) => void)[]> = {};

  constructor(defaultHost?: string) {
    this.defaultHost = defaultHost || (typeof window !== 'undefined' ? window.location.origin : 'https://nexbotix.online');
    this.setupMessageListener();
  }

  public static getInstance(defaultHost?: string): NexbotCalendarSDK {
    if (!NexbotCalendarSDK.instance) {
      NexbotCalendarSDK.instance = new NexbotCalendarSDK(defaultHost);
    }
    return NexbotCalendarSDK.instance;
  }

  /**
   * Register event listener ('booking-completed', 'modal-opened', 'modal-closed')
   */
  public on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);

    // Return unregister function
    return () => {
      this.listeners[event] = this.listeners[event].filter((fn) => fn !== callback);
    };
  }

  /**
   * Emit internal & browser custom event
   */
  public emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.error('[NexbotCalendar] Listener error:', e);
        }
      });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexbot:' + event, { detail: data }));
    }
  }

  private setupMessageListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('message', (e: MessageEvent) => {
      if (e.data && typeof e.data === 'object' && typeof e.data.type === 'string') {
        if (e.data.type.startsWith('nexbot:')) {
          const eventName = e.data.type.replace('nexbot:', '');
          this.emit(eventName, e.data.payload);
        }
      }
    });
  }

  /**
   * Initializes an inline iframe calendar inside any DOM element
   */
  public initInline(options: NexbotInlineOptions): HTMLIFrameElement | null {
    if (typeof document === 'undefined') return null;

    const container = typeof options.element === 'string'
      ? document.querySelector(options.element)
      : options.element;

    if (!container) {
      console.error('[NexbotCalendar] Container element not found for inline embed');
      return null;
    }

    const host = (options.host || this.defaultHost).replace(/\/+$/, '');
    const eventSlug = options.event || 'meeting';
    const url = `${host}/embed/${encodeURIComponent(options.user)}/${encodeURIComponent(eventSlug)}`;

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = options.width || '100%';
    iframe.style.height = options.height || '720px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = options.borderRadius || '16px';
    iframe.style.boxShadow = options.boxShadow || '0 4px 25px rgba(0,0,0,0.06)';
    iframe.setAttribute('allow', 'camera; microphone; fullscreen');
    if (options.className) iframe.className = options.className;

    container.innerHTML = '';
    container.appendChild(iframe);
    return iframe;
  }

  /**
   * Opens a responsive booking popup modal
   */
  public openPopup(options: NexbotPopupOptions): void {
    if (typeof document === 'undefined') return;

    const existing = document.getElementById('nexbot-calendar-modal');
    if (existing) existing.remove();

    const host = (options.host || this.defaultHost).replace(/\/+$/, '');
    const eventSlug = options.event || 'meeting';
    const url = `${host}/embed/${encodeURIComponent(options.user)}/${encodeURIComponent(eventSlug)}`;

    const overlay = document.createElement('div');
    overlay.id = 'nexbot-calendar-modal';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      opacity: 0;
      transition: opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: relative;
      width: 100%;
      max-width: 960px;
      height: 85vh;
      max-height: 760px;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      transform: scale(0.95);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close booking modal');
    closeBtn.style.cssText = `
      position: absolute;
      top: 14px;
      right: 16px;
      z-index: 10;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.08);
      border: none;
      font-size: 26px;
      line-height: 1;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #374151;
      transition: background 0.15s;
    `;
    closeBtn.onmouseenter = () => { closeBtn.style.background = 'rgba(0,0,0,0.15)'; };
    closeBtn.onmouseleave = () => { closeBtn.style.background = 'rgba(0,0,0,0.08)'; };

    const handleClose = () => {
      overlay.style.opacity = '0';
      wrapper.style.transform = 'scale(0.95)';
      setTimeout(() => {
        overlay.remove();
        if (options.onModalClose) options.onModalClose();
        this.emit('modal-closed', {});
      }, 250);
    };

    closeBtn.onclick = handleClose;
    overlay.onclick = (e) => {
      if (e.target === overlay) handleClose();
    };

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
    iframe.setAttribute('allow', 'camera; microphone; fullscreen');

    wrapper.appendChild(closeBtn);
    wrapper.appendChild(iframe);
    overlay.appendChild(wrapper);
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.style.opacity = '1';
      wrapper.style.transform = 'scale(1)';
      if (options.onModalOpen) options.onModalOpen();
      this.emit('modal-opened', { user: options.user, event: eventSlug });
    }, 10);

    if (options.onBookingComplete) {
      const unsub = this.on('booking-completed', (booking: NexbotBooking) => {
        options.onBookingComplete!(booking);
        unsub();
      });
    }
  }

  /**
   * Injects a floating action button on the webpage
   */
  public initButton(options: NexbotButtonOptions): HTMLButtonElement | null {
    if (typeof document === 'undefined') return null;

    const existing = document.getElementById('nexbot-calendar-floating-btn');
    if (existing) existing.remove();

    const btn = document.createElement('button');
    btn.id = 'nexbot-calendar-floating-btn';
    btn.innerText = options.text || 'Schedule Meeting';
    
    const isLeft = options.position === 'bottom-left';
    btn.style.cssText = `
      position: fixed;
      bottom: 24px;
      ${isLeft ? 'left: 24px;' : 'right: 24px;'}
      z-index: 99999;
      padding: 14px 24px;
      background: ${options.color || '#10B981'};
      color: #ffffff;
      font-weight: 700;
      font-size: 15px;
      border-radius: 9999px;
      border: none;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18);
      cursor: pointer;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    `;

    btn.onmouseenter = () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 16px 32px rgba(0, 0, 0, 0.25)';
    };
    btn.onmouseleave = () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.18)';
    };

    btn.onclick = () => {
      this.openPopup(options);
    };

    document.body.appendChild(btn);
    return btn;
  }
}

export const NexbotCalendar = NexbotCalendarSDK.getInstance();
