import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Circle,
  BookOpen,
  Trophy,
  Loader2,
  ArrowRight,
  Award,
  FileText,
  Play,
  Send,
  ExternalLink,
  Github,
  Clock,
  Square,
  Zap,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CategoryInfoCard from "./CategoryInfoCard";
import type {
  CourseModule,
  CourseProgress,
  Task,
} from "@shared/schema";

interface ProgressSummary {
  total: number;
  completed: number;
  percentage: number;
}

const WEEK_TITLES: Record<number, string> = {
  1: "Foundations & Core Essentials",
  2: "Intermediate Mechanics & Asset Creation",
  3: "Advanced Optimization & Strategy",
  4: "Final Project",
};

export default function InternTrainingModule() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submitNotes, setSubmitNotes] = useState("");
  const [submitDescription, setSubmitDescription] = useState("");
  const [submitGithubLink, setSubmitGithubLink] = useState("");
  const [creatingForModule, setCreatingForModule] = useState<string | null>(
    null,
  );

  const { data: modules = [], isLoading: modulesLoading } = useQuery<
    CourseModule[]
  >({
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

  const { data: progress = [], isLoading: progressLoading } = useQuery<
    CourseProgress[]
  >({
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

  const { data: progressSummary, isLoading: summaryLoading } =
    useQuery<ProgressSummary>({
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

  const { data: subcategories = [] } = useQuery<any[]>({
    queryKey: ["/api/subcategories"],
    queryFn: async () => {
      const res = await fetch("/api/subcategories", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const getSubcategoryName = (id: string | null | undefined) => {
    if (!id) return null;
    const sub = subcategories.find((s: any) => s.id === id);
    return sub?.name || null;
  };

  const { data: internStatus } = useQuery<any>({
    queryKey: ["/api/intern/status"],
    queryFn: async () => {
      const res = await fetch("/api/intern/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
  });

  // Hours requirement disabled
  // const { data: timeLogs = [] } = useQuery<any[]>({
  //   queryKey: ["/api/intern/time-logs"],
  //   queryFn: async () => {
  //     const res = await fetch("/api/intern/time-logs", { credentials: "include" });
  //     if (!res.ok) return [];
  //     return res.json();
  //   },
  // });
  // const totalMinutesLogged = timeLogs.reduce((sum: number, log: any) => sum + (log.duration || 0), 0);
  // const totalHoursLogged = Math.floor(totalMinutesLogged / 60);
  // const trainingHoursRequired = 20;
  // const trainingHoursComplete = totalHoursLogged >= trainingHoursRequired;

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
      toast({
        title: "Certificate Generated",
        description: "Your training certificate has been generated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate certificate.",
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
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/tasks"] });
      setCreatingForModule(null);
      toast({
        title: "Task created",
        description: "You can now start working on this module task.",
      });
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
      toast({ title: "Task stopped" });
    },
  });

  const submitTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      notes,
      githubLink,
    }: {
      taskId: string;
      notes: string;
      githubLink: string;
    }) => {
      const response = await fetch(`/api/intern/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, githubLink, status: "completed" }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to submit task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/tasks"] });
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
      toast({
        title: "Task submitted",
        description: "Module marked as completed!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit task.",
        variant: "destructive",
      });
    },
  });

  const isModuleCompleted = (moduleId: string) => {
    return progress.some((p) => p.moduleId === moduleId && p.completed);
  };

  const getModuleTask = (moduleId: string): Task | undefined => {
    return internTasks.find((t) => t.courseModuleId === moduleId);
  };

  const modulesByWeek = modules.reduce<Record<number, CourseModule[]>>(
    (acc, mod) => {
      const week = mod.weekNumber;
      if (!acc[week]) acc[week] = [];
      acc[week].push(mod);
      return acc;
    },
    {},
  );

  Object.values(modulesByWeek).forEach((weekModules) => {
    weekModules.sort((a, b) => a.orderIndex - b.orderIndex);
  });

  const isWeekUnlocked = (weekNum: number): boolean => {
    if (weekNum === 1) return true;
    const prevWeekModules = modulesByWeek[weekNum - 1] || [];
    if (prevWeekModules.length === 0) return true;
    return prevWeekModules.every((m) => isModuleCompleted(m.id));
  };

  const weeks1to3Modules = [
    ...(modulesByWeek[1] || []),
    ...(modulesByWeek[2] || []),
    ...(modulesByWeek[3] || []),
  ];
  const allWeeks1to3Done =
    weeks1to3Modules.length > 0 &&
    weeks1to3Modules.every((m) => isModuleCompleted(m.id));

  // Compute Training Course progress from the modules actually shown on this
  // page (already filtered by the intern's category/subcategory) so the total
  // always reflects all 4 weeks of the chosen training, regardless of the
  // intern's qualification path at registration time.
  const totalModulesCount = modules.length;
  const completedModulesCount = modules.filter((m) =>
    isModuleCompleted(m.id),
  ).length;
  const progressPercent =
    totalModulesCount > 0
      ? Math.round((completedModulesCount / totalModulesCount) * 100)
      : 0;
  const isLoading = modulesLoading || progressLoading || summaryLoading;

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center py-20"
        data-testid="loading-spinner"
      >
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-purple-500/20">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <BookOpen className="h-6 w-6 text-purple-400" />
            <h2 className="text-xl font-bold" data-testid="text-training-title">
              4-Week Training Course
            </h2>
          </div>
          <p className="text-muted-foreground">
            Complete all modules week by week. Start each task, work on it, then
            submit with your notes and GitHub link.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Overall Progress
              </span>
              <span
                className="text-sm font-bold text-purple-400"
                data-testid="text-progress-percent"
              >
                {completedModulesCount} / {totalModulesCount} modules —{" "}
                {progressPercent}%
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-3"
              data-testid="progress-bar"
            />
          </div>
          {progressPercent < 100 && (
            <div className="pt-2 flex items-center gap-3 border-t border-purple-500/10 mt-2">
              <Zap className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                {allWeeks1to3Done
                  ? "Weeks 1-3 completed! Proceed to:"
                  : "Want to skip ahead?"}
              </span>
              <Button
                variant={allWeeks1to3Done ? "default" : "outline"}
                size="sm"
                onClick={() => setLocation("/intern/direct-exam")}
                className={
                  allWeeks1to3Done ? "bg-purple-600 hover:bg-purple-700" : ""
                }
                data-testid="button-direct-exam-shortcut"
              >
                <Zap className="h-4 w-4 mr-1" />
                Test & Projects
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {internStatus?.categoryName && (
        <CategoryInfoCard
          categoryName={internStatus.categoryName}
          subcategoryName={internStatus.subcategoryName}
          categoryId={internStatus.categoryId}
        />
      )}

      {progressPercent >= 100 && (
        <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <div className="flex-1">
                <p
                  className="font-bold text-lg"
                  data-testid="text-completion-message"
                >
                  Successfully Completed Course Programming
                </p>
                <p className="text-sm text-muted-foreground">
                  Congratulations on completing all training modules!
                </p>
              </div>
            </div>

            {/* Hours requirement UI hidden
            <div className="rounded-lg border p-4 space-y-3" data-testid="training-hours-progress-card">
              ...
            </div>
            */}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => generateCertificateMutation.mutate()}
                disabled={generateCertificateMutation.isPending}
                data-testid="button-generate-certificate"
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
                data-testid="button-view-certificates"
              >
                <Award className="h-4 w-4 mr-2" />
                View Certificates
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
            </div>
          </CardContent>
        </Card>
      )}

      <Accordion
        type="multiple"
        defaultValue={["week-1"]}
        className="space-y-4"
      >
        {[1, 2, 3, 4].map((weekNum) => {
          const weekModules = modulesByWeek[weekNum] || [];
          const completedCount = weekModules.filter((m) =>
            isModuleCompleted(m.id),
          ).length;
          const unlocked = isWeekUnlocked(weekNum);
          const weekProgress =
            weekModules.length > 0
              ? Math.round((completedCount / weekModules.length) * 100)
              : 0;

          return (
            <AccordionItem
              key={weekNum}
              value={`week-${weekNum}`}
              className={`border rounded-md px-4 ${unlocked ? "border-purple-500/20" : "border-muted opacity-60"}`}
              data-testid={`accordion-week-${weekNum}`}
            >
              <AccordionTrigger
                className="hover:no-underline"
                data-testid={`trigger-week-${weekNum}`}
              >
                <div className="flex items-center gap-3 flex-wrap flex-1">
                  <Badge
                    variant="outline"
                    className={
                      unlocked
                        ? "border-purple-500/40 text-purple-400"
                        : "border-muted text-muted-foreground"
                    }
                  >
                    Week {weekNum}
                  </Badge>
                  <span className="font-semibold text-left flex-1">
                    {WEEK_TITLES[weekNum]}
                  </span>
                  {!unlocked && (
                    <Badge variant="secondary" className="text-orange-400">
                      Locked
                    </Badge>
                  )}
                  <Badge
                    variant={
                      completedCount === weekModules.length &&
                      weekModules.length > 0
                        ? "default"
                        : "secondary"
                    }
                  >
                    {completedCount}/{weekModules.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {!unlocked ? (
                  <div className="py-4 text-center text-muted-foreground text-sm">
                    Complete all tasks in Week {weekNum - 1} to unlock this
                    week.
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    {weekModules.length > 0 && (
                      <div className="mb-3">
                        <Progress value={weekProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {weekProgress}% complete
                        </p>
                      </div>
                    )}
                    {weekModules.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No modules available for this week.
                      </p>
                    ) : (
                      (() => {
                        const groups = new Map<
                          string,
                          { name: string; modules: CourseModule[] }
                        >();
                        weekModules.forEach((m) => {
                          const subId =
                            (m as any).subcategoryId || "__general__";
                          const subName =
                            subId === "__general__"
                              ? "General"
                              : getSubcategoryName(subId) || "General";
                          if (!groups.has(subId))
                            groups.set(subId, { name: subName, modules: [] });
                          groups.get(subId)!.modules.push(m);
                        });
                        const groupArray = Array.from(groups.entries()).sort(
                          (a, b) => {
                            if (a[0] === "__general__") return 1;
                            if (b[0] === "__general__") return -1;
                            return a[1].name.localeCompare(b[1].name);
                          },
                        );
                        return groupArray.map(([subId, group]) => (
                          <div key={subId} className="space-y-2 mb-3">
                            <div className="flex items-center gap-2 mt-2 mb-1">
                              <Badge
                                variant="outline"
                                className="border-blue-500/40 text-blue-400 text-xs"
                                data-testid={`badge-subcategory-${subId}`}
                              >
                                {group.name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {
                                  group.modules.filter((m) =>
                                    isModuleCompleted(m.id),
                                  ).length
                                }
                                /{group.modules.length}
                              </span>
                            </div>
                            {group.modules.map((mod) => {
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
                                          <CheckCircle2
                                            className="h-5 w-5 text-green-500"
                                            data-testid={`icon-completed-${mod.id}`}
                                          />
                                        ) : task?.status === "running" ? (
                                          <Clock
                                            className="h-5 w-5 text-blue-500 animate-pulse"
                                            data-testid={`icon-running-${mod.id}`}
                                          />
                                        ) : (
                                          <Circle
                                            className="h-5 w-5 text-muted-foreground"
                                            data-testid={`icon-incomplete-${mod.id}`}
                                          />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4
                                          className={`font-medium ${completed ? "text-green-400" : ""}`}
                                          data-testid={`text-module-title-${mod.id}`}
                                        >
                                          {mod.title}
                                        </h4>
                                        {mod.description && (
                                          <p
                                            className="text-sm text-muted-foreground mt-1"
                                            data-testid={`text-module-description-${mod.id}`}
                                          >
                                            {mod.description}
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
                                              data-testid={`badge-task-status-${mod.id}`}
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
                                                data-testid={`link-github-${mod.id}`}
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
                                            data-testid={`badge-completed-${mod.id}`}
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
                                                  `Training module: ${mod.title}`,
                                                courseModuleId: mod.id,
                                              });
                                            }}
                                            disabled={
                                              createTaskMutation.isPending &&
                                              creatingForModule === mod.id
                                            }
                                            data-testid={`button-start-module-${mod.id}`}
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
                                                startTaskMutation.mutate(
                                                  task.id,
                                                )
                                              }
                                              disabled={
                                                startTaskMutation.isPending
                                              }
                                              data-testid={`button-run-task-${mod.id}`}
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
                                              data-testid={`button-submit-task-${mod.id}`}
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
                                              disabled={
                                                stopTaskMutation.isPending
                                              }
                                              data-testid={`button-stop-task-${mod.id}`}
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
                                              data-testid={`button-submit-running-${mod.id}`}
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
                        ));
                      })()
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Task: {selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Textarea
                value={submitDescription}
                onChange={(e) => setSubmitDescription(e.target.value)}
                placeholder="Describe what you worked on..."
                rows={3}
                data-testid="input-submit-description"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={submitNotes}
                onChange={(e) => setSubmitNotes(e.target.value)}
                placeholder="Any additional notes about your work..."
                rows={2}
                data-testid="input-submit-notes"
              />
            </div>
            <div>
              <Label>GitHub Link</Label>
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
                  notes: [submitDescription, submitNotes]
                    .filter(Boolean)
                    .join("\n\n"),
                  githubLink: submitGithubLink,
                });
              }}
              disabled={submitTaskMutation.isPending}
              data-testid="button-confirm-submit"
            >
              {submitTaskMutation.isPending ? (
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
