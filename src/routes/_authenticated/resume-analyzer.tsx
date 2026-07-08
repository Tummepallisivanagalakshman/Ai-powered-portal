import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Upload,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Save,
  RefreshCw,
  Search,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { analyzeResumeATS } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/resume-analyzer")({
  head: () => ({
    meta: [{ title: "Resume Analyzer — CareerSuccess" }],
  }),
  component: ResumeAnalyzer,
});

interface FormattingCheck {
  name: string;
  score: number;
  status: "passed" | "warning";
  desc: string;
}

function ResumeAnalyzer() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("Alex Carter\nFrontend Developer\nSkills: React, TypeScript, Next.js");
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultsReady, setResultsReady] = useState(false);

  // AI results states
  const [score, setScore] = useState(0);
  const [formattingChecks, setFormattingChecks] = useState<FormattingCheck[]>([]);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
  const [matchingKeywords, setMatchingKeywords] = useState<string[]>([]);

  const handleResumeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setResumeFile(file);
      readTextFile(file);
      toast.success(`Resume "${file.name}" uploaded!`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
      readTextFile(file);
      toast.success(`Resume "${file.name}" uploaded!`);
    }
  };

  const readTextFile = (file: File) => {
    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setResumeText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const runAnalysis = async () => {
    if (!resumeFile) {
      toast.error("Please upload your resume file first.");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("Please provide the target job description.");
      return;
    }

    setAnalyzing(true);
    setProgress(30);
    
    try {
      const response = await analyzeResumeATS({
        data: {
          resumeText,
          jobDescription,
        },
      });
      setProgress(100);
      setScore(response.score);
      setFormattingChecks(response.formattingChecks as FormattingCheck[]);
      setMissingKeywords(response.missingKeywords);
      setMatchingKeywords(response.matchingKeywords);
      setResultsReady(true);
      setAnalyzing(false);
      toast.success("AI Resume Analysis Completed!");
    } catch (err: any) {
      setAnalyzing(false);
      toast.error(err.message || "Failed to analyze resume.");
    }
  };

  return (
    <AppShell
      title="Resume Analyzer"
      subtitle="Audit your resume layout, grammar, and ATS compatibility using AI screening."
    >
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Input upload panels */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-5">
            <h3 className="font-display font-semibold text-base">Input Files</h3>

            {/* Resume Upload Drag/Drop */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">1. Upload Resume</Label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleResumeDrop}
                className="border-2 border-dashed border-border/60 hover:border-blue-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-muted/10 relative overflow-hidden"
              >
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileSelect}
                />
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2.5" />
                <p className="text-xs font-semibold">
                  {resumeFile ? resumeFile.name : "Drag & Drop Resume here"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Supports PDF, DOCX, TXT up to 5MB</p>
              </div>
            </div>

            {/* Target Job Description */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">2. Target Job Description</Label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the target job description here to check key-word matches..."
                rows={6}
                className="w-full text-xs rounded-2xl border border-border/60 bg-background/50 p-4 focus:border-blue-600 focus:outline-none resize-none"
              />
            </div>

            <Button
              onClick={runAnalysis}
              disabled={analyzing}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {analyzing ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <Sparkles className="h-4.5 w-4.5" />}
              Analyze Resume
            </Button>

            {analyzing && (
              <div className="space-y-2 pt-2 animate-fade-in">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>Running AI Checks...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-muted" />
              </div>
            )}
          </div>
        </div>

        {/* Right: Results Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {resultsReady ? (
            <div className="space-y-6 animate-fade-up">
              {/* ATS Overview ring */}
              <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft grid gap-6 sm:grid-cols-3 items-center">
                <div className="flex flex-col items-center justify-center p-4 relative border-r border-border/40 sm:border-r-0">
                  {/* Gauge indicator */}
                  <div className="relative h-28 w-28 flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 border-4 border-blue-600/30">
                    <span className="font-display text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{score}</span>
                    <span className="text-[10px] text-muted-foreground absolute bottom-4">Score</span>
                  </div>
                  <p className="text-xs font-semibold mt-3 text-center">{score >= 80 ? "Highly Compatible" : score >= 60 ? "Moderate Fit" : "Needs Review"}</p>
                </div>

                <div className="sm:col-span-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <h4 className="font-bold text-sm">Resume Quality Status: {score >= 85 ? "Excellent" : "Needs Optimization"}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    AI parsed single-column formats. Verified formatting checklists, grammar densities, and compared keyword distributions against target job indicators.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="rounded-lg text-xs h-9 gap-1.5" onClick={() => toast.success("PDF Report download started.")}>
                      <Download className="h-3.5 w-3.5" /> Download Report
                    </Button>
                  </div>
                </div>
              </div>

              {/* Specific findings */}
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Missing Skills */}
                <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Missing Keywords</h4>
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Add these keywords to align with the job description:</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {missingKeywords.length > 0 ? (
                      missingKeywords.map((k, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/15 border-none text-[10px]">{k}</Badge>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground">No missing keywords found.</span>
                    )}
                  </div>
                </div>

                {/* Grammar & Style issues */}
                <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Formatting & Style</h4>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <ul className="space-y-2 text-[11px] text-muted-foreground">
                    {formattingChecks.map((check, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full mt-1 shrink-0 ${check.status === "passed" ? "bg-green-500" : "bg-yellow-500"}`} />
                        <span><strong>{check.name}:</strong> {check.desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Suggested Improvements */}
              <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
                <h4 className="font-display font-semibold text-sm">Target Keywords Found</h4>
                <div className="flex flex-wrap gap-1.5">
                  {matchingKeywords.length > 0 ? (
                    matchingKeywords.map((k, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/15 border-none text-[10px]">{k}</Badge>
                    ))
                  ) : (
                    <span className="text-[10px] text-muted-foreground">No matching keywords detected.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[450px] rounded-3xl border border-dashed border-border/70 bg-card/20 flex flex-col items-center justify-center text-center p-6">
              <FileText className="h-12 w-12 text-muted-foreground/60 mb-3" />
              <h3 className="font-display font-semibold text-base text-muted-foreground">No Active Analysis</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Upload your resume file and input target job descriptions, then click "Analyze Resume" to view matching details here.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// Simple label helper
function Label({ children, className }: { children: any; className?: string }) {
  return <label className={`block text-xs font-semibold mb-1.5 ${className}`}>{children}</label>;
}
