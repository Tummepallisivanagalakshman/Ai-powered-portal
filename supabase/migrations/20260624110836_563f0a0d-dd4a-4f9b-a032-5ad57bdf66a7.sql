ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS match_score integer,
  ADD COLUMN IF NOT EXISTS matching_skills text,
  ADD COLUMN IF NOT EXISTS missing_skills text,
  ADD COLUMN IF NOT EXISTS match_recommendation text;