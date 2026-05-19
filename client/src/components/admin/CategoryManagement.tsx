import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  FolderKanban,
  Loader2,
  BookOpen,
  GripVertical,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

interface CourseTopic {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export default function CategoryManagement() {
  const { toast } = useToast();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [subcategoryDialog, setSubcategoryDialog] = useState(false);
  const [topicDialog, setTopicDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [editingTopic, setEditingTopic] = useState<CourseTopic | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<string>("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [topicFormName, setTopicFormName] = useState("");
  const [topicFormOrder, setTopicFormOrder] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: subcategoriesMap } = useQuery<Record<string, Subcategory[]>>({
    queryKey: ["/api/categories/all-subcategories"],
    queryFn: async () => {
      const map: Record<string, Subcategory[]> = {};
      for (const cat of categories) {
        const res = await fetch(`/api/categories/${cat.id}/subcategories`);
        if (res.ok) {
          map[cat.id] = await res.json();
        }
      }
      return map;
    },
    enabled: categories.length > 0,
  });

  const { data: allCourseTopics = [] } = useQuery<CourseTopic[]>({
    queryKey: ["/api/admin/course-topics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/course-topics", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const getTopicsForCategory = (categoryId: string) =>
    allCourseTopics.filter(t => t.categoryId === categoryId).sort((a, b) => a.sortOrder - b.sortOrder);

  const openAddCategory = () => {
    setEditingCategory(null);
    setFormName("");
    setFormDescription("");
    setCategoryDialog(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || "");
    setCategoryDialog(true);
  };

  const openAddSubcategory = (categoryId: string) => {
    setEditingSubcategory(null);
    setParentCategoryId(categoryId);
    setFormName("");
    setFormDescription("");
    setSubcategoryDialog(true);
  };

  const openEditSubcategory = (sub: Subcategory) => {
    setEditingSubcategory(sub);
    setParentCategoryId(sub.categoryId);
    setFormName(sub.name);
    setFormDescription(sub.description || "");
    setSubcategoryDialog(true);
  };

  const openAddTopic = (categoryId: string) => {
    setEditingTopic(null);
    setParentCategoryId(categoryId);
    const existingTopics = getTopicsForCategory(categoryId);
    setTopicFormName("");
    setTopicFormOrder(existingTopics.length);
    setTopicDialog(true);
  };

  const openEditTopic = (topic: CourseTopic) => {
    setEditingTopic(topic);
    setParentCategoryId(topic.categoryId);
    setTopicFormName(topic.name);
    setTopicFormOrder(topic.sortOrder);
    setTopicDialog(true);
  };

  const handleSaveCategory = async () => {
    if (!formName.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: formName.trim(), description: formDescription.trim() || null }),
      });
      if (!res.ok) throw new Error("Failed to save category");
      toast({ title: "Success", description: editingCategory ? "Category updated" : "Category created" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setCategoryDialog(false);
    } catch {
      toast({ title: "Error", description: "Failed to save category", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSubcategory = async () => {
    if (!formName.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const url = editingSubcategory
        ? `/api/admin/subcategories/${editingSubcategory.id}`
        : "/api/admin/subcategories";
      const method = editingSubcategory ? "PUT" : "POST";
      const body: any = { name: formName.trim(), description: formDescription.trim() || null };
      if (!editingSubcategory) body.categoryId = parentCategoryId;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save subcategory");
      toast({ title: "Success", description: editingSubcategory ? "Subcategory updated" : "Subcategory created" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories/all-subcategories"] });
      setSubcategoryDialog(false);
    } catch {
      toast({ title: "Error", description: "Failed to save subcategory", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveTopic = async () => {
    if (!topicFormName.trim()) {
      toast({ title: "Error", description: "Topic name is required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const url = editingTopic
        ? `/api/admin/course-topics/${editingTopic.id}`
        : "/api/admin/course-topics";
      const method = editingTopic ? "PUT" : "POST";
      const body: any = { name: topicFormName.trim(), sortOrder: topicFormOrder };
      if (!editingTopic) body.categoryId = parentCategoryId;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save course topic");
      toast({ title: "Success", description: editingTopic ? "Course topic updated" : "Course topic created" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-topics"] });
      setTopicDialog(false);
    } catch {
      toast({ title: "Error", description: "Failed to save course topic", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCategory = async (cat: Category) => {
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    } catch {
      toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
    }
  };

  const handleToggleSubcategory = async (sub: Subcategory) => {
    try {
      const res = await fetch(`/api/admin/subcategories/${sub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !sub.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      queryClient.invalidateQueries({ queryKey: ["/api/categories/all-subcategories"] });
    } catch {
      toast({ title: "Error", description: "Failed to update subcategory", variant: "destructive" });
    }
  };

  const handleToggleTopic = async (topic: CourseTopic) => {
    try {
      const res = await fetch(`/api/admin/course-topics/${topic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !topic.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-topics"] });
    } catch {
      toast({ title: "Error", description: "Failed to update course topic", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category and all its subcategories?")) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Deleted", description: "Category removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories/all-subcategories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-topics"] });
    } catch {
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    }
  };

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm("Delete this subcategory?")) return;
    try {
      const res = await fetch(`/api/admin/subcategories/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Deleted", description: "Subcategory removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories/all-subcategories"] });
    } catch {
      toast({ title: "Error", description: "Failed to delete subcategory", variant: "destructive" });
    }
  };

  const handleDeleteTopic = async (id: string) => {
    if (!confirm("Delete this course topic?")) return;
    try {
      const res = await fetch(`/api/admin/course-topics/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      toast({ title: "Deleted", description: "Course topic removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/course-topics"] });
    } catch {
      toast({ title: "Error", description: "Failed to delete course topic", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold" data-testid="text-categories-title">Intern Categories</h2>
          <p className="text-sm text-muted-foreground">Manage training categories, subcategories, and course topics</p>
        </div>
        <Button onClick={openAddCategory} data-testid="button-add-category" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No categories yet. Create your first category to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const subs = subcategoriesMap?.[cat.id] || [];
            const topics = getTopicsForCategory(cat.id);
            const isExpanded = expandedCategory === cat.id;
            return (
              <Card key={cat.id} className="border-border/50" data-testid={`card-category-${cat.id}`}>
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 p-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setExpandedCategory(isExpanded ? null : cat.id)}
                      data-testid={`button-expand-${cat.id}`}
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{cat.name}</span>
                        <Badge variant={cat.isActive ? "default" : "secondary"} className="text-xs">
                          {cat.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {subs.length} subcategories
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {topics.length} course topics
                        </Badge>
                      </div>
                      {cat.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{cat.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={cat.isActive}
                        onCheckedChange={() => handleToggleCategory(cat)}
                        data-testid={`switch-category-${cat.id}`}
                      />
                      <Button variant="ghost" size="icon" onClick={() => openEditCategory(cat)} data-testid={`button-edit-category-${cat.id}`}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)} data-testid={`button-delete-category-${cat.id}`}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border/50 bg-muted/30 p-4 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-semibold">Course Topics</span>
                          <Badge variant="outline" className="text-xs">{topics.length}</Badge>
                        </div>
                        {topics.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-3 pl-6">No course topics yet</p>
                        ) : (
                          <div className="space-y-1">
                            {topics.map((topic, idx) => (
                              <div key={topic.id} className="flex items-center gap-3 pl-6 py-2 rounded-lg hover:bg-background/50" data-testid={`row-topic-${topic.id}`}>
                                <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                                <span className="text-xs text-muted-foreground w-6">{idx + 1}.</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{topic.name}</span>
                                    {!topic.isActive && (
                                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Switch
                                    checked={topic.isActive}
                                    onCheckedChange={() => handleToggleTopic(topic)}
                                    data-testid={`switch-topic-${topic.id}`}
                                  />
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditTopic(topic)} data-testid={`button-edit-topic-${topic.id}`}>
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteTopic(topic.id)} data-testid={`button-delete-topic-${topic.id}`}>
                                    <Trash2 className="h-3 w-3 text-red-400" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-6 mt-2"
                          onClick={() => openAddTopic(cat.id)}
                          data-testid={`button-add-topic-${cat.id}`}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Course Topic
                        </Button>
                      </div>

                      <div className="border-t border-border/30 pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <FolderKanban className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-semibold">Subcategories</span>
                          <Badge variant="outline" className="text-xs">{subs.length}</Badge>
                        </div>
                        {subs.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-3 pl-6">No subcategories yet</p>
                        ) : (
                          subs.map((sub) => (
                            <div key={sub.id} className="flex items-center gap-3 pl-6 py-2 rounded-lg hover:bg-background/50" data-testid={`row-subcategory-${sub.id}`}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{sub.name}</span>
                                  <Badge variant={sub.isActive ? "default" : "secondary"} className="text-xs">
                                    {sub.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                {sub.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{sub.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Switch
                                  checked={sub.isActive}
                                  onCheckedChange={() => handleToggleSubcategory(sub)}
                                  data-testid={`switch-subcategory-${sub.id}`}
                                />
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditSubcategory(sub)} data-testid={`button-edit-subcategory-${sub.id}`}>
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteSubcategory(sub.id)} data-testid={`button-delete-subcategory-${sub.id}`}>
                                  <Trash2 className="h-3 w-3 text-red-400" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-6 mt-2"
                          onClick={() => openAddSubcategory(cat.id)}
                          data-testid={`button-add-subcategory-${cat.id}`}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Subcategory
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Blockchain & Web3"
                data-testid="input-category-name"
              />
            </div>
            <div>
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of this category"
                data-testid="input-category-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory} disabled={isSubmitting} data-testid="button-save-category">
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={subcategoryDialog} onOpenChange={setSubcategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubcategory ? "Edit Subcategory" : "Add Subcategory"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="sub-name">Name *</Label>
              <Input
                id="sub-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Smart Contract Development"
                data-testid="input-subcategory-name"
              />
            </div>
            <div>
              <Label htmlFor="sub-desc">Description</Label>
              <Textarea
                id="sub-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of this subcategory"
                data-testid="input-subcategory-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubcategoryDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveSubcategory} disabled={isSubmitting} data-testid="button-save-subcategory">
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSubcategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={topicDialog} onOpenChange={setTopicDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTopic ? "Edit Course Topic" : "Add Course Topic"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="topic-name">Topic Name *</Label>
              <Input
                id="topic-name"
                value={topicFormName}
                onChange={(e) => setTopicFormName(e.target.value)}
                placeholder="e.g. Blockchain Basics"
                data-testid="input-topic-name"
              />
            </div>
            <div>
              <Label htmlFor="topic-order">Sort Order</Label>
              <Input
                id="topic-order"
                type="number"
                value={topicFormOrder}
                onChange={(e) => setTopicFormOrder(parseInt(e.target.value) || 0)}
                data-testid="input-topic-order"
              />
              <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first on the front page</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopicDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveTopic} disabled={isSubmitting} data-testid="button-save-topic">
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTopic ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
