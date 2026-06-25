import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  Check,
  Circle,
  Clock,
  FileText,
  Loader2,
  MapPin,
  Send,
  X,
} from "lucide-react";
import { RoleGate } from "@/components/RoleGate";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/useAuth";
import {
  getResumeUrl,
  listMyApplications,
  type ApplicationWithJob,
} from "@/lib/api";
import { STATUS_LABELS, type ApplicationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/tracking")({
  head: () => ({
    meta: [
      { title: "Application Tracking — TalentScreen" },
      { name: "description", content: "Follow each of your job applications through the hiring pipeline with a clear status timeline." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Application Tracking — TalentScreen" },
      { property: "og:description", content: "Follow your applications through the hiring pipeline in TalentScreen." },
    ],
  }),
  component: () => (
    <RoleGate role="candidate">
      <Tracking />
    </RoleGate>
  ),
});

/** Ordered hiring pipeline (the "happy path"). Rejection is handled separately. */
const PIPELINE: ApplicationStatus[] = [
  "applied",
  "screening",
  "shortlisted",
  "interview_scheduled",
  "approved",
];

/** All stages shown in the legend, in the order requested. */
const LEGEND: ApplicationStatus[] = [
  "applied",
  "screening",
  "shortlisted",
  "interview_scheduled",
  "approved",
  "rejected",
];

function stageIndex(status: ApplicationStatus): number {
  return PIPELINE.indexOf(status);
}

function fmtDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Tracking() {
  const { user } = useAuth();
  const userId = user!.id;
  const [selected, setSelected] = useState<ApplicationWithJob | null>(null);

  const appsQuery = useQuery({
    queryKey: ["my-applications", userId],
    queryFn: () => listMyApplications(userId),
  });

  const apps = appsQuery.data ?? [];

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of apps) c[a.status] = (c[a.status] ?? 0) + 1;
    return c;
  }, [apps]);

  return (
    <AppShell
      title="Track your applications"
      subtitle="Follow each application through every stage of the hiring process."
      actions={
        <Button asChild variant="outline">
          <Link to="/jobs">
            <Send className="mr-1.5 h-4 w-4" /> Browse jobs
          </Link>
        </Button>
      }
    >
      {/* Stage legend */}
      <div className="mb-6 flex flex-wrap gap-2">
        {LEGEND.map((s, i) => (
          <div
            key={s}
            style={{ animationDelay: `${i * 50}ms` }}
            className="animate-fade-up flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm shadow-soft transition-colors hover:border-primary/40"
          >
            <StatusBadge status={s} />

            <span className="text-muted-foreground">{counts[s] ?? 0}</span>
          </div>
        ))}
      </div>

      {appsQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : apps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          You haven't applied to any jobs yet.{" "}
          <Link to="/jobs" className="text-primary underline">
            Browse open positions
          </Link>
          .
        </div>
      ) : (
        <div className="space-y-5">
          {apps.map((app, i) => (
            <ApplicationCard
              key={app.id}
              app={app}
              delay={i * 70}
              onViewDetails={() => setSelected(app)}
            />
          ))}
        </div>

      )}

      <DetailsDialog app={selected} onClose={() => setSelected(null)} />
    </AppShell>
  );
}

