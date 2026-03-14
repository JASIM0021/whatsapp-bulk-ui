import { Contact, ContactSelection } from '@/types/contact';
import { CheckCircle, XCircle, Phone } from 'lucide-react';

interface ContactsTableProps {
  contacts: Contact[];
  selection: ContactSelection;
  onSelectionChange: (selection: ContactSelection) => void;
}

export function ContactsTable({
  contacts,
  selection,
  onSelectionChange,
}: ContactsTableProps) {
  const allSelected = contacts.length > 0 && contacts.every((c) => selection[c.id]);
  const someSelected = contacts.some((c) => selection[c.id]);

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange({});
    } else {
      const newSelection: ContactSelection = {};
      contacts.forEach((contact) => {
        if (contact.isValid) {
          newSelection[contact.id] = true;
        }
      });
      onSelectionChange(newSelection);
    }
  };

  const handleSelectContact = (contactId: string) => {
    const newSelection = { ...selection };
    if (newSelection[contactId]) {
      delete newSelection[contactId];
    } else {
      newSelection[contactId] = true;
    }
    onSelectionChange(newSelection);
  };

  const validContacts = contacts.filter((c) => c.isValid);
  const invalidContacts = contacts.filter((c) => !c.isValid);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-gray-600">Total Contacts</p>
            <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Valid</p>
            <p className="text-2xl font-bold text-green-600">{validContacts.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Invalid</p>
            <p className="text-2xl font-bold text-red-600">{invalidContacts.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Selected</p>
            <p className="text-2xl font-bold text-primary-600">
              {Object.keys(selection).length}
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = someSelected && !allSelected;
                      }
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Row
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr
                  key={contact.id}
                  className={`hover:bg-gray-50 ${
                    !contact.isValid ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={!!selection[contact.id]}
                      onChange={() => handleSelectContact(contact.id)}
                      disabled={!contact.isValid}
                      className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 disabled:opacity-50"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {contact.isValid ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <XCircle className="text-red-500" size={20} />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contact.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {contact.formattedPhone}
                      </span>
                    </div>
                    {!contact.isValid && contact.validationError && (
                      <p className="text-xs text-red-600 mt-1">
                        {contact.validationError}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.row}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
