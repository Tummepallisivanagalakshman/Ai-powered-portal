import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { RoleGate } from "@/components/RoleGate";
import { useState } from "react";
import {
  Users,
  Briefcase,
  FileText,
  Video,
  Trash2,
  UserCheck,
  ShieldAlert,
  Loader2,
  Terminal,
  Activity,
  HeartHandshake,
  Cpu,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAdminStats,
  listAdminUsers,
  updateUserRole,
  deleteUser,
  getAdminAuditLogs,
  listJobsModeration,
  moderateJobStatus,
  getAIUsageAnalytics,
  getSystemHealth,
  getUserFeedbackList
} from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Admin Portal — CareerSuccess" }],
  }),
  component: () => (
    <RoleGate role="admin">
      <AdminDashboard />
    </RoleGate>
  ),
});

function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"users" | "jobs" | "health" | "feedbacks">("users");

  // Queries
  const statsQuery = useQuery({ queryKey: ["admin-stats"], queryFn: getAdminStats });
  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: listAdminUsers });
  const logsQuery = useQuery({ queryKey: ["admin-logs"], queryFn: getAdminAuditLogs });
  const jobsQuery = useQuery({ queryKey: ["admin-jobs-moderation"], queryFn: listJobsModeration });
  const healthQuery = useQuery({ queryKey: ["admin-system-health"], queryFn: getSystemHealth });
  const aiUsageQuery = useQuery({ queryKey: ["admin-ai-usage"], queryFn: getAIUsageAnalytics });
  const feedbacksQuery = useQuery({ queryKey: ["admin-feedbacks"], queryFn: getUserFeedbackList });

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, preferredRoles }: { userId: number; preferredRoles: string }) =>
      updateUserRole(userId, preferredRoles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User role updated successfully.");
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User profile deleted.");
    }
  });

  const moderateJobMutation = useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: string }) => moderateJobStatus(jobId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs-moderation"] });
      toast.success("Job status updated.");
    }
  });

  return (
    <AppShell
      title="Admin Portal"
      subtitle="Overview of platform performance, user profiles, jobs moderation, and AI feedbacks."
    >
      {/* Metrics Banner */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft flex items-center gap-3">
          <Users className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Users</p>
            <p className="font-display text-sm font-bold">{statsQuery.data?.total_users ?? 0}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft flex items-center gap-3">
          <Briefcase className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Active Jobs</p>
            <p className="font-display text-sm font-bold">{statsQuery.data?.total_jobs ?? 0}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Applications</p>
            <p className="font-display text-sm font-bold">{statsQuery.data?.total_applications ?? 0}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft flex items-center gap-3">
          <Video className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Mock Sessions</p>
            <p className="font-display text-sm font-bold">{statsQuery.data?.total_interview_sessions ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted/10 p-1 border border-border/40 rounded-xl gap-1 mb-8 overflow-x-auto">
        <button onClick={() => setActiveTab("users")} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "users" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Users & Audit</button>
        <button onClick={() => setActiveTab("jobs")} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "jobs" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Job Moderation</button>
        <button onClick={() => setActiveTab("health")} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "health" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>System Health</button>
        <button onClick={() => setActiveTab("feedbacks")} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === "feedbacks" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>User Feedbacks</button>
      </div>

      {/* Tab Contents */}
      {activeTab === "users" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" /> User Directory
            </h3>
            {usersQuery.isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border/45 text-muted-foreground uppercase tracking-wider font-bold">
                      <th className="py-3 px-2">Name</th>
                      <th className="py-3 px-2">Email</th>
                      <th className="py-3 px-2">Role</th>
                      <th className="py-3 px-2 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(usersQuery.data || []).map(u => (
                      <tr key={u.id} className="border-b border-border/20">
                        <td className="py-3.5 px-2 font-bold">{u.name}</td>
                        <td className="py-3.5 px-2 text-muted-foreground">{u.email}</td>
                        <td className="py-3.5 px-2">
                          <select
                            value={u.preferred_roles || "candidate"}
                            onChange={(e) => updateRoleMutation.mutate({ userId: u.id, preferredRoles: e.target.value })}
                            className="bg-card border border-border/50 rounded px-2 py-1 text-xs"
                          >
                            <option value="candidate">Candidate</option>
                            <option value="recruiter">Recruiter</option>
                            <option value="hiring_manager">Hiring Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <Button size="icon" variant="ghost" onClick={() => deleteUserMutation.mutate(u.id)} className="h-7 w-7 text-rose-500 hover:bg-rose-500/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 rounded-2xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" /> Audit Log Stream
            </h3>
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {(logsQuery.data || []).map(log => (
                <div key={log.id} className="p-2.5 rounded-lg border border-border/20 bg-muted/10 text-[10px]">
                  <p className="font-mono text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  <p className="font-semibold text-foreground/80 mt-1">{log.event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "jobs" && (
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
          <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" /> Active Platform Job Postings
          </h3>
          {jobsQuery.isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/45 text-muted-foreground uppercase tracking-wider font-bold">
                    <th className="py-3 px-2">Job Title</th>
                    <th className="py-3 px-2">Company</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(jobsQuery.data || []).map((j: any) => (
                    <tr key={j.id} className="border-b border-border/20">
                      <td className="py-3.5 px-2 font-bold">{j.title}</td>
                      <td className="py-3.5 px-2 text-muted-foreground">{j.company || "N/A"}</td>
                      <td className="py-3.5 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          j.status === "open" || j.status === "approved" ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"
                        }`}>{j.status}</span>
                      </td>
                      <td className="py-3.5 px-2 text-right flex justify-end gap-1.5">
                        <Button size="xs" variant="outline" onClick={() => moderateJobMutation.mutate({ jobId: j.id, status: "approved" })} className="text-emerald-500 hover:bg-emerald-500/10">Approve</Button>
                        <Button size="xs" variant="outline" onClick={() => moderateJobMutation.mutate({ jobId: j.id, status: "closed" })} className="text-muted-foreground hover:bg-muted/10">Close</Button>
                        <Button size="xs" variant="outline" onClick={() => moderateJobMutation.mutate({ jobId: j.id, status: "flagged" })} className="text-rose-500 hover:bg-rose-500/10">Flag</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "health" && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* System status */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Performance & Diagnostics
            </h3>
            {healthQuery.isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            ) : (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/10">
                  <span className="text-muted-foreground">Backend status</span>
                  <span className="flex items-center gap-1 text-emerald-500 font-bold"><CheckCircle2 className="h-4 w-4" /> {healthQuery.data?.status}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/10">
                  <span className="text-muted-foreground">Database linkage</span>
                  <span className="text-foreground/90 font-semibold">{healthQuery.data?.database}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/10">
                  <span className="text-muted-foreground">Server CPU load</span>
                  <span className="text-foreground/90 font-semibold">{healthQuery.data?.cpu_usage}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/10">
                  <span className="text-muted-foreground">API Latency (Average)</span>
                  <span className="text-primary font-bold">{healthQuery.data?.avg_response_time}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Failed HTTP Requests</span>
                  <span className="text-rose-500 font-semibold flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> {healthQuery.data?.failed_requests}</span>
                </div>
              </div>
            )}
          </div>

          {/* AI Usage analytics */}
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" /> AI Services Volume Metrics
            </h3>
            {aiUsageQuery.isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            ) : (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/10">
                  <span className="text-muted-foreground">Resumes Analysed</span>
                  <span className="text-foreground/95 font-bold">{aiUsageQuery.data?.resumes_analyzed}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/10">
                  <span className="text-muted-foreground">Cover Letters Generated</span>
                  <span className="text-foreground/95 font-bold">{aiUsageQuery.data?.letters_generated}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/10">
                  <span className="text-muted-foreground">Learning Roadmaps Generated</span>
                  <span className="text-foreground/95 font-bold">{aiUsageQuery.data?.roadmaps_generated}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Mock Interviews Evaluated</span>
                  <span className="text-foreground/95 font-bold">{aiUsageQuery.data?.interviews_conducted}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "feedbacks" && (
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
          <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-primary" /> AI Output Ratings & Feedbacks
          </h3>
          {feedbacksQuery.isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/45 text-muted-foreground uppercase tracking-wider font-bold">
                    <th className="py-3 px-2">User Email</th>
                    <th className="py-3 px-2">Target Modality</th>
                    <th className="py-3 px-2">Rating</th>
                    <th className="py-3 px-2">Written Comment</th>
                    <th className="py-3 px-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(feedbacksQuery.data || []).map((f: any) => (
                    <tr key={f.id} className="border-b border-border/20">
                      <td className="py-3.5 px-2 font-semibold">{f.user_email}</td>
                      <td className="py-3.5 px-2 capitalize font-medium text-primary">{f.target_type}</td>
                      <td className="py-3.5 px-2">
                        {f.helpful ? (
                          <span className="flex items-center gap-1 text-emerald-500 font-bold"><ThumbsUp className="h-3.5 w-3.5" /> Helpful</span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-500 font-bold"><ThumbsDown className="h-3.5 w-3.5" /> Not helpful</span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-muted-foreground italic truncate max-w-xs">{f.comment || "No comments"}</td>
                      <td className="py-3.5 px-2 text-muted-foreground text-right">{new Date(f.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {(feedbacksQuery.data || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">No feedbacks logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
