import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  ArrowRight,
  Brain,
  Rocket,
  CheckCircle2,
  ChevronDown,
  Github,
  Twitter,
  Linkedin,
  MessageSquare,
  FileSearch,
  Mic,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Career Success Portal — Accelerate Your Career" },
      {
        name: "description",
        content:
          "Improve your resumes, prepare for mock interviews, audit your ATS score, and track your career growth using state-of-the-art AI tooling.",
      },
      {
        property: "og:title",
        content: "AI Career Success Portal — Accelerate Your Career",
      },
      {
        property: "og:description",
        content:
          "Improve your resumes, prepare for mock interviews, audit your ATS score, and track your career growth using state-of-the-art AI tooling.",
      },
    ],
  }),
  component: Landing,
});

const STATS = [
  { value: "150K+", label: "Users Helped", desc: "Found roles at top companies" },
  { value: "480K+", label: "Resumes Analyzed", desc: "Optimized for ATS scanners" },
  { value: "120K+", label: "Interviews Practiced", desc: "94% felt more confident" },
];

const FEATURES = [
  {
    icon: FileSearch,
    title: "ATS Optimizer & Analyzer",
    desc: "Scan your resume against any job description to discover critical missing keywords and score issues.",
  },
  {
    icon: Mic,
    title: "AI Mock Interviews",
    desc: "Interactive mock interviews tailored to your role. Receive constructive feedback on communication & technical skills.",
  },
  {
    icon: Compass,
    title: "Personalized Roadmaps",
    desc: "Custom learning timelines mapped out by AI to target and close your specific professional skill gaps.",
  },
  {
    icon: Brain,
    title: "Smart Cover Letter Gen",
    desc: "Generate highly professional, contextual cover letters matching the tone and style of any target recruiter.",
  },
];

const TESTIMONIALS = [
  {
    quote: "This portal completely changed my job hunting game. The AI Mock Interview feedback helped me nail my Google interview!",
    author: "Sarah Jenkins",
    role: "Senior Software Engineer",
    company: "Google",
    avatar: "SJ",
  },
  {
    quote: "The Resume Analyzer pointed out exactly what keywords I was missing. Within 2 weeks of applying, my response rate doubled.",
    author: "Michael Chang",
    role: "Product Manager",
    company: "Stripe",
    avatar: "MC",
  },
  {
    quote: "Having the Job Tracker and Resume Builder integrated in one place is amazing. It makes organizing my search stress-free.",
    author: "Elena Rostova",
    role: "UX Designer",
    company: "Figma",
    avatar: "ER",
  },
];

const FAQS = [
  {
    question: "How does the Resume Analyzer calculate my ATS score?",
    answer: "The analyzer parses your uploaded resume alongside your target job description. It runs formatting audits, checks keyword density, assesses grammatical structures, and scores how well your resume matches what modern applicant tracking systems look for.",
  },
  {
    question: "Can I do mock interviews for non-technical roles?",
    answer: "Absolutely! You can choose roles ranging from Software Engineering to Product Management, Data Analytics, Marketing, and Sales. The questions and feedback adapt dynamically to the level (junior, senior, lead) and style of interview you select.",
  },
  {
    question: "How does the Job Tracker keep my applications organized?",
    answer: "It uses an intuitive Kanban-style board divided into five pipelines: Interested, Applied, Interview, Offer, and Rejected. You can click to update statuses, write detailed notes, and track application timelines effortlessly.",
  },
  {
    question: "Is there a limit on how many resumes I can build?",
    answer: "No, you can create and manage multiple resumes in the editor, switch layouts, edit achievements, and download them as clean PDFs whenever you need.",
  },
];

