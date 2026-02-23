
-- Add guest and ready columns to quick_match_rooms
ALTER TABLE public.quick_match_rooms
  ADD COLUMN guest_team_name TEXT,
  ADD COLUMN host_ready BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN guest_ready BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN host_formation TEXT NOT NULL DEFAULT '4-3-3',
  ADD COLUMN host_play_style TEXT NOT NULL DEFAULT 'balanced',
  ADD COLUMN guest_formation TEXT NOT NULL DEFAULT '4-3-3',
  ADD COLUMN guest_play_style TEXT NOT NULL DEFAULT 'balanced';

-- Enable realtime for quick_match_rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.quick_match_rooms;
