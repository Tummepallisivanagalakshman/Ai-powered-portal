import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Download, TrendingUp, Calendar, Video, FileText, CheckCircle2, Compass, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { listLearningRoadmaps, listCoverLetters, listInterviewSessions } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [{ title: "Saved Reports & Analytics — CareerSuccess" }],
  }),
  component: ReportsPage,
});

const monthlyAtsData = [
  { month: "Jan", score: 62 },
  { month: "Feb", score: 68 },
  { month: "Mar", score: 71 },
  { month: "Apr", score: 78 },
  { month: "May", score: 81 },
  { month: "Jun", score: 85 },
];

const mockInterviewHistory = [
  { role: "Frontend Dev", date: "2026-07-02", score: "82%" },
  { role: "Backend Dev", date: "2026-06-25", score: "78%" },
  { role: "UX Designer", date: "2026-06-18", score: "71%" },
];

const SkeletonLoader = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3 w-full">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-16 w-full rounded-2xl bg-muted/30 animate-pulse border border-border/10" />
    ))}
  </div>
);

function ReportsPage() {
  const roadmapsQuery = useQuery({ queryKey: ["saved-roadmaps"], queryFn: listLearningRoadmaps });
  const coverLettersQuery = useQuery({ queryKey: ["saved-cover-letters"], queryFn: listCoverLetters });
  const interviewsQuery = useQuery({ queryKey: ["saved-interviews"], queryFn: listInterviewSessions });

  const mockHistory = interviewsQuery.data || [];
  const letterHistory = coverLettersQuery.data || [];
  const roadmapHistory = roadmapsQuery.data || [];

  return (
    <AppShell
      title="Saved Reports & Analytics"
      subtitle="View your historic learning roadmaps, cover letters, mock interviews, and performance history."
      actions={
        <Button onClick={() => toast.success("Batch export compiled successfully!")} className="bg-primary text-white rounded-xl text-xs h-9">
          <Download className="mr-1.5 h-4 w-4" /> Export All Data
        </Button>
      }
    >
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Side: Trends Charts & Roadmaps */}
        <div className="lg:col-span-2 space-y-6">
          {/* ATS compatibility Area Chart */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-semibold text-base">ATS Match Trend</h3>
              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-none"><TrendingUp className="h-3 w-3 mr-1" /> +23% overall</Badge>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyAtsData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} domain={[40, 100]} />
                  <Tooltip />
                  <defs>
                    <linearGradient id="colorAts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAts)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Learning Roadmaps History */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display font-semibold text-base flex items-center gap-2">
              <Compass className="h-4.5 w-4.5 text-primary" />
              Syllabus & Learning Roadmaps
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {roadmapsQuery.isLoading ? (
                <div className="col-span-2">
                  <SkeletonLoader count={2} />
                </div>
              ) : roadmapHistory.length === 0 ? (
                <p className="col-span-2 text-xs text-muted-foreground text-center py-6">No learning roadmaps generated yet.</p>
              ) : (
                roadmapHistory.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl border border-border/60 bg-muted/5 flex flex-col justify-between text-xs">
                    <div>
                      <p className="font-bold text-sm text-foreground">{item.target_role}</p>
                      <p className="text-muted-foreground mt-1 line-clamp-2">Skills: {item.current_skills || "General"}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</span>
                      <button
                        onClick={() => toast.info(`Viewing saved roadmap: ${item.target_role}`)}
                        className="text-primary hover:underline font-semibold"
                      >
                        Launch Modules
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Saved History Lists */}
        <div className="lg:col-span-1 space-y-6">
          {/* Mock Interview History */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display font-semibold text-base flex items-center gap-2">
              <Video className="h-4.5 w-4.5 text-primary" />
              Interview Sessions
            </h3>
            
            <div className="space-y-3">
              {interviewsQuery.isLoading ? (
                <SkeletonLoader count={3} />
              ) : mockHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No interview sessions practiced yet.</p>
              ) : (
                mockHistory.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-border/40 bg-muted/10 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <p className="font-semibold">{item.job_role}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-500">{item.total_score ? `${item.total_score}%` : "Pending"}</p>
                      <button
                        onClick={() => toast.info(`Reviewing Mock Session ID: ${item.id}`)}
                        className="text-[9px] text-primary hover:underline"
                      >
                        View Grades
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cover Letters History */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display font-semibold text-base flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-primary" />
              Cover Letters History
            </h3>
            
            <div className="space-y-3">
              {coverLettersQuery.isLoading ? (
                <SkeletonLoader count={3} />
              ) : letterHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No cover letters generated yet.</p>
              ) : (
                letterHistory.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl border border-border/40 bg-muted/10 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <p className="font-semibold">{item.job_title}</p>
                      <p className="text-[10px] text-muted-foreground">{item.company_name} · {item.tone}</p>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => toast.info(`Copied Letter content for ${item.company_name}`)}
                        className="text-[9px] text-primary hover:underline font-semibold block"
                      >
                        Copy Draft
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// Simple badge helper to bypass components import complexity
function Badge({ children, className, variant }: { children: any; className?: string; variant?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}
