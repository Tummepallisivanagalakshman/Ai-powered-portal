import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  MapPin,
  Radio,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGate } from "@/components/RoleGate";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { applyToJob, getJob, hasApplied } from "@/lib/api";
import { parseResumeFields } from "@/lib/ai.functions";
import type { Job } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/apply/$jobId")({
  head: () => ({
    meta: [
      { title: "Apply for a Role — TalentScreen" },
      {
        name: "description",
        content: "Submit your application with your details and resume for this open role.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Apply for a Role — TalentScreen" },
      {
        property: "og:description",
        content: "Submit your application and resume for this open role in TalentScreen.",
      },
    ],
  }),
  component: () => (
    <RoleGate role="candidate">
      <ApplyPage />
    </RoleGate>
  ),
});

const formSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").max(120, "Full name is too long"),
  email: z.string().trim().email("Enter a valid email address").max(255, "Email is too long"),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30, "Phone number is too long"),
  education: z.string().trim().min(1, "Education is required").max(2000),
  skills: z.string().trim().min(1, "Skills are required").max(2000),
  experience: z.string().trim().min(1, "Experience is required").max(4000),
  coverNote: z.string().trim().max(4000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

function ApplyPage() {
  const { user } = useAuth();
  const userId = user!.id;
  const { jobId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const jobQuery = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => getJob(jobId),
  });
  const appliedQuery = useQuery({
    queryKey: ["has-applied", userId, jobId],
    queryFn: () => hasApplied(userId, jobId),
  });

  // Live updates: subscribe to changes to this job and to this candidate's
  // applications so the description and application status stay in sync in
  // real time without a manual refresh.
  useEffect(() => {
    const channel = supabase
      .channel(`apply-${jobId}-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["job", jobId] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          filter: `candidate_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["has-applied", userId, jobId],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, userId, queryClient]);

  const [values, setValues] = useState<FormValues>({
    fullName: "",
    email: user?.email ?? "",

    phone: "",
    education: "",
    skills: "",
    experience: "",
    coverNote: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [autofilling, setAutofilling] = useState(false);

  useEffect(() => {
    if (user?.email && !values.email) {
      setValues((v) => ({ ...v, email: user.email ?? "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const set = (key: keyof FormValues, value: string) => setValues((v) => ({ ...v, [key]: value }));

  // When a PDF resume is selected, extract its text and use AI to auto-fill the
  // form. Existing values entered by the user are preserved (only empty fields
  // are filled), except the form is always populated where the resume has data.
  async function handleResumeChange(selected: File | null) {
    setFile(selected);
    setErrors((e) => ({ ...e, resume: "" }));
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      setErrors((e) => ({ ...e, resume: "Resume must be a PDF file" }));
      return;
    }

    setAutofilling(true);
    try {
      const { extractPdfText } = await import("@/lib/pdf");
      const text = await extractPdfText(selected);
      if (!text.trim()) {
        toast.error("Couldn't read text from this PDF. Please fill in your details manually.");
        return;
      }
      const parsed = await parseResumeFields({ data: { resumeText: text } });
      setValues((v) => ({
        fullName: parsed.fullName || v.fullName,
        email: v.email || parsed.email,
        phone: parsed.phone || v.phone,
        education: parsed.education || v.education,
        skills: parsed.skills || v.skills,
        experience: parsed.experience || v.experience,
        coverNote: v.coverNote,
      }));
      toast.success("Details auto-filled from your resume. Please review before submitting.");
    } catch (err) {
      console.error("Resume autofill failed:", err);
      toast.error("Couldn't auto-fill from this resume. Please fill in your details manually.");
    } finally {
      setAutofilling(false);
    }
  }

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      applyToJob(userId, {
        jobId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        education: data.education,
        skills: data.skills,
        experience: data.experience,
        coverNote: data.coverNote ?? "",
        resumeFile: file,
      }),
    onSuccess: () => setSubmitted(true),
    onError: (e: Error) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = formSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[issue.path[0] as string] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    if (file && file.type !== "application/pdf") {
      setErrors({ resume: "Resume must be a PDF file" });
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  const job = jobQuery.data;

  if (submitted) {
    return (
      <AppShell title="Application submitted">
        <div className="animate-scale-in mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <div className="animate-pop-in mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>

          <h2 className="mt-4 font-display text-2xl font-semibold">Application submitted!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your application for <span className="font-medium text-foreground">{job?.title}</span>{" "}
            has been received. Its status is now <Badge>Applied</Badge>. You can track its progress
            from your dashboard.
          </p>
          {job && (
            <div className="mt-6 rounded-xl border border-border bg-secondary/30 p-5 text-left">
              <h3 className="font-display text-sm font-semibold">About this role</h3>
              <JobDescription job={job} className="mt-2" />
            </div>
          )}

          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link to="/candidate">Go to dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/jobs">Browse more jobs</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Job application" subtitle="Fill in your details to apply for this position.">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/jobs">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to jobs
          </Link>
        </Button>
      </div>

      {jobQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !job ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          This job could not be found.
        </div>
      ) : appliedQuery.data ? (
        <div className="mx-auto max-w-lg space-y-4">
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-3 font-display text-xl font-semibold">You've already applied</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You have already submitted an application for {job.title}.
            </p>
            <Button className="mt-5" asChild>
              <Link to="/candidate">View my applications</Link>
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-display text-base font-semibold">{job.title}</h3>
            <JobDescription job={job} className="mt-3" />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Job summary */}
          <aside className="lg:col-span-1">
            <div className="animate-fade-up rounded-2xl border border-border bg-card p-5 shadow-soft lg:sticky lg:top-24">
              <h2 className="font-display text-lg font-semibold leading-tight">{job.title}</h2>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" /> {job.department || "General"}
                </p>
                {job.company && (
                  <p className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" /> {job.company}
                  </p>
                )}
                {job.location && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {job.location}
                  </p>
                )}
              </div>
              {job.skills && job.skills.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Required skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <JobDescription job={job} className="mt-5 border-t border-border pt-4" />

              <p className="mt-4 flex items-center gap-1.5 text-xs text-success">
                <Radio className="h-3.5 w-3.5 animate-pulse" /> Live — updates in real time
              </p>
            </div>
          </aside>

          {/* Application form */}
          <form
            onSubmit={onSubmit}
            style={{ animationDelay: "90ms" }}
            className="animate-fade-up space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="fullName" label="Full name" error={errors.fullName}>
                <Input
                  id="fullName"
                  value={values.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="Jane Doe"
                />
              </Field>
              <Field id="email" label="Email" error={errors.email}>
                <Input
                  id="email"
                  type="email"
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="jane@example.com"
                />
              </Field>
            </div>

            <Field id="phone" label="Phone number" error={errors.phone}>
              <Input
                id="phone"
                type="tel"
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 555 123 4567"
              />
            </Field>

            <Field id="education" label="Education" error={errors.education}>
              <Textarea
                id="education"
                rows={3}
                value={values.education}
                onChange={(e) => set("education", e.target.value)}
                placeholder="Degrees, institutions, graduation years…"
              />
            </Field>

            <Field id="skills" label="Skills" error={errors.skills}>
              <Textarea
                id="skills"
                rows={2}
                value={values.skills}
                onChange={(e) => set("skills", e.target.value)}
                placeholder="e.g. React, TypeScript, Node.js, SQL"
              />
            </Field>

            <Field id="experience" label="Experience" error={errors.experience}>
              <Textarea
                id="experience"
                rows={5}
                value={values.experience}
                onChange={(e) => set("experience", e.target.value)}
                placeholder="Summarize your work history, roles, and achievements…"
              />
            </Field>

            <Field id="resume" label="Resume (PDF)" error={errors.resume}>
              <div className="flex items-center gap-2">
                <Input
                  id="resume"
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={autofilling}
                  onChange={(e) => handleResumeChange(e.target.files?.[0] ?? null)}
                />
                <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              {autofilling ? (
                <p className="flex items-center gap-1.5 text-xs text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Reading your resume and auto-filling the form…
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Upload a PDF resume to auto-fill your details below.
                </p>
              )}
            </Field>

            <Field id="coverNote" label="Cover letter" error={errors.coverNote} optional>
              <Textarea
                id="coverNote"
                rows={4}
                value={values.coverNote}
                onChange={(e) => set("coverNote", e.target.value)}
                placeholder="Tell us why you're a great fit for this role…"
              />
            </Field>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/jobs" })}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending || autofilling}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit application
              </Button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}

function JobDescription({ job, className = "" }: { job: Job; className?: string }) {
  const description = job.description?.trim();
  return (
    <div className={className}>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <FileText className="h-3.5 w-3.5" /> Job description
      </p>
      {description ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : (
        <p className="text-sm italic text-muted-foreground">
          No description provided for this role.
        </p>
      )}
    </div>
  );
}

function Field({
  id,
  label,
  error,
  optional,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {optional && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
        )}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
