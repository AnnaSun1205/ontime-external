-- Add last_seen_listings_at column to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS last_seen_listings_at TIMESTAMP WITH TIME ZONE DEFAULT now();