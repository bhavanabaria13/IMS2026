import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  User,
  FolderKanban,
  Calendar,
  Menu,
  X,
  Clock,
  BookOpen,
  FileQuestion,
  Award,
  FileText,
  Users,
  Rocket,
  Loader2,
  Zap,
  Share2,LifeBuoy,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import InternTasksModule from "./InternTasksModule";
import InternProjectsModule from "./InternProjectsModule";
import InternProfileModule from "./InternProfileModule";
import InternWeeklyUpdatesModule from "./InternWeeklyUpdatesModule";
import InternDashboardOverview from "./InternDashboardOverview";
import InternTrainingModule from "./InternTrainingModule";
import InternTestPathModule from "./InternTestPathModule";
import InternCertificatesModule from "./InternCertificatesModule";
import InternTermsModule from "./InternTermsModule";
import type { Task, Project } from "@shared/schema";
import InternTimeLogsModule from "./InternTimeLogsModule";
import InternDAOModule from "./InternDAOModule";
import InternDAOProjectsModule from "./InternDAOProjectsModule";
import InternDirectExamModule from "./InternDirectExamModule";
import InternSocialModule from "./InternSocialModule";
import WalletSubmitPopup from "./WalletSubmitPopup";
import InternSupportModule from "./InternSupportModule";
import InternMessagesModule from "./InternMessagesModule";

interface InternStatus {
  internshipStatus: string;
  qualificationPath: string;
  courseProgress: number;
  termsAccepted: boolean;
  daoMembershipApplied: boolean;
  daoStatus: string | null;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isMobile;
}

