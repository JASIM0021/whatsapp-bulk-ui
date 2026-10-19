import { useState, useEffect } from 'react';
import {
  Globe, Mail, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Copy, Check,
  Plus, Trash2, KeyRound, ExternalLink, Sparkles, ChevronDown, ChevronUp, Server,
  Loader2, Zap, HelpCircle, X, ShieldAlert, ArrowRight
} from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { useNavigate } from 'react-router-dom';

interface DomainRecord {
  id: string;
  domain: string;
  isVerified: boolean;
  dkimSelector: string;
  dkimPublicKey: string;
  spfRecord: string;
  mxRecord: string;
  dnsStatus?: {
    mxValid: boolean;
    spfValid: boolean;
    dkimValid: boolean;
    dmarcValid: boolean;
    details: string;
    lastChecked: string;
  };
  createdAt: string;
}

interface MailboxRecord {
  id: string;
  domainId: string;
  domain: string;
  username: string;
  email: string;
  status: string;
  createdAt: string;
}

interface MailboxQuota {
  domainsCount: number;
  mailboxesUsed: number;
  mailboxesLimit: number;
  canCreateMore: boolean;
  hasServiceAccess: boolean;
  mailServerHost: string;
  serverIP: string;
}

export function DomainEmailPage({ isPaid }: { isPaid?: boolean }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [mailboxes, setMailboxes] = useState<MailboxRecord[]>([]);
  const [quota, setQuota] = useState<MailboxQuota | null>(null);
  const [expandedDomainId, setExpandedDomainId] = useState<string | null>(null);

  // Modals
  const [addDomainOpen, setAddDomainOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [domainSubmitting, setDomainSubmitting] = useState(false);

  const [addMailboxOpen, setAddMailboxOpen] = useState(false);
  const [mailboxDomainId, setMailboxDomainId] = useState('');
  const [mailboxUser, setMailboxUser] = useState('');
  const [mailboxPwd, setMailboxPwd] = useState('');
  const [mailboxSubmitting, setMailboxSubmitting] = useState(false);

  const [resetPwdOpen, setResetPwdOpen] = useState(false);
  const [activeMailbox, setActiveMailbox] = useState<MailboxRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  const [clientConfigOpen, setClientConfigOpen] = useState(false);
  const [configMailbox, setConfigMailbox] = useState<MailboxRecord | null>(null);

  const [verifyingDomainId, setVerifyingDomainId] = useState<string | null>(null);
  const [connectingMailboxId, setConnectingMailboxId] = useState<string | null>(null);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [bannerMsg, setBannerMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [resQuota, resDomains, resMailboxes] = await Promise.all([
        apiFetch(API_ENDPOINTS.email.mailboxQuota),
        apiFetch(API_ENDPOINTS.email.domains),
        apiFetch(API_ENDPOINTS.email.mailboxes),
      ]);

      const [dataQuota, dataDomains, dataMailboxes] = await Promise.all([
        resQuota.json(),
        resDomains.json(),
        resMailboxes.json(),
      ]);

      if (dataQuota.success && dataQuota.data) setQuota(dataQuota.data);
      if (dataDomains.success && dataDomains.data) {
        setDomains(dataDomains.data);
        if (dataDomains.data.length > 0 && !expandedDomainId) {
          setExpandedDomainId(dataDomains.data[0].id);
        }
      }
      if (dataMailboxes.success && dataMailboxes.data) setMailboxes(dataMailboxes.data);
    } catch {
      setBannerMsg({ text: 'Failed to load domain email data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setDomainSubmitting(true);
    setBannerMsg(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.email.domains, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setDomains(prev => [data.data, ...prev]);
        setExpandedDomainId(data.data.id);
        setNewDomain('');
        setAddDomainOpen(false);
        setBannerMsg({ text: `Domain ${data.data.domain} registered! Please configure your DNS records below.`, type: 'success' });
        loadData();
      } else {
        setBannerMsg({ text: data.error || 'Failed to add domain.', type: 'error' });
      }
    } catch {
      setBannerMsg({ text: 'Error connecting to server.', type: 'error' });
    } finally {
      setDomainSubmitting(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    setVerifyingDomainId(domainId);
    setBannerMsg(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.email.verifyDomain(domainId), { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data) {
        setDomains(prev => prev.map(d => (d.id === domainId ? data.data : d)));
        if (data.data.isVerified) {
          setBannerMsg({ text: `All DNS records verified successfully for ${data.data.domain}!`, type: 'success' });
        } else {
          setBannerMsg({ text: `DNS check completed: ${data.data.dnsStatus?.details || 'Some records are still propagating.'}`, type: 'error' });
        }
      } else {
        setBannerMsg({ text: data.error || 'Verification check failed.', type: 'error' });
      }
    } catch {
      setBannerMsg({ text: 'Network error verifying domain.', type: 'error' });
    } finally {
      setVerifyingDomainId(null);
    }
  };

  const handleDeleteDomain = async (domainId: string, domainName: string) => {
    if (!confirm(`Are you sure you want to remove ${domainName}? Any associated mailboxes will also be deleted from the server.`)) {
      return;
    }
    try {
      const res = await apiFetch(API_ENDPOINTS.email.domain(domainId), { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDomains(prev => prev.filter(d => d.id !== domainId));
        setMailboxes(prev => prev.filter(m => m.domainId !== domainId));
        setBannerMsg({ text: `Domain ${domainName} deleted.`, type: 'success' });
        loadData();
      } else {
        setBannerMsg({ text: data.error || 'Failed to delete domain.', type: 'error' });
      }
    } catch {
      setBannerMsg({ text: 'Error deleting domain.', type: 'error' });
    }
  };

  const handleAddMailbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailboxDomainId || !mailboxUser.trim()) return;
    setMailboxSubmitting(true);
    setBannerMsg(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.email.mailboxes, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainId: mailboxDomainId,
          username: mailboxUser.trim(),
          password: mailboxPwd.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMailboxes(prev => [data.data, ...prev]);
        setMailboxUser('');
        setMailboxPwd('');
        setAddMailboxOpen(false);
        setBannerMsg({ text: `Mailbox ${data.data.email} created on server!`, type: 'success' });
        loadData();
      } else {
        setBannerMsg({ text: data.error || 'Failed to create mailbox.', type: 'error' });
      }
    } catch {
      setBannerMsg({ text: 'Error creating mailbox.', type: 'error' });
    } finally {
      setMailboxSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMailbox || !newPassword.trim()) return;
    setPwdSubmitting(true);
    setBannerMsg(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.email.mailboxPassword(activeMailbox.id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResetPwdOpen(false);
        setNewPassword('');
        setActiveMailbox(null);
        setBannerMsg({ text: `Password updated for ${activeMailbox.email}`, type: 'success' });
      } else {
        setBannerMsg({ text: data.error || 'Failed to update password.', type: 'error' });
      }
    } catch {
      setBannerMsg({ text: 'Error updating password.', type: 'error' });
    } finally {
      setPwdSubmitting(false);
    }
  };

  const handleDeleteMailbox = async (mailboxId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete mailbox ${email}? All emails stored in this box will be purged.`)) {
      return;
    }
    try {
      const res = await apiFetch(API_ENDPOINTS.email.mailbox(mailboxId), { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMailboxes(prev => prev.filter(m => m.id !== mailboxId));
        setBannerMsg({ text: `Mailbox ${email} removed.`, type: 'success' });
        loadData();
      } else {
        setBannerMsg({ text: data.error || 'Failed to delete mailbox.', type: 'error' });
      }
    } catch {
      setBannerMsg({ text: 'Error deleting mailbox.', type: 'error' });
    }
  };

  const handleConnectSMTP = async (mailbox: MailboxRecord) => {
    setConnectingMailboxId(mailbox.id);
    setBannerMsg(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.email.mailboxConnectSMTP(mailbox.id), { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBannerMsg({
          text: `Success! ${mailbox.email} is now connected as your active Nexbotix Sender SMTP. You can send campaigns immediately!`,
          type: 'success',
        });
      } else {
        setBannerMsg({ text: data.error || 'Failed to connect mailbox to SMTP.', type: 'error' });
      }
    } catch {
      setBannerMsg({ text: 'Error connecting mailbox to SMTP.', type: 'error' });
    } finally {
      setConnectingMailboxId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <p className="text-sm">Loading custom domain email services...</p>
      </div>
    );
  }

  const serverHost = quota?.mailServerHost || 'mail.nexbotix.online';
  const serverIP = quota?.serverIP || '185.194.218.30';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <Globe className="text-blue-400" size={24} />
              Custom Domain Business Email
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Docker Mailserver
            </span>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Host professional email mailboxes on your own custom domain with DKIM, SPF & DMARC deliverability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setAddDomainOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/30 transition-all"
          >
            <Plus size={15} />
            <span>Add Custom Domain</span>
          </button>
          {domains.length > 0 && (
            <button
              onClick={() => {
                if (domains.length > 0) setMailboxDomainId(domains[0].id);
                setAddMailboxOpen(true);
              }}
              disabled={!quota?.canCreateMore}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Mail size={15} />
              <span>Create Mailbox</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner message */}
      {bannerMsg && (
        <div
          className={`flex items-start justify-between p-3.5 rounded-xl border text-xs sm:text-sm ${
            bannerMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/40 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {bannerMsg.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-400 shrink-0" />
            )}
            <span>{bannerMsg.text}</span>
          </div>
          <button onClick={() => setBannerMsg(null)} className="text-slate-400 hover:text-white ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Quota & Server Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Mailboxes Quota */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Mailboxes Capacity</p>
            <p className="text-xl font-bold text-white mt-1">
              {quota?.mailboxesUsed || 0}{' '}
              <span className="text-xs font-normal text-slate-500">
                / {quota?.mailboxesLimit === 100 ? '100 (Admin Unlimited)' : `${quota?.mailboxesLimit || 5} included`}
              </span>
            </p>
            <div className="w-32 bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (((quota?.mailboxesUsed || 0) / (quota?.mailboxesLimit || 5)) * 100))}%`,
                }}
              />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Mail size={18} />
          </div>
        </div>

        {/* Connected Domains */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Connected Domains</p>
            <p className="text-xl font-bold text-white mt-1">{domains.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {domains.filter(d => d.isVerified).length} verified & active
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Globe size={18} />
          </div>
        </div>

        {/* Mail Host Gateway */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Mail Server Gateway</p>
            <p className="text-xs font-mono font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {serverHost}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">IP: {serverIP}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Server size={18} />
          </div>
        </div>
      </div>

      {/* Upgrade CTA if not active */}
      {quota && !quota.hasServiceAccess && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border border-blue-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Unlock Custom Business Email</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Get 5 custom mailboxes on your own domain with DKIM security & 1-Click Nexbotix Sender connection for ₹199/mo.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/subscription')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shrink-0 shadow-lg shadow-blue-900/40 transition-all"
          >
            <span>View Plan Details</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Domains Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span>Your Custom Domains</span>
            <span className="text-xs text-slate-500 font-normal">({domains.length})</span>
          </h2>
        </div>

        {domains.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Globe size={24} />
            </div>
            <p className="text-sm font-semibold text-white">No domains registered yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Add your domain (e.g. <code>mycompany.com</code>) to automatically generate DKIM keys and view the DNS setup instructions.
            </p>
            <button
              onClick={() => setAddDomainOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <Plus size={14} />
              <span>Add Your First Domain</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map(d => {
              const isExpanded = expandedDomainId === d.id;
              const isVerifying = verifyingDomainId === d.id;

              return (
                <div key={d.id} className="rounded-2xl bg-slate-900/70 border border-slate-800 overflow-hidden">
                  {/* Domain Header Row */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <Globe size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-semibold text-white text-sm sm:text-base">{d.domain}</span>
                          {d.isVerified ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 size={11} /> Verified
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                              <AlertCircle size={11} /> DNS Setup Required
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Added {new Date(d.createdAt).toLocaleDateString()}
                          {d.dnsStatus?.lastChecked && ` • Checked ${new Date(d.dnsStatus.lastChecked).toLocaleTimeString()}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVerifyDomain(d.id)}
                        disabled={isVerifying}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
                        title="Query live DNS records"
                      >
                        <RefreshCw size={12} className={isVerifying ? 'animate-spin text-blue-400' : ''} />
                        <span>{isVerifying ? 'Checking DNS...' : 'Verify DNS'}</span>
                      </button>

                      <button
                        onClick={() => setExpandedDomainId(isExpanded ? null : d.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <span>DNS Guide</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      <button
                        onClick={() => handleDeleteDomain(d.id, d.domain)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete domain"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* DNS Instructions Expandable Panel */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-300">
                          Configure these 4 DNS records at your domain registrar (GoDaddy, Cloudflare, Namecheap):
                        </p>
                        <span className="text-[11px] text-slate-500">Propagation usually takes 2–15 minutes</span>
                      </div>

                      <div className="space-y-2">
                        {/* MX Record */}
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300">
                              MX
                            </span>
                            <div>
                              <p className="text-xs text-slate-400 font-mono">
                                Host: <span className="text-white">@</span> (or {d.domain}) • Priority: <span className="text-white">10</span>
                              </p>
                              <p className="text-xs font-mono text-slate-200 mt-0.5 font-semibold">
                                {d.mxRecord || serverHost}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {d.dnsStatus && (
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  d.dnsStatus.mxValid
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                                }`}
                              >
                                {d.dnsStatus.mxValid ? 'Active' : 'Missing'}
                              </span>
                            )}
                            <button
                              onClick={() => copyToClipboard(`mx-${d.id}`, d.mxRecord || serverHost)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              {copiedKey === `mx-${d.id}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>

                        {/* SPF Record */}
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300">
                              TXT
                            </span>
                            <div>
                              <p className="text-xs text-slate-400 font-mono">
                                Host: <span className="text-white">@</span> (SPF Authentication)
                              </p>
                              <p className="text-xs font-mono text-slate-200 mt-0.5 font-semibold break-all">
                                {d.spfRecord}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {d.dnsStatus && (
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  d.dnsStatus.spfValid
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                                }`}
                              >
                                {d.dnsStatus.spfValid ? 'Active' : 'Missing'}
                              </span>
                            )}
                            <button
                              onClick={() => copyToClipboard(`spf-${d.id}`, d.spfRecord)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              {copiedKey === `spf-${d.id}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>

                        {/* DKIM Record */}
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 shrink-0">
                              TXT
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs text-slate-400 font-mono">
                                Host: <span className="text-white">mail._domainkey</span> (2048-bit DKIM Key)
                              </p>
                              <p className="text-xs font-mono text-slate-200 mt-0.5 font-semibold truncate max-w-md sm:max-w-xl">
                                {d.dkimPublicKey ? `v=DKIM1; h=sha256; k=rsa; p=${d.dkimPublicKey}` : 'Generating key...'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {d.dnsStatus && (
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  d.dnsStatus.dkimValid
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                                }`}
                              >
                                {d.dnsStatus.dkimValid ? 'Active' : 'Missing'}
                              </span>
                            )}
                            <button
                              onClick={() =>
                                copyToClipboard(`dkim-${d.id}`, `v=DKIM1; h=sha256; k=rsa; p=${d.dkimPublicKey}`)
                              }
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              {copiedKey === `dkim-${d.id}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>

                        {/* DMARC Record */}
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300">
                              TXT
                            </span>
                            <div>
                              <p className="text-xs text-slate-400 font-mono">
                                Host: <span className="text-white">_dmarc</span>
                              </p>
                              <p className="text-xs font-mono text-slate-200 mt-0.5 font-semibold">
                                v=DMARC1; p=none; sp=none;
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {d.dnsStatus && (
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  d.dnsStatus.dmarcValid
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                                }`}
                              >
                                {d.dnsStatus.dmarcValid ? 'Active' : 'Missing'}
                              </span>
                            )}
                            <button
                              onClick={() => copyToClipboard(`dmarc-${d.id}`, 'v=DMARC1; p=none; sp=none;')}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            >
                              {copiedKey === `dmarc-${d.id}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mailboxes Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Mail className="text-indigo-400" size={18} />
              <span>Provisioned Mailboxes</span>
              <span className="text-xs text-slate-500 font-normal">({mailboxes.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live email inboxes running on Docker Mailserver. Use the 1-Click Connect button to send campaigns from this address immediately.
            </p>
          </div>

          {domains.length > 0 && (
            <button
              onClick={() => {
                setMailboxDomainId(domains[0].id);
                setAddMailboxOpen(true);
              }}
              disabled={!quota?.canCreateMore}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Plus size={14} />
              <span>Create Mailbox</span>
            </button>
          )}
        </div>

        {mailboxes.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Mail size={24} />
            </div>
            <p className="text-sm font-semibold text-white">No mailboxes created yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Create your custom business email addresses (e.g. <code>support@{domains[0]?.domain || 'yourdomain.com'}</code>).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {mailboxes.map(m => {
              const isConnecting = connectingMailboxId === m.id;

              return (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-3 group hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-semibold shrink-0">
                        {m.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white font-mono break-all">{m.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Created {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setActiveMailbox(m);
                          setResetPwdOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Reset mailbox password"
                      >
                        <KeyRound size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteMailbox(m.id, m.email)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete mailbox"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleConnectSMTP(m)}
                      disabled={isConnecting}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-900/30 transition-all disabled:opacity-50"
                    >
                      <Zap size={13} className={isConnecting ? 'animate-bounce text-amber-300' : 'text-amber-400'} />
                      <span>{isConnecting ? 'Connecting Sender...' : 'Connect to Nexbotix Sender'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setConfigMailbox(m);
                        setClientConfigOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
                      title="View IMAP / SMTP client setup parameters"
                    >
                      <HelpCircle size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal: Add Custom Domain ────────────────────────────────────────── */}
      {addDomainOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe size={18} className="text-blue-400" />
                Add Custom Domain
              </h3>
              <button onClick={() => setAddDomainOpen(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddDomain} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Domain Name (Root domain or subdomain)
                </label>
                <input
                  type="text"
                  placeholder="brand.com or mail.brand.com"
                  value={newDomain}
                  onChange={e => setNewDomain(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Upon adding, 2048-bit DKIM keys are automatically generated on the mail server.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddDomainOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={domainSubmitting || !newDomain.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50"
                >
                  {domainSubmitting && <Loader2 size={13} className="animate-spin" />}
                  <span>Generate DKIM & Add</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Add Mailbox ──────────────────────────────────────────────── */}
      {addMailboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Mail size={18} className="text-indigo-400" />
                Create Business Mailbox
              </h3>
              <button onClick={() => setAddMailboxOpen(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddMailbox} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Domain</label>
                <select
                  value={mailboxDomainId}
                  onChange={e => setMailboxDomainId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {domains.map(d => (
                    <option key={d.id} value={d.id}>
                      @{d.domain} {d.isVerified ? '✓' : '(unverified)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Username / Prefix</label>
                <div className="flex items-center rounded-xl bg-slate-800 border border-slate-700 overflow-hidden focus-within:border-blue-500">
                  <input
                    type="text"
                    placeholder="support, hello, sales"
                    value={mailboxUser}
                    onChange={e => setMailboxUser(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
                    required
                  />
                  <span className="px-3 text-xs text-slate-400 font-mono">
                    @{domains.find(d => d.id === mailboxDomainId)?.domain || 'domain.com'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password (optional, auto-generated if left blank)
                </label>
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={mailboxPwd}
                  onChange={e => setMailboxPwd(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddMailboxOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mailboxSubmitting || !mailboxUser.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50"
                >
                  {mailboxSubmitting && <Loader2 size={13} className="animate-spin" />}
                  <span>Provision Mailbox</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Reset Password ───────────────────────────────────────────── */}
      {resetPwdOpen && activeMailbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound size={18} className="text-amber-400" />
                Reset Mailbox Password
              </h3>
              <button onClick={() => setResetPwdOpen(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Updating password for <strong className="text-white font-mono">{activeMailbox.email}</strong>.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPwdOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwdSubmitting || newPassword.length < 8}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all disabled:opacity-50"
                >
                  {pwdSubmitting && <Loader2 size={13} className="animate-spin" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Email Client Setup Instructions ─────────────────────────── */}
      {clientConfigOpen && configMailbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Server size={18} className="text-blue-400" />
                Client Setup (Outlook, Apple Mail, Thunderbird)
              </h3>
              <button onClick={() => setClientConfigOpen(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Use these settings to connect <strong className="text-white font-mono">{configMailbox.email}</strong> to any desktop or mobile mail app:
            </p>

            <div className="space-y-3">
              {/* IMAP Incoming */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Incoming Server (IMAP)</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Host:</span> <code className="text-white font-mono">{serverHost}</code>
                  </div>
                  <div>
                    <span className="text-slate-400">Port:</span> <code className="text-white font-mono">993 (SSL/TLS)</code>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Username:</span> <code className="text-white font-mono">{configMailbox.email}</code>
                  </div>
                </div>
              </div>

              {/* SMTP Outgoing */}
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Outgoing Server (SMTP)</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Host:</span> <code className="text-white font-mono">{serverHost}</code>
                  </div>
                  <div>
                    <span className="text-slate-400">Port:</span> <code className="text-white font-mono">587 (STARTTLS) or 465 (SSL)</code>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Username:</span> <code className="text-white font-mono">{configMailbox.email}</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setClientConfigOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
