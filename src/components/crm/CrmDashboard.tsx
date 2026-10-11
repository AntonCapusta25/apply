import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Kanban,
  Table as TableIcon,
  Download,
  Plus,
  RotateCcw,
  ArrowLeft,
  PhoneCall,
  Rocket,
  Shield,
  Users,
  UserCheck,
} from 'lucide-react';
import {
  RestaurantProfile,
  LeadStatus,
  DUTCH_CITIES,
  RESTAURANT_CUISINES,
  CrmUser,
} from '../../types/onboarding';
import {
  updateLeadStatus,
  updateLeadPriority,
  addLeadNote,
  updateFollowUpDate,
  exportLeadsToCsv,
  clearLocalLeads,
  createRestaurantLead,
  logCall,
  createMerchantFromLead,
  assignLeadToUser,
} from '../../services/restaurantService';
import { CrmStatsCards } from './CrmStatsCards';
import { CrmKanbanBoard } from './CrmKanbanBoard';
import { CrmTableView } from './CrmTableView';
import { CrmLeadDetailsModal } from './CrmLeadDetailsModal';
import { NewLeadManualModal } from './NewLeadManualModal';
import { LogCallModal } from './LogCallModal';
import { AuthSession, fetchTeamMembers } from '../../services/authService';
import { LogOut } from 'lucide-react';

interface CrmDashboardProps {
  leads: RestaurantProfile[];
  onReloadLeads: () => void;
  onOpenQuiz?: () => void;
  authSession: AuthSession;
  onSignOut?: () => void;
}

