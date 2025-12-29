-- Fix function search path mutable issues by setting explicit search_path

-- 1. Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 2. Fix preserve_first_seen_at function
CREATE OR REPLACE FUNCTION public.preserve_first_seen_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.first_seen_at IS NOT NULL THEN
        NEW.first_seen_at = OLD.first_seen_at;
    END IF;
    RETURN NEW;
END;
$function$;

-- 3. Fix preserve_opening_signals_first_seen_at function
CREATE OR REPLACE FUNCTION public.preserve_opening_signals_first_seen_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    IF OLD.first_seen_at IS NOT NULL AND NEW.first_seen_at IS NOT NULL THEN
        NEW.first_seen_at = OLD.first_seen_at;
    END IF;
    RETURN NEW;
END;
$function$;

-- 4. Fix compute_listing_hash function
CREATE OR REPLACE FUNCTION public.compute_listing_hash(p_company_name text, p_role_title text, p_location text, p_term text, p_apply_url text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path = public
AS $function$
BEGIN
    RETURN encode(
        digest(
            COALESCE(p_company_name, '') || 
            COALESCE(p_role_title, '') || 
            COALESCE(p_location, '') || 
            COALESCE(p_term, '') || 
            COALESCE(p_apply_url, ''),
            'sha256'
        ),
        'hex'
    );
END;
$function$;

-- 5. Fix trigger_update_is_active function
CREATE OR REPLACE FUNCTION public.trigger_update_is_active()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    IF NEW.last_seen_at >= (now() - interval '7 days') THEN
        NEW.is_active = true;
    ELSE
        NEW.is_active = false;
    END IF;
    RETURN NEW;
END;
$function$;

-- 6. Fix set_updated_at function
CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;