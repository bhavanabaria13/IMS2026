import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Plus, Edit, Trash2, BookOpen, Filter } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CourseModule } from "@shared/schema";

const EMPTY_FORM = {
  weekNumber: 1,
  title: "",
  description: "",
  category: "video",
  orderIndex: 1,
  internCategoryId: "",
  subcategoryId: "",
};

export default function CourseModuleManagement() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CourseModule | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterWeek, setFilterWeek] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [searchTitle, setSearchTitle] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("all");

  const { data: modules = [], isLoading } = useQuery<CourseModule[]>({
    queryKey: ["/api/admin/course-modules"],
    queryFn: async () => {
      const res = await fetch("/api/admin/course-modules", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch course modules");
      return res.json();
    },
  });

  const { data: internCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: subcategories = [] } = useQuery<any[]>({
    queryKey: ["/api/subcategories"],
  });

  const getCategoryName = (id: string | null | undefined) => {
    if (!id) return null;
    const cat = internCategories.find((c: any) => c.id === id);
    return cat?.name || null;
  };

  const getSubcategoryName = (id: string | null | undefined) => {
    if (!id) return null;
    const sub = subcategories.find((s: any) => s.id === id);
    return sub?.name || null;
  };

  const getSubcategoriesForCategory = (categoryId: string) => {
    if (!categoryId || categoryId === "none") return [];
    return subcategories.filter(
      (s: any) => s.categoryId === categoryId && s.isActive !== false,
    );
  };

  const createModule = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/course-modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create module");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/course-modules"],
      });
      resetForm();
      toast({ title: "Course module created successfully" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateModule = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/course-modules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update module");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/course-modules"],
      });
      resetForm();
      toast({ title: "Course module updated successfully" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/course-modules/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete module");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/course-modules"],
      });
      toast({ title: "Course module deleted" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({ ...EMPTY_FORM });
    setEditing(null);
    setOpen(false);
  };

  const handleEdit = (mod: CourseModule) => {
    setEditing(mod);
    setFormData({
      weekNumber: mod.weekNumber,
      title: mod.title,
      description: mod.description || "",
      category: mod.category,
      orderIndex: mod.orderIndex,
      internCategoryId: mod.internCategoryId || "",
      subcategoryId: (mod as any).subcategoryId || "",
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.category) {
      toast({
        title: "Validation error",
        description: "Title and category type are required",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...formData,
      internCategoryId:
        formData.internCategoryId === "none"
          ? null
          : formData.internCategoryId || null,
      subcategoryId:
        formData.subcategoryId === "none"
          ? null
          : formData.subcategoryId || null,
    };

    if (editing) {
      updateModule.mutate({ id: editing.id, data: payload });
    } else {
      createModule.mutate(payload);
    }
  };

  const filteredModules = modules.filter((m) => {
    if (filterCategory !== "all" && m.internCategoryId !== filterCategory)
      return false;
    if (
      filterSubcategory !== "all" &&
      (m as any).subcategoryId !== filterSubcategory
    )
      return false;

    if (filterWeek !== "all" && m.weekNumber !== Number(filterWeek))
      return false;

    if (
      searchTitle &&
      !m.title.toLowerCase().includes(searchTitle.toLowerCase())
    )
      return false;
    return true;
  });

  const totalPages = Math.ceil(filteredModules.length / itemsPerPage);
  const paginatedModules = filteredModules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const uniqueWeeks = [...new Set(modules.map((m) => m.weekNumber))].sort(
    (a, b) => a - b,
  );

  return (
    <Card data-testid="card-course-module-management">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <CardTitle>Course Module Management</CardTitle>
          <Badge variant="secondary" className="ml-2">
            {modules.length} modules
          </Badge>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          data-testid="button-add-course-module"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Module
        </Button>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filterWeek}
              onValueChange={(v) => {
                setFilterWeek(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px]" data-testid="filter-week">
                <SelectValue placeholder="Filter by week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Weeks</SelectItem>
                {uniqueWeeks.map((w) => (
                  <SelectItem key={w} value={String(w)}>
                    Week {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select
            value={filterCategory}
            onValueChange={(v) => {
              setFilterCategory(v);
              setFilterSubcategory("all");
              setCurrentPage(1);
            }}
          >
            <SelectTrigger
              className="w-[180px]"
              data-testid="filter-intern-category"
            >
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {internCategories
                .filter((c: any) => c.isActive)
                .map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select
            value={filterSubcategory}
            onValueChange={(v) => {
              setFilterSubcategory(v);
              setCurrentPage(1);
            }}
            disabled={filterCategory === "all"}
          >
            <SelectTrigger
              className="w-[180px]"
              data-testid="filter-intern-subcategory"
            >
              <SelectValue
                placeholder={
                  filterCategory === "all"
                    ? "Select a category first"
                    : "All subcategories"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subcategories</SelectItem>
              {getSubcategoriesForCategory(filterCategory).map((sub: any) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground py-8 text-center">
            Loading modules...
          </p>
        ) : filteredModules.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No course modules found. Add your first module.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Intern Category</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedModules.map((mod) => (
                  <TableRow
                    key={mod.id}
                    data-testid={`row-course-module-${mod.id}`}
                  >
                    <TableCell>
                      <Badge variant="outline">Week {mod.weekNumber}</Badge>
                    </TableCell>
                    <TableCell>{mod.orderIndex}</TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{mod.title}</span>
                        {mod.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {mod.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {mod.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getCategoryName(mod.internCategoryId) ? (
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryName(mod.internCategoryId)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          All
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getSubcategoryName((mod as any).subcategoryId) ? (
                        <Badge variant="outline" className="text-xs">
                          {getSubcategoryName((mod as any).subcategoryId)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(mod)}
                        data-testid={`button-edit-module-${mod.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteModule.mutate(mod.id)}
                        data-testid={`button-delete-module-${mod.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({filteredModules.length}{" "}
              modules)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                data-testid="button-prev-page"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                data-testid="button-next-page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) resetForm();
          else setOpen(v);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Course Module" : "Add Course Module"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g. Introduction to Smart Contracts"
                data-testid="input-module-title"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Module description..."
                data-testid="input-module-description"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Week Number</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.weekNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weekNumber: Number(e.target.value),
                    })
                  }
                  data-testid="input-module-week"
                />
              </div>
              <div>
                <Label>Order Index</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.orderIndex}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      orderIndex: Number(e.target.value),
                    })
                  }
                  data-testid="input-module-order"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Module Type</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) =>
                    setFormData({ ...formData, category: v })
                  }
                >
                  <SelectTrigger data-testid="select-module-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Intern Category</Label>
                <Select
                  value={formData.internCategoryId}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      internCategoryId: v,
                      subcategoryId: "",
                    })
                  }
                >
                  <SelectTrigger data-testid="select-module-intern-category">
                    <SelectValue placeholder="All categories" />
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
              <Label>Subcategory</Label>
              <Select
                value={formData.subcategoryId}
                onValueChange={(v) =>
                  setFormData({ ...formData, subcategoryId: v })
                }
                disabled={
                  !formData.internCategoryId ||
                  formData.internCategoryId === "none"
                }
              >
                <SelectTrigger data-testid="select-module-subcategory">
                  <SelectValue
                    placeholder={
                      !formData.internCategoryId ||
                      formData.internCategoryId === "none"
                        ? "Select a category first"
                        : "All subcategories"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Subcategories</SelectItem>
                  {getSubcategoriesForCategory(formData.internCategoryId).map(
                    (sub: any) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetForm}
              data-testid="button-cancel-module"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createModule.isPending || updateModule.isPending}
              data-testid="button-submit-module"
            >
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
