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
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
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
    <div className={cn('glass-card overflow-hidden', className)}>
      {/* Header */}
      {showTitle && (
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">EMERGENCY CIRCLE</h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-700 text-slate-300 border border-white/10">
                  {contacts.length}/5
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {activeCount} active for instant SOS notification & emergency calls
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
        <div className="mx-5 mt-4 p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center gap-2.5 text-blue-300 text-xs animate-fade-in">
          <Info className="w-4 h-4 flex-shrink-0" />
          <p className="leading-snug">
            {dialerNotice} <span className="text-slate-400">Your phone will open the dialer so you can place the call.</span>
          </p>
        </div>
      )}

      {/* Contact List */}
      <div className="divide-y divide-white/5">
        {contacts.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-700/60 border border-white/10 flex items-center justify-center text-slate-400 mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">No emergency contacts configured</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
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
                  'flex items-center gap-3 px-5 py-3.5 transition-colors',
                  contact.enabled ? 'hover:bg-white/[0.02]' : 'opacity-60 bg-surface-900/30'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm',
                    gradient
                  )}
                >
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-100 truncate">{contact.name}</p>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-700 text-slate-300 border border-white/5 flex-shrink-0">
                      {contact.relationship}
                    </span>
                    {contact.enabled ? (
                      <span className="text-[10px] font-semibold text-safe-400 bg-safe-500/10 px-1.5 py-0.5 rounded border border-safe-500/20">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500 bg-surface-700/60 px-1.5 py-0.5 rounded border border-white/5">
                        Disabled
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    <button
                      onClick={() => contact.id && toggleRevealPhone(contact.id)}
                      className="text-xs text-slate-400 font-mono hover:text-slate-200 transition-colors"
                      title="Click to view/mask number"
                    >
                      {displayPhone}
                    </button>
                    {contact.consent_given && (
                      <span className="text-[10px] text-safe-400 flex items-center gap-0.5" title="Consent recorded">
                        <ShieldCheck className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Call Button (opens phone dialer) */}
                  <a
                    href={`tel:${contact.phone}`}
                    onClick={() => handleCallClick(contact.name)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all',
                      contact.enabled
                        ? 'bg-safe-500/15 border-safe-500/30 text-safe-300 hover:bg-safe-500/25 active:scale-95'
                        : 'bg-surface-700 border-white/10 text-slate-500 hover:text-slate-300'
                    )}
                    aria-label={`Call ${contact.name}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Call</span>
                  </a>

                  {/* Enable / Disable Toggle */}
                  <button
                    onClick={() => handleToggle(contact)}
                    className="p-1.5 text-slate-400 hover:text-white transition-colors"
                    title={contact.enabled ? 'Disable contact notifications' : 'Enable contact notifications'}
                    aria-label={contact.enabled ? 'Disable contact' : 'Enable contact'}
                  >
                    {contact.enabled ? (
                      <ToggleRight className="w-5 h-5 text-safe-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-500" />
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(contact)}
                    className="p-1.5 text-slate-400 hover:text-white transition-colors"
                    title="Edit contact"
                    aria-label="Edit contact"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(contact)}
                    className="p-1.5 text-slate-400 hover:text-danger-400 transition-colors"
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

      {/* Footer info note */}
      <div className="px-5 py-3 bg-surface-900/60 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-primary-400" />
          Encrypted & strictly authorized by you
        </span>
        <span>{contacts.length} / 5 configured</span>
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
