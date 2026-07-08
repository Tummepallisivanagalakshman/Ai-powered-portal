import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  ShieldCheck,
  Zap,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CareerSuccess" },
      {
        name: "description",
        content: "Sign in to access your AI Career Success Portal workspace.",
      },
    ],
  }),
  component: AuthPage,
});

const BRAND_FEATURES = [
  {
    icon: ShieldCheck,
    title: "ATS Optimization & Scan",
    description: "Instant feedback on resume layout, grammar, and keyword matching.",
  },
  {
    icon: Zap,
    title: "Interactive Mock Interviews",
    description: "Adaptive AI questions with metrics on communication and confidence.",
  },
  {
    icon: Bookmark,
    title: "Kanban Job Tracking",
    description: "Organize applications from applied to offers in one dashboard.",
  },
];

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  
  // Toggle states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Signup fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Simple validation helpers
  const isEmailValid = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isPasswordStrong = (val: string) => val.length >= 6;

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/candidate", replace: true });
    }
  }, [user, loading, navigate]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmailValid(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!isPasswordStrong(password)) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      // 1. Register the user
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName || "New User",
          email: email,
          password: password,
        }),
      });

      if (!registerRes.ok) {
        const errorData = await registerRes.json().catch(() => ({}));
        throw new Error(errorData.detail || "Registration failed");
      }

      // 2. Automatically log them in to get the JWT token (OAuth2 Form uses x-www-form-urlencoded)
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!loginRes.ok) {
        throw new Error("Login failed after registration");
      }

      const { access_token } = await loginRes.json();
      
      // Get the newly registered user's profile
      const meRes = await fetch("/api/users/me", {
        headers: { "Authorization": `Bearer ${access_token}` },
      });
      const userData = await meRes.json();

      // Sign in locally via Context
      signIn(access_token, userData);

      toast.success("Account created successfully!");
      navigate({ to: "/candidate", replace: true });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!isEmailValid(loginEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", loginEmail);
      formData.append("password", loginPassword);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Invalid credentials");
      }

      const { access_token } = await res.json();

      // Fetch user profile
      const meRes = await fetch("/api/users/me", {
        headers: { "Authorization": `Bearer ${access_token}` },
      });
      const userData = await meRes.json();

      // Update auth context state
      signIn(access_token, userData);

      toast.success("Signed in successfully!");
      navigate({ to: "/candidate", replace: true });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const handleGoogleSignIn = () => {
    toast.info("Google Authentication is running in Demo UI mode.");
  };

  const handleForgotPassword = () => {
    if (!loginEmail) {
      toast.error("Please enter your email address to reset your password.");
      return;
    }
    toast.success(`Password reset email sent to ${loginEmail}`);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background">
      {/* Brand panel (Desktop) */}
      <div className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-[10%] -top-[10%] h-[60%] w-[60%] rounded-full bg-blue-600/20 blur-[130px]" />
        <div className="pointer-events-none absolute -bottom-[10%] -right-[10%] h-[60%] w-[60%] rounded-full bg-purple-600/20 blur-[130px]" />
        
        <Link to="/" className="relative z-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 text-white shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">CareerSuccess</span>
        </Link>

        <div className="relative z-10 max-w-md space-y-12">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">
            Accelerate your career milestones with <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">AI assistance.</span>
          </h2>

          <ul className="space-y-6">
            {BRAND_FEATURES.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-4">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-blue-400 backdrop-blur">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-sm sm:text-base">{feature.title}</p>
                  <p className="mt-0.5 text-xs sm:text-sm text-white/60">{feature.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-xs text-white/40">
          <span>© {new Date().getFullYear()} CareerSuccess</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>Privacy Policy</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col bg-background px-6 py-8 sm:px-10 overflow-y-auto">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 flex-col justify-center py-10">
          <div className="mx-auto w-full max-w-md">
            <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-display text-base font-bold tracking-tight">
                CareerSuccess
              </span>
            </Link>

            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Sign in to resume your path to career excellence.</p>

            <div className="mt-8">
              <Tabs defaultValue="login">
                <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-muted p-1">
                  <TabsTrigger value="login" className="rounded-lg text-xs sm:text-sm">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-lg text-xs sm:text-sm">
                    Create Account
                  </TabsTrigger>
                </TabsList>

                {/* SIGN IN TAB */}
                <TabsContent value="login" className="mt-6 space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email" className="text-xs font-semibold text-muted-foreground">
                        Email Address
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="name@example.com"
                        className={`h-11 rounded-xl focus-visible:ring-blue-600 ${
                          loginEmail && !isEmailValid(loginEmail) ? "border-red-500" : ""
                        }`}
                      />
                      {loginEmail && !isEmailValid(loginEmail) && (
                        <p className="text-[10px] text-red-500">Please enter a valid email format.</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-xs font-semibold text-muted-foreground">
                          Password
                        </Label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-[11px] font-medium text-blue-600 hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="h-11 rounded-xl pr-10 focus-visible:ring-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword((v) => !v)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        >
                          {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(!!checked)}
                      />
                      <label htmlFor="remember-me" className="text-xs text-muted-foreground cursor-pointer select-none">
                        Remember Me
                      </label>
                    </div>

                    <Button
                      type="submit"
                      className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold text-sm transition-transform active:scale-[0.98] mt-2"
                      disabled={busy}
                    >
                      {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>

                  <div className="relative py-2 flex items-center justify-center">
                    <span className="absolute inset-x-0 h-px bg-border/60" />
                    <span className="relative bg-background px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Or Connect With</span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    className="w-full h-11 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-muted/30"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </TabsContent>

                {/* SIGN UP TAB */}
                <TabsContent value="signup" className="mt-6 space-y-4">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="h-11 rounded-xl focus-visible:ring-blue-600"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className={`h-11 rounded-xl focus-visible:ring-blue-600 ${
                          email && !isEmailValid(email) ? "border-red-500" : ""
                        }`}
                      />
                      {email && !isEmailValid(email) && (
                        <p className="text-[10px] text-red-500">Please enter a valid email format.</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">
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
                          className={`h-11 rounded-xl pr-10 focus-visible:ring-blue-600 ${
                            password && !isPasswordStrong(password) ? "border-red-500" : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword((v) => !v)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        >
                          {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {password && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className={`h-1.5 flex-1 rounded ${isPasswordStrong(password) ? "bg-green-500" : "bg-red-400"}`} />
                          <span className={`h-1.5 flex-1 rounded ${password.length >= 10 ? "bg-green-500" : "bg-muted"}`} />
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {password.length < 6 ? "Too short" : password.length < 10 ? "Medium" : "Strong"}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold text-sm transition-transform active:scale-[0.98] mt-2"
                      disabled={busy}
                    >
                      {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </form>

                  <div className="relative py-2 flex items-center justify-center">
                    <span className="absolute inset-x-0 h-px bg-border/60" />
                    <span className="relative bg-background px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Or Connect With</span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    className="w-full h-11 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-muted/30"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
