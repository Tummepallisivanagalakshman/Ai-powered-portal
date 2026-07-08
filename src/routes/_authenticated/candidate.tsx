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
  Award,
  Video,
  BookOpen,
  FolderHeart,
  TrendingUp,
} from "lucide-react";
import { RoleGate } from "@/components/RoleGate";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/useAuth";
import { listMyApplications, listOpenJobs, type ApplicationWithJob } from "@/lib/api";
import { STATUS_LABELS } from "@/lib/types";
import type { Job } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

export const Route = createFileRoute("/_authenticated/candidate")({
  head: () => ({
    meta: [
      { title: "Candidate Dashboard — CareerSuccess" },
      {
        name: "description",
        content: "Track career metrics, ATS resume scores, mock interview sessions, and jobs.",
      },
    ],
  }),
  component: () => (
    <RoleGate role="candidate">
      <CandidateDashboard />
    </RoleGate>
  ),
});

const ACTIVE_STATUSES = ["applied", "screening", "shortlisted"];

// Mock data for Recharts
const weeklyProgressData = [
  { name: "Mon", score: 60 },
  { name: "Tue", score: 65 },
  { name: "Wed", score: 70 },
  { name: "Thu", score: 68 },
  { name: "Fri", score: 74 },
  { name: "Sat", score: 78 },
  { name: "Sun", score: 82 },
];

const skillsDistributionData = [
  { name: "Frontend", value: 85 },
  { name: "Backend", value: 70 },
  { name: "System Design", value: 65 },
  { name: "Communication", value: 90 },
  { name: "ATS Match", value: 80 },
];

