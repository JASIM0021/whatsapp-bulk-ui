import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { ArrowLeft, Loader2, RefreshCw, ChevronLeft, ChevronRight, Mail, Phone, ExternalLink, Calendar, MessageSquare, X, Bot, Users } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  sourceDomain: string;
  createdAt: string;
  chatHistory?: { role: string; content: string }[];
}

export function WebsiteChatbotLeadsPage({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Lead | null>(null);
  const limit = 20;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      const res = await apiFetch(`${API_ENDPOINTS.websiteChatbot.leads}?offset=${offset}&limit=${limit}`);
      const d = await res.json();
      if (d.success) {
        setLeads(Array.isArray(d.data) ? d.data : []);
        setTotal(d.pagination?.total ?? d.data?.length ?? 0);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className={embedded ? "w-full" : "min-h-screen bg-gray-50 flex flex-col"}>
      {/* Header */}
      {!embedded && (
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/website-chatbot')} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Chatbot Leads</h1>
                <p className="text-sm text-gray-500">You have captured <span className="font-semibold text-gray-700">{total}</span> leads</p>
              </div>
            </div>
            <button onClick={fetchLeads} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              <RefreshCw size={16} className={loading ? 'animate-spin text-gray-400' : 'text-gray-500'} />
              Refresh
            </button>
          </div>
        </div>
      )}

      <div className={embedded ? "" : "flex-1 max-w-6xl mx-auto w-full px-6 py-8"}>
        {embedded && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Lead Management</h2>
              <p className="text-sm text-gray-500">You have captured <span className="font-semibold text-gray-700">{total}</span> leads</p>
            </div>
            <button onClick={fetchLeads} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              <RefreshCw size={16} className={loading ? 'animate-spin text-gray-400' : 'text-gray-500'} />
              Refresh
            </button>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="px-6 py-4">Lead</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-20 text-gray-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-3 text-green-600" />
                    <p className="text-sm">Loading your leads...</p>
                  </td></tr>
                ) : leads.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-24">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Users size={32} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No leads captured yet</h3>
                      <p className="text-sm text-gray-500 text-center mb-6">When visitors leave their contact info in your chatbot, they will appear here.</p>
                      <button onClick={() => navigate('/website-chatbot?tab=embed')}
                        className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-black transition-colors shadow-sm">
                        View Installation Guide
                      </button>
                    </div>
                  </td></tr>
                ) : leads.map(lead => (
                  <tr key={lead.id} 
                    onClick={() => setSelected(lead)}
                    className="group hover:bg-gray-50/80 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-green-700 font-bold uppercase shadow-inner">
                          {lead.name ? lead.name.charAt(0) : '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">{lead.name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MessageSquare size={12} /> {lead.chatHistory?.length || 0} messages
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} onClick={e=>e.stopPropagation()} className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                          <Mail size={14} className="text-gray-400" /> {lead.email}
                        </a>
                      )}
                      {lead.phone && (
                        <span className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={14} className="text-gray-400" /> {lead.phone}
                        </span>
                      )}
                      {!lead.email && !lead.phone && <span className="text-sm text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {lead.sourceDomain ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium rounded-md">
                          <ExternalLink size={12} /> {lead.sourceDomain}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg group-hover:border-green-300 group-hover:text-green-700 transition-colors shadow-sm">
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/50 mt-auto">
              <p className="text-sm text-gray-500">Showing <span className="font-medium text-gray-900">{(page - 1) * limit + 1}</span> to <span className="font-medium text-gray-900">{Math.min(page * limit, total)}</span> of <span className="font-medium text-gray-900">{total}</span></p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:bg-transparent shadow-sm transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:bg-transparent shadow-sm transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Drawer for Lead Details */}
      {selected && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSelected(null)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-green-700 text-xl font-bold uppercase shadow-inner">
                  {selected.name ? selected.name.charAt(0) : '?'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.name || 'Anonymous Lead'}</h2>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Calendar size={12}/> {new Date(selected.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors shadow-sm">
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto">
              {/* Contact Info Cards */}
              <div className="p-6 grid grid-cols-2 gap-4 border-b border-gray-100">
                {selected.email && (
                  <div className="col-span-2 sm:col-span-1 bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Email</span>
                    <a href={`mailto:${selected.email}`} className="text-sm font-medium text-gray-900 hover:text-green-600 truncate">{selected.email}</a>
                  </div>
                )}
                {selected.phone && (
                  <div className="col-span-2 sm:col-span-1 bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Phone</span>
                    <span className="text-sm font-medium text-gray-900">{selected.phone}</span>
                  </div>
                )}
                {selected.sourceDomain && (
                  <div className="col-span-2 sm:col-span-1 bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Source</span>
                    <span className="text-sm font-medium text-gray-900 truncate">{selected.sourceDomain}</span>
                  </div>
                )}
              </div>

              {/* Chat History Timeline */}
              {selected.chatHistory && selected.chatHistory.length > 0 ? (
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <MessageSquare size={16} className="text-gray-400" />
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Conversation Transcript</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {selected.chatHistory.map((msg, i) => {
                      const isUser = msg.role === 'user';
                      return (
                        <div key={i} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex max-w-[85%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className="flex-shrink-0 mt-auto">
                              {isUser ? (
                                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-700">{selected.name?selected.name.charAt(0):'U'}</div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-white"><Bot size={12}/></div>
                              )}
                            </div>
                            {/* Bubble */}
                            <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                              isUser 
                                ? 'bg-green-600 text-white rounded-br-sm' 
                                : 'bg-gray-100 text-gray-800 border border-gray-200 rounded-bl-sm'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400">
                  <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No chat transcript available.</p>
                </div>
              )}
            </div>
            
            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              {selected.email && (
                <a href={`mailto:${selected.email}`} className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-colors shadow-sm">
                  <Mail size={16} /> Reply via Email
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
