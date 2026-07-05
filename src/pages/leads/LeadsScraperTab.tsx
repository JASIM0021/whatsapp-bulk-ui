import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Loader2, Sparkles, MapPin, Search, AlertCircle } from 'lucide-react';
import { API_ENDPOINTS, apiFetch } from '@/config/api';

interface ScrapedLog {
	time: string;
	message: string;
	type: 'info' | 'success' | 'error';
}

export function LeadsScraperTab() {
	const [niche, setNiche] = useState('');
	const [location, setLocation] = useState('');
	const [loading, setLoading] = useState(false);
	const [scraping, setScraping] = useState(false);
	const [jobId, setJobId] = useState<string | null>(null);
	const [totalScraped, setTotalScraped] = useState(0);
	const [emailsFound, setEmailsFound] = useState(0);
	const [latestName, setLatestName] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [logs, setLogs] = useState<ScrapedLog[]>([]);

	const eventSourceRef = useRef<EventSource | null>(null);
	const logsEndRef = useRef<HTMLDivElement | null>(null);

	const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
		const time = new Date().toLocaleTimeString();
		setLogs(prev => [...prev, { time, message, type }]);
	};

	useEffect(() => {
		if (logsEndRef.current) {
			logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [logs]);

	useEffect(() => {
		return () => {
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
			}
		};
	}, []);

	const handleStartScrape = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!niche.trim() || !location.trim()) return;

		setLoading(true);
		setError(null);
		setLogs([]);
		setTotalScraped(0);
		setEmailsFound(0);
		setLatestName('');

		try {
			const response = await apiFetch(API_ENDPOINTS.leads.startScrape, {
				method: 'POST',
				body: JSON.stringify({ niche: niche.trim(), location: location.trim() }),
			});
			const res = await response.json();

			if (!res.success) {
				throw new Error(res.error || 'Failed to start scraping job.');
			}

			const newJobId = res.jobId;
			setJobId(newJobId);
			setScraping(true);
			addLog(`Scraping job started. ID: ${newJobId}`, 'info');
			addLog(`Searching Bing Maps for "${niche}" in "${location}"...`, 'info');

			// Connect to SSE stream
			const token = localStorage.getItem('auth_token') || '';
			const streamUrl = `${API_ENDPOINTS.leads.stream}?job_id=${newJobId}&token=${encodeURIComponent(token)}`;
			const eventSource = new EventSource(streamUrl, { withCredentials: true });
			eventSourceRef.current = eventSource;

			eventSource.addEventListener('connected', (_event: any) => {
				addLog('Live stream connected. Receiving real-time updates.', 'success');
			});

			eventSource.addEventListener('progress', (event: any) => {
				try {
					const data = JSON.parse(event.data);
					if (data.totalScraped !== undefined) setTotalScraped(data.totalScraped);
					if (data.emailsFound !== undefined) setEmailsFound(data.emailsFound);
					if (data.latestName) {
						setLatestName(data.latestName);
						addLog(`Found lead: ${data.latestName}`, 'success');
					}
					if (data.emailsFound > emailsFound) {
						addLog(`Enriched emails: ${data.emailsFound} found total`, 'success');
					}
				} catch (err) {
					console.error('Failed to parse progress data:', err);
				}
			});

			eventSource.addEventListener('done', (event: any) => {
				try {
					const data = JSON.parse(event.data);
					setTotalScraped(data.totalScraped || 0);
					setEmailsFound(data.emailsFound || 0);
					setScraping(false);
					setJobId(null);
					eventSource.close();

					if (data.status === 'completed') {
						addLog(`Job completed successfully! Scraped ${data.totalScraped} leads, enriched ${data.emailsFound} emails.`, 'success');
					} else if (data.status === 'stopped') {
						addLog(`Job stopped by user. Scraped ${data.totalScraped} leads.`, 'info');
					} else if (data.status === 'failed') {
						addLog(`Job failed: ${data.error}`, 'error');
						setError(data.error || 'Scraper job failed.');
					}
				} catch (err) {
					setScraping(false);
					setJobId(null);
					eventSource.close();
				}
			});

			eventSource.onerror = (err) => {
				console.error('SSE Error:', err);
				addLog('Lost stream connection or finished receiving logs.', 'info');
				setScraping(false);
				setJobId(null);
				eventSource.close();
			};

		} catch (err: any) {
			setError(err.message || 'Failed to start scraping.');
			addLog(`Error: ${err.message || 'Failed to start scraping.'}`, 'error');
		} finally {
			setLoading(false);
		}
	};

	const handleStopScrape = async () => {
		if (!jobId) return;
		addLog('Stopping scraper job...', 'info');

		try {
			const response = await apiFetch(API_ENDPOINTS.leads.stopScrape, {
				method: 'POST',
				body: JSON.stringify({ jobId }),
			});
			const res = await response.json();

			if (!res.success) {
				throw new Error(res.error || 'Failed to stop scraping job.');
			}

			addLog('Scraper stop signal sent successfully.', 'info');
			setScraping(false);
			setJobId(null);
			if (eventSourceRef.current) {
				eventSourceRef.current.close();
			}
		} catch (err: any) {
			addLog(`Failed to stop job: ${err.message}`, 'error');
		}
	};

	return (
		<div className="space-y-6">
			{/* Page title */}
			<div>
				<h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
					<Sparkles className="text-amber-500" />
					<span>Map Leads Scraper</span>
				</h2>
				<p className="text-slate-400 text-sm mt-1">
					Enter a niche and location below to automatically search Bing Maps, scrape listings, and enrich leads with website emails.
				</p>
			</div>

			{/* Form & Stats Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Form Card */}
				<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
					<form onSubmit={handleStartScrape} className="space-y-4">
						<div>
							<label className="block text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wider">
								Business Niche
							</label>
							<div className="relative">
								<Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
								<input
									type="text"
									placeholder="e.g. Restaurants, Dentists, Gyms"
									value={niche}
									onChange={e => setNiche(e.target.value)}
									disabled={scraping}
									className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-50 text-sm"
									required
								/>
							</div>
						</div>

						<div>
							<label className="block text-slate-300 text-xs font-semibold mb-2 uppercase tracking-wider">
								Location / Area
							</label>
							<div className="relative">
								<MapPin className="absolute left-3 top-2.5 text-slate-500" size={18} />
								<input
									type="text"
									placeholder="e.g. Brooklyn NY, London, Toronto"
									value={location}
									onChange={e => setLocation(e.target.value)}
									disabled={scraping}
									className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-50 text-sm"
									required
								/>
							</div>
						</div>

						{error && (
							<div className="p-3 bg-red-950/40 border border-red-900/60 text-red-400 rounded-xl text-xs flex items-start gap-2">
								<AlertCircle size={15} className="shrink-0 mt-0.5" />
								<span>{error}</span>
							</div>
						)}

						<div className="pt-2">
							{scraping ? (
								<button
									type="button"
									onClick={handleStopScrape}
									className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20"
								>
									<Square size={16} fill="white" />
									<span>Stop Scraping</span>
								</button>
							) : (
								<button
									type="submit"
									disabled={loading || !niche.trim() || !location.trim()}
									className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/20"
								>
									{loading ? (
										<Loader2 size={16} className="animate-spin" />
									) : (
										<Play size={16} fill="white" />
									)}
									<span>Start Scraping</span>
								</button>
							)}
						</div>
					</form>
				</div>

				{/* Live Stats */}
				<div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
						<div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5">
							<Search size={120} className="text-amber-500" />
						</div>
						<div>
							<p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Leads Collected</p>
							<p className="text-5xl font-black text-white mt-4">{totalScraped}</p>
						</div>
						<div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
							{scraping && <Loader2 size={12} className="animate-spin text-amber-500" />}
							<span>{scraping ? `Currently scraping maps...` : 'Idle'}</span>
						</div>
					</div>

					<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
						<div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5">
							<Sparkles size={120} className="text-amber-500" />
						</div>
						<div>
							<p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Emails Enriched</p>
							<p className="text-5xl font-black text-amber-500 mt-4">{emailsFound}</p>
						</div>
						<div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
							{totalScraped > 0 && (
								<span>Enrichment rate: {Math.round((emailsFound / totalScraped) * 100)}%</span>
							)}
							{totalScraped === 0 && <span>No data</span>}
						</div>
					</div>
				</div>
			</div>

			{/* Console Logs Card */}
			<div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-96">
				<div className="flex items-center justify-between pb-4 border-b border-slate-800">
					<h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
						<span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
						<span>Live Scraper Console</span>
					</h3>
					{scraping && latestName && (
						<span className="text-xs text-slate-400 truncate max-w-xs">
							Scraping: <strong className="text-slate-200">{latestName}</strong>
						</span>
					)}
				</div>

				<div className="flex-1 overflow-y-auto mt-4 space-y-2 font-mono text-xs bg-slate-950 p-4 rounded-xl border border-slate-900">
					{logs.length === 0 ? (
						<p className="text-slate-600 italic">Console is ready. Enter keywords above and start scraping to see live logs.</p>
					) : (
						logs.map((log, index) => (
							<div key={index} className="flex gap-2 leading-relaxed">
								<span className="text-slate-600 select-none">[{log.time}]</span>
								<span className={
									log.type === 'success' ? 'text-emerald-400' :
									log.type === 'error' ? 'text-red-400' : 'text-slate-300'
								}>
									{log.message}
								</span>
							</div>
						))
					)}
					<div ref={logsEndRef} />
				</div>
			</div>
		</div>
	);
}
