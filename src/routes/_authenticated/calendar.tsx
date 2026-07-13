import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { 
  getCalendarEvents, 
  createCalendarEvent, 
  deleteCalendarEvent, 
  CalendarEvent 
} from "@/lib/api";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  Video, 
  BookOpen, 
  FileCheck, 
  BellRing,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [{ title: "Interactive Calendar — CareerSuccess" }],
  }),
  component: () => <CalendarDashboard />,
});

function CalendarDashboard() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Form State
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [time, setTime] = useState("");
  const [type, setType] = useState("reminder"); // interview, learning, deadline, reminder

  const eventsQuery = useQuery({
    queryKey: ["calendar-events"],
    queryFn: getCalendarEvents
  });

  const createMutation = useMutation({
    mutationFn: (evt: CalendarEvent) => createCalendarEvent(evt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Event scheduled successfully.");
      setTitle("");
      setDesc("");
      setTime("");
    },
    onError: (err) => {
      toast.error(`Scheduling failed: ${err}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCalendarEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Event deleted from calendar.");
    }
  });

  const events = eventsQuery.data || [];

  // Helper calculation for month calendar
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.strip || !title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!time) {
      toast.error("Please select a date/time");
      return;
    }
    
    // Create UTC dates
    const start = new Date(time);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // default 1 hr duration
    
    createMutation.mutate({
      title,
      description: desc,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      type
    });
  };

  const getEventIcon = (t: string) => {
    switch (t) {
      case "interview": return <Video className="h-4 w-4 text-emerald-500" />;
      case "learning": return <BookOpen className="h-4 w-4 text-blue-500" />;
      case "deadline": return <FileCheck className="h-4 w-4 text-rose-500" />;
      default: return <BellRing className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <AppShell
      title="Calendar Center"
      subtitle="Track your upcoming interviews, learning roadmaps milestones, and deadlines."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-card border border-border/60 rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-lg font-bold text-foreground">
              {monthNames[month]} {year}
            </h3>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Blank days before start */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`blank-${i}`} className="aspect-square bg-muted/5 border border-border/5 rounded-xl opacity-30" />
            ))}

            {/* Calendar days */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const dayEvents = events.filter(e => e.start_time.startsWith(dateStr));
              
              return (
                <div 
                  key={`day-${dayNum}`} 
                  className="aspect-square bg-muted/10 border border-border/10 rounded-xl p-1.5 flex flex-col justify-between hover:bg-muted/20 transition-colors group cursor-pointer"
                >
                  <span className="text-xs font-bold text-foreground/80 self-end">{dayNum}</span>
                  <div className="flex flex-wrap gap-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((e) => (
                      <div 
                        key={e.id}
                        title={e.title} 
                        className={`h-2 w-2 rounded-full ${
                          e.type === "interview" ? "bg-emerald-500" :
                          e.type === "learning" ? "bg-blue-500" :
                          e.type === "deadline" ? "bg-rose-500" : "bg-amber-500"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Schedule & Add Event */}
        <div className="space-y-6">
          
          {/* Add Event Form */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-soft">
            <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Create Event
            </h3>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Google Interview"
                  className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Type</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-card border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none text-foreground"
                >
                  <option value="interview">Video Interview</option>
                  <option value="learning">Learning Goal</option>
                  <option value="deadline">Job Deadline</option>
                  <option value="reminder">Personal Reminder</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Description (Optional)</label>
                <textarea 
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Additional details..."
                  className="w-full bg-muted/20 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-foreground h-16 resize-none"
                />
              </div>

              <Button type="submit" className="w-full rounded-xl">
                Schedule Event
              </Button>
            </form>
          </div>

          {/* Agenda view */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-soft max-h-[300px] overflow-y-auto">
            <h3 className="font-display font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Upcoming Agenda
            </h3>
            
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground">No upcoming schedule.</p>
            ) : (
              <div className="space-y-3">
                {events.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/10 border border-border/5 group hover:bg-muted/25 transition-colors">
                    <div className="flex items-center gap-3">
                      {getEventIcon(e.type)}
                      <div>
                        <p className="text-xs font-bold text-foreground">{e.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(e.start_time).toLocaleDateString()} at {new Date(e.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => deleteMutation.mutate(e.id!)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </AppShell>
  );
}
