-- Enable RLS on all public data tables that currently lack it

-- 1. inactive_role_signals - job signals that are inactive
ALTER TABLE public.inactive_role_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view inactive role signals"
ON public.inactive_role_signals
FOR SELECT
TO authenticated
USING (true);

-- 2. opening_signals - active job opening signals
ALTER TABLE public.opening_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view opening signals"
ON public.opening_signals
FOR SELECT
TO authenticated
USING (true);

-- 3. opening_signals_history - historical job opening data
ALTER TABLE public.opening_signals_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view opening signals history"
ON public.opening_signals_history
FOR SELECT
TO authenticated
USING (true);

-- 4. openings - job openings data
ALTER TABLE public.openings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view openings"
ON public.openings
FOR SELECT
TO authenticated
USING (true);