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
import {
  Plus,
  Edit,
  Trash2,
  Layers,
  ExternalLink,
  Search,
  Loader2,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type CategoryOption = { id: string; name: string; isActive?: boolean };
type SubcategoryOption = {
  id: string;
  categoryId: string;
  name: string;
  isActive?: boolean;
};

type SubProjectItem = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  repositoryUrl: string | null;
  websiteUrl: string | null;
  internCategoryId: string | null;
  subcategoryId: string | null;
  createdAt: string | null;
};

type SubProjectPayload = {
  name: string;
  description?: string | null;
  category?: string | null;
  repositoryUrl?: string | null;
  websiteUrl?: string | null;
  internCategoryId?: string | null;
  subcategoryId?: string | null;
};

const EMPTY_FORM: SubProjectPayload = {
  name: "",
  description: "",
  category: "",
  repositoryUrl: "",
  websiteUrl: "",
  internCategoryId: null,
  subcategoryId: null,
};

interface SubProjectManagementProps {
  categoryFilter?: "all" | "interns" | "training" | "dao";
}

export default function SubProjectManagement({
  categoryFilter = "all",
}: SubProjectManagementProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<SubProjectItem | null>(null);
  const [form, setForm] = useState<SubProjectPayload>(EMPTY_FORM);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [filterSubcategoryId, setFilterSubcategoryId] = useState<string>("all");

  const { data: subProjects = [], isLoading } = useQuery<SubProjectItem[]>({
    queryKey: ["/api/admin/sub-projects"],
  });

  const { data: categories = [] } = useQuery<CategoryOption[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allSubcategories = [] } = useQuery<SubcategoryOption[]>({
    queryKey: ["/api/subcategories"],
  });

  const getSubcategoriesForCategory = (categoryId: string | null | undefined) =>
    allSubcategories.filter((s) => s.categoryId === categoryId);

  const getSubcategoryName = (id: string | null) => {
    if (!id) return null;
    return allSubcategories.find((s) => s.id === id)?.name || null;
  };

  const createMutation = useMutation({
    mutationFn: async (data: SubProjectPayload) => {
      const res = await apiRequest("/api/admin/sub-projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sub-projects"] });
      closeDialog();
      toast({ title: "Sub-project created" });
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to create sub-project",
        variant: "destructive",
      }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: SubProjectPayload;
    }) => {
      const res = await apiRequest(`/api/admin/sub-projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sub-projects"] });
      closeDialog();
      toast({ title: "Sub-project updated" });
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to update sub-project",
        variant: "destructive",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/admin/sub-projects/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sub-projects"] });
      toast({ title: "Sub-project deleted" });
    },
    onError: () =>
      toast({
        title: "Error",
        description: "Failed to delete sub-project",
        variant: "destructive",
      }),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  }

  function openEdit(sp: SubProjectItem) {
    setEditing(sp);
    setForm({
      name: sp.name,
      description: sp.description || "",
      category: sp.category || "",
      repositoryUrl: sp.repositoryUrl || "",
      websiteUrl: sp.websiteUrl || "",
      internCategoryId: sp.internCategoryId || null,
      subcategoryId: sp.subcategoryId || null,
    });
    setShowDialog(true);
  }

  function closeDialog() {
    setShowDialog(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit() {
    if (!form.name.trim()) return;
    const payload: SubProjectPayload = {
      ...form,
      internCategoryId: form.internCategoryId || null,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const categoryFilteredSubProjects =
    categoryFilter === "all"
      ? subProjects
      : categoryFilter === "interns"
        ? subProjects.filter((sp) => sp.category === "Interns Project")
        : categoryFilter === "training"
          ? subProjects.filter((sp) => sp.category === "Test Project")
          : subProjects.filter((sp) => sp.category === "DAO");

  const filtered = categoryFilteredSubProjects
    .filter((sp) =>
      filterCategoryId === "all"
        ? true
        : sp.internCategoryId === filterCategoryId,
    )
    .filter((sp) =>
      filterSubcategoryId === "all"
        ? true
        : sp.subcategoryId === filterSubcategoryId,
    )
    .filter(
      (sp) =>
        sp.name.toLowerCase().includes(search.toLowerCase()) ||
        (sp.description || "").toLowerCase().includes(search.toLowerCase()),
    );

  const getCategoryName = (id: string | null) => {
    if (!id) return null;
    return categories.find((c) => c.id === id)?.name || null;
  };

  return (
    <div className="space-y-6" data-testid="sub-project-management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Layers className="h-6 w-6 text-muted-foreground" />
          <h2 className="text-lg sm:text-xl font-semibold">Sub-Project Management</h2>
          <Badge variant="secondary">{subProjects.length}</Badge>
        </div>
        <Button onClick={openCreate} data-testid="button-add-sub-project" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Sub-Project
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sub-projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-sub-projects"
          />
        </div>
        <Select
          value={filterCategoryId}
          onValueChange={(v) => {
            setFilterCategoryId(v);
            setFilterSubcategoryId("all");
          }}
        >
          <SelectTrigger className="w-[180px]" data-testid="filter-sub-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
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
          <SelectTrigger className="w-[180px]" data-testid="filter-sub-subcategory">
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
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No sub-projects found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Intern Category</TableHead>
                <TableHead>Subcategory</TableHead>
                <TableHead>Links</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sp) => (
                <TableRow key={sp.id} data-testid={`row-sub-project-${sp.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{sp.name}</p>
                      {sp.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {sp.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {sp.category ? (
                      <Badge variant="outline">{sp.category}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getCategoryName(sp.internCategoryId) ? (
                      <Badge variant="secondary">
                        {getCategoryName(sp.internCategoryId)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">All</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getSubcategoryName(sp.subcategoryId) ? (
                      <Badge variant="outline">
                        {getSubcategoryName(sp.subcategoryId)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {sp.repositoryUrl && (
                        <a
                          href={sp.repositoryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs"
                          data-testid={`link-sub-repo-${sp.id}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {sp.websiteUrl && (
                        <a
                          href={sp.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs"
                          data-testid={`link-sub-web-${sp.id}`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(sp)}
                        data-testid={`button-edit-sub-${sp.id}`}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Delete this sub-project?"))
                            deleteMutation.mutate(sp.id);
                        }}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-sub-${sp.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Sub-Project" : "Add Sub-Project"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Sub-project name"
                data-testid="input-sub-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Description"
                rows={3}
                data-testid="input-sub-description"
              />
            </div>
            <div>
              <Label>Category (project type)</Label>
              <Select
                value={form.category || "__none__"}
                onValueChange={(v) =>
                  setForm({ ...form, category: v === "__none__" ? null : v })
                }
              >
                <SelectTrigger data-testid="select-sub-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  <SelectItem value="Test Project">Test Project</SelectItem>
                  <SelectItem value="Interns Project">
                    Interns Project
                  </SelectItem>
                  <SelectItem value="DAO">DAO</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Intern Category</Label>
                <Select
                  value={form.internCategoryId || "__none__"}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      internCategoryId: v === "__none__" ? null : v,
                      subcategoryId: null,
                    })
                  }
                >
                  <SelectTrigger data-testid="select-sub-intern-category">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">All Categories</SelectItem>
                    {categories.map((c) => (
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
                      subcategoryId: v === "__none__" ? null : v,
                    })
                  }
                  disabled={!form.internCategoryId}
                >
                  <SelectTrigger data-testid="select-sub-intern-subcategory">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {getSubcategoriesForCategory(form.internCategoryId).map(
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
            <div>
              <Label>Repository / Github URL:</Label>
              <Input
                value={form.repositoryUrl || ""}
                onChange={(e) =>
                  setForm({ ...form, repositoryUrl: e.target.value })
                }
                placeholder="https://github.com/..."
                data-testid="input-sub-repo"
              />
            </div>
            <div>
              <Label>Document/Details URL:</Label>
              <Input
                value={form.websiteUrl || ""}
                onChange={(e) =>
                  setForm({ ...form, websiteUrl: e.target.value })
                }
                placeholder="https://..."
                data-testid="input-sub-website"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !form.name.trim() ||
                createMutation.isPending ||
                updateMutation.isPending
              }
              data-testid="button-submit-sub-project"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
