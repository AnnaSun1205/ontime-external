-- Fix remaining SECURITY DEFINER functions with search_path

-- 1. Fix update_opening_signals_is_active function (already has SECURITY DEFINER, add search_path)
CREATE OR REPLACE FUNCTION public.update_opening_signals_is_active()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    -- Mark listings as inactive if last_seen_at is older than 7 days
    UPDATE public.opening_signals
    SET is_active = false
    WHERE is_active = true
    AND last_seen_at < (now() - interval '7 days');
    
    -- Mark listings as active if last_seen_at is within 7 days
    UPDATE public.opening_signals
    SET is_active = true
    WHERE is_active = false
    AND last_seen_at >= (now() - interval '7 days');
END;
$function$;

-- 2. Fix call_refresh_opening_signals_function (already has SECURITY DEFINER, add search_path)
CREATE OR REPLACE FUNCTION public.call_refresh_opening_signals_function()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  supabase_url text;
  function_url text;
  service_role_key text;
  request_id bigint;
BEGIN
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.supabase_service_role_key', true);
  
  IF supabase_url IS NULL OR supabase_url = '' THEN
    RAISE EXCEPTION 'app.settings.supabase_url not set. Please set it via: ALTER DATABASE postgres SET app.settings.supabase_url = ''https://YOUR_PROJECT.supabase.co'';';
  END IF;
  
  IF service_role_key IS NULL OR service_role_key = '' THEN
    RAISE EXCEPTION 'app.settings.supabase_service_role_key not set. Please set it via: ALTER DATABASE postgres SET app.settings.supabase_service_role_key = ''YOUR_SERVICE_ROLE_KEY'';';
  END IF;
  
  function_url := supabase_url || '/functions/v1/refresh_opening_signals';
  
  SELECT net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  ) INTO request_id;
  
  RAISE NOTICE 'Edge Function called. Request ID: %', request_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error calling refresh_opening_signals function: %', SQLERRM;
    RAISE;
END;
$function$;

-- 3. Fix call_refresh_opening_signals function (already has SECURITY DEFINER, add search_path)
CREATE OR REPLACE FUNCTION public.call_refresh_opening_signals()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
declare
  service_key text;
begin
  select decrypted_secret
    into service_key
  from vault.decrypted_secrets
  where name = 'SERVICE_ROLE_KEY'
  limit 1;

  if service_key is null then
    raise exception 'SERVICE_ROLE_KEY not found in Vault';
  end if;

  perform net.http_post(
    url := 'https://mmrbryazxgrekyvjwule.supabase.co/functions/v1/refresh_opening_signals',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{}'::jsonb
  );
end;
$function$;