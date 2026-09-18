export interface WhatsAppBusinessAccount {
  id?: string;
  userId?: string;
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber: string;
  verifiedName: string;
  qualityRating: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
  messagingLimitTier: string;
  codeVerification?: string;
  appId?: string;
  configId?: string;
  isConnected: boolean;
  webhookSubscribed: boolean;
  autoReplyEnabled: boolean;
  humanAgentPhone?: string;
  systemPrompt?: string;
  aiProvider?: string;
  aiModel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phoneNumber?: string;
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
  text?: string;
  buttons?: TemplateButton[];
  example?: Record<string, any>;
}

export interface WhatsAppBusinessTemplate {
  id?: string;
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED';
  components: TemplateComponent[];
}

export interface WhatsAppBusinessMessage {
  id: string;
  wamid: string;
  direction: 'outbound' | 'inbound';
  fromPhone: string;
  toPhone: string;
  messageType: string;
  body: string;
  templateName?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  errorMessage?: string;
  timestamp: string;
}
