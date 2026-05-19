import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ReadMore } from "@/components/ui/readmore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  FileQuestion,
  FolderKanban,
  Rocket,
  Check,
  Loader2,
  ArrowRight,
  FileText,
  ClipboardList,
  CheckCircle2,
  Circle,
  Clock,
  Play,
  Send,
  Square,
  Trophy,
  Award,
  Github,
  ExternalLink,
  Lock,
  XCircle,
} from "lucide-react";
import type {
  DemoProject,
  InternDemoProject,
  CourseModule,
  CourseProgress,
  Task,
  TimeLog,
} from "@shared/schema";

const MIN_WORK_MS = 30 * 60 * 1000;

interface DemoProjectsResponse {
  projects: DemoProject[];
  selected: InternDemoProject[];
}

interface ProgressSummary {
  total: number;
  completed: number;
  percentage: number;
}

const ALL_PHASE_TITLES: Record<string, string> = {
  "research-design": "Research & Design",
  development: "Development & Integration",
  testing: "Testing & Optimization",
  deployment: "Deployment & Documentation",
  portfolio: "Portfolio Creation",
  professional: "Professional Skills",
  "final-project": "Final Project",
  advanced: "Advanced Marketing",
  analytics: "Marketing Analytics",
  email: "Email Marketing & Automation",
};

const CATEGORY_PHASE_ORDER: Record<string, string[]> = {
  "Web3+AI": ["research-design", "development", "testing", "deployment"],
  "Graphics Design": ["portfolio", "professional", "final-project"],
  "Digital Marketing": ["advanced", "analytics", "email", "final-project"],
};

function getPhaseLabel(phase: string, index: number): string {
  const emoji =
    ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"][index] || `${index + 1}.`;
  const title =
    ALL_PHASE_TITLES[phase] ||
    phase.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return `${emoji} ${title}`;
}

function derivePhaseOrder(modules: CourseModule[]): string[] {
  const seen = new Set<string>();
  const firstSeenOrder: string[] = [];
  for (const mod of modules) {
    const cat = mod.category || "other";
    if (!seen.has(cat)) {
      seen.add(cat);
      firstSeenOrder.push(cat);
    }
  }

  let bestMatch: string[] | null = null;
  let bestOverlap = 0;
  for (const [, knownOrder] of Object.entries(CATEGORY_PHASE_ORDER)) {
    const overlap = knownOrder.filter((p) => seen.has(p)).length;
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestMatch = knownOrder;
    }
  }

  if (bestMatch && bestOverlap >= 2) {
    const result = bestMatch.filter((p) => seen.has(p));
    const extra = firstSeenOrder.filter((p) => !bestMatch!.includes(p));
    return [...result, ...extra];
  }

  return firstSeenOrder;
}

