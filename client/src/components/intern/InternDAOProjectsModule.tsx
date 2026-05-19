import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, FolderKanban, Github, ExternalLink } from "lucide-react";
import type { Project } from "@shared/schema";

export default function InternDAOProjectsModule() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    repositoryUrl: "",
    deployedUrl: "",
  });

  const { data, isLoading } = useQuery<{
    myProjects: Project[];
    categoryProjects: Project[];
    allDaoProjects: Project[];
  }>({
    queryKey: ["/api/intern/dao/projects"],
    queryFn: async () => {
      const res = await fetch("/api/intern/dao/projects", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const projects = data?.myProjects ?? [];

  const createProjectMutation = useMutation({
    mutationFn: async (data: typeof newProject) => {
      const response = await fetch("/api/intern/dao/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to create project");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/dao/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/projects"] });
      setShowCreateDialog(false);
      setNewProject({ name: "", description: "", repositoryUrl: "", deployedUrl: "" });
      toast({ title: "Project created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const activeProjects = projects.filter(p => p.status === "in-progress");
  const completedProjects = projects.filter(p => p.status === "completed");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold" data-testid="text-total-projects">{projects.length}</div>
            <p className="text-sm text-muted-foreground">Total Projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600" data-testid="text-active-projects">{activeProjects.length}</div>
            <p className="text-sm text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600" data-testid="text-completed-projects">{completedProjects.length}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            My Projects
          </CardTitle>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-project">
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading projects...</p>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No projects yet</p>
              <p className="text-sm text-muted-foreground">As a DAO member, you can create your own projects and tasks.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Links</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id} data-testid={`row-project-${project.id}`}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{project.description || "-"}</TableCell>
                      <TableCell>
                        <Badge className={
                          project.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-blue-500/10 text-blue-500"
                        }>
                          {project.status === "completed" ? "Completed" : "In Progress"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {project.repositoryUrl && (
                            <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                              <Github className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </a>
                          )}
                          {project.deployedUrl && (
                            <a href={project.deployedUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </a>
                          )}
                          {!project.repositoryUrl && !project.deployedUrl && "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Create a new project as a DAO member. You can then create tasks under this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project Name</Label>
              <Input
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="e.g. Smart Contract Audit Tool"
                data-testid="input-project-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Describe the project goals and scope"
                data-testid="input-project-description"
              />
            </div>
            <div>
              <Label>Repository URL (optional)</Label>
              <Input
                value={newProject.repositoryUrl}
                onChange={(e) => setNewProject({ ...newProject, repositoryUrl: e.target.value })}
                placeholder="https://github.com/..."
                data-testid="input-repo-url"
              />
            </div>
            <div>
              <Label>Deployed URL (optional)</Label>
              <Input
                value={newProject.deployedUrl}
                onChange={(e) => setNewProject({ ...newProject, deployedUrl: e.target.value })}
                placeholder="https://..."
                data-testid="input-deployed-url"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createProjectMutation.mutate(newProject)}
              disabled={!newProject.name || createProjectMutation.isPending}
              data-testid="button-submit-project"
            >
              {createProjectMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
