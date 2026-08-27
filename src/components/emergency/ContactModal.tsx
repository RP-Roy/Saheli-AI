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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md bg-white border border-pink-200/80 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
      >
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-pink-100/50 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-pink-100 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="contact-modal-title" className="text-base font-extrabold text-slate-900 tracking-tight">
                {isEditing ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditing ? 'Update contact details & preferences' : 'Add to your trusted emergency circle'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-blush-50 hover:bg-blush-100 border border-pink-200/70 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 relative z-10">
          {/* Name Field */}
          <div>
            <label htmlFor="contact-name" className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary-500" /> Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              required
              placeholder="e.g. Ananya Sharma"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-blush-50/60 border border-pink-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-400 focus:bg-white transition-colors"
            />
          </div>

          {/* Relationship Field */}
          <div>
            <label htmlFor="contact-relation" className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500" /> Relationship <span className="text-rose-500">*</span>
            </label>
            <select
              id="contact-relation"
              value={relationship}
              onChange={e => setRelationship(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-blush-50/60 border border-pink-200 text-slate-800 text-sm focus:outline-none focus:border-primary-400 focus:bg-white transition-colors"
            >
              {RELATIONSHIP_OPTIONS.map(rel => (
                <option key={rel} value={rel} className="bg-white text-slate-800">
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
                className="mt-2 w-full px-4 py-2.5 rounded-2xl bg-blush-50/60 border border-pink-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-400 focus:bg-white transition-colors"
              />
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="contact-phone" className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <PhoneIcon className="w-3.5 h-3.5 text-emerald-600" /> Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              id="contact-phone"
              type="tel"
              required
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-blush-50/60 border border-pink-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-primary-400 focus:bg-white transition-colors font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Include country code (e.g. +91 for India)
            </p>
          </div>

          {/* Explicit Consent Box */}
          <div className="p-4 rounded-2xl bg-blush-50/80 border border-pink-200/80 space-y-1.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                id="emergency-consent-checkbox"
                type="checkbox"
                checked={consentGiven}
                onChange={e => setConsentGiven(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-pink-300 text-primary-600 focus:ring-primary-400 cursor-pointer accent-primary-500"
              />
              <span className="text-xs text-slate-700 font-semibold leading-relaxed select-none">
                I give Saheli permission to securely store this contact and use it for emergency notifications.
              </span>
            </label>
            <p className="text-[10px] text-slate-500 pl-6 leading-tight">
              Emergency contacts are strictly private and used solely during SOS events.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
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
