import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { User, Mail, MapPin, Briefcase, Camera, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{ title: "User Profile — CareerSuccess" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const [name, setName] = useState("Alex Carter");
  const [phone, setPhone] = useState("+1 (555) 019-2834");
  const [location, setLocation] = useState("San Francisco, CA");
  
  // Preferred roles & locations
  const [preferredRole, setPreferredRole] = useState("Frontend Engineer");
  const [preferredLocation, setPreferredLocation] = useState("Remote / Hybrid");
  const [experienceLevel, setExperienceLevel] = useState("Mid-Level");

  const [skills, setSkills] = useState(["React", "TypeScript", "Tailwind CSS", "Next.js"]);
  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) {
      toast.error("Skill already exists.");
      return;
    }
    setSkills([...skills, newSkill.trim()]);
    setNewSkill("");
    toast.success("Skill added.");
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
    toast.success("Skill removed.");
  };

  const handleSaveChanges = () => {
    toast.success("Profile information updated successfully!");
  };

  return (
    <AppShell
      title="User Profile"
      subtitle="Manage your personal information, skills, and target job preferences."
    >
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Side: Avatar & Core preferences */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft text-center space-y-4">
            {/* Avatar block */}
            <div className="relative mx-auto h-24 w-24">
              <Avatar className="h-full w-full ring-2 ring-blue-600/30">
                <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-purple-500 text-white text-2xl font-bold">
                  AC
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => toast.info("Avatar uploading is simulated.")}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow"
                title="Change Photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg">{name}</h3>
              <p className="text-xs text-muted-foreground">{preferredRole}</p>
            </div>

            <hr className="border-border/40" />

            <div className="space-y-3 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Experience Level</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full h-9 text-xs rounded-lg border border-border/60 bg-background px-3 focus:outline-none focus:border-blue-600"
                >
                  <option value="Junior">Junior Level</option>
                  <option value="Mid-Level">Mid-Level (3-5 yrs)</option>
                  <option value="Senior">Senior Level</option>
                  <option value="Lead">Lead / Architect</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Preferred Locations</label>
                <input
                  type="text"
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  className="w-full h-9 text-xs rounded-lg border border-border/60 bg-background px-3 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Detailed Profile Fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-5">
            <h3 className="font-display font-semibold text-base">Personal details</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-border/60 bg-background/50 px-3 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-border/60 bg-background/50 px-3 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Contact Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-border/60 bg-background/50 px-3 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Skills Tags list */}
            <div className="space-y-3 pt-4 border-t border-border/40">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Skills & Competencies</label>
              
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-xl text-xs font-medium text-foreground border border-border/40"
                  >
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="text-muted-foreground hover:text-destructive">
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddSkill} className="flex gap-2 max-w-sm pt-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="e.g. Docker"
                  className="flex-1 h-9 text-xs rounded-lg border border-border/60 bg-background px-3 focus:outline-none focus:border-blue-600"
                />
                <Button type="submit" size="sm" className="h-9 rounded-lg bg-blue-600 text-white">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </form>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/40">
              <Button onClick={handleSaveChanges} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-xs h-10 px-6">
                Save Profile Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
