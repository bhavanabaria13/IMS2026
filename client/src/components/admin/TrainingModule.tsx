import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, Search, Eye, Trash2, BookOpen, FileQuestion, GraduationCap, Users,
} from "lucide-react";
import type { Intern } from "@shared/schema";

export default function TrainingModule() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: allInterns = [], isLoading } = useQuery<Intern[]>({
    queryKey: ["/api/interns"],
    queryFn: async () => {
      const res = await fetch("/api/interns", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId) return null;
    const cat = categories.find((c: any) => c.id === categoryId);
    return cat?.name || null;
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/interns/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interns"] });
      toast({ title: "Deleted", description: "Intern has been removed." });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete intern.", variant: "destructive" });
    },
  });

  const trainingInterns = allInterns.filter(i =>
    (i.qualificationPath === "course_first" || i.qualificationPath === "entrance_test") &&
    ["pending", "training", "testing", "training_complete"].includes(i.internshipStatus)
  );

  const courseInterns = trainingInterns.filter(i => i.qualificationPath === "course_first");
  const examInterns = trainingInterns.filter(i => i.qualificationPath === "entrance_test");

  const filtered = trainingInterns.filter(i => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      i.name.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      (i.skills || "").toLowerCase().includes(q);
    const matchesFilter = filter === "all" ||
      (filter === "course_first" && i.qualificationPath === "course_first") ||
      (filter === "entrance_test" && i.qualificationPath === "entrance_test");
    const matchesCategory = categoryFilter === "all" || i.categoryId === categoryFilter;
    return matchesSearch && matchesFilter && matchesCategory;
  });

  const getPathBadge = (path: string) => {
    return path === "course_first"
      ? <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30">Training Course</Badge>
      : <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">Direct Exam</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case "training": return <Badge variant="outline" className="text-blue-400 border-blue-500/30">In Training</Badge>;
      case "testing": return <Badge variant="outline" className="text-orange-400 border-orange-500/30">Testing</Badge>;
      case "training_complete": return <Badge variant="outline" className="text-green-400 border-green-500/30">Training Complete</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="training-module">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 cursor-pointer hover:border-purple-500/30" onClick={() => setFilter("all")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold">{trainingInterns.length}</p>
                <p className="text-xs text-muted-foreground">Total Trainees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 cursor-pointer hover:border-purple-500/30" onClick={() => setFilter(filter === "course_first" ? "all" : "course_first")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold">{courseInterns.length}</p>
                <p className="text-xs text-muted-foreground">Training Course</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 cursor-pointer hover:border-blue-500/30" onClick={() => setFilter(filter === "entrance_test" ? "all" : "entrance_test")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileQuestion className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{examInterns.length}</p>
                <p className="text-xs text-muted-foreground">Direct Exam</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg">Training & Exam Applicants</CardTitle>
            {filter !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setFilter("all")} data-testid="button-clear-filter">
                Clear filter: {filter === "course_first" ? "Training Course" : "Direct Exam"}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-training"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]" data-testid="filter-training-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.filter((c: any) => c.isActive).map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No trainees found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((intern) => (
                    <TableRow key={intern.id} data-testid={`training-row-${intern.id}`}>
                      <TableCell className="font-medium">{intern.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{intern.email}</TableCell>
                      <TableCell>
                        {getCategoryName(intern.categoryId) ? (
                          <Badge variant="outline" className="text-xs">{getCategoryName(intern.categoryId)}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getPathBadge(intern.qualificationPath)}</TableCell>
                      <TableCell>{getStatusBadge(intern.internshipStatus)}</TableCell>
                      <TableCell>
                        {intern.qualificationPath === "course_first" && (
                          <span className="text-sm">{intern.courseProgress || 0}%</span>
                        )}
                        {intern.qualificationPath === "entrance_test" && (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {intern.appliedDate
                          ? new Date(intern.appliedDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedIntern(intern)} data-testid={`button-view-${intern.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => setDeleteId(intern.id)} data-testid={`button-delete-${intern.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedIntern} onOpenChange={() => setSelectedIntern(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Trainee Details</DialogTitle>
          </DialogHeader>
          {selectedIntern && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Name</Label>
                  <p className="font-medium">{selectedIntern.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  <p className="font-medium text-sm">{selectedIntern.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Phone</Label>
                  <p className="font-medium">{selectedIntern.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">City</Label>
                  <p className="font-medium">{selectedIntern.city}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Education</Label>
                <p className="font-medium">{selectedIntern.education}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Skills</Label>
                <p className="font-medium">{selectedIntern.skills}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Qualification Path</Label>
                  <div className="mt-1">{getPathBadge(selectedIntern.qualificationPath)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedIntern.internshipStatus)}</div>
                </div>
              </div>
              {selectedIntern.qualificationPath === "course_first" && (
                <div>
                  <Label className="text-muted-foreground text-sm">Course Progress</Label>
                  <p className="font-medium">{selectedIntern.courseProgress || 0}%</p>
                </div>
              )}
              {selectedIntern.github && (
                <div>
                  <Label className="text-muted-foreground text-sm">GitHub</Label>
                  <a href={selectedIntern.github} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline block">{selectedIntern.github}</a>
                </div>
              )}
              {selectedIntern.linkedin && (
                <div>
                  <Label className="text-muted-foreground text-sm">LinkedIn</Label>
                  <a href={selectedIntern.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline block">{selectedIntern.linkedin}</a>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedIntern(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trainee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trainee? This action cannot be undone and will remove all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
