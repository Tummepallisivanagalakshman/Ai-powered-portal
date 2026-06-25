import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { RoleGate } from "@/components/RoleGate";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/useAuth";
import { listMyApplications, listOpenJobs } from "@/lib/api";
import type { Job } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/jobs")({
  head: () => ({
    meta: [
      { title: "Job Listings — TalentScreen" },
      { name: "description", content: "Browse open roles and apply with your resume directly from your candidate workspace." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Job Listings — TalentScreen" },
      { property: "og:description", content: "Browse open roles and apply with your resume in the TalentScreen candidate workspace." },
    ],
  }),
  component: () => (
    <RoleGate role="candidate">
      <JobListings />
    </RoleGate>
  ),
});

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
    <AppShell
      title="Job listings"
      subtitle="Browse all open positions and apply in a few clicks."
    >
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
                    <button
                      type="button"
                      onClick={() => setSelected(job)}
                      className="text-left"
                    >
                      <h2 className="font-display text-lg font-semibold leading-tight transition-colors group-hover:text-primary">
                        {job.title}
                      </h2>
                    </button>

                    <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <Briefcase className="h-3.5 w-3.5" />
                      {job.department || "General"}
                    </p>
                  </div>
                  {job.employment_type && (
                    <Badge variant="secondary">{job.employment_type}</Badge>
                  )}
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
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelected(job)}
                  >
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
              <DialogTitle className="font-display text-2xl">
                {job.title}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-wrap gap-2">
              {job.employment_type && (
                <Badge variant="secondary">{job.employment_type}</Badge>
              )}
              {job.status && (
                <Badge variant="outline" className="capitalize">
                  {job.status}
                </Badge>
              )}
            </div>

            {/* Company & meta details */}
            <div className="grid gap-3 rounded-xl border border-border bg-secondary/30 p-4 sm:grid-cols-2">
              <Meta icon={Building2} label="Company" value={job.company} />
              <Meta
                icon={Briefcase}
                label="Department"
                value={job.department}
              />
              <Meta icon={MapPin} label="Location" value={job.location} />
              <Meta
                icon={GraduationCap}
                label="Experience"
                value={job.experience_required}
              />
              {job.employment_type && (
                <Meta
                  icon={CalendarClock}
                  label="Employment type"
                  value={job.employment_type}
                />
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
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}
