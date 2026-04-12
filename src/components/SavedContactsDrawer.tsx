import { useState, useEffect, useCallback } from 'react';
import { BookUser, Search, X, Trash2, CheckCircle2, XCircle, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { Contact } from '@/types/contact';
import { validateAndFormatPhone } from '@/lib/validation';

interface SavedContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  createdAt: string;
}

interface SavedContactsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (contacts: Contact[]) => void;
}

export function SavedContactsDrawer({ isOpen, onClose, onLoad }: SavedContactsDrawerProps) {
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [filtered, setFiltered] = useState<SavedContact[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.contacts.list);
      const json = await res.json();
      if (json.success) {
        setContacts(json.data || []);
        setFiltered(json.data || []);
      } else {
        setError(json.error || 'Failed to load contacts');
      }
    } catch {
      setError('Network error — check your connection');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
      setSearch('');
      setSelected({});
    }
  }, [isOpen, fetchContacts]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      contacts.filter(
        (c) => c.name?.toLowerCase().includes(q) || c.phone.includes(q),
      ),
    );
  }, [search, contacts]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectAll = () => {
    const next: Record<string, boolean> = {};
    filtered.forEach((c) => { next[c.id] = true; });
    setSelected(next);
  };

  const deselectAll = () => setSelected({});

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const allSelected = filtered.length > 0 && filtered.every((c) => selected[c.id]);

  const handleLoad = () => {
    const chosen = filtered.filter((c) => selected[c.id]);
    const sessionContacts: Contact[] = chosen.map((c, i) => {
      const validation = validateAndFormatPhone(c.phone);
      return {
        id: `saved-${c.id}-${i}`,
        name: c.name || undefined,
        phone: c.phone,
        formattedPhone: validation.formattedPhone,
        isValid: validation.isValid,
        validationError: validation.error,
        row: i + 1,
      };
    });
    onLoad(sessionContacts);
    onClose();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiFetch(API_ENDPOINTS.contacts.delete(id), { method: 'DELETE' });
      setContacts((prev) => prev.filter((c) => c.id !== id));
      setSelected((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete ALL saved contacts? This cannot be undone.')) return;
    setIsDeletingAll(true);
    try {
      await apiFetch(API_ENDPOINTS.contacts.deleteAll, { method: 'DELETE' });
      setContacts([]);
      setSelected({});
    } catch {
      // ignore
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <BookUser size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">My Contacts Book</h2>
              <p className="text-xs text-primary-200">
                {contacts.length} saved contact{contacts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchContacts}
              title="Refresh"
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & toolbar */}
        <div className="px-4 py-3 border-b border-gray-100 space-y-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={allSelected ? deselectAll : selectAll}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Select all
              </label>
              {selectedCount > 0 && (
                <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                  {selectedCount} selected
                </span>
              )}
            </div>

            {contacts.length > 0 && (
              <button
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
              >
                <Trash2 size={13} />
                {isDeletingAll ? 'Deleting...' : 'Delete All'}
              </button>
            )}
          </div>
        </div>

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <RefreshCw size={22} className="animate-spin mr-2" />
              <span className="text-sm">Loading contacts...</span>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-16 text-red-500 gap-2">
              <AlertTriangle size={28} />
              <p className="text-sm">{error}</p>
              <button
                onClick={fetchContacts}
                className="text-xs text-primary-600 underline"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <BookUser size={40} className="opacity-30" />
              <p className="text-sm font-medium">
                {contacts.length === 0
                  ? 'No contacts saved yet'
                  : 'No contacts match your search'}
              </p>
              {contacts.length === 0 && (
                <p className="text-xs text-center max-w-xs">
                  Upload a file or manually add contacts — they'll be saved here automatically for next time.
                </p>
              )}
            </div>
          )}

          {!isLoading && !error && filtered.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {filtered.map((contact) => {
                const isSelectedContact = !!selected[contact.id];
                return (
                  <li
                    key={contact.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      isSelectedContact ? 'bg-primary-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelectedContact}
                      onChange={() => toggleSelect(contact.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contact.name || <span className="italic text-gray-400">No name</span>}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">{contact.phone}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {validateAndFormatPhone(contact.phone).isValid ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : (
                        <XCircle size={16} className="text-red-400" />
                      )}
                      <button
                        onClick={() => handleDelete(contact.id)}
                        disabled={deletingId === contact.id}
                        title="Delete contact"
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleLoad}
            disabled={selectedCount === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download size={16} />
            Load {selectedCount > 0 ? `${selectedCount} Selected` : 'Selected'} Contacts
          </button>
        </div>
      </div>
    </>
  );
}
