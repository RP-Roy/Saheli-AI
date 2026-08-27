import React, { useState } from 'react';
import {
  Users, Plus, Phone, Edit2, Trash2, ShieldCheck,
  CheckCircle2, AlertCircle, Info, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ContactModal } from './ContactModal';
import { useApp } from '../../context/AppContext';
import { maskPhoneNumber, type TrustedContactData } from '../../services/trustedContactService';
import { cn } from '../../utils/formatters';

interface EmergencyCircleProps {
  className?: string;
  showTitle?: boolean;
}

const AVATAR_GRADIENTS = [
  'from-rose-500 to-pink-500',
  'from-primary-500 to-rose-400',
  'from-fuchsia-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
];

export function EmergencyCircle({ className, showTitle = true }: EmergencyCircleProps) {
  const { contacts, addContact, updateContact, toggleContact, removeContact } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<TrustedContactData | null>(null);
  const [dialerNotice, setDialerNotice] = useState<string | null>(null);
  const [revealedPhoneIds, setRevealedPhoneIds] = useState<Record<string, boolean>>({});

  const handleOpenAdd = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (contact: TrustedContactData) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleSaveContact = async (contactPayload: Omit<TrustedContactData, 'id'>) => {
    if (editingContact && editingContact.id) {
      return updateContact(editingContact.id, contactPayload);
    }
    return addContact(contactPayload);
  };

  const handleToggle = async (contact: TrustedContactData) => {
    if (!contact.id) return;
    await toggleContact(contact.id, !contact.enabled);
  };

  const handleRemove = async (contact: TrustedContactData) => {
    if (!contact.id) return;
    const confirmDelete = window.confirm(`Remove ${contact.name} from your emergency circle?`);
    if (confirmDelete) {
      await removeContact(contact.id);
    }
  };

  const handleCallClick = (contactName: string) => {
    setDialerNotice(`Opening phone dialer to call ${contactName}...`);
    setTimeout(() => {
      setDialerNotice(null);
    }, 4500);
  };

  const toggleRevealPhone = (id: string) => {
    setRevealedPhoneIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const activeCount = contacts.filter(c => c.enabled).length;
  const isMaxReached = contacts.length >= 5;

  return (
    <div className={cn('glass-card overflow-hidden bg-white/95', className)}>
      {/* Header */}
      {showTitle && (
        <div className="px-6 py-5 border-b border-pink-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">EMERGENCY CIRCLE</h2>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blush-100 text-primary-700 border border-pink-200">
                  {contacts.length}/5
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeCount} active for instant SOS notification & one-tap emergency calls
              </p>
            </div>
          </div>

          <Button
            id="add-emergency-contact-btn"
            variant="outline"
            size="sm"
            disabled={isMaxReached}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleOpenAdd}
            className={cn(isMaxReached && 'opacity-50 cursor-not-allowed')}
          >
            Add Contact
          </Button>
        </div>
      )}

      {/* Dialer Notice Notification */}
      {dialerNotice && (
        <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-primary-50 border border-primary-200 flex items-center gap-2.5 text-primary-800 text-xs font-medium animate-fade-in shadow-sm">
          <Info className="w-4 h-4 flex-shrink-0 text-primary-600" />
          <p className="leading-snug">
            {dialerNotice} <span className="text-slate-500">Your phone will open the dialer so you can place the call.</span>
          </p>
        </div>
      )}

      {/* Contact List */}
      <div className="divide-y divide-pink-50">
        {contacts.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blush-100 text-primary-500 flex items-center justify-center mx-auto shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No emergency contacts configured</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Add up to 5 trusted family members or friends who will receive SOS alerts with your live location.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenAdd}
            >
              Add First Contact
            </Button>
          </div>
        ) : (
          contacts.map((contact, index) => {
            const initials = contact.name
              .split(' ')
              .map(p => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            const gradient = AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length];
            const isRevealed = !!(contact.id && revealedPhoneIds[contact.id]);
            const displayPhone = isRevealed ? contact.phone : maskPhoneNumber(contact.phone);

            return (
              <div
                key={contact.id || index}
                className={cn(
                  'flex items-center gap-3.5 px-6 py-4 transition-colors',
                  contact.enabled ? 'hover:bg-blush-50/60' : 'opacity-60 bg-slate-50/60'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-2xl bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm',
                    gradient
                  )}
                >
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">{contact.name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blush-100 text-primary-800 border border-pink-200/70 flex-shrink-0">
                      {contact.relationship}
                    </span>
                    {contact.enabled ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Disabled
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => contact.id && toggleRevealPhone(contact.id)}
                      className="text-xs text-slate-500 font-mono hover:text-primary-600 transition-colors"
                      title="Click to view/mask number"
                    >
                      {displayPhone}
                    </button>
                    {contact.consent_given && (
                      <span className="text-[10px] text-emerald-700 flex items-center gap-0.5 font-semibold" title="Consent recorded">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Consent recorded</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Call Button */}
                  <a
                    href={`tel:${contact.phone}`}
                    onClick={() => handleCallClick(contact.name)}
                    className={cn(
                      'px-3.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm',
                      contact.enabled
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 active:scale-95'
                        : 'bg-slate-100 border-slate-200 text-slate-400'
                    )}
                    aria-label={`Call ${contact.name}`}
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Call</span>
                  </a>

                  {/* Enable / Disable Toggle */}
                  <button
                    onClick={() => handleToggle(contact)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                    title={contact.enabled ? 'Disable contact notifications' : 'Enable contact notifications'}
                    aria-label={contact.enabled ? 'Disable contact' : 'Enable contact'}
                  >
                    {contact.enabled ? (
                      <ToggleRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(contact)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                    title="Edit contact"
                    aria-label="Edit contact"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(contact)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Remove contact"
                    aria-label="Remove contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3.5 bg-blush-50/70 border-t border-pink-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary-500" />
          Encrypted & strictly authorized by you
        </span>
        <span className="font-bold text-primary-700">{contacts.length} / 5 configured</span>
      </div>

      {/* Add / Edit Contact Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveContact}
        initialContact={editingContact}
        totalContactsCount={contacts.length}
      />
    </div>
  );
}
