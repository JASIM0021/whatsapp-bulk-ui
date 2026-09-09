import React, { useState, useRef } from 'react';
import {
	UploadCloud,
	FileSpreadsheet,
	FileText,
	FileJson,
	ArrowLeft,
	CheckCircle2,
	AlertCircle,
	Loader2,
	X,
	Sparkles,
	RotateCcw,
	HelpCircle,
	Check,
	Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { API_ENDPOINTS, apiFetch } from '@/config/api';

interface LeadImportModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSuccess: () => void;
}

// Definition of Nexbotix standard fields that can be mapped
interface FieldDefinition {
	key: string;
	label: string;
	description: string;
	required?: boolean;
	synonyms: string[];
	type: 'string' | 'number' | 'array';
}

const NEXBOTIX_FIELDS: FieldDefinition[] = [
	{
		key: 'name',
		label: 'Business Name',
		description: 'The primary company or contact name',
		required: true,
		synonyms: ['name', 'business name', 'business_name', 'company', 'company name', 'company_name', 'title', 'organization', 'place_name', 'store_name', 'business'],
		type: 'string',
	},
	{
		key: 'phone',
		label: 'Phone Number',
		description: 'Phone / mobile number with country code',
		synonyms: ['phone', 'phone number', 'phone_number', 'mobile', 'cell', 'tel', 'telephone', 'contact', 'contact_number', 'ph', 'phone_1'],
		type: 'string',
	},
	{
		key: 'email',
		label: 'Primary Email',
		description: 'Primary email address for outreach',
		synonyms: ['email', 'email address', 'email_address', 'mail', 'primary_email', 'e-mail', 'contact_email'],
		type: 'string',
	},
	{
		key: 'website',
		label: 'Website URL',
		description: 'Website domain or link',
		synonyms: ['website', 'site', 'url', 'web', 'link', 'homepage', 'web_address', 'domain', 'web_url'],
		type: 'string',
	},
	{
		key: 'address',
		label: 'Full Address / Street',
		description: 'Street address, building, or landmark location',
		synonyms: ['address', 'location', 'full_address', 'full address', 'street', 'street address', 'street_address', 'addr', 'formatted_address', 'place'],
		type: 'string',
	},
	{
		key: 'city',
		label: 'City',
		description: 'City or municipality name',
		synonyms: ['city', 'town', 'district', 'municipality', 'metro', 'city_name', 'city name'],
		type: 'string',
	},
	{
		key: 'state',
		label: 'State / Province',
		description: 'State, province, or region',
		synonyms: ['state', 'province', 'region', 'state_code', 'state_name', 'state / province', 'state/province'],
		type: 'string',
	},
	{
		key: 'pincode',
		label: 'Pincode / ZIP',
		description: 'Postal code or ZIP code',
		synonyms: ['pincode', 'pin', 'pin_code', 'pin code', 'zip', 'zipcode', 'zip_code', 'zip code', 'postal', 'postal_code', 'postal code', 'postcode'],
		type: 'string',
	},
	{
		key: 'category',
		label: 'Category / Niche',
		description: 'Industry, niche, or business type',
		synonyms: ['category', 'niche', 'type', 'industry', 'business_category', 'tag', 'profession', 'specialty', 'categories'],
		type: 'string',
	},
	{
		key: 'rating',
		label: 'Rating',
		description: 'Average score / star rating (e.g. 4.8)',
		synonyms: ['rating', 'rate', 'stars', 'score', 'average_rating', 'user_rating', 'avg_rating'],
		type: 'number',
	},
	{
		key: 'reviews',
		label: 'Reviews Count',
		description: 'Total review count (e.g. 194)',
		synonyms: ['reviews', 'review_count', 'reviews_count', 'num_reviews', 'total_reviews', 'user_ratings_total', 'review'],
		type: 'number',
	},
	{
		key: 'keyword',
		label: 'Keyword / Search Tag',
		description: 'Search term or keyword associated with lead',
		synonyms: ['keyword', 'keywords', 'search_term', 'query', 'search_query', 'niche_term', 'tag'],
		type: 'string',
	},
	{
		key: 'platform',
		label: 'Platform / Source',
		description: 'Lead origin (e.g. gmaps, bing, import)',
		synonyms: ['platform', 'source', 'lead_source', 'origin', 'provider'],
		type: 'string',
	},
	{
		key: 'allEmails',
		label: 'All Emails (List)',
		description: 'Multiple emails array or comma-separated list',
		synonyms: ['allemails', 'all_emails', 'emails', 'email_list', 'extracted_emails', 'emails_list'],
		type: 'array',
	},
	{
		key: 'emailSource',
		label: 'Email Source / URL',
		description: 'Where the email was found (e.g. contact page)',
		synonyms: ['emailsource', 'email_source', 'source_page', 'email_found_at', 'source_url'],
		type: 'string',
	},
	{
		key: 'emailConfidence',
		label: 'Email Confidence',
		description: 'Confidence level (e.g. high, medium, low)',
		synonyms: ['emailconfidence', 'email_confidence', 'confidence', 'confidence_score', 'email_score'],
		type: 'string',
	},
	{
		key: 'notes',
		label: 'Notes / Remarks',
		description: 'Custom notes or details about the lead',
		synonyms: ['notes', 'note', 'comment', 'comments', 'remarks', 'description', 'info', 'hours'],
		type: 'string',
	},
];

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'completed';

