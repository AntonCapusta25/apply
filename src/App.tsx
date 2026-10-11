import React, { useState, useEffect, useCallback } from 'react';
import { RestaurantPortalWizard } from './components/quiz/RestaurantPortalWizard';
import { CrmDashboard } from './components/crm/CrmDashboard';
import { AdminLogin } from './components/auth/AdminLogin';
import { fetchAllLeads } from './services/restaurantService';
import { restoreAuthSession, signOutCrm, AuthSession } from './services/authService';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { RestaurantProfile } from './types/onboarding';

function getIsAdminRoute(): boolean {
  const path = window.location.pathname.toLowerCase();
  return path === '/admin' || path.startsWith('/admin/');
}

export function App() {
  // Check if current URL is the admin route (/admin)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => getIsAdminRoute());
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [leads, setLeads] = useState<RestaurantProfile[]>([]);

  // Restore verified Supabase session; role is always re-read from the database
  useEffect(() => {
    let active = true;
    restoreAuthSession().then((session) => {
      if (!active) return;
      setAuthSession(session);
      setAuthChecked(true);
    });

    if (!isSupabaseConfigured) return () => { active = false; };
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setAuthSession(null);
        setLeads([]);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

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

  useEffect(() => {
    if (isAdmin && authSession) {
      loadLeads();
    }
  }, [isAdmin, authSession, loadLeads]);

  const handleLeadCreated = (newLead: RestaurantProfile) => {
    setLeads((prev) => [newLead, ...prev]);
  };

  const handleLoginSuccess = (session: AuthSession) => {
    setAuthSession(session);
  };

  const handleSignOut = async () => {
    await signOutCrm();
    setAuthSession(null);
    setLeads([]);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5' }}>
      {isAdmin ? (
        /* Admin Route Gate: Requires Authentication */
        !authChecked ? null : !authSession ? (
          <AdminLogin onLoginSuccess={handleLoginSuccess} />
        ) : (
          <CrmDashboard
            leads={leads}
            onReloadLeads={loadLeads}
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
    </div>
  );
}

export default App;
