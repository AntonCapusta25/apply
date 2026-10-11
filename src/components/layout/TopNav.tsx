import React from 'react';
import { ChefHat, Database, Sparkles, LayoutDashboard, UtensilsCrossed } from 'lucide-react';
import { SupabaseHealth } from '../../lib/supabaseClient';

interface TopNavProps {
  currentView: 'quiz' | 'crm';
  onViewChange: (view: 'quiz' | 'crm') => void;
  supabaseHealth: SupabaseHealth | null;
  onOpenSupabaseModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentView,
  onViewChange,
  supabaseHealth,
  onOpenSupabaseModal,
}) => {
  return (
    <header
      style={{
        height: '65px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.75rem',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--portal-brown, #4A2E1B)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 2px 10px rgba(74, 46, 27, 0.4)',
          }}
        >
          <UtensilsCrossed size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.25rem',
                color: '#fff',
                letterSpacing: '-0.02em',
              }}
            >
              spoonfull
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: 'rgba(238, 223, 213, 0.2)',
                color: '#EEDFD5',
                padding: '2px 6px',
                borderRadius: '4px',
                letterSpacing: '0.05em',
              }}
            >
              RESTAURANTS
            </span>
          </div>
        </div>
      </div>

      {/* Main Switcher: Quiz vs CRM */}
      <nav
        style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '9999px',
          padding: '4px',
        }}
      >
        <button
          onClick={() => onViewChange('quiz')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 1.1rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: currentView === 'quiz' ? '#fff' : 'var(--text-secondary)',
            background: currentView === 'quiz' ? 'var(--brand-orange-gradient)' : 'transparent',
            boxShadow: currentView === 'quiz' ? '0 2px 8px rgba(249, 115, 22, 0.35)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <Sparkles size={15} />
          <span>Restaurant Quiz</span>
        </button>

        <button
          onClick={() => onViewChange('crm')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.45rem 1.1rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: currentView === 'crm' ? '#fff' : 'var(--text-secondary)',
            background: currentView === 'crm' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
            boxShadow: currentView === 'crm' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <LayoutDashboard size={15} />
          <span>CRM Pipeline</span>
        </button>
      </nav>

      {/* Right side: Supabase Live Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          onClick={onOpenSupabaseModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-subtle)',
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            transition: 'all 0.2s',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: supabaseHealth?.connected ? '#10b981' : '#f59e0b',
              boxShadow: supabaseHealth?.connected ? '0 0 8px #10b981' : 'none',
            }}
          />
          <Database size={14} style={{ color: '#38bdf8' }} />
          <span>{supabaseHealth?.connected ? 'Supabase Live' : 'Supabase (Local Sync)'}</span>
        </button>
      </div>
    </header>
  );
};
