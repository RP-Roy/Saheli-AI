import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, User, Heart, Phone as PhoneIcon, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import type { TrustedContactData } from '../../services/trustedContactService';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: Omit<TrustedContactData, 'id'>) => Promise<{ success: boolean; error?: string }>;
  initialContact?: TrustedContactData | null;
  totalContactsCount: number;
}

const RELATIONSHIP_OPTIONS = [
  'Mother',
  'Father',
  'Sister',
  'Brother',
  'Spouse',
  'Partner',
  'Best Friend',
  'Friend',
  'Guardian',
  'Colleague',
  'Other',
];

export function ContactModal({
  isOpen,
  onClose,
  onSave,
  initialContact,
  totalContactsCount,
}: ContactModalProps) {
  const isEditing = !!initialContact;

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('Mother');
  const [customRelation, setCustomRelation] = useState('');
  const [phone, setPhone] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialContact) {
      setName(initialContact.name || '');
      const rel = initialContact.relationship || 'Mother';
      if (RELATIONSHIP_OPTIONS.includes(rel)) {
        setRelationship(rel);
        setCustomRelation('');
      } else {
        setRelationship('Other');
        setCustomRelation(rel);
      }
      setPhone(initialContact.phone || '');
      setConsentGiven(initialContact.consent_given ?? true);
      setErrorMessage(null);
    } else {
      setName('');
      setRelationship('Mother');
      setCustomRelation('');
      setPhone('+91 ');
      setConsentGiven(false);
      setErrorMessage(null);
    }
  }, [initialContact, isOpen]);

  if (!isOpen) return null;

  const finalRelationship = relationship === 'Other' ? customRelation.trim() : relationship;
  const digits = phone.replace(/[^\d]/g, '');
  const isPhoneValid = digits.length >= 10;
  const isNameValid = name.trim().length >= 2;
  const isRelationValid = finalRelationship.length > 0;
  const canSave = isNameValid && isRelationValid && isPhoneValid && consentGiven && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    if (!isEditing && totalContactsCount >= 5) {
      setErrorMessage('You can configure a maximum of 5 emergency contacts.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const contactPayload: Omit<TrustedContactData, 'id'> = {
      user_id: initialContact?.user_id || 'demo-user',
      name: name.trim(),
      relationship: finalRelationship,
      phone: phone.trim(),
      enabled: initialContact?.enabled ?? true,
      consent_given: true,
      consent_timestamp: initialContact?.consent_timestamp || new Date().toISOString(),
    };

    const res = await onSave(contactPayload);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.error || 'Failed to save contact.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md bg-surface-900 border border-white/15 rounded-3xl p-6 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
      >
        {/* Ambient background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center text-primary-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="contact-modal-title" className="text-lg font-bold text-white">
                {isEditing ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Update contact details & preferences' : 'Add to your trusted emergency circle'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-800 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-danger-500/15 border border-danger-500/30 flex items-start gap-2.5 text-danger-300 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="contact-name" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary-400" /> Full Name <span className="text-danger-400">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Relationship Field */}
          <div>
            <label htmlFor="contact-relation" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-pink-400" /> Relationship <span className="text-danger-400">*</span>
            </label>
            <select
              id="contact-relation"
              value={relationship}
              onChange={e => setRelationship(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-white/10 text-white text-sm focus:outline-none focus:border-primary-500 transition-colors"
            >
              {RELATIONSHIP_OPTIONS.map(rel => (
                <option key={rel} value={rel} className="bg-surface-900 text-white">
                  {rel}
                </option>
              ))}
            </select>
            {relationship === 'Other' && (
              <input
                type="text"
                required
                placeholder="Specify relationship"
                value={customRelation}
                onChange={e => setCustomRelation(e.target.value)}
                className="mt-2 w-full px-3.5 py-2 rounded-xl bg-surface-800 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500 transition-colors"
              />
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="contact-phone" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <PhoneIcon className="w-3.5 h-3.5 text-safe-400" /> Phone Number <span className="text-danger-400">*</span>
            </label>
            <input
              id="contact-phone"
              type="tel"
              required
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary-500 transition-colors font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Include country code (e.g. +91 for India)
            </p>
          </div>

          {/* Explicit Consent Box */}
          <div className="p-3.5 rounded-2xl bg-surface-800/80 border border-white/10 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                id="emergency-consent-checkbox"
                type="checkbox"
                checked={consentGiven}
                onChange={e => setConsentGiven(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-600 text-primary-600 focus:ring-primary-500 bg-surface-900 cursor-pointer accent-primary-500"
              />
              <span className="text-xs text-slate-200 leading-relaxed select-none">
                I give Saheli permission to securely store this contact and use it for emergency notifications.
              </span>
            </label>
            <p className="text-[10px] text-slate-400 pl-6 leading-tight">
              Emergency contacts are protected under Row Level Security and never disclosed publicly.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              fullWidth
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              id="save-contact-btn"
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={!canSave}
            >
              {isEditing ? 'Save Changes' : 'Save Contact'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
