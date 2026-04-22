import { useState, useEffect, useCallback } from 'react';
import { Search, X, Download, RefreshCw, AlertTriangle, Users, Wifi, WifiOff } from 'lucide-react';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { Contact } from '@/types/contact';
import { validateAndFormatPhone } from '@/lib/validation';

interface WAContact {
  phone: string;
  name: string;
}

interface WhatsAppContactsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (contacts: Contact[]) => void;
  isWhatsAppConnected: boolean;
}

export function WhatsAppContactsDrawer({
  isOpen,
  onClose,
  onLoad,
  isWhatsAppConnected,
}: WhatsAppContactsDrawerProps) {
  const [contacts, setContacts] = useState<WAContact[]>([]);
  const [filtered, setFiltered] = useState<WAContact[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiFetch(API_ENDPOINTS.whatsapp.contacts);
      const json = await res.json();
      if (json.success) {
        const data: WAContact[] = json.data || [];
        // Sort: contacts with names first, then by name
        data.sort((a, b) => {
          if (a.name && !b.name) return -1;
          if (!a.name && b.name) return 1;
          return (a.name || a.phone).localeCompare(b.name || b.phone);
        });
        setContacts(data);
        setFiltered(data);
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
    if (isOpen && isWhatsAppConnected) {
      fetchContacts();
      setSearch('');
      setSelected({});
    }
  }, [isOpen, isWhatsAppConnected, fetchContacts]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      contacts.filter(
        (c) => c.name?.toLowerCase().includes(q) || c.phone.includes(q),
      ),
    );
  }, [search, contacts]);

  const toggleSelect = (phone: string) =>
    setSelected((prev) => ({ ...prev, [phone]: !prev[phone] }));

  const selectAll = () => {
    const next: Record<string, boolean> = {};
    filtered.forEach((c) => { next[c.phone] = true; });
    setSelected(next);
  };

  const deselectAll = () => setSelected({});

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const allSelected = filtered.length > 0 && filtered.every((c) => selected[c.phone]);

  const handleLoad = () => {
    const chosen = filtered.filter((c) => selected[c.phone]);
    const sessionContacts: Contact[] = chosen.map((c, i) => {
      const validation = validateAndFormatPhone(c.phone);
      return {
        id: `wa-${c.phone}-${i}`,
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">WhatsApp Contacts</h2>
              <p className="text-xs text-green-200">
                {isLoading ? 'Loading...' : `${contacts.length} contact${contacts.length !== 1 ? 's' : ''} from your WhatsApp`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isWhatsAppConnected && (
              <button
                onClick={fetchContacts}
                title="Refresh"
                disabled={isLoading}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
            )}
            <button
              onClick={onClose}
              title="Close"
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* WhatsApp not connected */}
        {!isWhatsAppConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <WifiOff size={32} className="text-gray-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-800 mb-1">WhatsApp Not Connected</p>
              <p className="text-sm text-gray-500">
                Connect your WhatsApp account first to view and import your contacts.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Search & toolbar */}
            <div className="px-4 py-3 border-b border-gray-100 space-y-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={allSelected ? deselectAll : selectAll}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  Select all
                </label>
                {selectedCount > 0 && (
                  <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    {selectedCount} selected
                  </span>
                )}
              </div>
            </div>

            {/* Contact list */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <RefreshCw size={22} className="animate-spin mr-2" />
                  <span className="text-sm">Fetching contacts from WhatsApp...</span>
                </div>
              )}

              {!isLoading && error && (
                <div className="flex flex-col items-center justify-center py-16 text-red-500 gap-2">
                  <AlertTriangle size={28} />
                  <p className="text-sm text-center px-4">{error}</p>
                  <button
                    onClick={fetchContacts}
                    className="text-xs text-green-600 underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!isLoading && !error && filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                  <Wifi size={40} className="opacity-30" />
                  <p className="text-sm font-medium">
                    {contacts.length === 0
                      ? 'No contacts found in your WhatsApp'
                      : 'No contacts match your search'}
                  </p>
                  {contacts.length === 0 && (
                    <p className="text-xs text-center max-w-xs">
                      Your WhatsApp contact list may be empty or still syncing. Try refreshing after a moment.
                    </p>
                  )}
                </div>
              )}

              {!isLoading && !error && filtered.length > 0 && (
                <ul className="divide-y divide-gray-100">
                  {filtered.map((contact) => {
                    const isSelectedContact = !!selected[contact.phone];
                    const validation = validateAndFormatPhone(contact.phone);
                    const initials = contact.name
                      ? contact.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
                      : contact.phone.slice(-2);

                    return (
                      <li
                        key={contact.phone}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${
                          isSelectedContact ? 'bg-green-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleSelect(contact.phone)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelectedContact}
                          onChange={() => toggleSelect(contact.phone)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 shrink-0"
                        />
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-green-700">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {contact.name || <span className="italic text-gray-400">No name</span>}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {validation.formattedPhone || contact.phone}
                          </p>
                        </div>
                        {!validation.isValid && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                            invalid
                          </span>
                        )}
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Download size={16} />
                Load {selectedCount > 0 ? `${selectedCount} Selected` : 'Selected'} Contacts
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
