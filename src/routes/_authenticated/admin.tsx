import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { RoleGate } from "@/components/RoleGate";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAdminStats,
  listAdminUsers,
  updateUserRole,
  deleteUser,
  getAdminAuditLogs,
} from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [{ title: "Admin Workspace — CareerSuccess" }],
  }),
  component: () => (
    <RoleGate role="admin">
      <AdminDashboard />
    </RoleGate>
  ),
});

function AdminDashboard() {
  const queryClient = useQueryClient();

  // Queries
  const statsQuery = useQuery({ queryKey: ["admin-stats"], queryFn: getAdminStats });
  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: listAdminUsers });
  const logsQuery = useQuery({ queryKey: ["admin-logs"], queryFn: getAdminAuditLogs });

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, preferredRoles }: { userId: number; preferredRoles: string }) =>
      updateUserRole(userId, preferredRoles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User role updated successfully.");
    },
    onError: (err) => {
      toast.error(`Failed to update role: ${err}`);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User profile deleted from database.");
    },
    onError: (err: any) => {
      toast.error(`Delete failed: ${err.message || err}`);
    },
  });

  const handleRoleChange = (userId: number, preferredRoles: string) => {
    updateRoleMutation.mutate({ userId, preferredRoles });
  };

  const handleDeleteUser = (userId: number) => {
    if (confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <AppShell
      title="Admin Console"
      subtitle="Overview of platform performance, user profiles, and security log status."
    >
      {/* 1. METRICS GRID */}
      {statsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover-lift flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Users</p>
              <p className="font-display text-xl font-bold mt-0.5">{statsQuery.data?.total_users}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover-lift flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Jobs</p>
              <p className="font-display text-xl font-bold mt-0.5">{statsQuery.data?.total_jobs}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover-lift flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Applications</p>
              <p className="font-display text-xl font-bold mt-0.5">{statsQuery.data?.total_applications}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover-lift flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mock Sessions</p>
              <p className="font-display text-xl font-bold mt-0.5">{statsQuery.data?.total_interview_sessions}</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADMIN ACTIONS SECTION */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Control Table */}
        <div className="lg:col-span-2 rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold text-base">User Directory & Role Control</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground font-bold">
                  <th className="py-3 px-2">ID</th>
                  <th className="py-3 px-2">Name</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Role Setup</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                    </td>
                  </tr>
                ) : (usersQuery.data || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No users registered.
                    </td>
                  </tr>
                ) : (
                  (usersQuery.data || []).map((u) => (
                    <tr key={u.id} className="border-b border-border/20 hover:bg-muted/10">
                      <td className="py-3.5 px-2 font-mono text-muted-foreground">{u.id}</td>
                      <td className="py-3.5 px-2 font-medium">{u.name}</td>
                      <td className="py-3.5 px-2 text-muted-foreground">{u.email}</td>
                      <td className="py-3.5 px-2">
                        <select
                          value={u.preferred_roles || "candidate"}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="rounded border border-border bg-background px-2 py-1 focus:outline-none"
                        >
                          <option value="candidate">Candidate</option>
                          <option value="recruiter">Recruiter</option>
                          <option value="hiring_manager">Hiring Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(u.id)}
                          className="hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="lg:col-span-1 rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold text-base">System Audit Stream</h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logsQuery.isLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
              </div>
            ) : (logsQuery.data || []).map((log) => (
              <div key={log.id} className="p-3 rounded-xl border border-border/40 bg-muted/10 text-xs">
                <div className="flex justify-between items-center gap-1 mb-1">
                  <span className="font-bold text-[10px] text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                    log.severity === "success" ? "bg-green-500/15 text-green-500" : "bg-primary/15 text-primary"
                  }`}>
                    {log.severity}
                  </span>
                </div>
                <p className="text-foreground/80 leading-relaxed font-mono text-[11px]">{log.event}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
