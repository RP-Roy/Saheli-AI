-- ==============================================================================
-- Migration: 20231024000002_emergency_contacts_and_sos.sql
-- Description: Enhances trusted_contacts with consent fields & RLS policies,
--              and updates incidents table for on-demand SOS triggering.
-- ==============================================================================

-- 1. Enhance trusted_contacts table with consent & timestamps
ALTER TABLE public.trusted_contacts
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Ensure RLS is active on trusted_contacts
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing generic policy if present to enforce specific CRUD policies
DROP POLICY IF EXISTS "Users can manage own contacts" ON public.trusted_contacts;
DROP POLICY IF EXISTS "Users can view own contacts" ON public.trusted_contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON public.trusted_contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.trusted_contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.trusted_contacts;

CREATE POLICY "Users can view own contacts" ON public.trusted_contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contacts" ON public.trusted_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contacts" ON public.trusted_contacts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contacts" ON public.trusted_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Performance index for trusted_contacts lookup by user_id and enabled status
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user_enabled ON public.trusted_contacts(user_id, enabled);

-- 2. Enhance incidents table for on-demand SOS triggers outside active journeys
ALTER TABLE public.incidents
ALTER COLUMN journey_id DROP NOT NULL;

ALTER TABLE public.incidents
ADD COLUMN IF NOT EXISTS sos_message TEXT,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS contacts_notified JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Ensure RLS is active on incidents
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can view own incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can insert own incidents" ON public.incidents;
DROP POLICY IF EXISTS "Users can update own incidents" ON public.incidents;

CREATE POLICY "Users can view own incidents" ON public.incidents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own incidents" ON public.incidents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incidents" ON public.incidents
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Ensure realtime publication includes trusted_contacts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'trusted_contacts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE trusted_contacts;
  END IF;
END $$;
