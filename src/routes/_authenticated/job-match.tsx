import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Upload, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Activity, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { matchResumeToJD } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/job-match")({
  head: () => ({
    meta: [{ title: "Job Match Analyzer — CareerSuccess" }],
  }),
  component: JobMatchPage,
});

function JobMatchPage() {
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState("Alex Carter\nSkills: React.js, TypeScript, Tailwind CSS, Vite\nExperience: Worked at Stripe.");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [calculated, setCalculated] = useState(false);

  // Match result states
  const [score, setScore] = useState(0);
  const [matchingSkills, setMatchingSkills] = useState<string[]>([]);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [hiringProbability, setHiringProbability] = useState(0);
  const [recommendation, setRecommendation] = useState("");

  const handleResumeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setResumeName(file.name);
      readTextFile(file);
      toast.success("Resume uploaded successfully!");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeName(file.name);
      readTextFile(file);
      toast.success("Resume uploaded successfully!");
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

  const handleCalculateMatch = async () => {
    if (!resumeName) {
      toast.error("Please upload your resume file first.");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("Please paste the target job description.");
      return;
    }

    setLoading(true);
    setProgress(30);
    
    try {
      const response = await matchResumeToJD({
        data: {
          resumeText,
          jobDescription,
        },
      });
      setProgress(100);
      setScore(response.score);
      setMatchingSkills(response.matchingSkills);
      setMissingSkills(response.missingSkills);
      setHiringProbability(response.hiringProbability);
      setRecommendation(response.recommendation);
      setCalculated(true);
      setLoading(false);
      toast.success("Job Match score calculated successfully!");
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || "Failed to calculate job match.");
    }
  };

  return (
    <AppShell
      title="Job Match Analyzer"
      subtitle="Analyze your resume alignment against target roles to gauge hiring probability."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Panel Container (Left: Resume, Right: JD) */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-6">
          <h3 className="font-display font-semibold text-base">Comparison Settings</h3>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Left: Upload Resume */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">1. Your Resume</label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleResumeDrop}
                className="border-2 border-dashed border-border/60 hover:border-blue-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-muted/10 relative h-40 flex flex-col justify-center items-center"
              >
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <Upload className="h-7 w-7 text-muted-foreground mb-2" />
                <p className="text-xs font-semibold">
                  {resumeName ? resumeName : "Upload Resume File"}
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5">PDF or Word</p>
              </div>
            </div>

            {/* Right: Job Description */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">2. Paste Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the key responsibilities, roles, and skills required for the job..."
                className="w-full text-xs rounded-2xl border border-border/60 bg-background/50 p-3 h-40 focus:border-blue-600 focus:outline-none resize-none"
              />
            </div>
          </div>

          <Button
            onClick={handleCalculateMatch}
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold text-white rounded-xl flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4.5 w-4.5" />
            Calculate Job Match
          </Button>

          {loading && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                <span>Mapping semantic attributes...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-1 bg-muted" />
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div>
          {calculated ? (
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-6 animate-fade-up">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-base">Match Report</h3>
                <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-none font-semibold text-xs">Calculated</Badge>
              </div>

              {/* Progress bars */}
              <div className="space-y-4">
                {/* Match Percentage */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Overall Match Compatibility</span>
                    <span className="text-blue-600">{score}%</span>
                  </div>
                  <Progress value={score} className="h-2 bg-muted [&>div]:bg-blue-600" />
                </div>

                {/* Hiring Probability */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Hiring Probability Score</span>
                    <span className="text-purple-600">{hiringProbability}%</span>
                  </div>
                  <Progress value={hiringProbability} className="h-2 bg-muted [&>div]:bg-purple-600" />
                </div>
              </div>

              {/* Skills grids */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="p-4 rounded-xl border border-border/40 bg-card space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Matched Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {matchingSkills.length > 0 ? (
                      matchingSkills.map((s, idx) => (
                        <Badge key={idx} variant="outline" className="text-[9px] py-0">{s}</Badge>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground">None identified.</span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border/40 bg-card space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" /> Missing Requirements
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {missingSkills.length > 0 ? (
                      missingSkills.map((s, idx) => (
                        <Badge key={idx} variant="outline" className="text-[9px] py-0 text-red-500 border-red-500/20 bg-red-500/5">{s}</Badge>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground">None identified.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="p-4 rounded-2xl bg-purple-600/5 border border-purple-500/10 space-y-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-purple-600" />
                  <h4 className="text-xs font-bold text-purple-600 uppercase tracking-wider">Hiring Recommendations</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {recommendation}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[350px] rounded-3xl border border-dashed border-border/70 bg-card/20 flex flex-col items-center justify-center text-center p-6">
              <Activity className="h-10 w-10 text-muted-foreground/60 mb-2.5" />
              <h3 className="font-display font-semibold text-base text-muted-foreground">Match Summary Ready</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Upload your candidate profile and paste the role description to compute semantic alignment.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
