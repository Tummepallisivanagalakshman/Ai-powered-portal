import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { 
  listLearningRoadmaps, 
  listCoverLetters, 
  listInterviewSessions, 
  submitAIFeedback 
} from "@/lib/api";
import { 
  FileText, 
  ThumbsUp, 
  ThumbsDown, 
  FolderHeart, 
  BookOpen, 
  Award, 
  ChevronRight, 
  Loader2 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/saved-workspace")({
  head: () => ({
    meta: [{ title: "Saved AI Workspace — CareerSuccess" }],
  }),
  component: () => <SavedWorkspace />,
});

function SavedWorkspace() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<"letters" | "roadmaps" | "interviews">("letters");
  const [activeItemContent, setActiveItemContent] = useState<any>(null);
  
  // Feedback popup state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [helpfulRating, setHelpfulRating] = useState<boolean | null>(null);
  const [writtenFeedback, setWrittenFeedback] = useState("");

  const roadmapsQuery = useQuery({ queryKey: ["roadmaps-history"], queryFn: listLearningRoadmaps });
  const lettersQuery = useQuery({ queryKey: ["letters-history"], queryFn: listCoverLetters });
  const interviewsQuery = useQuery({ queryKey: ["interviews-history"], queryFn: listInterviewSessions });

  const feedbackMutation = useMutation({
    mutationFn: (payload: { target_type: string; target_id?: string; helpful: boolean; comment?: string }) =>
      submitAIFeedback(payload),
    onSuccess: () => {
      toast.success("Feedback submitted successfully. Thank you!");
      setShowFeedbackModal(false);
      setWrittenFeedback("");
    }
  });

  const handleFeedbackSubmit = (helpful: boolean) => {
    if (!activeItemContent) return;
    setHelpfulRating(helpful);
    setShowFeedbackModal(true);
  };

  const handleSendFeedback = () => {
    if (!activeItemContent || helpfulRating === null) return;
    
    feedbackMutation.mutate({
      target_type: selectedType === "letters" ? "cover_letter" : selectedType === "roadmaps" ? "roadmap" : "interview",
      target_id: String(activeItemContent.id),
      helpful: helpfulRating,
      comment: writtenFeedback
    });
  };

  const isLoading = roadmapsQuery.isLoading || lettersQuery.isLoading || interviewsQuery.isLoading;

  return (
    <AppShell
      title="AI Workspace"
      subtitle="Reopen previous resume analyses, cover letters, roadmaps, and mock interview reports."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar categories and items */}
        <div className="space-y-6">
          <div className="flex bg-muted/10 p-1 border border-border/40 rounded-xl gap-1">
            <button 
              onClick={() => { setSelectedType("letters"); setActiveItemContent(null); }}
              className={`flex-1 text-center py-2.5 rounded-lg text-xs font-bold transition-all ${selectedType === "letters" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Letters
            </button>
            <button 
              onClick={() => { setSelectedType("roadmaps"); setActiveItemContent(null); }}
              className={`flex-1 text-center py-2.5 rounded-lg text-xs font-bold transition-all ${selectedType === "roadmaps" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Roadmaps
            </button>
            <button 
              onClick={() => { setSelectedType("interviews"); setActiveItemContent(null); }}
              className={`flex-1 text-center py-2.5 rounded-lg text-xs font-bold transition-all ${selectedType === "interviews" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Interviews
            </button>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-soft max-h-[450px] overflow-y-auto">
            <h4 className="font-display font-bold text-foreground text-sm mb-4">Saved Sessions</h4>
            
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {selectedType === "letters" && (lettersQuery.data || []).map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setActiveItemContent(item)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${activeItemContent?.id === item.id ? "bg-primary/5 border-primary/50" : "bg-muted/10 border-border/10 hover:bg-muted/20"}`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">{item.company_name}</p>
                        <p className="text-[10px] text-muted-foreground">{item.job_title}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}

                {selectedType === "roadmaps" && (roadmapsQuery.data || []).map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setActiveItemContent(item)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${activeItemContent?.id === item.id ? "bg-primary/5 border-primary/50" : "bg-muted/10 border-border/10 hover:bg-muted/20"}`}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">{item.target_role}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}

                {selectedType === "interviews" && (interviewsQuery.data || []).map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setActiveItemContent(item)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${activeItemContent?.id === item.id ? "bg-primary/5 border-primary/50" : "bg-muted/10 border-border/10 hover:bg-muted/20"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Award className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">{item.job_role}</p>
                        <p className="text-[10px] text-muted-foreground">Score: {item.total_score || 0}/100</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}

                {((selectedType === "letters" && (!lettersQuery.data || lettersQuery.data.length === 0)) ||
                  (selectedType === "roadmaps" && (!roadmapsQuery.data || roadmapsQuery.data.length === 0)) ||
                  (selectedType === "interviews" && (!interviewsQuery.data || interviewsQuery.data.length === 0))) && (
                  <p className="text-xs text-muted-foreground py-4">No saved items found.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected Workspace Panel Detail */}
        <div className="lg:col-span-2 space-y-6">
          {activeItemContent ? (
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-soft flex flex-col justify-between min-h-[400px]">
              
              <div>
                <div className="flex justify-between items-center border-b border-border/40 pb-4 mb-6">
                  <div>
                    <h3 className="font-display font-bold text-foreground text-lg">
                      {selectedType === "letters" ? activeItemContent.company_name : selectedType === "roadmaps" ? activeItemContent.target_role : activeItemContent.job_role}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Session Reopened — Generated on {new Date(activeItemContent.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* Feedback Action widget */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Helpful?</span>
                    <Button size="icon" variant="ghost" onClick={() => handleFeedbackSubmit(true)} className="h-8 w-8 hover:bg-emerald-500/10 text-emerald-500 rounded-full">
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleFeedbackSubmit(false)} className="h-8 w-8 hover:bg-rose-500/10 text-rose-500 rounded-full">
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/10 border border-border/20 rounded-2xl p-6 max-h-[350px] overflow-y-auto">
                  <pre className="text-xs text-foreground/80 font-sans whitespace-pre-wrap leading-relaxed">
                    {selectedType === "letters" ? activeItemContent.content : selectedType === "roadmaps" ? activeItemContent.roadmap_text || activeItemContent.plan_json : JSON.stringify(activeItemContent, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 border-t border-border/40 pt-4 mt-6">
                <Button variant="outline" onClick={() => {
                  toast.success("Download scheduled successfully.");
                }}>
                  Download Export
                </Button>
              </div>

            </div>
          ) : (
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-soft flex flex-col justify-center items-center min-h-[400px]">
              <FolderHeart className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h4 className="font-display font-bold text-foreground text-sm">Workspace Idle</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs text-center">
                Select any saved cover letter, learning roadmap, or interview session from the list on the left to reopen.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* AI Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-soft space-y-4">
            <h3 className="font-display font-bold text-foreground">Submit AI Feedback</h3>
            <p className="text-xs text-muted-foreground">
              Help us improve our models by sharing your feedback. Anything else you'd like to share?
            </p>
            
            <textarea
              value={writtenFeedback}
              onChange={(e) => setWrittenFeedback(e.target.value)}
              placeholder="Optional comment..."
              className="w-full bg-muted/20 border border-border/50 rounded-xl p-3 text-xs focus:outline-none text-foreground h-20 resize-none"
            />

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowFeedbackModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSendFeedback}>Submit Rating</Button>
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}
