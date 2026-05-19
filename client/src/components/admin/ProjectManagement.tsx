import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  FolderOpen,
  ListTodo,
  Calendar,
  User,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Project = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  internCategoryId: string | null;
  subcategoryId: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  repositoryUrl: string | null;
  deployedUrl: string | null;
  createdByInternId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  projectId: string | null;
  internCategoryId: string | null;
  subcategoryId: string | null;
  status: string;
  priority: string | null;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string | null;
};

type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
  isActive?: boolean;
};

type Intern = {
  id: string;
  name: string;
  approvalStatus?: number;
};

interface ProjectManagementProps {
  categoryFilter?: "all" | "interns" | "training" | "dao";
}

export default function ProjectManagement({
  categoryFilter = "all",
}: ProjectManagementProps) {
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PROJECT_CATEGORIES = [
    "DAO",
    "Test Project",
    "Interns Project",
    "Internal",
    "Client",
    "Research",
  ] as const;

  // ✅ ADD THESE STATES (top of component)
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    category: "",
    internCategoryId: "",
    subcategoryId: "",
    status: "in-progress" as "in-progress" | "completed" | "on-hold",
    startDate: "",
    endDate: "",
    repositoryUrl: "",
    deployedUrl: "",
  });

  // Filter state for category/subcategory
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterSubcategoryId, setFilterSubcategoryId] = useState<string>("all");

  const { data: internCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allSubcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
  });

  const getInternCategoryName = (id: string | null) => {
    if (!id) return null;
    const cat = internCategories.find((c: any) => c.id === id);
    return cat?.name || null;
  };

  const getSubcategoryName = (id: string | null) => {
    if (!id) return null;
    return allSubcategories.find((s) => s.id === id)?.name || null;
  };

  const getSubcategoriesForCategory = (categoryId: string) =>
    allSubcategories.filter((s) => s.categoryId === categoryId);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    internCategoryId: "",
    subcategoryId: "",
    status: "pending" as "pending" | "running" | "completed" | "cancelled",
    priority: "medium" as "low" | "medium" | "high",
    startDate: "",
    dueDate: "",
  });

  const { toast } = useToast();

  const { data: projects = [], isLoading: projectsLoading } = useQuery<
    Project[]
  >({
    queryKey: ["/api/admin/projects"],
    queryFn: async () => {
      const res = await fetch("/api/admin/projects", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const { data: interns = [] } = useQuery<Intern[]>({
    queryKey: ["/api/admin/interns-with-status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/interns-with-status", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch interns");
      return res.json();
    },
  });

  const { data: projectTasks = [], refetch: refetchTasks } = useQuery<Task[]>({
    queryKey: ["/api/admin/projects", selectedProject?.id, "tasks"],
    enabled: !!selectedProject?.id,
    queryFn: async () => {
      if (!selectedProject?.id) return [];
      const res = await fetch(
        `/api/admin/projects/${selectedProject.id}/tasks`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const approvedInterns = interns.filter((i) => i.approvalStatus === 1);

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      toast({ title: "Project created successfully" });
      resetProjectForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/admin/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      toast({ title: "Project updated successfully" });
      resetProjectForm();
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/projects/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/projects"] });
      toast({ title: "Project deleted successfully" });
      if (selectedProject) setSelectedProject(null);
    },
  });

  const categoryFilteredProjects =
    categoryFilter === "all"
      ? projects
      : categoryFilter === "interns"
        ? projects.filter((p) => p.category === "Interns Project")
        : categoryFilter === "training"
          ? projects.filter((p) => p.category === "Test Project")
          : projects.filter((p) => p.category === "DAO");

  const filteredProjects = categoryFilteredProjects
    .filter((project) =>
      filterCategoryId === "all"
        ? true
        : project.internCategoryId === filterCategoryId,
    )
    .filter((project) =>
      filterSubcategoryId === "all"
        ? true
        : project.subcategoryId === filterSubcategoryId,
    )
    .filter((project) =>
      [project.name, project.description, project.category]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );

  // ✅ PAGINATION LOGIC
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);

  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(
        `/api/admin/projects/${selectedProject?.id}/tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      refetchTasks();
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task created successfully" });
      resetTaskForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const resetProjectForm = () => {
    setProjectForm({
      name: "",
      description: "",
      category: "",
      internCategoryId: "",
      subcategoryId: "",
      status: "in-progress",
      startDate: "",
      endDate: "",
      repositoryUrl: "",
      deployedUrl: "",
    });
    setIsProjectDialogOpen(false);
    setEditingProject(null);
    setIsSubmitting(false);
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: "",
      description: "",
      assignedTo: "",
      internCategoryId: "",
      subcategoryId: "",
      status: "pending",
      priority: "medium",
      startDate: "",
      dueDate: "",
    });
    setIsTaskDialogOpen(false);
    setIsSubmitting(false);
  };

  const handleProjectSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const submitData = {
      ...projectForm,
      internCategoryId:
        projectForm.internCategoryId === "none"
          ? null
          : projectForm.internCategoryId || null,
      subcategoryId:
        projectForm.subcategoryId === "none"
          ? null
          : projectForm.subcategoryId || null,
      startDate: projectForm.startDate || null,
      endDate: projectForm.endDate || null,
    };

    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data: submitData });
    } else {
      createProjectMutation.mutate(submitData);
    }
  };

  const handleTaskSubmit = () => {
    if (isSubmitting || !selectedProject) return;
    setIsSubmitting(true);

    const submitData = {
      ...taskForm,
      assignedTo: taskForm.assignedTo || null,
      internCategoryId: taskForm.internCategoryId || null,
      subcategoryId: taskForm.subcategoryId || null,
      startDate: taskForm.startDate || null,
      dueDate: taskForm.dueDate || null,
    };

    createTaskMutation.mutate(submitData);
  };

  const openEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || "",
      category: project.category || "",
      internCategoryId: project.internCategoryId || "",
      subcategoryId: project.subcategoryId || "",
      status: project.status as "in-progress" | "completed" | "on-hold",
      startDate: project.startDate ? project.startDate.split("T")[0] : "",
      endDate: project.endDate ? project.endDate.split("T")[0] : "",
      repositoryUrl: project.repositoryUrl || "",
      deployedUrl: project.deployedUrl || "",
    });
    setIsProjectDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      "in-progress": "default",
      completed: "secondary",
      "on-hold": "outline",
      pending: "outline",
      running: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "MMM dd, yyyy");
    } catch {
      return "-";
    }
  };

  const getInternName = (internId: string | null) => {
    if (!internId) return "-";
    const intern = interns.find((i) => i.id === internId);
    return intern?.name || "-";
  };

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        <h2
          className="text-2xl font-bold"
          data-testid="text-project-management-title"
        >
          Project Management
        </h2>
        <Button
          onClick={() => setIsProjectDialogOpen(true)}
          data-testid="button-add-project"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="list" data-testid="tab-project-list">
            <FolderOpen className="w-4 h-4 mr-2" />
            Project List
          </TabsTrigger>
          <TabsTrigger
            value="details"
            disabled={!selectedProject}
            data-testid="tab-project-details"
          >
            <ListTodo className="w-4 h-4 mr-2" />
            Project Details & Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  All Projects ({filteredProjects.length})
                </CardTitle>

                <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                  <Select
                    value={filterCategoryId}
                    onValueChange={(v) => {
                      setFilterCategoryId(v);
                      setFilterSubcategoryId("all");
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[180px]" data-testid="filter-project-category">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {internCategories
                        .filter((c: any) => c.isActive)
                        .map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={filterSubcategoryId}
                    onValueChange={(v) => {
                      setFilterSubcategoryId(v);
                      setCurrentPage(1);
                    }}
                    disabled={filterCategoryId === "all"}
                  >
                    <SelectTrigger className="w-[180px]" data-testid="filter-project-subcategory">
                      <SelectValue placeholder="Subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subcategories</SelectItem>
                      {getSubcategoriesForCategory(filterCategoryId).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="max-w-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredProjects.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No projects yet. Create your first project!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project </TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Project Type</TableHead>
                      <TableHead>Project Category</TableHead>
                      <TableHead>Subcategory</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProjects.map((project) => (
                      <TableRow
                        key={project.id}
                        data-testid={`row-project-${project.id}`}
                      >
                        <TableCell className="font-medium">
                          {project.name}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {project.description || "-"}
                        </TableCell>
                        {/* Project Type */}
                        <TableCell>
                          {project.category ? (
                            <Badge variant="outline" className="text-xs">
                              {project.category}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>

                        {/* Project Category */}
                        <TableCell>
                          {getInternCategoryName(project.internCategoryId) ? (
                            <Badge variant="secondary" className="text-xs">
                              {getInternCategoryName(project.internCategoryId)}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        {/* Subcategory */}
                        <TableCell>
                          {getSubcategoryName(project.subcategoryId) ? (
                            <Badge variant="outline" className="text-xs">
                              {getSubcategoryName(project.subcategoryId)}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {project.createdByInternId ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500">
                              DAO (
                              {interns.find(
                                (i) => i.id === project.createdByInternId,
                              )?.name || "Intern"}
                              )
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-500/10 text-blue-500">
                              Admin
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(project.status)}</TableCell>
                        <TableCell>{formatDate(project.startDate)}</TableCell>
                        <TableCell>{formatDate(project.endDate)}</TableCell>
                        <TableCell>{formatDate(project.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditProject(project)}
                              data-testid={`button-edit-project-${project.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Are you sure you want to delete this project?",
                                  )
                                ) {
                                  deleteProjectMutation.mutate(project.id);
                                }
                              }}
                              data-testid={`button-delete-project-${project.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages || 1}
                    </p>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                      >
                        Prev
                      </Button>

                      {/* Page Numbers */}
                      {Array.from({ length: totalPages }, (_, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant={
                            currentPage === i + 1 ? "default" : "outline"
                          }
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          currentPage === totalPages || totalPages === 0
                        }
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          {selectedProject && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5" />
                      {selectedProject.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedProject.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProject(null)}
                      >
                        Back to List
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Description:
                      </span>
                      <p>{selectedProject.description || "No description"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {formatDate(selectedProject.startDate)} -{" "}
                        {formatDate(selectedProject.endDate)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
                    <CardTitle className="flex items-center gap-2">
                      <ListTodo className="w-5 h-5" />
                      Project Tasks ({projectTasks.length})
                    </CardTitle>
                    <Button
                      onClick={() => setIsTaskDialogOpen(true)}
                      data-testid="button-add-task"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {projectTasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No tasks in this project yet.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Assigned To</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>Due Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectTasks.map((task) => (
                          <TableRow
                            key={task.id}
                            data-testid={`row-task-${task.id}`}
                          >
                            <TableCell className="font-medium">
                              {task.title}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {task.description || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4 text-muted-foreground" />
                                {getInternName(task.assignedTo)}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(task.status)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {task.priority || "medium"}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(task.startDate)}</TableCell>
                            <TableCell>{formatDate(task.dueDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "Create New Project"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, name: e.target.value })
                }
                placeholder="Enter project name"
                data-testid="input-project-name"
              />
            </div>
            <div>
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    description: e.target.value,
                  })
                }
                placeholder="Project description"
                data-testid="input-project-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project-category">Project Type</Label>
                <Select
                  value={projectForm.category}
                  onValueChange={(v) =>
                    setProjectForm({ ...projectForm, category: v })
                  }
                >
                  <SelectTrigger data-testid="select-project-category">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="project-intern-category">Intern Category</Label>
                <Select
                  value={projectForm.internCategoryId}
                  onValueChange={(v) =>
                    setProjectForm({
                      ...projectForm,
                      internCategoryId: v,
                      subcategoryId: "",
                    })
                  }
                >
                  <SelectTrigger data-testid="select-project-intern-category">
                    <SelectValue placeholder="Select intern category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Categories</SelectItem>
                    {internCategories
                      .filter((c: any) => c.isActive)
                      .map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="project-subcategory">Subcategory</Label>
              <Select
                value={projectForm.subcategoryId || "none"}
                onValueChange={(v) =>
                  setProjectForm({
                    ...projectForm,
                    subcategoryId: v === "none" ? "" : v,
                  })
                }
                disabled={
                  !projectForm.internCategoryId ||
                  projectForm.internCategoryId === "none"
                }
              >
                <SelectTrigger data-testid="select-project-subcategory">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {getSubcategoriesForCategory(
                    projectForm.internCategoryId,
                  ).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="project-status">Status</Label>
              <Select
                value={projectForm.status}
                onValueChange={(v) =>
                  setProjectForm({ ...projectForm, status: v as any })
                }
              >
                <SelectTrigger data-testid="select-project-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project-start-date">Start Date</Label>
                <Input
                  id="project-start-date"
                  type="date"
                  value={projectForm.startDate}
                  onChange={(e) =>
                    setProjectForm({
                      ...projectForm,
                      startDate: e.target.value,
                    })
                  }
                  data-testid="input-project-start-date"
                />
              </div>
              <div>
                <Label htmlFor="project-end-date">Deadline</Label>
                <Input
                  id="project-end-date"
                  type="date"
                  value={projectForm.endDate}
                  onChange={(e) =>
                    setProjectForm({ ...projectForm, endDate: e.target.value })
                  }
                  data-testid="input-project-end-date"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="project-repo">Repository / Github URL:</Label>
              <Input
                id="project-repo"
                value={projectForm.repositoryUrl}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    repositoryUrl: e.target.value,
                  })
                }
                placeholder="https://github.com/..."
                data-testid="input-project-repo"
              />
            </div>
            <div>
              <Label htmlFor="project-deploy">Document/Details URL: </Label>
              <Input
                id="project-deploy"
                value={projectForm.deployedUrl}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    deployedUrl: e.target.value,
                  })
                }
                placeholder="https://..."
                data-testid="input-project-deploy"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetProjectForm}>
              Cancel
            </Button>
            <Button
              onClick={handleProjectSubmit}
              disabled={!projectForm.name || isSubmitting}
              data-testid="button-save-project"
            >
              {isSubmitting
                ? "Saving..."
                : editingProject
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Task for {selectedProject?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">Task Name *</Label>
              <Input
                id="task-title"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, title: e.target.value })
                }
                placeholder="Enter task name"
                data-testid="input-task-title"
              />
            </div>
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, description: e.target.value })
                }
                placeholder="Task details"
                data-testid="input-task-description"
              />
            </div>
            <div>
              <Label htmlFor="task-assigned">Assign to Intern</Label>
              <Select
                value={taskForm.assignedTo}
                onValueChange={(v) =>
                  setTaskForm({
                    ...taskForm,
                    assignedTo: v === "__unassigned__" ? "" : v,
                  })
                }
              >
                <SelectTrigger data-testid="select-task-assigned">
                  <SelectValue placeholder="Select intern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unassigned__">Unassigned</SelectItem>
                  {approvedInterns.map((intern) => (
                    <SelectItem key={intern.id} value={intern.id}>
                      {intern.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-category">Category</Label>
                <Select
                  value={taskForm.internCategoryId || "none"}
                  onValueChange={(v) =>
                    setTaskForm({
                      ...taskForm,
                      internCategoryId: v === "none" ? "" : v,
                      subcategoryId: "",
                    })
                  }
                >
                  <SelectTrigger data-testid="select-task-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {internCategories
                      .filter((c: any) => c.isActive)
                      .map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-subcategory">Subcategory</Label>
                <Select
                  value={taskForm.subcategoryId || "none"}
                  onValueChange={(v) =>
                    setTaskForm({
                      ...taskForm,
                      subcategoryId: v === "none" ? "" : v,
                    })
                  }
                  disabled={!taskForm.internCategoryId}
                >
                  <SelectTrigger data-testid="select-task-subcategory">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {getSubcategoriesForCategory(taskForm.internCategoryId).map(
                      (s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-status">Status</Label>
                <Select
                  value={taskForm.status}
                  onValueChange={(v) =>
                    setTaskForm({ ...taskForm, status: v as any })
                  }
                >
                  <SelectTrigger data-testid="select-task-status">
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
              <div>
                <Label htmlFor="task-priority">Priority</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(v) =>
                    setTaskForm({ ...taskForm, priority: v as any })
                  }
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-start-date">Start Date</Label>
                <Input
                  id="task-start-date"
                  type="date"
                  value={taskForm.startDate}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, startDate: e.target.value })
                  }
                  data-testid="input-task-start-date"
                />
              </div>
              <div>
                <Label htmlFor="task-due-date">Due Date</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, dueDate: e.target.value })
                  }
                  data-testid="input-task-due-date"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetTaskForm}>
              Cancel
            </Button>
            <Button
              onClick={handleTaskSubmit}
              disabled={!taskForm.title || isSubmitting}
              data-testid="button-save-task"
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
