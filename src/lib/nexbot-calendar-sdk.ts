/**
 * Nexbot Calendar Frontend Client SDK
 * Enables easy integration with JavaScript, TypeScript, React, and Next.js.
 */

export interface NexbotInlineOptions {
  element: string | HTMLElement;
  user: string;
  event: string;
  host?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
}

export interface NexbotPopupOptions {
  user: string;
  event: string;
  host?: string;
  text?: string;
  color?: string;
  onBookingComplete?: (booking: any) => void;
  onModalOpen?: () => void;
  onModalClose?: () => void;
}

export class NexbotCalendarSDK {
  private static instance: NexbotCalendarSDK;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  }

  public static getInstance(baseUrl?: string): NexbotCalendarSDK {
    if (!NexbotCalendarSDK.instance) {
      NexbotCalendarSDK.instance = new NexbotCalendarSDK(baseUrl);
    }
    return NexbotCalendarSDK.instance;
  }

  /**
   * Embeds an inline iframe inside a DOM container
   */
  public initInline(options: NexbotInlineOptions): HTMLIFrameElement | null {
    const container = typeof options.element === 'string'
      ? document.querySelector(options.element)
      : options.element;

    if (!container) {
      console.error('[NexbotCalendar] Target container element not found');
      return null;
    }

    const host = options.host || this.baseUrl;
    const url = `${host}/embed/${encodeURIComponent(options.user)}/${encodeURIComponent(options.event)}`;

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.width = options.width || '100%';
    iframe.style.height = options.height || '700px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = options.borderRadius || '12px';
    iframe.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)';
    iframe.setAttribute('allow', 'camera; microphone; fullscreen');

    container.innerHTML = '';
    container.appendChild(iframe);
    return iframe;
  }

  /**
   * Opens the responsive modal dialog popup
   */
  public openPopup(options: NexbotPopupOptions): void {
    const existing = document.getElementById('nexbot-calendar-modal');
    if (existing) existing.remove();

    const host = options.host || this.baseUrl;
    const url = `${host}/embed/${encodeURIComponent(options.user)}/${encodeURIComponent(options.event)}`;

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
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      transform: scale(0.95);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      position: absolute;
      top: 12px;
      right: 14px;
      z-index: 10;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.08);
      border: none;
      font-size: 24px;
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

    // Trigger animate in
    setTimeout(() => {
      overlay.style.opacity = '1';
      wrapper.style.transform = 'scale(1)';
      if (options.onModalOpen) options.onModalOpen();
    }, 10);

    // Message listener
    const messageHandler = (e: MessageEvent) => {
      if (e.data && e.data.type === 'nexbot:booking-completed') {
        if (options.onBookingComplete) {
          options.onBookingComplete(e.data.payload);
        }
      }
    };
    window.addEventListener('message', messageHandler);
  }
}
