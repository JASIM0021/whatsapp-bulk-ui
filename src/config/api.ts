// API Base URL Configuration
// - Development: Uses VITE_BACKEND_URL or localhost
// - Production: Uses relative URLs (proxied through Vercel serverless function)
//               This avoids HTTPS -> HTTP mixed content issues
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
  health: `${API_BASE_URL}/api/health`,
};