export default function InternDashboard() {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const closeSidebarOnMobile = useCallback(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/intern/profile"],
    queryFn: async () => {
      const res = await fetch("/api/intern/profile", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const text = await res.text();
      return text ? JSON.parse(text) : null;
    },
  });

  const { data: internStatus, isLoading: statusLoading } =
    useQuery<InternStatus>({
      queryKey: ["/api/intern/status"],
      queryFn: async () => {
        const res = await fetch("/api/intern/status", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch status");
        return res.json();
      },
    });

  const isRejected = internStatus?.internshipStatus === "rejected";

  const { data: rejectionInfo } = useQuery<{
    rejected: boolean;
    note: string | null;
    rejectedAt: string | null;
    adminUsername: string | null;
  }>({
    queryKey: ["/api/intern/my-rejection"],
    queryFn: async () => {
      const res = await fetch("/api/intern/my-rejection", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch rejection info");
      return res.json();
    },
    enabled: isRejected,
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/intern/tasks"],
    queryFn: async () => {
      const res = await fetch("/api/intern/tasks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    },
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/intern/projects"],
    queryFn: async () => {
      const res = await fetch("/api/intern/projects", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch projects");
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    },
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/intern/logout", {
        method: "POST",
        credentials: "include",
      });
      setLocation("/intern/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getCurrentView = () => {
    if (location.includes("/intern/direct-exam")) return "direct-exam";
    if (location.includes("/intern/training")) return "training";
    if (location.includes("/intern/test-path")) return "test-path";
    if (location.includes("/intern/certificates")) return "certificates";
    if (location.includes("/intern/terms")) return "terms";
    if (location.includes("/intern/dao-membership")) return "dao-membership";
    if (location.includes("/intern/dao-projects")) return "dao-projects";
    if (location.includes("/intern/dashboard")) return "dashboard";
    if (location.includes("/intern/tasks")) return "tasks";
    if (location.includes("/intern/projects")) return "projects";
    if (location.includes("/intern/profile")) return "profile";
    if (location.includes("/intern/weekly-updates")) return "weekly-updates";
    if (location.includes("/intern/time-logs")) return "time-logs";
    if (location.includes("/intern/social")) return "social";
        if (location.includes("/intern/support")) return "support";
    if (location.includes("/intern/messages")) return "messages";
    return "dashboard";
  };

  const currentView = getCurrentView();

  const qualPath = internStatus?.qualificationPath;
  const status = internStatus?.internshipStatus;
  const isInternshipPhase = status === "internship" || status === "completed";
  const week3Done = internStatus?.week3Completed === true;

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <InternDashboardOverview tasks={tasks} projects={projects} />;
      case "direct-exam":
        return <InternTestPathModule />;
      case "training":
        return <InternTrainingModule />;
      case "test-path":
        return <InternTestPathModule />;
      case "certificates":
        return <InternCertificatesModule />;
      case "terms":
        return <InternTermsModule />;
      case "tasks":
        return (
          <InternTasksModule
            tasks={tasks}
            projects={projects}
            daoStatus={internStatus?.daoStatus || null}
          />
        );
      case "projects":
        return <InternProjectsModule />;
      case "profile":
        return <InternProfileModule profile={profile} />;
      case "weekly-updates":
        return <InternWeeklyUpdatesModule profile={profile} />;
      case "time-logs":
        return <InternTimeLogsModule />;
      case "dao-membership":
        return <InternDAOModule />;
      case "dao-projects":
        return <InternDAOProjectsModule />;
      case "social":
        return <InternSocialModule />;
                case "support":
  return <InternSupportModule />;
      case "messages":
        return <InternMessagesModule />;
      default:
        return <InternDashboardOverview tasks={tasks} projects={projects} />;
    }
  };

  const viewTitles: Record<string, string> = {
    dashboard: "Dashboard",
    training: "Training Course",
    "direct-exam": "Test & Projects",
    "test-path": "Test & Projects",
    certificates: "Certificates",
    terms: "Terms & Conditions",
    tasks: "Tasks",
    projects: "Projects",
    profile: "Profile",
    "weekly-updates": "Weekly Updates",
    "time-logs": "Time Logs",
    "dao-membership": "DAO Membership",
    "dao-projects": "My Projects",
    social: "Social Follow",
        support: "Community Support",
    messages: "Messages",
  };

  const navItem = (view: string, icon: any, label: string) => {
    const Icon = icon;
    return (
      <Button
        key={view}
        variant={currentView === view ? "secondary" : "ghost"}
        className="w-full justify-start gap-3"
        onClick={() => {
          setLocation(`/intern/${view === "dashboard" ? "dashboard" : view}`);
          closeSidebarOnMobile();
        }}
        data-testid={`nav-${view}`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {label}
      </Button>
    );
  };

  if (statusLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">EA</span>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading Intern Portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          data-testid="sidebar-backdrop"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border transition-transform duration-300 z-50 w-64 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">EA</span>
                </div>
                <span className="font-bold text-lg text-sidebar-foreground">
                  Intern Portal
                </span>
              </div>
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSidebarOpen(false)}
                  data-testid="button-close-sidebar"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItem("dashboard", LayoutDashboard, "Dashboard")}

            {qualPath === "course_first" &&
              navItem("training", BookOpen, "Training Course")}
            {qualPath === "course_first" &&
              navItem("direct-exam", FileQuestion, "Test & Projects")}
            {qualPath === "entrance_test" &&
              navItem("test-path", FileQuestion, "Test & Projects")}

            {navItem("tasks", ClipboardList, "Tasks")}

            {isInternshipPhase && navItem("projects", FolderKanban, "Projects")}

            {navItem("time-logs", Clock, "Time Logs")}
            {navItem("certificates", Award, "Certificates")}
            {navItem("social", Share2, "Social Follow")}
                         
            {navItem("terms", FileText, "Terms & Conditions")}

            {status === "completed" &&
              navItem("dao-membership", Users, "DAO Membership")}
            {internStatus?.daoStatus === "approved" &&
              navItem("dao-projects", Rocket, "My Projects")}
            {navItem("profile", User, "Profile")}
                        {navItem("support", LifeBuoy, "Community Support")}
            {navItem("messages", MessageSquare, "Messages")}
          </nav>

          <div className="p-4 border-t border-sidebar-border space-y-2">
            {profile && (
              <div className="px-2 py-2 text-sm text-muted-foreground truncate">
                {profile.name}
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      <main
        className={`transition-all duration-300 ${sidebarOpen && !isMobile ? "md:ml-64" : "ml-0"}`}
      >
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="button-toggle-sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg sm:text-2xl font-bold truncate">
                {viewTitles[currentView] || "Dashboard"}
              </h1>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-6 space-y-4">
          {isRejected && rejectionInfo?.rejected && (
            <div
              className="flex items-start gap-3 p-4 rounded-md border border-red-500/30 bg-red-500/10"
              data-testid="alert-internship-rejected"
            >
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-1 min-w-0">
                <p className="font-medium text-red-400">
                  Task Rejected – Please Update and Resubmit
                </p>
                {rejectionInfo.note && (
                  <p
                    className="text-muted-foreground whitespace-pre-wrap break-words"
                    data-testid="text-rejection-note"
                  >
                    {rejectionInfo.note}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {rejectionInfo.adminUsername
                    ? `Reviewed by ${rejectionInfo.adminUsername}`
                    : ""}
                  {rejectionInfo.rejectedAt
                    ? ` · ${new Date(rejectionInfo.rejectedAt).toLocaleString()}`
                    : ""}
                </p>
              </div>
            </div>
          )}
          {renderContent()}
        </div>
      </main>

      {status && <WalletSubmitPopup internshipStatus={status} />}
    </div>
  );
}
