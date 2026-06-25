ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}';