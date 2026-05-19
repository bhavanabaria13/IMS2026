
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Plus, Edit, Trash2, ExternalLink, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";
import type { Project } from "@shared/schema";

export default function InternProjectsPage() {
  const { toast } = useToast();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedProjectForTask, setSelectedProjectForTask] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({ name: "", description: "", repositoryUrl: "", deployedUrl: "" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", dueDate: "" });
  const [, setLocation] = useLocation();

  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ["/api/intern/projects"],
    retry: false,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (error) {
      const errorMessage = (error as any).message || "";
      if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
        toast({
          title: "Session expired",
          description: "Please login again",
          variant: "destructive"
        });
        setLocation("/intern/login");
      }
    }
  }, [error, toast, setLocation]);

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/intern/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create project");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/projects"] });
      toast({ title: "✅ Project created successfully" });
      setShowCreateProject(false);
      setProjectForm({ name: "", description: "", repositoryUrl: "", deployedUrl: "" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create project", 
        variant: "destructive" 
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/intern/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update project");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/projects"] });
      toast({ title: "✅ Project updated successfully" });
      setEditingProject(null);
      setProjectForm({ name: "", description: "", repositoryUrl: "", deployedUrl: "" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update project", 
        variant: "destructive" 
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/intern/projects/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/projects"] });
      toast({ title: "✅ Project deleted successfully" });
      setDeletingProject(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete project", 
        variant: "destructive" 
      });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/intern/create-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/tasks"] });
      toast({ title: "✅ Task created successfully for project" });
      setShowCreateTask(false);
      setSelectedProjectForTask(null);
      setTaskForm({ title: "", description: "", priority: "medium", dueDate: "" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create task", 
        variant: "destructive" 
      });
    },
  });

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || "",
      repositoryUrl: project.repositoryUrl || "",
      deployedUrl: project.deployedUrl || "",
    });
  };

  const handleSave = () => {
    if (!projectForm.name.trim()) {
      toast({ 
        title: "Error", 
        description: "Project name is required", 
        variant: "destructive" 
      });
      return;
    }

    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data: projectForm });
    } else {
      createProjectMutation.mutate(projectForm);
    }
  };

  const handleCreateTask = (project: Project) => {
    setSelectedProjectForTask(project);
    setTaskForm({ title: "", description: "", priority: "medium", dueDate: "" });
    setShowCreateTask(true);
  };

  const handleSaveTask = () => {
    if (!taskForm.title.trim()) {
      toast({ 
        title: "Error", 
        description: "Task title is required", 
        variant: "destructive" 
      });
      return;
    }

    const taskData = {
      ...taskForm,
      projectId: selectedProjectForTask?.id,
      projectName: selectedProjectForTask?.name,
    };

    createTaskMutation.mutate(taskData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              My Projects
            </h1>
          </div>
          <Button onClick={() => setShowCreateProject(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Projects List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Repository</TableHead>
                    <TableHead>Deployed URL</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No projects yet. Create your first project!
                      </TableCell>
                    </TableRow>
                  ) : (
                    projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell className="max-w-xs truncate">{project.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={
                            project.status === "completed" ? "default" :
                            project.status === "in-progress" ? "secondary" : "outline"
                          }>
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {project.repositoryUrl ? (
                            <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              View
                            </a>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {project.deployedUrl ? (
                            <a href={project.deployedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              View
                            </a>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleCreateTask(project)}
                              className="h-8 px-2"
                              title="Create task for this project"
                            >
                              <ListPlus className="h-4 w-4 mr-1" />
                              Task
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEdit(project)}
                              className="h-8 w-8 p-0"
                              title="Edit project"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setDeletingProject(project)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                              title="Delete project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Project Dialog */}
      <Dialog open={showCreateProject || !!editingProject} onOpenChange={(open) => {
        if (!open) {
          setShowCreateProject(false);
          setEditingProject(null);
          setProjectForm({ name: "", description: "", repositoryUrl: "", deployedUrl: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "Create New Project"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project Name</Label>
              <Input
                value={projectForm.name}
                onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                placeholder="Project name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                placeholder="Project description..."
              />
            </div>
            <div>
              <Label>Repository URL</Label>
              <Input
                value={projectForm.repositoryUrl}
                onChange={(e) => setProjectForm({ ...projectForm, repositoryUrl: e.target.value })}
                placeholder="https://github.com/..."
              />
            </div>
            <div>
              <Label>Deployed URL</Label>
              <Input
                value={projectForm.deployedUrl}
                onChange={(e) => setProjectForm({ ...projectForm, deployedUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateProject(false);
              setEditingProject(null);
              setProjectForm({ name: "", description: "", repositoryUrl: "", deployedUrl: "" });
            }}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={!projectForm.name || createProjectMutation.isPending || updateProjectMutation.isPending}
            >
              {createProjectMutation.isPending || updateProjectMutation.isPending 
                ? "Saving..." 
                : editingProject ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task for Project Dialog */}
      <Dialog open={showCreateTask} onOpenChange={(open) => {
        if (!open) {
          setShowCreateTask(false);
          setSelectedProjectForTask(null);
          setTaskForm({ title: "", description: "", priority: "medium", dueDate: "" });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task for {selectedProjectForTask?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Task Title</Label>
              <Input
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Task description..."
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({ ...taskForm, priority: v })}>
                <SelectTrigger>
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
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateTask(false);
              setSelectedProjectForTask(null);
              setTaskForm({ title: "", description: "", priority: "medium", dueDate: "" });
            }}>Cancel</Button>
            <Button 
              onClick={handleSaveTask} 
              disabled={!taskForm.title || createTaskMutation.isPending}
            >
              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProject} onOpenChange={(open) => !open && setDeletingProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProject?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingProject && deleteProjectMutation.mutate(deletingProject.id)} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
