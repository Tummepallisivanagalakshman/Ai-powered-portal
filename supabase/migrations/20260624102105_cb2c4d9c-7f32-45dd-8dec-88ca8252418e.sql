
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('candidate', 'recruiter', 'hiring_manager');

-- Application status enum
CREATE TYPE public.application_status AS ENUM ('applied', 'screening', 'shortlisted', 'rejected', 'approved');

-- Job status enum
CREATE TYPE public.job_status AS ENUM ('open', 'closed');

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- has_role security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Jobs
CREATE TABLE public.jobs (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  employment_type TEXT,
  description TEXT NOT NULL,
  requirements TEXT,
  status public.job_status NOT NULL DEFAULT 'open',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view jobs" ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Recruiters can create jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'recruiter') AND auth.uid() = created_by);
CREATE POLICY "Recruiters can update jobs" ON public.jobs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'recruiter')) WITH CHECK (public.has_role(auth.uid(), 'recruiter'));
CREATE POLICY "Recruiters can delete own jobs" ON public.jobs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'recruiter') AND auth.uid() = created_by);

-- Applications
CREATE TABLE public.applications (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_path TEXT,
  resume_text TEXT,
  cover_note TEXT,
  status public.application_status NOT NULL DEFAULT 'applied',
  ai_score INTEGER,
  ai_summary TEXT,
  ai_strengths TEXT,
  ai_concerns TEXT,
  ai_recommendation TEXT,
  manager_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, candidate_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Candidates view own applications" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = candidate_id);
CREATE POLICY "Recruiters and managers view all applications" ON public.applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'hiring_manager'));
CREATE POLICY "Candidates create own applications" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = candidate_id AND public.has_role(auth.uid(), 'candidate'));
CREATE POLICY "Recruiters update applications" ON public.applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'recruiter')) WITH CHECK (public.has_role(auth.uid(), 'recruiter'));
CREATE POLICY "Managers update applications" ON public.applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'hiring_manager')) WITH CHECK (public.has_role(auth.uid(), 'hiring_manager'));

-- Interview questions
CREATE TABLE public.interview_questions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  questions JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_questions TO authenticated;
GRANT ALL ON public.interview_questions TO service_role;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recruiters and managers view questions" ON public.interview_questions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'recruiter') OR public.has_role(auth.uid(), 'hiring_manager'));
CREATE POLICY "Recruiters create questions" ON public.interview_questions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'recruiter') AND auth.uid() = created_by);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- New user handler: create profile and assign chosen role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chosen_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email);

  BEGIN
    chosen_role := (NEW.raw_user_meta_data->>'role')::public.app_role;
  EXCEPTION WHEN others THEN
    chosen_role := 'candidate';
  END;

  IF chosen_role IS NULL THEN
    chosen_role := 'candidate';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, chosen_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
