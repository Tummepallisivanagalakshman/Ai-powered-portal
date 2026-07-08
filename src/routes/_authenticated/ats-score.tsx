import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CheckCircle2, AlertTriangle, XCircle, Info, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/ats-score")({
  head: () => ({
    meta: [{ title: "ATS Score Auditor — CareerSuccess" }],
  }),
  component: AtsScorePage,
});

const ATS_CATEGORIES = [
  { name: "File Structure", score: 100, status: "passed", desc: "Standard single-column PDF. No textboxes, images, or vectors block the parsing layer." },
  { name: "Section Headings", score: 90, status: "passed", desc: "Recognizable headings: Experience, Education, Skills, and Projects matched parsed templates." },
  { name: "Keyword Density", score: 70, status: "warning", desc: "Core keywords (TypeScript, GraphQL) appear, but secondary terms (CI/CD, Webpack) are missing." },
  { name: "Quantified Metrics", score: 60, status: "warning", desc: "Several experience bullets lack quantified business results (revenue, speedup, savings)." },
  { name: "Contact & Links", score: 100, status: "passed", desc: "Valid Email, LinkedIn URL, and Portfolio Link detected and parsed successfully." },
];

function AtsScorePage() {
  return (
    <AppShell
      title="ATS Score Auditor"
      subtitle="Evaluate how applicant tracking systems parse and grade your resume document."
    >
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Overall breakdown */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft text-center space-y-4">
            <h3 className="font-display font-semibold text-base">ATS Compatibility</h3>
            
            {/* Core Circular Gauge UI */}
            <div className="mx-auto relative h-32 w-32 flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 border-4 border-blue-600/30">
              <span className="font-display text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">84</span>
              <span className="text-[10px] text-muted-foreground absolute bottom-4">Score</span>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold">Tier 2 Compatibility</p>
              <p className="text-xs text-muted-foreground">Passed 8 of 10 standard parser checks.</p>
            </div>

            <hr className="border-border/40" />

            <div className="space-y-2.5 text-left">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Formatting Score:</span>
                <span className="font-semibold text-green-500">95 / 100</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Keyword Relevance:</span>
                <span className="font-semibold text-yellow-500">72 / 100</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Grammar & Impact:</span>
                <span className="font-semibold text-blue-500">85 / 100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Detailed Audits List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-5">
            <h3 className="font-display font-semibold text-base">Parser Verification Breakdown</h3>

            <div className="space-y-4">
              {ATS_CATEGORIES.map((cat, idx) => {
                const isPassed = cat.status === "passed";
                return (
                  <div key={idx} className="p-4 rounded-2xl border border-border/40 bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {isPassed ? (
                          <CheckCircle2 className="h-4.5 w-4.5 text-green-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4.5 w-4.5 text-yellow-500 shrink-0" />
                        )}
                        <span className="text-sm font-semibold">{cat.name}</span>
                      </div>
                      <Badge variant={isPassed ? "secondary" : "outline"} className="text-[10px]">
                        Score: {cat.score}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{cat.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Keyword Density Details */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <h4 className="font-display font-semibold text-sm flex items-center gap-1.5">
                <Info className="h-4 w-4 text-blue-500" />
                Keyword Density Details
              </h4>
              <p className="text-xs text-muted-foreground">
                We audited the text against the target job requirements. Here are the core keywords discovered:
              </p>
              
              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div className="p-3 rounded-xl border border-border/40 bg-card space-y-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Matched Keywords (Strong)</span>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/15 border-none text-[9px]">React (4x)</Badge>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/15 border-none text-[9px]">TypeScript (3x)</Badge>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/15 border-none text-[9px]">Next.js (2x)</Badge>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border/40 bg-card space-y-2">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">Missing/Low Density</span>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/15 border-none text-[9px]">GraphQL (0x)</Badge>
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/15 border-none text-[9px]">CI/CD (1x)</Badge>
                    <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/15 border-none text-[9px]">Docker (0x)</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
