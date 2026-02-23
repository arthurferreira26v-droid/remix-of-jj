
-- Table to store quick match room codes
CREATE TABLE public.quick_match_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  team_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quick_match_rooms ENABLE ROW LEVEL SECURITY;

-- Anyone can read rooms (to validate codes)
CREATE POLICY "Anyone can read rooms"
  ON public.quick_match_rooms FOR SELECT
  USING (true);

-- Anyone can create rooms (no auth required for quick match)
CREATE POLICY "Anyone can create rooms"
  ON public.quick_match_rooms FOR INSERT
  WITH CHECK (true);

-- Auto-cleanup old rooms (optional index for queries)
CREATE INDEX idx_quick_match_rooms_code ON public.quick_match_rooms (code);
