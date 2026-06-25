import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Brain,
  CalendarClock,
  Download,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGate } from "@/components/RoleGate";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import {
  getApplication,
  getResumeUrl,
  listQuestions,
  updateApplicationStatus,
  type ApplicationWithDetails,
} from "@/lib/api";
import type { ApplicationStatus } from "@/lib/types";
import { runScreening, generateInterviewQuestions } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/review/$applicationId")({
  head: () => ({
    meta: [
      { title: "Candidate Review — TalentScreen" },
      {
        name: "description",
        content:
          "Review candidate details, resume, AI summary, match score, and interview questions, then take a hiring decision.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Candidate Review — TalentScreen" },
      {
        property: "og:description",
        content:
          "Review candidate details, AI summary, and match score before making a hiring decision.",
      },
    ],
  }),
  component: () => (
    <RoleGate role="recruiter">
      <ReviewPage />
    </RoleGate>
  ),
  errorComponent: () => (
    <AppShell title="Candidate Review">
      <p className="text-sm text-muted-foreground">
        Could not load this application.
      </p>
      <Link to="/recruiter" className="mt-3 inline-block text-sm text-primary">
        Back to dashboard
      </Link>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell title="Candidate Review">
      <p className="text-sm text-muted-foreground">Application not found.</p>
    </AppShell>
  ),
});

