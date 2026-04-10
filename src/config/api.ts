// API Base URL Configuration
// - Development: Uses VITE_BACKEND_URL or localhost
// - Production: Uses relative URLs (proxied through Vercel serverless function)
const isDevelopment = import.meta.env.DEV;

export const API_BASE_URL = isDevelopment
  ? (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000')
  : ''; // Production uses relative URLs -> Vercel proxy -> backend

export const API_ENDPOINTS = {
  whatsapp: {
    init: `${API_BASE_URL}/api/whatsapp/init`,
    qr: `${API_BASE_URL}/api/whatsapp/qr`,
    status: `${API_BASE_URL}/api/whatsapp/status`,
    disconnect: `${API_BASE_URL}/api/whatsapp/disconnect`,
    send: `${API_BASE_URL}/api/whatsapp/send`,
  },
  upload: {
    contacts: `${API_BASE_URL}/api/upload`,
    image: `${API_BASE_URL}/api/upload/image`,
  },
  auth: {
    register: `${API_BASE_URL}/api/auth/register`,
    login: `${API_BASE_URL}/api/auth/login`,
    me: `${API_BASE_URL}/api/auth/me`,
  },
  templates: {
    list: `${API_BASE_URL}/api/templates`,
    create: `${API_BASE_URL}/api/templates`,
    update: (id: number) => `${API_BASE_URL}/api/templates/${id}`,
    delete: (id: number) => `${API_BASE_URL}/api/templates/${id}`,
  },
  subscription: {
    status: `${API_BASE_URL}/api/subscription`,
    initiate: `${API_BASE_URL}/api/payment/initiate`,
    history: `${API_BASE_URL}/api/payment/history`,
  },
  health: `${API_BASE_URL}/api/health`,
};

/**
 * Fetch wrapper that automatically attaches the Authorization header
 * from localStorage. Does not force Content-Type on FormData requests.
 */
export const apiFetch = (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Only set JSON content-type when body is not FormData
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, { ...options, headers });
};
