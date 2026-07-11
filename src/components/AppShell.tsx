import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileSearch,
  FileCheck,
  Shuffle,
  Mic,
  Compass,
  FileSignature,
  FileText,
  Bot,
  Kanban,
  BarChart3,
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  Sparkles,
  Shield,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatWidget } from "@/components/ChatWidget";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  label: string;
  to: string;
  icon: any;
}

const candidateNavItems: NavItem[] = [
  { label: "Dashboard", to: "/candidate", icon: LayoutDashboard },
  { label: "Resume Analyzer", to: "/resume-analyzer", icon: FileSearch },
  { label: "ATS Score", to: "/ats-score", icon: FileCheck },
  { label: "Job Match", to: "/job-match", icon: Shuffle },
  { label: "AI Mock Interview", to: "/mock-interview", icon: Mic },
  { label: "Learning Roadmap", to: "/roadmap", icon: Compass },
  { label: "Cover Letter Gen", to: "/cover-letter", icon: FileSignature },
  { label: "Resume Builder", to: "/resume-builder", icon: FileText },
  { label: "Career Chat", to: "/career-chat", icon: Bot },
  { label: "Job Tracker", to: "/job-tracker", icon: Kanban },
  { label: "Reports", to: "/reports", icon: BarChart3 },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings", icon: Settings },
];

const recruiterNavItems: NavItem[] = [
  { label: "Dashboard", to: "/recruiter", icon: LayoutDashboard },
  { label: "Jobs Management", to: "/jobs", icon: FileText },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings", icon: Settings },
];

const managerNavItems: NavItem[] = [
  { label: "Dashboard", to: "/manager", icon: LayoutDashboard },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings", icon: Settings },
];

const adminNavItems: NavItem[] = [
  { label: "Admin Console", to: "/admin", icon: Shield },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings", icon: Settings },
];

function getNavItemsForRole(role: string | null): NavItem[] {
  if (role === "recruiter") return recruiterNavItems;
  if (role === "hiring_manager") return managerNavItems;
  if (role === "admin") return adminNavItems;
  return candidateNavItems;
}

export function AppShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { user, signOut, role, setRole } = useAuth();
  const navigate = useNavigate();
  const state = useRouterState();
  const currentPath = state.location.pathname;

  const navItems = getNavItemsForRole(role);

  const queryClient = useQueryClient();
  const notificationsQuery = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: listNotifications,
    enabled: !!user,
    refetchInterval: 10000,
  });

  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/auth", replace: true });
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as any;
    setRole(newRole);
    // Redirect to the new role home page
    const homes: Record<string, string> = {
      candidate: "/candidate",
      recruiter: "/recruiter",
      hiring_manager: "/manager",
      admin: "/admin",
    };
    navigate({ to: homes[newRole] || "/candidate", replace: true });
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate(id);
  };

  // Determine active item to highlight
  const isActive = (path: string) => {
    if (path === "/candidate" && currentPath === "/candidate") return true;
    if (path !== "/candidate" && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="fixed bottom-0 top-0 left-0 z-40 hidden w-64 border-r border-border/60 bg-card/60 backdrop-blur-xl md:flex flex-col">
        {/* Brand Logo */}
        <div className="flex h-16 items-center gap-2.5 px-6 border-b border-border/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-md">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CareerSuccess
          </span>
        </div>

        {/* Scrollable Nav Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-primary border-l-4 border-blue-600"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${active ? "text-blue-600" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Card / Footer */}
        <div className="p-4 border-t border-border/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 ring-1 ring-border">
              <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-purple-500 text-white text-xs font-semibold">
                {user?.email?.slice(0, 2).toUpperCase() || "US"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
            <LogOut className="h-4.5 w-4.5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-md sm:px-6">
          {/* Left: Mobile Title or Search */}
          <div className="flex items-center gap-3 flex-1 min-w-0 md:max-w-md">
            {/* Mobile Sheet Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 flex flex-col">
                <div className="flex h-16 items-center gap-2.5 px-6 border-b border-border/40">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-md">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="font-display text-lg font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    CareerSuccess
                  </span>
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                          active
                            ? "bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-primary border-l-4 border-blue-600"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        <Icon className={`h-4.5 w-4.5 ${active ? "text-blue-600" : ""}`} />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="p-4 border-t border-border/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-purple-500 text-white text-xs">
                        {user?.email?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {user?.email}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="h-4.5 w-4.5" />
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Global Search Bar (UI Placeholder) */}
            <div className="relative hidden sm:block w-full max-w-sm">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search resources, templates, roadmaps..."
                className="w-full rounded-full border border-border/60 bg-muted/30 py-1.5 pl-9 pr-4 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notification Bell Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 rounded-2xl overflow-hidden">
                <DropdownMenuLabel className="p-4 flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications yet.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        onClick={() => !n.is_read && handleMarkRead(n.id)}
                        className={`p-4 border-b border-border/40 focus:bg-muted/50 flex flex-col items-start gap-1 cursor-pointer ${
                          !n.is_read ? "bg-primary/5 font-medium" : ""
                        }`}
                      >
                        <span className="font-semibold text-xs text-primary">{n.title}</span>
                        <span className="text-xs text-foreground/80">{n.message}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Role Switcher */}
            <select
              id="role-switcher"
              data-testid="role-switcher"
              value={role || "candidate"}
              onChange={handleRoleChange}
              className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="candidate">Candidate</option>
              <option value="recruiter">Recruiter</option>
              <option value="hiring_manager">Hiring Manager</option>
              <option value="admin">Admin</option>
            </select>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-transparent transition-all hover:ring-blue-600">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-purple-500 text-white text-xs">
                      {user?.email?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 px-4 py-8 sm:px-6 sm:py-8 pb-24 md:pb-8">
          {/* Main Title Section */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
          </div>

          {/* Children views */}
          {children}
        </main>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-border/60 bg-background/90 px-4 py-1 backdrop-blur-md md:hidden justify-around items-center">
        <Link
          to="/candidate"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors ${
            isActive("/candidate") ? "text-blue-600" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutDashboard className="h-5 w-5 mb-0.5" />
          <span>Dashboard</span>
        </Link>
        <Link
          to="/resume-analyzer"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors ${
            isActive("/resume-analyzer") ? "text-blue-600" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileSearch className="h-5 w-5 mb-0.5" />
          <span>Analyzer</span>
        </Link>
        <Link
          to="/mock-interview"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors ${
            isActive("/mock-interview") ? "text-blue-600" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mic className="h-5 w-5 mb-0.5" />
          <span>Mock UI</span>
        </Link>
        <Link
          to="/job-tracker"
          className={`flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium transition-colors ${
            isActive("/job-tracker") ? "text-blue-600" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Kanban className="h-5 w-5 mb-0.5" />
          <span>Tracker</span>
        </Link>

        {/* More Menu Sheet for Mobile */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              <Menu className="h-5 w-5 mb-0.5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl p-0 flex flex-col">
            <div className="p-4 border-b border-border/40 text-center font-display font-semibold">
              All Success Portal Tools
            </div>
            <div className="grid grid-cols-3 gap-2 p-6 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl gap-1 text-xs font-medium transition-colors ${
                      active ? "bg-blue-600/10 text-blue-600" : "hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[10px] text-center line-clamp-1">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </nav>

      {/* Floating Chatbot Assistant */}
      <ChatWidget />
    </div>
  );
}
