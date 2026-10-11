import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes('placeholder')
);

export const SUPABASE_URL = isSupabaseConfigured ? rawUrl : 'https://spoonfull-new-project.supabase.co';
export const SUPABASE_ANON_KEY = isSupabaseConfigured ? rawKey : 'spoonfull-placeholder-key';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SupabaseHealth {
  connected: boolean;
  message: string;
  tableExists: boolean;
}

export async function checkSupabaseConnection(): Promise<SupabaseHealth> {
  if (!isSupabaseConfigured) {
    return {
      connected: false,
      tableExists: false,
      message: 'New Spoonfull Supabase project pending. Paste your new URL & key in .env or run SQL migration.',
    };
  }

  try {
    const { error } = await supabase
      .from('restaurant_leads')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          connected: true,
          tableExists: false,
          message: 'Supabase connected! Schema tables not created yet (run the SQL Migration in your Supabase SQL Editor).',
        };
      }
      return {
        connected: false,
        tableExists: false,
        message: `Supabase responded with: ${error.message}`,
      };
    }

    return {
      connected: true,
      tableExists: true,
      message: 'Supabase connected & ready! Real-time sync is active.',
    };
  } catch (err: any) {
    return {
      connected: false,
      tableExists: false,
      message: err?.message || 'Could not reach Supabase endpoint',
    };
  }
}

export const SUPABASE_SQL_MIGRATION = `-- ====================================================================
-- Spoonfull - Brand New Restaurant Onboarding & Merchant CRM Schema
-- Run this in your Supabase SQL Editor:
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.restaurant_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  postal_code TEXT,
  cuisines TEXT[] DEFAULT '{}',
  service_type TEXT NOT NULL DEFAULT 'dinein_takeout',
  availability TEXT[] DEFAULT '{}',
  uploaded_menu_filename TEXT,
  launch_offer TEXT NOT NULL DEFAULT 'credits_3k',
  provide_pos_machine BOOLEAN NOT NULL DEFAULT true,
  setup_call_requested BOOLEAN NOT NULL DEFAULT true,
  plan TEXT NOT NULL DEFAULT 'growth',
  billing_period TEXT NOT NULL DEFAULT 'yearly',
  lead_status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'medium',
  call_attempts INTEGER NOT NULL DEFAULT 0,
  first_called_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  follow_up_date DATE,
  merchant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurant_leads(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  category TEXT NOT NULL DEFAULT 'Mains',
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurant_leads(id) ON DELETE SET NULL,
  merchant_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
  status TEXT NOT NULL DEFAULT 'active',
  is_accepting_orders BOOLEAN NOT NULL DEFAULT true,
  has_recraft_images BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurant_leads(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT 'Admin',
  outcome TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurant_leads(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT 'Admin',
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.restaurant_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public on restaurant_leads" ON public.restaurant_leads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public on dishes" ON public.dishes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public on merchants" ON public.merchants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public on call_logs" ON public.call_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public on admin_notes" ON public.admin_notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
`;
