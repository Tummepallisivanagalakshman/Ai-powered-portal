import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Sparkles, Copy, Download, RefreshCw, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { generateCoverLetter } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/cover-letter")({
  head: () => ({
    meta: [{ title: "AI Cover Letter Generator — CareerSuccess" }],
  }),
  component: CoverLetterPage,
});

function CoverLetterPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("Professional");
  
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const generateLetter = async () => {
    if (!jobTitle.trim() || !company.trim()) {
      toast.error("Please enter both Job Title and Company Name.");
      return;
    }
    setGenerating(true);
    setProgress(20);
    
    try {
      const response = await generateCoverLetter({
        data: {
          jobTitle,
          company,
          jobDescription,
          tone,
        },
      });
      setProgress(100);
      setResult(response.letter);
      setGenerating(false);
      toast.success("AI Cover Letter generated successfully!");
    } catch (err: any) {
      setGenerating(false);
      toast.error(err.message || "Failed to generate cover letter.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Cover letter copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppShell
      title="Cover Letter Generator"
      subtitle="Draft personalized, target-aligned cover letters powered by AI copywriting."
    >
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Input Fields */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display font-semibold text-base">Configuration</h3>

            <div className="space-y-3">
              {/* Job Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Job Title</label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="h-10 rounded-xl focus-visible:ring-blue-600"
                />
              </div>

              {/* Company */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Company Name</label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Stripe"
                  className="h-10 rounded-xl focus-visible:ring-blue-600"
                />
              </div>

              {/* Tone */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Tone of Voice</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-border/60 bg-background px-3 focus:border-blue-600 focus:outline-none"
                >
                  <option value="Professional">Professional & Confident</option>
                  <option value="Conversational">Conversational & Friendly</option>
                  <option value="Enthusiastic">Enthusiastic & Passionate</option>
                  <option value="Creative">Creative & Dynamic</option>
                </select>
              </div>

              {/* JD */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Target Requirements (Optional)</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste specific job description requirements to align keywords..."
                  rows={4}
                  className="w-full text-xs rounded-xl border border-border/60 bg-background p-3 focus:border-blue-600 focus:outline-none resize-none"
                />
              </div>

              <Button
                onClick={generateLetter}
                disabled={generating}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 mt-2"
              >
                {generating ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <Sparkles className="h-4.5 w-4.5" />}
                Generate Letter
              </Button>

              {generating && (
                <div className="space-y-1.5 pt-1 animate-fade-in">
                  <Progress value={progress} className="h-1 bg-muted" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Output Text */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4 animate-fade-up">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <h3 className="font-display font-semibold text-base flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-blue-600" /> Output Document
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg text-xs h-9 gap-1" onClick={copyToClipboard}>
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-lg text-xs h-9 gap-1" onClick={() => toast.success("Cover letter downloaded.")}>
                    <Download className="h-3.5 w-3.5" /> Download
                  </Button>
                </div>
              </div>

              <textarea
                value={result}
                onChange={(e) => setResult(e.target.value)}
                rows={16}
                className="w-full text-xs font-mono rounded-2xl border border-transparent bg-transparent p-1 focus:border-border/40 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          ) : (
            <div className="h-[430px] rounded-3xl border border-dashed border-border/70 bg-card/20 flex flex-col items-center justify-center text-center p-6">
              <FileText className="h-10 w-10 text-muted-foreground/60 mb-2.5" />
              <h3 className="font-display font-semibold text-base text-muted-foreground">No Document Drafted</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Configure job parameters and click "Generate Letter" to draft a tailored letter matching the role criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Input({ value, onChange, placeholder, className }: { value: string; onChange: (e: any) => void; placeholder: string; className?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full h-10 text-xs rounded-xl border border-border/60 bg-background px-3 focus:outline-none ${className}`}
    />
  );
}
