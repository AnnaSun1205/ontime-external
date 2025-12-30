-- Add country-specific last_seen timestamps to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS last_seen_listings_at_us timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS last_seen_listings_at_ca timestamp with time zone DEFAULT now();

-- Initialize from existing last_seen_listings_at if present
UPDATE public.user_preferences 
SET 
  last_seen_listings_at_us = COALESCE(last_seen_listings_at, now()),
  last_seen_listings_at_ca = COALESCE(last_seen_listings_at, now())
WHERE last_seen_listings_at_us IS NULL OR last_seen_listings_at_ca IS NULL;