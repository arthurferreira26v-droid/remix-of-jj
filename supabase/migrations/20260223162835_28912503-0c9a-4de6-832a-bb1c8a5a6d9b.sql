
-- Allow anyone to update quick_match_rooms (needed for guest joining and ready status)
CREATE POLICY "Anyone can update rooms"
ON public.quick_match_rooms
FOR UPDATE
USING (true)
WITH CHECK (true);
