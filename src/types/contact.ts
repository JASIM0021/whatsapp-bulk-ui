export interface Contact {
  id: string;
  name?: string;
  phone: string;
  formattedPhone: string;
  isValid: boolean;
  validationError?: string;
  row?: number;
  /** Extra columns from an uploaded file, used as {{key}} message variables. */
  vars?: Record<string, string>;
}

export interface ContactSelection {
  [contactId: string]: boolean;
}
