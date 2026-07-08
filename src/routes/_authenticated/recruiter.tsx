import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Brain,
  Briefcase,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Target,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGate } from "@/components/RoleGate";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/useAuth";
import {
  createJob,
  deleteJob,
  getResumeUrl,
  listAllApplications,
  listMyJobs,
  listQuestions,
  setJobStatus,
  updateApplicationStatus,
  updateJob,
  type ApplicationWithDetails,
  type JobInput,
} from "@/lib/api";
import type { Job } from "@/lib/types";
import { runScreening, generateInterviewQuestions } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/recruiter")({
  head: () => ({
    meta: [
      { title: "Recruiter Dashboard — TalentScreen" },
      {
        name: "description",
        content:
          "Create job postings, run AI candidate screening, shortlist applicants, and generate interview questions.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Recruiter Dashboard — TalentScreen" },
      {
        property: "og:description",
        content: "Manage job postings and run AI candidate screening in TalentScreen.",
      },
    ],
  }),
  component: () => (
    <RoleGate role="recruiter">
      <RecruiterDashboard />
    </RoleGate>
  ),
});

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Briefcase;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-3xl font-bold">{value}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function RecruiterDashboard() {
  const { user } = useAuth();
  const userId = user!.id;
  const qc = useQueryClient();
  const [formJob, setFormJob] = useState<Job | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [review, setReview] = useState<ApplicationWithDetails | null>(null);

  const jobsQuery = useQuery({
    queryKey: ["my-jobs", userId],
    queryFn: () => listMyJobs(userId),
  });
  const appsQuery = useQuery({
    queryKey: ["all-applications"],
    queryFn: listAllApplications,
  });

  const jobs = jobsQuery.data ?? [];
  const apps = appsQuery.data ?? [];
  const pending = apps.filter((a) => ["applied", "screening"].includes(a.status));

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === "open").length;
  const totalCandidates = new Set(apps.map((a) => a.candidate_id)).size;
  const shortlistedCandidates = new Set(
    apps.filter((a) => ["shortlisted", "approved"].includes(a.status)).map((a) => a.candidate_id),
  ).size;

  const refreshJobs = () => {
    qc.invalidateQueries({ queryKey: ["my-jobs", userId] });
    qc.invalidateQueries({ queryKey: ["open-jobs"] });
  };

  const removeJob = useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSuccess: () => {
      toast.success("Job deleted");
      refreshJobs();
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openCreate() {
    setFormJob(null);
    setFormOpen(true);
  }
  function openEdit(job: Job) {
    setFormJob(job);
    setFormOpen(true);
  }

  return (
    <AppShell
      title="HR dashboard"
      subtitle="Manage job postings, screen applicants with AI, and shortlist top talent."
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> New job posting
        </Button>
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total jobs"
          value={totalJobs}
          icon={Briefcase}
          tone="bg-primary/10 text-primary"
        />
        <StatCard
          label="Active jobs"
          value={activeJobs}
          icon={CheckCircle2}
          tone="bg-success/15 text-success"
        />
        <StatCard
          label="Total candidates"
          value={totalCandidates}
          icon={Users}
          tone="bg-info/15 text-info"
        />
        <StatCard
          label="Shortlisted candidates"
          value={shortlistedCandidates}
          icon={Star}
          tone="bg-warning/20 text-warning-foreground"
        />
      </div>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">Job management</TabsTrigger>
          <TabsTrigger value="applications">
            Applications
            {pending.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-6">
          {jobsQuery.isLoading ? (
            <Loading />
          ) : jobs.length === 0 ? (
            <Empty text="You haven't posted any jobs yet. Create your first posting." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {jobs.map((job) => {
                const count = apps.filter((a) => a.job_id === job.id).length;
                return (
                  <div
                    key={job.id}
                    className="flex flex-col rounded-xl border border-border bg-card p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg font-semibold leading-tight">
                          {job.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {[job.company, job.department].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                      <Badge variant={job.status === "open" ? "default" : "secondary"}>
                        {job.status === "open" ? "Open" : "Closed"}
                      </Badge>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {job.location}
                        </span>
                      )}
                      {job.employment_type && <span>{job.employment_type}</span>}
                      {job.experience_required && <span>{job.experience_required}</span>}
                    </div>

                    {job.skills && job.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.skills.map((s) => (
                          <Badge key={s} variant="outline">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <p className="mt-3 text-sm text-muted-foreground">
                      {count} application{count === 1 ? "" : "s"}
                    </p>

                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      <Button variant="outline" size="sm" onClick={() => openEdit(job)}>
                        <Pencil className="mr-1.5 h-4 w-4" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await setJobStatus(job.id, job.status === "open" ? "closed" : "open");
                          refreshJobs();
                        }}
                      >
                        {job.status === "open" ? "Close" : "Reopen"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(job)}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="mt-6">
          {appsQuery.isLoading ? (
            <Loading />
          ) : apps.length === 0 ? (
            <Empty text="No applications yet." />
          ) : (
            <div className="space-y-3">
              {apps.map((a) => (
                <Link
                  key={a.id}
                  to="/review/$applicationId"
                  params={{ applicationId: a.id }}
                  className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
                >
                  <div>
                    <p className="font-medium">{a.candidate?.full_name ?? "Candidate"}</p>
                    <p className="text-sm text-muted-foreground">
                      {a.jobs?.title ?? "Role"} · {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {typeof a.match_score === "number" && (
                      <Badge className={`gap-1 ${matchTone(a.match_recommendation)}`}>
                        <Target className="h-3 w-3" /> {a.match_score}
                        {a.match_recommendation ? ` · ${a.match_recommendation}` : ""}
                      </Badge>
                    )}
                    {typeof a.ai_score === "number" && (
                      <Badge variant="outline" className="gap-1">
                        <Brain className="h-3 w-3 text-primary" /> {a.ai_score}
                      </Badge>
                    )}
                    <StatusBadge status={a.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <JobFormDialog
        open={formOpen}
        job={formJob}
        userId={userId}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          refreshJobs();
          setFormOpen(false);
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job posting?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title}" and its applications will be permanently removed. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && removeJob.mutate(deleteTarget.id)}
            >
              {removeJob.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReviewDialog
        app={review}
        onClose={() => setReview(null)}
        onChanged={() => qc.invalidateQueries({ queryKey: ["all-applications"] })}
      />
    </AppShell>
  );
}

const EMPTY_JOB: JobInput = {
  title: "",
  company: "",
  department: "",
  location: "",
  experience_required: "",
  employment_type: "Full-time",
  description: "",
  requirements: "",
  skills: [],
  status: "open",
};

function jobToInput(job: Job): JobInput {
  return {
    title: job.title ?? "",
    company: job.company ?? "",
    department: job.department ?? "",
    location: job.location ?? "",
    experience_required: job.experience_required ?? "",
    employment_type: job.employment_type ?? "Full-time",
    description: job.description ?? "",
    requirements: job.requirements ?? "",
    skills: job.skills ?? [],
    status: job.status,
  };
}

function JobFormDialog({
  open,
  job,
  userId,
  onClose,
  onSaved,
}: {
  open: boolean;
  job: Job | null;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!job;
  const [form, setForm] = useState<JobInput>(EMPTY_JOB);
  const [seededId, setSeededId] = useState<string | null>(null);

  // Sync form when the dialog opens for a different job.
  const targetId = job?.id ?? "new";
  if (open && seededId !== targetId) {
    setForm(job ? jobToInput(job) : EMPTY_JOB);
    setSeededId(targetId);
  }
  if (!open && seededId !== null) {
    setSeededId(null);
  }

  const mutation = useMutation({
    mutationFn: () => (isEdit ? updateJob(job!.id, form) : createJob(userId, form)),
    onSuccess: () => {
      toast.success(isEdit ? "Job updated!" : "Job posted!");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = (k: keyof JobInput) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit job posting" : "Create job posting"}</DialogTitle>
          <DialogDescription>Candidates will see this and apply directly.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Job title</Label>
            <Input
              value={form.title}
              onChange={set("title")}
              placeholder="Senior Frontend Engineer"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input value={form.company} onChange={set("company")} placeholder="Acme Inc." />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input
                value={form.department}
                onChange={set("department")}
                placeholder="Engineering"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={set("location")} placeholder="Remote" />
            </div>
            <div className="space-y-1.5">
              <Label>Experience required</Label>
              <Input
                value={form.experience_required}
                onChange={set("experience_required")}
                placeholder="3+ years"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Employment type</Label>
              <Input
                value={form.employment_type}
                onChange={set("employment_type")}
                placeholder="Full-time"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as "open" | "closed" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Skills required</Label>
            <Input
              value={form.skills.join(", ")}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  skills: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
              placeholder="React, TypeScript, GraphQL"
            />
            <p className="text-xs text-muted-foreground">Separate skills with commas.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Job description</Label>
            <Textarea
              rows={4}
              value={form.description}
              onChange={set("description")}
              placeholder="What the role involves…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Requirements</Label>
            <Textarea
              rows={3}
              value={form.requirements}
              onChange={set("requirements")}
              placeholder="Qualifications, responsibilities, nice-to-haves…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.title || !form.description}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Post job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewDialog({
  app,
  onClose,
  onChanged,
}: {
  app: ApplicationWithDetails | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const screenFn = runScreening;
  const questionsFn = generateInterviewQuestions;

  const questionsQuery = useQuery({
    queryKey: ["questions", app?.id],
    queryFn: () => listQuestions(app!.id),
    enabled: !!app,
  });

  const screen = useMutation({
    mutationFn: () => screenFn({ data: { applicationId: app!.id } }),
    onSuccess: () => {
      toast.success("AI screening complete");
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const genQuestions = useMutation({
    mutationFn: () => questionsFn({ data: { applicationId: app!.id } }),
    onSuccess: () => {
      toast.success("Interview questions generated");
      questionsQuery.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decide = useMutation({
    mutationFn: (status: "shortlisted" | "rejected") => updateApplicationStatus(app!.id, status),
    onSuccess: (_d, status) => {
      toast.success(status === "shortlisted" ? "Candidate shortlisted" : "Candidate rejected");
      onChanged();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function downloadResume() {
    if (!app?.resume_path) return;
    const url = await getResumeUrl(app.resume_path);
    if (url) window.open(url, "_blank");
    else toast.error("Could not open resume.");
  }

  const latestQuestions = (questionsQuery.data?.[0]?.questions ?? []) as Array<{
    category: string;
    question: string;
  }>;

  return (
    <Dialog open={!!app} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        {app && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {app.candidate?.full_name ?? "Candidate"}
                <StatusBadge status={app.status} />
              </DialogTitle>
              <DialogDescription>
                {app.jobs?.title} · {app.candidate?.email}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => screen.mutate()} disabled={screen.isPending}>
                  {screen.isPending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Brain className="mr-1.5 h-4 w-4" />
                  )}
                  {app.ai_summary ? "Re-run AI screening" : "Run AI screening"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => genQuestions.mutate()}
                  disabled={genQuestions.isPending}
                >
                  {genQuestions.isPending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1.5 h-4 w-4" />
                  )}
                  {latestQuestions.length > 0
                    ? "Regenerate questions"
                    : "Generate interview questions"}
                </Button>
                {app.resume_path && (
                  <Button size="sm" variant="outline" onClick={downloadResume}>
                    <Download className="mr-1.5 h-4 w-4" /> Resume
                  </Button>
                )}
              </div>

              {app.ai_summary && (
                <div className="rounded-xl border border-border bg-accent/40 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 font-semibold">
                      <Brain className="h-4 w-4 text-primary" /> AI resume summary
                    </h4>
                    {typeof app.ai_score === "number" && (
                      <Badge className="text-sm">{app.ai_score}/100</Badge>
                    )}
                  </div>
                  {app.ai_recommendation && (
                    <p className="mt-1 text-sm font-medium text-primary">{app.ai_recommendation}</p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">{app.ai_summary}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <InfoBlock title="Key strengths" text={app.ai_strengths} />
                    <InfoBlock title="Relevant experience" text={app.ai_experience} />
                  </div>
                  {app.ai_concerns && (
                    <div className="mt-3">
                      <InfoBlock title="Concerns" text={app.ai_concerns} />
                    </div>
                  )}
                </div>
              )}

              {(typeof app.match_score === "number" || app.match_recommendation) && (
                <div className="rounded-xl border border-border bg-accent/40 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 font-semibold">
                      <Target className="h-4 w-4 text-primary" /> AI job match
                    </h4>
                    {typeof app.match_score === "number" && (
                      <Badge className="text-sm">{app.match_score}/100</Badge>
                    )}
                  </div>
                  {app.match_recommendation && (
                    <Badge className={`mt-2 ${matchTone(app.match_recommendation)}`}>
                      {app.match_recommendation}
                    </Badge>
                  )}
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <InfoBlock title="Matching skills" text={app.matching_skills} />
                    <InfoBlock title="Missing skills" text={app.missing_skills} />
                  </div>
                </div>
              )}

              <Section title="Resume / experience">
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {app.resume_text || "No text provided."}
                </p>
              </Section>

              {app.cover_note && (
                <Section title="Cover note">
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {app.cover_note}
                  </p>
                </Section>
              )}

              {latestQuestions.length > 0 && (
                <Section title={`Interview questions (${latestQuestions.length})`}>
                  <div className="space-y-4">
                    {["Technical", "Behavioral", "Scenario-based"].map((cat) => {
                      const items = latestQuestions.filter(
                        (q) => (q.category ?? "").toLowerCase() === cat.toLowerCase(),
                      );
                      if (items.length === 0) return null;
                      return (
                        <div key={cat}>
                          <h5 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {cat}
                          </h5>
                          <ol className="list-decimal space-y-1.5 pl-5">
                            {items.map((q, i) => (
                              <li key={i} className="text-sm">
                                {q.question}
                              </li>
                            ))}
                          </ol>
                        </div>
                      );
                    })}
                    {/* Any uncategorized questions */}
                    {(() => {
                      const known = ["technical", "behavioral", "scenario-based"];
                      const rest = latestQuestions.filter(
                        (q) => !known.includes((q.category ?? "").toLowerCase()),
                      );
                      if (rest.length === 0) return null;
                      return (
                        <ol className="list-decimal space-y-1.5 pl-5">
                          {rest.map((q, i) => (
                            <li key={i} className="text-sm">
                              <span className="font-medium">{q.category}: </span>
                              {q.question}
                            </li>
                          ))}
                        </ol>
                      );
                    })()}
                  </div>
                </Section>
              )}
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => decide.mutate("rejected")}
                disabled={decide.isPending}
              >
                <ThumbsDown className="mr-1.5 h-4 w-4" /> Reject
              </Button>
              <Button onClick={() => decide.mutate("shortlisted")} disabled={decide.isPending}>
                <ThumbsUp className="mr-1.5 h-4 w-4" /> Shortlist
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function matchTone(recommendation: string | null) {
  switch (recommendation) {
    case "Strong Match":
      return "bg-success/15 text-success hover:bg-success/15";
    case "Good Match":
      return "bg-info/15 text-info hover:bg-info/15";
    case "Moderate Match":
      return "bg-warning/20 text-warning-foreground hover:bg-warning/20";
    case "Weak Match":
      return "bg-destructive/15 text-destructive hover:bg-destructive/15";
    default:
      return "bg-muted text-muted-foreground hover:bg-muted";
  }
}

function InfoBlock({ title, text }: { title: string; text: string | null }) {
  return (
    <div className="rounded-lg bg-card p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{text || "—"}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <FileText className="h-4 w-4 text-muted-foreground" /> {title}
      </h4>
      {children}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
