-- Enable RLS on opening_signal_countries table
ALTER TABLE public.opening_signal_countries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view opening signal countries (public data like opening_signals)
CREATE POLICY "Anyone can view opening signal countries"
ON public.opening_signal_countries
FOR SELECT
USING (true);