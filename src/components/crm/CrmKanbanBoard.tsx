import React from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, MapPin, Store, AlertCircle, PhoneCall, Utensils, Rocket } from 'lucide-react';
import { RestaurantProfile, LeadStatus } from '../../types/onboarding';

interface CrmKanbanBoardProps {
  leads: RestaurantProfile[];
  onSelectLead: (lead: RestaurantProfile) => void;
  onStatusChange: (id: string, newStatus: LeadStatus) => void;
}

interface ColumnDef {
  status: LeadStatus;
  title: string;
  color: string;
}

const COLUMNS: ColumnDef[] = [
  { status: 'new', title: 'New Leads', color: '#0284C7' },
  { status: 'contacted', title: 'Contacted', color: '#6D28D9' },
  { status: 'menu_ready', title: 'Menu Ready', color: '#D97706' },
  { status: 'contract_pending', title: 'Contract Pending', color: '#DB2777' },
  { status: 'merchant_created', title: 'Merchant Created', color: '#15803D' },
  { status: 'live', title: 'Live on Spoonfull', color: '#059669' },
  { status: 'paused', title: 'Paused / Declined', color: '#64748B' },
];

export const CrmKanbanBoard: React.FC<CrmKanbanBoardProps> = ({
  leads,
  onSelectLead,
  onStatusChange,
}) => {
  const getPrevStatus = (current: LeadStatus): LeadStatus | null => {
    const idx = COLUMNS.findIndex((c) => c.status === current);
    return idx > 0 ? COLUMNS[idx - 1].status : null;
  };

  const getNextStatus = (current: LeadStatus): LeadStatus | null => {
    const idx = COLUMNS.findIndex((c) => c.status === current);
    return idx < COLUMNS.length - 1 ? COLUMNS[idx + 1].status : null;
  };

  return (
    <div className="portal-kanban-grid">
      {COLUMNS.map((col) => {
        const colLeads = leads.filter((l) => l.leadStatus === col.status);

        return (
          <div key={col.status} className="portal-kanban-column">
            {/* Column Header */}
            <div className="portal-column-header">
              <div className="portal-column-title">
                <span
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: col.color,
                  }}
                />
                <span>{col.title}</span>
              </div>
              <span className="portal-column-count">{colLeads.length}</span>
            </div>

            {/* Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
              {colLeads.length === 0 ? (
                <div
                  style={{
                    padding: '2.5rem 1rem',
                    textAlign: 'center',
                    color: '#94A3B8',
                    fontSize: '0.825rem',
                    border: '1.5px dashed #E2D7CE',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.4)',
                  }}
                >
                  No restaurants in this stage
                </div>
              ) : (
                colLeads.map((lead) => {
                  const prev = getPrevStatus(lead.leadStatus);
                  const next = getNextStatus(lead.leadStatus);

                  return (
                    <div
                      key={lead.id}
                      className="portal-lead-card"
                      onClick={() => onSelectLead(lead)}
                    >
                      {lead.priority === 'high' && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.675rem',
                            fontWeight: 800,
                          }}
                        >
                          <AlertCircle size={10} />
                          <span>HIGH</span>
                        </div>
                      )}

                      <h4 className="portal-lead-name font-display">{lead.restaurantName}</h4>
                      <div className="portal-lead-chef">
                        <Store size={13} style={{ color: 'var(--portal-brown)' }} />
                        <span>{lead.ownerName}</span>
                      </div>

                      {/* Tag pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.65rem' }}>
                        <span className="portal-tag-pill" style={{ background: '#FAF8F5', color: '#4A2E1B', fontWeight: 800 }}>
                          <MapPin size={10} style={{ display: 'inline', marginRight: '2px' }} />
                          {lead.city}
                        </span>

                        {lead.cuisines.slice(0, 2).map((c) => (
                          <span key={c} className="portal-tag-pill">
                            {c}
                          </span>
                        ))}

                        <span
                          className="portal-tag-pill"
                          style={{
                            background: lead.launchOffer === 'credits_3k' ? '#E0F2FE' : '#ECFDF5',
                            color: lead.launchOffer === 'credits_3k' ? '#0369A1' : '#047857',
                            fontWeight: 700,
                          }}
                        >
                          {lead.launchOffer === 'credits_3k' ? '🎁 €3k Credits' : '🎁 2 Mo Free'}
                        </span>

                        {lead.merchantCode && (
                          <span className="portal-tag-pill" style={{ background: '#ECFDF5', color: '#065F46', fontWeight: 800 }}>
                            {lead.merchantCode}
                          </span>
                        )}

                        {lead.assignedToName ? (
                          <span
                            className="portal-tag-pill"
                            style={{
                              background: '#F1F5F9',
                              color: '#334155',
                              border: '1px solid #E2E8F0',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                            }}
                          >
                            👤 {lead.assignedToName.split(' ')[0]}
                          </span>
                        ) : (
                          <span
                            className="portal-tag-pill"
                            style={{
                              background: '#FFFBEB',
                              color: '#B45309',
                              border: '1px dashed #FDE68A',
                              fontWeight: 600,
                              fontSize: '0.72rem',
                            }}
                          >
                            Unassigned
                          </span>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="portal-card-bottom" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                            <Utensils size={12} /> {lead.dishes?.length || 0}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600, color: lead.callAttempts > 0 ? '#059669' : '#94A3B8' }}>
                            <PhoneCall size={12} /> {lead.callAttempts || 0}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {prev && (
                            <button
                              type="button"
                              onClick={() => onStatusChange(lead.id, prev)}
                              title="Move back"
                              style={{
                                padding: '3px 5px',
                                borderRadius: '4px',
                                border: '1px solid #E2E8F0',
                                color: '#64748B',
                                background: '#FFFFFF',
                                cursor: 'pointer',
                              }}
                            >
                              <ChevronLeft size={13} />
                            </button>
                          )}
                          {next && (
                            <button
                              type="button"
                              onClick={() => onStatusChange(lead.id, next)}
                              title="Advance stage"
                              style={{
                                padding: '3px 5px',
                                borderRadius: '4px',
                                border: '1px solid #EEDFD5',
                                color: 'var(--portal-brown)',
                                background: '#FDF3EE',
                                cursor: 'pointer',
                                fontWeight: 700,
                              }}
                            >
                              <ChevronRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
