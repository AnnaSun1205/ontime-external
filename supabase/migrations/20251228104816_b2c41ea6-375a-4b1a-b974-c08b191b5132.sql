-- Update RLS policies to allow both anon and authenticated users to view public job listings data
-- Job listings are meant to be publicly viewable, not restricted to only logged-in users

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view opening signals" ON public.opening_signals;
DROP POLICY IF EXISTS "Authenticated users can view inactive role signals" ON public.inactive_role_signals;
DROP POLICY IF EXISTS "Authenticated users can view opening signals history" ON public.opening_signals_history;
DROP POLICY IF EXISTS "Authenticated users can view openings" ON public.openings;

-- Create new policies that allow both anon and authenticated users to read
CREATE POLICY "Anyone can view opening signals"
ON public.opening_signals
FOR SELECT
USING (true);

CREATE POLICY "Anyone can view inactive role signals"
ON public.inactive_role_signals
FOR SELECT
USING (true);

CREATE POLICY "Anyone can view opening signals history"
ON public.opening_signals_history
FOR SELECT
USING (true);

CREATE POLICY "Anyone can view openings"
ON public.openings
FOR SELECT
USING (true);