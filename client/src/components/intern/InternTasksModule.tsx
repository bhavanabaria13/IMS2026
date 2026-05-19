import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Play,
  Square,
  CheckCircle,
  Clock,
  Filter,
  Send,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type {
  Task,
  TimeLog,
  Project,
  DemoProject,
  InternDemoProject,
  InternshipProjectTask,
} from "@shared/schema";

const TASKS_PER_PAGE = 10;

function ElapsedTimer({ startDate }: { startDate: string | Date }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const start = new Date(startDate).getTime();
    const update = () => {
      const diff = Date.now() - start;
      if (diff < 0) { setElapsed("0s"); return; }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      if (hours > 0) setElapsed(`${hours}h ${mins}m ${secs}s`);
      else if (mins > 0) setElapsed(`${mins}m ${secs}s`);
      else setElapsed(`${secs}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  return (
    <span className="inline-flex items-center gap-1 text-xs text-orange-400 font-mono">
      <Clock className="h-3 w-3" />
      {elapsed}
    </span>
  );
}

interface InternTasksModuleProps {
  tasks: Task[];
  projects: Project[];
  daoStatus?: string | null;
}

export default function InternTasksModule({
  tasks,
  projects,
  daoStatus,
}: InternTasksModuleProps) {
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submitNotes, setSubmitNotes] = useState("");
  const [taskFilter, setTaskFilter] = useState<
    "all" | "pending" | "running" | "completed"
  >("all");
  const [search, setSearch] = useState("");
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [taskStartTime, setTaskStartTime] = useState<Date | null>(null);
  const [submitGithubLink, setSubmitGithubLink] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    projectId: "",
  });
  const [submitStatus, setSubmitStatus] = useState<
    "pending" | "running" | "completed"
  >("completed");
  const [currentPage, setCurrentPage] = useState(1);
  const [nowTick, setNowTick] = useState(Date.now());

  const { toast } = useToast();

  useEffect(() => {
    if (!showSubmitDialog) return;
    const id = setInterval(() => setNowTick(Date.now()), 15000);
    setNowTick(Date.now());
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

  const { data: demoData } = useQuery<{
    projects: DemoProject[];
    selected: InternDemoProject[];
  }>({
    queryKey: ["/api/intern/demo-projects"],
    queryFn: async () => {
      const res = await fetch("/api/intern/demo-projects", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch demo projects");
      return res.json();
    },
  });

  const { data: daoProjects = [] } = useQuery<Project[]>({
    queryKey: ["/api/intern/dao/projects"],
    queryFn: async () => {
      const res = await fetch("/api/intern/dao/projects", {
        credentials: "include",
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/intern/tasks/${taskId}/toggle`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to toggle task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/tasks"] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
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
      toast({ title: "Task created successfully" });
      setShowCreateTask(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        projectId: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task",
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
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    },
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/time-logs"] });
      setActiveTask(taskId);
      setTaskStartTime(new Date());
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
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/time-logs"] });
      setActiveTask(null);
      setTaskStartTime(null);
      toast({ title: "Task stopped" });
    },
  });

  const submitTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      notes,
      status,
      githubLink,
    }: {
      taskId: string;
      notes: string;
      status: string;
      githubLink?: string;
    }) => {
      const response = await fetch(`/api/intern/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, status, githubLink }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to submit task");
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/tasks"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/course-progress"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/progress-summary"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/sub-projects"],
      });
      setShowSubmitDialog(false);
      setSelectedTask(null);
      setSubmitNotes("");
      setSubmitGithubLink("");
      setSubmitStatus("completed");
      toast({ title: "Task submitted for review" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/intern/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/tasks"] });
      toast({ title: "Task deleted" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const demoProjects = demoData?.projects || [];
  const selectedProjects = demoData?.selected || [];

  const getProjectName = (task: Task) => {
    if ((task as any).projectName) {
      return (task as any).projectName;
    }
    if (task.projectId) {
      const project = projects.find((p) => p.id === task.projectId)
        || daoProjects.find((p) => p.id === task.projectId);
      return project?.name || "General";
    }
    if (task.internshipProjectTaskId) {
      const title = task.title || "";
      const colonIdx = title.indexOf(":");
      if (colonIdx > 0) return title.substring(0, colonIdx).trim();
      return "Internship Project";
    }
    if (task.courseModuleId) {
      return "Training Course";
    }
    return "General";
  };

  const getTaskType = (task: Task) => {
    if (task.courseModuleId) return "training";
    if (task.internshipProjectTaskId) return "internship";
    if ((task as any).subProjectTaskId) return "subproject";
    return "DAO";
  };

  const getTaskTypeBadge = (task: Task) => {
    const type = getTaskType(task);
    if (type === "training") {
      return (
        <Badge
          variant="outline"
          className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs"
        >
          Training
        </Badge>
      );
    }
    if (type === "internship") {
      return (
        <Badge
          variant="outline"
          className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs"
        >
          Internship
        </Badge>
      );
    }
    if (type === "subproject") {
      return (
        <Badge
          variant="outline"
          className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs"
        >
          Sub-Project
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        DAO
      </Badge>
    );
  };

  /** 🔍 FILTER + SEARCH LOGIC */
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      taskFilter === "all" ? true : task.status === taskFilter;

    const q = search.toLowerCase();

    const matchesSearch =
      task.title.toLowerCase().includes(q) ||
      task.status.toLowerCase().includes(q) ||
      (task.priority || "").toLowerCase().includes(q) ||
      getProjectName(task).toLowerCase().includes(q) ||
      getTaskType(task).toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, taskFilter]);

  const totalPages = Math.ceil(filteredTasks.length / TASKS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * TASKS_PER_PAGE,
    currentPage * TASKS_PER_PAGE,
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      pending: "secondary",
      running: "default",
      completed: "outline",
      cancelled: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      medium:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    return <Badge className={colors[priority] || ""}>{priority}</Badge>;
  };
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const runningCount = tasks.filter((t) => t.status === "running").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCount}
            </div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {runningCount}
            </div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {completedCount}
            </div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0 pb-4">
          <CardTitle>My Tasks</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select
              value={taskFilter}
              onValueChange={(v: any) => setTaskFilter(v)}
            >
              <SelectTrigger className="w-[150px]" data-testid="select-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Task Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => setShowCreateTask(true)}
              data-testid="button-create-task"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 🔍 SEARCH BAR */}
          <Input
            placeholder="Search by task, project, status or priority..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTasks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground"
                    >
                      No tasks found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{task.title}</span>
                          {task.status === "running" && (task as any).subProjectTaskId && task.startDate && (
                            <ElapsedTimer startDate={task.startDate} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getProjectName(task)}</TableCell>
                      <TableCell>{getTaskTypeBadge(task)}</TableCell>
                      <TableCell>
                        {getPriorityBadge(task.priority || "medium")}
                      </TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 rounded-xl"
                            onClick={() => {
                              setSelectedTask(task);
                              setShowViewDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {task.status === "pending" && (
                            <Button
                              size="icon"
                              title="Start Task"
                              aria-label="Start Task"
                              className="h-9 w-9 rounded-xl bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => startTaskMutation.mutate(task.id)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}

                          {task.status === "running" && (
                            <Button
                              size="icon"
                              title="Stop Task"
                              aria-label="Stop Task"
                              className="h-9 w-9 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => stopTaskMutation.mutate(task.id)}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          )}

                          {(task.status === "running" ||
                            task.status === "pending") && (
                            <Button
                              size="icon"
                              title="Submit Task"
                              aria-label="Submit Task"
                              className="h-9 w-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => {
                                setSelectedTask(task);
                                setShowSubmitDialog(true);
                              }}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}

                          {task.status === "pending" && (
                            <Button
                              size="icon"
                              title="Delete Task"
                              aria-label="Delete Task"
                              className="h-9 w-9 rounded-xl bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Are you sure you want to delete this task?",
                                  )
                                ) {
                                  deleteTaskMutation.mutate(task.id);
                                }
                              }}
                              disabled={deleteTaskMutation.isPending}
                              data-testid={`button-delete-task-${task.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}

                          {task.status === "completed" && (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredTasks.length > TASKS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4">
              <p
                className="text-sm text-muted-foreground"
                data-testid="text-tasks-page-info"
              >
                Showing {(currentPage - 1) * TASKS_PER_PAGE + 1}-
                {Math.min(currentPage * TASKS_PER_PAGE, filteredTasks.length)}{" "}
                of {filteredTasks.length} tasks
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  data-testid="button-tasks-prev"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        size="sm"
                        variant={page === currentPage ? "default" : "outline"}
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(page)}
                        data-testid={`button-tasks-page-${page}`}
                      >
                        {page}
                      </Button>
                    ),
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  data-testid="button-tasks-next"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new task.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                placeholder="Task title"
                data-testid="input-task-title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                placeholder="Task description"
                data-testid="input-task-description"
              />
            </div>
            <div>
              <Label>Project</Label>
              <Select
                value={newTask.projectId}
                onValueChange={(v) => setNewTask({ ...newTask, projectId: v })}
              >
                <SelectTrigger data-testid="select-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {daoProjects.length > 0 &&
                    daoProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (My Project)
                      </SelectItem>
                    ))}
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={newTask.priority}
                onValueChange={(v) => setNewTask({ ...newTask, priority: v })}
              >
                <SelectTrigger data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) =>
                  setNewTask({ ...newTask, dueDate: e.target.value })
                }
                data-testid="input-due-date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTask(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                createTaskMutation.mutate({
                  title: newTask.title,
                  description: newTask.description,
                  priority: newTask.priority,
                  dueDate: newTask.dueDate || null,
                  projectId:
                    newTask.projectId === "none"
                      ? null
                      : newTask.projectId || null,
                })
              }
              disabled={!newTask.title}
              data-testid="button-submit-task"
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              View the details of this task.
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="font-medium">{selectedTask.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p>{selectedTask.description || "No description"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedTask.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <div>
                    {getPriorityBadge(selectedTask.priority || "medium")}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Project</Label>
                <p>{getProjectName(selectedTask)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Type</Label>
                <div className="mt-1">{getTaskTypeBadge(selectedTask)}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p>
                  {selectedTask.createdAt
                    ? formatDistanceToNow(new Date(selectedTask.createdAt), {
                        addSuffix: true,
                      })
                    : "-"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Task for Review</DialogTitle>
            <DialogDescription>
              Submit your completed work for admin review.
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const MIN_WORK_MS = 30 * 60 * 1000;
            const taskLogs = selectedTask
              ? timeLogs.filter((l) => l.taskId === selectedTask.id)
              : [];
            const totalWorkMs = taskLogs.reduce((sum, l) => {
              const start = l.startTime ? new Date(l.startTime).getTime() : 0;
              const end = l.endTime ? new Date(l.endTime).getTime() : nowTick;
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
                  {/* STATUS SELECT */}
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={submitStatus}
                      onValueChange={(v) => setSubmitStatus(v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Select Tasks</SelectItem>
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
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() =>
                      selectedTask &&
                      submitTaskMutation.mutate({
                        taskId: selectedTask.id,
                        notes: submitNotes.trim(),
                        status: submitStatus,
                        githubLink: submitGithubLink,
                      })
                    }
                    disabled={!canSubmit || submitTaskMutation.isPending}
                    data-testid="button-confirm-submit"
                  >
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
