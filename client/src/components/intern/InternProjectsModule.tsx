import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { ReadMore } from "@/components/ui/readmore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FolderKanban,
  Plus,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Award,
  Users,
  Rocket,
  Github,
  ExternalLink,
  Play,
  Square,
  Send,
  Clock,
  XCircle,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type {
  DemoProject,
  InternDemoProject,
  InternshipProjectTask,
  Project,
  Task,
  SubProject,
  InternSubProject,
  SubProjectTask,
  TimeLog,
} from "@shared/schema";

const MIN_WORK_MS = 30 * 60 * 1000;

const PHASE_ICONS: Record<number, string> = {
  1: "📋",
  2: "🛠️",
  3: "🔧",
  4: "🚀",
  5: "📤",
  6: "🌐",
  7: "✅",
};

function ProjectTasksPanel({
  internDemoProject,
  projectName,
}: {
  internDemoProject: InternDemoProject;
  projectName: string;
}) {
  const { toast } = useToast();
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(
    new Set([1, 2, 3, 4, 5, 6, 7]),
  );
  const [creatingForSubtask, setCreatingForSubtask] = useState<string | null>(
    null,
  );
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submitNotes, setSubmitNotes] = useState("");
  const [submitDescription, setSubmitDescription] = useState("");
  const [submitGithubLink, setSubmitGithubLink] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"pending" | "completed">(
    "completed",
  );
  const [nowTick, setNowTick] = useState(Date.now());

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

  const { data: subtasks = [], isLoading } = useQuery<InternshipProjectTask[]>({
    queryKey: ["/api/intern/internship-tasks", internDemoProject.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/intern/internship-tasks/${internDemoProject.id}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const { data: internTasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/intern/tasks"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      internshipProjectTaskId: string;
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
      setCreatingForSubtask(null);
      toast({
        title: "Task created",
        description: "You can now start working on this subtask.",
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
        queryKey: ["/api/intern/internship-tasks", internDemoProject.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/internship-progress"],
      });
      setShowSubmitDialog(false);
      setSelectedTask(null);
      setSubmitNotes("");
      setSubmitDescription("");
      setSubmitGithubLink("");
      setSubmitStatus("completed");
      toast({
        title: "Task submitted",
        description: "Subtask marked as completed!",
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

  const getSubtaskTask = (subtaskId: string): Task | undefined => {
    return internTasks.find((t) => t.internshipProjectTaskId === subtaskId);
  };

  const togglePhase = (phase: number) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const phases = Array.from(new Set(subtasks.map((t) => t.phaseNumber))).sort();
  const totalTasks = subtasks.length;
  const completedTasks = subtasks.filter((t) => t.completed).length;
  const projectPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const projectDone = projectPercent === 100;

  return (
    <div
      className="space-y-4"
      data-testid={`project-tasks-${internDemoProject.id}`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">{projectName}</h3>
        {projectDone ? (
          <Badge
            className="bg-green-600 text-white"
            data-testid="badge-project-complete"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
          </Badge>
        ) : (
          <Badge variant="outline">
            {completedTasks}/{totalTasks} tasks
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Project Progress</span>
          <span>{projectPercent}%</span>
        </div>
        <Progress value={projectPercent} className="h-2" />
      </div>

      <div className="space-y-2">
        {phases.map((phaseNum) => {
          const phaseTasks = subtasks.filter((t) => t.phaseNumber === phaseNum);
          const phaseName = phaseTasks[0]?.phaseName || `Phase ${phaseNum}`;
          const phaseCompleted = phaseTasks.filter((t) => t.completed).length;
          const phaseTotal = phaseTasks.length;
          const phaseDone = phaseCompleted === phaseTotal;
          const isExpanded = expandedPhases.has(phaseNum);

          return (
            <div
              key={phaseNum}
              className={`border rounded-lg overflow-hidden ${phaseDone ? "border-green-500/30 bg-green-500/5" : "border-border"}`}
              data-testid={`phase-${phaseNum}`}
            >
              <button
                className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left"
                onClick={() => togglePhase(phaseNum)}
                data-testid={`toggle-phase-${phaseNum}`}
              >
                <span className="text-lg">{PHASE_ICONS[phaseNum]}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium flex-1">
                  {phaseNum}. {phaseName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {phaseCompleted}/{phaseTotal}
                </span>
                {phaseDone && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-2 space-y-1">
                  {phaseTasks.map((subtask) => {
                    const task = getSubtaskTask(subtask.id);
                    const completed = subtask.completed;

                    return (
                      <Card
                        key={subtask.id}
                        className={`border-0 shadow-none ${completed ? "bg-green-500/5" : ""}`}
                        data-testid={`subtask-${subtask.id}`}
                      >
                        <CardContent className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : task ? (
                                <div className="h-5 w-5 rounded-full border-2 border-blue-500 bg-blue-500/20" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4
                                className={`font-medium text-sm ${completed ? "text-green-400" : ""}`}
                                data-testid={`text-subtask-title-${subtask.id}`}
                              >
                                {subtask.subtaskName}
                              </h4>
                              {task && (
                                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
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
                                    data-testid={`badge-task-status-${subtask.id}`}
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
                                      data-testid={`link-github-${subtask.id}`}
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
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {completed ? (
                                <Badge
                                  variant="secondary"
                                  className="text-green-400"
                                  data-testid={`badge-completed-${subtask.id}`}
                                >
                                  Completed
                                </Badge>
                              ) : !task ? (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setCreatingForSubtask(subtask.id);
                                    createTaskMutation.mutate({
                                      title: `${projectName}: ${subtask.subtaskName}`,
                                      description: `Phase ${subtask.phaseNumber} - ${subtask.phaseName}: ${subtask.subtaskName}`,
                                      internshipProjectTaskId: subtask.id,
                                    });
                                  }}
                                  disabled={
                                    createTaskMutation.isPending &&
                                    creatingForSubtask === subtask.id
                                  }
                                  data-testid={`button-start-subtask-${subtask.id}`}
                                >
                                  {createTaskMutation.isPending &&
                                  creatingForSubtask === subtask.id ? (
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
                                    data-testid={`button-run-task-${subtask.id}`}
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
                                    data-testid={`button-submit-task-${subtask.id}`}
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
                                    data-testid={`button-stop-task-${subtask.id}`}
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
                                    data-testid={`button-submit-running-${subtask.id}`}
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
              )}
            </div>
          );
        })}
      </div>

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

function SubProjectTasksPanel({
  internSubProject,
  projectName,
}: {
  internSubProject: InternSubProject;
  projectName: string;
}) {
  const { toast } = useToast();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitComment, setSubmitComment] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    if (!showSubmitDialog) return;
    setNowTick(Date.now());
    const id = setInterval(() => setNowTick(Date.now()), 15000);
    return () => clearInterval(id);
  }, [showSubmitDialog]);

  const { data: tasks = [], isLoading } = useQuery<SubProjectTask[]>({
    queryKey: ["/api/intern/sub-project-tasks", internSubProject.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/intern/sub-project-tasks/${internSubProject.id}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const startMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/intern/sub-project-tasks/${taskId}/start`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to start task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/sub-project-tasks", internSubProject.id],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/tasks"] });
      toast({
        title: "Task Started",
        description: "You can now work on this sub-project.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start task.",
        variant: "destructive",
      });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({
      taskId,
      comment,
    }: {
      taskId: string;
      comment: string;
    }) => {
      const res = await fetch(
        `/api/intern/sub-project-tasks/${taskId}/submit`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comment }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to submit task");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/sub-project-tasks", internSubProject.id],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/sub-projects"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/internship-progress"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/tasks"] });
      setShowSubmitDialog(false);
      setSubmitComment("");
      toast({
        title: "Sub-Project Submitted",
        description: "Your sub-project has been marked as completed.",
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

  const task = tasks[0];
  const isStarted = task?.started ?? false;
  const isCompleted = task?.completed ?? false;
  const pct = isCompleted ? 100 : 0;

  return (
    <div className="space-y-4" data-testid="sub-project-tasks-panel">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {projectName} — Sub-Project Task
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {isCompleted ? "1/1" : "0/1"} task completed
            </span>
            <span className="text-sm font-bold text-primary">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : task ? (
            <div
              className={`flex items-center justify-between p-4 rounded-md border ${isCompleted ? "bg-green-500/5 border-green-500/20" : isStarted ? "bg-blue-500/5 border-blue-500/20" : "bg-muted/30"}`}
              data-testid={`sub-task-${task.id}`}
            >
              <div className="flex items-center gap-3">
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : isStarted ? (
                  <Play className="h-5 w-5 text-blue-500" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <span
                    className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}
                  >
                    Complete and submit this sub-project
                  </span>
                  {isStarted && !isCompleted && task.startedAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Started {new Date(task.startedAt).toLocaleDateString()}
                    </p>
                  )}
                  {isCompleted && task.submitComment && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">
                      "{task.submitComment}"
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {!isStarted && !isCompleted && (
                  <Button
                    size="sm"
                    onClick={() => startMutation.mutate(task.id)}
                    disabled={startMutation.isPending}
                    data-testid={`button-start-sub-task-${task.id}`}
                  >
                    {startMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Start Task
                  </Button>
                )}
                {isStarted && !isCompleted && (
                  <Button
                    size="sm"
                    onClick={() => setShowSubmitDialog(true)}
                    data-testid={`button-submit-sub-task-${task.id}`}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit
                  </Button>
                )}
                {isCompleted && (
                  <Badge variant="default" className="bg-green-600">
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Completing this sub-project adds 25% to your overall internship
            progress.
          </p>
        </CardContent>
      </Card>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Sub-Project</DialogTitle>
            <DialogDescription>
              Mark this sub-project as completed. Add a description of what you
              accomplished.
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const startedAtMs = task?.startedAt
              ? new Date(task.startedAt).getTime()
              : null;
            const elapsedMs =
              startedAtMs !== null ? Math.max(0, nowTick - startedAtMs) : 0;
            const workedMin = Math.floor(elapsedMs / 60000);
            const meetsMinTime =
              startedAtMs !== null && elapsedMs >= MIN_WORK_MS;
            const remainingMin = meetsMinTime
              ? 0
              : Math.ceil((MIN_WORK_MS - elapsedMs) / 60000);
            const commentFilled = submitComment.trim().length > 0;
            const canSubmit = meetsMinTime && commentFilled;
            return (
              <>
                <div className="space-y-3">
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
                        <p>Worked {workedMin} min on this sub-project. You can submit now.</p>
                      ) : (
                        <p>
                          You must work on this sub-project for at least 30
                          minutes before submitting. Worked {workedMin} min so
                          far — {remainingMin} min remaining.
                        </p>
                      )}
                    </div>
                  </div>
                  <Label htmlFor="submit-comment">
                    Submission Comments <span className="text-red-400">*</span>
                  </Label>
                  <Textarea
                    id="submit-comment"
                    placeholder="Describe what you completed, any challenges faced, and key outcomes (required)..."
                    value={submitComment}
                    onChange={(e) => setSubmitComment(e.target.value)}
                    rows={4}
                    data-testid="textarea-submit-comment"
                    className={
                      !commentFilled ? "border-yellow-500/40" : undefined
                    }
                  />
                  {!commentFilled && (
                    <p className="text-xs text-yellow-400">
                      Submission comments are required.
                    </p>
                  )}
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
                    onClick={() =>
                      task &&
                      submitMutation.mutate({
                        taskId: task.id,
                        comment: submitComment.trim(),
                      })
                    }
                    disabled={!canSubmit || submitMutation.isPending}
                    data-testid="button-confirm-submit"
                  >
                    {submitMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Submit & Complete
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

export default function InternProjectsModule() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [managingProject, setManagingProject] = useState<string | null>(null);
  const [managingSubProject, setManagingSubProject] = useState<string | null>(
    null,
  );
  const [showCreateDaoProject, setShowCreateDaoProject] = useState(false);
  const [newDaoProject, setNewDaoProject] = useState({
    name: "",
    description: "",
    repositoryUrl: "",
    deployedUrl: "",
  });

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/intern/profile"],
    queryFn: async () => {
      const res = await fetch("/api/intern/profile", {
        credentials: "include",
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: allCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const internCategoryName = (() => {
    if (!profile?.categoryId) return null;
    const cat = allCategories.find((c: any) => c.id === profile.categoryId);
    return cat?.name || null;
  })();

  const { data: demoData, isLoading: loadingProjects } = useQuery<{
    projects: DemoProject[];
    selected: InternDemoProject[];
    adminProjects: Project[];
    categories: string[];
  }>({
    queryKey: ["/api/intern/demo-projects"],
    queryFn: async () => {
      const res = await fetch("/api/intern/demo-projects", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const { data: progress } = useQuery<{
    totalProjects: number;
    completedProjects: number;
    totalSubProjects: number;
    completedSubProjects: number;
    percentage: number;
  }>({
    queryKey: ["/api/intern/internship-progress"],
    queryFn: async () => {
      const res = await fetch("/api/intern/internship-progress", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
  });

  const { data: subData } = useQuery<{
    subProjects: SubProject[];
    selected: InternSubProject[];
  }>({
    queryKey: ["/api/intern/sub-projects"],
    queryFn: async () => {
      const res = await fetch("/api/intern/sub-projects", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch sub-projects");
      return res.json();
    },
  });

  const selectSubMutation = useMutation({
    mutationFn: async (subProjectId: string) => {
      const res = await fetch("/api/intern/sub-projects/select", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subProjectId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to select sub-project");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/sub-projects"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/internship-progress"],
      });
      toast({
        title: "Sub-project selected",
        description: "You can now start working on this sub-project.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectDemoMutation = useMutation({
    mutationFn: async (demoProjectId: string) => {
      const res = await fetch("/api/intern/demo-projects/select", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/internship-progress"],
      });
      toast({
        title: "Project selected",
        description: "You can now start working on this project.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectAdminProjectMutation = useMutation({
    mutationFn: async (adminProjectId: string) => {
      const res = await fetch("/api/intern/admin-projects/select", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/internship-progress"],
      });
      toast({
        title: "Project selected",
        description: "You can now start working on this project.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unselectProjectMutation = useMutation({
    mutationFn: async (internDemoProjectId: string) => {
      const res = await fetch(`/api/intern/demo-projects/${internDemoProjectId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to unselect project");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/demo-projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/internship-progress"] });
      toast({ title: "Project Unselected", description: "You can now choose a different project." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const unselectSubProjectMutation = useMutation({
    mutationFn: async (internSubProjectId: string) => {
      const res = await fetch(`/api/intern/sub-projects/${internSubProjectId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to unselect sub-project");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/sub-projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/internship-progress"] });
      toast({ title: "Sub-Project Unselected", description: "You can now choose a different sub-project." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { data: status } = useQuery<any>({
    queryKey: ["/api/intern/status"],
    queryFn: async () => {
      const res = await fetch("/api/intern/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
  });

  const isDao = status?.daoStatus === "approved";
  const isDaoDirect =
    status?.qualificationPath === "DAO" || status?.isDaoDirect === true;

  const { data: daoData } = useQuery<{
    myProjects: Project[];
    categoryProjects: Project[];
    allDaoProjects: (Project & { creatorName: string })[];
  }>({
    queryKey: ["/api/intern/dao/projects"],
    queryFn: async () => {
      const res = await fetch("/api/intern/dao/projects", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch DAO projects");
      const data = await res.json();
      if (Array.isArray(data))
        return { myProjects: data, categoryProjects: [], allDaoProjects: [] };
      return data;
    },
    enabled: isDao,
  });
  const daoMyProjects = daoData?.myProjects || [];
  const daoCategoryProjects = daoData?.categoryProjects || [];
  const allDaoProjects = daoData?.allDaoProjects || [];

  const createDaoProjectMutation = useMutation({
    mutationFn: async (data: typeof newDaoProject) => {
      const response = await fetch("/api/intern/dao/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create project");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/dao/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/projects"] });
      setShowCreateDaoProject(false);
      setNewDaoProject({
        name: "",
        description: "",
        repositoryUrl: "",
        deployedUrl: "",
      });
      toast({ title: "Project created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
  // const hoursRequirement = 80;
  // const hoursComplete = totalHoursLogged >= hoursRequirement;

  const generateCertMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/intern/certificates/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "internship" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to generate certificate");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/status"] });
      toast({
        title: "Certificate Generated",
        description: "Your internship completion certificate is ready!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate certificate",
        variant: "destructive",
      });
    },
  });

  if (loadingProjects) {
    return (
      <div
        className="flex items-center justify-center py-12"
        data-testid="projects-loading"
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const projects = demoData?.projects || [];
  const adminProjects = demoData?.adminProjects || [];
  const selected = demoData?.selected || [];
  const selectedDemoNames = new Set(
    selected
      .map((s) => {
        const p = projects.find((dp) => dp.id === s.demoProjectId);
        return p?.name || "";
      })
      .filter(Boolean),
  );
  const activeProjects = selected.filter((s) => s.status !== "completed");
  const isWeb3Category = internCategoryName === "Web3+AI";
  const maxMainProjects = isWeb3Category ? 1 : 2;
  const canSelectMore = activeProjects.length < maxMainProjects;
  const availableAdminProjects = adminProjects.filter(
    (p) => !selectedDemoNames.has(p.name),
  );
  const overallPercent = progress?.percentage ?? 0;
  const internshipComplete = overallPercent >= 100;

  const availableSubProjects = subData?.subProjects || [];
  const selectedSubs = subData?.selected || [];
  const selectedSubIds = new Set(selectedSubs.map((s) => s.subProjectId));

  if (managingSubProject) {
    const isp = selectedSubs.find((s) => s.id === managingSubProject);
    const sp = availableSubProjects.find((p) => p.id === isp?.subProjectId);
    if (!isp || !sp) {
      setManagingSubProject(null);
      return null;
    }
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setManagingSubProject(null)}
          data-testid="button-back-sub-projects"
        >
          ← Back to Projects
        </Button>
        <SubProjectTasksPanel internSubProject={isp} projectName={sp.name} />
      </div>
    );
  }

  if (managingProject) {
    const internProject = selected.find((s) => s.id === managingProject);
    const project = projects.find((p) => p.id === internProject?.demoProjectId);
    if (!internProject || !project) {
      setManagingProject(null);
      return null;
    }
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setManagingProject(null)}
          data-testid="button-back-projects"
        >
          ← Back to Projects
        </Button>
        <ProjectTasksPanel
          internDemoProject={internProject}
          projectName={project.name}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="projects-module">
      <div className="flex items-center gap-3 flex-wrap">
        <FolderKanban className="h-6 w-6 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Internship Projects</h2>
        {internCategoryName && (
          <Badge variant="secondary" className="text-xs">
            {internCategoryName}
          </Badge>
        )}
        <Badge variant="outline" className="ml-auto">
          {selected.length}/{maxMainProjects} project{maxMainProjects > 1 ? "s" : ""} selected
        </Badge>
      </div>

      {!isDaoDirect && (
        <Card data-testid="overall-progress-card">
          <CardContent className="pt-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Overall Internship Progress
              </span>
              <span className="text-sm font-bold text-primary">
                {overallPercent}%
              </span>
            </div>
            <Progress
              value={overallPercent}
              className="h-3"
              data-testid="progress-overall"
            />
            <p className="text-xs text-muted-foreground">
              {isWeb3Category ? (
                <>
                  Complete your 1 main project to reach 100% and finish your
                  internship.
                  {progress
                    ? ` ${progress.completedProjects} main project(s) completed.`
                    : ""}
                </>
              ) : (
                <>
                  Main project = 50%, Sub-projects = 25% each (max 50%). Reach
                  100% to complete your internship.
                  {progress
                    ? ` ${progress.completedProjects} main project(s), ${progress.completedSubProjects || 0} sub-project(s) completed.`
                    : ""}
                </>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {internshipComplete && (
        <Card
          className="border-green-500/30 bg-green-500/5"
          data-testid="internship-complete-card"
        >
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-semibold text-green-500">
                  Internship Completed!
                </p>
                <p className="text-sm text-muted-foreground">
                  Congratulations! You have successfully completed your 1-month
                  internship.
                </p>
              </div>
            </div>

            {/* Hours requirement UI hidden */}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => generateCertMutation.mutate()}
                disabled={generateCertMutation.isPending}
                data-testid="button-generate-internship-cert"
              >
                {generateCertMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Award className="h-4 w-4 mr-2" />
                )}
                Generate Certificate of Internship
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/intern/certificates")}
                data-testid="button-view-certs"
              >
                <Award className="h-4 w-4 mr-2" />
                View Certificates
              </Button>
            </div>

            {!status?.daoMembershipApplied ? (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Join DAO Community</p>
                    <p className="text-sm text-muted-foreground">
                      Apply for EtherAuthority DAO membership for governance,
                      funding, and collaboration.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setLocation("/intern/dao-membership")}
                  variant="secondary"
                  data-testid="button-apply-dao"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Apply for DAO Membership
                </Button>
              </div>
            ) : (
              <div className="border-t pt-4 mt-4">
                <div
                  className="flex items-center gap-3 p-3 rounded-md bg-green-500/10 border border-green-500/20"
                  data-testid="dao-applied"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-green-500 font-medium">
                    DAO membership application submitted
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selected.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3">
            Your Selected Projects
          </h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {selected.map((sel) => {
              const project = projects.find((p) => p.id === sel.demoProjectId);
              const isCompleted = sel.status === "completed";
              const githubLink =
                (sel as any).githubLink || project?.repositoryUrl;
              const websiteLink = (project as any)?.websiteUrl;
              return (
                <Card
                  key={sel.id}
                  className="hover:border-primary/30 transition-colors"
                  data-testid={`selected-project-${sel.id}`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {project?.name || "Unknown Project"}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Badge
                        variant={isCompleted ? "default" : "outline"}
                        className={isCompleted ? "bg-green-600" : ""}
                      >
                        {isCompleted ? "Completed" : "In Progress"}
                      </Badge>
                      {project?.internCategoryId &&
                        (() => {
                          const cat = allCategories.find(
                            (c: any) => c.id === project.internCategoryId,
                          );
                          return cat ? (
                            <Badge variant="secondary" className="text-xs">
                              {cat.name}
                            </Badge>
                          ) : null;
                        })()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      
                                           <ReadMore
    text={project?.description}
    wordLimit={20}
  />
                    </p>
                    <div className="flex flex-col gap-1 mt-1">
                      {githubLink && (
                        <a
                          href={githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                          data-testid={`link-project-github-${sel.id}`}
                        >
                          <Github className="h-3.5 w-3.5" />
                          GitHub Repository
                        </a>
                      )}
                      {websiteLink && (
                        <a
                          href={websiteLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                          data-testid={`link-project-website-${sel.id}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Project URL
                        </a>
                      )}
                    </div>
                  </CardHeader>
                  {!isCompleted && (!internshipComplete || isDao) ? (
                    <CardContent className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={() => setManagingProject(sel.id)}
                        data-testid={`button-manage-${sel.id}`}
                      >
                        <FolderKanban className="h-4 w-4 mr-2" />
                        Create & Manage Tasks
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to unselect this project? All task progress for this project will be lost.")) {
                            unselectProjectMutation.mutate(sel.id);
                          }
                        }}
                        disabled={unselectProjectMutation.isPending}
                        data-testid={`button-unselect-${sel.id}`}
                      >
                        {unselectProjectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Unselect & Choose Other
                      </Button>
                    </CardContent>
                  ) : !isCompleted && internshipComplete ? (
                    <CardContent>
                      <div className="flex items-center justify-center gap-2 p-3 rounded-md bg-green-500/10 border border-green-500/20">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-sm text-green-500 font-medium">
                          Internship Completed
                        </span>
                      </div>
                    </CardContent>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {selectedSubs.length > 0 && !isWeb3Category && (
        <div>
          <h3 className="text-base font-semibold mb-3">
            Your Selected Sub-Projects
          </h3>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {selectedSubs.map((sel) => {
              const sp = availableSubProjects.find(
                (p) => p.id === sel.subProjectId,
              );
              const isCompleted = sel.status === "completed";
              return (
                <Card
                  key={sel.id}
                  className="hover:border-primary/30 transition-colors"
                  data-testid={`selected-sub-project-${sel.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">
                        {sp?.name || "Unknown Sub-Project"}
                      </CardTitle>
                      <Badge
                        variant={isCompleted ? "default" : "outline"}
                        className={isCompleted ? "bg-green-600" : ""}
                      >
                        {isCompleted ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                    {sp?.description && (
                      <p className="text-sm text-muted-foreground">
                        
                                                <ReadMore
    text= {sp.description}
    wordLimit={20}
  />
                      </p>
                    )}
                    <div className="flex flex-col gap-1 mt-1">
                      {sp?.repositoryUrl && (
                        <a
                          href={sp.repositoryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                          data-testid={`link-sub-github-${sel.id}`}
                        >
                          <Github className="h-3.5 w-3.5" /> GitHub Repository
                        </a>
                      )}
                      {sp?.websiteUrl && (
                        <a
                          href={sp.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                          data-testid={`link-sub-website-${sel.id}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Project URL
                        </a>
                      )}
                    </div>
                  </CardHeader>
                  {!isCompleted && (
                    <CardContent className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={() => setManagingSubProject(sel.id)}
                        data-testid={`button-manage-sub-${sel.id}`}
                      >
                        <FolderKanban className="h-4 w-4 mr-2" /> Manage Tasks
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to unselect this sub-project? All task progress for this sub-project will be lost.",
                            )
                          ) {
                            unselectSubProjectMutation.mutate(sel.id);
                          }
                        }}
                        disabled={unselectSubProjectMutation.isPending}
                        data-testid={`button-unselect-sub-${sel.id}`}
                      >
                        {unselectSubProjectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Unselect & Choose Other
                      </Button>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {availableSubProjects.filter((sp) => !selectedSubIds.has(sp.id)).length >
        0 &&
        !isDao &&
        !isWeb3Category && (
          <div>
            <h3 className="text-base font-semibold mb-3">
              Available Sub-Projects (25% each)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select sub-projects to boost your internship progress. Each
              completed sub-project adds 25%.
            </p>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {availableSubProjects
                .filter((sp) => !selectedSubIds.has(sp.id))
                .map((sp) => (
                  <Card
                    key={`sub-${sp.id}`}
                    className="hover:border-primary/30 transition-colors"
                    data-testid={`available-sub-${sp.id}`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{sp.name}</CardTitle>
                      {sp.category && (
                        <Badge variant="outline" className="text-xs w-fit mt-1">
                          {sp.category}
                        </Badge>
                      )}
                      {sp.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          
                                                        <ReadMore
    text= {sp.description}
    wordLimit={20}
  />
                        </p>
                      )}
                      <div className="flex flex-col gap-1 mt-2">
                        {sp.repositoryUrl && (
                          <a
                            href={sp.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                            data-testid={`link-avail-sub-github-${sp.id}`}
                          >
                            <Github className="h-3.5 w-3.5" /> GitHub Repository
                          </a>
                        )}
                        {sp.websiteUrl && (
                          <a
                            href={sp.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                            data-testid={`link-avail-sub-website-${sp.id}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Document URL
                          </a>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => selectSubMutation.mutate(sp.id)}
                        disabled={selectSubMutation.isPending}
                        data-testid={`button-select-sub-${sp.id}`}
                      >
                        {selectSubMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        Select Sub-Project
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

      {canSelectMore && availableAdminProjects.length > 0 && !isDao && (
        <div>
          <h3 className="text-base font-semibold mb-3">Available Projects</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {isWeb3Category
              ? "Select 1 main project to work on during your internship. Completing it reaches 100%."
              : `Select ${2 - activeProjects.length} more project${2 - activeProjects.length > 1 ? "s" : ""} to work on during your internship.`}
          </p>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {availableAdminProjects.map((project) => (
              <Card
                key={`admin-${project.id}`}
                className="hover:border-primary/30 transition-colors"
                data-testid={`available-project-${project.id}`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{project.name}</CardTitle>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {project.category && (
                      <Badge variant="outline" className="text-xs">
                        {project.category}
                      </Badge>
                    )}
                    {project.internCategoryId &&
                      (() => {
                        const cat = allCategories.find(
                          (c: any) => c.id === project.internCategoryId,
                        );
                        return cat ? (
                          <Badge variant="secondary" className="text-xs">
                            {cat.name}
                          </Badge>
                        ) : null;
                      })()}
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      
                                                <ReadMore
    text= {project.description}
    wordLimit={20}
  />
                    </p>
                  )}
                  <div className="flex flex-col gap-1 mt-2">
                    {project.repositoryUrl && (
                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                        data-testid={`link-project-github-${project.id}`}
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
                        data-testid={`link-project-url-${project.id}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Project URL
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() =>
                      selectAdminProjectMutation.mutate(project.id)
                    }
                    disabled={selectAdminProjectMutation.isPending}
                    data-testid={`button-select-project-${project.id}`}
                  >
                    {selectAdminProjectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <FolderKanban className="h-4 w-4 mr-2" />
                    )}
                    Select Project
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isDao && (
        <div className="space-y-6">
          {daoCategoryProjects.filter((p) => p.category === "Interns Project")
            .length > 0 && (
            <div>
              <h3 className="text-base font-semibold mb-3">Interns Projects</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Projects available for interns to work on.
              </p>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {daoCategoryProjects
                  .filter((p) => p.category === "Interns Project")
                  .map((project) => (
                    <Card
                      key={`intern-cat-${project.id}`}
                      className="hover:border-primary/30 transition-colors"
                      data-testid={`intern-category-project-${project.id}`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {project.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`w-fit mt-1 ${
                            project.status === "completed"
                              ? "bg-green-500/10 text-green-500 border-green-500/30"
                              : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                          }`}
                        >
                          {project.status === "completed"
                            ? "Completed"
                            : "In Progress"}
                        </Badge>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                                 <ReadMore
    text={project.description}
    wordLimit={20}
  />
                          </p>
                        )}
                        <div className="flex flex-col gap-1.5 mt-2">
                          {project.repositoryUrl && (
                            <a
                              href={project.repositoryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                              data-testid={`link-intern-cat-github-${project.id}`}
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
                              data-testid={`link-intern-cat-url-${project.id}`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Project URL
                            </a>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() =>
                            selectAdminProjectMutation.mutate(project.id)
                          }
                          disabled={
                            selectAdminProjectMutation.isPending ||
                            selectedDemoNames.has(project.name)
                          }
                          data-testid={`button-select-intern-cat-${project.id}`}
                        >
                          {selectedDemoNames.has(project.name) ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                              Already Selected
                            </>
                          ) : selectAdminProjectMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <>
                              <FolderKanban className="h-4 w-4 mr-2" />
                              Select Project
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {daoCategoryProjects.filter((p) => p.category === "DAO").length >
            0 && (
            <div>
              <h3 className="text-base font-semibold mb-3">DAO Projects</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Projects available for DAO members to work on.
              </p>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {daoCategoryProjects
                  .filter((p) => p.category === "DAO")
                  .map((project) => (
                    <Card
                      key={`dao-cat-${project.id}`}
                      className="hover:border-primary/30 transition-colors"
                      data-testid={`dao-category-project-${project.id}`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {project.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`w-fit mt-1 ${
                            project.status === "completed"
                              ? "bg-green-500/10 text-green-500 border-green-500/30"
                              : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                          }`}
                        >
                          {project.status === "completed"
                            ? "Completed"
                            : "In Progress"}
                        </Badge>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            
                                                                 <ReadMore
    text={project.description}
    wordLimit={20}
  />
                          </p>
                        )}
                        <div className="flex flex-col gap-1.5 mt-2">
                          {project.repositoryUrl && (
                            <a
                              href={project.repositoryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                              data-testid={`link-dao-cat-github-${project.id}`}
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
                              data-testid={`link-dao-cat-url-${project.id}`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Project URL
                            </a>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() =>
                            selectAdminProjectMutation.mutate(project.id)
                          }
                          disabled={
                            selectAdminProjectMutation.isPending ||
                            selectedDemoNames.has(project.name)
                          }
                          data-testid={`button-select-dao-cat-${project.id}`}
                        >
                          {selectedDemoNames.has(project.name) ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                              Already Selected
                            </>
                          ) : selectAdminProjectMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <>
                              <FolderKanban className="h-4 w-4 mr-2" />
                              Select Project
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {false && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">My DAO Projects</h3>
                {false && (
                  <Button
                    size="sm"
                    onClick={() => setShowCreateDaoProject(true)}
                    data-testid="button-create-dao-project"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Project
                  </Button>
                )}
              </div>
              {daoMyProjects.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center">
                      <FolderKanban className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground mb-1">
                        No DAO projects yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        As a DAO member, you can create your own projects and
                        manage tasks.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {daoMyProjects.map((project) => (
                    <Card
                      key={`dao-${project.id}`}
                      className="hover:border-primary/30 transition-colors border-primary/10"
                      data-testid={`dao-project-${project.id}`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {project.name}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`w-fit mt-1 ${
                            project.status === "completed"
                              ? "bg-green-500/10 text-green-500 border-green-500/30"
                              : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                          }`}
                        >
                          {project.status === "completed"
                            ? "Completed"
                            : "In Progress"}
                        </Badge>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            
                                                                 <ReadMore
    text={project.description}
    wordLimit={20}
  />
                          </p>
                        )}
                        <div className="flex flex-col gap-1.5 mt-2">
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
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Created{" "}
                          {project.createdAt
                            ? new Date(project.createdAt).toLocaleDateString()
                            : "-"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {allDaoProjects.length > 0 && (
            <div>
              <h3
                className="text-base font-semibold mb-3"
                data-testid="text-dao-project-list-heading"
              >
                DAO Project List
              </h3>
              <p
                className="text-sm text-muted-foreground mb-4"
                data-testid="text-dao-project-list-description"
              >
                Projects created by other DAO members.
              </p>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {allDaoProjects.map((project) => (
                  <Card
                    key={`dao-list-${project.id}`}
                    className="hover:border-primary/30 transition-colors"
                    data-testid={`dao-list-project-${project.id}`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {project.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={`w-fit mt-1 ${
                          project.status === "completed"
                            ? "bg-green-500/10 text-green-500 border-green-500/30"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                        }`}
                      >
                        {project.status === "completed"
                          ? "Completed"
                          : "In Progress"}
                      </Badge>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          
                                                         <ReadMore
    text={project.description}
    wordLimit={20}
  />
                        </p>
                      )}
                      <div className="flex flex-col gap-1.5 mt-2">
                        {project.repositoryUrl && (
                          <a
                            href={project.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                            data-testid={`link-dao-list-github-${project.id}`}
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
                            data-testid={`link-dao-list-url-${project.id}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Project URL
                          </a>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          By {project.creatorName} ·{" "}
                          {project.createdAt
                            ? new Date(project.createdAt).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={showCreateDaoProject}
        onOpenChange={(open) => {
          setShowCreateDaoProject(open);
          if (!open)
            setNewDaoProject({
              name: "",
              description: "",
              repositoryUrl: "",
              deployedUrl: "",
            });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project as a DAO member. You can then create tasks
              under this project from the Tasks page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project Name</Label>
              <Input
                value={newDaoProject.name}
                onChange={(e) =>
                  setNewDaoProject({ ...newDaoProject, name: e.target.value })
                }
                placeholder="e.g. Smart Contract Audit Tool"
                data-testid="input-dao-project-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newDaoProject.description}
                onChange={(e) =>
                  setNewDaoProject({
                    ...newDaoProject,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the project goals and scope"
                data-testid="input-dao-project-description"
              />
            </div>
            <div>
              <Label>Repository URL (optional)</Label>
              <Input
                value={newDaoProject.repositoryUrl}
                onChange={(e) =>
                  setNewDaoProject({
                    ...newDaoProject,
                    repositoryUrl: e.target.value,
                  })
                }
                placeholder="https://github.com/..."
                data-testid="input-dao-repo-url"
              />
            </div>
            <div>
              <Label>Deployed URL (optional)</Label>
              <Input
                value={newDaoProject.deployedUrl}
                onChange={(e) =>
                  setNewDaoProject({
                    ...newDaoProject,
                    deployedUrl: e.target.value,
                  })
                }
                placeholder="https://..."
                data-testid="input-dao-deployed-url"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDaoProject(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createDaoProjectMutation.mutate(newDaoProject)}
              disabled={
                !newDaoProject.name.trim() || createDaoProjectMutation.isPending
              }
              data-testid="button-submit-dao-project"
            >
              {createDaoProjectMutation.isPending
                ? "Creating..."
                : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
