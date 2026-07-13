import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { getBookmarks, removeBookmark, getCompaniesList, listOpenJobs } from "@/lib/api";
import { Star, Building2, Briefcase, Trash2, ArrowUpRight, FolderHeart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({
    meta: [{ title: "My Favorites & Bookmarks — CareerSuccess" }],
  }),
  component: () => <FavoritesPage />,
});

function FavoritesPage() {
  const queryClient = useQueryClient();

  const bookmarksQuery = useQuery({
    queryKey: ["bookmarks-list"],
    queryFn: getBookmarks
  });

  const companiesQuery = useQuery({
    queryKey: ["companies-list"],
    queryFn: getCompaniesList
  });

  const jobsQuery = useQuery({
    queryKey: ["jobs-list"],
    queryFn: listOpenJobs
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => removeBookmark(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks-list"] });
      toast.success("Bookmark removed from favorites.");
    }
  });

  const bookmarks = bookmarksQuery.data || [];
  const companies = companiesQuery.data || [];
  const jobs = jobsQuery.data || [];

  const favoriteCompanies = bookmarks
    .filter(b => b.item_type === "company")
    .map(b => {
      const comp = companies.find(c => String(c.id) === b.item_id);
      return comp ? { bookmarkId: b.id, ...comp } : null;
    })
    .filter(Boolean);

  const favoriteJobs = bookmarks
    .filter(b => b.item_type === "job")
    .map(b => {
      const job = jobs.find(j => String(j.id) === b.item_id);
      return job ? { bookmarkId: b.id, ...job } : null;
    })
    .filter(Boolean);

  return (
    <AppShell
      title="My Favorites"
      subtitle="Access your bookmarked jobs, companies, and resource items in one dashboard."
    >
      <div className="space-y-8">
        
        {/* Favorite Companies Section */}
        <div>
          <h3 className="font-display font-bold text-foreground text-base mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Bookmarked Companies
          </h3>
          {favoriteCompanies.length === 0 ? (
            <p className="text-xs text-muted-foreground bg-muted/5 border border-dashed border-border/50 rounded-xl p-4">No companies bookmarked yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteCompanies.map((c: any) => (
                <div key={c.id} className="bg-card border border-border/60 rounded-2xl p-5 shadow-soft hover-lift flex flex-col justify-between group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-display font-bold text-foreground text-sm">{c.name}</h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-primary">{c.industry}</span>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => removeMutation.mutate(c.bookmarkId)}
                      className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{c.overview}</p>
                  <Link to="/companies" className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline self-end">
                    View Guide <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Favorite Jobs Section */}
        <div>
          <h3 className="font-display font-bold text-foreground text-base mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" /> Bookmarked Jobs
          </h3>
          {favoriteJobs.length === 0 ? (
            <p className="text-xs text-muted-foreground bg-muted/5 border border-dashed border-border/50 rounded-xl p-4">No jobs bookmarked yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteJobs.map((j: any) => (
                <div key={j.id} className="bg-card border border-border/60 rounded-2xl p-5 shadow-soft hover-lift flex flex-col justify-between group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-display font-bold text-foreground text-sm">{j.title}</h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{j.company || "Company"}</span>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => removeMutation.mutate(j.bookmarkId)}
                      className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{j.description}</p>
                  <Link to="/jobs" className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline self-end">
                    View Job <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
