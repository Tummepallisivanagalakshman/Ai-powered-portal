import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Download, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { RoleGate } from "@/components/RoleGate";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import {
  getResumeUrl,
  listShortlistedApplications,
  updateManagerDecision,
  type ApplicationWithDetails,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/manager")({
  head: () => ({
    meta: [
      { title: "Hiring Manager Dashboard — TalentScreen" },
      {
        name: "description",
        content:
          "Review shortlisted candidates, read AI candidate summaries, and approve or reject with notes.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Hiring Manager Dashboard — TalentScreen" },
      {
        property: "og:description",
        content: "Review shortlisted candidates and AI summaries in TalentScreen.",
      },
    ],
  }),
  component: () => (
    <RoleGate role="hiring_manager">
      <ManagerDashboard />
    </RoleGate>
  ),
});

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ManagerDashboard() {
  const qc = useQueryClient();
  const [review, setReview] = useState<ApplicationWithDetails | null>(null);

  const query = useQuery({
    queryKey: ["shortlisted-applications"],
    queryFn: listShortlistedApplications,
  });

  const apps = query.data ?? [];
  const awaiting = apps.filter((a) => a.status === "shortlisted");
  const approved = apps.filter((a) => a.status === "approved");
  const decided = apps.filter((a) => a.status !== "shortlisted");

  return (
    <AppShell
      title="Hiring decisions"
      subtitle="Review shortlisted candidates and approve your next hires."
    >
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Awaiting decision" value={awaiting.length} />
        <StatCard label="Approved" value={approved.length} />
        <StatCard label="Reviewed" value={decided.length} />
      </div>

      <Tabs defaultValue="awaiting">
        <TabsList>
          <TabsTrigger value="awaiting">Awaiting decision ({awaiting.length})</TabsTrigger>
          <TabsTrigger value="decided">Reviewed</TabsTrigger>
        </TabsList>

        <TabsContent value="awaiting" className="mt-6">
          <List
            loading={query.isLoading}
            apps={awaiting}
            onOpen={setReview}
            emptyText="No shortlisted candidates awaiting your decision."
          />
        </TabsContent>
        <TabsContent value="decided" className="mt-6">
          <List
            loading={query.isLoading}
            apps={decided}
            onOpen={setReview}
            emptyText="You haven't reviewed any candidates yet."
          />
        </TabsContent>
      </Tabs>

      <ReviewDialog
        app={review}
        onClose={() => setReview(null)}
        onChanged={() => qc.invalidateQueries({ queryKey: ["shortlisted-applications"] })}
      />
    </AppShell>
  );
}

function List({
  loading,
  apps,
  onOpen,
  emptyText,
}: {
  loading: boolean;
  apps: ApplicationWithDetails[];
  onOpen: (a: ApplicationWithDetails) => void;
  emptyText: string;
}) {
  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  if (apps.length === 0)
    return (
      <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
        {emptyText}
      </div>
    );
  return (
    <div className="space-y-3">
      {apps.map((a) => (
        <button
          key={a.id}
          onClick={() => onOpen(a)}
          className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
        >
          <div>
            <p className="font-medium">{a.candidate?.full_name ?? "Candidate"}</p>
            <p className="text-sm text-muted-foreground">{a.jobs?.title ?? "Role"}</p>
          </div>
          <div className="flex items-center gap-2">
            {typeof a.ai_score === "number" && (
              <Badge variant="outline" className="gap-1">
                <Brain className="h-3 w-3 text-primary" /> {a.ai_score}
              </Badge>
            )}
            <StatusBadge status={a.status} />
          </div>
        </button>
      ))}
    </div>
  );
}

function ReviewDialog({
  app,
  onClose,
  onChanged,
}: {
  app: ApplicationWithDetails | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setNotes(app?.manager_notes ?? "");
  }, [app]);

  const decide = useMutation({
    mutationFn: (status: "approved" | "rejected") => updateManagerDecision(app!.id, status, notes),
    onSuccess: (_d, status) => {
      toast.success(status === "approved" ? "Candidate approved" : "Candidate rejected");
      onChanged();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function downloadResume() {
    if (!app?.resume_path) return;
    const url = await getResumeUrl(app.resume_path);
    if (url) window.open(url, "_blank");
    else toast.error("Could not open resume.");
  }

  const decided = app && app.status !== "shortlisted";

  return (
    <Dialog open={!!app} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        {app && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {app.candidate?.full_name ?? "Candidate"}
                <StatusBadge status={app.status} />
              </DialogTitle>
              <DialogDescription>
                {app.jobs?.title} · {app.candidate?.email}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {app.resume_path && (
                <Button size="sm" variant="outline" onClick={downloadResume}>
                  <Download className="mr-1.5 h-4 w-4" /> View resume
                </Button>
              )}

              {app.ai_summary ? (
                <div className="rounded-xl border border-border bg-accent/40 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-1.5 font-semibold">
                      <Brain className="h-4 w-4 text-primary" /> AI candidate summary
                    </h4>
                    {typeof app.ai_score === "number" && (
                      <Badge className="text-sm">{app.ai_score}/100</Badge>
                    )}
                  </div>
                  {app.ai_recommendation && (
                    <p className="mt-1 text-sm font-medium text-primary">{app.ai_recommendation}</p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">{app.ai_summary}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg bg-card p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Key strengths
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{app.ai_strengths || "—"}</p>
                    </div>
                    <div className="rounded-lg bg-card p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Relevant experience
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{app.ai_experience || "—"}</p>
                    </div>
                  </div>
                  {app.ai_concerns && (
                    <div className="mt-3 rounded-lg bg-card p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Concerns
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{app.ai_concerns}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No AI resume summary is available for this candidate yet.
                </div>
              )}

              <div>
                <h4 className="mb-2 text-sm font-semibold">Resume / experience</h4>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {app.resume_text || "No text provided."}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Your notes</Label>
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add decision notes…"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => decide.mutate("rejected")}
                disabled={decide.isPending}
              >
                <ThumbsDown className="mr-1.5 h-4 w-4" />
                {decided ? "Reject" : "Reject"}
              </Button>
              <Button onClick={() => decide.mutate("approved")} disabled={decide.isPending}>
                {decide.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <ThumbsUp className="mr-1.5 h-4 w-4" />
                )}
                Approve
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
