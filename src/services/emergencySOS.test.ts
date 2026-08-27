import { describe, it, expect, beforeEach } from 'vitest';
import { trustedContactService, maskPhoneNumber, type TrustedContactData } from './trustedContactService';
import { incidentService, type IncidentData } from './incidentService';

describe('Emergency Contact and SOS System Tests', () => {
  beforeEach(() => {
    trustedContactService.resetStore([]);
  });

  describe('1. Emergency Contact Consent & Validation', () => {
    it('rejects adding a contact if user consent is not given', async () => {
      const contactWithoutConsent: Omit<TrustedContactData, 'id'> = {
        user_id: 'test-user-1',
        name: 'Test Contact',
        relationship: 'Brother',
        phone: '+91 98765 00000',
        enabled: true,
        consent_given: false,
      };

      const result = await trustedContactService.addContact(contactWithoutConsent);
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('User consent is mandatory');
    });

    it('successfully stores contact with explicit consent and timestamp', async () => {
      const validContact: Omit<TrustedContactData, 'id'> = {
        user_id: 'test-user-1',
        name: 'Anjali Sharma',
        relationship: 'Sister',
        phone: '+91 98765 11111',
        enabled: true,
        consent_given: true,
      };

      const result = await trustedContactService.addContact(validContact);
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Anjali Sharma');
      expect(result.data?.consent_given).toBe(true);
      expect(result.data?.consent_timestamp).toBeDefined();
    });

    it('enforces maximum 5 emergency contacts limit', async () => {
      // Add 5 contacts
      for (let i = 1; i <= 5; i++) {
        const res = await trustedContactService.addContact({
          user_id: 'demo-user',
          name: `Contact ${i}`,
          relationship: 'Friend',
          phone: `+91 90000 0000${i}`,
          enabled: true,
          consent_given: true,
        });
        expect(res.data).toBeDefined();
      }

      // Attempting 6th contact should fail
      const overflowContact = await trustedContactService.addContact({
        user_id: 'demo-user',
        name: 'Contact 6',
        relationship: 'Friend',
        phone: '+91 90000 00006',
        enabled: true,
        consent_given: true,
      });

      expect(overflowContact.data).toBeNull();
      expect(overflowContact.error).toBeDefined();
      expect(overflowContact.error.message).toContain('Maximum limit of 5');
    });
  });

  describe('2. Contact Management (CRUD & Enable/Disable)', () => {
    it('supports editing an existing contact', async () => {
      const added = await trustedContactService.addContact({
        user_id: 'demo-user',
        name: 'Vikram Mehta',
        relationship: 'Friend',
        phone: '+91 98765 22222',
        enabled: true,
        consent_given: true,
      });

      expect(added.data?.id).toBeDefined();
      const contactId = added.data!.id!;

      const updated = await trustedContactService.updateContact(contactId, {
        name: 'Vikram Mehta (Colleague)',
        relationship: 'Colleague',
      });

      expect(updated.error).toBeNull();
      expect(updated.data?.name).toBe('Vikram Mehta (Colleague)');
      expect(updated.data?.relationship).toBe('Colleague');
    });

    it('supports enabling and disabling contacts without deleting', async () => {
      const added = await trustedContactService.addContact({
        user_id: 'demo-user',
        name: 'Pooja Roy',
        relationship: 'Mother',
        phone: '+91 98765 33333',
        enabled: true,
        consent_given: true,
      });

      const contactId = added.data!.id!;

      // Disable
      const disabledRes = await trustedContactService.toggleContactEnabled(contactId, false);
      expect(disabledRes.data?.enabled).toBe(false);

      // Re-enable
      const enabledRes = await trustedContactService.toggleContactEnabled(contactId, true);
      expect(enabledRes.data?.enabled).toBe(true);
    });

    it('supports deleting a contact', async () => {
      const added = await trustedContactService.addContact({
        user_id: 'demo-user',
        name: 'Temporary Contact',
        relationship: 'Other',
        phone: '+91 98765 44444',
        enabled: true,
        consent_given: true,
      });

      const contactId = added.data!.id!;
      const deleteRes = await trustedContactService.removeContact(contactId);
      expect(deleteRes.error).toBeNull();

      const { data: contacts } = await trustedContactService.getContacts('demo-user');
      expect(contacts.find(c => c.id === contactId)).toBeUndefined();
    });
  });

  describe('3. Privacy & Phone Masking', () => {
    it('correctly masks phone numbers for display without leaking digits', () => {
      const maskedIndia = maskPhoneNumber('+91 98765 43210');
      expect(maskedIndia).toContain('••••');
      expect(maskedIndia).toContain('+91');
      expect(maskedIndia).toContain('210');

      const maskedShort = maskPhoneNumber('1234567890');
      expect(maskedShort).toContain('••••');
      expect(maskedShort).toContain('890');
    });
  });

  describe('4. Emergency SOS Incident Creation & Resolution', () => {
    it('creates an active high-risk incident when SOS is triggered', async () => {
      const incidentPayload: IncidentData = {
        user_id: 'demo-user',
        risk_level: 'HIGH_RISK',
        latitude: 12.9352,
        longitude: 77.6890,
        location_name: 'Bellandur Junction, Bengaluru',
        sos_message: 'SAHELI SOS: Immediate assistance requested.',
      };

      const { data: incident, error } = await incidentService.triggerIncident(incidentPayload);
      expect(error).toBeNull();
      expect(incident).toBeDefined();
      expect(incident?.id).toBeDefined();
      expect(incident?.risk_level).toBe('HIGH_RISK');
      expect(incident?.response_status).toBe('OPEN');
    });

    it('resolves an open incident and updates its response status', async () => {
      const { data: incident } = await incidentService.triggerIncident({
        user_id: 'demo-user',
        risk_level: 'HIGH_RISK',
      });

      const resolveRes = await incidentService.resolveIncident(incident!.id!, 'RESOLVED');
      expect(resolveRes.error).toBeNull();
      expect(resolveRes.data?.response_status).toBe('RESOLVED');
      expect(resolveRes.data?.resolved_at).toBeDefined();
    });
  });

  describe('5. Real SOS SMS Format & Delivery Rules', () => {
    it('generates exact required SOS message format with live coordinates', async () => {
      const dispatchResult = await incidentService.sendSOSNotification('inc-test-001', {
        demoLocation: { lat: 12.9352, lng: 77.6890 },
      });

      expect(dispatchResult.success).toBe(true);
      expect(dispatchResult.incidentId).toBe('inc-test-001');
      // Format: "SAHELI SOS: [Name] may need assistance. Latest location: [map link]. Incident: [ID]."
      expect(dispatchResult.message).toBe(
        'SAHELI SOS: Demo User may need assistance. Latest location: https://maps.google.com/?q=12.9352,77.689. Incident: inc-test-001.'
      );
    });

    it('generates exact required SOS message with "Location unavailable." when coordinates are missing', async () => {
      const dispatchResult = await incidentService.sendSOSNotification('inc-test-002', {
        demoLocation: {}, // no coordinates
      });

      expect(dispatchResult.success).toBe(true);
      expect(dispatchResult.message).toBe(
        'SAHELI SOS: Demo User may need assistance. Latest location: Location unavailable.. Incident: inc-test-002.'
      );
    });

    it('returns delivery status per contact in Demo Mode without sending real SMS', async () => {
      const dispatchResult = await incidentService.sendSOSNotification('demo-inc-003', {
        demoLocation: { lat: 12.9716, lng: 77.5946 },
      });

      expect(dispatchResult.success).toBe(true);
      expect(dispatchResult.deliveryStatus).toBe('SIMULATED');
      expect(dispatchResult.results.length).toBe(3);
      expect(dispatchResult.results[0].status).toBe('SIMULATED');
      expect(dispatchResult.results[0].maskedPhone).toContain('••••');
      expect(dispatchResult.providerConfigured).toBe(false);
    });
  });
});
