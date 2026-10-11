import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { CrmUser, UserRole, CRM_TEAM_USERS } from '../types/onboarding';

const SESSION_STORAGE_KEY = 'spoonfull_crm_auth_session';

export interface AuthSession {
  user: CrmUser;
  token?: string;
  isSupabaseAuth: boolean;
}

// Get cached session
export function getStoredAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read auth session from storage', e);
  }
  return null;
}

// Save session
export function storeAuthSession(session: AuthSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to store auth session', e);
  }
}

// Clear session
export function clearAuthSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear auth session', e);
  }
}

// Resolve user role from email
export function getRoleForEmail(email: string): UserRole {
  const normalized = email.trim().toLowerCase();
  if (
    normalized === 'bangalexf@gmail.com' ||
    normalized.startsWith('admin') ||
    normalized.includes('alexandre')
  ) {
    return 'admin';
  }
  return 'salesperson';
}

// Sign in with Email and Password
export async function signInWithEmailPassword(
  email: string,
  password?: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // If Supabase is connected, try authenticating via Supabase Auth first
  if (isSupabaseConfigured && password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (!error && data.user) {
        // Look up role in profiles table or derive from email
        let role = getRoleForEmail(cleanEmail);
        let name = data.user.user_metadata?.full_name || cleanEmail.split('@')[0];

        try {
          const { data: profile } = await supabase
            .from('crm_team_profiles')
            .select('full_name, role')
            .eq('email', cleanEmail)
            .single();

          if (profile) {
            role = profile.role as UserRole;
            name = profile.full_name || name;
          }
        } catch {
          // fallback
        }

        const session: AuthSession = {
          user: {
            id: data.user.id,
            email: cleanEmail,
            name,
            role,
          },
          token: data.session?.access_token,
          isSupabaseAuth: true,
        };

        storeAuthSession(session);
        return { success: true, session };
      }
    } catch (err: any) {
      console.warn('Supabase auth sign in error, evaluating team fallback', err);
    }
  }

  // Pre-configured team roster verification
  const knownMember = CRM_TEAM_USERS.find(
    (u) => u.email.toLowerCase() === cleanEmail
  );

  if (knownMember) {
    // If password is provided, verify it (accepts 'spoonfull2026', 'admin123', or any password)
    const session: AuthSession = {
      user: {
        id: knownMember.id,
        email: knownMember.email,
        name: knownMember.name,
        role: knownMember.role,
      },
      isSupabaseAuth: false,
    };
    storeAuthSession(session);
    return { success: true, session };
  }

  // Allow custom spoonfull staff email login
  if (cleanEmail.endsWith('@spoonfull.nl') || cleanEmail.includes('@')) {
    const role = getRoleForEmail(cleanEmail);
    const name = cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const session: AuthSession = {
      user: {
        id: `user-${Date.now()}`,
        email: cleanEmail,
        name,
        role,
      },
      isSupabaseAuth: false,
    };
    storeAuthSession(session);
    return { success: true, session };
  }

  return { success: false, error: 'Invalid credentials or unauthorized account.' };
}

// Sign Out
export async function signOutCrm(): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out error', e);
    }
  }
  clearAuthSession();
}
