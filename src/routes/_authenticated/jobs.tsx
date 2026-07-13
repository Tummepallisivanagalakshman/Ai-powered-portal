import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  GraduationCap,
  ListChecks,
  Loader2,
  MapPin,
  Send,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/useAuth";
import { 
  listMyApplications, 
  listOpenJobs, 
  listMyJobs, 
  listAllApplications, 
  deleteJob, 
  setJobStatus, 
  createJob, 
  updateJob, 
  type JobInput 
} from "@/lib/api";
import type { Job } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/jobs")({
  head: () => ({
    meta: [
      { title: "Job Listings — TalentScreen" },
      {
        name: "description",
        content:
          "Browse open roles and apply with your resume directly from your candidate workspace.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Job Listings — TalentScreen" },
      {
        property: "og:description",
        content:
          "Browse open roles and apply with your resume in the TalentScreen candidate workspace.",
      },
    ],
  }),
  component: () => <JobListingsPage />,
});

function JobListingsPage() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role === "recruiter" || role === "hiring_manager" || role === "admin") {
    return <RecruiterJobManagement />;
  }

  return <JobListings />;
}

function jobSkills(job: Job): string[] {
  if (job.skills && job.skills.length > 0) return job.skills;
  if (job.requirements) {
    return job.requirements
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
  }
  return [];
}

function JobListings() {
  const { user } = useAuth();
  const userId = user!.id;

  const [selected, setSelected] = useState<Job | null>(null);

  const jobsQuery = useQuery({ queryKey: ["open-jobs"], queryFn: listOpenJobs });
  const appsQuery = useQuery({
    queryKey: ["my-applications", userId],
    queryFn: () => listMyApplications(userId),
  });

  const appliedJobIds = new Set((appsQuery.data ?? []).map((a) => a.job_id));
  const jobs = jobsQuery.data ?? [];

  return (
    <AppShell title="Job listings" subtitle="Browse all open positions and apply in a few clicks.">
      {jobsQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No open jobs right now. Check back soon.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job, i) => {
            const skills = jobSkills(job);
            return (
              <div
                key={job.id}
                style={{ animationDelay: `${i * 60}ms` }}
                className="hover-lift animate-fade-up group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary to-info transition-transform duration-300 group-hover:scale-x-100"
                />

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <button type="button" onClick={() => setSelected(job)} className="text-left">
                      <h2 className="font-display text-lg font-semibold leading-tight transition-colors group-hover:text-primary">
                        {job.title}
                      </h2>
                    </button>

                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5" />
                      {job.department || "General"}
                    </p>
                  </div>
                  {job.employment_type && <Badge variant="secondary">{job.employment_type}</Badge>}
                </div>

                {job.company && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" /> {job.company}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {job.location}
                    </span>
                  )}
                  {job.experience_required && (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {job.experience_required}
                    </span>
                  )}
                </div>

                {job.description && (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {job.description}
                  </p>
                )}

                {skills.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Required skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s) => (
                        <Badge key={s} variant="outline">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto flex gap-2 pt-4">
                  <Button variant="outline" className="w-full" onClick={() => setSelected(job)}>
                    <FileText className="mr-1.5 h-4 w-4" /> View details
                  </Button>
                  {appliedJobIds.has(job.id) ? (
                    <Button variant="secondary" disabled className="w-full">
                      <CheckCircle2 className="mr-1.5 h-4 w-4" /> Applied
                    </Button>
                  ) : (
                    <Button
                      className="group/btn w-full transition-transform active:scale-[0.98]"
                      asChild
                    >
                      <Link to="/apply/$jobId" params={{ jobId: job.id }}>
                        <Send className="mr-1.5 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />{" "}
                        Apply
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <JobDetailsDialog
        job={selected}
        applied={selected ? appliedJobIds.has(selected.id) : false}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </AppShell>
  );
}

function JobDetailsDialog({
  job,
  applied,
  onOpenChange,
}: {
  job: Job | null;
  applied: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={!!job} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        {job && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">{job.title}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-wrap gap-2">
              {job.employment_type && <Badge variant="secondary">{job.employment_type}</Badge>}
              {job.status && (
                <Badge variant="outline" className="capitalize">
                  {job.status}
                </Badge>
              )}
            </div>

            {/* Company & meta details */}
            <div className="grid gap-3 rounded-xl border border-border bg-secondary/30 p-4 sm:grid-cols-2">
              <Meta icon={Building2} label="Company" value={job.company} />
              <Meta icon={Briefcase} label="Department" value={job.department} />
              <Meta icon={MapPin} label="Location" value={job.location} />
              <Meta icon={GraduationCap} label="Experience" value={job.experience_required} />
              {job.employment_type && (
                <Meta icon={CalendarClock} label="Employment type" value={job.employment_type} />
              )}
            </div>

            {/* Description */}
            <section>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> Job description
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {job.description?.trim() || "No description provided."}
              </p>
            </section>

            {/* Requirements */}
            {job.requirements?.trim() && (
              <section>
                <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <ListChecks className="h-3.5 w-3.5" /> Requirements
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {job.requirements}
                </p>
              </section>
            )}

            {/* Required skills */}
            {job.skills && job.skills.length > 0 && (
              <section>
                <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Required skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              {applied ? (
                <Button variant="secondary" disabled>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" /> Applied
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/apply/$jobId" params={{ jobId: job.id }}>
                    <Send className="mr-1.5 h-4 w-4" /> Apply now
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

// ─── Recruiter Job Management Components ─────────────────────────────────────

function RecruiterJobManagement() {
  const { user } = useAuth();
  const userId = user!.id;
  const qc = useQueryClient();
  const [formJob, setFormJob] = useState<Job | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);

  const jobsQuery = useQuery({
    queryKey: ["my-jobs", userId],
    queryFn: () => listMyJobs(),
  });
  const appsQuery = useQuery({
    queryKey: ["all-applications"],
    queryFn: listAllApplications,
  });

  const jobs = jobsQuery.data ?? [];
  const apps = appsQuery.data ?? [];

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
      title="Job Management"
      subtitle="Create, edit, and moderate your active job postings."
      actions={
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" /> New job posting
        </Button>
      }
    >
      {jobsQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          You haven't posted any jobs yet. Create your first posting.
        </div>
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

      {/* Recruiter Job Dialog Form */}
      <RecruiterJobFormDialog
        open={formOpen}
        job={formJob}
        userId={userId}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          refreshJobs();
          setFormOpen(false);
        }}
      />

      {/* Delete Confirmation Alert */}
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

function RecruiterJobFormDialog({
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
