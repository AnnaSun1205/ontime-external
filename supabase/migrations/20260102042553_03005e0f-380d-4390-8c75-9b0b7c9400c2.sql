-- Add role_category column with ENUM type for predefined categories
CREATE TYPE public.role_category AS ENUM (
  'software_engineering',
  'product_management',
  'data_science',
  'quantitative_finance',
  'hardware_engineering',
  'other'
);

-- Add job_type column with ENUM type
CREATE TYPE public.job_type AS ENUM (
  'internship',
  'new_grad'
);

-- Add columns to opening_signals table
ALTER TABLE public.opening_signals
ADD COLUMN role_category public.role_category DEFAULT 'software_engineering',
ADD COLUMN job_type public.job_type DEFAULT 'internship';

-- Add columns to inactive_role_signals table for consistency
ALTER TABLE public.inactive_role_signals
ADD COLUMN role_category public.role_category DEFAULT 'software_engineering',
ADD COLUMN job_type public.job_type DEFAULT 'internship';

-- Create indexes for efficient filtering
CREATE INDEX idx_opening_signals_role_category ON public.opening_signals(role_category);
CREATE INDEX idx_opening_signals_job_type ON public.opening_signals(job_type);
CREATE INDEX idx_opening_signals_category_type_active ON public.opening_signals(role_category, job_type, is_active);

-- Create a function to classify role_category based on role_title
CREATE OR REPLACE FUNCTION public.classify_role_category(p_role_title TEXT)
RETURNS public.role_category
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  -- Product Management
  IF p_role_title ~* '(product\s*(manager|management|lead)|pm\s+intern|product\s+intern|apm)' THEN
    RETURN 'product_management';
  END IF;
  
  -- Data Science / AI / ML
  IF p_role_title ~* '(data\s*scien|machine\s*learn|ml\s+|ai\s+|artificial\s+intelligence|deep\s*learn|nlp|computer\s*vision|analytics|data\s*analyst|business\s*intelligence)' THEN
    RETURN 'data_science';
  END IF;
  
  -- Quantitative Finance
  IF p_role_title ~* '(quant|trading|quantitative|algorithmic|strat|risk\s*anal|financial\s*engineer)' THEN
    RETURN 'quantitative_finance';
  END IF;
  
  -- Hardware Engineering
  IF p_role_title ~* '(hardware|electrical|embedded|firmware|asic|fpga|chip|semiconductor|vlsi|circuit|pcb)' THEN
    RETURN 'hardware_engineering';
  END IF;
  
  -- Software Engineering (broad catch for software/engineering roles)
  IF p_role_title ~* '(software|swe|sde|developer|engineer|programming|full\s*stack|front\s*end|back\s*end|devops|platform|infrastructure|site\s*reliability|cloud)' THEN
    RETURN 'software_engineering';
  END IF;
  
  -- Default to other
  RETURN 'other';
END;
$$;

-- Create a function to classify job_type based on role_title and term
CREATE OR REPLACE FUNCTION public.classify_job_type(p_role_title TEXT, p_term TEXT)
RETURNS public.job_type
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
BEGIN
  -- Check for new grad indicators
  IF p_role_title ~* '(new\s*grad|entry\s*level|junior|associate|graduate|full\s*time)' 
     OR p_term ~* '(new\s*grad|full\s*time|2025|2026)' AND p_role_title !~* 'intern' THEN
    -- But not if it explicitly says intern
    IF p_role_title !~* 'intern' THEN
      RETURN 'new_grad';
    END IF;
  END IF;
  
  -- Default to internship (most common case)
  RETURN 'internship';
END;
$$;

-- Backfill existing data with classifications
UPDATE public.opening_signals
SET 
  role_category = public.classify_role_category(role_title),
  job_type = public.classify_job_type(role_title, term)
WHERE role_category IS NULL OR job_type IS NULL OR role_category = 'software_engineering';

-- Update the view to include new columns
DROP VIEW IF EXISTS public.opening_signals_main;
CREATE VIEW public.opening_signals_main AS
SELECT 
  os.*,
  ARRAY_AGG(DISTINCT osc.country) FILTER (WHERE osc.country IS NOT NULL) as countries
FROM public.opening_signals os
LEFT JOIN public.opening_signal_countries osc ON os.id = osc.opening_id
GROUP BY os.id;