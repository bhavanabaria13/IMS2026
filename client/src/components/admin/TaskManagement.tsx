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
import { Plus, Edit, Trash2, Clock, Eye, ExternalLink, FileText, CalendarClock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, TimeLog } from "@shared/schema";

/* ================= TYPES ================= */

type Intern = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
};

/* ================= COMPONENT ================= */

interface TaskManagementProps {
  categoryFilter?: "all" | "interns" | "training" | "dao";
}

export default function TaskManagement({ categoryFilter = "all" }: TaskManagementProps) {
  const { toast } = useToast();

  /* ---------- STATE ---------- */

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSubcategoryId, setFilterSubcategoryId] = useState<string>("all");

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

  /* ---------- RESET PAGE ON SEARCH ---------- */

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCategoryId, filterSubcategoryId, filterType]);

  /* ---------- QUERIES ---------- */

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allSubcategories = [] } = useQuery<any[]>({
    queryKey: ["/api/subcategories"],
  });

  const getCategoryName = (intern: any) => {
    if (!intern?.categoryId) return null;
    const cat = categories.find((c: any) => c.id === intern.categoryId);
    return cat?.name || null;
  };

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

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks", { credentials: "include" });
      return res.json();
    },
  });

  const { data: interns = [] } = useQuery<Intern[]>({
    queryKey: ["/api/admin/interns-with-status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/interns-with-status", {
        credentials: "include",
      });
      return res.json();
    },
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/admin/projects"],
    queryFn: async () => {
      const res = await fetch("/api/admin/projects", {
        credentials: "include",
      });
      return res.json();
    },
  });

  const { data: timeLogs = [] } = useQuery<TimeLog[]>({
    queryKey: ["admin-time-logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/time-logs", { credentials: "include" });
      return res.json();
    },
  });

  /* ---------- HELPERS ---------- */

  const getInternName = (id: string | null) =>
    interns.find((i) => i.id === id)?.name || "Unassigned";

  const getProjectName = (task: any) =>
    task.resolvedProjectName ||
    (task.projectId
      ? projects.find((p: any) => p.id === task.projectId)?.name
      : null) ||
    "No Project";

  const getTaskType = (task: any) => {
    if (task.type) return task.type;
    if (task.courseModuleId) return "training";
    if (task.internshipProjectTaskId) return "internship";
    if (task.isDaoTask) return "dao";
    return "DAO";
  };

  const getTaskTimeSpent = (taskId: string) => {
    const taskLogs = timeLogs.filter(l => l.taskId === taskId);
    let totalMinutes = 0;
    for (const log of taskLogs) {
      if (log.duration) {
        totalMinutes += log.duration;
      } else if (log.endTime) {
        const diff = new Date(log.endTime).getTime() - new Date(log.startTime).getTime();
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
        (new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) /
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

  /* ---------- FILTER ---------- */

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const isDaoIntern = (id: any) => {
    const intern: any = interns.find((i: any) => i.id === id);
    return intern?.daoStatus === "approved";
  };

  const categoryFilteredTasks = categoryFilter === "all"
    ? safeTasks
    : categoryFilter === "training"
    ? safeTasks.filter(t => getTaskType(t) === "training" && !isDaoIntern(t.assignedTo))
    : categoryFilter === "interns"
    ? safeTasks.filter(t => getTaskType(t) === "internship" && !isDaoIntern(t.assignedTo))
    : safeTasks.filter(t =>
        getTaskType(t) === "dao" ||
        getTaskType(t) === "DAO" ||
        isDaoIntern(t.assignedTo)
      );

  const filteredTasks = categoryFilteredTasks
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
    mutationFn: async () => {
      return apiRequest("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
    },
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
      {/* ===== TOP STATS ===== */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm">
          <span className="text-muted-foreground">Total</span>
          <Badge variant="secondary">{categoryFilteredTasks.length}</Badge>
        </div>

        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm">
          <span className="text-muted-foreground">Pending</span>
          <Badge className="bg-yellow-500/10 text-yellow-500">
            {categoryFilteredTasks.filter((t) => t.status === "pending").length}
          </Badge>
        </div>

        <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm">
          <span className="text-muted-foreground">Completed</span>
          <Badge className="bg-green-500/10 text-green-500">
            {categoryFilteredTasks.filter((t) => t.status === "completed").length}
          </Badge>
        </div>
      </div>

      {/* ===== MAIN CARD ===== */}
      <Card>
        <CardHeader className="flex flex-col gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold">
            Task Management
          </CardTitle>

          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 flex-wrap">
            <Select
              value={filterCategoryId}
              onValueChange={(v) => {
                setFilterCategoryId(v);
                setFilterSubcategoryId("all");
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px]" data-testid="filter-task-category">
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
              <SelectTrigger className="w-full sm:w-[160px]" data-testid="filter-task-subcategory">
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
              <SelectTrigger className="w-full sm:w-[140px]" data-testid="filter-task-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search by task, intern, project, type, status, or priority..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-[320px]"
            />

            <Button onClick={openCreateDialog} data-testid="button-create-task">
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
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
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
              {paginatedTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{getProjectName(task)}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        getTaskType(task) === "training"
                          ? "bg-blue-500/10 text-blue-500"
                          : getTaskType(task) === "internship"
                            ? "bg-purple-500/10 text-purple-500"
                            : getTaskType(task) === "dao"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-gray-500/10 text-gray-500"
                      }
                    >
                      {getTaskType(task) === "training"
                        ? "Training"
                        : getTaskType(task) === "internship"
                          ? "Internship"
                          : getTaskType(task) === "dao"
                            ? "DAO"
                            : "DAO"}
                    </Badge>
                  </TableCell>
                  <TableCell>{getInternName(task.assignedTo)}</TableCell>
                  <TableCell>
                    {(() => {
                      const intern = interns.find(i => i.id === task.assignedTo);
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
                      const intern: any = interns.find(i => i.id === task.assignedTo);
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
                      data-testid={`button-view-task-${task.id}`}
                      title="View submission details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(task)}
                      data-testid={`button-edit-task-${task.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(task.id)}
                      data-testid={`button-delete-task-${task.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Task" : "Create Task"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Task title"
                data-testid="input-task-title"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional description"
                rows={3}
                data-testid="input-task-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Project</Label>
                <Select
                  value={form.projectId || "__none__"}
                  onValueChange={(v) =>
                    setForm({ ...form, projectId: v === "__none__" ? "" : v })
                  }
                >
                  <SelectTrigger data-testid="select-task-project">
                    <SelectValue placeholder="No project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No Project</SelectItem>
                    {projects.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Assigned To</Label>
                <Select
                  value={form.assignedTo || "__none__"}
                  onValueChange={(v) =>
                    setForm({ ...form, assignedTo: v === "__none__" ? "" : v })
                  }
                >
                  <SelectTrigger data-testid="select-task-assignee">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {interns.map((i: any) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={form.internCategoryId || "__none__"}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      internCategoryId: v === "__none__" ? "" : v,
                      subcategoryId: "",
                    })
                  }
                >
                  <SelectTrigger data-testid="select-task-category">
                    <SelectValue placeholder="No category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No Category</SelectItem>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Subcategory</Label>
                <Select
                  value={form.subcategoryId || "__none__"}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      subcategoryId: v === "__none__" ? "" : v,
                    })
                  }
                  disabled={!form.internCategoryId}
                >
                  <SelectTrigger data-testid="select-task-subcategory">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {getSubcategoriesForCategory(form.internCategoryId).map(
                      (s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger data-testid="select-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingTask && (
                <div>
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                  >
                    <SelectTrigger data-testid="select-task-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="running">Running</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  data-testid="input-task-due-date"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              data-testid="button-cancel-task"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-task"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingTask
                  ? "Update Task"
                  : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== VIEW SUBMISSION DIALOG ===== */}
      <Dialog
        open={!!viewingTask}
        onOpenChange={(open) => !open && setViewingTask(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Submission Details</DialogTitle>
          </DialogHeader>

          {viewingTask && (() => {
            const t: any = viewingTask;
            const intern: any = interns.find((i) => i.id === t.assignedTo);
            const links = parseSubmittedLinks(t.submittedGithubLink);
            const taskLogs = getTaskTimeLogs(t.id);
            const totalSpent = getTaskTimeSpent(t.id);

            return (
              <div className="space-y-5">
                {/* Header info */}
                <div className="rounded-lg border p-4 space-y-2">
                  <div
                    className="text-base font-semibold"
                    data-testid="text-view-task-title"
                  >
                    {t.title}
                  </div>
                  {t.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {t.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-2">
                    <div>
                      <span className="text-muted-foreground">Assigned to:</span>{" "}
                      <span className="font-medium">
                        {getInternName(t.assignedTo)}
                      </span>
                      {intern?.email && (
                        <span className="text-muted-foreground"> ({intern.email})</span>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Project:</span>{" "}
                      <span className="font-medium">{getProjectName(t)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>{" "}
                      <Badge variant="outline" className="capitalize">
                        {getTaskType(t)}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <Badge
                        className={
                          t.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : t.status === "running"
                              ? "bg-blue-500/10 text-blue-500"
                              : t.status === "pending"
                                ? "bg-yellow-500/10 text-yellow-500"
                                : "bg-red-500/10 text-red-500"
                        }
                      >
                        {t.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority:</span>{" "}
                      <span className="font-medium capitalize">{t.priority || "—"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due date:</span>{" "}
                      <span className="font-medium">
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submission section */}
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Submission
                    </h3>
                    {t.submittedAt ? (
                      <Badge className="bg-green-500/10 text-green-500">
                        Submitted
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Not yet submitted</Badge>
                    )}
                  </div>

                  <div className="text-sm space-y-3">
                    <div className="flex items-start gap-2">
                      <CalendarClock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <div className="text-muted-foreground text-xs uppercase tracking-wide">
                          Submitted at
                        </div>
                        <div
                          className="font-medium"
                          data-testid="text-view-task-submitted-at"
                        >
                          {t.submittedAt
                            ? new Date(t.submittedAt).toLocaleString()
                            : "—"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                        Document / Submission links
                      </div>
                      {links.length > 0 ? (
                        <ul
                          className="space-y-1"
                          data-testid="list-view-task-links"
                        >
                          {links.map((link, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              {link.safe ? (
                                <a
                                  href={link.safe}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline break-all text-sm"
                                  data-testid={`link-view-task-submission-${idx}`}
                                >
                                  {link.raw}
                                </a>
                              ) : (
                                <span
                                  className="text-muted-foreground break-all text-sm italic"
                                  title="Link not opened: only http/https URLs are allowed"
                                  data-testid={`text-view-task-submission-unsafe-${idx}`}
                                >
                                  {link.raw}{" "}
                                  <span className="text-xs">(unsupported link)</span>
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-muted-foreground text-sm">
                          No links submitted
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                        Task notes from intern
                      </div>
                      {t.submittedNotes ? (
                        <p
                          className="whitespace-pre-wrap text-sm rounded-md bg-muted/40 p-3"
                          data-testid="text-view-task-notes"
                        >
                          {t.submittedNotes}
                        </p>
                      ) : (
                        <div className="text-muted-foreground text-sm">
                          No notes provided
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Time spent section */}
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Task perform time
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-base"
                      data-testid="badge-view-task-total-time"
                    >
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
              data-testid="button-close-view-task"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
