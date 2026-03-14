import { Contact } from './contact';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadResponse {
  contacts: Contact[];
  totalContacts: number;
  validContacts: number;
  invalidContacts: number;
}

export interface WhatsAppStatus {
  isConnected: boolean;
  isReady: boolean;
  qrCode?: string;
  error?: string;
}

export interface SSEMessage {
  type: 'qr' | 'progress' | 'complete' | 'error' | 'authenticated';
  data?: any;
}