export function LeadImportModal({ isOpen, onClose, onSuccess }: LeadImportModalProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [step, setStep] = useState<Step>('upload');
	const [fileName, setFileName] = useState('');
	const [fileSize, setFileSize] = useState(0);
	const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
	const [availableHeaders, setAvailableHeaders] = useState<string[]>([]);
	const [mappings, setMappings] = useState<Record<string, string>>({});

	// Default fallback values if columns aren't present
	const [defaultPlatform, setDefaultPlatform] = useState('import');
	const [defaultKeyword, setDefaultKeyword] = useState('');

	// Import execution & chunked progress state
	const [isProcessing, setIsProcessing] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [importProgress, setImportProgress] = useState<{
		current: number;
		total: number;
		percent: number;
		currentBatch: number;
		totalBatches: number;
	}>({ current: 0, total: 0, percent: 0, currentBatch: 0, totalBatches: 0 });
	const [importResult, setImportResult] = useState<{ imported: number; updated: number; total: number } | null>(null);

	if (!isOpen) return null;

	const handleReset = () => {
		setStep('upload');
		setFileName('');
		setFileSize(0);
		setRawRows([]);
		setAvailableHeaders([]);
		setMappings({});
		setErrorMessage(null);
		setImportResult(null);
		setIsProcessing(false);
		setImportProgress({ current: 0, total: 0, percent: 0, currentBatch: 0, totalBatches: 0 });
	};

	const handleClose = () => {
		handleReset();
		onClose();
	};

	// Helper to normalize strings for comparison
	const normalizeStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

	// Smart auto-mapper
	const autoDetectMappings = (headers: string[]): Record<string, string> => {
		const newMap: Record<string, string> = {};
		const usedHeaders = new Set<string>();

		for (const field of NEXBOTIX_FIELDS) {
			// 1. Check exact matches first
			let match = headers.find(h => h.toLowerCase() === field.key.toLowerCase());

			// 2. Check synonyms
			if (!match) {
				match = headers.find(h => {
					const normH = normalizeStr(h);
					return field.synonyms.some(syn => normalizeStr(syn) === normH);
				});
			}

			// 3. Partial substring matching if not yet found
			if (!match) {
				match = headers.find(h => {
					const normH = normalizeStr(h);
					return field.synonyms.some(syn => {
						const normSyn = normalizeStr(syn);
						return normH.includes(normSyn) || normSyn.includes(normH);
					});
				});
			}

			if (match && !usedHeaders.has(match)) {
				newMap[field.key] = match;
				usedHeaders.add(match);
			} else {
				newMap[field.key] = ''; // Not mapped
			}
		}

		return newMap;
	};

	// Parse file
	const processFile = async (file: File) => {
		setErrorMessage(null);
		setIsProcessing(true);
		setFileName(file.name);
		setFileSize(file.size);

		try {
			const ext = file.name.split('.').pop()?.toLowerCase();
			let rows: Record<string, any>[] = [];

			if (ext === 'json') {
				const text = await file.text();
				const parsed = JSON.parse(text);
				if (Array.isArray(parsed)) {
					rows = parsed;
				} else if (parsed && typeof parsed === 'object') {
					if (Array.isArray(parsed.leads)) rows = parsed.leads;
					else if (Array.isArray(parsed.data)) rows = parsed.data;
					else if (Array.isArray(parsed.items)) rows = parsed.items;
					else if (Array.isArray(parsed.results)) rows = parsed.results;
					else {
						throw new Error('JSON file must contain an array of lead objects or a { leads: [...] } property.');
					}
				} else {
					throw new Error('Invalid JSON format.');
				}
			} else if (ext === 'csv') {
				const text = await file.text();
				const result = Papa.parse(text, {
					header: true,
					skipEmptyLines: 'greedy',
					dynamicTyping: false,
				});
				if (result.errors && result.errors.length > 0 && result.data.length === 0) {
					throw new Error(`CSV parsing error: ${result.errors[0].message}`);
				}
				rows = result.data as Record<string, any>[];
			} else if (ext === 'xlsx' || ext === 'xls') {
				const buffer = await file.arrayBuffer();
				const workbook = XLSX.read(buffer, { type: 'array' });
				const firstSheet = workbook.SheetNames[0];
				if (!firstSheet) throw new Error('Excel workbook contains no sheets.');
				const worksheet = workbook.Sheets[firstSheet];
				rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
			} else {
				throw new Error('Unsupported file format. Please upload .csv, .xlsx, .xls, or .json file.');
			}

			if (rows.length === 0) {
				throw new Error('The uploaded file contains no data rows.');
			}

			// Extract all unique headers / keys across all rows
			const headerSet = new Set<string>();
			for (const r of rows) {
				if (r && typeof r === 'object') {
					Object.keys(r).forEach(k => {
						if (k.trim()) headerSet.add(k);
					});
				}
			}
			const headers = Array.from(headerSet);

			setRawRows(rows);
			setAvailableHeaders(headers);

			// Auto map
			const detected = autoDetectMappings(headers);
			setMappings(detected);

			setStep('mapping');
		} catch (err: any) {
			console.error('File parse error:', err);
			setErrorMessage(err.message || 'Failed to parse file.');
		} finally {
			setIsProcessing(false);
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			processFile(file);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const file = e.dataTransfer.files?.[0];
		if (file) {
			processFile(file);
		}
	};

	// Map a single raw row to Nexbotix Lead format
	const mapRowToLead = (row: Record<string, any>) => {
		const lead: Record<string, any> = {};

		for (const field of NEXBOTIX_FIELDS) {
			const sourceKey = mappings[field.key];
			let val = sourceKey ? row[sourceKey] : undefined;

			if (field.type === 'number') {
				if (val !== undefined && val !== null && val !== '') {
					const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
					lead[field.key] = isNaN(num) ? 0 : num;
				} else {
					lead[field.key] = 0;
				}
			} else if (field.type === 'array') {
				if (Array.isArray(val)) {
					lead[field.key] = val.map(v => String(v).trim()).filter(Boolean);
				} else if (typeof val === 'string' && val.trim()) {
					lead[field.key] = val.split(/[,;\n]/).map(v => v.trim()).filter(Boolean);
				} else {
					lead[field.key] = [];
				}
			} else {
				lead[field.key] = val !== undefined && val !== null ? String(val).trim() : '';
			}
		}

		// Auto-compose address if empty but city/state/pincode are provided
		if (!lead.address) {
			const addrParts: string[] = [];
			if (lead.city) addrParts.push(lead.city);
			if (lead.state) addrParts.push(lead.state);
			if (lead.pincode) addrParts.push(lead.pincode);
			if (addrParts.length > 0) {
				lead.address = addrParts.join(', ');
			}
		}

		// Defaults
		if (!lead.platform && defaultPlatform) {
			lead.platform = defaultPlatform;
		}
		if (!lead.keyword && defaultKeyword) {
			lead.keyword = defaultKeyword;
		}

		// Sync email with allEmails if needed
		if (lead.email && Array.isArray(lead.allEmails) && lead.allEmails.length === 0) {
			lead.allEmails = [lead.email];
		} else if (!lead.email && Array.isArray(lead.allEmails) && lead.allEmails.length > 0) {
			lead.email = lead.allEmails[0];
		}

		return lead;
	};

	const handleDownloadSample = (format: 'json' | 'csv') => {
		const sampleData = [
			{
				name: 'Walk In Clinic of NYC',
				phone: '+1 212-686-5800',
				address: '35W W 36th St. Rm 4w',
				city: 'New York',
				state: 'NY',
				pincode: '10018',
				website: 'http://www.walkinclinicnyc.com/',
				category: 'Walk-in clinic',
				rating: 4.8,
				reviews: 194,
				email: 'walkclinic@gmail.com',
				keyword: 'clinic',
				platform: 'gmaps',
				allEmails: ['walkclinic@gmail.com'],
				emailSource: 'contact_page:/contact-us/',
				emailConfidence: 'high',
				notes: 'Premier health center',
			},
			{
				name: 'Metro Dental Care NYC',
				phone: '+1 212-696-5900',
				address: '35 W 36th St. Ste 7',
				city: 'New York',
				state: 'NY',
				pincode: '10018',
				website: 'https://metrodentalnyc.com/',
				category: 'Dental Clinic',
				rating: 4.6,
				reviews: 107,
				email: 'info@metrodentalnyc.com',
				keyword: 'dental',
				platform: 'gmaps',
				allEmails: ['info@metrodentalnyc.com'],
				emailSource: 'footer',
				emailConfidence: 'medium',
				notes: '',
			},
		];

		if (format === 'json') {
			const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'sample-leads-nexbotix.json';
			a.click();
			URL.revokeObjectURL(url);
		} else {
			const csv = Papa.unparse(sampleData.map(item => ({
				...item,
				allEmails: item.allEmails.join('; '),
			})));
			const blob = new Blob([csv], { type: 'text/csv' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'sample-leads-nexbotix.csv';
			a.click();
			URL.revokeObjectURL(url);
		}
	};

	// Execute lead import in batches (handles 80,000+ leads without proxy size/timeout errors)
	const handleExecuteImport = async () => {
		setIsProcessing(true);
		setErrorMessage(null);
		setStep('importing');

		try {
			// Convert all raw rows using current mapping
			const mappedLeads = rawRows.map(row => mapRowToLead(row));

			// Filter out empty rows where there is no name, phone, email, or website
			const validLeads = mappedLeads.filter(l => l.name || l.phone || l.email || l.website);

			if (validLeads.length === 0) {
				throw new Error('No valid leads to import. Please check your field mappings (at least Name, Phone, or Email is required).');
			}

			// Batching settings: 1,000 items per chunk prevents huge payloads and timeouts
			const CHUNK_SIZE = 1000;
			const totalBatches = Math.ceil(validLeads.length / CHUNK_SIZE);
			let accumulatedImported = 0;
			let accumulatedUpdated = 0;

			for (let i = 0; i < totalBatches; i++) {
				const start = i * CHUNK_SIZE;
				const end = Math.min(start + CHUNK_SIZE, validLeads.length);
				const chunk = validLeads.slice(start, end);

				setImportProgress({
					current: end,
					total: validLeads.length,
					percent: Math.round((end / validLeads.length) * 100),
					currentBatch: i + 1,
					totalBatches,
				});

				const response = await apiFetch(API_ENDPOINTS.leads.import, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ leads: chunk }),
				});

				if (!response.ok) {
					const errText = await response.text();
					let errMsg = `Batch ${i + 1}/${totalBatches} failed with HTTP status ${response.status}`;
					try {
						const parsed = JSON.parse(errText);
						if (parsed.error) errMsg = parsed.error;
					} catch {
						if (errText.length < 200 && errText.trim()) errMsg = errText.trim();
					}
					throw new Error(errMsg);
				}

				const res = await response.json();
				if (res.success) {
					accumulatedImported += res.imported || 0;
					accumulatedUpdated += res.updated || 0;
				} else {
					throw new Error(res.error || `Batch ${i + 1}/${totalBatches} failed to import.`);
				}
			}

			setImportResult({
				imported: accumulatedImported,
				updated: accumulatedUpdated,
				total: validLeads.length,
			});
			setStep('completed');
			onSuccess();
		} catch (err: any) {
			console.error('Import execution error:', err);
			setErrorMessage(err.message || 'An error occurred during import.');
			setStep('mapping');
		} finally {
			setIsProcessing(false);
		}
	};

	// Calculate mapped preview rows
	const previewRows = rawRows.slice(0, 4).map(r => mapRowToLead(r));
	const totalMappedFields = Object.values(mappings).filter(Boolean).length;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
			<div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
				{/* Modal Header */}
				<div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
							<UploadCloud size={20} />
						</div>
						<div>
							<h3 className="text-base font-bold text-white flex items-center gap-2">
								<span>Import Leads to Nexbotix</span>
								<span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
									CSV · XLS · JSON
								</span>
							</h3>
							<p className="text-xs text-slate-400">
								Upload external leads and map columns directly into your Nexbotix database schema.
							</p>
						</div>
					</div>
					<button
						onClick={handleClose}
						className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
					>
						<X size={18} />
					</button>
				</div>

				{/* Progress Steps Indicator */}
				<div className="px-6 py-2.5 bg-slate-950/30 border-b border-slate-800/80 flex items-center justify-between text-xs">
					<div className="flex items-center gap-6">
						<div className={`flex items-center gap-2 font-medium ${step === 'upload' ? 'text-amber-400' : 'text-slate-400'}`}>
							<span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'upload' ? 'bg-amber-500 text-black font-bold' : 'bg-slate-800 text-slate-300'}`}>
								1
							</span>
							<span>Upload File</span>
						</div>
						<div className={`flex items-center gap-2 font-medium ${step === 'mapping' ? 'text-amber-400' : 'text-slate-400'}`}>
							<span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'mapping' ? 'bg-amber-500 text-black font-bold' : 'bg-slate-800 text-slate-300'}`}>
								2
							</span>
							<span>Map Fields</span>
						</div>
						<div className={`flex items-center gap-2 font-medium ${step === 'importing' || step === 'completed' ? 'text-amber-400' : 'text-slate-400'}`}>
							<span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 'completed' ? 'bg-emerald-500 text-black font-bold' : 'bg-slate-800 text-slate-300'}`}>
								3
							</span>
							<span>Complete</span>
						</div>
					</div>

					{rawRows.length > 0 && (
						<div className="text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
							<span className="text-white font-semibold">{rawRows.length}</span> rows detected in <span className="text-amber-400 font-mono">{fileName}</span>
							{fileSize > 0 && <span className="text-slate-500 ml-1.5">({(fileSize / 1024).toFixed(1)} KB)</span>}
						</div>
					)}
				</div>

				{/* Modal Body */}
				<div className="p-6 overflow-y-auto flex-1 space-y-6">
					{/* Error Alert */}
					{errorMessage && (
						<div className="p-4 bg-rose-950/40 border border-rose-900/60 rounded-2xl flex items-start gap-3 text-rose-300 text-xs">
							<AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
							<div>
								<p className="font-semibold">Import Error</p>
								<p className="text-rose-400/90 mt-0.5">{errorMessage}</p>
							</div>
						</div>
					)}

					{/* ── STEP 1: UPLOAD ── */}
					{step === 'upload' && (
						<div className="space-y-6">
							<div
								onDragOver={e => e.preventDefault()}
								onDrop={handleDrop}
								onClick={() => fileInputRef.current?.click()}
								className="border-2 border-dashed border-slate-700 hover:border-amber-500/80 bg-slate-950/40 hover:bg-slate-900/50 rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
							>
								<input
									type="file"
									ref={fileInputRef}
									onChange={handleFileSelect}
									accept=".csv,.xlsx,.xls,.json"
									className="hidden"
								/>

								<div className="w-16 h-16 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 transition-transform group-hover:scale-110 shadow-lg">
									{isProcessing ? (
										<Loader2 size={32} className="animate-spin" />
									) : (
										<UploadCloud size={32} />
									)}
								</div>

								<p className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors">
									Click or drag & drop your leads file here
								</p>
								<p className="text-xs text-slate-400 mt-1 max-w-md">
									Supports standard CSV (<code className="text-amber-400">.csv</code>), Excel spreadsheets (<code className="text-amber-400">.xlsx, .xls</code>), and Nexbotix JSON format (<code className="text-amber-400">.json</code>).
								</p>

								<div className="flex items-center gap-3 mt-6">
									<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
										<FileText size={14} className="text-blue-400" />
										<span>CSV</span>
									</div>
									<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
										<FileSpreadsheet size={14} className="text-emerald-400" />
										<span>Excel XLSX</span>
									</div>
									<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
										<FileJson size={14} className="text-amber-400" />
										<span>JSON</span>
									</div>
								</div>
							</div>

							{/* Sample template download section */}
							<div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
								<div>
									<h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
										<HelpCircle size={14} className="text-amber-500" />
										<span>Need a reference template?</span>
									</h4>
									<p className="text-[11px] text-slate-400 mt-0.5">
										Download a sample dataset pre-configured with all standard Nexbotix lead fields.
									</p>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<button
										onClick={() => handleDownloadSample('csv')}
										className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
									>
										<Download size={13} />
										<span>Sample CSV</span>
									</button>
									<button
										onClick={() => handleDownloadSample('json')}
										className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
									>
										<Download size={13} />
										<span>Sample JSON</span>
									</button>
								</div>
							</div>
						</div>
					)}

					{/* ── STEP 2: FIELD MAPPING & PREVIEW ── */}
					{step === 'mapping' && (
						<div className="space-y-6">
							{/* Controls Bar */}
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
								<div>
									<h4 className="text-sm font-bold text-white flex items-center gap-2">
										<span>Column & Header Mapping</span>
										<span className="text-xs font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
											{totalMappedFields} of {NEXBOTIX_FIELDS.length} fields mapped
										</span>
									</h4>
									<p className="text-xs text-slate-400 mt-0.5">
										Match your file columns to the corresponding Nexbotix database fields.
									</p>
								</div>

								<div className="flex items-center gap-2">
									<button
										onClick={() => setMappings(autoDetectMappings(availableHeaders))}
										className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
									>
										<Sparkles size={13} />
										<span>Auto-Detect</span>
									</button>
									<button
										onClick={() => {
											const cleared: Record<string, string> = {};
											NEXBOTIX_FIELDS.forEach(f => cleared[f.key] = '');
											setMappings(cleared);
										}}
										className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
									>
										<RotateCcw size={13} />
										<span>Clear</span>
									</button>
								</div>
							</div>

							{/* Mapping Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
								{NEXBOTIX_FIELDS.map(field => {
									const currentMapping = mappings[field.key] || '';
									const sampleVal = currentMapping && rawRows[0] ? rawRows[0][currentMapping] : null;
									const sampleStr = sampleVal !== undefined && sampleVal !== null ? (
										typeof sampleVal === 'object' ? JSON.stringify(sampleVal) : String(sampleVal)
									) : '';

									return (
										<div
											key={field.key}
											className={`p-3.5 rounded-2xl border transition-all ${
												currentMapping
													? 'bg-slate-900/90 border-slate-700 shadow-sm'
													: field.required
													? 'bg-amber-950/10 border-amber-900/40'
													: 'bg-slate-950/40 border-slate-800/80 opacity-80'
											}`}
										>
											<div className="flex items-center justify-between mb-1.5">
												<div className="flex items-center gap-1.5">
													<span className="text-xs font-bold text-white">{field.label}</span>
													{field.required && (
														<span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
															Required
														</span>
													)}
												</div>
												<span className="text-[10px] font-mono text-slate-500">
													nexbotix.{field.key}
												</span>
											</div>

											{/* Select Dropdown */}
											<select
												value={currentMapping}
												onChange={e => setMappings(prev => ({ ...prev, [field.key]: e.target.value }))}
												className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
											>
												<option value="">-- Do not map (Skip) --</option>
												{availableHeaders.map(h => (
													<option key={h} value={h}>
														Column: {h}
													</option>
												))}
											</select>

											{/* Sample Value Preview */}
											{currentMapping && sampleStr && (
												<div className="mt-2 text-[11px] text-slate-400 truncate flex items-center gap-1.5">
													<span className="text-slate-500 shrink-0 font-medium">Sample:</span>
													<span className="font-mono text-amber-300/90 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800 truncate">
														{sampleStr}
													</span>
												</div>
											)}
										</div>
									);
								})}
							</div>

							{/* Fallback Defaults */}
							<div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<label className="text-xs font-semibold text-slate-300 block mb-1">
										Default Platform / Source Tag
									</label>
									<input
										type="text"
										value={defaultPlatform}
										onChange={e => setDefaultPlatform(e.target.value)}
										placeholder="e.g. import, gmaps, custom"
										className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
									/>
									<span className="text-[10px] text-slate-500 mt-1 block">Applied to leads without an explicit platform</span>
								</div>
								<div>
									<label className="text-xs font-semibold text-slate-300 block mb-1">
										Default Keyword / Niche Tag
									</label>
									<input
										type="text"
										value={defaultKeyword}
										onChange={e => setDefaultKeyword(e.target.value)}
										placeholder="e.g. Clinic, Realtor, Restaurant"
										className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
									/>
									<span className="text-[10px] text-slate-500 mt-1 block">Applied if keyword column is not mapped</span>
								</div>
							</div>

							{/* Live Data Preview Section */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
										Live Preview ({previewRows.length} sample rows)
									</h4>
									<span className="text-[11px] text-slate-500">
										Updates in real-time based on selected mapping
									</span>
								</div>

								<div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
									<div className="overflow-x-auto">
										<table className="w-full text-left text-xs">
											<thead>
												<tr className="bg-slate-900/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
													<th className="p-3">Name</th>
													<th className="p-3">Phone</th>
													<th className="p-3">Email</th>
													<th className="p-3">Address</th>
													<th className="p-3">Website</th>
													<th className="p-3">Category</th>
													<th className="p-3 text-center">Rating</th>
													<th className="p-3">Platform</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
												{previewRows.map((r, idx) => (
													<tr key={idx} className="hover:bg-slate-900/40">
														<td className="p-3 font-semibold text-white font-sans max-w-[180px] truncate">
															{r.name || <span className="text-slate-600 italic">Unnamed</span>}
														</td>
														<td className="p-3 text-slate-300 max-w-[120px] truncate">
															{r.phone || <span className="text-slate-600">—</span>}
														</td>
														<td className="p-3 text-blue-400 max-w-[150px] truncate">
															{r.email || <span className="text-slate-600">—</span>}
														</td>
														<td className="p-3 text-slate-400 max-w-[180px] truncate">
															{r.address || <span className="text-slate-600">—</span>}
														</td>
														<td className="p-3 text-slate-400 max-w-[140px] truncate">
															{r.website || <span className="text-slate-600">—</span>}
														</td>
														<td className="p-3 text-slate-300 max-w-[120px] truncate">
															{r.category || <span className="text-slate-600">—</span>}
														</td>
														<td className="p-3 text-center text-amber-400">
															{r.rating ? `★ ${r.rating}` : <span className="text-slate-600">—</span>}
														</td>
														<td className="p-3 text-slate-400 uppercase text-[10px]">
															{r.platform || 'import'}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* ── STEP 3: IMPORTING LOADER WITH LIVE PROGRESS BAR ── */}
					{step === 'importing' && (
						<div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-5 max-w-md mx-auto">
							<div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xl">
								<Loader2 size={32} className="animate-spin" />
							</div>
							<div className="w-full">
								<h4 className="text-lg font-bold text-white">
									Importing Leads...
								</h4>
								<p className="text-xs text-slate-400 mt-1">
									{importProgress.total > 0
										? `Processing ${importProgress.current.toLocaleString()} of ${importProgress.total.toLocaleString()} leads (Batch ${importProgress.currentBatch} of ${importProgress.totalBatches})`
										: 'Normalizing domains, phones, and matching with your workspace database.'}
								</p>

								{/* Progress Bar */}
								<div className="w-full bg-slate-950 rounded-full h-3 mt-4 p-0.5 border border-slate-800 overflow-hidden shadow-inner">
									<div
										className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-300 ease-out"
										style={{ width: `${Math.max(importProgress.percent, 5)}%` }}
									/>
								</div>
								<div className="flex justify-between items-center text-[11px] text-slate-500 mt-1.5 font-mono">
									<span>{importProgress.current.toLocaleString()} / {importProgress.total.toLocaleString()}</span>
									<span className="text-amber-400 font-bold">{importProgress.percent}%</span>
								</div>
							</div>
						</div>
					)}

					{/* ── STEP 4: COMPLETED SUMMARY ── */}
					{step === 'completed' && importResult && (
						<div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
							<div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl animate-bounce">
								<CheckCircle2 size={44} />
							</div>

							<div>
								<h4 className="text-2xl font-bold text-white">Leads Successfully Imported!</h4>
								<p className="text-sm text-slate-400 mt-1">
									All valid records have been saved into your Leads Database.
								</p>
							</div>

							<div className="grid grid-cols-3 gap-4 w-full max-w-lg">
								<div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
									<p className="text-2xl font-bold text-emerald-400">{importResult.imported}</p>
									<p className="text-xs text-slate-400 mt-0.5">New Leads</p>
								</div>
								<div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
									<p className="text-2xl font-bold text-blue-400">{importResult.updated}</p>
									<p className="text-xs text-slate-400 mt-0.5">Enriched / Merged</p>
								</div>
								<div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
									<p className="text-2xl font-bold text-white">{importResult.total}</p>
									<p className="text-xs text-slate-400 mt-0.5">Total Processed</p>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Modal Footer */}
				<div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
					{step === 'mapping' ? (
						<>
							<button
								onClick={() => setStep('upload')}
								className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
							>
								<ArrowLeft size={14} />
								<span>Change File</span>
							</button>

							<div className="flex items-center gap-3">
								<button
									onClick={handleClose}
									className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={handleExecuteImport}
									disabled={isProcessing || rawRows.length === 0}
									className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-900/30 transition-all active:scale-95 disabled:opacity-50"
								>
									{isProcessing ? (
										<Loader2 size={14} className="animate-spin" />
									) : (
										<Check size={14} />
									)}
									<span>Confirm & Import {rawRows.length} Leads</span>
								</button>
							</div>
						</>
					) : step === 'completed' ? (
						<div className="w-full flex justify-end">
							<button
								onClick={handleClose}
								className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-900/30"
							>
								Done & View Leads
							</button>
						</div>
					) : (
						<div className="w-full flex justify-end">
							<button
								onClick={handleClose}
								className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
							>
								Close
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
