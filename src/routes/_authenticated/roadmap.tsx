import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CheckCircle2, Circle, Clock, BookOpen, ChevronRight, Play, ExternalLink, CalendarDays, Loader2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateLearningRoadmap } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({
    meta: [{ title: "AI Learning Roadmap — CareerSuccess" }],
  }),
  component: LearningRoadmapPage,
});

interface Lesson {
  id: number;
  title: string;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  completed: boolean;
  link: string;
  category: string;
}

const INITIAL_LESSONS: Lesson[] = [
  { id: 1, title: "Mastering React 19 Hydration Patterns", duration: "45 mins", difficulty: "Medium", completed: true, link: "https://react.dev", category: "Frontend Core" },
  { id: 2, title: "Advanced TS Utility Types & Brand Assertions", duration: "30 mins", difficulty: "Medium", completed: true, link: "https://typescriptlang.org", category: "Languages" },
  { id: 3, title: "System Design: Microservices API Gateway Patterns", duration: "1.5 hours", difficulty: "Hard", completed: false, link: "https://systemdesign.primer", category: "System Architecture" },
  { id: 4, title: "ATS Copywriting: Formulating Impact Bullets", duration: "20 mins", difficulty: "Easy", completed: false, link: "https://resumeimpact.guide", category: "Job Hunt" },
  { id: 5, title: "STAR Method for Behavioral Interviews", duration: "35 mins", difficulty: "Easy", completed: false, link: "https://starinterview.co", category: "Job Hunt" },
];

function LearningRoadmapPage() {
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [targetRole, setTargetRole] = useState("Senior Frontend Engineer");
  const [currentSkills, setCurrentSkills] = useState("React, Tailwind CSS");
  const [loading, setLoading] = useState(false);

  const toggleComplete = (id: number) => {
    setLessons(
      lessons.map((l) => {
        if (l.id === id) {
          const nextState = !l.completed;
          toast.success(nextState ? `Marked "${l.title}" as completed!` : `Marked "${l.title}" as incomplete.`);
          return { ...l, completed: nextState };
        }
        return l;
      })
    );
  };

  const handleRegenerate = async () => {
    if (!targetRole.trim()) {
      toast.error("Please enter a target role.");
      return;
    }
    setLoading(true);
    try {
      const response = await generateLearningRoadmap({
        data: { targetRole, currentSkills },
      });
      const mappedLessons: Lesson[] = response.lessons.map((l, index) => ({
        id: index + 1,
        title: l.title,
        duration: l.duration,
        difficulty: l.difficulty,
        completed: false,
        link: l.link,
        category: l.category,
      }));
      setLessons(mappedLessons);
      setLoading(false);
      toast.success("AI Curriculum generated successfully!");
    } catch (err: any) {
      setLoading(false);
      toast.error(err.message || "Failed to generate AI curriculum.");
    }
  };

  const completedCount = lessons.filter((l) => l.completed).length;
  const progressPercent = Math.round((completedCount / lessons.length) * 100);

  return (
    <AppShell
      title="Learning Roadmap"
      subtitle="AI-curated roadmap targeting your specific skill gaps."
    >
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left column: Overview stats & goals */}
        <div className="lg:col-span-1 space-y-6">
          {/* Progress Tracker */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display font-semibold text-base">Progress Tracker</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Completed Lessons</span>
                <span className="text-blue-600">{completedCount} / {lessons.length}</span>
              </div>
              <Progress value={progressPercent} className="h-2 bg-muted" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 text-center">
              <div className="p-3.5 rounded-xl border border-border/40 bg-muted/10">
                <p className="text-xs text-muted-foreground">Daily Tasks</p>
                <p className="font-display text-lg font-bold mt-0.5">2 / 3</p>
              </div>
              <div className="p-3.5 rounded-xl border border-border/40 bg-muted/10">
                <p className="text-xs text-muted-foreground">Weekly Goals</p>
                <p className="font-display text-lg font-bold mt-0.5">80% Done</p>
              </div>
            </div>
          </div>
          {/* Roadmap Options */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display font-semibold text-base">Roadmap Parameters</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Target Role</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full h-9 text-xs rounded-xl border border-border/60 bg-background px-3 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Current Skills</label>
                <input
                  type="text"
                  value={currentSkills}
                  onChange={(e) => setCurrentSkills(e.target.value)}
                  className="w-full h-9 text-xs rounded-xl border border-border/60 bg-background px-3 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <Button
                onClick={handleRegenerate}
                disabled={loading}
                className="w-full h-9 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Curating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" /> Re-Curate Syllabus
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Weekly Goals list */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display font-semibold text-base">Weekly Milestones</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-xs">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="line-through text-muted-foreground">Audit Resume layout for ATS</span>
              </li>
              <li className="flex items-center gap-3 text-xs">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="line-through text-muted-foreground">Upload 2 job specifications</span>
              </li>
              <li className="flex items-center gap-3 text-xs">
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Practice 3 mock interview questions</span>
              </li>
              <li className="flex items-center gap-3 text-xs">
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Read microservices gateway module</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right column: Lessons List */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-display font-semibold text-base flex items-center gap-2">
              <CalendarDays className="h-4.5 w-4.5 text-blue-600" />
              Custom Syllabus Timeline
            </h3>

            <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
              {lessons.map((lesson) => {
                const isEasy = lesson.difficulty === "Easy";
                const isMedium = lesson.difficulty === "Medium";
                
                return (
                  <div
                    key={lesson.id}
                    className={`relative pl-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                      lesson.completed 
                        ? "bg-muted/10 border-border/40" 
                        : "bg-card border-border hover:border-blue-500/30"
                    }`}
                  >
                    {/* Timeline node */}
                    <button
                      onClick={() => toggleComplete(lesson.id)}
                      className="absolute left-3.5 top-5 sm:top-1/2 sm:-translate-y-1/2 h-5.5 w-5.5 rounded-full bg-background border border-border flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                    >
                      {lesson.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                          {lesson.category}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[9px] py-0 ${
                            isEasy 
                              ? "bg-green-500/10 text-green-500" 
                              : isMedium 
                              ? "bg-blue-500/10 text-blue-600" 
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {lesson.difficulty}
                        </Badge>
                      </div>
                      <h4 className={`text-xs sm:text-sm font-semibold truncate ${lesson.completed ? "line-through text-muted-foreground" : ""}`}>
                        {lesson.title}
                      </h4>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {lesson.duration}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-[10px] h-8 flex-1 sm:flex-none gap-1"
                      >
                        <a href={lesson.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" /> Resource
                        </a>
                      </Button>
                      <Button
                        onClick={() => toggleComplete(lesson.id)}
                        variant={lesson.completed ? "secondary" : "default"}
                        size="sm"
                        className={`rounded-lg text-[10px] h-8 flex-1 sm:flex-none font-semibold ${
                          !lesson.completed ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : ""
                        }`}
                      >
                        {lesson.completed ? "Completed" : "Start"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
