import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Save, Download, Plus, Trash2, LayoutTemplate, Briefcase, GraduationCap, Code2, FolderGit, Award, ShieldCheck, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/resume-builder")({
  head: () => ({
    meta: [{ title: "Interactive Resume Builder — CareerSuccess" }],
  }),
  component: ResumeBuilderPage,
});

interface ExperienceItem {
  company: string;
  role: string;
  duration: string;
  bullets: string;
}

interface EducationItem {
  school: string;
  degree: string;
  year: string;
}

interface ProjectItem {
  name: string;
  description: string;
  link: string;
}

function ResumeBuilderPage() {
  const [selectedTemplate, setSelectedTemplate] = useState("Minimalist");
  
  // Personal Info
  const [name, setName] = useState("Alex Carter");
  const [email, setEmail] = useState("alex.carter@example.com");
  const [phone, setPhone] = useState("+1 (555) 019-2834");
  const [location, setLocation] = useState("San Francisco, CA");
  
  // Skills
  const [skills, setSkills] = useState("React, TypeScript, Next.js, Node.js, GraphQL, TailwindCSS");
  
  // Experience List
  const [experiences, setExperiences] = useState<ExperienceItem[]>([
    {
      company: "Stripe",
      role: "Frontend Engineer",
      duration: "2024 - Present",
      bullets: "Led optimization of client-facing dashboards.\nImplemented state management structures saving 1.2s on initial loads.",
    },
  ]);

  // Education List
  const [education, setEducation] = useState<EducationItem[]>([
    {
      school: "Stanford University",
      degree: "B.S. Computer Science",
      year: "2020 - 2024",
    },
  ]);

  // Projects List
  const [projects, setProjects] = useState<ProjectItem[]>([
    {
      name: "AI Talent Portal Mock Engine",
      description: "Built simulated pipeline tracking UI reducing dashboard load by 40%.",
      link: "github.com/alex/talent-mock",
    },
  ]);

  // Certifications list (comma separated)
  const [certifications, setCertifications] = useState("AWS Certified Solutions Architect, Certified Kubernetes Administrator");

  // Achievements list (comma separated)
  const [achievements, setAchievements] = useState("Winner of Global FinTech Hackathon 2025, Tech Lead speaker at JSConf 2024");

  const handleSave = () => {
    toast.success("Resume changes saved successfully!");
  };

  const addExperience = () => {
    setExperiences([...experiences, { company: "", role: "", duration: "", bullets: "" }]);
  };

  const removeExperience = (idx: number) => {
    setExperiences(experiences.filter((_, i) => i !== idx));
  };

  const addEducation = () => {
    setEducation([...education, { school: "", degree: "", year: "" }]);
  };

  const removeEducation = (idx: number) => {
    setEducation(education.filter((_, i) => i !== idx));
  };

  const addProject = () => {
    setProjects([...projects, { name: "", description: "", link: "" }]);
  };

  const removeProject = (idx: number) => {
    setProjects(projects.filter((_, i) => i !== idx));
  };

  return (
    <AppShell
      title="Resume Builder"
      subtitle="Edit your resume structure and download clean, machine-readable PDFs."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg text-xs h-9 gap-1" onClick={handleSave}>
            <Save className="h-3.5 w-3.5" /> Save Changes
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg text-xs h-9 gap-1" onClick={() => toast.success("PDF compiling started...")}>
            <Download className="h-3.5 w-3.5" /> Download PDF
          </Button>
        </div>
      }
    >
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Side: Editor Form */}
        <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-soft space-y-6 max-h-[80vh] overflow-y-auto scrollbar-thin">
          <h3 className="font-display font-semibold text-base">Resume Sections</h3>

          {/* Template Selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <LayoutTemplate className="h-4 w-4 text-blue-500" /> Choose Template
            </span>
            <div className="flex gap-2.5">
              {["Minimalist", "Modern Tech", "Executive"].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTemplate(t)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all ${
                    selectedTemplate === t 
                      ? "bg-blue-600/10 border-blue-600 text-blue-600" 
                      : "border-border/60 hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <h4 className="font-display font-semibold text-sm">Personal Information</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-border/60 bg-background px-3 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-border/60 bg-background px-3 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-border/60 bg-background px-3 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-border/60 bg-background px-3 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Experience Section */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-semibold text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-purple-600" /> Professional Experience
              </h4>
              <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-lg gap-1" onClick={addExperience}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>

            {experiences.map((exp, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border/40 bg-muted/10 space-y-3 relative group">
                <button
                  onClick={() => removeExperience(idx)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => {
                        const nextExps = [...experiences];
                        nextExps[idx].company = e.target.value;
                        setExperiences(nextExps);
                      }}
                      className="w-full h-8 text-[11px] rounded-lg border border-border/60 bg-background px-2.5 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Role</label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => {
                        const nextExps = [...experiences];
                        nextExps[idx].role = e.target.value;
                        setExperiences(nextExps);
                      }}
                      className="w-full h-8 text-[11px] rounded-lg border border-border/60 bg-background px-2.5 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Duration</label>
                    <input
                      type="text"
                      value={exp.duration}
                      onChange={(e) => {
                        const nextExps = [...experiences];
                        nextExps[idx].duration = e.target.value;
                        setExperiences(nextExps);
                      }}
                      className="w-full h-8 text-[11px] rounded-lg border border-border/60 bg-background px-2.5 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Achievements (one per line)</label>
                  <textarea
                    value={exp.bullets}
                    onChange={(e) => {
                      const nextExps = [...experiences];
                      nextExps[idx].bullets = e.target.value;
                      setExperiences(nextExps);
                    }}
                    rows={3}
                    className="w-full text-[11px] rounded-lg border border-border/60 bg-background p-2.5 focus:border-blue-600 focus:outline-none resize-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Education Section */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-semibold text-sm flex items-center gap-2">
                <GraduationCap className="h-4.5 w-4.5 text-blue-600" /> Education
              </h4>
              <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-lg gap-1" onClick={addEducation}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>

            {education.map((edu, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border/40 bg-muted/10 grid gap-3 sm:grid-cols-3 relative group">
                <button
                  onClick={() => removeEducation(idx)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Institution</label>
                  <input
                    type="text"
                    value={edu.school}
                    onChange={(e) => {
                      const nextEdus = [...education];
                      nextEdus[idx].school = e.target.value;
                      setEducation(nextEdus);
                    }}
                    className="w-full h-8 text-[11px] rounded-lg border border-border/60 bg-background px-2.5 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Degree</label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const nextEdus = [...education];
                      nextEdus[idx].degree = e.target.value;
                      setEducation(nextEdus);
                    }}
                    className="w-full h-8 text-[11px] rounded-lg border border-border/60 bg-background px-2.5 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Year</label>
                  <input
                    type="text"
                    value={edu.year}
                    onChange={(e) => {
                      const nextEdus = [...education];
                      nextEdus[idx].year = e.target.value;
                      setEducation(nextEdus);
                    }}
                    className="w-full h-8 text-[11px] rounded-lg border border-border/60 bg-background px-2.5 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Projects Section */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-semibold text-sm flex items-center gap-2">
                <FolderGit className="h-4.5 w-4.5 text-blue-500" /> Projects
              </h4>
              <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-lg gap-1" onClick={addProject}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>

            {projects.map((proj, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-border/40 bg-muted/10 space-y-3 relative group">
                <button
                  onClick={() => removeProject(idx)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Project Name</label>
                    <input
                      type="text"
                      value={proj.name}
                      onChange={(e) => {
                        const nextProjs = [...projects];
                        nextProjs[idx].name = e.target.value;
                        setProjects(nextProjs);
                      }}
                      className="w-full h-8 text-[11px] rounded-lg border border-border/60 bg-background px-2.5 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Link / Repository</label>
                    <input
                      type="text"
                      value={proj.link}
                      onChange={(e) => {
                        const nextProjs = [...projects];
                        nextProjs[idx].link = e.target.value;
                        setProjects(nextProjs);
                      }}
                      className="w-full h-8 text-[11px] rounded-lg border border-border/60 bg-background px-2.5 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Project Description</label>
                  <input
                    type="text"
                    value={proj.description}
                    onChange={(e) => {
                      const nextProjs = [...projects];
                      nextProjs[idx].description = e.target.value;
                      setProjects(nextProjs);
                    }}
                    className="w-full h-8 text-[11px] rounded-lg border border-border/60 bg-background px-2.5 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Certifications Section */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <h4 className="font-display font-semibold text-sm flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-yellow-500" /> Certifications
            </h4>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Certifications (comma separated)</label>
              <textarea
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
                rows={2}
                className="w-full text-xs rounded-xl border border-border/60 bg-background p-3 focus:border-blue-600 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Achievements Section */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <h4 className="font-display font-semibold text-sm flex items-center gap-2">
              <Trophy className="h-4.5 w-4.5 text-orange-500" /> Achievements
            </h4>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Achievements (comma separated)</label>
              <textarea
                value={achievements}
                onChange={(e) => setAchievements(e.target.value)}
                rows={2}
                className="w-full text-xs rounded-xl border border-border/60 bg-background p-3 focus:border-blue-600 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-4 pt-4 border-t border-border/40">
            <h4 className="font-display font-semibold text-sm flex items-center gap-2">
              <Code2 className="h-4.5 w-4.5 text-green-500" /> Core Skills
            </h4>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Skills (comma separated)</label>
              <textarea
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                rows={2}
                className="w-full text-xs rounded-xl border border-border/60 bg-background p-3 focus:border-blue-600 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Resume Live Preview */}
        <div className="rounded-3xl border border-border/60 bg-white dark:bg-slate-900 p-8 shadow-2xl overflow-y-auto max-h-[80vh] font-sans text-slate-800 dark:text-slate-200">
          <div className="text-center space-y-2 border-b border-slate-200 dark:border-slate-800 pb-5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{name || "Your Name"}</h2>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
              <span>{email || "name@example.com"}</span>
              <span>•</span>
              <span>{phone || "+1 (000) 000-0000"}</span>
              <span>•</span>
              <span>{location || "Location"}</span>
            </div>
          </div>

          {/* Skills preview */}
          {skills && (
            <div className="py-4 border-b border-slate-200 dark:border-slate-800 space-y-1.5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Technical Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.split(",").map((s, idx) => (
                  <span key={idx} className="bg-slate-100 dark:bg-slate-800 rounded px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience preview */}
          <div className="py-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Experience</h3>
            {experiences.map((exp, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>{exp.role || "Role"} at <span className="text-slate-950 dark:text-white font-bold">{exp.company || "Company"}</span></span>
                  <span className="text-[10px] font-normal text-slate-500">{exp.duration || "Duration"}</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {exp.bullets.split("\n").filter(Boolean).map((bullet, bidx) => (
                    <li key={bidx}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Projects preview */}
          {projects.length > 0 && (
            <div className="py-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Projects</h3>
              {projects.map((proj, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-950 dark:text-white">{proj.name || "Project Name"}</span>
                    {proj.link && <span className="text-[10px] font-normal text-blue-600 dark:text-blue-400">{proj.link}</span>}
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">{proj.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Education preview */}
          <div className="py-4 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Education</h3>
            {education.map((edu, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-950 dark:text-white">{edu.school || "School"}</p>
                  <p className="text-[10px] text-slate-500">{edu.degree || "Degree"}</p>
                </div>
                <span className="text-[10px] text-slate-500">{edu.year || "Year"}</span>
              </div>
            ))}
          </div>

          {/* Certifications preview */}
          {certifications && (
            <div className="py-4 border-b border-slate-200 dark:border-slate-800 space-y-1.5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Certifications</h3>
              <ul className="list-disc pl-5 space-y-0.5 text-[10px] text-slate-600 dark:text-slate-400">
                {certifications.split(",").map((c, idx) => (
                  <li key={idx}>{c.trim()}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Achievements preview */}
          {achievements && (
            <div className="py-4 space-y-1.5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Achievements</h3>
              <ul className="list-disc pl-5 space-y-0.5 text-[10px] text-slate-600 dark:text-slate-400">
                {achievements.split(",").map((a, idx) => (
                  <li key={idx}>{a.trim()}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
