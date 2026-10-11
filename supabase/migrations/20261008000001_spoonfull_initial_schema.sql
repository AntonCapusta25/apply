-- ====================================================================
-- Spoonfull - Brand New Restaurant Onboarding & Merchant CRM Schema
-- Migration: 20261008000001_spoonfull_initial_schema.sql
-- ====================================================================

-- 1. Restaurants (Leads & Applications)
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
  service_type TEXT NOT NULL DEFAULT 'restaurant_takeaway',
  availability TEXT[] DEFAULT '{}',
  uploaded_menu_filename TEXT,
  uploaded_menu_url TEXT,
  launch_offer TEXT NOT NULL DEFAULT 'credits_3k', -- 'credits_3k' (€3,000 fee credit) or 'free_2_months' (2 months 0% free usage)
  provide_pos_machine BOOLEAN NOT NULL DEFAULT true,
  setup_call_requested BOOLEAN NOT NULL DEFAULT true,
  plan TEXT NOT NULL DEFAULT 'growth',
  billing_period TEXT NOT NULL DEFAULT 'yearly',
  lead_status TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'menu_ready', 'contract_pending', 'merchant_created', 'live', 'paused'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'
  call_attempts INTEGER NOT NULL DEFAULT 0,
  first_called_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  follow_up_date DATE,
  merchant_id UUID,
  assigned_to TEXT, -- User ID of assigned salesperson or admin
  assigned_to_name TEXT, -- Display name of assigned team member
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Restaurant Menu Dishes
CREATE TABLE IF NOT EXISTS public.dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES public.restaurant_leads(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  category TEXT NOT NULL DEFAULT 'Mains', -- 'Starters', 'Mains', 'Desserts', 'Drinks', 'Sides'
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Merchants (Published / Live Stores on Spoonfull Platform)
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
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'pending_setup', 'paused'
  is_accepting_orders BOOLEAN NOT NULL DEFAULT true,
  has_recraft_images BOOLEAN NOT NULL DEFAULT false,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key back to merchant if generated
ALTER TABLE public.restaurant_leads 
  ADD CONSTRAINT fk_restaurant_merchant 
  FOREIGN KEY (merchant_id) 
  REFERENCES public.merchants(id) 
  ON DELETE SET NULL;

-- 4. Call Logs
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurant_leads(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT 'Admin',
  outcome TEXT NOT NULL, -- 'Answered - Interested', 'Answered - Follow Up Needed', 'No Answer / Left Voicemail', 'Call Scheduled', 'Not Interested'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Admin Notes History
CREATE TABLE IF NOT EXISTS public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurant_leads(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT 'Admin',
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- Performance Indexes
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_restaurant_leads_status ON public.restaurant_leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_restaurant_leads_city ON public.restaurant_leads(city);
CREATE INDEX IF NOT EXISTS idx_restaurant_leads_created_at ON public.restaurant_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dishes_restaurant_id ON public.dishes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_restaurant_id ON public.call_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_restaurant_id ON public.admin_notes(restaurant_id);

-- ====================================================================
-- Row Level Security (RLS)
-- ====================================================================
ALTER TABLE public.restaurant_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Allow public & onboarding applicants to submit and read
CREATE POLICY "Public full access to restaurant_leads"
  ON public.restaurant_leads
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public full access to dishes"
  ON public.dishes
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public full access to merchants"
  ON public.merchants
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public full access to call_logs"
  ON public.call_logs
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public full access to admin_notes"
  ON public.admin_notes
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
