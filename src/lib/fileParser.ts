import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Contact } from '@/types/contact';
import { validateAndFormatPhone } from './validation';

/** A spreadsheet read into memory: display headers plus cell text per row. */
export interface SheetData {
  fileName: string;
  headers: string[];
  rows: string[][];
  /** Raw cell values for the phone column (numbers kept unformatted), same shape as rows. */
  rawRows: string[][];
  /** Spreadsheet row number of each data row (1-based, for error messages). */
  rowNumbers: number[];
  hasHeaderRow: boolean;
}

/** Which columns become the phone, the name and {{variables}}. Values are column indexes. */
export interface ColumnMapping {
  phone: number;
  name: number | null;
  /** column index → variable key (null = column not used) */
  vars: Record<number, string | null>;
}

const MAX_ROWS = 50000;
const RESERVED_KEYS = new Set(['name', 'phone']);
export const VAR_KEY_RE = /^[a-z0-9_]{1,40}$/;

export async function readSheet(file: File): Promise<SheetData> {
  const lower = file.name.toLowerCase();
  let formatted: unknown[][];
  let raw: unknown[][];
  if (lower.endsWith('.csv')) {
    // Strip the byte-order mark Excel adds to CSV exports, or the first header reads "\uFEFFName".
    const text = (await file.text()).replace(/^\uFEFF/, '');
    const parsed = Papa.parse<unknown[]>(text, { skipEmptyLines: 'greedy' });
    if (parsed.errors.length && parsed.data.length === 0) {
      throw new Error(`CSV parsing error: ${parsed.errors[0].message}`);
    }
    formatted = parsed.data;
    raw = formatted;
  } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    // Formatted text keeps dates/currency readable in messages; raw keeps long phone numbers exact.
    formatted = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '', blankrows: false });
    raw = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: '', blankrows: false });
  } else {
    throw new Error('Unsupported file type. Please upload .xlsx, .xls, or .csv files.');
  }

  const toText = (v: unknown) => (v === null || v === undefined ? '' : String(v).trim());
  const rowsAll = formatted.map(r => (Array.isArray(r) ? r.map(toText) : []));
  const rawAll = raw.map(r => (Array.isArray(r) ? r.map(toText) : []));
  const first = rowsAll.findIndex(r => r.some(c => c !== ''));
  if (first < 0) throw new Error('The file is empty.');

  const width = Math.max(...rowsAll.slice(first, first + 200).map(r => r.length));
  const pad = (r: string[]) => Array.from({ length: width }, (_, i) => r[i] ?? '');

  // A first row full of phone-like values means the file has no header row.
  const hasHeaderRow = !rowsAll[first].some(looksLikePhone);
  const headers = hasHeaderRow
    ? pad(rowsAll[first]).map((h, i) => h || `Column ${i + 1}`)
    : Array.from({ length: width }, (_, i) => `Column ${i + 1}`);
  const start = hasHeaderRow ? first + 1 : first;

  const rows: string[][] = [];
  const rawRows: string[][] = [];
  const rowNumbers: number[] = [];
  for (let i = start; i < rowsAll.length && rows.length < MAX_ROWS; i++) {
    if (!rowsAll[i].some(c => c !== '')) continue;
    rows.push(pad(rowsAll[i]));
    rawRows.push(pad(rawAll[i] ?? []));
    rowNumbers.push(i + 1);
  }
  if (rows.length === 0) throw new Error('No data rows found in the file.');
  return { fileName: file.name, headers, rows, rawRows, rowNumbers, hasHeaderRow };
}

function looksLikePhone(v: string): boolean {
  const digits = v.replace(/[\s\-().+]/g, '');
  return /^\d{7,15}$/.test(digits);
}

/** Turns a column header into a {{variable}} key, e.g. "Order ID" → "order_id". */
export function toVarKey(header: string): string {
  let key = header.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
  if (!key) key = 'field';
  if (/^\d/.test(key)) key = `col_${key}`.slice(0, 40);
  return key;
}

const PHONE_WORDS = ['phone', 'mobile', 'whatsapp', 'number', 'contact', 'cell', 'tel', 'msisdn'];

