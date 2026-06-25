-- Finding 1: SECURITY DEFINER functions callable by authenticated users

-- has_role only checks the caller's own roles (always auth.uid()), and users can
-- read their own user_roles rows, so SECURITY INVOKER is sufficient and removes
-- the definer-execution risk while keeping every RLS policy working.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- handle_new_user must stay SECURITY DEFINER (it writes profiles/user_roles at
-- signup) but should only ever run from the auth trigger, never via the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Finding 2: profiles email/full_name exposed to all authenticated users
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Recruiters and managers can view profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'recruiter'::public.app_role)
  OR public.has_role(auth.uid(), 'hiring_manager'::public.app_role)
);

-- Finding 3: prevent privilege escalation via direct user_roles writes.
-- Role assignment happens only through the SECURITY DEFINER signup trigger.
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM PUBLIC, anon, authenticated;