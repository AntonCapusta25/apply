import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  Store,
  ShieldCheck,
  MessageSquare,
  Send,
  PhoneCall,
  Rocket,
  Check,
  Copy,
  Utensils,
  RefreshCw,
  Plus,
  Printer,
  Gift,
  CheckCheck,
} from 'lucide-react';
import { RestaurantProfile, LeadStatus, CrmUser } from '../../types/onboarding';
import { sendOnboardingNotifications } from '../../services/emailService';

interface CrmLeadDetailsModalProps {
  lead: RestaurantProfile | null;
  isOpen: boolean;
  currentUser?: CrmUser;
  teamMembers?: CrmUser[];
  onClose: () => void;
  onStatusChange: (id: string, newStatus: LeadStatus) => void;
  onPriorityChange: (id: string, priority: 'low' | 'medium' | 'high') => void;
  onAssignLead?: (id: string, userId: string, userName: string) => void;
  onAddNote: (id: string, author: string, noteText: string) => void;
  onFollowUpDateChange: (id: string, date: string) => void;
  onOpenLogCall: (lead: RestaurantProfile) => void;
  onCreateMerchant: (leadId: string) => Promise<void>;
}

const STATUS_OPTIONS: { id: LeadStatus; label: string }[] = [
  { id: 'new', label: 'New Application' },
  { id: 'contacted', label: 'Contacted & In Review' },
  { id: 'menu_ready', label: 'Menu Uploaded & Verified' },
  { id: 'contract_pending', label: 'Contract Selected' },
  { id: 'merchant_created', label: 'Merchant Created' },
  { id: 'live', label: 'Active Live on Spoonfull' },
  { id: 'paused', label: 'On Hold / Declined' },
];

