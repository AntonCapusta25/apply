import React, { useState, useEffect, useCallback } from 'react';
import { RestaurantPortalWizard } from './components/quiz/RestaurantPortalWizard';
import { CrmDashboard } from './components/crm/CrmDashboard';
import { AdminLogin } from './components/auth/AdminLogin';
import { SupabaseConfigModal } from './components/layout/SupabaseConfigModal';
import { fetchAllLeads } from './services/restaurantService';
import { checkSupabaseConnection, SupabaseHealth } from './lib/supabaseClient';
import { getStoredAuthSession, signOutCrm, AuthSession } from './services/authService';
import { RestaurantProfile } from './types/onboarding';

function getIsAdminRoute(): boolean {
  const path = window.location.pathname.toLowerCase();
  return path === '/admin' || path.startsWith('/admin/');
}

export function App() {
  // Check if current URL is the admin route (/admin)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => getIsAdminRoute());
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => getStoredAuthSession());
  const [leads, setLeads] = useState<RestaurantProfile[]>([]);
  const [supabaseHealth, setSupabaseHealth] = useState<SupabaseHealth | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Sync route with browser history / popstate
  useEffect(() => {
    const handlePopState = () => {
      setIsAdmin(getIsAdminRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const loadLeads = useCallback(async () => {
    const res = await fetchAllLeads();
    setLeads(res.leads);
  }, []);

  const refreshHealth = useCallback(async () => {
    const health = await checkSupabaseConnection();
    setSupabaseHealth(health);
  }, []);

  useEffect(() => {
    if (isAdmin && authSession) {
      loadLeads();
    }
    refreshHealth();
  }, [isAdmin, authSession, loadLeads, refreshHealth]);

  const handleLeadCreated = (newLead: RestaurantProfile) => {
    setLeads((prev) => [newLead, ...prev]);
  };

  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session);
  };

  const handleSignOut = async () => {
    await signOutCrm();
    setAuthSession(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5' }}>
      {isAdmin ? (
        /* Admin Route Gate: Requires Authentication */
        !authSession ? (
          <AdminLogin onLoginSuccess={handleLoginSuccess} />
        ) : (
          <CrmDashboard
            leads={leads}
            onReloadLeads={loadLeads}
            onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
            authSession={authSession}
            onSignOut={handleSignOut}
          />
        )
      ) : (
        /* Customer Facing Restaurant Onboarding Flow - accessible on / */
        <RestaurantPortalWizard
          onLeadCreated={handleLeadCreated}
          leadCount={leads.length}
        />
      )}

      {/* Supabase Connection & SQL Migration Modal (Available on Admin) */}
      {isAdmin && (
        <SupabaseConfigModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          health={supabaseHealth}
          onRefreshHealth={refreshHealth}
        />
      )}
    </div>
  );
}

export default App;
