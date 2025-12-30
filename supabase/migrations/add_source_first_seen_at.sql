-- Add source_first_seen_at column to opening_signals
-- This stores when Simplify says the job was posted (derived from their age string)
-- posted_at remains as system_first_seen_at (when we first discovered it)

alter table public.opening_signals
  add column if not exists source_first_seen_at timestamptz;

-- Create index for efficient queries
create index if not exists idx_opening_signals_source_first_seen_at
  on public.opening_signals (source_first_seen_at desc);

-- Add comment explaining the difference
comment on column public.opening_signals.source_first_seen_at is 
  'When Simplify says the job was posted (derived from their age string like "1mo", "3d")';
comment on column public.opening_signals.posted_at is 
  'When our system first discovered the job (system_first_seen_at)';

