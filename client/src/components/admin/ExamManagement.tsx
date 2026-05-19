import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

/* ================= TYPES ================= */

export type Exam = {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  total_marks: number;
  start_time?: string;
  end_time?: string;
  is_published: boolean;
  intern_category_id?: string | null;
  created_at: string;
};

/* ================= COMPONENT ================= */

export default function ExamManagement() {
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration_minutes: 60,
    total_marks: 100,
    start_time: "",
    end_time: "",
    is_published: false,
    intern_category_id: "",
  });

  const { data: internCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const getInternCategoryName = (id: string | null | undefined) => {
    if (!id) return null;
    const cat = internCategories.find((c: any) => c.id === id);
    return cat?.name || null;
  };

  /* ================= FETCH ================= */

  const { data: exams = [], isLoading } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
    queryFn: async () => {
      const res = await fetch("/api/exams", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exams");
      return res.json();
    },
  });

  /* ================= MUTATIONS ================= */

 const createExam = useMutation({
  mutationFn: async (data: any) => {
    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "500 Server Error");
    }

    return result;
  },

  onError: (err: any) => {
    console.error("500 ERROR:", err.message);

    toast({
      title: "500 Internal Server Error",
      description: err.message,
      variant: "destructive",
    });
  },
});

  const updateExam = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/exams/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      toast({ title: "Exam updated successfully" });
      resetForm();
    },
  });

  const deleteExam = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/exams/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      toast({ title: "Exam deleted" });
    },
  });

  /* ================= HELPERS ================= */

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      duration_minutes: 60,
      total_marks: 100,
      start_time: "",
      end_time: "",
      is_published: false,
      intern_category_id: "",
    });
    setEditingExam(null);
    setOpen(false);
  };

  const handleSubmit = () => {
    if (!formData.title) {
      toast({
        title: "Validation error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...formData,
      intern_category_id: formData.intern_category_id === "none" ? null : formData.intern_category_id || null,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
    };

    if (editingExam) {
      updateExam.mutate({ id: editingExam.id, data: payload });
    } else {
      createExam.mutate(payload);
    }
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      description: exam.description || "",
      duration_minutes: exam.duration_minutes,
      total_marks: exam.total_marks,
      start_time: exam.start_time?.slice(0, 16) || "",
      end_time: exam.end_time?.slice(0, 16) || "",
      is_published: exam.is_published,
      intern_category_id: exam.intern_category_id || "",
    });
    setOpen(true);
  };

  /* ================= UI ================= */

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Exam Management</CardTitle>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Exam
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p>Loading exams...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>{exam.title}</TableCell>
                  <TableCell>
                    {getInternCategoryName(exam.intern_category_id) ? (
                      <Badge variant="secondary" className="text-xs">{getInternCategoryName(exam.intern_category_id)}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">All</span>
                    )}
                  </TableCell>
                  <TableCell>{exam.duration_minutes} mins</TableCell>
                  <TableCell>{exam.total_marks}</TableCell>
                  <TableCell>
                    {exam.start_time
                      ? new Date(exam.start_time).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={exam.is_published ? "default" : "outline"}>
                      {exam.is_published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(exam)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteExam.mutate(exam.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* ================= DIALOG ================= */}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingExam ? "Edit Exam" : "Create Exam"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_minutes: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <Label>Total Marks</Label>
                <Input
                  type="number"
                  value={formData.total_marks}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      total_marks: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData({ ...formData, start_time: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>End Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData({ ...formData, end_time: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Intern Category</Label>
              <Select
                value={formData.intern_category_id}
                onValueChange={(v) => setFormData({ ...formData, intern_category_id: v })}
              >
                <SelectTrigger data-testid="select-exam-category">
                  <SelectValue placeholder="Select category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Categories</SelectItem>
                  {internCategories.filter((c: any) => c.isActive).map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingExam ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
