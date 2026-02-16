
-- Table for admin player overrides (global, shared across all users)
CREATE TABLE public.admin_player_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id TEXT NOT NULL,
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(team_id)
);

-- Table for admin team logo overrides (global, shared across all users)
CREATE TABLE public.admin_team_logos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(team_id)
);

-- RLS enabled but publicly readable
ALTER TABLE public.admin_player_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_team_logos ENABLE ROW LEVEL SECURITY;

-- Everyone can read (global data)
CREATE POLICY "Anyone can read player overrides" ON public.admin_player_overrides FOR SELECT USING (true);
CREATE POLICY "Anyone can read team logos" ON public.admin_team_logos FOR SELECT USING (true);

-- Only authenticated users can insert/update/delete (admin panel requires password anyway)
CREATE POLICY "Authenticated users can insert player overrides" ON public.admin_player_overrides FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update player overrides" ON public.admin_player_overrides FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete player overrides" ON public.admin_player_overrides FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert team logos" ON public.admin_team_logos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update team logos" ON public.admin_team_logos FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete team logos" ON public.admin_team_logos FOR DELETE USING (auth.uid() IS NOT NULL);
