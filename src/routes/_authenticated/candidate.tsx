import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import {
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Send,
  Star,
  XCircle,
  Activity,
} from "lucide-react";
import { RoleGate } from "@/components/RoleGate";
import { AppShell } from "@/components/AppShell";

import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/useAuth";
import {
  listMyApplications,
  listOpenJobs,
  type ApplicationWithJob,
} from "@/lib/api";
import { STATUS_LABELS } from "@/lib/types";
import type { Job } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/candidate")({
  head: () => ({
    meta: [
      { title: "Candidate Dashboard — TalentScreen" },
      { name: "description", content: "Track your job applications, see their status, and discover new roles to apply for." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Candidate Dashboard — TalentScreen" },
      { property: "og:description", content: "Track your applications and discover new roles in TalentScreen." },
    ],
  }),
  component: () => (
    <RoleGate role="candidate">
      <CandidateDashboard />
    </RoleGate>
  ),
});

const ACTIVE_STATUSES = ["applied", "screening", "shortlisted"];

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  delay = 0,
}: {
  label: string;
  value: number;
  icon: typeof Briefcase;
  tone: string;
  delay?: number;
}) {
  return (
    <div
      className="hover-lift animate-fade-up group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-15 blur-2xl transition-opacity duration-300 group-hover:opacity-30 ${tone}`}
      />
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${tone}`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 font-display text-3xl font-bold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
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

function CandidateDashboard() {
  const { user } = useAuth();
  const userId = user!.id;


  const jobsQuery = useQuery({ queryKey: ["open-jobs"], queryFn: listOpenJobs });
  const appsQuery = useQuery({
    queryKey: ["my-applications", userId],
    queryFn: () => listMyApplications(userId),
  });

  const apps = appsQuery.data ?? [];
  const appliedJobIds = new Set(apps.map((a) => a.job_id));

  const total = apps.length;
  const active = apps.filter((a) => ACTIVE_STATUSES.includes(a.status)).length;
  const shortlisted = apps.filter((a) =>
    ["shortlisted", "approved"].includes(a.status),
  ).length;
  const rejected = apps.filter((a) => a.status === "rejected").length;

  const recent = [...apps]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, 6);

  return (
    <AppShell
      title="Your candidate dashboard"
      subtitle="Track your applications and discover new opportunities."
      actions={
        <Button asChild variant="outline">
          <Link to="/tracking">
            <Activity className="mr-1.5 h-4 w-4" /> Track applications
          </Link>
        </Button>
      }
    >

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total applications"
          value={total}
          icon={FileText}
          tone="bg-primary/10 text-primary"
          delay={0}
        />
        <StatCard
          label="Active applications"
          value={active}
          icon={Clock}
          tone="bg-info/15 text-info"
          delay={70}
        />
        <StatCard
          label="Shortlisted"
          value={shortlisted}
          icon={Star}
          tone="bg-warning/20 text-warning-foreground"
          delay={140}
        />
        <StatCard
          label="Rejected"
          value={rejected}
          icon={XCircle}
          tone="bg-destructive/12 text-destructive"
          delay={210}
        />
      </div>


      <div className="grid gap-8 lg:grid-cols-3">
        {/* Available jobs */}
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Briefcase className="h-4 w-4" />
              </span>
              <h2 className="font-display text-xl font-semibold">Available jobs</h2>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/jobs">View all</Link>
            </Button>
          </div>


          {jobsQuery.isLoading ? (
            <Loading />
          ) : (jobsQuery.data ?? []).length === 0 ? (
            <Empty text="No open jobs right now. Check back soon." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {jobsQuery.data!.map((job, i) => {
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
                        <h3 className="font-display text-lg font-semibold leading-tight transition-colors group-hover:text-primary">
                          {job.title}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          {job.company || job.department || "Company"}
                        </p>
                      </div>
                      {job.employment_type && (
                        <Badge variant="secondary">{job.employment_type}</Badge>
                      )}
                    </div>

                    {job.location && (
                      <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {job.location}
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

                    <div className="mt-auto pt-4">
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
        </section>

        {/* Recent activity */}
        <section>
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Activity className="h-4 w-4" />
            </span>
            <h2 className="font-display text-xl font-semibold">Recent activity</h2>
          </div>

          {appsQuery.isLoading ? (
            <Loading />
          ) : recent.length === 0 ? (
            <Empty text="No activity yet. Apply to a job to get started." />
          ) : (
            <div className="space-y-3">
              {recent.map((a, i) => (
                <ActivityRow key={a.id} app={a} delay={i * 60} />
              ))}
            </div>
          )}

        </section>
      </div>
    </AppShell>
  );
}

function ActivityRow({
  app,
  delay = 0,
}: {
  app: ApplicationWithJob;
  delay?: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="hover-lift animate-fade-up group rounded-2xl border border-border bg-card p-4 shadow-soft"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
          <Briefcase className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{app.jobs?.title ?? "Role"}</p>
          <p className="truncate text-sm text-muted-foreground">
            {app.jobs?.company || app.jobs?.department || "Company"}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <StatusBadge status={app.status} />
            <span className="text-xs text-muted-foreground">
              {new Date(app.updated_at).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Status: {STATUS_LABELS[app.status]}
          </p>
        </div>
      </div>
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