export const CrmDashboard: React.FC<CrmDashboardProps> = ({
  leads,
  onReloadLeads,
  onOpenQuiz,
  authSession,
  onSignOut,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRep, setSelectedRep] = useState<string>('all');
  const [activeLead, setActiveLead] = useState<RestaurantProfile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [callLogLead, setCallLogLead] = useState<RestaurantProfile | null>(null);

  // Identity & role come strictly from the verified Supabase session (role read from DB).
  const currentUser: CrmUser = authSession.user;
  const isAdminUser = currentUser.role === 'admin';

  // Team roster from crm_team_profiles (for filters & assignment)
  const [teamMembers, setTeamMembers] = useState<CrmUser[]>([]);
  useEffect(() => {
    fetchTeamMembers().then(setTeamMembers);
  }, []);

  // Count leads assigned to current user
  const myAssignedCount = useMemo(() => {
    return leads.filter((l) => l.assignedTo === currentUser.id).length;
  }, [leads, currentUser.id]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        lead.restaurantName.toLowerCase().includes(q) ||
        lead.ownerName.toLowerCase().includes(q) ||
        lead.city.toLowerCase().includes(q) ||
        lead.phone.includes(q) ||
        lead.email.toLowerCase().includes(q);

      const matchCity = selectedCity === 'all' || lead.city === selectedCity;
      const matchCuisine =
        selectedCuisine === 'all' || lead.cuisines.some((c) => c === selectedCuisine);
      const matchStatus = selectedStatus === 'all' || lead.leadStatus === selectedStatus;

      let matchRep = true;
      if (selectedRep === 'my_leads') {
        matchRep = lead.assignedTo === currentUser.id;
      } else if (selectedRep === 'unassigned') {
        matchRep = !lead.assignedTo;
      } else if (selectedRep !== 'all') {
        matchRep = lead.assignedTo === selectedRep;
      }

      return matchSearch && matchCity && matchCuisine && matchStatus && matchRep;
    });
  }, [leads, searchQuery, selectedCity, selectedCuisine, selectedStatus, selectedRep, currentUser.id]);

  // Handlers
  const handleStatusChange = async (id: string, newStatus: LeadStatus) => {
    await updateLeadStatus(id, newStatus);
    onReloadLeads();
    if (activeLead && activeLead.id === id) {
      setActiveLead((prev) => (prev ? { ...prev, leadStatus: newStatus } : null));
    }
  };

  const handlePriorityChange = async (id: string, priority: 'low' | 'medium' | 'high') => {
    await updateLeadPriority(id, priority);
    onReloadLeads();
    if (activeLead && activeLead.id === id) {
      setActiveLead((prev) => (prev ? { ...prev, priority } : null));
    }
  };

  const handleAssignLead = async (id: string, userId: string, userName: string) => {
    await assignLeadToUser(id, userId, userName);
    onReloadLeads();
    if (activeLead && activeLead.id === id) {
      setActiveLead((prev) =>
        prev ? { ...prev, assignedTo: userId || undefined, assignedToName: userName || undefined } : null
      );
    }
  };

  const handleAddNote = async (id: string, author: string, noteText: string) => {
    const newNote = await addLeadNote(id, author, noteText);
    onReloadLeads();
    if (activeLead && activeLead.id === id) {
      setActiveLead((prev) =>
        prev ? { ...prev, adminNotes: [newNote, ...(prev.adminNotes || [])] } : null
      );
    }
  };

  const handleLogCallSubmit = async (
    restaurantId: string,
    author: string,
    outcome: string,
    notes: string
  ) => {
    await logCall(restaurantId, author, outcome, notes);
    onReloadLeads();
    if (activeLead && activeLead.id === restaurantId) {
      setActiveLead((prev) =>
        prev
          ? {
              ...prev,
              callAttempts: (prev.callAttempts || 0) + 1,
              lastContactedAt: new Date().toISOString(),
              adminNotes: [
                {
                  id: `note-${Date.now()}`,
                  author,
                  text: `Call Log [${outcome}]: ${notes}`,
                  createdAt: new Date().toISOString(),
                },
                ...(prev.adminNotes || []),
              ],
            }
          : null
      );
    }
  };

  const handleCreateMerchant = async (leadId: string) => {
    const merchant = await createMerchantFromLead(leadId);
    onReloadLeads();
    if (activeLead && activeLead.id === leadId) {
      setActiveLead((prev) =>
        prev
          ? {
              ...prev,
              merchantId: merchant.id,
              merchantCode: merchant.merchantCode,
              leadStatus: 'merchant_created',
            }
          : null
      );
    }
    alert(`Merchant created successfully! Code: ${merchant.merchantCode}`);
  };

  const handleFollowUpChange = async (id: string, date: string) => {
    await updateFollowUpDate(id, date);
    onReloadLeads();
    if (activeLead && activeLead.id === id) {
      setActiveLead((prev) => (prev ? { ...prev, followUpDate: date } : null));
    }
  };

  const handleClearLocalCache = () => {
    if (window.confirm('Clear cached leads and reload live data from Supabase?')) {
      clearLocalLeads();
      onReloadLeads();
    }
  };

  const handleManualLeadCreate = async (data: any) => {
    await createRestaurantLead(data);
    onReloadLeads();
  };

  return (
    <div className="portal-crm-container">
      {/* Top Header */}
      <div className="portal-crm-topbar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <img
              src="/spoonfull-logo.png"
              alt="Spoonfull Logo"
              style={{
                height: '42px',
                width: 'auto',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
                background: currentUser.role === 'admin' ? 'var(--portal-brown)' : '#059669',
                color: '#FFFFFF',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {currentUser.role === 'admin' ? '👑 Admin Pipeline' : '💼 Salesperson View'}
            </span>

            <h1 className="portal-crm-title font-display">
              Spoonfull Restaurant CRM
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: 'var(--portal-brown)',
                  background: '#EEDFD5',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                }}
              >
                {filteredLeads.length} Restaurants
              </span>
            </h1>
          </div>
          <p className="portal-crm-subtitle">
            {currentUser.role === 'admin'
              ? 'Complete pipeline visibility, deal assignments, live merchant provisioning, and Supabase integration.'
              : `Welcome ${currentUser.name}! Track your outreach calls, follow-ups, verified menus, and restaurant relationships.`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Signed-in identity (read-only, role from database) */}
          <div
            title={currentUser.email}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              borderRadius: '10px',
              padding: '0.4rem 0.75rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: isAdminUser ? 'var(--portal-brown)' : '#047857',
                background: isAdminUser ? '#FDF3EE' : '#ECFDF5',
                padding: '2px 6px',
                borderRadius: '6px',
              }}
            >
              {isAdminUser ? 'ADMIN' : 'SALES'}
            </span>
            <span style={{ fontWeight: 700, fontSize: '0.825rem', color: '#0F172A' }}>
              {currentUser.name}
            </span>
          </div>

          <button
            onClick={() => exportLeadsToCsv(filteredLeads)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.95rem',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Download size={14} /> Export CSV
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="portal-btn-brown"
            style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Add Restaurant
          </button>

          {/* Sync & Clear Local Cache (Admin Only) */}
          {currentUser.role === 'admin' && (
            <button
              onClick={handleClearLocalCache}
              title="Admin Only: Refresh live Supabase data & clear local cache"
              style={{
                padding: '0.55rem',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#94A3B8',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={16} />
            </button>
          )}

          {/* Sign Out Button */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              title="Sign Out of Spoonfull Staff Portal"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.55rem 0.85rem',
                borderRadius: '10px',
                border: '1px solid #FCA5A5',
                background: '#FEF2F2',
                color: '#991B1B',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <CrmStatsCards leads={leads} />

      {/* Toolbar: Search, Filters & View Toggle */}
      <div className="portal-toolbar">
        {/* Search Input */}
        <div className="portal-search">
          <Search size={16} style={{ color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search restaurant, owner, city, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Sales Rep Filter */}
          <select
            className="portal-select-filter"
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            style={{ fontWeight: 700 }}
          >
            <option value="all">All Sales Reps</option>
            <option value="my_leads">Assigned to Me ({currentUser.name.split(' ')[0]})</option>
            <option value="unassigned">Unassigned Leads</option>
            {teamMembers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>

          <select
            className="portal-select-filter"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="all">All Cities</option>
            {DUTCH_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="portal-select-filter"
            value={selectedCuisine}
            onChange={(e) => setSelectedCuisine(e.target.value)}
          >
            <option value="all">All Cuisines</option>
            {RESTAURANT_CUISINES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="portal-select-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Pipeline Stages</option>
            <option value="new">New Applications</option>
            <option value="contacted">Contacted</option>
            <option value="menu_ready">Menu Verified</option>
            <option value="contract_pending">Contract Selected</option>
            <option value="merchant_created">Merchant Created</option>
            <option value="live">Active Live</option>
            <option value="paused">Paused / Declined</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', background: '#FAF8F5', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '3px' }}>
          <button
            onClick={() => setViewMode('kanban')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              background: viewMode === 'kanban' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'kanban' ? 'var(--portal-brown)' : '#64748B',
              boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
            }}
          >
            <Kanban size={14} /> Kanban
          </button>

          <button
            onClick={() => setViewMode('table')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              background: viewMode === 'table' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'table' ? 'var(--portal-brown)' : '#64748B',
              boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer',
            }}
          >
            <TableIcon size={14} /> Table
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'kanban' ? (
        <CrmKanbanBoard
          leads={filteredLeads}
          onSelectLead={(lead) => setActiveLead(lead)}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <CrmTableView
          leads={filteredLeads}
          onSelectLead={(lead) => setActiveLead(lead)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Lead Details Modal */}
      <CrmLeadDetailsModal
        lead={activeLead}
        isOpen={Boolean(activeLead)}
        currentUser={currentUser}
        teamMembers={teamMembers}
        onClose={() => setActiveLead(null)}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onAssignLead={handleAssignLead}
        onAddNote={handleAddNote}
        onFollowUpDateChange={handleFollowUpChange}
        onOpenLogCall={(l) => setCallLogLead(l)}
        onCreateMerchant={handleCreateMerchant}
      />

      {/* Log Call Modal */}
      <LogCallModal
        lead={callLogLead}
        isOpen={Boolean(callLogLead)}
        currentUser={currentUser}
        onClose={() => setCallLogLead(null)}
        onLogCall={handleLogCallSubmit}
      />

      {/* Manual Lead Creation Modal */}
      <NewLeadManualModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleManualLeadCreate}
      />
    </div>
  );
};
