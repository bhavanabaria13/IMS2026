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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2, Circle, Loader2, ArrowLeft, ArrowRight,
  Award, FileText, Play, Send, Clock, Square, Trophy, Zap, Github, ExternalLink
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import CategoryInfoCard from "./CategoryInfoCard";
import type { CourseModule, CourseProgress, Task } from "@shared/schema";

interface W4Progress {
  total: number;
  completed: number;
  percentage: number;
}

export default function InternDirectExamModule() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submitNotes, setSubmitNotes] = useState("");
  const [submitDescription, setSubmitDescription] = useState("");
  const [submitGithubLink, setSubmitGithubLink] = useState("");
  const [creatingForModule, setCreatingForModule] = useState<string | null>(null);

  const { data: modules = [], isLoading: modulesLoading } = useQuery<CourseModule[]>({
    queryKey: ["/api/intern/direct-exam/modules"],
    queryFn: async () => {
      const res = await fetch("/api/intern/direct-exam/modules", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exam modules");
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    },
  });

  const { data: progress = [], isLoading: progressLoading } = useQuery<CourseProgress[]>({
    queryKey: ["/api/intern/course-progress"],
    queryFn: async () => {
      const res = await fetch("/api/intern/course-progress", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch progress");
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    },
  });

  const { data: w4Progress, isLoading: w4Loading } = useQuery<W4Progress>({
    queryKey: ["/api/intern/direct-exam/progress"],
    queryFn: async () => {
      const res = await fetch("/api/intern/direct-exam/progress", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exam progress");
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

  const { data: internStatus } = useQuery<any>({
    queryKey: ["/api/intern/status"],
    queryFn: async () => {
      const res = await fetch("/api/intern/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
  });

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
      toast({ title: "Certificate Generated", description: "Your training certificate has been generated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; courseModuleId: string }) => {
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
      toast({ title: "Task created", description: "You can now start working on this exam task." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create task.", variant: "destructive" });
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
    mutationFn: async ({ taskId, notes, githubLink }: { taskId: string; notes: string; githubLink: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ["/api/intern/course-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/direct-exam/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/progress-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/status"] });
      setShowSubmitDialog(false);
      setSelectedTask(null);
      setSubmitNotes("");
      setSubmitDescription("");
      setSubmitGithubLink("");
      toast({ title: "Task submitted", description: "Exam task completed!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit task.", variant: "destructive" });
    },
  });

  const isModuleCompleted = (moduleId: string) => {
    return progress.some((p) => p.moduleId === moduleId && p.completed);
  };

  const getModuleTask = (moduleId: string): Task | undefined => {
    return internTasks.find((t) => t.courseModuleId === moduleId);
  };

  const examPercent = w4Progress?.percentage ?? 0;
  const isLoading = modulesLoading || progressLoading || w4Loading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="loading-direct-exam">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/intern/dashboard")} data-testid="button-back-dashboard">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-amber-500/20">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Zap className="h-6 w-6 text-amber-400" />
            <h2 className="text-xl font-bold" data-testid="text-direct-exam-title">
              Direct Exam — Week 4 Final Project
            </h2>
          </div>
          <p className="text-muted-foreground">
            Complete these final project tasks to demonstrate your skills. Finish all tasks to earn your training certificate.
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">Exam Progress</span>
              <span className="text-sm font-bold text-amber-400" data-testid="text-exam-progress">
                {w4Progress?.completed ?? 0} / {w4Progress?.total ?? 0} tasks — {examPercent}%
              </span>
            </div>
            <Progress value={examPercent} className="h-3" data-testid="progress-exam" />
          </div>
        </CardContent>
      </Card>

      {internStatus?.categoryName && (
        <CategoryInfoCard
          categoryName={internStatus.categoryName}
          subcategoryName={internStatus.subcategoryName}
          categoryId={internStatus.categoryId}
        />
      )}

      {examPercent >= 100 && (
        <Card className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500/30">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <div className="flex-1">
                <p className="font-bold text-lg" data-testid="text-exam-complete">
                  Direct Exam Passed!
                </p>
                <p className="text-sm text-muted-foreground">
                  You have completed all exam tasks. Generate your certificate and proceed.
                </p>
              </div>
            </div>
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

      <div className="space-y-3">
        {modules.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No exam modules available for your category.
            </CardContent>
          </Card>
        ) : (
          modules.map((mod) => {
            const completed = isModuleCompleted(mod.id);
            const task = getModuleTask(mod.id);

            return (
              <Card
                key={mod.id}
                className={`${completed ? "border-green-500/30 bg-green-900/10" : task?.status === "running" ? "border-blue-500/30 bg-blue-900/10" : "border-muted"}`}
                data-testid={`exam-module-card-${mod.id}`}
              >
                <CardContent className="py-4 px-4">
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">
                      {completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" data-testid={`icon-completed-${mod.id}`} />
                      ) : task?.status === "running" ? (
                        <Clock className="h-5 w-5 text-blue-500 animate-pulse" data-testid={`icon-running-${mod.id}`} />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" data-testid={`icon-incomplete-${mod.id}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-medium ${completed ? "text-green-400" : ""}`}
                        data-testid={`text-exam-module-title-${mod.id}`}
                      >
                        {mod.title}
                      </h4>
                      {mod.description && (
                        <p className="text-sm text-muted-foreground mt-1" data-testid={`text-exam-module-desc-${mod.id}`}>
                          {mod.description}
                        </p>
                      )}
                      {task && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={task.status === "completed" ? "default" : task.status === "running" ? "secondary" : "outline"}
                            className={
                              task.status === "completed" ? "bg-green-600" :
                              task.status === "running" ? "bg-blue-600 text-white" : ""
                            }
                            data-testid={`badge-task-status-${mod.id}`}
                          >
                            {task.status === "completed" ? "Completed" :
                             task.status === "running" ? "In Progress" : "Pending"}
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
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {completed ? (
                        <Badge variant="secondary" className="text-green-400" data-testid={`badge-completed-${mod.id}`}>
                          Completed
                        </Badge>
                      ) : !task ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setCreatingForModule(mod.id);
                            createTaskMutation.mutate({
                              title: mod.title,
                              description: mod.description || `Direct exam task: ${mod.title}`,
                              courseModuleId: mod.id,
                            });
                          }}
                          disabled={createTaskMutation.isPending && creatingForModule === mod.id}
                          data-testid={`button-start-exam-module-${mod.id}`}
                        >
                          {createTaskMutation.isPending && creatingForModule === mod.id ? (
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
                            onClick={() => startTaskMutation.mutate(task.id)}
                            disabled={startTaskMutation.isPending}
                            data-testid={`button-run-exam-task-${mod.id}`}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              setSelectedTask(task);
                              setSubmitDescription(task.description || "");
                              setShowSubmitDialog(true);
                            }}
                            data-testid={`button-submit-exam-task-${mod.id}`}
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
                            onClick={() => stopTaskMutation.mutate(task.id)}
                            disabled={stopTaskMutation.isPending}
                            data-testid={`button-stop-exam-task-${mod.id}`}
                          >
                            <Square className="h-4 w-4 mr-1" />
                            Stop
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              setSelectedTask(task);
                              setSubmitDescription(task.description || "");
                              setShowSubmitDialog(true);
                            }}
                            data-testid={`button-submit-running-exam-${mod.id}`}
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
          })
        )}
      </div>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Exam Task: {selectedTask?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Textarea
                value={submitDescription}
                onChange={(e) => setSubmitDescription(e.target.value)}
                placeholder="Describe what you worked on..."
                rows={3}
                data-testid="input-exam-submit-description"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={submitNotes}
                onChange={(e) => setSubmitNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={2}
                data-testid="input-exam-submit-notes"
              />
            </div>
            <div>
              <Label>GitHub Link</Label>
              <Input
                value={submitGithubLink}
                onChange={(e) => setSubmitGithubLink(e.target.value)}
                placeholder="https://github.com/username/repo"
                data-testid="input-exam-submit-github"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} data-testid="button-cancel-exam-submit">
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedTask) return;
                submitTaskMutation.mutate({
                  taskId: selectedTask.id,
                  notes: [submitDescription, submitNotes].filter(Boolean).join("\n\n"),
                  githubLink: submitGithubLink,
                });
              }}
              disabled={submitTaskMutation.isPending}
              data-testid="button-confirm-exam-submit"
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
