import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Briefcase,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { ROLE_LABELS, type AppRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TalentScreen" },
      {
        name: "description",
        content:
          "Sign in or create your TalentScreen account to post jobs, apply with your resume, and run AI candidate screening.",
      },
      { property: "og:title", content: "Sign in — TalentScreen" },
      {
        property: "og:description",
        content:
          "Access your TalentScreen account for AI-powered hiring and candidate screening.",
      },
      { property: "og:url", content: "https://hire-pal-ai.lovable.app/auth" },
    ],
    links: [{ rel: "canonical", href: "https://hire-pal-ai.lovable.app/auth" }],
  }),
  component: AuthPage,
});

const ROLE_OPTIONS: AppRole[] = ["candidate", "recruiter", "hiring_manager"];

const BRAND_FEATURES = [
  {
    icon: ShieldCheck,
    title: "Role-based workspaces",
    description: "Tailored dashboards for recruiters, managers, and candidates.",
  },
  {
    icon: Sparkles,
    title: "AI screening & match scoring",
    description: "Resume summaries and job-fit scores generated automatically.",
  },
  {
    icon: Users,
    title: "End-to-end pipeline",
    description: "Track every applicant from applied to hired in one place.",
  },
];

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // signup fields
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, loading, navigate]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, role },
      },
    });
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("weak") || msg.includes("pwned") || msg.includes("known")) {
        toast.error(
          "That password has appeared in a data breach. Please choose a stronger, unique password.",
        );
      } else if (msg.includes("already registered") || msg.includes("already exists")) {
        toast.error("An account with this email already exists. Try signing in instead.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Account created!");
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-[oklch(0.17_0.02_264)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Atmospheric mesh glows */}
        <div className="pointer-events-none absolute -left-[12%] -top-[12%] h-[62%] w-[62%] rounded-full bg-[oklch(0.55_0.19_264)]/45 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-[14%] -right-[12%] h-[62%] w-[62%] rounded-full bg-[oklch(0.52_0.2_300)]/35 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.18]" />

        <Link to="/" className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[oklch(0.6_0.18_264)] shadow-lg shadow-[oklch(0.5_0.18_264)]/30">
            <Briefcase className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            TalentScreen
          </span>
        </Link>

        <div className="relative z-10 max-w-md space-y-10">
          <h2 className="font-display text-5xl font-bold leading-[1.08] tracking-tight">
            Precision hiring{" "}
            <span className="text-[oklch(0.8_0.12_264)]">powered by AI.</span>
          </h2>

          <ul className="space-y-6">
            {BRAND_FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-[oklch(0.82_0.11_264)] backdrop-blur">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{feature.title}</p>
                  <p className="mt-0.5 text-sm text-white/55">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-sm text-white/50">
          <span>© {new Date().getFullYear()} TalentScreen</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>Trusted by modern hiring teams</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col bg-background px-6 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="mx-auto w-full max-w-md">
            <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
                <Briefcase className="h-4 w-4" />
              </div>
              <span className="font-display text-lg font-semibold tracking-tight">
                TalentScreen
              </span>
            </Link>

            <h1 className="font-display text-3xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to manage your hiring pipeline.
            </p>

            <div className="mt-8">
              <Tabs defaultValue="login">
                <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-muted p-1">
                  <TabsTrigger value="login" className="rounded-lg">
                    Sign in
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-lg">
                    Create account
                  </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="login-email"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Email address
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="login-password"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((v) => !v)}
                      aria-label={showLoginPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl text-base font-semibold transition-transform active:scale-[0.98]"
                  disabled={busy}
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Full name
                  </Label>
                  <Input
                    id="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="signup-role"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    I am a…
                  </Label>
                  <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                    <SelectTrigger id="signup-role" className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showSignupPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="h-11 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((v) => !v)}
                      aria-label={showSignupPassword ? "Hide password" : "Show password"}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use at least 6 characters.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl text-base font-semibold transition-transform active:scale-[0.98]"
                  disabled={busy}
                >
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create account
                </Button>
              </form>
            </TabsContent>
              </Tabs>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Your role determines which dashboard you'll see after signing in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
