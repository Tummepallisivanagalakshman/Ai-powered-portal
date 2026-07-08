import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Plus, ChevronRight, ChevronLeft, Calendar, Building, MessageSquare, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/job-tracker")({
  head: () => ({
    meta: [{ title: "Job Tracker Kanban — CareerSuccess" }],
  }),
  component: JobTrackerPage,
});

interface JobCard {
  id: number;
  company: string;
  position: string;
  date: string;
  status: "Interested" | "Applied" | "Interview" | "Offer" | "Rejected";
  notes: string;
}

const INITIAL_JOBS: JobCard[] = [
  { id: 1, company: "Google", position: "UX Researcher", date: "2026-07-01", status: "Interested", notes: "Focuses on conversational design requirements." },
  { id: 2, company: "Stripe", position: "Frontend Engineer", date: "2026-07-04", status: "Applied", notes: "Applied with resume version v2.1." },
  { id: 3, company: "Figma", position: "Software Architect", date: "2026-06-28", status: "Interview", notes: "Round 1 technical discussion on React Fiber architectures." },
  { id: 4, company: "Netflix", position: "Senior Core UI", date: "2026-07-06", status: "Offer", notes: "Equity package details pending review." },
];

const COLUMNS: JobCard["status"][] = ["Interested", "Applied", "Interview", "Offer", "Rejected"];

function JobTrackerPage() {
  const [jobs, setJobs] = useState<JobCard[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("career_tracker_jobs");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return INITIAL_JOBS;
        }
      }
    }
    return INITIAL_JOBS;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("career_tracker_jobs", JSON.stringify(jobs));
    }
  }, [jobs]);

  const [showAddForm, setShowAddForm] = useState(false);
  
  // Add Job Form fields
  const [newCompany, setNewCompany] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const moveCard = (id: number, direction: "left" | "right") => {
    setJobs(
      jobs.map((job) => {
        if (job.id === id) {
          const currentIdx = COLUMNS.indexOf(job.status);
          let nextIdx = currentIdx;
          if (direction === "right" && currentIdx < COLUMNS.length - 1) {
            nextIdx++;
          } else if (direction === "left" && currentIdx > 0) {
            nextIdx--;
          }
          const nextStatus = COLUMNS[nextIdx];
          if (nextStatus !== job.status) {
            toast.success(`Moved ${job.position} @ ${job.company} to ${nextStatus}!`);
          }
          return { ...job, status: nextStatus };
        }
        return job;
      })
    );
  };

  const addJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newPosition.trim()) {
      toast.error("Please fill in Company Name and Position.");
      return;
    }
    const newJob: JobCard = {
      id: Date.now(),
      company: newCompany,
      position: newPosition,
      date: new Date().toISOString().split("T")[0],
      status: "Interested",
      notes: newNotes,
    };
    setJobs([...jobs, newJob]);
    setNewCompany("");
    setNewPosition("");
    setNewNotes("");
    setShowAddForm(false);
    toast.success(`Job at ${newCompany} added to Interested pipeline!`);
  };

  const removeJob = (id: number) => {
    setJobs(jobs.filter((j) => j.id !== id));
    toast.success("Job card removed.");
  };

  return (
    <AppShell
      title="Job Application Tracker"
      subtitle="Organize your professional applications in a visual Kanban board."
      actions={
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-xs h-9">
          <Plus className="mr-1.5 h-4 w-4" /> Add Application
        </Button>
      }
    >
      {/* 1. ADD APPLICATION DIALOG FORM */}
      {showAddForm && (
        <form onSubmit={addJob} className="mb-8 p-5 rounded-2xl border border-border bg-card shadow-soft grid gap-4 sm:grid-cols-3 items-end animate-fade-in">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Company Name</label>
            <input
              type="text"
              required
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              placeholder="e.g. Stripe"
              className="w-full h-10 text-xs rounded-xl border border-border/60 bg-background px-3 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Position</label>
            <input
              type="text"
              required
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              placeholder="e.g. Frontend Dev"
              className="w-full h-10 text-xs rounded-xl border border-border/60 bg-background px-3 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Notes (Optional)</label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g. Applied via site"
              className="w-full h-10 text-xs rounded-xl border border-border/60 bg-background px-3 focus:outline-none focus:border-blue-600"
            />
          </div>
          <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" className="text-xs h-9" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 text-white font-semibold text-xs h-9">
              Add Job
            </Button>
          </div>
        </form>
      )}

      {/* 2. KANBAN COLUMNS SCROLL WRAPPER */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col);
          const isInterested = col === "Interested";
          const isApplied = col === "Applied";
          const isInterview = col === "Interview";
          const isOffer = col === "Offer";

          return (
            <div
              key={col}
              className="flex-1 min-w-[280px] rounded-3xl border border-border/60 bg-muted/10 p-4 space-y-4"
            >
              {/* Column Header */}
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    isInterested 
                      ? "bg-blue-500" 
                      : isApplied 
                      ? "bg-purple-500" 
                      : isInterview 
                      ? "bg-yellow-500" 
                      : isOffer 
                      ? "bg-green-500" 
                      : "bg-red-500"
                  }`} />
                  <span className="font-display font-bold text-xs uppercase tracking-wider">{col}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] py-0 px-2 rounded-full">{colJobs.length}</Badge>
              </div>

              {/* Column Cards Flow */}
              <div className="space-y-3 min-h-[300px] overflow-y-auto max-h-[60vh] scrollbar-thin">
                {colJobs.length === 0 ? (
                  <div className="border border-dashed border-border/40 rounded-2xl h-28 flex items-center justify-center text-center p-4">
                    <p className="text-[10px] text-muted-foreground">Empty column</p>
                  </div>
                ) : (
                  colJobs.map((job) => (
                    <div
                      key={job.id}
                      className="group rounded-2xl border border-border bg-card p-4 shadow-sm space-y-3 relative hover:border-blue-500/30 transition-all hover:shadow-soft"
                    >
                      {/* Delete icon on card hover */}
                      <button
                        onClick={() => removeJob(job.id)}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Card"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <div className="space-y-1 pr-6">
                        <p className="text-xs font-bold leading-tight truncate">{job.position}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Building className="h-3 w-3" /> {job.company}
                        </p>
                      </div>

                      {job.notes && (
                        <p className="text-[10px] text-muted-foreground leading-normal border-t border-border/40 pt-2 flex items-start gap-1">
                          <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{job.notes}</span>
                        </p>
                      )}

                      <div className="flex justify-between items-center border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" /> {job.date}</span>
                        
                        {/* Control buttons */}
                        <div className="flex gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                          {col !== "Interested" && (
                            <button
                              onClick={() => moveCard(job.id, "left")}
                              className="h-5 w-5 rounded bg-muted hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                              title="Move Left"
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </button>
                          )}
                          {col !== "Rejected" && (
                            <button
                              onClick={() => moveCard(job.id, "right")}
                              className="h-5 w-5 rounded bg-muted hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                              title="Move Right"
                            >
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
