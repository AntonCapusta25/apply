import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { CrmUser, UserRole } from '../types/onboarding';

export interface AuthSession {
  user: CrmUser;
  token?: string;
  isSupabaseAuth: boolean;
}

// Legacy key from the old insecure local-session flow; purged on load.
const LEGACY_SESSION_KEY = 'spoonfull_crm_auth_session';
const LEGACY_ACTIVE_USER_KEY = 'spoonfull_crm_active_user_id';

function purgeLegacySession(): void {
  try {
    localStorage.removeItem(LEGACY_SESSION_KEY);
    localStorage.removeItem(LEGACY_ACTIVE_USER_KEY);
  } catch {
    // ignore
  }
}

function mapProfile(row: any): CrmUser {
  return {
    id: row.id,
    email: row.email,
    name: row.full_name,
    role: row.role as UserRole,
    avatar: row.avatar_url || undefined,
  };
}

// Role comes ONLY from the crm_team_profiles table (protected by RLS). Never from the client.
async function loadProfileForEmail(email: string): Promise<CrmUser | null> {
  const { data, error } = await supabase
    .from('crm_team_profiles')
    .select('id, email, full_name, role, avatar_url')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (error || !data) return null;
  if (data.role !== 'admin' && data.role !== 'salesperson') return null;
  return mapProfile(data);
}

// Restore a session from Supabase Auth (verified JWT) and re-read the role from the DB.
export async function restoreAuthSession(): Promise<AuthSession | null> {
  purgeLegacySession();
  if (!isSupabaseConfigured) return null;

  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session?.user?.email) return null;

  const profile = await loadProfileForEmail(session.user.email);
  if (!profile) {
    await supabase.auth.signOut();
    return null;
  }

  return { user: profile, token: session.access_token, isSupabaseAuth: true };
}

export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    return { success: false, error: 'Authentication service is not configured.' };
  }
  if (!cleanEmail || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error || !data.user) {
    return { success: false, error: 'Invalid email or password.' };
  }

  const profile = await loadProfileForEmail(cleanEmail);
  if (!profile) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: 'This account does not have CRM access. Ask an admin to add you to the team.',
    };
  }

  return {
    success: true,
    session: { user: profile, token: data.session?.access_token, isSupabaseAuth: true },
  };
}

// Team roster for assignment dropdowns (readable only by team members via RLS)
export async function fetchTeamMembers(): Promise<CrmUser[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('crm_team_profiles')
    .select('id, email, full_name, role, avatar_url')
    .order('role', { ascending: true })
    .order('full_name', { ascending: true });
  if (error || !data) return [];
  return data.map(mapProfile);
}

export async function signOutCrm(): Promise<void> {
  purgeLegacySession();
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out error', e);
    }
  }
}