function Landing() {
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto testimonial carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* 1. NAVIGATION BAR */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 text-white">
              <Rocket className="h-4 w-4" />
            </div>
            <span className="font-display text-base font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CareerSuccess
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-full hidden sm:inline-flex"
            >
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative py-20 lg:py-28 border-b border-border/50">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="absolute top-1/4 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 -z-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 grid gap-12 lg:grid-cols-2 items-center">
          <div className="space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1 text-xs font-semibold text-blue-600 animate-fade-up dark:text-blue-400">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              Your complete AI career growth toolkit
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] animate-fade-up">
              Accelerate Your Career with{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </h1>
            <p className="mx-auto lg:mx-0 max-w-lg text-muted-foreground text-base sm:text-lg animate-fade-up">
              Optimize your resume for ATS screening, generate targeted cover letters, practice interactive mock interviews, and organize job applications in one unified workspace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4 animate-fade-up">
              <Button
                size="lg"
                className="rounded-full px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/20 transition-transform active:scale-[0.98]"
                asChild
              >
                <Link to="/auth">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 hover:bg-muted/50 transition-transform active:scale-[0.98]"
                asChild
              >
                <a href="#features">Explore Features</a>
              </Button>
            </div>
          </div>

          {/* Animated Illustration */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[420px] rounded-3xl border border-border/80 bg-card/40 p-6 shadow-2xl backdrop-blur-md overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
              
              {/* Scan Line Animation */}
              <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-blue-500/10 to-transparent animate-scan" />

              {/* Mock Resume Card UI */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold">
                      JD
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Alex Carter</h3>
                      <p className="text-[10px] text-muted-foreground">Product Engineer</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-500 border border-green-500/20">
                    Match 87%
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="h-2 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-2 w-full rounded bg-muted animate-pulse" />
                  <div className="h-2 w-5/6 rounded bg-muted animate-pulse" />
                </div>

                <div className="border-t border-border/40 pt-4 space-y-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">AI Skill Audit</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded bg-blue-600/10 border border-blue-500/10 px-2 py-0.5 text-[10px] text-blue-600 dark:text-blue-400 font-medium">React Hooks</span>
                    <span className="rounded bg-purple-600/10 border border-purple-500/10 px-2 py-0.5 text-[10px] text-purple-600 dark:text-purple-400 font-medium">GraphQL</span>
                    <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground line-through">Docker</span>
                    <span className="rounded bg-blue-600/10 border border-blue-500/10 px-2 py-0.5 text-[10px] text-blue-600 dark:text-blue-400 font-medium">TypeScript</span>
                  </div>
                </div>

                <div className="rounded-xl bg-purple-600/5 border border-purple-500/10 p-3 flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-purple-500 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <strong>ATS Recommendation:</strong> Add "Docker orchestration" to your experience section to match 95% of job requirements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STATISTICS SECTION */}
      <section className="py-16 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3 text-center">
            {STATS.map((s, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm">
                <p className="font-display text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {s.value}
                </p>
                <p className="mt-2 font-semibold text-sm">{s.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Everything You Need</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              State-of-the-Art Tools for Success
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              A comprehensive suite of career preparation utilities designed to build skills, improve layout presentation, and track jobs.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="group rounded-3xl border border-border/60 bg-card p-6 shadow-soft hover-lift">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600/10 to-purple-600/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="mt-5 font-display font-bold text-base leading-snug">{f.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS CAROUSEL */}
      <section className="py-20 bg-muted/20 border-y border-border/40 relative">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">Success Stories</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold mt-2">Loved by Candidates Globally</h2>
          </div>

          {/* Carousel Slide */}
          <div className="relative overflow-hidden min-h-[220px]">
            {TESTIMONIALS.map((t, idx) => (
              <div
                key={idx}
                className={`transition-all duration-700 ease-in-out absolute inset-x-0 top-0 flex flex-col items-center text-center space-y-4 ${
                  idx === currentSlide
                    ? "opacity-100 translate-x-0 relative"
                    : "opacity-0 translate-x-12 pointer-events-none"
                }`}
              >
                <span className="text-4xl text-purple-500 font-serif">“</span>
                <p className="text-base sm:text-lg max-w-2xl font-medium leading-relaxed italic">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3 pt-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    {t.avatar}
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold">{t.author}</h4>
                    <p className="text-[10px] text-muted-foreground">
                      {t.role} @ <span className="font-semibold">{t.company}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {TESTIMONIALS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? "w-6 bg-blue-600" : "w-2 bg-muted"
                }`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Questions & Answers</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => {
              const isOpen = activeFAQ === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card overflow-hidden transition-all shadow-sm"
                >
                  <button
                    onClick={() => setActiveFAQ(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm sm:text-base hover:bg-muted/30 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div
                    className={`transition-all duration-300 overflow-hidden ${
                      isOpen ? "max-h-48 border-t border-border/40" : "max-h-0"
                    }`}
                  >
                    <p className="p-5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-border/50 bg-card py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 text-white">
                <Rocket className="h-4 w-4" />
              </div>
              <span className="font-display text-base font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CareerSuccess
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Empowering candidates with AI-powered resume analyzers, Mock Interviews, roadmaps, and career tracking.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Product</h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li><Link to="/auth" className="hover:text-primary">Resume Analyzer</Link></li>
              <li><Link to="/auth" className="hover:text-primary">AI Mock Interview</Link></li>
              <li><Link to="/auth" className="hover:text-primary">ATS Auditor</Link></li>
              <li><Link to="/auth" className="hover:text-primary">Job Tracker</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li><a href="#" className="hover:text-primary">About Us</a></li>
              <li><a href="#" className="hover:text-primary">Success Stories</a></li>
              <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Connect With Us</h4>
            <div className="flex gap-3 mb-4">
              <a href="#" className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                <Github className="h-4 w-4" />
              </a>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Email: support@careersuccess.ai
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-8 pt-8 border-t border-border/40 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} CareerSuccess. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
