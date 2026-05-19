import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Clock, Eye, ExternalLink, FileText, CalendarClock, GraduationCap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, TimeLog } from "@shared/schema";

type Intern = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
};

type CourseModule = {
  id: string;
  weekNumber: number;
  title: string;
  internCategoryId: string | null;
};

export default function FinalTaskManagement() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterSubcategoryId, setFilterSubcategoryId] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const emptyForm = {
    title: "",
    description: "",
    assignedTo: "" as string,
    projectId: "" as string,
    internCategoryId: "" as string,
    subcategoryId: "" as string,
    priority: "medium" as string,
    status: "pending" as string,
    dueDate: "" as string,
  };
  const [form, setForm] = useState(emptyForm);

  const openCreateDialog = () => {
    setEditingTask(null);
    setForm(emptyForm);
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (task: any) => {
    setEditingTask(task);
    setForm({
      title: task.title || "",
      description: task.description || "",
      assignedTo: task.assignedTo || "",
      projectId: task.projectId || "",
      internCategoryId: task.internCategoryId || "",
      subcategoryId: task.subcategoryId || "",
      priority: task.priority || "medium",
      status: task.status || "pending",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : "",
    });
    setIsAddDialogOpen(true);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategoryId, filterSubcategoryId, filterType]);

  const getTaskType = (task: any) => {
    if (task?.type) return task.type;
    if (task?.courseModuleId) return "training";
    if (task?.internshipProjectTaskId) return "internship";
    return "internship";
  };

  /* ---------- QUERIES ---------- */

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allSubcategories = [] } = useQuery<any[]>({
    queryKey: ["/api/subcategories"],
  });

  const { data: courseModules = [] } = useQuery<CourseModule[]>({
    queryKey: ["/api/admin/course-modules"],
    queryFn: async () => {
      const res = await fetch("/api/admin/course-modules", { credentials: "include" });
      return res.json();
    },
  });

  // Get IDs of all Week 4 modules (guard against non-array responses)
  const safeCourseModules = Array.isArray(courseModules) ? courseModules : [];
  const week4ModuleIds = new Set(
    safeCourseModules
      .filter((m) => m.weekNumber === 4)
      .map((m) => m.id)
  );

  const getCategoryNameById = (id: string | null | undefined) => {
    if (!id) return null;
    return categories.find((c: any) => c.id === id)?.name || null;
  };

  const getSubcategoryNameById = (id: string | null | undefined) => {
    if (!id) return null;
    return allSubcategories.find((s: any) => s.id === id)?.name || null;
  };

  const getSubcategoriesForCategory = (categoryId: string) =>
    allSubcategories.filter((s: any) => s.categoryId === categoryId);

  const getCategoryName = (intern: any) => {
    if (!intern?.categoryId) return null;
    const cat = categories.find((c: any) => c.id === intern.categoryId);
    return cat?.name || null;
  };

  const { data: rawTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks", { credentials: "include" });
      return res.json();
    },
  });
  const tasks = Array.isArray(rawTasks) ? rawTasks : [];

  const { data: rawInterns } = useQuery<Intern[]>({
    queryKey: ["/api/admin/interns-with-status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/interns-with-status", {
        credentials: "include",
      });
      return res.json();
    },
  });
  const interns = Array.isArray(rawInterns) ? rawInterns : [];

  const { data: rawProjects } = useQuery<Project[]>({
    queryKey: ["/api/admin/projects"],
    queryFn: async () => {
      const res = await fetch("/api/admin/projects", {
        credentials: "include",
      });
      return res.json();
    },
  });
  const projects = Array.isArray(rawProjects) ? rawProjects : [];

  const { data: rawTimeLogs } = useQuery<TimeLog[]>({
    queryKey: ["admin-time-logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/time-logs", { credentials: "include" });
      return res.json();
    },
  });
  const timeLogs = Array.isArray(rawTimeLogs) ? rawTimeLogs : [];

  /* ---------- HELPERS ---------- */

  const getInternName = (id: string | null) =>
    interns.find((i) => i.id === id)?.name || "Unassigned";

  const getProjectName = (task: any) =>
    task.resolvedProjectName ||
    (task.projectId
      ? projects.find((p: any) => p.id === task.projectId)?.name
      : null) ||
    "No Project";

  const getModuleWeek = (moduleId: string | null | undefined) => {
    if (!moduleId) return null;
    return courseModules.find((m) => m.id === moduleId)?.weekNumber ?? null;
  };

  const getModuleTitle = (moduleId: string | null | undefined) => {
    if (!moduleId) return null;
    return courseModules.find((m) => m.id === moduleId)?.title ?? null;
  };

  const getTaskTimeSpent = (taskId: string) => {
    const taskLogs = timeLogs.filter((l) => l.taskId === taskId);
    let totalMinutes = 0;
    for (const log of taskLogs) {
      if (log.duration) {
        totalMinutes += log.duration;
      } else if (log.endTime) {
        const diff =
          new Date(log.endTime).getTime() - new Date(log.startTime).getTime();
        totalMinutes += Math.floor(diff / (1000 * 60));
      }
    }
    if (totalMinutes === 0) return "-";
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getTaskTimeLogs = (taskId: string) =>
    timeLogs
      .filter((l) => l.taskId === taskId)
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      );

  const formatLogDuration = (log: TimeLog) => {
    let mins = 0;
    if (log.duration) {
      mins = log.duration;
    } else if (log.endTime) {
      mins = Math.floor(
        (new Date(log.endTime).getTime() -
          new Date(log.startTime).getTime()) /
          (1000 * 60),
      );
    } else {
      return "In progress";
    }
    if (mins <= 0) return "0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const parseSubmittedLinks = (raw: string | null | undefined) => {
    if (!raw) return [] as { safe: string | null; raw: string }[];
    return raw
      .split(/[\s,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((value) => {
        try {
          const parsed = new URL(value);
          if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return { safe: parsed.toString(), raw: value };
          }
        } catch {
          /* fallthrough */
        }
        return { safe: null, raw: value };
      });
  };

  /* ---------- FILTER: only Week 4 / direct-exam tasks ---------- */

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // A "final task" is any training task whose linked course module is Week 4
  const finalTasks = safeTasks.filter(
    (t: any) => t.courseModuleId && week4ModuleIds.has(t.courseModuleId),
  );

  const filteredTasks = finalTasks
    .filter((t: any) => {
      if (filterType === "all") return true;
      return getTaskType(t) === filterType;
    })
    .filter((t: any) => {
      if (filterCategoryId === "all") return true;
      const intern: any = interns.find((i: any) => i.id === t.assignedTo);
      const effectiveCat = t.internCategoryId ?? intern?.categoryId ?? null;
      return effectiveCat === filterCategoryId;
    })
    .filter((t: any) => {
      if (filterSubcategoryId === "all") return true;
      const intern: any = interns.find((i: any) => i.id === t.assignedTo);
      const effectiveSub = t.subcategoryId ?? intern?.subcategoryId ?? null;
      return effectiveSub === filterSubcategoryId;
    })
    .filter((task) => {
      const q = search.toLowerCase();
      return (
        task.title.toLowerCase().includes(q) ||
        task.status.toLowerCase().includes(q) ||
        (task.priority ?? "").toLowerCase().includes(q) ||
        getInternName(task.assignedTo).toLowerCase().includes(q) ||
        getProjectName(task).toLowerCase().includes(q) ||
        getTaskType(task).toLowerCase().includes(q)
      );
    });

  /* ---------- PAGINATION ---------- */

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  /* ---------- MUTATIONS ---------- */

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted successfully" });
    },
  });

  const buildPayload = () => ({
    title: form.title.trim(),
    description: form.description || null,
    assignedTo: form.assignedTo || null,
    projectId: form.projectId || null,
    internCategoryId: form.internCategoryId || null,
    subcategoryId: form.subcategoryId || null,
    priority: form.priority,
    status: form.status,
    dueDate: form.dueDate || null,
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      apiRequest("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task created successfully" });
      setIsAddDialogOpen(false);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      toast({
        title: "Failed to create task",
        description: err?.message || "",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingTask) throw new Error("No task selected");
      return apiRequest(`/api/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated successfully" });
      setIsAddDialogOpen(false);
      setEditingTask(null);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      toast({
        title: "Failed to update task",
        description: err?.message || "",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (editingTask) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      {/* ===== INFO BANNER ===== */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-400">
        <GraduationCap className="h-4 w-4 flex-shrink-0" />
        Showing only <strong className="mx-1">Week 4 (Final / Direct Exam)</strong> tasks — tasks linked to Week 4 course modules.
      </div>

      {/* ===== TOP STATS ===== */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm">
          <span className="text-muted-foreground">Total</span>
          <Badge variant="secondary">{finalTasks.length}</Badge>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm">
          <span className="text-muted-foreground">Pending</span>
          <Badge className="bg-yellow-500/10 text-yellow-500">
            {finalTasks.filter((t) => t.status === "pending").length}
          </Badge>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm">
          <span className="text-muted-foreground">Completed</span>
          <Badge className="bg-green-500/10 text-green-500">
            {finalTasks.filter((t) => t.status === "completed").length}
          </Badge>
        </div>
      </div>

      {/* ===== MAIN CARD ===== */}
      <Card>
        <CardHeader className="flex flex-col gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold">
            Final Task Management
          </CardTitle>

          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 flex-wrap">
            <Select
              value={filterCategoryId}
              onValueChange={(v) => {
                setFilterCategoryId(v);
                setFilterSubcategoryId("all");
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px]" data-testid="filter-final-task-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterSubcategoryId}
              onValueChange={setFilterSubcategoryId}
              disabled={filterCategoryId === "all"}
            >
              <SelectTrigger className="w-full sm:w-[160px]" data-testid="filter-final-task-subcategory">
                <SelectValue placeholder="Subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {getSubcategoriesForCategory(filterCategoryId).map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[140px]" data-testid="filter-final-task-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="intern">Intern</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search by task, intern, project, type, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-[280px]"
              data-testid="input-final-task-search"
            />

            <Button onClick={openCreateDialog} data-testid="button-create-final-task">
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Week 4 Module</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Subcategory</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Time Spent</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-10 text-muted-foreground">
                    No Week 4 / Direct Exam tasks found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>

                    <TableCell>
                      {getModuleTitle((task as any).courseModuleId) ? (
                        <span className="text-xs text-amber-400 font-medium">
                          {getModuleTitle((task as any).courseModuleId)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={
                          getTaskType(task) === "training"
                            ? "bg-blue-500/10 text-blue-500"
                            : getTaskType(task) === "intern"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-purple-500/10 text-purple-500"
                        }
                      >
                        {getTaskType(task)}
                      </Badge>
                    </TableCell>

                    <TableCell>{getProjectName(task)}</TableCell>

                    <TableCell>{getInternName(task.assignedTo)}</TableCell>

                    <TableCell>
                      {(() => {
                        const intern = interns.find((i) => i.id === task.assignedTo);
                        const catName =
                          getCategoryNameById((task as any).internCategoryId) ||
                          getCategoryName(intern);
                        return catName ? (
                          <Badge variant="outline" className="text-xs">{catName}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        );
                      })()}
                    </TableCell>

                    <TableCell>
                      {(() => {
                        const intern: any = interns.find((i) => i.id === task.assignedTo);
                        const subName =
                          getSubcategoryNameById((task as any).subcategoryId) ||
                          getSubcategoryNameById(intern?.subcategoryId);
                        return subName ? (
                          <Badge variant="secondary" className="text-xs">{subName}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        );
                      })()}
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={
                          task.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : task.status === "running"
                              ? "bg-blue-500/10 text-blue-500"
                              : task.status === "pending"
                                ? "bg-yellow-500/10 text-yellow-500"
                                : "bg-red-500/10 text-red-500"
                        }
                      >
                        {task.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        className={
                          task.priority === "high"
                            ? "bg-red-500/10 text-red-500"
                            : task.priority === "medium"
                              ? "bg-orange-500/10 text-orange-500"
                              : "bg-green-500/10 text-green-500"
                        }
                      >
                        {task.priority}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{getTaskTimeSpent(task.id)}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "-"}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setViewingTask(task)}
                        data-testid={`button-view-final-task-${task.id}`}
                        title="View submission details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(task)}
                        data-testid={`button-edit-final-task-${task.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(task.id)}
                        data-testid={`button-delete-final-task-${task.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* ===== PAGINATION ===== */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  data-testid="button-final-task-prev"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  data-testid="button-final-task-next"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== CREATE / EDIT DIALOG ===== */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Task" : "Create Final Task"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Task title"
                data-testid="input-final-task-title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Task description"
                data-testid="input-final-task-description"
              />
            </div>
            <div>
              <Label>Assign To</Label>
              <Select
                value={form.assignedTo}
                onValueChange={(v) => setForm({ ...form, assignedTo: v })}
              >
                <SelectTrigger data-testid="select-final-task-assigned">
                  <SelectValue placeholder="Select intern" />
                </SelectTrigger>
                <SelectContent>
                  {interns.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Project</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) => setForm({ ...form, projectId: v })}
              >
                <SelectTrigger data-testid="select-final-task-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger data-testid="select-final-task-priority">
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
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger data-testid="select-final-task-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                data-testid="input-final-task-due-date"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              data-testid="button-cancel-final-task"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-final-task"
            >
              {editingTask ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== VIEW SUBMISSION DIALOG ===== */}
      <Dialog
        open={!!viewingTask}
        onOpenChange={(open) => { if (!open) setViewingTask(null); }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Task Submission Details
            </DialogTitle>
          </DialogHeader>

          {(() => {
            if (!viewingTask) return null;
            const t = viewingTask as any;
            const taskLogs = getTaskTimeLogs(t.id);
            const totalSpent = getTaskTimeSpent(t.id);
            const links = parseSubmittedLinks(t.submittedGithubLink);

            return (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-base">{t.title}</h3>
                      {getModuleTitle(t.courseModuleId) && (
                        <p className="text-xs text-amber-400 mt-0.5">
                          Week 4 Module: {getModuleTitle(t.courseModuleId)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge
                        className={
                          t.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : t.status === "running"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-yellow-500/10 text-yellow-500"
                        }
                      >
                        {t.status}
                      </Badge>
                      <Badge variant="outline">{t.priority}</Badge>
                    </div>
                  </div>

                  {t.description && (
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Assigned To: </span>
                      <span className="font-medium">{getInternName(t.assignedTo)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Project: </span>
                      <span className="font-medium">{getProjectName(t)}</span>
                    </div>
                    {t.dueDate && (
                      <div>
                        <span className="text-muted-foreground">Due: </span>
                        <span className="font-medium">
                          {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Submission
                  </h3>

                  <div>
                    <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                      GitHub / Links
                    </div>
                    {links.length > 0 ? (
                      <ul className="space-y-1">
                        {links.map((link, idx) =>
                          link.safe ? (
                            <li key={idx}>
                              <a
                                href={link.safe}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline break-all text-sm"
                              >
                                {link.raw}
                              </a>
                            </li>
                          ) : (
                            <li key={idx}>
                              <span className="text-muted-foreground break-all text-sm italic">
                                {link.raw} <span className="text-xs">(unsupported link)</span>
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <div className="text-muted-foreground text-sm">No links submitted</div>
                    )}
                  </div>

                  <div>
                    <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                      Task notes from intern
                    </div>
                    {t.submittedNotes ? (
                      <p className="whitespace-pre-wrap text-sm rounded-md bg-muted/40 p-3">
                        {t.submittedNotes}
                      </p>
                    ) : (
                      <div className="text-muted-foreground text-sm">No notes provided</div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Task perform time
                    </h3>
                    <Badge variant="outline" className="text-base">
                      {totalSpent === "-" ? "0m" : totalSpent}
                    </Badge>
                  </div>

                  {taskLogs.length > 0 ? (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Start</TableHead>
                            <TableHead>End</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {taskLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="text-xs">
                                {new Date(log.startTime).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-xs">
                                {log.endTime
                                  ? new Date(log.endTime).toLocaleString()
                                  : "In progress"}
                              </TableCell>
                              <TableCell className="text-xs font-medium">
                                {formatLogDuration(log)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {log.logType}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No time logs recorded for this task.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewingTask(null)}
              data-testid="button-close-view-final-task"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
