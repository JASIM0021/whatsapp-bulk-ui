import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Contact } from '@/types/contact';
import { validateAndFormatPhone } from './validation';

export async function parseFile(file: File): Promise<Contact[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv')) {
    return parseCSV(file);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcel(file);
  } else {
    throw new Error('Unsupported file type. Please upload .xlsx, .xls, or .csv files.');
  }
}

async function parseExcel(file: File): Promise<Contact[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  // Get the first sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON
  const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  return extractContacts(jsonData);
}

async function parseCSV(file: File): Promise<Contact[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        resolve(extractContacts(results.data as any[]));
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}

function extractContacts(data: any[][]): Contact[] {
  if (!data || data.length === 0) {
    return [];
  }

  const contacts: Contact[] = [];

  // Find the rightmost column that contains phone numbers
  let phoneColumnIndex = -1;
  const headerRow = data[0];

  // First, try to find a column with phone-related headers
  for (let i = headerRow.length - 1; i >= 0; i--) {
    const header = String(headerRow[i] || '').toLowerCase();
    if (header.includes('phone') ||
        header.includes('mobile') ||
        header.includes('contact') ||
        header.includes('number')) {
      phoneColumnIndex = i;
      break;
    }
  }

  // If no phone column found by header, use the rightmost column
  if (phoneColumnIndex === -1) {
    phoneColumnIndex = headerRow.length - 1;
  }

  // Find name column if it exists
  let nameColumnIndex = -1;
  for (let i = 0; i < headerRow.length; i++) {
    const header = String(headerRow[i] || '').toLowerCase();
    if (header.includes('name')) {
      nameColumnIndex = i;
      break;
    }
  }

  // Process data rows (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const phoneValue = row[phoneColumnIndex];
    if (!phoneValue) continue;

    const phoneStr = String(phoneValue).trim();
    if (!phoneStr || phoneStr === '') continue;

    // Validate and format phone number
    const validation = validateAndFormatPhone(phoneStr);

    const name = nameColumnIndex >= 0 ? String(row[nameColumnIndex] || '').trim() : undefined;

    contacts.push({
      id: `contact-${i}-${Date.now()}`,
      name: name || undefined,
      phone: phoneStr,
      formattedPhone: validation.formattedPhone,
      isValid: validation.isValid,
      validationError: validation.error,
      row: i + 1,
    });
  }

  return contacts;
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  const ext = getFileExtension(file.name);
  return allowedTypes.includes(`.${ext}`);
}
