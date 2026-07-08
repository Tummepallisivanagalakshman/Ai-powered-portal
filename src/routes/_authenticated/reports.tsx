import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Download, TrendingUp, Calendar, Video, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
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

function ReportsPage() {
  return (
    <AppShell
      title="Saved Reports"
      subtitle="View your historic scoring progress, interview history, and analytics summaries."
      actions={
        <Button onClick={() => toast.success("Batch export compiled successfully!")} className="bg-blue-600 text-white rounded-xl text-xs h-9">
          <Download className="mr-1.5 h-4 w-4" /> Export All Data
        </Button>
      }
    >
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Side: Trends Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* ATS compatibility Area Chart */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-semibold text-base">ATS Match Trend</h3>
              <Badge variant="secondary" className="text-[10px]"><TrendingUp className="h-3 w-3 mr-1" /> +23% overall</Badge>
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
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAts)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Side: Saved History Lists */}
        <div className="lg:col-span-1 space-y-6">
          {/* Mock Interview History */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display font-semibold text-base flex items-center gap-2">
              <Video className="h-4.5 w-4.5 text-purple-600" />
              Interview History
            </h3>
            
            <div className="space-y-3">
              {mockInterviewHistory.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-border/40 bg-muted/10 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">{item.role}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> {item.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-500">{item.score}</p>
                    <button onClick={() => toast.info("Viewing historical feedback...")} className="text-[9px] text-blue-600 hover:underline">
                      View Feedback
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resume Audits History */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display font-semibold text-base flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-blue-600" />
              Resume Audit History
            </h3>
            
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">resume_v2.1.pdf</span>
                <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-500 border-none font-semibold">85% score</Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">resume_v2.0.pdf</span>
                <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 border-none font-semibold">74% score</Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">resume_v1.0.pdf</span>
                <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground border-none font-semibold">55% score</Badge>
              </div>
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
