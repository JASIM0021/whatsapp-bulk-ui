import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Search, Filter, Trash2, Download, MessageSquare, Mail, Loader2, ChevronLeft, ChevronRight, CheckSquare, Square, Star, Globe, Phone } from 'lucide-react';
import { API_ENDPOINTS, apiFetch } from '@/config/api';

interface Lead {
	id: string;
	name: string;
	address?: string;
	phone?: string;
	website?: string;
	email?: string;
	category?: string;
	rating?: number;
	reviews?: number;
}

export function LeadsDatabaseTab() {
	const navigate = useNavigate();

	const [leads, setLeads] = useState<Lead[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [limit] = useState(50);
	const [loading, setLoading] = useState(false);

	// Filters
	const [search, setSearch] = useState('');
	const [niche, setNiche] = useState('');
	const [location, setLocation] = useState('');
	const [hasPhone, setHasPhone] = useState(false);
	const [hasEmail, setHasEmail] = useState(false);

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [deleting, setDeleting] = useState(false);

	const fetchLeads = async () => {
		setLoading(true);
		try {
			// Construct query params
			const params = new URLSearchParams({
				page: page.toString(),
				limit: limit.toString(),
			});

			if (search.trim()) params.append('q', search.trim());
			if (niche.trim()) params.append('niche', niche.trim());
			if (location.trim()) params.append('location', location.trim());
			if (hasPhone) params.append('has_phone', 'true');
			if (hasEmail) params.append('has_email', 'true');

			const response = await apiFetch(`${API_ENDPOINTS.leads.list}?${params.toString()}`);
			const res = await response.json();
			if (res.success && res.data) {
				setLeads(res.data.leads || []);
				setTotal(res.data.total || 0);
			}
		} catch (err) {
			console.error('Failed to load leads:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLeads();
		// Reset page when filters change
	}, [page, hasPhone, hasEmail, niche, location]);

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setPage(1);
		fetchLeads();
	};

	const handleSelectAll = () => {
		if (selectedIds.size === leads.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(leads.map(l => l.id)));
		}
	};

	const handleSelectOne = (id: string) => {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		setSelectedIds(next);
	};

	const handleDeleteSelected = async () => {
		if (selectedIds.size === 0) return;
		if (!confirm(`Are you sure you want to delete the ${selectedIds.size} selected leads?`)) return;

		setDeleting(true);
		try {
			const response = await apiFetch(API_ENDPOINTS.leads.delete, {
				method: 'DELETE',
				body: JSON.stringify({ ids: Array.from(selectedIds) }),
			});
			const res = await response.json();

			if (res.success) {
				setSelectedIds(new Set());
				// If we deleted all items on current page, go back a page
				if (leads.length === selectedIds.size && page > 1) {
					setPage(prev => prev - 1);
				} else {
					fetchLeads();
				}
			}
		} catch (err) {
			console.error('Failed to delete leads:', err);
		} finally {
			setDeleting(false);
		}
	};

	const handleExport = (format: 'excel' | 'csv') => {
		const params = new URLSearchParams({
			format,
		});

		if (search.trim()) params.append('q', search.trim());
		if (niche.trim()) params.append('niche', niche.trim());
		if (location.trim()) params.append('location', location.trim());
		if (hasPhone) params.append('has_phone', 'true');
		if (hasEmail) params.append('has_email', 'true');

		// Trigger download via window.open
		window.open(`${API_ENDPOINTS.leads.export}?${params.toString()}`, '_blank');
	};

	// Campaign Bridging
	const handleWhatsAppCampaign = () => {
		const selectedLeads = leads.filter(l => selectedIds.has(l.id));
		const validContacts = selectedLeads
			.filter(l => l.phone)
			.map(l => ({
				id: l.id,
				phone: l.phone!.replace(/\D/g, ''), // raw digits
				name: l.name,
			}));

		if (validContacts.length === 0) {
			alert('None of the selected leads have phone numbers.');
			return;
		}

		sessionStorage.setItem('temp_leads_whatsapp', JSON.stringify(validContacts));
		navigate('/whatsapp');
	};

	const handleEmailCampaign = () => {
		const selectedLeads = leads.filter(l => selectedIds.has(l.id));
		const validEmails = selectedLeads
			.filter(l => l.email)
			.map(l => ({
				email: l.email!,
				name: l.name,
			}));

		if (validEmails.length === 0) {
			alert('None of the selected leads have email addresses.');
			return;
		}

		sessionStorage.setItem('temp_leads_email', JSON.stringify(validEmails));
		navigate('/email');
	};

	const totalPages = Math.ceil(total / limit) || 1;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
						<Database className="text-amber-500" />
						<span>Leads Database</span>
					</h2>
					<p className="text-slate-400 text-sm mt-1">
						Browse and filter scraped leads, export to Excel, or directly broadcast marketing campaigns.
					</p>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<button
						onClick={() => handleExport('excel')}
						className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
					>
						<Download size={14} />
						<span>Export Excel</span>
					</button>
					<button
						onClick={() => handleExport('csv')}
						className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
					>
						<Download size={14} />
						<span>Export CSV</span>
					</button>
				</div>
			</div>

			{/* Filters Panel */}
			<div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
				<form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="md:col-span-2 relative">
						<Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
						<input
							type="text"
							placeholder="Search by business name, category, or address..."
							value={search}
							onChange={e => setSearch(e.target.value)}
							className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
						/>
					</div>

					<div className="flex gap-2">
						<button
							type="submit"
							className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-1 transition-colors"
						>
							<Filter size={13} />
							<span>Search</span>
						</button>
						<button
							type="button"
							onClick={() => {
								setSearch('');
								setNiche('');
								setLocation('');
								setHasPhone(false);
								setHasEmail(false);
								setPage(1);
								setTimeout(fetchLeads, 50);
							}}
							className="px-3 py-2 bg-slate-950 hover:bg-slate-900 text-slate-500 rounded-xl text-xs border border-slate-900 transition-colors"
						>
							Reset
						</button>
					</div>

					{/* Checkboxes */}
					<div className="flex items-center gap-4 text-xs md:justify-end">
						<label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-white">
							<input
								type="checkbox"
								checked={hasPhone}
								onChange={e => { setPage(1); setHasPhone(e.target.checked); }}
								className="rounded bg-slate-950 border-slate-800 text-amber-600 focus:ring-amber-500"
							/>
							<span>With Phone</span>
						</label>
						<label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-white">
							<input
								type="checkbox"
								checked={hasEmail}
								onChange={e => { setPage(1); setHasEmail(e.target.checked); }}
								className="rounded bg-slate-950 border-slate-800 text-amber-600 focus:ring-amber-500"
							/>
							<span>With Email</span>
						</label>
					</div>
				</form>
			</div>

			{/* Bulk Actions Header (Only visible when items selected) */}
			{selectedIds.size > 0 && (
				<div className="bg-amber-950/40 border border-amber-900/60 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
					<div className="text-amber-400 font-semibold">
						{selectedIds.size} leads selected
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={handleWhatsAppCampaign}
							className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-1 transition-all"
						>
							<MessageSquare size={13} fill="white" />
							<span>WhatsApp Campaign</span>
						</button>
						<button
							onClick={handleEmailCampaign}
							className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1 transition-all"
						>
							<Mail size={13} />
							<span>Email Campaign</span>
						</button>
						<button
							onClick={handleDeleteSelected}
							disabled={deleting}
							className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1 transition-all"
						>
							{deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
							<span>Delete</span>
						</button>
					</div>
				</div>
			)}

			{/* Table Container */}
			<div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
				<div className="overflow-x-auto">
					<table className="w-full text-left border-collapse">
						<thead>
							<tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
								<th className="p-4 w-12 text-center">
									<button onClick={handleSelectAll} className="text-slate-500 hover:text-white transition-colors">
										{selectedIds.size === leads.length && leads.length > 0 ? (
											<CheckSquare size={16} className="text-amber-500" />
										) : (
											<Square size={16} />
										)}
									</button>
								</th>
								<th className="p-4">Business Name</th>
								<th className="p-4">Phone</th>
								<th className="p-4">Email</th>
								<th className="p-4">Website</th>
								<th className="p-4">Category</th>
								<th className="p-4 text-center">Rating</th>
								<th className="p-4">Address</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-800/60 text-xs">
							{loading ? (
								<tr>
									<td colSpan={8} className="p-12 text-center text-slate-500">
										<Loader2 size={24} className="animate-spin mx-auto text-amber-500 mb-2" />
										<span>Loading leads from database...</span>
									</td>
								</tr>
							) : leads.length === 0 ? (
								<tr>
									<td colSpan={8} className="p-12 text-center text-slate-500 italic">
										No leads found. Scrape some listings first or adjust your filters.
									</td>
								</tr>
							) : (
								leads.map(lead => {
									const isSelected = selectedIds.has(lead.id);
									return (
										<tr
											key={lead.id}
											className={`hover:bg-slate-800/40 transition-colors ${
												isSelected ? 'bg-amber-950/10' : ''
											}`}
										>
											<td className="p-4 text-center">
												<button
													onClick={() => handleSelectOne(lead.id)}
													className="text-slate-500 hover:text-white transition-colors"
												>
													{isSelected ? (
														<CheckSquare size={16} className="text-amber-500" />
													) : (
														<Square size={16} />
													)}
												</button>
											</td>
											<td className="p-4 font-bold text-white max-w-xs truncate">{lead.name}</td>
											<td className="p-4">
												{lead.phone ? (
													<span className="flex items-center gap-1 text-slate-300">
														<Phone size={12} className="text-slate-500 shrink-0" />
														<span>{lead.phone}</span>
													</span>
												) : (
													<span className="text-slate-600 italic">None</span>
												)}
											</td>
											<td className="p-4">
												{lead.email ? (
													<span className="text-emerald-400 font-medium">{lead.email}</span>
												) : (
													<span className="text-slate-600 italic">None</span>
												)}
											</td>
											<td className="p-4">
												{lead.website ? (
													<a
														href={lead.website.startsWith('http') ? lead.website : `http://${lead.website}`}
														target="_blank"
														rel="noreferrer"
														className="text-amber-500 hover:underline flex items-center gap-1 truncate max-w-[140px]"
													>
														<Globe size={12} className="shrink-0" />
														<span>{lead.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
													</a>
												) : (
													<span className="text-slate-600 italic">None</span>
												)}
											</td>
											<td className="p-4">
												{lead.category ? (
													<span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded text-[10px] font-semibold">
														{lead.category}
													</span>
												) : (
													<span className="text-slate-600">-</span>
												)}
											</td>
											<td className="p-4 text-center">
												{lead.rating ? (
													<span className="inline-flex items-center gap-1 font-bold text-slate-300">
														<span>{lead.rating.toFixed(1)}</span>
														<Star size={11} className="text-amber-500 fill-amber-500 shrink-0" />
														{lead.reviews !== undefined && (
															<span className="text-slate-600 text-[10px] font-normal">({lead.reviews})</span>
														)}
													</span>
												) : (
													<span className="text-slate-600 text-[10px]">-</span>
												)}
											</td>
											<td className="p-4 text-slate-400 max-w-xs truncate" title={lead.address}>
												{lead.address || <span className="text-slate-600">-</span>}
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>

				{/* Pagination footer */}
				{totalPages > 1 && (
					<div className="bg-slate-950/40 px-6 py-4 flex items-center justify-between border-t border-slate-800/80">
						<span className="text-xs text-slate-500">
							Showing <strong className="text-slate-300">{(page - 1) * limit + 1}</strong> to{' '}
							<strong className="text-slate-300">
								{Math.min(page * limit, total)}
							</strong>{' '}
							of <strong className="text-slate-300">{total}</strong> leads
						</span>

						<div className="flex items-center gap-2">
							<button
								onClick={() => setPage(p => Math.max(p - 1, 1))}
								disabled={page === 1}
								className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 text-slate-200 rounded-lg transition-colors"
							>
								<ChevronLeft size={16} />
							</button>
							<span className="text-xs text-slate-400 font-semibold select-none px-2">
								Page {page} of {totalPages}
							</span>
							<button
								onClick={() => setPage(p => Math.min(p + 1, totalPages))}
								disabled={page === totalPages}
								className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 border border-slate-700 text-slate-200 rounded-lg transition-colors"
							>
								<ChevronRight size={16} />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
