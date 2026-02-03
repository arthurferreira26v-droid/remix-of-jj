-- Create update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create game_saves table to store user saves
CREATE TABLE public.game_saves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  slot_number INTEGER NOT NULL CHECK (slot_number >= 1 AND slot_number <= 5),
  club_name TEXT NOT NULL,
  season TEXT NOT NULL DEFAULT '2024',
  budget NUMERIC NOT NULL DEFAULT 0,
  total_sales NUMERIC NOT NULL DEFAULT 0,
  total_purchases NUMERIC NOT NULL DEFAULT 0,
  has_active_investment BOOLEAN NOT NULL DEFAULT false,
  players JSONB NOT NULL DEFAULT '[]'::jsonb,
  season_stats JSONB NOT NULL DEFAULT '{"matchesPlayed": 0, "wins": 0, "draws": 0, "losses": 0, "goalsFor": 0, "goalsAgainst": 0}'::jsonb,
  championship_id TEXT,
  current_round INTEGER,
  settings JSONB NOT NULL DEFAULT '{"autoSave": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, slot_number)
);

-- Enable RLS
ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own saves" 
ON public.game_saves 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saves" 
ON public.game_saves 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saves" 
ON public.game_saves 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves" 
ON public.game_saves 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_game_saves_updated_at
BEFORE UPDATE ON public.game_saves
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();