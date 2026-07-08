import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Mic, ArrowRight, CheckCircle2, Clock, MessageSquareCode, Award, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { generateMockQuestions, gradeMockSession } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/mock-interview")({
  head: () => ({
    meta: [{ title: "AI Mock Interview — CareerSuccess" }],
  }),
  component: MockInterviewPage,
});

const DEFAULT_MOCK_QUESTIONS = [
  "Can you describe a complex frontend problem you solved and how you approached it?",
  "How do you manage state optimization in large React applications? What parameters dictate your choices?",
  "Explain the difference between client-side rendering (CSR) and server-side rendering (SSR), and when you would prefer each.",
];

function MockInterviewPage() {
  const [step, setStep] = useState<"setup" | "active" | "results">("setup");
  
  // Setup fields
  const [role, setRole] = useState("Software Engineer");
  const [difficulty, setDifficulty] = useState("Medium");
  const [type, setType] = useState("Technical");

  // Active interview fields
  const [questions, setQuestions] = useState<string[]>(DEFAULT_MOCK_QUESTIONS);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Score metrics
  const [overallScore, setOverallScore] = useState(78);
  const [technicalScore, setTechnicalScore] = useState(80);
  const [communicationScore, setCommunicationScore] = useState(75);
  const [confidenceScore, setConfidenceScore] = useState(77);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Timer tick
  useEffect(() => {
    let interval: any;
    if (isTimerActive) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  const startInterview = async () => {
    setLoading(true);
    try {
      const response = await generateMockQuestions({
        data: { role, difficulty, type },
      });
      setQuestions(response.questions);
      setQuestionIdx(0);
      setAnswers(response.questions.map(() => ""));
      setTimer(0);
      setStep("active");
      setIsTimerActive(true);
      setLoading(false);
      toast.success("AI Mock Interview started! Answer the first question.");
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || "Failed to generate mock questions.");
    }
  };

  const handleNext = () => {
    if (!answers[questionIdx].trim()) {
      toast.error("Please provide some response before proceeding.");
      return;
    }
    if (questionIdx < questions.length - 1) {
      setQuestionIdx((prev) => prev + 1);
      toast.info(`Proceeded to Question ${questionIdx + 2}`);
    } else {
      finishInterview();
    }
  };

  const finishInterview = async () => {
    setIsTimerActive(false);
    setLoading(true);
    try {
      const response = await gradeMockSession({
        data: {
          questions,
          answers,
        },
      });
      setOverallScore(response.overallScore);
      setTechnicalScore(response.technicalScore);
      setCommunicationScore(response.communicationScore);
      setConfidenceScore(response.confidenceScore);
      setSuggestions(response.suggestions);
      setStep("results");
      setLoading(false);
      toast.success("Interview completed! Scoring report generated.");
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || "Failed to score interview responses.");
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <AppShell
      title="AI Mock Interview"
      subtitle="Practice interview sessions customized for your role and receive immediate feedback."
    >
      {/* SETUP SCREEN */}
      {step === "setup" && (
        <div className="mx-auto max-w-xl rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600/10 to-purple-600/10 text-primary">
            <Mic className="h-5 w-5 text-blue-600 animate-pulse" />
          </div>
          
          <div className="space-y-1">
            <h3 className="font-display font-semibold text-lg">Setup Session</h3>
            <p className="text-xs text-muted-foreground">Select parameters to let AI curate target interview prompts.</p>
          </div>

          <div className="space-y-4">
            {/* Target Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Target Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-10 text-xs rounded-xl border border-border/60 bg-background/50 px-3 focus:border-blue-600 focus:outline-none"
              >
                <option value="Software Engineer">Software Engineer</option>
                <option value="Product Manager">Product Manager</option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="UX Designer">UX Designer</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Difficulty */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-border/60 bg-background/50 px-3 focus:border-blue-600 focus:outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Interview Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-border/60 bg-background/50 px-3 focus:border-blue-600 focus:outline-none"
                >
                  <option value="Technical">Technical</option>
                  <option value="Behavioral">Behavioral</option>
                  <option value="System Design">System Design</option>
                </select>
              </div>
            </div>

            <Button
              onClick={startInterview}
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" /> Curating Prompts...
                </>
              ) : (
                <>
                  Start Practice Session <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ACTIVE SCREEN */}
      {step === "active" && (
        <div className="mx-auto max-w-2xl rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-6">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              Question {questionIdx + 1} of {questions.length}
            </Badge>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timer)}</span>
            </div>
          </div>

          {/* AI Question Display */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600/5 to-purple-600/5 border border-blue-500/10 flex items-start gap-4">
            <MessageSquareCode className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">AI Question Card</span>
              <p className="text-sm font-semibold text-foreground leading-relaxed">
                {questions[questionIdx]}
              </p>
            </div>
          </div>

          {/* Textarea answer input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Your Response</label>
            <textarea
              value={answers[questionIdx] || ""}
              onChange={(e) => {
                const nextAnswers = [...answers];
                nextAnswers[questionIdx] = e.target.value;
                setAnswers(nextAnswers);
              }}
              placeholder="Type your response here..."
              rows={8}
              className="w-full rounded-2xl border border-border/60 bg-background p-4 text-xs focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-between gap-4 pt-2">
            <Button
              variant="outline"
              disabled={loading}
              onClick={finishInterview}
              className="rounded-xl border-destructive/20 text-destructive hover:bg-destructive/5 font-semibold text-xs h-10 px-5"
            >
              Finish Early
            </Button>
            <Button
              onClick={handleNext}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-xs h-10 px-6"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : questionIdx < questions.length - 1 ? (
                "Next Question"
              ) : (
                "Submit Interview"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* RESULTS SCREEN */}
      {step === "results" && (
        <div className="space-y-6 max-w-3xl mx-auto animate-fade-up">
          {/* Header overall score */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft grid gap-6 sm:grid-cols-3 items-center">
            <div className="flex flex-col items-center justify-center p-4 relative border-r border-border/40 sm:border-r-0">
              <div className="h-28 w-28 flex items-center justify-center rounded-full bg-gradient-to-tr from-green-500/10 to-emerald-500/10 border-4 border-green-500/30">
                <span className="font-display text-3xl font-bold tracking-tight text-green-500">{overallScore}%</span>
                <span className="text-[9px] text-muted-foreground absolute bottom-4">Overall</span>
              </div>
              <p className="text-xs font-semibold mt-3 text-center">AI Graded Session</p>
            </div>

            <div className="sm:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-500" />
                <h4 className="font-bold text-sm">AI Scorecard Summary</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You successfully completed the AI mock assessment for the target role: {role}. Below is a granular analysis of technical, communication, and confidence indices parsed from your input context.
              </p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="rounded-lg text-xs h-9" onClick={() => setStep("setup")}>
                  Practice Again
                </Button>
              </div>
            </div>
          </div>

          {/* Parameter breakdowns */}
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Technical */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Technical Accuracy</span>
              <p className="font-display text-2xl font-bold text-blue-600">{technicalScore}%</p>
              <Progress value={technicalScore} className="h-1 bg-muted [&>div]:bg-blue-600" />
            </div>

            {/* Communication */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Communication Clarity</span>
              <p className="font-display text-2xl font-bold text-purple-600">{communicationScore}%</p>
              <Progress value={communicationScore} className="h-1 bg-muted [&>div]:bg-purple-600" />
            </div>

            {/* Confidence */}
            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Confidence Level</span>
              <p className="font-display text-2xl font-bold text-green-500">{confidenceScore}%</p>
              <Progress value={confidenceScore} className="h-1 bg-muted [&>div]:bg-green-500" />
            </div>
          </div>

          {/* AI Suggestions Card */}
          {suggestions.length > 0 && (
            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
              <h4 className="font-display font-semibold text-sm flex items-center gap-1.5">
                <Sparkles className="h-4.5 w-4.5 text-purple-600" />
                AI Recommendations & Feedback
              </h4>
              
              <div className="space-y-3">
                {suggestions.map((s, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 space-y-1">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Recommendation #{idx + 1}</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
