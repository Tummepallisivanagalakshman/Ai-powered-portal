import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { ROLE_HOME, type AppRole } from "@/lib/types";

function FullScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function RoleGate({ role: required, children }: { role: AppRole; children: ReactNode }) {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!role) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    if (role !== required) {
      navigate({ to: ROLE_HOME[role], replace: true });
    }
  }, [role, loading, required, navigate]);

  if (loading || role !== required) return <FullScreen />;
  return <>{children}</>;
}
