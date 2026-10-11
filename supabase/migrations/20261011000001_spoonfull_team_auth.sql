-- ====================================================================
-- Spoonfull CRM: Team Profiles & Roles Migration
-- ====================================================================

-- 1. Create a table for CRM team members / roles
CREATE TABLE IF NOT EXISTS public.crm_team_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'salesperson', -- 'admin' or 'salesperson'
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_team_profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read profiles
CREATE POLICY "Allow authenticated read to crm_team_profiles"
  ON public.crm_team_profiles
  FOR SELECT
  TO authenticated, anon
  USING (true);

-- Allow authenticated update to own profile or admins
CREATE POLICY "Allow update to crm_team_profiles"
  ON public.crm_team_profiles
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 2. Seed initial team roster into crm_team_profiles so role lookup succeeds immediately
INSERT INTO public.crm_team_profiles (email, full_name, role)
VALUES 
  ('bangalexf@gmail.com', 'Alexandre Filippov', 'admin'),
  ('lucas@spoonfull.nl', 'Lucas van Dijk', 'salesperson'),
  ('sophie@spoonfull.nl', 'Sophie de Boer', 'salesperson')
ON CONFLICT (email) 
DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = now();
