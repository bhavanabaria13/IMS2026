import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ClipboardList,
  LogOut,
  User,
  FolderKanban,
  Menu,
  X,
  Clock,
  Loader2,
  Users,
} from "lucide-react";
import InternTasksModule from "@/components/intern/InternTasksModule";
import InternProjectsModule from "@/components/intern/InternProjectsModule";
import InternProfileModule from "@/components/intern/InternProfileModule";
import InternTimeLogsModule from "@/components/intern/InternTimeLogsModule";
import DaoOverview from "./DaoOverview";
import type { Task, Project } from "@shared/schema";

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

export default function DaoDashboard() {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const closeSidebarOnMobile = useCallback(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const { data: status, isLoading: statusLoading } = useQuery<any>({
    queryKey: ["/api/intern/status"],
    queryFn: async () => {
      const res = await fetch("/api/intern/status", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
  });

  const isAuthorized = status?.daoStatus === "approved";

  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/intern/profile"],
    enabled: isAuthorized,
    queryFn: async () => {
      const res = await fetch("/api/intern/profile", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/intern/tasks"],
    enabled: isAuthorized,
    queryFn: async () => {
      const res = await fetch("/api/intern/tasks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/intern/projects"],
    enabled: isAuthorized,
    queryFn: async () => {
      const res = await fetch("/api/intern/projects", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  useEffect(() => {
    if (statusLoading) return;
    if (!status || status.daoStatus !== "approved") {
      queryClient.clear();
      setLocation("/dao/login");
    }
  }, [status, statusLoading, setLocation]);

  const handleLogout = async () => {
    try {
      await fetch("/api/intern/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      queryClient.clear();
      setLocation("/dao/login");
    }
  };

  const getCurrentView = () => {
    if (location.includes("/dao/dashboard")) return "dashboard";
    if (location.includes("/dao/projects")) return "projects";
    if (location.includes("/dao/tasks")) return "tasks";
    if (location.includes("/dao/time-logs")) return "time-logs";
    if (location.includes("/dao/profile")) return "profile";
    return "dashboard";
  };

  const currentView = getCurrentView();

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return <DaoOverview />;
      case "projects":
        return <InternProjectsModule />;
      case "tasks":
        return (
          <InternTasksModule
            tasks={tasks}
            projects={projects}
            daoStatus={status?.daoStatus || null}
          />
        );
      case "time-logs":
        return <InternTimeLogsModule />;
      case "profile":
        return <InternProfileModule />;
      default:
        return <DaoOverview />;
    }
  };

  const viewTitles: Record<string, string> = {
    dashboard: "DAO Dashboard",
    projects: "Projects",
    tasks: "Tasks",
    "time-logs": "Time Logs",
    profile: "Profile",
  };

  const navItem = (view: string, icon: any, label: string) => {
    const Icon = icon;
    return (
      <Button
        key={view}
        variant={currentView === view ? "secondary" : "ghost"}
        className="w-full justify-start gap-3"
        onClick={() => {
          setLocation(`/dao/${view}`);
          closeSidebarOnMobile();
        }}
        data-testid={`nav-${view}`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {label}
      </Button>
    );
  };

  if (statusLoading || (isAuthorized && profileLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading DAO Panel...</p>
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
                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg text-sidebar-foreground">
                  DAO Panel
                </span>
              </div>
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItem("dashboard", LayoutDashboard, "Dashboard")}
            {navItem("projects", FolderKanban, "Projects")}
            {navItem("tasks", ClipboardList, "Tasks")}
            {navItem("time-logs", Clock, "Time Logs")}
            {navItem("profile", User, "Profile")}
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
        className={`transition-all duration-300 ${
          sidebarOpen && !isMobile ? "md:ml-64" : "ml-0"
        }`}
      >
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg sm:text-2xl font-bold truncate">
                {viewTitles[currentView] || "DAO Dashboard"}
              </h1>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-6">{renderContent()}</div>
      </main>
    </div>
  );
}
