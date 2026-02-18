
-- Fix: Drop any remaining restrictive policies and recreate as permissive
DO $$
BEGIN
  -- admin_player_overrides
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can read player overrides" ON public.admin_player_overrides';
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert player overrides" ON public.admin_player_overrides';
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can update player overrides" ON public.admin_player_overrides';
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can delete player overrides" ON public.admin_player_overrides';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete player overrides" ON public.admin_player_overrides';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert player overrides" ON public.admin_player_overrides';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update player overrides" ON public.admin_player_overrides';

  -- admin_team_logos
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can read team logos" ON public.admin_team_logos';
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert team logos" ON public.admin_team_logos';
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can update team logos" ON public.admin_team_logos';
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can delete team logos" ON public.admin_team_logos';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete team logos" ON public.admin_team_logos';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert team logos" ON public.admin_team_logos';
  EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update team logos" ON public.admin_team_logos';
END $$;

-- Recreate ALL as PERMISSIVE (default)
CREATE POLICY "public_read_overrides" ON public.admin_player_overrides FOR SELECT USING (true);
CREATE POLICY "public_insert_overrides" ON public.admin_player_overrides FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_overrides" ON public.admin_player_overrides FOR UPDATE USING (true);
CREATE POLICY "public_delete_overrides" ON public.admin_player_overrides FOR DELETE USING (true);

CREATE POLICY "public_read_logos" ON public.admin_team_logos FOR SELECT USING (true);
CREATE POLICY "public_insert_logos" ON public.admin_team_logos FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_logos" ON public.admin_team_logos FOR UPDATE USING (true);
CREATE POLICY "public_delete_logos" ON public.admin_team_logos FOR DELETE USING (true);
