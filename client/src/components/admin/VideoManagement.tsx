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
  Video,
  ExternalLink,
  Search,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type VideoItem = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  categoryId: string | null;
  subcategoryId: string | null;
  videoType: string;
  isActive: boolean;
  createdAt: string | null;
};

type Category = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

type Subcategory = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

type CreateVideoPayload = {
  title: string;
  description?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  categoryId?: string | null;
  subcategoryId?: string | null;
  videoType: string;
  isActive: boolean;
};

type UpdateVideoPayload = Partial<CreateVideoPayload>;

const VIDEO_TYPES = [
  { value: "training", label: "Training" },
  { value: "internship", label: "Internship" },
  { value: "dao", label: "DAO" },
];

const emptyForm = {
  title: "",
  description: "",
  videoUrl: "",
  thumbnailUrl: "",
  categoryId: "",
  subcategoryId: "",
  videoType: "training",
  isActive: true,
};

export default function VideoManagement() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSubcategory, setFilterSubcategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allVideos = [], isLoading: videosLoading } = useQuery<VideoItem[]>({
    queryKey: ["/api/admin/videos"],
    queryFn: async () => {
      const res = await fetch("/api/admin/videos", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch videos");
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const { data: allSubcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories"],
    queryFn: async () => {
      const res = await fetch("/api/subcategories", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch subcategories");
      return res.json();
    },
  });

  const formSubcategories = form.categoryId
    ? allSubcategories.filter((s) => s.categoryId === form.categoryId)
    : [];

  const filterSubcategories = filterCategory !== "all"
    ? allSubcategories.filter((s) => s.categoryId === filterCategory)
    : [];

  const filteredVideos = allVideos.filter((v) => {
    if (filterType !== "all" && v.videoType !== filterType) return false;
    if (filterCategory !== "all" && v.categoryId !== filterCategory) return false;
    if (filterSubcategory !== "all" && v.subcategoryId !== filterSubcategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return v.title.toLowerCase().includes(q) || (v.description || "").toLowerCase().includes(q);
    }
    return true;
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const payload: CreateVideoPayload = {
        title: data.title,
        videoUrl: data.videoUrl,
        videoType: data.videoType,
        isActive: data.isActive,
        description: data.description || null,
        thumbnailUrl: data.thumbnailUrl || null,
        categoryId: data.categoryId || null,
        subcategoryId: data.subcategoryId || null,
      };
      const res = await apiRequest("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/videos"] });
      toast({ title: "Video added successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to add video", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof emptyForm }) => {
      const payload: UpdateVideoPayload = {
        title: data.title,
        videoUrl: data.videoUrl,
        videoType: data.videoType,
        isActive: data.isActive,
        description: data.description || null,
        thumbnailUrl: data.thumbnailUrl || null,
        categoryId: data.categoryId || null,
        subcategoryId: data.subcategoryId || null,
      };
      const res = await apiRequest(`/api/admin/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/videos"] });
      toast({ title: "Video updated successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to update video", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/admin/videos/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/videos"] });
      toast({ title: "Video deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete video", variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest(`/api/admin/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/videos"] });
    },
    onError: () => {
      toast({ title: "Failed to update video status", variant: "destructive" });
    },
  });

  function openAdd() {
    setEditingVideo(null);
    setForm(emptyForm);
    setShowDialog(true);
  }

  function openEdit(video: VideoItem) {
    setEditingVideo(video);
    setForm({
      title: video.title,
      description: video.description || "",
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl || "",
      categoryId: video.categoryId || "",
      subcategoryId: video.subcategoryId || "",
      videoType: video.videoType,
      isActive: video.isActive,
    });
    setShowDialog(true);
  }

  function closeDialog() {
    setShowDialog(false);
    setEditingVideo(null);
    setForm(emptyForm);
  }

  function handleSubmit() {
    if (!form.title.trim() || !form.videoUrl.trim()) {
      toast({ title: "Title and Video URL are required", variant: "destructive" });
      return;
    }
    if (editingVideo) {
      updateMutation.mutate({ id: editingVideo.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  function getCategoryBadge(categoryId: string | null) {
    if (!categoryId) return <span className="text-muted-foreground">—</span>;
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return <Badge variant="outline">Unknown</Badge>;
    const catColors: Record<string, string> = {
      "Web3+AI": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      "Digital Marketing": "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
      "Graphics Design": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      "Business Development": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "DAO": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    };
    return (
      <Badge className={catColors[cat.name] || ""} variant="outline">
        {cat.name}
      </Badge>
    );
  }

  function getSubcategoryBadge(subcategoryId: string | null) {
    if (!subcategoryId) return <span className="text-muted-foreground">—</span>;
    const sub = allSubcategories.find((s) => s.id === subcategoryId);
    if (!sub) return <Badge variant="outline">Unknown</Badge>;
    return (
      <Badge
        variant="outline"
        className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
        data-testid={`badge-subcategory-${subcategoryId}`}
      >
        {sub.name}
      </Badge>
    );
  }

  function getVideoTypeBadge(type: string) {
    const colors: Record<string, string> = {
      training: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      internship: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      dao: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    return (
      <Badge className={colors[type] || ""} variant="outline" data-testid={`badge-type-${type}`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card data-testid="video-management-card">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Management
        </CardTitle>
        <Button onClick={openAdd} data-testid="button-add-video" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Video
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-videos"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]" data-testid="select-filter-type">
              <SelectValue placeholder="Video Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {VIDEO_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filterCategory}
            onValueChange={(val) => {
              setFilterCategory(val);
              setFilterSubcategory("all");
            }}
          >
            <SelectTrigger className="w-[180px]" data-testid="select-filter-category">
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
            value={filterSubcategory}
            onValueChange={setFilterSubcategory}
            disabled={filterCategory === "all" || filterSubcategories.length === 0}
          >
            <SelectTrigger className="w-[180px]" data-testid="select-filter-subcategory">
              <SelectValue placeholder="Subcategory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subcategories</SelectItem>
              {filterSubcategories.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {videosLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="text-no-videos">
            {allVideos.length === 0
              ? "No videos added yet. Click 'Add Video' to get started."
              : "No videos match the current filters."}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subcategory</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos.map((video) => (
                  <TableRow key={video.id} data-testid={`row-video-${video.id}`}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {video.title}
                    </TableCell>
                    <TableCell>{getVideoTypeBadge(video.videoType)}</TableCell>
                    <TableCell>{getCategoryBadge(video.categoryId)}</TableCell>
                    <TableCell>{getSubcategoryBadge(video.subcategoryId)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleActiveMutation.mutate({
                            id: video.id,
                            isActive: !video.isActive,
                          })
                        }
                        data-testid={`button-toggle-active-${video.id}`}
                      >
                        {video.isActive ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="ml-1 text-xs">
                          {video.isActive ? "Active" : "Inactive"}
                        </span>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                        data-testid={`link-video-url-${video.id}`}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(video)}
                          data-testid={`button-edit-video-${video.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete this video?")) {
                              deleteMutation.mutate(video.id);
                            }
                          }}
                          data-testid={`button-delete-video-${video.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-2 text-sm text-muted-foreground" data-testid="text-video-count">
          {filteredVideos.length} video{filteredVideos.length !== 1 ? "s" : ""}{" "}
          {filterType !== "all" || filterCategory !== "all" || searchQuery
            ? `(filtered from ${allVideos.length} total)`
            : "total"}
        </div>
      </CardContent>

      <Dialog open={showDialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg" data-testid="dialog-video-form">
          <DialogHeader>
            <DialogTitle>{editingVideo ? "Edit Video" : "Add Video"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-title">Title *</Label>
              <Input
                id="video-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter video title"
                data-testid="input-video-title"
              />
            </div>
            <div>
              <Label htmlFor="video-description">Description</Label>
              <Textarea
                id="video-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Enter video description"
                rows={3}
                data-testid="input-video-description"
              />
            </div>
            <div>
              <Label htmlFor="video-url">Video URL *</Label>
              <Input
                id="video-url"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                data-testid="input-video-url"
              />
            </div>
            <div>
              <Label htmlFor="video-thumbnail">Thumbnail URL</Label>
              <Input
                id="video-thumbnail"
                value={form.thumbnailUrl}
                onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
                placeholder="https://example.com/thumbnail.jpg"
                data-testid="input-video-thumbnail"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Video Type *</Label>
                <Select
                  value={form.videoType}
                  onValueChange={(val) => setForm({ ...form, videoType: val })}
                >
                  <SelectTrigger data-testid="select-video-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VIDEO_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={form.categoryId || "__none__"}
                  onValueChange={(val) =>
                    setForm({
                      ...form,
                      categoryId: val === "__none__" ? "" : val,
                      subcategoryId: "",
                    })
                  }
                >
                  <SelectTrigger data-testid="select-video-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No Category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Subcategory</Label>
              <Select
                value={form.subcategoryId || "__none__"}
                onValueChange={(val) =>
                  setForm({ ...form, subcategoryId: val === "__none__" ? "" : val })
                }
                disabled={!form.categoryId || formSubcategories.length === 0}
              >
                <SelectTrigger data-testid="select-video-subcategory">
                  <SelectValue
                    placeholder={
                      !form.categoryId
                        ? "Select a category first"
                        : formSubcategories.length === 0
                        ? "No subcategories available"
                        : "Select subcategory"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No Subcategory (all)</SelectItem>
                  {formSubcategories.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel-video">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-video">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingVideo ? "Update" : "Add"} Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
