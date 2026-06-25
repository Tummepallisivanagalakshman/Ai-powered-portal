import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Brain,
  Briefcase,
  CheckCircle2,
  FileSearch,
  Sparkles,
  UserCheck,
  Users,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Reveal, CountUp } from "@/components/Reveal";
import heroImage from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TalentScreen — AI-Powered Hiring & Candidate Screening" },
      {
        name: "description",
        content:
          "Post jobs, apply with your resume, and run AI candidate screening in one role-based portal for candidates, recruiters, and hiring managers.",
      },
      {
        property: "og:title",
        content: "TalentScreen — AI-Powered Hiring & Candidate Screening",
      },
      {
        property: "og:description",
        content:
          "One portal to post jobs, apply, run AI candidate screening, and make confident hiring decisions.",
      },
      { property: "og:url", content: "https://hire-pal-ai.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://hire-pal-ai.lovable.app/" }],
  }),
  component: Landing,
});

const ROLES = [
  {
    icon: Users,
    title: "Candidates",
    points: ["Browse open roles", "Apply & upload your resume", "Track application status live"],
  },
  {
    icon: FileSearch,
    title: "HR / Recruiters",
    points: ["Create job postings", "Run AI candidate screening", "Shortlist & generate interview questions"],
  },
  {
    icon: UserCheck,
    title: "Hiring Managers",
    points: ["Review shortlisted candidates", "Read AI candidate summaries", "Approve or reject with notes"],
  },
];

const FEATURES = [
  { icon: Brain, title: "AI Screening", desc: "Score and summarize each applicant against the role in seconds." },
  { icon: Sparkles, title: "Interview Questions", desc: "Generate tailored questions based on the candidate's experience." },
  { icon: CheckCircle2, title: "Role-based Access", desc: "Every user sees a dashboard built for exactly what they do." },
];

const STATS = [
  { value: 3, label: undefined as string | undefined, suffix: "", caption: "Tailored roles" },
  { value: 0, label: "AI", suffix: "", caption: "Resume scoring" },
  { value: 1, label: undefined, suffix: "", caption: "Unified pipeline" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="group flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="font-display text-base font-semibold tracking-tight">
              TalentScreen
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button
              asChild
              size="sm"
              className="rounded-full px-5 transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full opacity-50 blur-3xl float-soft"
          style={{ background: "color-mix(in oklab, var(--primary) 22%, transparent)" }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground animate-fade-up">
              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              AI-powered hiring workflow
            </span>
            <h1
              className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl animate-fade-up"
              style={{ animationDelay: "80ms" }}
            >
              Hire smarter with{" "}
              <span className="text-gradient">AI candidate screening</span>
            </h1>
            <p
              className="mt-6 max-w-lg text-base text-muted-foreground sm:text-lg animate-fade-up"
              style={{ animationDelay: "160ms" }}
            >
              One calm, focused portal for candidates, recruiters, and hiring
              managers. Post roles, apply in minutes, and let AI surface the
              strongest applicants.
            </p>
            <div
              className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap animate-fade-up"
              style={{ animationDelay: "240ms" }}
            >
              <Button
                size="lg"
                className="group rounded-full px-6 transition-transform duration-200 hover:scale-105 active:scale-95"
                asChild
              >
                <Link to="/auth">
                  Get started{" "}
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-6 transition-transform duration-200 hover:scale-105 active:scale-95"
                asChild
              >
                <Link to="/auth">I'm a candidate</Link>
              </Button>
            </div>
            <dl
              className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-8 animate-fade-up"
              style={{ animationDelay: "320ms" }}
            >
              {STATS.map((s) => (
                <div key={s.caption}>
                  <dt className="font-display text-2xl font-semibold tracking-tight">
                    <CountUp value={s.value} label={s.label} suffix={s.suffix} />
                  </dt>
                  <dd className="mt-1 text-xs text-muted-foreground">{s.caption}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="relative animate-scale-in" style={{ animationDelay: "200ms" }}>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-transform duration-500 hover:-translate-y-1.5 hover:shadow-[var(--shadow-elegant)]">
              <img
                src={heroImage}
                alt="AI hiring platform connecting candidate profiles and resumes"
                width={1536}
                height={1024}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal className="max-w-2xl">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Role-based
            </span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for every role in hiring
            </h2>
            <p className="mt-3 text-muted-foreground">
              Each person gets a focused dashboard with exactly the tools they
              need — nothing more.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {ROLES.map((r, i) => (
              <Reveal key={r.title} delay={i * 120}>
                <div className="group h-full rounded-2xl border border-border bg-card p-7 hover-lift">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                    <r.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-semibold">
                    {r.title}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {r.points.map((p) => (
                      <li
                        key={p}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal className="mb-12 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Capabilities
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to screen and hire
          </h2>
          <p className="mt-3 text-muted-foreground">
            Powerful AI tooling that keeps your hiring pipeline fast, fair, and
            focused.
          </p>
        </Reveal>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <div className="group h-full bg-card p-8 transition-colors duration-300 hover:bg-accent/40">
                <f.icon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
                <h3 className="mt-5 font-display text-lg font-semibold">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-hero-gradient px-6 py-16 text-center text-white sm:px-8">
            <div className="pointer-events-none absolute inset-0 bg-dots opacity-30" />
            <div className="relative">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Ready to find your next great hire?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/70">
                Create your account and pick your role to get started in seconds.
              </p>
              <Button
                size="lg"
                variant="secondary"
                className="group mt-9 rounded-full px-6 transition-transform duration-200 hover:scale-105 active:scale-95"
                asChild
              >
                <Link to="/auth">
                  Create your account{" "}
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} TalentScreen. AI-powered hiring portal.
      </footer>
    </div>
  );
}
