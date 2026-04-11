import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import {
  Users,
  BarChart3,
  Mail,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Shield,
  Crown,
  UserCheck,
  UserX,
  Clock,
  Send,
  RefreshCw,
  UserPlus,
  X,
  Pencil,
  Ban,
  CheckCircle2,
  Lock,
  User,
} from 'lucide-react';

/* ─── Types ─── */
interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  trialUsers: number;
  paidUsers: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status?: string;
  createdAt: string;
  subscription?: {
    plan: string;
    status: string;
    expiryDate: string;
    isActive: boolean;
    daysLeft: number;
  };
}

type Tab = 'dashboard' | 'users' | 'email';

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

/* ─── Dashboard Tab ─── */
function DashboardTab({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-500" />
        <StatCard icon={UserCheck} label="Active Subs" value={stats.activeSubscriptions} color="bg-green-500" />
        <StatCard icon={UserX} label="Expired Subs" value={stats.expiredSubscriptions} color="bg-red-500" />
        <StatCard icon={Clock} label="Trial Users" value={stats.trialUsers} color="bg-amber-500" />
        <StatCard icon={Crown} label="Paid Users" value={stats.paidUsers} color="bg-purple-500" />
      </div>
    </div>
  );
}

/* ─── Create User Modal ─── */
function CreateUserModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(''); setEmail(''); setPassword(''); setRole('user'); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('All fields are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.users, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to create user');
        return;
      }
      reset();
      onCreated();
      onClose();
    } catch {
      setError('Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
          <button onClick={() => { reset(); onClose(); }} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" required
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="flex gap-3">
              {(['user', 'admin'] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    role === r ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {r === 'admin' ? <Shield size={14} /> : <User size={14} />}
                  <span className="capitalize">{r}</span>
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          <button type="submit" disabled={saving}
            className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Edit User Modal ─── */
function EditUserModal({ open, user, onClose, onUpdated }: {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role as 'user' | 'admin');
      setError('');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setError('');
    setSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.user(user.id), {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), role }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Failed to update');
        return;
      }
      onUpdated();
      onClose();
    } catch {
      setError('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2.5 rounded-lg">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="flex gap-3">
              {(['user', 'admin'] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    role === r ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {r === 'admin' ? <Shield size={14} /> : <User size={14} />}
                  <span className="capitalize">{r}</span>
                </button>
              ))}
            </div>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          <button type="submit" disabled={saving}
            className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Users Tab ─── */
function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const limit = 15;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      const res = await apiFetch(`${API_ENDPOINTS.admin.users}?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users || []);
        setTotal(data.data.total || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleBlock = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    const action = newStatus === 'blocked' ? 'Block' : 'Unblock';
    if (!confirm(`${action} this user?`)) return;
    try {
      await apiFetch(API_ENDPOINTS.admin.user(userId), {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchUsers();
    } catch { /* ignore */ }
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`Delete user "${email}"? This will remove all their data and cannot be undone.`)) return;
    try {
      await apiFetch(API_ENDPOINTS.admin.user(userId), { method: 'DELETE' });
      fetchUsers();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Users ({total})</h2>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none w-64"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
              Search
            </button>
          </form>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <UserPlus size={16} />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Days Left</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <RefreshCw size={20} className="animate-spin inline-block mr-2" />
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">No users found</td>
                </tr>
              ) : (
                users.map((u) => {
                  const isBlocked = u.status === 'blocked';
                  const isSelf = u.id === currentUser?.id?.toString();
                  return (
                    <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${isBlocked ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                          {isBlocked && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase">Blocked</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {u.role === 'admin' ? <Shield size={12} /> : null}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`capitalize text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.subscription?.plan === 'free'
                            ? 'bg-amber-50 text-amber-700'
                            : u.subscription?.plan
                            ? 'bg-green-50 text-green-700'
                            : 'bg-gray-50 text-gray-500'
                        }`}>
                          {u.subscription?.plan || 'none'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                          u.subscription?.isActive ? 'text-green-600' : 'text-red-500'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${u.subscription?.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                          {u.subscription?.isActive ? 'Active' : 'Expired'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {u.subscription?.isActive ? `${u.subscription.daysLeft}d` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditingUser(u)}
                            title="Edit user"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => toggleBlock(u.id, u.status || 'active')}
                              title={isBlocked ? 'Unblock user' : 'Block user'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isBlocked
                                  ? 'text-green-500 hover:text-green-700 hover:bg-green-50'
                                  : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                              }`}
                            >
                              {isBlocked ? <CheckCircle2 size={15} /> : <Ban size={15} />}
                            </button>
                          )}
                          {!isSelf && (
                            <button
                              onClick={() => deleteUser(u.id, u.email)}
                              title="Delete user"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-xs font-medium text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateUserModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={fetchUsers} />
      <EditUserModal open={!!editingUser} user={editingUser} onClose={() => setEditingUser(null)} onUpdated={fetchUsers} />
    </div>
  );
}

/* ─── Email Tab ─── */
function EmailTab() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<'all' | 'active' | 'trial'>('all');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    if (!confirm(`Send promotional email to "${recipients}" users?`)) return;

    setSending(true);
    setResult(null);
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.sendEmail, {
        method: 'POST',
        body: JSON.stringify({ subject, body, recipients }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ sent: data.data.sent, failed: data.data.failed });
      } else {
        alert(data.error || 'Failed to send');
      }
    } catch {
      alert('Failed to send emails');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Send Promotional Email</h2>

      <form onSubmit={handleSend} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
          <div className="flex gap-3">
            {(['all', 'active', 'trial'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRecipients(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  recipients === r
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {r === 'all' ? 'All Users' : r === 'active' ? 'Active Subscribers' : 'Trial Users'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line..."
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body (HTML supported)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email content here... HTML tags are supported."
            required
            rows={10}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-y font-mono"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
            {sending ? 'Sending...' : 'Send Email'}
          </button>

          {result && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-600 font-medium">{result.sent} sent</span>
              {result.failed > 0 && (
                <span className="text-red-500 font-medium">{result.failed} failed</span>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

/* ─── Main Admin Panel ─── */
export function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/app', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.admin.stats);
        const data = await res.json();
        if (data.success) setStats(data.data);
      } catch { /* ignore */ }
      finally { setStatsLoading(false); }
    })();
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'email', label: 'Email', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/app')}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-xs text-gray-500">Manage users, subscriptions & emails</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield size={16} className="text-purple-500" />
              <span>{user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'dashboard' && <DashboardTab stats={stats} loading={statsLoading} />}
        {tab === 'users' && <UsersTab />}
        {tab === 'email' && <EmailTab />}
      </div>
    </div>
  );
}
