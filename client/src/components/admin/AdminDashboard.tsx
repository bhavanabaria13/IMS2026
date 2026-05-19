import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ExamManagement from "./ExamManagement";

import {
  Users,
  FileText,
  Clock,
  TrendingUp,
  LogOut,
  LayoutDashboard,
  List,
  Download,
  Menu,
  X,
  Loader2,
  Calendar,
  ClipboardList,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  FolderKanban,
  Shield,
  BookOpen,
  Briefcase,
  Video,
  Layers,
  Wallet,
  ShieldAlert,
  GraduationCap,
  MessageSquare,
} from "lucide-react";
import InternList from "./InternList";
import WeeklyUpdates from "./WeeklyUpdates";
import TaskManagement from "./TaskManagement";
import ProjectManagement from "./ProjectManagement";
import InternApproval from "./InternApproval";
import TimeTracker from "./TimeTracker";
import InternProgressChart from "./InternProgressChart";
import ExcelImport from "./ExcelImport";
import ContactMessages from "./ContactMessages";
import DAOManagement from "./DAOManagement";
import CategoryManagement from "./CategoryManagement";
import TrainingModule from "./TrainingModule";
import CourseModuleManagement from "./CourseModuleManagement";
import InternsModule from "./InternsModule";
import VideoManagement from "./VideoManagement";
import SubProjectManagement from "./SubProjectManagement";
import WalletAddresses from "./WalletAddresses";
import FinalTaskManagement from "./FinalTaskManagement";
import InternActionsModule from "./InternActionsModule";
import InternshipReviewModule from "./InternshipReviewModule";
import AdminMessagesModule from "./AdminMessagesModule";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Intern } from "@shared/schema";

