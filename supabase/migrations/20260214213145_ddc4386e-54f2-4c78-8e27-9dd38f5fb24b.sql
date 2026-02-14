
-- Fix: Change update_team_budgets_updated_at from SECURITY DEFINER to SECURITY INVOKER
CREATE OR REPLACE FUNCTION public.update_team_budgets_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
