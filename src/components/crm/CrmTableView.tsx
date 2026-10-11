import React from 'react';
import { Eye, MapPin, Store, Utensils, PhoneCall } from 'lucide-react';
import { RestaurantProfile, LeadStatus } from '../../types/onboarding';

interface CrmTableViewProps {
  leads: RestaurantProfile[];
  onSelectLead: (lead: RestaurantProfile) => void;
  onStatusChange: (id: string, newStatus: LeadStatus) => void;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New Application',
  contacted: 'Contacted',
  menu_ready: 'Menu Verified',
  contract_pending: 'Contract Pending',
  merchant_created: 'Merchant Created',
  live: 'Live on Spoonfull',
  paused: 'Paused / Declined',
};

export const CrmTableView: React.FC<CrmTableViewProps> = ({
  leads,
  onSelectLead,
  onStatusChange,
}) => {
  return (
    <div className="portal-table-box">
      <table className="portal-table">
        <thead>
          <tr>
            <th>Restaurant & Owner</th>
            <th>Assigned Rep</th>
            <th>City & Area</th>
            <th>Direct Contact</th>
            <th>Cuisines</th>
            <th>Menu Dishes</th>
            <th>Calls Logged</th>
            <th>Launch Offer &amp; POS</th>
            <th>Stage</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>
                No matching restaurants found
              </td>
            </tr>
          ) : (
            leads.map((lead) => (
              <tr key={lead.id} onClick={() => onSelectLead(lead)} style={{ cursor: 'pointer' }}>
                <td>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                    {lead.restaurantName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                    Owner: {lead.ownerName}
                  </div>
                  {lead.merchantCode && (
                    <span style={{ fontSize: '0.725rem', fontWeight: 800, color: '#065F46', background: '#ECFDF5', padding: '1px 6px', borderRadius: '4px' }}>
                      {lead.merchantCode}
                    </span>
                  )}
                </td>

                <td>
                  {lead.assignedToName ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#334155',
                        background: '#F1F5F9',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      👤 {lead.assignedToName}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#B45309',
                        background: '#FFFBEB',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px dashed #FDE68A',
                      }}
                    >
                      Unassigned
                    </span>
                  )}
                </td>

                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0F172A', fontWeight: 600 }}>
                    <MapPin size={13} style={{ color: 'var(--portal-brown)' }} />
                    <span>{lead.city}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{lead.address}</div>
                </td>

                <td>
                  <div style={{ fontSize: '0.825rem', color: '#0F172A', fontWeight: 600 }}>{lead.phone}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{lead.email}</div>
                </td>

                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '170px' }}>
                    {lead.cuisines.map((c) => (
                      <span key={c} className="portal-tag-pill">
                        {c}
                      </span>
                    ))}
                  </div>
                </td>

                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#0F172A' }}>
                    <Utensils size={14} style={{ color: 'var(--portal-brown)' }} />
                    <span>{lead.dishes?.length || 0} dishes</span>
                  </div>
                  {lead.uploadedMenuFilename && (
                    <div style={{ fontSize: '0.725rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                      {lead.uploadedMenuFilename}
                    </div>
                  )}
                </td>

                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: lead.callAttempts > 0 ? '#059669' : '#64748B' }}>
                    <PhoneCall size={14} />
                    <span>{lead.callAttempts || 0} calls</span>
                  </div>
                </td>

                <td>
                  <div
                    style={{
                      fontSize: '0.825rem',
                      fontWeight: 800,
                      color: lead.launchOffer === 'credits_3k' ? '#0284C7' : '#059669',
                    }}
                  >
                    {lead.launchOffer === 'credits_3k' ? '🎁 €3k Fee Credits' : '🎁 2 Mo Free (0%)'}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#64748B', marginTop: '2px', fontWeight: 600 }}>
                    📟 Free POS Included
                  </div>
                </td>

                <td onClick={(e) => e.stopPropagation()}>
                  <select
                    className="portal-select-filter"
                    value={lead.leadStatus}
                    onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                  >
                    {Object.entries(STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>

                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => onSelectLead(lead)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.85rem',
                      borderRadius: '8px',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      color: '#0F172A',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Eye size={13} />
                    <span>Inspect</span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
