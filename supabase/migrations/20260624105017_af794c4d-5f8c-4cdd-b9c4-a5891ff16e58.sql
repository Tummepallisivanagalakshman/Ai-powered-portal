-- Lock user_roles down to read-only for client roles; only the signup trigger
-- (SECURITY DEFINER) and service_role may modify role assignments.
REVOKE ALL ON public.user_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;