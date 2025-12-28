-- Remove email column from profiles table to eliminate PII exposure surface
-- Email is already securely stored in auth.users and doesn't need to be duplicated

-- Step 1: Drop the email column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Step 2: Update the trigger function to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;