const resumeHistoryData = [
  { name: "v1.0", score: 55 },
  { name: "v1.1", score: 68 },
  { name: "v2.0", score: 74 },
  { name: "v2.1", score: 85 },
];

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
  const shortlisted = apps.filter((a) => ["shortlisted", "approved"].includes(a.status)).length;
  const rejected = apps.filter((a) => a.status === "rejected").length;

  const recent = [...apps]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);

  return (
    <AppShell
      title="Dashboard"
      subtitle="Welcome back! Here is a summary of your career progress."
    >
      {/* 1. WELCOME CARD */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-600/5 to-purple-600/5 p-6 sm:p-8">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-purple-500/10 blur-2xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Award className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Pro Profile Active</span>
            </div>
            <h2 className="font-display text-2xl font-bold">
              Ready to land your next role, {user?.email?.split("@")[0] || "User"}?
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Your overall resume score has improved by 15% this week. Let's finish your pending learning modules to unlock higher job matching.
            </p>
          </div>
          <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full">
            <Link to="/resume-analyzer">Analyze Resume</Link>
          </Button>
        </div>
      </div>

      {/* 2. CAREER METRICS SCORES */}
      <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Career Progress */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover-lift">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Career Progress</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight">78%</span>
            <span className="text-xs text-green-500 font-semibold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +4%
            </span>
          </div>
          <Progress value={78} className="h-1.5 mt-3 bg-muted" />
        </div>

        {/* Resume Score */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover-lift">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Resume ATS Score</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight">85%</span>
            <span className="text-xs text-green-500 font-semibold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +12%
            </span>
          </div>
          <Progress value={85} className="h-1.5 mt-3 bg-muted" />
        </div>

        {/* Interview Readiness */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover-lift">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Interview Readiness</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight">72%</span>
            <span className="text-xs text-muted-foreground font-semibold">Good</span>
          </div>
          <Progress value={72} className="h-1.5 mt-3 bg-muted" />
        </div>

        {/* Job Match Percentage */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover-lift">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Average Job Match</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tracking-tight">88%</span>
            <span className="text-xs text-green-500 font-semibold flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +2%
            </span>
          </div>
          <Progress value={88} className="h-1.5 mt-3 bg-muted" />
        </div>
      </div>

      {/* 3. TOP STAT CARDS */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Resume Analyses */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Resume Audits</p>
            <p className="font-display text-xl font-bold mt-0.5">12 Analyses</p>
          </div>
        </div>

        {/* Interview Sessions */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mocks Practiced</p>
            <p className="font-display text-xl font-bold mt-0.5">8 Sessions</p>
          </div>
        </div>

        {/* Learning Progress */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Roadmap Progress</p>
            <p className="font-display text-xl font-bold mt-0.5">64% Done</p>
          </div>
        </div>

        {/* Saved Reports */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-600">
            <FolderHeart className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Saved Reports</p>
            <p className="font-display text-xl font-bold mt-0.5">5 Reports</p>
          </div>
        </div>
      </div>

      {/* 4. CHARTS SECTION */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        {/* Weekly Progress Line Chart */}
        <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft lg:col-span-1">
          <h3 className="font-display font-semibold text-sm mb-4">Weekly Career Score</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyProgressData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} domain={[40, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skills Distribution Bar Chart */}
        <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft lg:col-span-1">
          <h3 className="font-display font-semibold text-sm mb-4">Skill Assessment</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillsDistributionData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="value" fill="#9333ea" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resume Score History Area Chart */}
        <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-soft lg:col-span-1">
          <h3 className="font-display font-semibold text-sm mb-4">Resume Version History</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={resumeHistoryData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} domain={[40, 100]} />
                <Tooltip />
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. DATABASE LINKED JOBS & ACTIVITY FEEDS */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Available jobs */}
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
                <Briefcase className="h-4 w-4" />
              </span>
              <h2 className="font-display text-lg font-bold">Suggested Job Matches</h2>
            </div>
          </div>

          {jobsQuery.isLoading ? (
            <Loading />
          ) : (jobsQuery.data ?? []).length === 0 ? (
            <Empty text="No matching jobs right now. Check back soon." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {jobsQuery.data!.map((job, i) => {
                const skills = jobSkills(job);
                return (
                  <div
                    key={job.id}
                    className="hover-lift group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft"
                  >
                    <span
                      className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-transform duration-300 group-hover:scale-x-100"
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-base font-bold leading-tight transition-colors group-hover:text-blue-600">
                          {job.title}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          {job.company || job.department || "Company"}
                        </p>
                      </div>
                      {job.employment_type && (
                        <Badge variant="secondary" className="text-[10px]">{job.employment_type}</Badge>
                      )}
                    </div>

                    {job.location && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {job.location}
                      </p>
                    )}

                    {skills.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                          Required skills
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.map((s) => (
                            <Badge key={s} variant="outline" className="text-[9px] py-0">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-4">
                      {appliedJobIds.has(job.id) ? (
                        <Button variant="secondary" disabled className="w-full text-xs h-9">
                          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Applied
                        </Button>
                      ) : (
                        <Button
                          className="group/btn w-full h-9 text-xs transition-transform active:scale-[0.98] bg-blue-600 hover:bg-blue-700"
                          asChild
                        >
                          <Link to="/apply/$jobId" params={{ jobId: job.id }}>
                            <Send className="mr-1.5 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />{" "}
                            Apply Now
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
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/10 text-purple-600">
              <Activity className="h-4 w-4" />
            </span>
            <h2 className="font-display text-lg font-bold">Recent Application Progress</h2>
          </div>

          {appsQuery.isLoading ? (
            <Loading />
          ) : recent.length === 0 ? (
            <Empty text="No activity yet. Apply to a job to get started." />
          ) : (
            <div className="space-y-3">
              {recent.map((a) => (
                <ActivityRow key={a.id} app={a} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ActivityRow({ app }: { app: ApplicationWithJob }) {
  return (
    <div className="hover-lift group rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
          <Briefcase className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{app.jobs?.title ?? "Role"}</p>
          <p className="truncate text-xs text-muted-foreground">
            {app.jobs?.company || app.jobs?.department || "Company"}
          </p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <StatusBadge status={app.status} />
            <span className="text-[10px] text-muted-foreground">
              {new Date(app.updated_at).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
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
    <div className="rounded-xl border border-dashed border-border py-12 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}