/** Guesses the mapping; a remembered mapping for the same columns wins. */
export function detectMapping(sheet: SheetData): ColumnMapping {
  const saved = loadSavedMapping(sheet.headers);
  if (saved) return saved;

  const lower = sheet.headers.map(h => h.toLowerCase());
  const sample = sheet.rows.slice(0, 50);

  let phone = sheet.hasHeaderRow ? lower.findIndex(h => PHONE_WORDS.some(w => h.includes(w))) : -1;
  if (phone < 0) {
    // Column with the most phone-like values.
    let best = -1;
    let bestCount = 0;
    sheet.headers.forEach((_, i) => {
      const n = sample.filter(r => looksLikePhone(r[i] ?? '')).length;
      if (n > bestCount) { best = i; bestCount = n; }
    });
    phone = best >= 0 ? best : 0;
  }

  let name: number | null = null;
  if (sheet.hasHeaderRow) {
    const exact = lower.findIndex((h, i) => i !== phone && ['name', 'full name', 'fullname', 'customer name', 'contact name'].includes(h));
    const loose = lower.findIndex((h, i) => i !== phone && h.includes('name') && !/company|business|file|user/.test(h));
    const idx = exact >= 0 ? exact : loose;
    name = idx >= 0 ? idx : null;
  }

  const vars: Record<number, string | null> = {};
  const used = new Set<string>(RESERVED_KEYS);
  sheet.headers.forEach((h, i) => {
    if (i === phone || i === name) return;
    const hasData = sample.some(r => (r[i] ?? '') !== '');
    if (!hasData) { vars[i] = null; return; }
    vars[i] = uniqueKey(toVarKey(h), used);
  });
  return { phone, name, vars };
}

function uniqueKey(key: string, used: Set<string>): string {
  let k = key;
  for (let n = 2; used.has(k); n++) k = `${key.slice(0, 36)}_${n}`;
  used.add(k);
  return k;
}

/** Returns a problem with the mapping, or null if it's usable. */
export function validateMapping(sheet: SheetData, m: ColumnMapping): string | null {
  if (m.phone < 0 || m.phone >= sheet.headers.length) return 'Choose the column that holds phone numbers.';
  const seen = new Set<string>();
  for (const [col, key] of Object.entries(m.vars)) {
    if (key === null) continue;
    const header = sheet.headers[Number(col)];
    if (!VAR_KEY_RE.test(key)) return `"${header}": variable names can use only a–z, 0–9 and _ (max 40).`;
    if (RESERVED_KEYS.has(key)) return `"${header}": {{${key}}} is built in — pick another name.`;
    if (seen.has(key)) return `Two columns use {{${key}}} — each variable needs a unique name.`;
    seen.add(key);
  }
  return null;
}

/** Builds contacts from the sheet using the mapping. */
export function buildContacts(sheet: SheetData, m: ColumnMapping): Contact[] {
  const stamp = Date.now();
  const varCols = Object.entries(m.vars).filter(([, k]) => k !== null) as [string, string][];
  const contacts: Contact[] = [];
  sheet.rows.forEach((row, i) => {
    const rawPhone = sheet.rawRows[i]?.[m.phone] || row[m.phone] || '';
    const phone = /e\+/i.test(row[m.phone] ?? '') ? rawPhone : (row[m.phone] || rawPhone);
    if (!phone.trim()) return;
    const validation = validateAndFormatPhone(phone.trim());
    const vars: Record<string, string> = {};
    for (const [col, key] of varCols) vars[key] = row[Number(col)] ?? '';
    contacts.push({
      id: `contact-${i}-${stamp}`,
      name: m.name !== null ? row[m.name] || undefined : undefined,
      phone: phone.trim(),
      formattedPhone: validation.formattedPhone,
      isValid: validation.isValid,
      validationError: validation.error,
      row: sheet.rowNumbers[i],
      vars: varCols.length ? vars : undefined,
    });
  });
  return contacts;
}

// ── Remembered mappings (per column layout, this browser only) ─────────────────

const mappingStorageKey = (headers: string[]) => `nexa_column_mapping:${headers.join('|').toLowerCase()}`;

export function saveMapping(headers: string[], m: ColumnMapping) {
  try {
    localStorage.setItem(mappingStorageKey(headers), JSON.stringify(m));
  } catch { /* storage unavailable */ }
}

function loadSavedMapping(headers: string[]): ColumnMapping | null {
  try {
    const raw = localStorage.getItem(mappingStorageKey(headers));
    if (!raw) return null;
    const m = JSON.parse(raw) as ColumnMapping;
    if (typeof m.phone !== 'number' || m.phone >= headers.length) return null;
    return m;
  } catch {
    return null;
  }
}

/** Parses a file with auto-detected columns (no mapping step). */
export async function parseFile(file: File): Promise<Contact[]> {
  const sheet = await readSheet(file);
  return buildContacts(sheet, detectMapping(sheet));
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
