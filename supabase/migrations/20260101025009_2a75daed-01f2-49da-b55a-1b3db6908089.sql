-- Drop and recreate the opening_signals_main view as SECURITY INVOKER (default)
-- This ensures the view respects RLS policies of the querying user
DROP VIEW IF EXISTS public.opening_signals_main;

CREATE VIEW public.opening_signals_main
WITH (security_invoker = true)
AS
SELECT os.id,
    os.source,
    os.term,
    os.signal_type,
    os.company_name,
    os.role_title,
    os.location,
    os.apply_url,
    os.first_seen_at,
    os.last_seen_at,
    os.created_at,
    os.updated_at,
    os.listing_hash,
    os.is_active,
    os.posted_at,
    os.age_days,
    os.source_first_seen_at,
    os.country,
    COALESCE(array_agg(DISTINCT osc.country) FILTER (WHERE (osc.country IS NOT NULL)), '{}'::text[]) AS countries
FROM opening_signals os
LEFT JOIN opening_signal_countries osc ON osc.opening_id = os.id
GROUP BY os.id;