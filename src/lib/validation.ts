import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

export function validateAndFormatPhone(
  phone: string,
  defaultCountry: CountryCode = 'IN'
): {
  isValid: boolean;
  formattedPhone: string;
  error?: string;
} {
  try {
    // Clean the phone number
    let cleanPhone = phone.toString().trim().replace(/\s+/g, '');

    // Remove any non-digit characters except +
    cleanPhone = cleanPhone.replace(/[^\d+]/g, '');

    // If it doesn't start with +, add country code
    if (!cleanPhone.startsWith('+')) {
      // For Indian numbers (10 digits)
      if (cleanPhone.length === 10) {
        cleanPhone = '+91' + cleanPhone;
      } else if (cleanPhone.length > 10) {
        // Assume it has country code without +
        cleanPhone = '+' + cleanPhone;
      }
    }

    // Validate using libphonenumber-js
    if (!isValidPhoneNumber(cleanPhone, defaultCountry)) {
      return {
        isValid: false,
        formattedPhone: phone,
        error: 'Invalid phone number format',
      };
    }

    const phoneNumber = parsePhoneNumber(cleanPhone, defaultCountry);

    return {
      isValid: true,
      formattedPhone: phoneNumber.format('E.164'),
    };
  } catch (error) {
    return {
      isValid: false,
      formattedPhone: phone,
      error: 'Could not parse phone number',
    };
  }
}

export function formatPhoneForWhatsApp(phone: string): string {
  // WhatsApp format: remove + and add @c.us
  return phone.replace('+', '') + '@c.us';
}
