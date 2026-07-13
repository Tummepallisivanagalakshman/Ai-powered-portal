import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { 
  apiFetch, 
  deleteNotification, 
  markNotificationRead, 
  markAllNotificationsRead 
} from "@/lib/api";
import { 
  Bell, 
  Check, 
  Trash2, 
  Video, 
  Briefcase, 
  Award, 
  BellRing, 
  Loader2 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/notifications-history")({
  head: () => ({
    meta: [{ title: "Notifications Center — CareerSuccess" }],
  }),
  component: () => <NotificationsHistory />,
});

function NotificationsHistory() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<"all" | "application" | "interview" | "report" | "system">("all");

  const notificationsQuery = useQuery({
    queryKey: ["notifications-list"],
    queryFn: async () => await apiFetch("/notifications/")
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
      toast.success("Notification marked as read.");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
      toast.success("Notification deleted.");
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
      toast.success("All notifications marked as read.");
    }
  });

  const list = notificationsQuery.data || [];
  
  const filteredList = list.filter(n => {
    return filterType === "all" || n.type === filterType;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "interview": return <Video className="h-4 w-4 text-emerald-500" />;
      case "application": return <Briefcase className="h-4 w-4 text-blue-500" />;
      case "report": return <Award className="h-4 w-4 text-purple-500" />;
      default: return <BellRing className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <AppShell
      title="Notifications History"
      subtitle="Examine your historic alerts, application progress logs, and system reports."
    >
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-soft">
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b border-border/40 pb-4">
          <div className="flex bg-muted/10 p-1 border border-border/40 rounded-xl gap-1 w-full sm:w-auto overflow-x-auto">
            {(["all", "application", "interview", "report", "system"] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap capitalize ${filterType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={() => markAllReadMutation.mutate()} className="rounded-xl w-full sm:w-auto shrink-0">
            <Check className="h-4 w-4 mr-1.5" /> Mark All as Read
          </Button>
        </div>

        {notificationsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">No alerts matching selected filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((n) => (
              <div 
                key={n.id} 
                className={`flex items-start justify-between p-4 rounded-xl border transition-all ${!n.is_read ? "bg-primary/5 border-primary/30 shadow-sm" : "bg-muted/10 border-border/15"}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-border/20 shrink-0 mt-0.5 shadow-soft">
                    {getNotifIcon(n.type)}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold leading-tight ${!n.is_read ? "text-foreground" : "text-foreground/80"}`}>{n.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-muted-foreground/60 block mt-2">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-4">
                  {!n.is_read && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => markReadMutation.mutate(n.id)}
                      className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/10 rounded-full"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => deleteMutation.mutate(n.id)}
                    className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 rounded-full"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </AppShell>
  );
}
