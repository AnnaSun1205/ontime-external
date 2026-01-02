-- Fix Security Definer View issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.opening_signals_main;

CREATE VIEW public.opening_signals_main
WITH (security_invoker = true)
AS
SELECT 
  os.*,
  ARRAY_AGG(DISTINCT osc.country) FILTER (WHERE osc.country IS NOT NULL) as countries
FROM public.opening_signals os
LEFT JOIN public.opening_signal_countries osc ON os.id = osc.opening_id
GROUP BY os.id;