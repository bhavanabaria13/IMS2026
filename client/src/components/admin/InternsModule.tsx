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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Search, Eye, Trash2, Users, Briefcase, CheckCircle2, FolderKanban,
} from "lucide-react";
import type { Intern } from "@shared/schema";

interface InternsModuleProps {
  statusFilter?: "training" | "joined" | "dao";
}

export default function InternsModule({ statusFilter }: InternsModuleProps = {}) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
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

  const { data: subcategories = [] } = useQuery<any[]>({
    queryKey: ["/api/subcategories"],
    queryFn: async () => {
      const res = await fetch("/api/subcategories", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const cat = categories.find((c: any) => c.id === categoryId);
    return cat?.name || null;
  };

  const getSubcategoryName = (subcategoryId: string | null | undefined) => {
    if (!subcategoryId) return null;
    const sub = subcategories.find((s: any) => s.id === subcategoryId);
    return sub?.name || null;
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

  const baseInterns = statusFilter === "training"
    ? allInterns.filter(i => ["training", "training_complete"].includes(i.internshipStatus))
    : statusFilter === "dao"
    ? allInterns.filter(i => i.daoMembershipApplied)
    : allInterns.filter(i => ["internship", "completed"].includes(i.internshipStatus));

  const joinedInterns = baseInterns;

  const activeInterns = joinedInterns.filter(i => i.internshipStatus === "internship" || (statusFilter === "training" && i.internshipStatus === "training"));
  const completedInterns = joinedInterns.filter(i => i.internshipStatus === "completed" || (statusFilter === "training" && i.internshipStatus === "training_complete"));

  const filtered = joinedInterns.filter(i => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      i.name.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      (i.skills || "").toLowerCase().includes(q);
    const matchesFilter = filter === "all" ||
      (filter === "internship" && i.internshipStatus === "internship") ||
      (filter === "completed" && i.internshipStatus === "completed") ||
      (filter === "training" && i.internshipStatus === "training") ||
      (filter === "training_complete" && i.internshipStatus === "training_complete");
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "internship": return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">Active Intern</Badge>;
      case "completed": return <Badge className="bg-green-500/10 text-green-400 border-green-500/30">Completed</Badge>;
      case "training": return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">In Training</Badge>;
      case "training_complete": return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Training Complete</Badge>;
      case "pending": return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/30">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPathBadge = (path: string) => {
    return path === "course_first"
      ? <Badge variant="outline" className="text-purple-400 border-purple-500/30">Training Course</Badge>
      : <Badge variant="outline" className="text-blue-400 border-blue-500/30">Direct Exam</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const summaryLabels = statusFilter === "training"
    ? { total: "Total Training", active: "In Training", completed: "Training Complete", activeFilter: "training", completedFilter: "training_complete" }
    : statusFilter === "dao"
    ? { total: "Total DAO", active: "Active DAO", completed: "Completed", activeFilter: "internship", completedFilter: "completed" }
    : { total: "Total Joined", active: "Active Interns", completed: "Completed", activeFilter: "internship", completedFilter: "completed" };

  return (
    <div className="space-y-6" data-testid="interns-module">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50 cursor-pointer hover:border-purple-500/30" onClick={() => setFilter("all")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold">{joinedInterns.length}</p>
                <p className="text-xs text-muted-foreground">{summaryLabels.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 cursor-pointer hover:border-blue-500/30" onClick={() => setFilter(filter === summaryLabels.activeFilter ? "all" : summaryLabels.activeFilter)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{activeInterns.length}</p>
                <p className="text-xs text-muted-foreground">{summaryLabels.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 cursor-pointer hover:border-green-500/30" onClick={() => setFilter(filter === summaryLabels.completedFilter ? "all" : summaryLabels.completedFilter)}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold">{completedInterns.length}</p>
                <p className="text-xs text-muted-foreground">{summaryLabels.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg">{statusFilter === "training" ? "Training Interns" : statusFilter === "dao" ? "DAO Joined Interns" : "Joined Interns"}</CardTitle>
            {filter !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setFilter("all")} data-testid="button-clear-filter">
                Clear filter: {filter === "internship" ? "Active" : "Completed"}
              </Button>
            )}
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-interns"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No interns found.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subcategory</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Skills</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((intern) => (
                    <TableRow key={intern.id} data-testid={`intern-row-${intern.id}`}>
                      <TableCell className="font-medium">{intern.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{intern.email}</TableCell>
                      <TableCell>
                        {getCategoryName(intern.categoryId) ? (
                          <Badge variant="outline" className="text-xs" data-testid={`badge-category-${intern.id}`}>
                            {getCategoryName(intern.categoryId)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getSubcategoryName(intern.subcategoryId) ? (
                          <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-500/30" data-testid={`badge-subcategory-${intern.id}`}>
                            {getSubcategoryName(intern.subcategoryId)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getPathBadge(intern.qualificationPath)}</TableCell>
                      <TableCell>{getStatusBadge(intern.internshipStatus)}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{intern.skills || "-"}</TableCell>
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
            <DialogTitle>Intern Details</DialogTitle>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Terms Accepted</Label>
                  <p className="font-medium">{selectedIntern.termsAccepted ? "Yes" : "No"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">DAO Applied</Label>
                  <p className="font-medium">{selectedIntern.daoMembershipApplied ? "Yes" : "No"}</p>
                </div>
              </div>
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
            <AlertDialogTitle>Delete Intern</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this intern? This action cannot be undone and will remove all their data including tasks, projects, and certificates.
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
