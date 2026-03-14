export interface Message {
  text: string;
  link?: string;
  imageUrl?: string;
  imageFile?: File;
  imagePath?: string; // Path to uploaded image on server
}

export interface MessageTask {
  id: string;
  contact: {
    id: string;
    phone: string;
    name?: string;
  };
  message: Message;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  error?: string;
  attempts: number;
  timestamp?: number;
}

export interface SendProgress {
  total: number;
  sent: number;
  failed: number;
  current?: string;
  errors: Array<{
    contactId: string;
    phone: string;
    error: string;
  }>;
}