function ApplicationCard({
  app,
  onViewDetails,
  delay = 0,
}: {
  app: ApplicationWithJob;
  onViewDetails: () => void;
  delay?: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="hover-lift animate-fade-up group rounded-2xl border border-border bg-card p-5 shadow-soft"
    >

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold leading-tight transition-colors group-hover:text-primary">
            {app.jobs?.title ?? "Job"}
          </h3>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {app.jobs?.company && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> {app.jobs.company}
              </span>
            )}
            {app.jobs?.department && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> {app.jobs.department}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Applied {fmtDate(app.created_at)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={app.status} />
          <Button size="sm" variant="outline" onClick={onViewDetails}>
            View details
          </Button>
        </div>
      </div>

      <div className="mt-5">
        <Timeline status={app.status} />
      </div>
    </div>
  );
}

function Timeline({ status }: { status: ApplicationStatus }) {
  const rejected = status === "rejected";
  const current = stageIndex(status);

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
      {PIPELINE.map((stage, i) => {
        const done = !rejected && current >= 0 && i < current;
        const isCurrent = !rejected && i === current;
        const state: "done" | "current" | "upcoming" = done
          ? "done"
          : isCurrent
            ? "current"
            : "upcoming";
        return (
          <li
            key={stage}
            className="flex flex-1 gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center"
          >
            <div className="flex flex-col items-center sm:w-full sm:flex-row">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 sm:mx-auto",
                  state === "done" &&
                    "border-success bg-success text-success-foreground",
                  state === "current" &&
                    "border-primary bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pop-in",
                  state === "upcoming" &&
                    "border-border bg-background text-muted-foreground",
                )}

              >
                {state === "done" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Circle className="h-2.5 w-2.5 fill-current" />
                )}
              </span>
              {/* connector */}
              {i < PIPELINE.length - 1 && (
                <span
                  className={cn(
                    "my-1 h-6 w-0.5 sm:my-0 sm:h-0.5 sm:flex-1",
                    done ? "bg-success" : "bg-border",
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "pb-4 text-xs font-medium sm:pb-0",
                isCurrent ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {STATUS_LABELS[stage]}
            </span>
          </li>
        );
      })}
      {rejected && (
        <li className="flex flex-1 items-center gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-destructive bg-destructive text-destructive-foreground sm:mx-auto">
            <X className="h-4 w-4" />
          </span>
          <span className="text-xs font-medium text-destructive">Rejected</span>
        </li>
      )}
    </ol>
  );
}

function DetailsDialog({
  app,
  onClose,
}: {
  app: ApplicationWithJob | null;
  onClose: () => void;
}) {
  const [resumeLoading, setResumeLoading] = useState(false);

  async function openResume(path: string) {
    setResumeLoading(true);
    const url = await getResumeUrl(path);
    setResumeLoading(false);
    if (url) window.open(url, "_blank", "noopener");
  }

  return (
    <Dialog open={!!app} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        {app && (
          <>
            <DialogHeader>
              <DialogTitle>{app.jobs?.title ?? "Application"}</DialogTitle>
              <DialogDescription>
                View the role description, your submission, and live status.
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <StatusBadge status={app.status} />
                <span className="text-sm text-muted-foreground">
                  Applied {fmtDate(app.created_at)}
                </span>
              </div>
            </DialogHeader>


            <div className="space-y-5 text-sm">
              {/* Progress */}
              <div>
                <SectionTitle>Progress</SectionTitle>
                <div className="mt-3 rounded-lg border border-border p-4">
                  <Timeline status={app.status} />
                </div>
              </div>

              {/* Job */}
              <div>
                <SectionTitle>Position</SectionTitle>
                <dl className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <Detail label="Company" value={app.jobs?.company} />
                  <Detail label="Department" value={app.jobs?.department} />
                  <Detail label="Location" value={app.jobs?.location} />
                </dl>
                {app.jobs?.description && (
                  <LongDetail
                    label="Job description"
                    value={app.jobs.description}
                  />
                )}
              </div>



              {/* Submitted info */}
              <div>
                <SectionTitle>Your submission</SectionTitle>
                <dl className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <Detail label="Full name" value={app.full_name} />
                  <Detail label="Email" value={app.email} />
                  <Detail label="Phone" value={app.phone} />
                </dl>
                {app.education && (
                  <LongDetail label="Education" value={app.education} />
                )}
                {app.skills && <LongDetail label="Skills" value={app.skills} />}
                {app.experience && (
                  <LongDetail label="Experience" value={app.experience} />
                )}
                {app.cover_note && (
                  <LongDetail label="Cover letter" value={app.cover_note} />
                )}
                {app.resume_path && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resumeLoading}
                      onClick={() => openResume(app.resume_path!)}
                    >
                      {resumeLoading ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="mr-1.5 h-4 w-4" />
                      )}
                      View resume
                    </Button>
                  </div>
                )}
              </div>

              {/* AI feedback (if available) */}
              {(app.ai_summary || app.ai_score != null) && (
                <div>
                  <SectionTitle>AI screening</SectionTitle>
                  {app.ai_score != null && (
                    <div className="mt-2 flex items-center gap-2">
                      <Badge>Score: {app.ai_score}/100</Badge>
                    </div>
                  )}
                  {app.ai_summary && (
                    <LongDetail label="Summary" value={app.ai_summary} />
                  )}
                </div>
              )}

              {/* Manager notes (if available) */}
              {app.manager_notes && (
                <div>
                  <SectionTitle>Notes</SectionTitle>
                  <LongDetail label="" value={app.manager_notes} />
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h4>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function LongDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      {label && (
        <p className="text-xs text-muted-foreground">{label}</p>
      )}
      <p className="mt-0.5 whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}
