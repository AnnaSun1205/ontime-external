-- Enable RLS on opening_seen table if not already enabled
ALTER TABLE public.opening_seen ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view their own seen listings
CREATE POLICY "Users can view their own seen listings"
ON public.opening_seen
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Authenticated users can insert their own seen listings
CREATE POLICY "Users can insert their own seen listings"
ON public.opening_seen
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Authenticated users can update their own seen listings
CREATE POLICY "Users can update their own seen listings"
ON public.opening_seen
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Authenticated users can delete their own seen listings
CREATE POLICY "Users can delete their own seen listings"
ON public.opening_seen
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

