import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { 
  getCompaniesList, 
  createCompanyProfile, 
  addBookmark, 
  getBookmarks,
  removeBookmark,
  CompanyProfile 
} from "@/lib/api";
import { 
  Building2, 
  Star, 
  Briefcase, 
  TrendUp, 
  DollarSign, 
  HelpCircle, 
  Search, 
  Plus, 
  Loader2 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/companies")({
  head: () => ({
    meta: [{ title: "Company Resource Hub — CareerSuccess" }],
  }),
  component: () => <CompaniesDirectory />,
});

function CompaniesDirectory() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  
  // Modal/Add Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [overview, setOverview] = useState("");
  const [industry, setIndustry] = useState("");
  const [skills, setSkills] = useState("");
  const [trends, setTrends] = useState("");
  const [salary, setSalary] = useState("");
  const [process, setProcess] = useState("");
  const [questions, setQuestions] = useState("");

  const companiesQuery = useQuery({
    queryKey: ["companies-list"],
    queryFn: getCompaniesList
  });

  const bookmarksQuery = useQuery({
    queryKey: ["bookmarks-list"],
    queryFn: getBookmarks
  });

  const addCompanyMutation = useMutation({
    mutationFn: (company: Partial<CompanyProfile>) => createCompanyProfile(company),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies-list"] });
      toast.success("Company profile added to directory.");
      setShowAddForm(false);
      setName("");
      setOverview("");
      setIndustry("");
      setSkills("");
      setTrends("");
      setSalary("");
      setProcess("");
      setQuestions("");
    },
    onError: (err) => {
      toast.error(`Failed to add company: ${err}`);
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: (companyId: string) => addBookmark("company", companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks-list"] });
      toast.success("Company added to favorites.");
    }
  });

  const removeBookmarkMutation = useMutation({
    mutationFn: (bookmarkId: number) => removeBookmark(bookmarkId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks-list"] });
      toast.success("Removed from favorites.");
    }
  });

  const handleBookmarkToggle = (companyId: number) => {
    const bookmarks = bookmarksQuery.data || [];
    const found = bookmarks.find(b => b.item_type === "company" && b.item_id === String(companyId));
    if (found) {
      removeBookmarkMutation.mutate(found.id);
    } else {
      bookmarkMutation.mutate(String(companyId));
    }
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.strip || !name.trim()) {
      toast.error("Please enter company name");
      return;
    }
    addCompanyMutation.mutate({
      name,
      overview,
      industry,
      required_skills: skills,
      hiring_trends: trends,
      salary_range: salary,
      interview_process: process,
      interview_questions: questions
    });
  };

  const companies = companiesQuery.data || [];
  const bookmarks = bookmarksQuery.data || [];

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.industry.toLowerCase().includes(search.toLowerCase());
    const matchesIndustry = industryFilter === "all" || c.industry.toLowerCase().includes(industryFilter.toLowerCase());
    return matchesSearch && matchesIndustry;
  });

  return (
    <AppShell
      title="Company Guide Hub"
      subtitle="Examine target employers, check skill prerequisites, compensation brackets, and commonly asked interview questions."
    >
      <div className="flex flex-col md:flex-row gap-6 mb-8 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border/60 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground"
            />
          </div>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="bg-card border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-foreground shrink-0"
          >
            <option value="all">All Industries</option>
            <option value="technology">Technology / AI</option>
            <option value="software">Software / Cloud</option>
            <option value="social">Social Media / VR</option>
          </select>
        </div>

        <Button onClick={() => setShowAddForm(!showAddForm)} className="rounded-xl shrink-0 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Add Company Profile
        </Button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddCompany} className="bg-card border border-border/60 rounded-2xl p-6 shadow-soft mb-8 space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <h3 className="font-display font-bold text-foreground col-span-full">New Company Profile</h3>
          
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Company Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none text-foreground"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Industry</label>
            <input 
              type="text" 
              value={industry} 
              onChange={(e) => setIndustry(e.target.value)} 
              placeholder="e.g. Technology / Fintech"
              className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none text-foreground"
            />
          </div>
          <div className="col-span-full">
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Overview</label>
            <textarea 
              value={overview} 
              onChange={(e) => setOverview(e.target.value)} 
              className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none text-foreground h-16 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Required Skills</label>
            <input 
              type="text" 
              value={skills} 
              onChange={(e) => setSkills(e.target.value)} 
              className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none text-foreground"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Salary Range</label>
            <input 
              type="text" 
              value={salary} 
              onChange={(e) => setSalary(e.target.value)} 
              placeholder="e.g. $100k - $150k"
              className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none text-foreground"
            />
          </div>
          <div className="col-span-full">
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Interview Process</label>
            <textarea 
              value={process} 
              onChange={(e) => setProcess(e.target.value)} 
              className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none text-foreground h-16 resize-none"
            />
          </div>
          <div className="col-span-full">
            <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Interview Questions (Comma separated)</label>
            <textarea 
              value={questions} 
              onChange={(e) => setQuestions(e.target.value)} 
              className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none text-foreground h-16 resize-none"
            />
          </div>
          
          <div className="col-span-full flex gap-3 justify-end mt-2">
            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            <Button type="submit">Save Profile</Button>
          </div>
        </form>
      )}

      {/* Directory Grid */}
      {companiesQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">No companies matching search criteria.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((c) => {
            const isBookmarked = bookmarks.some(b => b.item_type === "company" && b.item_id === String(c.id));
            return (
              <div key={c.id} className="bg-card border border-border/60 rounded-2xl p-5 shadow-soft hover-lift flex flex-col justify-between group relative">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-foreground text-sm leading-tight">{c.name}</h4>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{c.industry}</span>
                      </div>
                    </div>
                    
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleBookmarkToggle(c.id)}
                      className={`h-8 w-8 rounded-full ${isBookmarked ? "text-amber-500" : "text-muted-foreground/60 hover:text-foreground"}`}
                    >
                      <Star className="h-4 w-4 fill-current" />
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{c.overview}</p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-xs text-foreground/80">
                      <Briefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span><strong>Skills:</strong> {c.required_skills}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-foreground/80">
                      <DollarSign className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span><strong>Range:</strong> {c.salary_range}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/30 pt-4 mt-auto">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Common Questions</p>
                  <ul className="space-y-1.5">
                    {c.interview_questions?.split(",").slice(0, 2).map((q, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-xs text-foreground/75 leading-snug">
                        <HelpCircle className="h-3.5 w-3.5 text-primary/70 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{q.trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
