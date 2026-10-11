import React from 'react';
import { Users, Clock, Utensils, CheckCircle2, TrendingUp } from 'lucide-react';
import { RestaurantProfile } from '../../types/onboarding';

interface CrmStatsCardsProps {
  leads: RestaurantProfile[];
}

export const CrmStatsCards: React.FC<CrmStatsCardsProps> = ({ leads }) => {
  const totalLeads = leads.length;
  const newOrContacted = leads.filter((l) => l.leadStatus === 'new' || l.leadStatus === 'contacted').length;
  const menuUploaded = leads.filter((l) => (l.dishes && l.dishes.length > 0) || l.leadStatus === 'menu_ready').length;
  const merchantsCreated = leads.filter((l) => l.merchantCode || l.leadStatus === 'merchant_created' || l.leadStatus === 'live').length;
  const conversionRate = totalLeads > 0 ? Math.round((merchantsCreated / totalLeads) * 100) : 0;

  return (
    <div className="portal-stats-row">
      <div className="portal-stat-box">
        <div className="portal-stat-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
          <Users size={22} />
        </div>
        <div>
          <div className="portal-stat-value">{totalLeads}</div>
          <div className="portal-stat-label">Total Restaurant Leads</div>
        </div>
      </div>

      <div className="portal-stat-box">
        <div className="portal-stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
          <Clock size={22} />
        </div>
        <div>
          <div className="portal-stat-value">{newOrContacted}</div>
          <div className="portal-stat-label">In Review / Contacted</div>
        </div>
      </div>

      <div className="portal-stat-box">
        <div className="portal-stat-icon" style={{ background: '#FDF3EE', color: 'var(--portal-brown)' }}>
          <Utensils size={22} />
        </div>
        <div>
          <div className="portal-stat-value">{menuUploaded}</div>
          <div className="portal-stat-label">Menus Uploaded & Ready</div>
        </div>
      </div>

      <div className="portal-stat-box">
        <div className="portal-stat-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
          <CheckCircle2 size={22} />
        </div>
        <div>
          <div className="portal-stat-value">{merchantsCreated}</div>
          <div className="portal-stat-label">Merchants Created</div>
        </div>
      </div>

      <div className="portal-stat-box">
        <div className="portal-stat-icon" style={{ background: '#EDE9FE', color: '#6D28D9' }}>
          <TrendingUp size={22} />
        </div>
        <div>
          <div className="portal-stat-value">{conversionRate}%</div>
          <div className="portal-stat-label">Merchant Conversion</div>
        </div>
      </div>
    </div>
  );
};