function ReviewPage() {
  const { applicationId } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const appQuery = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => getApplication(applicationId),
  });

  const questionsQuery = useQuery({
    queryKey: ["questions", applicationId],
    queryFn: () => listQuestions(applicationId),
  });

  const screenFn = useServerFn(runScreening);
  const questionsFn = useServerFn(generateInterviewQuestions);

  const screen = useMutation({
    mutationFn: () => screenFn({ data: { applicationId } }),
    onSuccess: () => {
      toast.success("AI screening complete");
      appQuery.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const genQuestions = useMutation({
    mutationFn: () => questionsFn({ data: { applicationId } }),
    onSuccess: () => {
      toast.success("Interview questions generated");
      questionsQuery.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decide = useMutation({
    mutationFn: (status: ApplicationStatus) =>
      updateApplicationStatus(applicationId, status),
    onSuccess: (_d, status) => {
      const msg: Record<string, string> = {
        shortlisted: "Candidate shortlisted",
        rejected: "Candidate rejected",
        interview_scheduled: "Moved to interview",
      };
      toast.success(msg[status] ?? "Status updated");
      appQuery.refetch();
      qc.invalidateQueries({ queryKey: ["all-applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function downloadResume(app: ApplicationWithDetails) {
    if (!app.resume_path) return;
    const url = await getResumeUrl(app.resume_path);
    if (url) window.open(url, "_blank");
    else toast.error("Could not open resume.");
  }

  if (appQuery.isLoading) {
    return (
      <AppShell title="Candidate Review">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const app = appQuery.data;
  if (!app) {
    return (
      <AppShell title="Candidate Review">
        <p className="text-sm text-muted-foreground">Application not found.</p>
      </AppShell>
    );
  }

  const latestQuestions = (questionsQuery.data?.[0]?.questions ?? []) as Array<{
    category: string;
    question: string;
  }>;

  return (
    <AppShell title="Candidate Review">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          to="/recruiter"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              {app.candidate?.full_name ?? app.full_name ?? "Candidate"}
              <StatusBadge status={app.status} />
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {app.jobs?.title ?? "Role"}
              {app.jobs?.department ? ` · ${app.jobs.department}` : ""} · Applied{" "}
              {new Date(app.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => screen.mutate()}
              disabled={screen.isPending}
            >
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
          </div>
        </div>

        {/* Candidate details */}
        <Card title="Candidate details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail icon={Mail} label="Email" value={app.candidate?.email ?? app.email} />
            <Detail icon={Phone} label="Phone" value={app.phone} />
            <Detail
              icon={GraduationCap}
              label="Education"
              value={app.education}
            />
            <Detail icon={Target} label="Skills" value={app.skills} />
          </div>
          {app.experience && (
            <div className="mt-4">
              <Label>Experience</Label>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {app.experience}
              </p>
            </div>
          )}
        </Card>

        {/* Resume */}
        <Card title="Resume">
          {app.resume_path ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadResume(app)}
            >
              <Download className="mr-1.5 h-4 w-4" /> Open resume (PDF)
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">No resume uploaded.</p>
          )}
          {app.resume_text && (
            <div className="mt-4">
              <Label>Resume text / experience</Label>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {app.resume_text}
              </p>
            </div>
          )}
          {app.cover_note && (
            <div className="mt-4">
              <Label>Cover letter</Label>
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                {app.cover_note}
              </p>
            </div>
          )}
        </Card>

        {/* AI summary */}
        <Card title="AI resume summary">
          {app.ai_summary ? (
            <>
              <div className="flex items-center justify-between">
                {app.ai_recommendation && (
                  <p className="text-sm font-medium text-primary">
                    {app.ai_recommendation}
                  </p>
                )}
                {typeof app.ai_score === "number" && (
                  <Badge className="text-sm">{app.ai_score}/100</Badge>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {app.ai_summary}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <InfoBlock title="Key strengths" text={app.ai_strengths} />
                <InfoBlock
                  title="Relevant experience"
                  text={app.ai_experience}
                />
              </div>
              {app.ai_concerns && (
                <div className="mt-3">
                  <InfoBlock title="Concerns" text={app.ai_concerns} />
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No AI summary yet. Run AI screening to generate one.
            </p>
          )}
        </Card>

        {/* Match score */}
        <Card title="AI job match score">
          {typeof app.match_score === "number" || app.match_recommendation ? (
            <>
              <div className="flex items-center justify-between">
                {app.match_recommendation && (
                  <Badge className={matchTone(app.match_recommendation)}>
                    {app.match_recommendation}
                  </Badge>
                )}
                {typeof app.match_score === "number" && (
                  <Badge className="text-sm">{app.match_score}/100</Badge>
                )}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <InfoBlock title="Matching skills" text={app.matching_skills} />
                <InfoBlock title="Missing skills" text={app.missing_skills} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No match score yet. Run AI screening to generate one.
            </p>
          )}
        </Card>

        {/* Interview questions */}
        <Card title={`Interview questions${latestQuestions.length ? ` (${latestQuestions.length})` : ""}`}>
          {latestQuestions.length > 0 ? (
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
          ) : (
            <p className="text-sm text-muted-foreground">
              No interview questions yet. Generate a set to prepare for the
              interview.
            </p>
          )}
        </Card>

        {/* HR actions */}
        <Card title="HR actions">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => decide.mutate("shortlisted")}
              disabled={decide.isPending || app.status === "shortlisted"}
            >
              <ThumbsUp className="mr-1.5 h-4 w-4" /> Shortlist
            </Button>
            <Button
              variant="outline"
              onClick={() => decide.mutate("interview_scheduled")}
              disabled={
                decide.isPending || app.status === "interview_scheduled"
              }
            >
              <CalendarClock className="mr-1.5 h-4 w-4" /> Move to interview
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => decide.mutate("rejected")}
              disabled={decide.isPending || app.status === "rejected"}
            >
              <ThumbsDown className="mr-1.5 h-4 w-4" /> Reject
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Taking an action updates the application status automatically.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <Label>{label}</Label>
        <p className="text-sm text-muted-foreground">
          {value && value.trim() ? value : "—"}
        </p>
      </div>
    </div>
  );
}

function InfoBlock({ title, text }: { title: string; text: string | null }) {
  return (
    <div className="rounded-lg bg-accent/40 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
        {text && text.trim() ? text : "—"}
      </p>
    </div>
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
