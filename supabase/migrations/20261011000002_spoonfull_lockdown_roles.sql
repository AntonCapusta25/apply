-- ====================================================================
-- Spoonfull CRM: Real role enforcement + RLS lockdown
-- - Roles live ONLY in crm_team_profiles (admin | salesperson)
-- - Only authenticated Supabase users that have a profile row get CRM access
-- - Public (anon) can only SUBMIT applications, never read CRM data
-- ====================================================================

-- 0. Bring older live tables up to date (columns the app + policies rely on)
ALTER TABLE public.restaurant_leads ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE public.restaurant_leads ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;
ALTER TABLE public.restaurant_leads ADD COLUMN IF NOT EXISTS lead_status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE public.restaurant_leads ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE public.restaurant_leads ADD COLUMN IF NOT EXISTS call_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.restaurant_leads ADD COLUMN IF NOT EXISTS first_called_at TIMESTAMPTZ;
ALTER TABLE public.restaurant_leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE public.restaurant_leads ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE public.restaurant_leads ADD COLUMN IF NOT EXISTS merchant_id UUID;
ALTER TABLE public.restaurant_leads ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'growth';
ALTER TABLE public.restaurant_leads ADD COLUMN IF NOT EXISTS billing_period TEXT NOT NULL DEFAULT 'yearly';
ALTER TABLE public.restaurant_leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_restaurant_leads_assigned_to ON public.restaurant_leads(assigned_to);

-- 1. Clean up team profiles: lowercase emails, enforce valid roles, drop placeholder users
UPDATE public.crm_team_profiles SET email = lower(trim(email));

DELETE FROM public.crm_team_profiles
WHERE email IN ('lucas@spoonfull.nl', 'sophie@spoonfull.nl');

ALTER TABLE public.crm_team_profiles
  DROP CONSTRAINT IF EXISTS crm_team_profiles_role_check;
ALTER TABLE public.crm_team_profiles
  ADD CONSTRAINT crm_team_profiles_role_check CHECK (role IN ('admin', 'salesperson'));

INSERT INTO public.crm_team_profiles (email, full_name, role)
VALUES ('bangalexf@gmail.com', 'Alexandre Filippov', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin', updated_at = now();

-- Unassign leads that pointed at the old placeholder ids
UPDATE public.restaurant_leads
SET assigned_to = NULL, assigned_to_name = NULL
WHERE assigned_to LIKE 'user-%';

-- 2. Helper functions (SECURITY DEFINER so they can read profiles regardless of RLS)
CREATE OR REPLACE FUNCTION public.crm_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.crm_team_profiles
  WHERE email = lower(coalesce(auth.jwt() ->> 'email', ''))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.crm_profile_id()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id::text FROM public.crm_team_profiles
  WHERE email = lower(coalesce(auth.jwt() ->> 'email', ''))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.crm_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.crm_profile_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.crm_profile_id() TO authenticated;

-- 3. Drop EVERY existing policy on CRM tables (old open ones + any from a previous run)
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('restaurant_leads', 'dishes', 'merchants', 'call_logs', 'admin_notes', 'crm_team_profiles')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

ALTER TABLE public.restaurant_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_team_profiles ENABLE ROW LEVEL SECURITY;

-- 4. crm_team_profiles: team can read, ONLY admins can change roles / members
CREATE POLICY "team_read_profiles" ON public.crm_team_profiles
  FOR SELECT TO authenticated
  USING (public.crm_role() IS NOT NULL);

CREATE POLICY "admin_manage_profiles" ON public.crm_team_profiles
  FOR ALL TO authenticated
  USING (public.crm_role() = 'admin')
  WITH CHECK (public.crm_role() = 'admin');

-- 5. restaurant_leads
-- Public onboarding form: insert only, as a fresh unassigned lead
CREATE POLICY "public_submit_lead" ON public.restaurant_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (lead_status = 'new' AND assigned_to IS NULL AND merchant_id IS NULL);

CREATE POLICY "team_read_leads" ON public.restaurant_leads
  FOR SELECT TO authenticated
  USING (public.crm_role() IS NOT NULL);

CREATE POLICY "team_insert_leads" ON public.restaurant_leads
  FOR INSERT TO authenticated
  WITH CHECK (
    public.crm_role() = 'admin'
    OR (public.crm_role() = 'salesperson'
        AND (assigned_to IS NULL OR assigned_to = public.crm_profile_id()))
  );

-- Admin: update anything. Salesperson: only own or unassigned leads, and can only assign to self.
CREATE POLICY "team_update_leads" ON public.restaurant_leads
  FOR UPDATE TO authenticated
  USING (
    public.crm_role() = 'admin'
    OR (public.crm_role() = 'salesperson'
        AND (assigned_to IS NULL OR assigned_to = public.crm_profile_id()))
  )
  WITH CHECK (
    public.crm_role() = 'admin'
    OR (public.crm_role() = 'salesperson'
        AND (assigned_to IS NULL OR assigned_to = public.crm_profile_id()))
  );

CREATE POLICY "admin_delete_leads" ON public.restaurant_leads
  FOR DELETE TO authenticated
  USING (public.crm_role() = 'admin');

-- 6. dishes: public can submit with an application, team reads/edits
CREATE POLICY "public_submit_dishes" ON public.dishes
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "team_read_dishes" ON public.dishes
  FOR SELECT TO authenticated
  USING (public.crm_role() IS NOT NULL);

CREATE POLICY "team_update_dishes" ON public.dishes
  FOR UPDATE TO authenticated
  USING (public.crm_role() IS NOT NULL)
  WITH CHECK (public.crm_role() IS NOT NULL);

CREATE POLICY "admin_delete_dishes" ON public.dishes
  FOR DELETE TO authenticated
  USING (public.crm_role() = 'admin');

-- 7. merchants: team reads, ONLY admins create/modify
CREATE POLICY "team_read_merchants" ON public.merchants
  FOR SELECT TO authenticated
  USING (public.crm_role() IS NOT NULL);

CREATE POLICY "admin_manage_merchants" ON public.merchants
  FOR ALL TO authenticated
  USING (public.crm_role() = 'admin')
  WITH CHECK (public.crm_role() = 'admin');

-- 8. call_logs & admin_notes: team reads + adds, only admins edit/delete
CREATE POLICY "team_read_call_logs" ON public.call_logs
  FOR SELECT TO authenticated USING (public.crm_role() IS NOT NULL);
CREATE POLICY "team_insert_call_logs" ON public.call_logs
  FOR INSERT TO authenticated WITH CHECK (public.crm_role() IS NOT NULL);
CREATE POLICY "admin_modify_call_logs" ON public.call_logs
  FOR UPDATE TO authenticated
  USING (public.crm_role() = 'admin') WITH CHECK (public.crm_role() = 'admin');
CREATE POLICY "admin_delete_call_logs" ON public.call_logs
  FOR DELETE TO authenticated USING (public.crm_role() = 'admin');

CREATE POLICY "team_read_admin_notes" ON public.admin_notes
  FOR SELECT TO authenticated USING (public.crm_role() IS NOT NULL);
CREATE POLICY "team_insert_admin_notes" ON public.admin_notes
  FOR INSERT TO authenticated WITH CHECK (public.crm_role() IS NOT NULL);
CREATE POLICY "admin_modify_admin_notes" ON public.admin_notes
  FOR UPDATE TO authenticated
  USING (public.crm_role() = 'admin') WITH CHECK (public.crm_role() = 'admin');
CREATE POLICY "admin_delete_admin_notes" ON public.admin_notes
  FOR DELETE TO authenticated USING (public.crm_role() = 'admin');