export const CrmLeadDetailsModal: React.FC<CrmLeadDetailsModalProps> = ({
  lead,
  isOpen,
  currentUser,
  teamMembers = [],
  onClose,
  onStatusChange,
  onPriorityChange,
  onAssignLead,
  onAddNote,
  onFollowUpDateChange,
  onOpenLogCall,
  onCreateMerchant,
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const authorName = currentUser
    ? `${currentUser.name} (${currentUser.role === 'admin' ? 'Admin' : 'Sales'})`
    : 'Team';
  const [isCreatingMerchant, setIsCreatingMerchant] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);

  if (!isOpen || !lead) return null;

  const handleResendEmail = async () => {
    if (!lead) return;
    setIsSendingEmail(true);
    setEmailStatusMsg(null);
    try {
      const res = await sendOnboardingNotifications(lead);
      if (res.adminNotified || res.restaurantNotified) {
        setEmailStatusMsg('Alert emailed to bangalexf@gmail.com & restaurant!');
      } else {
        setEmailStatusMsg('Email sent successfully');
      }
    } catch (err: any) {
      setEmailStatusMsg('Failed to send email');
    } finally {
      setIsSendingEmail(false);
      setTimeout(() => setEmailStatusMsg(null), 5000);
    }
  };

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddNote(lead.id, authorName, newNoteText.trim());
    setNewNoteText('');
  };

  const handleCreateMerchantClick = async () => {
    setIsCreatingMerchant(true);
    try {
      await onCreateMerchant(lead.id);
    } catch (e) {
      console.error('Merchant creation failed', e);
    } finally {
      setIsCreatingMerchant(false);
    }
  };

  const handleCopyMerchantCode = () => {
    if (lead.merchantCode) {
      navigator.clipboard.writeText(lead.merchantCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const cleanPhone = lead.phone.replace(/[^0-9]/g, '');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
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
        style={{ maxWidth: '860px', width: '100%', maxHeight: '92vh' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            borderBottom: '1px solid #E2E8F0',
            paddingBottom: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h2 className="font-display" style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0F172A' }}>
                {lead.restaurantName}
              </h2>
              <span
                style={{
                  background: '#FAF8F5',
                  border: '1px solid #E2E8F0',
                  color: 'var(--portal-brown)',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                }}
              >
                ● {STATUS_OPTIONS.find((s) => s.id === lead.leadStatus)?.label}
              </span>

              {lead.merchantCode && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#ECFDF5',
                    color: '#065F46',
                    border: '1px solid #A7F3D0',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                  }}
                >
                  <span>Merchant: {lead.merchantCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyMerchantCode}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#065F46' }}
                    title="Copy Merchant Code"
                  >
                    {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              )}
            </div>
            <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.2rem' }}>
              Owner: <strong style={{ color: '#0F172A' }}>{lead.ownerName}</strong> • {lead.city} • Applied:{' '}
              {new Date(lead.createdAt).toLocaleDateString('en-NL', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
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

        {/* Action Toolbar: Log Call, Create Merchant, Direct Contact */}
        <div
          style={{
            background: '#FAF8F5',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.85rem',
          }}
        >
          {/* Status & Priority selects */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#475569' }}>Stage:</span>
              <select
                className="portal-select-filter"
                value={lead.leadStatus}
                onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                style={{ fontWeight: 700, background: '#FFFFFF' }}
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#475569' }}>Priority:</span>
              <select
                className="portal-select-filter"
                value={lead.priority}
                onChange={(e) => onPriorityChange(lead.id, e.target.value as 'low' | 'medium' | 'high')}
                style={{ background: '#FFFFFF' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Assigned Salesperson / Deal Owner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#475569' }}>Rep:</span>
              {currentUser?.role === 'admin' ? (
                <select
                  className="portal-select-filter"
                  value={lead.assignedTo || 'unassigned'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'unassigned') {
                      onAssignLead?.(lead.id, '', '');
                    } else {
                      const found = teamMembers.find((u) => u.id === val);
                      if (found) {
                        onAssignLead?.(lead.id, found.id, found.name);
                      }
                    }
                  }}
                  style={{ background: '#FFFFFF', fontWeight: 700, color: lead.assignedTo ? 'var(--portal-brown)' : '#64748B' }}
                >
                  <option value="unassigned">Unassigned</option>
                  {teamMembers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role === 'admin' ? 'Admin' : 'Sales'})
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span
                    style={{
                      background: lead.assignedTo === currentUser?.id ? '#ECFDF5' : '#FFFFFF',
                      color: lead.assignedTo === currentUser?.id ? '#047857' : '#334155',
                      border: '1px solid #CBD5E1',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {lead.assignedToName || 'Unassigned'}
                  </span>
                  {(!lead.assignedTo || lead.assignedTo !== currentUser?.id) && (
                    <button
                      type="button"
                      onClick={() => onAssignLead?.(lead.id, currentUser?.id || '', currentUser?.name || '')}
                      style={{
                        background: '#FAF8F5',
                        border: '1px solid #E2D7CE',
                        color: 'var(--portal-brown)',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + Claim Deal
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Core CRM Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* LOG A CALL BUTTON */}
            <button
              type="button"
              onClick={() => onOpenLogCall(lead)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#ECFDF5',
                color: '#065F46',
                border: '1.5px solid #A7F3D0',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <PhoneCall size={14} /> Log Call ({lead.callAttempts || 0})
            </button>

            {/* CREATE / UPDATE MERCHANT BUTTON (Admin Only Guard) */}
            {currentUser?.role === 'admin' ? (
              <button
                type="button"
                onClick={handleCreateMerchantClick}
                disabled={isCreatingMerchant}
                className="portal-btn-brown"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                {isCreatingMerchant ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Provisioning...
                  </>
                ) : lead.merchantCode ? (
                  <>
                    <RefreshCw size={14} /> Update Merchant
                  </>
                ) : (
                  <>
                    <Rocket size={14} /> Create Merchant
                  </>
                )}
              </button>
            ) : (
              <div title="Admin privilege required: Merchant creation is restricted to administrators">
                <button
                  type="button"
                  disabled
                  style={{
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.825rem',
                    background: '#F1F5F9',
                    color: '#94A3B8',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    cursor: 'not-allowed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 700,
                  }}
                >
                  <ShieldCheck size={14} /> Provision Merchant (Admin)
                </button>
              </div>
            )}

            {/* Direct WhatsApp & Email */}
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: '#25D366',
                color: '#FFFFFF',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Phone size={13} /> WhatsApp
            </a>

            <a
              href={`mailto:${lead.email}?subject=Spoonfull%20Partnership%20-%20${encodeURIComponent(lead.restaurantName)}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#0F172A',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Mail size={13} /> Email
            </a>
          </div>
        </div>

        {/* 2-Column Info: Kitchen Specs & Commission */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#FAF8F5', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1.15rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Store size={15} style={{ color: 'var(--portal-brown)' }} />
              Restaurant Information
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748B' }}>Address: </span>
                <strong style={{ color: '#0F172A' }}>{lead.city} • {lead.address}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Cuisines: </span>
                <span style={{ color: '#0F172A', fontWeight: 700 }}>{lead.cuisines.join(', ')}</span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Fulfillment Model: </span>
                <span style={{ color: '#0F172A', textTransform: 'capitalize' }}>
                  {lead.serviceType.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Menu Attachment: </span>
                <span style={{ color: 'var(--portal-brown)', fontWeight: 700 }}>
                  {lead.uploadedMenuFilename || 'Uploaded digitally'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ background: '#FAF8F5', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1.15rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Gift size={15} style={{ color: 'var(--portal-brown)' }} />
              Launch Package &amp; Hardware
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748B' }}>Launch Offer: </span>
                <strong style={{ color: '#059669', fontWeight: 800 }}>
                  {lead.launchOffer === 'credits_3k'
                    ? '🎁 €3,000 Fee Credit Pool'
                    : '🎁 2 Months Free of Charge (0% Fee)'}
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>POS Hardware: </span>
                <span style={{ color: '#0F172A', fontWeight: 700 }}>
                  📟 Free Touchscreen Terminal &amp; Thermal Printer
                </span>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Setup Call: </span>
                <span style={{ color: 'var(--portal-brown)', fontWeight: 700 }}>
                  📞 Call {lead.phone} to configure hardware
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Calls Logged: </span>
                  <span style={{ color: '#0F172A', fontWeight: 700 }}>{lead.callAttempts || 0} calls</span>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Follow-up: </span>
                  <input
                    type="date"
                    value={lead.followUpDate || ''}
                    onChange={(e) => onFollowUpDateChange(lead.id, e.target.value)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      marginLeft: '4px',
                    }}
                  />
                </div>
              </div>

              {/* SendGrid Resend Email Notification */}
              <div style={{ marginTop: '0.4rem', paddingTop: '0.5rem', borderTop: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isSendingEmail}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    color: '#0F172A',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Mail size={13} style={{ color: 'var(--portal-brown)' }} />
                  {isSendingEmail ? 'Sending via SendGrid...' : 'Send / Resend SendGrid Alert (Admin & Restaurant)'}
                </button>
                {emailStatusMsg && (
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#059669', fontWeight: 700, marginTop: '0.3rem' }}>
                    ✓ {emailStatusMsg}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded Menu Preview Section */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Utensils size={15} style={{ color: 'var(--portal-brown)' }} />
            Restaurant Dishes ({lead.dishes?.length || 0})
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.75rem',
              maxHeight: '190px',
              overflowY: 'auto',
              padding: '2px',
            }}
          >
            {lead.dishes && lead.dishes.length > 0 ? (
              lead.dishes.map((dish) => (
                <div
                  key={dish.id}
                  style={{
                    background: '#FAF8F5',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    display: 'flex',
                    gap: '0.65rem',
                    alignItems: 'center',
                  }}
                >
                  {dish.imageUrl ? (
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        background: '#E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                      }}
                    >
                      🍽️
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {dish.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--portal-brown)' }}>
                      €{dish.price.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: '#64748B' }}>{dish.category}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.825rem', color: '#94A3B8', fontStyle: 'italic', padding: '0.5rem 0' }}>
                No dishes uploaded yet.
              </div>
            )}
          </div>
        </div>

        {/* Team Notes & Call History */}
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <MessageSquare size={15} style={{ color: '#0284C7' }} />
            Notes & Discussion History ({lead.adminNotes?.length || 0})
          </h3>

          <form onSubmit={handlePostNote} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="text"
              placeholder="Add internal note..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="portal-input"
              style={{ flex: 1, height: '38px', fontSize: '0.85rem' }}
            />
            <button
              type="submit"
              disabled={!newNoteText.trim()}
              className="portal-btn-brown"
              style={{ padding: '0.4rem 1.15rem', fontSize: '0.825rem' }}
            >
              <Send size={13} /> Add Note
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '160px', overflowY: 'auto' }}>
            {lead.adminNotes && lead.adminNotes.length > 0 ? (
              lead.adminNotes.map((note) => (
                <div key={note.id} style={{ background: '#FAF8F5', border: '1px solid #E2E8F0', padding: '0.65rem 0.85rem', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--portal-brown)' }}>{note.author}</span>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      {new Date(note.createdAt).toLocaleDateString('en-NL', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.35 }}>{note.text}</p>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.825rem', color: '#94A3B8', fontStyle: 'italic' }}>No notes logged yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
