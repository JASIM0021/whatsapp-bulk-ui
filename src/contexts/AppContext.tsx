import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Contact, ContactSelection } from '@/types/contact';
import { Message } from '@/types/message';

interface AppContextType {
  // Contacts
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;

  // Selection
  selection: ContactSelection;
  setSelection: (selection: ContactSelection) => void;

  // WhatsApp status
  isWhatsAppConnected: boolean;
  setIsWhatsAppConnected: (connected: boolean) => void;

  // Message
  currentMessage: Message | null;
  setCurrentMessage: (message: Message | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selection, setSelection] = useState<ContactSelection>({});
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);

  return (
    <AppContext.Provider
      value={{
        contacts,
        setContacts,
        selection,
        setSelection,
        isWhatsAppConnected,
        setIsWhatsAppConnected,
        currentMessage,
        setCurrentMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
