import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { ROLE_HOME } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TalentScreen" },
      {
        name: "description",
        content: "Your TalentScreen dashboard, routed to the workspace built for your role.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Dashboard — TalentScreen" },
      { property: "og:description", content: "Your role-based TalentScreen workspace." },
    ],
  }),
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (role) {
      navigate({ to: ROLE_HOME[role], replace: true });
    } else {
      navigate({ to: "/auth", replace: true });
    }
  }, [role, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
