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

const SkeletonCard = () => (
  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="h-24 w-full rounded-2xl bg-muted/20 border border-border/10 animate-pulse" />
    ))}
  </div>
);

const SkeletonRows = () => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <tr key={i} className="border-b border-border/10 animate-pulse">
        <td colSpan={5} className="py-4 px-2">
          <div className="h-4 bg-muted/20 rounded w-full" />
        </td>
      </tr>
    ))}
  </>
);

const SkeletonMobileCards = () => (
  <div className="space-y-4 md:hidden">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-28 w-full rounded-2xl bg-muted/20 border border-border/10 animate-pulse" />
    ))}
  </div>
);

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
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover-lift flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Users</p>
            {statsQuery.isLoading || statsQuery.data === undefined ? (
              <div className="h-5 w-12 bg-muted/40 animate-pulse rounded mt-1.5" />
            ) : (
              <p className="font-display text-xl font-bold mt-0.5">{statsQuery.data.total_users}</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover-lift flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Jobs</p>
            {statsQuery.isLoading || statsQuery.data === undefined ? (
              <div className="h-5 w-12 bg-muted/40 animate-pulse rounded mt-1.5" />
            ) : (
              <p className="font-display text-xl font-bold mt-0.5">{statsQuery.data.total_jobs}</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover-lift flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Applications</p>
            {statsQuery.isLoading || statsQuery.data === undefined ? (
              <div className="h-5 w-12 bg-muted/40 animate-pulse rounded mt-1.5" />
            ) : (
              <p className="font-display text-xl font-bold mt-0.5">{statsQuery.data.total_applications}</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover-lift flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Mock Sessions</p>
            {statsQuery.isLoading || statsQuery.data === undefined ? (
              <div className="h-5 w-12 bg-muted/40 animate-pulse rounded mt-1.5" />
            ) : (
              <p className="font-display text-xl font-bold mt-0.5">{statsQuery.data.total_interview_sessions}</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. ADMIN ACTIONS SECTION */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Control Table */}
        <div className="lg:col-span-2 rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold text-base">User Directory & Role Control</h3>
          </div>
          {usersQuery.isLoading ? (
            <>
              <div className="hidden md:block overflow-x-auto">
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
                    <SkeletonRows />
                  </tbody>
                </table>
              </div>
              <SkeletonMobileCards />
            </>
          ) : (usersQuery.data || []).length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No users registered.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
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
                    {(usersQuery.data || []).map((u) => (
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden space-y-4">
                {(usersQuery.data || []).map((u) => (
                  <div key={u.id} className="p-4 rounded-2xl border border-border/60 bg-muted/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-muted-foreground">ID: {u.id}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(u.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-border/20">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Role</span>
                      <select
                        value={u.preferred_roles || "candidate"}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none"
                      >
                        <option value="candidate">Candidate</option>
                        <option value="recruiter">Recruiter</option>
                        <option value="hiring_manager">Hiring Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
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