function ProjectsTabView() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-4" data-testid="projects-tab-view">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="all" data-testid="tab-all-projects">
            All Projects
          </TabsTrigger>
          <TabsTrigger value="interns" data-testid="tab-interns-projects">
            Interns Projects
          </TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-training-projects">
            Training/Test Projects
          </TabsTrigger>
          <TabsTrigger value="dao" data-testid="tab-dao-projects">
            DAO Projects
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <ProjectManagement categoryFilter="all" />
        </TabsContent>
        <TabsContent value="interns">
          <ProjectManagement categoryFilter="interns" />
        </TabsContent>
        <TabsContent value="training">
          <ProjectManagement categoryFilter="training" />
        </TabsContent>
        <TabsContent value="dao">
          <ProjectManagement categoryFilter="dao" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SubProjectsTabView() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-4" data-testid="sub-projects-tab-view">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="all" data-testid="tab-all-sub-projects">
            All Sub-Projects
          </TabsTrigger>
          <TabsTrigger value="interns" data-testid="tab-interns-sub-projects">
            Interns Sub-Projects
          </TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-training-sub-projects">
            Training/Test Sub-Projects
          </TabsTrigger>
          <TabsTrigger value="dao" data-testid="tab-dao-sub-projects">
            DAO Sub-Projects
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <SubProjectManagement categoryFilter="all" />
        </TabsContent>
        <TabsContent value="interns">
          <SubProjectManagement categoryFilter="interns" />
        </TabsContent>
        <TabsContent value="training">
          <SubProjectManagement categoryFilter="training" />
        </TabsContent>
        <TabsContent value="dao">
          <SubProjectManagement categoryFilter="dao" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TasksTabView() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-4" data-testid="tasks-tab-view">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="all" data-testid="tab-all-tasks">
            All Tasks
          </TabsTrigger>
          <TabsTrigger value="interns" data-testid="tab-interns-tasks">
            Interns Tasks
          </TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-training-tasks">
            Training/Test Tasks
          </TabsTrigger>
          <TabsTrigger value="dao" data-testid="tab-dao-tasks">
            DAO Tasks
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <TaskManagement categoryFilter="all" />
        </TabsContent>
        <TabsContent value="interns">
          <TaskManagement categoryFilter="interns" />
        </TabsContent>
        <TabsContent value="training">
          <TaskManagement categoryFilter="training" />
        </TabsContent>
        <TabsContent value="dao">
          <TaskManagement categoryFilter="dao" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TimeTrackerTabView() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-4" data-testid="time-tracker-tab-view">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="all" data-testid="tab-all-time">
            All Time Tracker
          </TabsTrigger>
          <TabsTrigger value="interns" data-testid="tab-interns-time">
            Interns Time Tracker
          </TabsTrigger>
          <TabsTrigger value="training" data-testid="tab-training-time">
            Training/Test Time Tracker
          </TabsTrigger>
          <TabsTrigger value="dao" data-testid="tab-dao-time">
            DAO Time Tracker
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <TimeTracker categoryFilter="all" />
        </TabsContent>
        <TabsContent value="interns">
          <TimeTracker categoryFilter="interns" />
        </TabsContent>
        <TabsContent value="training">
          <TimeTracker categoryFilter="training" />
        </TabsContent>
        <TabsContent value="dao">
          <TimeTracker categoryFilter="dao" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AllInternsTabView({
  handleExportExcel,
  isExporting,
}: {
  handleExportExcel: () => void;
  isExporting: boolean;
}) {
  const [activeTab, setActiveTab] = useState("training");

  return (
    <div className="space-y-4" data-testid="all-interns-tab-view">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-semibold">All Interns</h2>
        <Button
          className="bg-gradient-to-r from-purple-500 to-blue-600"
          onClick={handleExportExcel}
          disabled={isExporting}
          data-testid="button-export-excel"
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export to Excel
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="training" data-testid="tab-training-interns">
            Training
          </TabsTrigger>
          <TabsTrigger value="joined" data-testid="tab-joined-interns">
            Joined Interns
          </TabsTrigger>
          <TabsTrigger value="applicant" data-testid="tab-applicant-interns">
            Applicant
          </TabsTrigger>
          <TabsTrigger value="dao" data-testid="tab-dao-interns">
            DAO Joined Interns
          </TabsTrigger>
        </TabsList>
        <TabsContent value="training">
          <InternsModule statusFilter="training" />
        </TabsContent>
        <TabsContent value="joined">
          <InternsModule statusFilter="joined" />
        </TabsContent>
        <TabsContent value="applicant">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <InternList />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="dao">
          <InternsModule statusFilter="dao" />
        </TabsContent>
      </Tabs>
    </div>
  );
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

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const closeSidebarOnMobile = useCallback(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  // Check admin session on mount
  const { data: adminCheck, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ["/api/admin/check"],
    queryFn: async () => {
      const response = await fetch("/api/admin/check", {
        credentials: "include", // Important: include credentials for session cookies
      });
      if (!response.ok) throw new Error("Not authenticated");
      return response.json();
    },
    refetchInterval: 30000, // Check every 30 seconds
    retry: false,
  });

  // Redirect to login if not admin
  useEffect(() => {
    if (!isCheckingAdmin && !adminCheck?.isAdmin) {
      setLocation("/admin/login");
    }
  }, [adminCheck, isCheckingAdmin, setLocation]);

  const { data: interns = [] } = useQuery<Intern[]>({
    queryKey: ["/api/interns"],
    enabled: !!adminCheck?.isAdmin,
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const { data: adminStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!adminCheck?.isAdmin,
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", {
        credentials: "include", // VERY IMPORTANT for admin session
      });
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return res.json();
    },
  });

  const statsData = {
    totalApplicants: isStatsLoading ? "…" : (adminStats?.totalApplicants ?? 0),
    totalTraining: isStatsLoading ? "…" : (adminStats?.totalTraining ?? 0),
    totalJoinedInterns: isStatsLoading
      ? "…"
      : (adminStats?.totalJoinedInterns ?? 0),
    totalDaoApplied: isStatsLoading ? "…" : (adminStats?.totalDaoApplied ?? 0),
    totalProjects: isStatsLoading ? "…" : (adminStats?.totalProjects ?? 0),
    totalSubProjects: isStatsLoading
      ? "…"
      : (adminStats?.totalSubProjects ?? 0),
    totalTasks: isStatsLoading ? "…" : (adminStats?.totalTasks ?? 0),
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/interns/export");
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `interns-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Excel file downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSetupTestIntern = async () => {
    try {
      const response = await fetch("/api/setup-test-intern", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Setup failed");

      const data = await response.json();
      toast({
        title: "Test Account Created",
        description: `Email: ${data.email}, Password: ${data.password}`,
        duration: 10000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to setup test account",
        variant: "destructive",
      });
    }
  };

  const handleImportSpreadsheet = async () => {
    try {
      // Sample data structure - replace with actual spreadsheet data
      const spreadsheetData = [
        {
          fullName: "John Doe",
          email: "john.doe@example.com",
          phone: "1234567890",
          program: "Computer Science",
          learningTopics: "React, TypeScript, Node.js",
          tasksCompleted: "Built user authentication system",
          workOutput: "Auth API with JWT tokens",
          githubLink: "https://github.com/johndoe/auth-system",
          city: "INDIA",
        },
        // Add more rows from your spreadsheet
      ];

      const response = await fetch("/api/admin/import-spreadsheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: spreadsheetData }),
      });

      if (!response.ok) throw new Error("Import failed");

      const result = await response.json();
      toast({
        title: "Import Completed",
        description: `Imported: ${result.imported}, Skipped: ${result.skipped}`,
        duration: 5000,
      });

      // Refresh the intern list
      queryClient.invalidateQueries({ queryKey: ["/api/interns"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import data",
        variant: "destructive",
      });
    }
  };

  const thisMonth = interns.filter((i) => {
    const applied = new Date(i.appliedDate);
    const now = new Date();
    return (
      applied.getMonth() === now.getMonth() &&
      applied.getFullYear() === now.getFullYear()
    );
  }).length;

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
                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">EA</span>
                </div>
                <span className="font-bold text-lg text-sidebar-foreground">
                  Admin Panel
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

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <Button
              variant={
                location.startsWith("/admin/dashboard") ? "secondary" : "ghost"
              }
              className="w-full justify-start gap-3"
              onClick={() => { setLocation("/admin/dashboard"); closeSidebarOnMobile(); }}
              data-testid="nav-dashboard"
            >
              <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
              Dashboard
            </Button>
            {false && (
              <Button
                variant={
                  location.startsWith("/admin/approval") ? "secondary" : "ghost"
                }
                className={"w-full justify-start gap-3"}
                onClick={() => { setLocation("/admin/approval"); closeSidebarOnMobile(); }}
                data-testid="nav-approval"
              >
                <UserCheck className="h-5 w-5 flex-shrink-0" />
                Intern Approval
              </Button>
            )}

            <Button
              variant={
                location.startsWith("/admin/course-modules")
                  ? "secondary"
                  : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/course-modules"); closeSidebarOnMobile(); }}
              data-testid="nav-course-modules"
            >
              <FileText className="h-5 w-5 flex-shrink-0" />
              Course Modules
            </Button>
            <Button
              variant={
                location.startsWith("/admin/all-interns")
                  ? "secondary"
                  : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/all-interns"); closeSidebarOnMobile(); }}
              data-testid="nav-all-interns"
            >
              <Users className="h-5 w-5 flex-shrink-0" />
              All Interns
            </Button>
            <Button
              variant={
                location.startsWith("/admin/intern-actions")
                  ? "secondary"
                  : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/intern-actions"); closeSidebarOnMobile(); }}
              data-testid="nav-intern-actions"
            >
              <ShieldAlert className="h-5 w-5 flex-shrink-0" />
              Reject / Warn
            </Button>
            <Button
              variant={
                location.startsWith("/admin/internship-review")
                  ? "secondary"
                  : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/internship-review"); closeSidebarOnMobile(); }}
              data-testid="nav-internship-review"
            >
              <GraduationCap className="h-5 w-5 flex-shrink-0" />
              Internship Approval
            </Button>
            <Button
              variant={
                location.startsWith("/admin/messages") ? "secondary" : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/messages"); closeSidebarOnMobile(); }}
              data-testid="nav-messages"
            >
              <MessageSquare className="h-5 w-5 flex-shrink-0" />
              Messages
            </Button>
            <Button
              variant={
                location.startsWith("/admin/training") ? "secondary" : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/training"); closeSidebarOnMobile(); }}
              data-testid="nav-training"
            >
              <BookOpen className="h-5 w-5 flex-shrink-0" />
              Training
            </Button>
            <Button
              variant={
                location.startsWith("/admin/dao") ? "secondary" : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/dao"); closeSidebarOnMobile(); }}
              data-testid="nav-dao"
            >
              <Shield className="h-5 w-5 flex-shrink-0" />
              DAO Management
            </Button>

            <Button
              variant={
                location.startsWith("/admin/projects") ? "secondary" : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/projects"); closeSidebarOnMobile(); }}
              data-testid="nav-projects"
            >
              <FolderKanban className="h-5 w-5 flex-shrink-0" />
              Project Management
            </Button>
            <Button
              variant={
                location.startsWith("/admin/sub-projects")
                  ? "secondary"
                  : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/sub-projects"); closeSidebarOnMobile(); }}
              data-testid="nav-sub-projects"
            >
              <Layers className="h-5 w-5 flex-shrink-0" />
              Sub-Projects
            </Button>

            <Button
              variant={
                location.startsWith("/admin/tasks") && !location.startsWith("/admin/tasks-final") ? "secondary" : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/tasks"); closeSidebarOnMobile(); }}
              data-testid="nav-tasks"
            >
              <ClipboardList className="h-5 w-5 flex-shrink-0" />
              Task Management
            </Button>

            <Button
              variant={
                location.startsWith("/admin/tasks-final") ? "secondary" : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/tasks-final"); closeSidebarOnMobile(); }}
              data-testid="nav-tasks-final"
            >
              <GraduationCap className="h-5 w-5 flex-shrink-0" />
              Final Task Management
            </Button>

            <Button
              variant={
                location.startsWith("/admin/time-tracker")
                  ? "secondary"
                  : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/time-tracker"); closeSidebarOnMobile(); }}
              data-testid="nav-time-tracker"
            >
              <Clock className="h-5 w-5 flex-shrink-0" />
              Time Tracker
            </Button>
            {false && (
              <Button
                variant={
                  location.startsWith("/admin/import") ? "secondary" : "ghost"
                }
                className={"w-full justify-start gap-3"}
                onClick={() => { setLocation("/admin/import"); closeSidebarOnMobile(); }}
                data-testid="nav-import"
              >
                <Download className="h-5 w-5 flex-shrink-0" />
                Import Excel
              </Button>
            )}
            <Button
              variant={
                location.startsWith("/admin/categories") ? "secondary" : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/categories"); closeSidebarOnMobile(); }}
              data-testid="nav-categories"
            >
              <FolderKanban className="h-5 w-5 flex-shrink-0" />
              Categories
            </Button>
            <Button
              variant={
                location.startsWith("/admin/videos") ? "secondary" : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/videos"); closeSidebarOnMobile(); }}
              data-testid="nav-videos"
            >
              <Video className="h-5 w-5 flex-shrink-0" />
              Videos
            </Button>
            <Button
              variant={
                location.startsWith("/admin/contact") ? "secondary" : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/contact"); closeSidebarOnMobile(); }}
              data-testid="nav-contact"
            >
              <Mail className="h-5 w-5 flex-shrink-0" />
              Contact Messages
            </Button>
            <Button
              variant={
                location.startsWith("/admin/wallet") ? "secondary" : "ghost"
              }
              className={"w-full justify-start gap-3"}
              onClick={() => { setLocation("/admin/wallet-addresses"); closeSidebarOnMobile(); }}
              data-testid="nav-wallet-addresses"
            >
              <Wallet className="h-5 w-5 flex-shrink-0" />
              Intern Wallet Address
            </Button>
            {false && (
              <Button
                variant={
                  location.startsWith("/admin/weekly") ? "secondary" : "ghost"
                }
                className={"w-full justify-start gap-3"}
                onClick={() => { setLocation("/admin/weekly"); closeSidebarOnMobile(); }}
                data-testid="nav-weekly"
              >
                <Calendar className="h-5 w-5 flex-shrink-0" />
                Weekly Updates
              </Button>
            )}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
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
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="button-toggle-sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-base sm:text-xl font-semibold truncate">
                {location.startsWith("/admin/dashboard")
                  ? "Dashboard"
                  : location.startsWith("/admin/training")
                    ? "Training"
                    : location.startsWith("/admin/all-interns")
                      ? "All Interns"
                      : location.startsWith("/admin/approval")
                        ? "Approve Interns"
                        : location.startsWith("/admin/dao")
                          ? "DAO Management"
                          : location.startsWith("/admin/projects")
                            ? "Project Management"
                            : location.startsWith("/admin/sub-projects")
                              ? "Sub-Project Management"
                              : location.startsWith("/admin/tasks-final")
                                ? "Final Task Management"
                                : location.startsWith("/admin/tasks")
                                ? "Task Management"
                                : location.startsWith("/admin/time-tracker")
                                  ? "Time Tracker"
                                  : location.startsWith("/admin/categories")
                                    ? "Categories"
                                    : location.startsWith("/admin/videos")
                                      ? "Video Management"
                                      : location.startsWith("/admin/contact")
                                        ? "Contact Messages"
                                        : location.startsWith("/admin/wallet")
                                          ? "Intern Wallet Address"
                                          : location.startsWith("/admin/intern-actions")
                                            ? "Reject / Warn Interns"
                                            : location.startsWith("/admin/internship-review")
                                              ? "Internship Approval Review"
                                              : "Weekly Updates"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="hidden sm:flex">
                Admin
              </Badge>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">A</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-6">
          {location.startsWith("/admin/dashboard") ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card
                  className="border-border/50"
                  data-testid="card-member-list"
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-400" />
                      Member List
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => { setLocation("/admin/all-interns"); closeSidebarOnMobile(); }}
                      data-testid="stat-total-applicants"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-yellow-500/15 flex items-center justify-center">
                          <AlertCircle className="h-4.5 w-4.5 text-yellow-500" />
                        </div>
                        <span className="text-sm font-medium">
                          Total Applicants
                        </span>
                      </div>
                      <span className="text-2xl font-bold">
                        {statsData.totalApplicants}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => { setLocation("/admin/all-interns"); closeSidebarOnMobile(); }}
                      data-testid="stat-total-interns"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-blue-500/15 flex items-center justify-center">
                          <Briefcase className="h-4.5 w-4.5 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium">
                          Total Interns
                        </span>
                      </div>
                      <span className="text-2xl font-bold">
                        {statsData.totalJoinedInterns}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => { setLocation("/admin/all-interns"); closeSidebarOnMobile(); }}
                      data-testid="stat-total-trainers"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-green-500/15 flex items-center justify-center">
                          <BookOpen className="h-4.5 w-4.5 text-green-500" />
                        </div>
                        <span className="text-sm font-medium">
                          Total Trainers
                        </span>
                      </div>
                      <span className="text-2xl font-bold">
                        {statsData.totalTraining}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => { setLocation("/admin/dao"); closeSidebarOnMobile(); }}
                      data-testid="stat-total-dao"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-purple-500/15 flex items-center justify-center">
                          <Shield className="h-4.5 w-4.5 text-purple-500" />
                        </div>
                        <span className="text-sm font-medium">
                          Total DAO Applied Members
                        </span>
                      </div>
                      <span className="text-2xl font-bold">
                        {statsData.totalDaoApplied}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-border/50"
                  data-testid="card-project-list"
                >
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <FolderKanban className="h-5 w-5 text-blue-400" />
                      Project List
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => { setLocation("/admin/projects"); closeSidebarOnMobile(); }}
                      data-testid="stat-total-projects"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-blue-500/15 flex items-center justify-center">
                          <FolderKanban className="h-4.5 w-4.5 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium">
                          Total Projects
                        </span>
                      </div>
                      <span className="text-2xl font-bold">
                        {statsData.totalProjects}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => { setLocation("/admin/sub-projects"); closeSidebarOnMobile(); }}
                      data-testid="stat-total-subprojects"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-indigo-500/15 flex items-center justify-center">
                          <Layers className="h-4.5 w-4.5 text-indigo-500" />
                        </div>
                        <span className="text-sm font-medium">
                          Total Sub-Projects
                        </span>
                      </div>
                      <span className="text-2xl font-bold">
                        {statsData.totalSubProjects}
                      </span>
                    </div>
                    <div
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => { setLocation("/admin/tasks"); closeSidebarOnMobile(); }}
                      data-testid="stat-total-tasks"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-md bg-orange-500/15 flex items-center justify-center">
                          <ClipboardList className="h-4.5 w-4.5 text-orange-500" />
                        </div>
                        <span className="text-sm font-medium">Total Tasks</span>
                      </div>
                      <span className="text-2xl font-bold">
                        {statsData.totalTasks}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <InternProgressChart />

              <Card className="border-border/50 mt-8">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle>Recent Applications</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setLocation("/admin/all-interns"); closeSidebarOnMobile(); }}
                    data-testid="button-view-all"
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <InternList compact />
                </CardContent>
              </Card>
            </>
          ) : location.startsWith("/admin/all-interns") ? (
            <AllInternsTabView
              handleExportExcel={handleExportExcel}
              isExporting={isExporting}
            />
          ) : location.startsWith("/admin/tasks-final") ? (
            <FinalTaskManagement />
          ) : location.startsWith("/admin/tasks") ? (
            <TasksTabView />
          ) : location.startsWith("/admin/exams") ? (
            <ExamManagement />
          ) : location.startsWith("/admin/projects") ? (
            <ProjectsTabView />
          ) : location.startsWith("/admin/approval") ? (
            <InternApproval />
          ) : location.startsWith("/admin/time-tracker") ? (
            <TimeTrackerTabView />
          ) : location.startsWith("/admin/import") ? (
            <ExcelImport />
          ) : location.startsWith("/admin/course-modules") ? (
            <CourseModuleManagement />
          ) : location.startsWith("/admin/training") ? (
            <TrainingModule />
          ) : location.startsWith("/admin/videos") ? (
            <VideoManagement />
          ) : location.startsWith("/admin/sub-projects") ? (
            <SubProjectsTabView />
          ) : location.startsWith("/admin/dao") ? (
            <DAOManagement />
          ) : location.startsWith("/admin/categories") ? (
            <CategoryManagement />
          ) : location.startsWith("/admin/contact") ? (
            <ContactMessages />
          ) : location.startsWith("/admin/wallet") ? (
            <WalletAddresses />
          ) : location.startsWith("/admin/intern-actions") ? (
            <InternActionsModule />
          ) : location.startsWith("/admin/internship-review") ? (
            <InternshipReviewModule />
          ) : location.startsWith("/admin/messages") ? (
            <AdminMessagesModule />
          ) : (
            <WeeklyUpdates />
          )}
        </div>
      </main>
    </div>
  );
}
