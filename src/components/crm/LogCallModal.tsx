import React, { useState } from 'react';
import { PhoneCall, X, Send } from 'lucide-react';
import { RestaurantProfile, CrmUser } from '../../types/onboarding';

interface LogCallModalProps {
  lead: RestaurantProfile | null;
  isOpen: boolean;
  currentUser?: CrmUser;
  onClose: () => void;
  onLogCall: (restaurantId: string, author: string, outcome: string, notes: string) => Promise<void>;
}

const OUTCOMES = [
  'Answered - Interested',
  'Answered - Follow Up Needed',
  'No Answer / Left Voicemail',
  'Call Scheduled',
  'Not Interested',
];

export const LogCallModal: React.FC<LogCallModalProps> = ({
  lead,
  isOpen,
  currentUser,
  onClose,
  onLogCall,
}) => {
  const [outcome, setOutcome] = useState(OUTCOMES[0]);
  const [callNotes, setCallNotes] = useState('');
  const author = currentUser
    ? `${currentUser.name} (${currentUser.role === 'admin' ? 'Admin' : 'Sales'})`
    : 'Alexandre (Admin)';
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callNotes.trim()) return;

    setIsSubmitting(true);
    try {
      await onLogCall(lead.id, author, outcome, callNotes.trim());
      setCallNotes('');
      onClose();
    } catch (e) {
      console.error('Failed to log call', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="portal-modal-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '100%' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            borderBottom: '1px solid #E2E8F0',
            paddingBottom: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PhoneCall size={18} />
            </div>
            <div>
              <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                Log Call with {lead.restaurantName}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Owner: {lead.ownerName} • {lead.phone}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid #E2E8F0',
              background: '#FAF8F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="portal-form-label">Call Outcome *</label>
            <select
              className="portal-input"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              style={{ cursor: 'pointer', fontWeight: 600 }}
            >
              {OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="portal-form-label">Call Notes & Discussion Summary *</label>
            <textarea
              required
              rows={4}
              className="portal-input"
              style={{ height: 'auto', padding: '0.75rem', fontFamily: 'inherit', resize: 'vertical' }}
              placeholder="Discussed delivery radius, confirmed menu dishes, sent commission contract..."
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#64748B',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !callNotes.trim()}
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: '#059669',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
            >
              <Send size={14} /> Log Call (#{lead.callAttempts + 1})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