export default function InternTestPathModule() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<
    "options" | "projects" | "tasks"
  >("options");
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submitNotes, setSubmitNotes] = useState("");
  const [submitDescription, setSubmitDescription] = useState("");
  const [submitGithubLink, setSubmitGithubLink] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"pending" | "completed">(
    "completed",
  );
  const [nowTick, setNowTick] = useState(Date.now());
  const [creatingForModule, setCreatingForModule] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!showSubmitDialog) return;
    setNowTick(Date.now());
    queryClient.invalidateQueries({ queryKey: ["/api/intern/time-logs"] });
    const id = setInterval(() => setNowTick(Date.now()), 15000);
    return () => clearInterval(id);
  }, [showSubmitDialog]);

  const { data: timeLogs = [] } = useQuery<TimeLog[]>({
    queryKey: ["/api/intern/time-logs"],
    queryFn: async () => {
      const res = await fetch("/api/intern/time-logs", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch time logs");
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    },
  });

  const { data: demoData, isLoading: loadingProjects } =
    useQuery<DemoProjectsResponse>({
      queryKey: ["/api/intern/demo-projects"],
      queryFn: async () => {
        const res = await fetch("/api/intern/demo-projects", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch demo projects");
        return res.json();
      },
    });

  const { data: modules = [] } = useQuery<CourseModule[]>({
    queryKey: ["/api/intern/course-modules"],
    queryFn: async () => {
      const res = await fetch("/api/intern/course-modules", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch course modules");
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    },
  });

  const { data: progress = [] } = useQuery<CourseProgress[]>({
    queryKey: ["/api/intern/course-progress"],
    queryFn: async () => {
      const res = await fetch("/api/intern/course-progress", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch course progress");
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    },
  });

  const { data: progressSummary } = useQuery<ProgressSummary>({
    queryKey: ["/api/intern/progress-summary"],
    queryFn: async () => {
      const res = await fetch("/api/intern/progress-summary", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch progress summary");
      return res.json();
    },
  });

  const { data: internTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/intern/tasks"],
    queryFn: async () => {
      const res = await fetch("/api/intern/tasks", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    },
  });

  const demoProjects = demoData?.projects ?? [];
  const adminTestProjects: any[] = (demoData as any)?.adminProjects ?? [];
  const allDemoProjectsList = [...demoProjects];
  const selectedEntries = demoData?.selected ?? [];
  const activeSelectedEntries = selectedEntries.filter(
    (e: any) => e.status !== "completed",
  );
  const selectedEntry =
    activeSelectedEntries.length > 0
      ? activeSelectedEntries[0]
      : selectedEntries.length > 0
        ? selectedEntries[0]
        : null;
  const selectedProject = selectedEntry
    ? {
        ...selectedEntry,
        demoProject: allDemoProjectsList.find(
          (p) => p.id === selectedEntry.demoProjectId,
        ),
      }
    : null;

  const [selectingInProgress, setSelectingInProgress] = useState(false);
  const [showCompleteProjectDialog, setShowCompleteProjectDialog] =
    useState(false);
  const [projectSubmissionNotes, setProjectSubmissionNotes] = useState("");

  const selectProjectMutation = useMutation({
    mutationFn: async (demoProjectId: string) => {
      setSelectingInProgress(true);
      const res = await fetch("/api/intern/demo-projects/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ demoProjectId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to select project");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/demo-projects"],
      });
      toast({
        title: "Project Selected",
        description: "Project selected successfully. Loading tasks...",
      });
      setActiveSection("tasks");
      setSelectingInProgress(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setSelectingInProgress(false);
    },
  });

  const selectAdminProjectMutation = useMutation({
    mutationFn: async (adminProjectId: string) => {
      setSelectingInProgress(true);
      const res = await fetch("/api/intern/admin-projects/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ adminProjectId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to select project");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/demo-projects"],
      });
      toast({
        title: "Project Selected",
        description: "Project selected successfully. Loading tasks...",
      });
      setActiveSection("tasks");
      setSelectingInProgress(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setSelectingInProgress(false);
    },
  });

  const anySelectionPending =
    selectProjectMutation.isPending ||
    selectAdminProjectMutation.isPending ||
    selectingInProgress;
  const hasActiveProject = activeSelectedEntries.length > 0;

  const unselectProjectMutation = useMutation({
    mutationFn: async (internDemoProjectId: string) => {
      const res = await fetch(
        `/api/intern/demo-projects/${internDemoProjectId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to unselect project");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/demo-projects"],
      });
      toast({
        title: "Project Unselected",
        description: "You can now choose a different project.",
      });
      setActiveSection("projects");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completeProjectMutation = useMutation({
    mutationFn: async (vars: { id: string; submissionNotes: string }) => {
      const res = await fetch(
        `/api/intern/demo-projects/${vars.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            status: "completed",
            submissionNotes: vars.submissionNotes,
          }),
        },
      );
      if (!res.ok) {
        let msg = "Failed to complete project";
        try {
          const data = await res.json();
          if (data?.message) msg = data.message;
        } catch {}
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/demo-projects"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/internship-progress"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/me"] });
      setShowCompleteProjectDialog(false);
      setProjectSubmissionNotes("");
      toast({
        title: "Project Submitted",
        description: "Your project submission has been recorded.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to complete project.",
        variant: "destructive",
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      courseModuleId: string;
    }) => {
      const response = await fetch("/api/intern/create-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/tasks"] });
      setCreatingForModule(null);
      toast({ title: "Task created" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task.",
        variant: "destructive",
      });
    },
  });

  const startTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/intern/tasks/${taskId}/start`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to start task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/time-logs"] });
      toast({ title: "Task started" });
    },
  });

  const stopTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/intern/tasks/${taskId}/stop`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to stop task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/time-logs"] });
      toast({ title: "Task stopped" });
    },
  });

  const submitTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      notes,
      githubLink,
      status,
    }: {
      taskId: string;
      notes: string;
      githubLink: string;
      status: "pending" | "completed";
    }) => {
      const response = await fetch(`/api/intern/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, githubLink, status }),
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to submit task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/time-logs"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/course-progress"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/progress-summary"],
      });
      setShowSubmitDialog(false);
      setSelectedTask(null);
      setSubmitNotes("");
      setSubmitDescription("");
      setSubmitGithubLink("");
      setSubmitStatus("completed");
      toast({
        title: "Task submitted",
        description: "Module marked as completed!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cannot submit task yet",
        description: error.message || "Failed to submit task.",
        variant: "destructive",
      });
    },
  });

  // Hours requirement disabled
  // const { data: testTimeLogs = [] } = useQuery<any[]>({
  //   queryKey: ["/api/intern/time-logs"],
  //   queryFn: async () => {
  //     const res = await fetch("/api/intern/time-logs", { credentials: "include" });
  //     if (!res.ok) return [];
  //     return res.json();
  //   },
  // });
  // const testTotalMinutes = testTimeLogs.reduce((sum: number, log: any) => sum + (log.duration || 0), 0);
  // const testTotalHours = Math.floor(testTotalMinutes / 60);
  // const testHoursRequired = 20;
  // const testHoursComplete = testTotalHours >= testHoursRequired;

  const generateCertificateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/intern/certificates/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "training" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to generate certificate");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Certificate Generated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate certificate.",
        variant: "destructive",
      });
    },
  });

  const week4Modules = modules.filter((m) => m.weekNumber === 4);
  week4Modules.sort((a, b) => a.orderIndex - b.orderIndex);

  const isModuleCompleted = (moduleId: string) => {
    return progress.some((p) => p.moduleId === moduleId && p.completed);
  };

  const getModuleTask = (moduleId: string): Task | undefined => {
    return internTasks.find((t) => t.courseModuleId === moduleId);
  };

  const w4CompletedCount = week4Modules.filter((m) =>
    isModuleCompleted(m.id),
  ).length;
  const w4Total = week4Modules.length;
  const w4Percent =
    w4Total > 0 ? Math.round((w4CompletedCount / w4Total) * 100) : 0;

  const modulesByPhase = week4Modules.reduce<Record<string, CourseModule[]>>(
    (acc, mod) => {
      const cat = mod.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(mod);
      return acc;
    },
    {},
  );

  const phaseOrder = derivePhaseOrder(week4Modules);

  const phaseDescriptionText =
    phaseOrder.length > 0
      ? `Complete all tasks across ${phaseOrder.length} phases: ${phaseOrder.map((p) => ALL_PHASE_TITLES[p] || p.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())).join(" → ")}.`
      : "Complete all project tasks.";

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, "default" | "secondary" | "outline"> = {
      frontend: "default",
      backend: "secondary",
      fullstack: "outline",
      blockchain: "default",
      mobile: "secondary",
    };
    return colors[category?.toLowerCase() || ""] || "secondary";
  };

  if (selectedProject && activeSection === "tasks") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-purple-400" />
            <h2
              className="text-xl font-bold"
              data-testid="text-project-tasks-title"
            >
              {selectedProject.demoProject?.name || "Project"} — Tasks
            </h2>
          </div>
          <Button
            variant="outline"
            onClick={() => setActiveSection("options")}
            data-testid="button-back-to-project"
          >
            Back to Project
          </Button>
        </div>

        <Card className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-purple-500/20">
          <CardContent className="pt-6 space-y-4">
            <p className="text-muted-foreground">
                         <ReadMore
    text={phaseDescriptionText}
    wordLimit={50}
  /></p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-muted-foreground">
                  Project Progress
                </span>
                <span
                  className="text-sm font-bold text-purple-400"
                  data-testid="text-w4-progress"
                >
                  {w4CompletedCount} / {w4Total} tasks — {w4Percent}%
                </span>
              </div>
              <Progress
                value={w4Percent}
                className="h-3"
                data-testid="progress-w4"
              />
            </div>
          </CardContent>
        </Card>

        {w4Percent >= 100 &&
          progressSummary &&
          progressSummary.percentage >= 100 && (
            <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500/30">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                  <div className="flex-1">
                    <p
                      className="font-bold text-lg"
                      data-testid="text-project-complete"
                    >
                      All Project Tasks Completed!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You can now generate your certificate and proceed.
                    </p>
                  </div>
                </div>
                {/* Hours requirement UI hidden */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => generateCertificateMutation.mutate()}
                    disabled={generateCertificateMutation.isPending}
                    data-testid="button-generate-cert"
                  >
                    {generateCertificateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Award className="h-4 w-4 mr-2" />
                    )}
                    Generate Training Certificate
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/intern/certificates")}
                    data-testid="button-view-certs"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    View Certificates
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/intern/terms")}
                    data-testid="button-go-terms"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Proceed to Terms & Conditions
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        <Accordion
          type="multiple"
          defaultValue={phaseOrder}
          className="space-y-4"
        >
          {phaseOrder.map((phase, phaseIdx) => {
            const phaseModules = modulesByPhase[phase] || [];
            const phaseCompleted = phaseModules.filter((m) =>
              isModuleCompleted(m.id),
            ).length;
            const phasePercent =
              phaseModules.length > 0
                ? Math.round((phaseCompleted / phaseModules.length) * 100)
                : 0;

            return (
              <AccordionItem
                key={phase}
                value={phase}
                className="border rounded-md px-4 border-purple-500/20"
                data-testid={`accordion-phase-${phase}`}
              >
                <AccordionTrigger
                  className="hover:no-underline"
                  data-testid={`trigger-phase-${phase}`}
                >
                  <div className="flex items-center gap-3 flex-wrap flex-1">
                    <span className="font-semibold text-left flex-1">
                      {getPhaseLabel(phase, phaseIdx)}
                    </span>
                    <Badge
                      variant={
                        phaseCompleted === phaseModules.length &&
                        phaseModules.length > 0
                          ? "default"
                          : "secondary"
                      }
                    >
                      {phaseCompleted}/{phaseModules.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {phaseModules.length > 0 && (
                      <div className="mb-3">
                        <Progress value={phasePercent} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {phasePercent}% complete
                        </p>
                      </div>
                    )}
                    {phaseModules.map((mod) => {
                      const completed = isModuleCompleted(mod.id);
                      const task = getModuleTask(mod.id);

                      return (
                        <Card
                          key={mod.id}
                          className={`${completed ? "border-green-500/30 bg-green-900/10" : task?.status === "running" ? "border-blue-500/30 bg-blue-900/10" : "border-muted"}`}
                          data-testid={`module-card-${mod.id}`}
                        >
                          <CardContent className="py-4 px-4">
                            <div className="flex items-start gap-3">
                              <div className="pt-0.5">
                                {completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : task?.status === "running" ? (
                                  <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4
                                  className={`font-medium ${completed ? "text-green-400" : ""}`}
                                >
                                  {mod.title}
                                </h4>
                                {mod.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    
                                                                         <ReadMore text={mod.description} wordLimit={50} />
                                  </p>
                                )}
                                {task && (
                                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    <Badge
                                      variant={
                                        task.status === "completed"
                                          ? "default"
                                          : task.status === "running"
                                            ? "secondary"
                                            : "outline"
                                      }
                                      className={
                                        task.status === "completed"
                                          ? "bg-green-600"
                                          : task.status === "running"
                                            ? "bg-blue-600 text-white"
                                            : ""
                                      }
                                    >
                                      {task.status === "completed"
                                        ? "Completed"
                                        : task.status === "running"
                                          ? "In Progress"
                                          : "Pending"}
                                    </Badge>
                                    {task.submittedGithubLink && (
                                      <a
                                        href={task.submittedGithubLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                                      >
                                        <Github className="h-3 w-3" />
                                        GitHub
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    )}
                                    {task.submittedNotes && (
                                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                        {task.submittedNotes}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {completed ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-green-400"
                                  >
                                    Completed
                                  </Badge>
                                ) : !task ? (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setCreatingForModule(mod.id);
                                      createTaskMutation.mutate({
                                        title: mod.title,
                                        description:
                                          mod.description ||
                                          `Project task: ${mod.title}`,
                                        courseModuleId: mod.id,
                                      });
                                    }}
                                    disabled={
                                      createTaskMutation.isPending &&
                                      creatingForModule === mod.id
                                    }
                                  >
                                    {createTaskMutation.isPending &&
                                    creatingForModule === mod.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Play className="h-4 w-4 mr-1" />
                                        Start Task
                                      </>
                                    )}
                                  </Button>
                                ) : task.status === "pending" ? (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() =>
                                        startTaskMutation.mutate(task.id)
                                      }
                                      disabled={startTaskMutation.isPending}
                                    >
                                      <Play className="h-4 w-4 mr-1" />
                                      Start
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700"
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setSubmitDescription(
                                          task.description || "",
                                        );
                                        setShowSubmitDialog(true);
                                      }}
                                    >
                                      <Send className="h-4 w-4 mr-1" />
                                      Submit
                                    </Button>
                                  </div>
                                ) : task.status === "running" ? (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-500 text-red-400 hover:bg-red-900/20"
                                      onClick={() =>
                                        stopTaskMutation.mutate(task.id)
                                      }
                                      disabled={stopTaskMutation.isPending}
                                    >
                                      <Square className="h-4 w-4 mr-1" />
                                      Stop
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700"
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setSubmitDescription(
                                          task.description || "",
                                        );
                                        setShowSubmitDialog(true);
                                      }}
                                    >
                                      <Send className="h-4 w-4 mr-1" />
                                      Submit
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Submit Task for Review</DialogTitle>
              <DialogDescription>
                Submit your completed work for admin review.
              </DialogDescription>
            </DialogHeader>
            {(() => {
              const taskLogs = selectedTask
                ? timeLogs.filter((l) => l.taskId === selectedTask.id)
                : [];
              const totalWorkMs = taskLogs.reduce((sum, l) => {
                const start = l.startTime
                  ? new Date(l.startTime).getTime()
                  : 0;
                const end = l.endTime
                  ? new Date(l.endTime).getTime()
                  : nowTick;
                if (!start) return sum;
                return sum + Math.max(0, end - start);
              }, 0);
              const workedMin = Math.floor(totalWorkMs / 60000);
              const meetsMinTime = totalWorkMs >= MIN_WORK_MS;
              const remainingMin = meetsMinTime
                ? 0
                : Math.ceil((MIN_WORK_MS - totalWorkMs) / 60000);
              const notesFilled = submitNotes.trim().length > 0;
              const canSubmit = meetsMinTime && notesFilled;
              return (
                <>
                  <div className="space-y-4">
                    <p>
                      You are about to submit "{selectedTask?.title}" for admin
                      review.
                    </p>
                    <div
                      className={`flex items-start gap-3 p-3 rounded-md border text-sm ${
                        meetsMinTime
                          ? "bg-green-500/10 border-green-500/20 text-green-400"
                          : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                      }`}
                      data-testid="submit-time-notice"
                    >
                      <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div>
                        {meetsMinTime ? (
                          <p>
                            Worked {workedMin} min on this task. You can submit
                            now.
                          </p>
                        ) : (
                          <p>
                            You must work on this task for at least 30 minutes
                            before submitting. Worked {workedMin} min so far —
                            {" "}
                            {remainingMin} min remaining.
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select
                        value={submitStatus}
                        onValueChange={(v) =>
                          setSubmitStatus(v as "pending" | "completed")
                        }
                      >
                        <SelectTrigger data-testid="select-submit-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>
                        Work Notes <span className="text-red-400">*</span>
                      </Label>
                      <Textarea
                        value={submitNotes}
                        onChange={(e) => setSubmitNotes(e.target.value)}
                        placeholder="Describe what you worked on (required)..."
                        data-testid="input-submit-notes"
                        className={
                          !notesFilled ? "border-yellow-500/40" : undefined
                        }
                      />
                      {!notesFilled && (
                        <p className="text-xs text-yellow-400 mt-1">
                          Work notes are required to submit this task.
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>GitHub Link (optional)</Label>
                      <Input
                        value={submitGithubLink}
                        onChange={(e) => setSubmitGithubLink(e.target.value)}
                        placeholder="https://github.com/username/repo"
                        data-testid="input-submit-github"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowSubmitDialog(false)}
                      data-testid="button-cancel-submit"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (!selectedTask) return;
                        submitTaskMutation.mutate({
                          taskId: selectedTask.id,
                          notes: submitNotes.trim(),
                          githubLink: submitGithubLink,
                          status: submitStatus,
                        });
                      }}
                      disabled={!canSubmit || submitTaskMutation.isPending}
                      data-testid="button-confirm-submit"
                    >
                      {submitTaskMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Submit Task
                    </Button>
                  </DialogFooter>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-6 w-6 text-muted-foreground" />
          <h2
            className="text-xl font-semibold"
            data-testid="text-selected-project-title"
          >
            Selected Demo Project
          </h2>
        </div>

        <Card data-testid="card-selected-project">
          <CardHeader>
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg" data-testid="text-project-name">
                {selectedProject.demoProject?.name || "Demo Project"}
              </CardTitle>
              <Badge
                variant={
                  selectedProject.status === "completed"
                    ? "secondary"
                    : "default"
                }
                data-testid="badge-project-status"
              >
                {selectedProject.status === "completed" ? (
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3" /> Completed
                  </span>
                ) : (
                  "In Progress"
                )}
              </Badge>
            </div>
            {selectedProject.demoProject?.description && (
              <CardDescription data-testid="text-project-description">
               
                                 <ReadMore
    text={selectedProject.demoProject.description}
    wordLimit={50}
  />
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedProject.demoProject?.category && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Category:
                  </span>
                  <Badge
                    variant={getCategoryColor(
                      selectedProject.demoProject.category,
                    )}
                  >
                    {selectedProject.demoProject.category}
                  </Badge>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                Started:{" "}
                {selectedProject.createdAt
                  ? new Date(selectedProject.createdAt).toLocaleDateString()
                  : "-"}
              </div>

              {w4Total > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Task Progress
                    </span>
                    <span className="text-sm font-bold text-purple-400">
                      {w4CompletedCount}/{w4Total} — {w4Percent}%
                    </span>
                  </div>
                  <Progress value={w4Percent} className="h-2" />
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                {selectedProject.status !== "completed" && (
                  <>
                    <Button
                      onClick={() => setActiveSection("tasks")}
                      data-testid="button-go-to-tasks"
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Create & Manage Tasks
                    </Button>
                    {w4Total > 0 && w4Percent === 100 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setProjectSubmissionNotes(
                            (selectedProject as any)?.submissionNotes || "",
                          );
                          setShowCompleteProjectDialog(true);
                        }}
                        data-testid="button-complete-project"
                      >
                        <Rocket className="h-4 w-4 mr-2" />
                        Complete Project
                      </Button>
                    )}
                    {w4Percent < 100 && (
                      <Button
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to unselect this project? All task progress will be lost.",
                            )
                          ) {
                            unselectProjectMutation.mutate(selectedProject.id);
                          }
                        }}
                        disabled={unselectProjectMutation.isPending}
                        data-testid="button-unselect-project"
                      >
                        {unselectProjectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Unselect & Choose Other
                      </Button>
                    )}
                  </>
                )}
                {selectedProject.status === "completed" && (
                  <>
                    <Button
                      onClick={() => setActiveSection("tasks")}
                      data-testid="button-view-tasks"
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      View Tasks & Progress
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setLocation("/intern/terms")}
                      data-testid="button-go-to-terms"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Proceed to Terms & Conditions
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog
          open={showCompleteProjectDialog}
          onOpenChange={(open) => {
            if (!completeProjectMutation.isPending)
              setShowCompleteProjectDialog(open);
          }}
        >
          <DialogContent data-testid="dialog-complete-project">
            <DialogHeader>
              <DialogTitle>Submit & Complete Project</DialogTitle>
              <DialogDescription>
                Share the links and details of the work you completed for this
                project. Your submission will be saved as your Week 4 task
                deliverable for admin review.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="project-submission-notes-selected">
                Project Links & Submission Details
              </Label>
              <Textarea
                id="project-submission-notes-selected"
                data-testid="textarea-project-submission"
                rows={8}
                placeholder={
                  "Paste your project links (GitHub repo, live website, docs, social posts) and a short description of what you built and the results achieved."
                }
                value={projectSubmissionNotes}
                onChange={(e) => setProjectSubmissionNotes(e.target.value)}
                disabled={completeProjectMutation.isPending}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCompleteProjectDialog(false)}
                disabled={completeProjectMutation.isPending}
                data-testid="button-cancel-complete-project"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const sp: any = selectedProject;
                  if (!sp) return;
                  completeProjectMutation.mutate({
                    id: sp.id,
                    submissionNotes: projectSubmissionNotes,
                  });
                }}
                disabled={
                  completeProjectMutation.isPending ||
                  !projectSubmissionNotes.trim()
                }
                data-testid="button-submit-complete-project"
              >
                {completeProjectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Submit & Complete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (activeSection === "projects") {
    const hasAdminProjects = adminTestProjects.length > 0;

    const projectsToShow = hasAdminProjects ? adminTestProjects : demoProjects;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <FolderKanban className="h-6 w-6 text-muted-foreground" />
            <h2 className="text-xl font-semibold">
              {hasAdminProjects
                ? "Select a Test Project"
                : "Select a Demo Project"}
            </h2>
          </div>

          <Button
            variant="outline"
            onClick={() => setActiveSection("options")}
            data-testid="button-back-to-options"
          >
            Back
          </Button>
        </div>

        {/* Loader */}
        {loadingProjects ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : projectsToShow.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No projects available at this time.
            </CardContent>
          </Card>
        ) : (
          /* Project Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectsToShow.map((project: any) => {
              const isAdmin = hasAdminProjects;

              return (
                <Card key={project.id}>
                  <CardHeader>
                    {/* Title + Category */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <CardTitle className="text-lg">{project.name}</CardTitle>

                      {project.category && (
                        <Badge
                          variant={
                            isAdmin
                              ? "outline"
                              : getCategoryColor(project.category)
                          }
                          className="text-xs"
                        >
                          {project.category}
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    {project.description && (
                       <ReadMore text={project.description} wordLimit={50} />
                    )}

                    {/* Links (only for admin/test projects) */}
                    {isAdmin && (
                      <div className="flex flex-col gap-1 mt-1">
                        {project.repositoryUrl && (
                          <a
                            href={project.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                          >
                            <Github className="h-3.5 w-3.5" />
                            GitHub Repository
                          </a>
                        )}

                        {project.deployedUrl && (
                          <a
                            href={project.deployedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Project URL
                          </a>
                        )}
                      </div>
                    )}
                  </CardHeader>

                  {/* Button */}
                  <CardContent>
                    <Button
                      className="w-full"
                      onClick={() =>
                        isAdmin
                          ? selectAdminProjectMutation.mutate(project.id)
                          : selectProjectMutation.mutate(project.id)
                      }
                      disabled={anySelectionPending || hasActiveProject}
                    >
                      {anySelectionPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : hasActiveProject ? (
                        <Lock className="h-4 w-4 mr-2" />
                      ) : (
                        <FolderKanban className="h-4 w-4 mr-2" />
                      )}

                      {hasActiveProject
                        ? "Project Already Selected"
                        : "Select Project"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Rocket className="h-6 w-6 text-muted-foreground" />
        <h2
          className="text-xl font-semibold"
          data-testid="text-test-path-title"
        >
          Entrance Test Path
        </h2>
      </div>

      <p className="text-muted-foreground">
        Choose one of the following options to proceed with your qualification:
      </p>

      {loadingProjects ? (
        <div className="flex items-center justify-center py-12">
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            data-testid="loader-options"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className="hover-elevate cursor-pointer"
            data-testid="card-take-test"
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600">
                <FileQuestion className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Take Entrance Test</CardTitle>
              <CardDescription>
                Complete the entrance exam to demonstrate your knowledge and
                skills.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                className="w-full"
                data-testid="button-take-test"
                onClick={() => setActiveSection("projects")}
              >
                <FileQuestion className="h-4 w-4 mr-2" />
                Start Entrance Test
              </Button>
            </CardContent>
          </Card>

          <Card
            className="hover-elevate cursor-pointer"
            data-testid="card-select-project"
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-md bg-gradient-to-br from-green-500 to-teal-600">
                <FolderKanban className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl">Select a Project</CardTitle>
              <CardDescription>
                Choose a demo project to work on and showcase your practical
                abilities.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                className="w-full"
                onClick={() => setActiveSection("projects")}
                data-testid="button-browse-projects"
              >
                <FolderKanban className="h-4 w-4 mr-2" />
                Browse Projects
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog
        open={showCompleteProjectDialog}
        onOpenChange={(open) => {
          if (!completeProjectMutation.isPending)
            setShowCompleteProjectDialog(open);
        }}
      >
        <DialogContent data-testid="dialog-complete-project">
          <DialogHeader>
            <DialogTitle>Submit & Complete Project</DialogTitle>
            <DialogDescription>
              Share the links and details of the work you completed for this
              project. Your submission will be saved as your Week 4 task
              deliverable for admin review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="project-submission-notes">
              Project Links & Submission Details
            </Label>
            <Textarea
              id="project-submission-notes"
              data-testid="textarea-project-submission"
              rows={8}
              placeholder={
                "Paste your project links (GitHub repo, live website, docs, social posts) and a short description of what you built and the results achieved."
              }
              value={projectSubmissionNotes}
              onChange={(e) => setProjectSubmissionNotes(e.target.value)}
              disabled={completeProjectMutation.isPending}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteProjectDialog(false)}
              disabled={completeProjectMutation.isPending}
              data-testid="button-cancel-complete-project"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const sp: any = selectedProject;
                if (!sp) return;
                completeProjectMutation.mutate({
                  id: sp.id,
                  submissionNotes: projectSubmissionNotes,
                });
              }}
              disabled={
                completeProjectMutation.isPending ||
                !projectSubmissionNotes.trim()
              }
              data-testid="button-submit-complete-project"
            >
              {completeProjectMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
