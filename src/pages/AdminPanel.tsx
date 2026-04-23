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
  FileText,
  Settings,
  History,
  Tag,
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
    messagesUsed: number;
    messageLimit: number;
  };
}

type Tab = 'dashboard' | 'users' | 'email' | 'invoices' | 'plans' | 'promos';

interface Invoice {
  id: string;
  invoiceNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: string;
  originalAmount: number;
  finalAmount: number;
  txnId: string;
  mihpayId: string;
  paymentDate: string;
  expiryDate: string;
  status: string;
  createdAt: string;
  sentAt?: string;
}

interface PlanConfigData {
  plan: string;
  amount: number;
  messageLimit: number;
}

interface ActivityData {
  payments: Array<{
    id: string;
    txnId: string;
    amount: number;
    plan: string;
    status: string;
    createdAt: string;
  }>;
  subscription: {
    messagesUsed: number;
    messageLimit: number;
    plan: string;
    status: string;
  };
}

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

  // Plan update state
  const [planToSet, setPlanToSet] = useState<'free' | 'monthly' | 'yearly'>('monthly');
  const [planDays, setPlanDays] = useState('');
  const [planSaving, setPlanSaving] = useState(false);
  const [planMsg, setPlanMsg] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role as 'user' | 'admin');
      setError('');
      setPlanMsg('');
      setPlanToSet((user.subscription?.plan as 'free' | 'monthly' | 'yearly') || 'monthly');
      setPlanDays('');
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

  const handlePlanUpdate = async () => {
    if (!user) return;
    setPlanSaving(true);
    setPlanMsg('');
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.updateUserPlan(user.id), {
        method: 'PUT',
        body: JSON.stringify({ plan: planToSet, daysToAdd: planDays ? parseInt(planDays) : 0 }),
      });
      const data = await res.json();
      if (data.success) {
        setPlanMsg(`Plan updated to ${planToSet} (expires ${data.data?.expiryDate})`);
        onUpdated();
      } else {
        setPlanMsg(data.error || 'Failed to update plan');
      }
    } catch {
      setPlanMsg('Network error');
    } finally {
      setPlanSaving(false);
    }
  };

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
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

        {/* Plan Update Section */}
        <div className="px-6 pb-6 border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Crown size={14} className="text-amber-500" /> Change Subscription Plan
          </p>
          <div className="space-y-3">
            <div className="flex gap-2">
              {(['free', 'monthly', 'yearly'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlanToSet(p)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors capitalize ${
                    planToSet === p
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                placeholder="Days (blank = default)"
                value={planDays}
                onChange={e => setPlanDays(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={handlePlanUpdate}
                disabled={planSaving}
                className="px-4 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {planSaving ? 'Updating…' : 'Update Plan'}
              </button>
            </div>
            {planMsg && (
              <p className={`text-xs rounded-lg px-3 py-2 ${planMsg.includes('updated') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {planMsg}
              </p>
            )}
          </div>
        </div>
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
  const [activityUser, setActivityUser] = useState<AdminUser | null>(null);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Users ({total})</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 sm:flex-initial">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none w-full sm:w-64"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors shrink-0">
              Search
            </button>
          </form>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
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
                        {u.subscription?.isActive
                          ? u.subscription.plan === 'free'
                            ? `${u.subscription.messagesUsed}/${u.subscription.messageLimit} msgs`
                            : `${u.subscription.daysLeft}d`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setActivityUser(u)}
                            title="View activity"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <History size={15} />
                          </button>
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
      <UserActivityModal open={!!activityUser} user={activityUser} onClose={() => setActivityUser(null)} />
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

/* ─── Invoices Tab ─── */
function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent'>('all');
  const [editingAmount, setEditingAmount] = useState<Record<string, string>>({});
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await apiFetch(`${API_ENDPOINTS.admin.invoices}?${params}`);
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data.invoices || []);
        setTotal(data.data.total || 0);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleSaveAmount = async (id: string) => {
    const amount = parseFloat(editingAmount[id] || '0');
    if (isNaN(amount) || amount <= 0) return;
    try {
      await apiFetch(API_ENDPOINTS.admin.invoice(id), {
        method: 'PUT',
        body: JSON.stringify({ finalAmount: amount }),
      });
      fetchInvoices();
    } catch { /* ignore */ }
    finally {
      setEditingAmount(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const handleApprove = async (inv: Invoice) => {
    const amountStr = editingAmount[inv.id];
    const amount = amountStr ? parseFloat(amountStr) : inv.finalAmount;
    if (!confirm(`Send invoice #${inv.invoiceNumber} to ${inv.userEmail} for ₹${amount}?`)) return;
    setApprovingId(inv.id);
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.approveInvoice(inv.id), {
        method: 'POST',
        body: JSON.stringify({ amount: amountStr ? amount : 0 }),
      });
      const data = await res.json();
      if (!data.success) { alert(data.error || 'Failed to approve'); return; }
      fetchInvoices();
    } catch { alert('Failed to send invoice'); }
    finally {
      setApprovingId(null);
      setEditingAmount(prev => { const n = { ...prev }; delete n[inv.id]; return n; });
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Invoices ({total})</h2>
        <div className="flex gap-2">
          {(['all', 'pending', 'sent'] as const).map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === s ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}>
              {s === 'all' ? 'All' : s === 'pending' ? 'Pending' : 'Sent'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Invoice #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Payment Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  <RefreshCw size={20} className="animate-spin inline-block mr-2" />Loading...
                </td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">No invoices found</td></tr>
              ) : invoices.map((inv) => {
                const isPending = inv.status === 'pending';
                const isEditing = editingAmount[inv.id] !== undefined;
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{inv.userName}</p>
                      <p className="text-xs text-gray-500">{inv.userEmail}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-xs text-gray-600">{inv.plan}</td>
                    <td className="px-4 py-3">
                      {isPending && isEditing ? (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs">₹</span>
                          <input type="number"
                            value={editingAmount[inv.id]}
                            onChange={e => setEditingAmount(prev => ({ ...prev, [inv.id]: e.target.value }))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-900">₹{(inv.finalAmount || 0).toLocaleString()}</span>
                          {isPending && (
                            <button onClick={() => setEditingAmount(prev => ({ ...prev, [inv.id]: String(inv.finalAmount) }))}
                              className="p-0.5 text-gray-400 hover:text-blue-600 transition-colors">
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isPending && (
                        <div className="flex items-center justify-end gap-1">
                          {isEditing && (
                            <button onClick={() => handleSaveAmount(inv.id)}
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                              Save
                            </button>
                          )}
                          <button onClick={() => handleApprove(inv)}
                            disabled={approvingId === inv.id}
                            className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors disabled:opacity-50">
                            {approvingId === inv.id ? 'Sending...' : 'Approve & Send'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 text-xs font-medium text-gray-600">{page}/{totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Plans Tab ─── */
function PlansTab() {
  const [planConfigs, setPlanConfigs] = useState<PlanConfigData[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(API_ENDPOINTS.admin.plans);
        const data = await res.json();
        if (data.success) {
          setPlanConfigs(data.data || []);
          const vals: Record<string, string> = {};
          for (const p of (data.data || []) as PlanConfigData[]) {
            vals[p.plan] = p.plan === 'free' ? String(p.messageLimit) : String(p.amount);
          }
          setEditValues(vals);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async (planName: string) => {
    const val = parseFloat(editValues[planName] || '0');
    if (isNaN(val) || val < 0) return;
    setSaving(planName);
    try {
      const body = planName === 'free'
        ? { messageLimit: Math.floor(val) }
        : { amount: val };
      const res = await apiFetch(API_ENDPOINTS.admin.plan(planName), {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(planName);
        setTimeout(() => setSaved(null), 2000);
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch { alert('Failed to save plan config'); }
    finally { setSaving(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={24} className="animate-spin text-gray-400" />
    </div>
  );

  const planMeta: Record<string, { label: string; description: string; prefix?: string; suffix: string }> = {
    starter:         { label: 'Starter Monthly',  description: 'Starter plan monthly price',      prefix: '₹', suffix: '/month' },
    starter_yearly:  { label: 'Starter Yearly',   description: 'Starter plan yearly price',       prefix: '₹', suffix: '/year' },
    growth:          { label: 'Growth Monthly',   description: 'Growth plan monthly price',       prefix: '₹', suffix: '/month' },
    growth_yearly:   { label: 'Growth Yearly',    description: 'Growth plan yearly price',        prefix: '₹', suffix: '/year' },
    business:        { label: 'Business Monthly', description: 'Business plan monthly price',     prefix: '₹', suffix: '/month' },
    business_yearly: { label: 'Business Yearly',  description: 'Business plan yearly price',      prefix: '₹', suffix: '/year' },
    addon_messages:  { label: 'Msg Add-On',       description: '+1,000 messages add-on price',   prefix: '₹', suffix: '/pack' },
    free:            { label: 'Free Trial',        description: 'Message limit for free trial',                suffix: ' messages' },
    monthly:         { label: 'Legacy Monthly',   description: 'Legacy ₹500 grandfathered plan', prefix: '₹', suffix: '/month' },
    yearly:          { label: 'Legacy Yearly',    description: 'Legacy ₹5K grandfathered plan',  prefix: '₹', suffix: '/year' },
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Plan Pricing</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {['starter', 'starter_yearly', 'growth', 'growth_yearly', 'business', 'business_yearly', 'addon_messages', 'free', 'monthly', 'yearly'].map(planName => {
          const meta = planMeta[planName];
          if (!meta) return null;
          const isSaved = saved === planName;
          const isSaving = saving === planName;
          return (
            <div key={planName} className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-1">{meta.label}</h3>
              <p className="text-xs text-gray-500 mb-4">{meta.description}</p>
              <div className="flex items-center gap-1 mb-3">
                {meta.prefix && <span className="text-gray-500 text-sm">{meta.prefix}</span>}
                <input
                  type="number"
                  value={editValues[planName] ?? ''}
                  onChange={e => setEditValues(prev => ({ ...prev, [planName]: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  min="0"
                  step="1"
                />
                <span className="text-gray-500 text-sm">{meta.suffix}</span>
              </div>
              <button onClick={() => handleSave(planName)} disabled={isSaving}
                className={`w-full py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors ${
                  isSaved ? 'bg-green-500' : 'bg-green-600 hover:bg-green-700'
                }`}>
                {isSaved ? '✓ Saved!' : isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          );
        })}
      </div>
      {planConfigs.length === 0 && !loading && (
        <p className="text-sm text-gray-400">No plan configs found — defaults are in use.</p>
      )}
    </div>
  );
}

/* ─── Promos Tab ─── */
interface PromoCodeData {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxUses: number;
  timesUsed: number;
  isActive: boolean;
  applicablePlans: string[];
  expiresAt?: string;
  createdAt: string;
}

function PromosTab() {
  const [promos, setPromos] = useState<PromoCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    maxUses: '0',
    applicablePlans: [] as string[],
    expiresAt: '',
  });
  const [formError, setFormError] = useState('');

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.promos);
      const data = await res.json();
      if (data.success) setPromos(data.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPromos(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const val = parseFloat(form.discountValue);
    if (!form.code.trim()) { setFormError('Code is required'); return; }
    if (isNaN(val) || val <= 0) { setFormError('Discount value must be > 0'); return; }
    if (form.discountType === 'percentage' && val > 100) { setFormError('Percentage must be ≤ 100'); return; }
    setSaving(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.admin.promos, {
        method: 'POST',
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          discountType: form.discountType,
          discountValue: val,
          maxUses: parseInt(form.maxUses) || 0,
          applicablePlans: form.applicablePlans,
          expiresAt: form.expiresAt || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) { setFormError(data.error || 'Failed to create'); return; }
      setShowCreate(false);
      setForm({ code: '', discountType: 'percentage', discountValue: '', maxUses: '0', applicablePlans: [], expiresAt: '' });
      fetchPromos();
    } catch { setFormError('Failed to create promo code'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (promo: PromoCodeData) => {
    try {
      await apiFetch(API_ENDPOINTS.admin.promo(promo.id), {
        method: 'PUT',
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      fetchPromos();
    } catch { /* ignore */ }
  };

  const handleDelete = async (promo: PromoCodeData) => {
    if (!confirm(`Delete promo code "${promo.code}"?`)) return;
    try {
      await apiFetch(API_ENDPOINTS.admin.promo(promo.id), { method: 'DELETE' });
      fetchPromos();
    } catch { /* ignore */ }
  };

  const togglePlan = (plan: string) => {
    setForm(prev => ({
      ...prev,
      applicablePlans: prev.applicablePlans.includes(plan)
        ? prev.applicablePlans.filter(p => p !== plan)
        : [...prev.applicablePlans, plan],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Promo Codes</h2>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Tag size={15} />
          New Promo
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Promo Code</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {formError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="SUMMER20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500 outline-none uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <div className="flex gap-2">
                  {(['percentage', 'fixed'] as const).map(type => (
                    <button type="button" key={type}
                      onClick={() => setForm(p => ({ ...p, discountType: type }))}
                      className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors ${
                        form.discountType === type
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'border-gray-300 text-gray-600 hover:border-purple-400'
                      }`}
                    >
                      {type === 'percentage' ? '% Percentage' : '₹ Fixed Amount'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value ({form.discountType === 'percentage' ? '%' : '₹'})
                </label>
                <input
                  type="number"
                  value={form.discountValue}
                  onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
                  min="0.01" step="0.01"
                  placeholder={form.discountType === 'percentage' ? '20' : '100'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses (0 = unlimited)</label>
                <input
                  type="number"
                  value={form.maxUses}
                  onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                  min="0" step="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Applicable Plans (empty = all)</label>
                <div className="flex gap-2">
                  {['monthly', 'yearly'].map(plan => (
                    <button type="button" key={plan}
                      onClick={() => togglePlan(plan)}
                      className={`flex-1 py-2 text-sm rounded-lg border font-medium capitalize transition-colors ${
                        form.applicablePlans.includes(plan)
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'border-gray-300 text-gray-600 hover:border-sky-400'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-gray-400" />
        </div>
      ) : promos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Tag size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">No promo codes yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Code</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Discount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Uses</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Plans</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Expires</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Active</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {promos.map(promo => (
                <tr key={promo.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-4 font-mono font-semibold text-purple-700">{promo.code}</td>
                  <td className="py-3 px-4">
                    {promo.discountType === 'percentage'
                      ? `${promo.discountValue}%`
                      : `₹${promo.discountValue}`}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {promo.timesUsed}{promo.maxUses > 0 ? `/${promo.maxUses}` : ''}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {promo.applicablePlans.length === 0 ? 'All' : promo.applicablePlans.join(', ')}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {promo.expiresAt || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleActive(promo)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${promo.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${promo.isActive ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleDelete(promo)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── User Activity Modal ─── */
function UserActivityModal({ open, user, onClose }: {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
}) {
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setActivity(null);
    setLoading(true);
    apiFetch(API_ENDPOINTS.admin.userActivity(user.id))
      .then(r => r.json())
      .then(data => { if (data.success) setActivity(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, user]);

  if (!open || !user) return null;

  const totalPaid = activity?.payments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{user.name}'s Activity</h3>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={20} className="animate-spin text-gray-400" />
            </div>
          ) : activity ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-blue-600 font-medium mb-1">Messages Used</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {activity.subscription.messagesUsed || 0}
                    {(activity.subscription.messageLimit || 0) > 0 && (
                      <span className="text-sm font-normal text-blue-600">/{activity.subscription.messageLimit}</span>
                    )}
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-green-600 font-medium mb-1">Total Paid</p>
                  <p className="text-2xl font-bold text-green-900">₹{totalPaid.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment History</h4>
                {activity.payments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No payments yet</p>
                ) : (
                  <div className="space-y-2">
                    {activity.payments.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">{p.plan} plan</p>
                          <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">₹{(p.amount || 0).toLocaleString()}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            p.status === 'success' ? 'bg-green-100 text-green-700' :
                            p.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">Failed to load activity</p>
          )}
        </div>
      </div>
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
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'plans', label: 'Plans', icon: Settings },
    { id: 'promos', label: 'Promos', icon: Tag },
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
        {tab === 'invoices' && <InvoicesTab />}
        {tab === 'plans' && <PlansTab />}
        {tab === 'promos' && <PromosTab />}
        {tab === 'email' && <EmailTab />}
      </div>
    </div>
  );
}
