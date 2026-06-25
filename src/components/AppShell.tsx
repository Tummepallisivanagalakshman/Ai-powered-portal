import { type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Briefcase } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { ROLE_LABELS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatWidget } from "@/components/ChatWidget";

const ROLE_HOME: Record<string, string> = {
  candidate: "/candidate",
  recruiter: "/recruiter",
  manager: "/manager",
};


export function AppShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { role, user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            to={(role && ROLE_HOME[role]) || "/"}
            className="group flex min-w-0 items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80"
            aria-label="Go to dashboard"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="truncate font-display text-base font-semibold tracking-tight">
              TalentScreen
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            {role && (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {ROLE_LABELS[role]}
              </Badge>
            )}
            <span className="hidden text-sm text-muted-foreground md:inline">
              {user?.email}
            </span>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {actions}
        </div>
        {children}
      </main>
      <ChatWidget />
    </div>
  );
}
