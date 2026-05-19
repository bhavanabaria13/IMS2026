import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Eye, Calendar, Star, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";
import type { WeeklyUpdate } from "@shared/schema";

const UPDATES_PER_PAGE = 10;

interface InternWeeklyUpdatesModuleProps {
  profile: any;
}

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const initialFormData = {
  fullName: "",
  email: "",
  programCourseName: "",
  weekNumber: getWeekNumber(new Date()),
  year: new Date().getFullYear(),
  reportingPeriod: "",
  learningTopics: "",
  tasksCompleted: "",
  workOutput: "",
  githubRepoLink: "",
  deployedUrl: "",
  taskCompletionStatus: "",
  selfRating: 3,
  timeSpent: "",
  challengesFaced: "",
  solutionsAttempted: "",
  keyLearnings: "",
};

export default function InternWeeklyUpdatesModule({ profile }: InternWeeklyUpdatesModuleProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<WeeklyUpdate | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const { data: updates = [], refetch } = useQuery<WeeklyUpdate[]>({
    queryKey: ["/api/intern/my-weekly-updates"],
    queryFn: async () => {
      const res = await fetch("/api/intern/my-weekly-updates", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch updates");
      return res.json();
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/intern/weekly-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create update");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/my-weekly-updates"] });
      toast({ title: "Weekly update submitted successfully" });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/intern/weekly-updates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update");
      }
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/my-weekly-updates"] });
      toast({ title: "Weekly update updated successfully" });
      setShowEditDialog(false);
      setSelectedUpdate(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/intern/weekly-updates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete");
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/my-weekly-updates"] });
      toast({ title: "Weekly update deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete update", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      fullName: profile?.name || "",
      email: profile?.email || "",
    });
  };

  const openCreateDialog = () => {
    setFormData({
      ...initialFormData,
      fullName: profile?.name || "",
      email: profile?.email || "",
    });
    setShowCreateDialog(true);
  };

  const openEditDialog = (update: WeeklyUpdate) => {
    setSelectedUpdate(update);
    setFormData({
      fullName: update.fullName,
      email: update.email,
      programCourseName: update.programCourseName,
      weekNumber: update.weekNumber,
      year: update.year,
      reportingPeriod: update.reportingPeriod,
      learningTopics: update.learningTopics || "",
      tasksCompleted: update.tasksCompleted || "",
      workOutput: update.workOutput || "",
      githubRepoLink: update.githubRepoLink || "",
      deployedUrl: update.deployedUrl || "",
      taskCompletionStatus: update.taskCompletionStatus || "",
      selfRating: update.selfRating || 3,
      timeSpent: update.timeSpent || "",
      challengesFaced: update.challengesFaced || "",
      solutionsAttempted: update.solutionsAttempted || "",
      keyLearnings: update.keyLearnings || "",
    });
    setShowEditDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.fullName || !formData.email || !formData.programCourseName || !formData.reportingPeriod) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedUpdate) return;
    updateMutation.mutate({ id: selectedUpdate.id, data: formData });
  };

  const renderFormFields = () => (
    <ScrollArea className="h-[60vh] pr-4">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Full Name *</Label>
            <Input
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Your full name"
              data-testid="input-full-name"
            />
          </div>
          <div>
            <Label>Email Address *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your.email@example.com"
              data-testid="input-email"
            />
          </div>
        </div>

        <div>
          <Label>Program / Course Name *</Label>
          <Input
            value={formData.programCourseName}
            onChange={(e) => setFormData({ ...formData, programCourseName: e.target.value })}
            placeholder="e.g., Blockchain Development Internship"
            data-testid="input-program"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Week Number *</Label>
            <Input
              type="number"
              min={1}
              max={53}
              value={formData.weekNumber}
              onChange={(e) => setFormData({ ...formData, weekNumber: parseInt(e.target.value) || 1 })}
              data-testid="input-week-number"
            />
          </div>
          <div>
            <Label>Year *</Label>
            <Input
              type="number"
              min={2020}
              max={2030}
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
              data-testid="input-year"
            />
          </div>
        </div>

        <div>
          <Label>Reporting Period * (e.g., 15 Dec - 19 Dec 2025)</Label>
          <Input
            value={formData.reportingPeriod}
            onChange={(e) => setFormData({ ...formData, reportingPeriod: e.target.value })}
            placeholder="e.g., 15 Dec - 19 Dec 2025"
            data-testid="input-reporting-period"
          />
        </div>

        <div>
          <Label>Learning Topics Covered</Label>
          <Textarea
            value={formData.learningTopics}
            onChange={(e) => setFormData({ ...formData, learningTopics: e.target.value })}
            placeholder="What topics did you learn this week?"
            data-testid="input-learning-topics"
          />
        </div>

        <div>
          <Label>What Tasks Did You Complete This Week?</Label>
          <Textarea
            value={formData.tasksCompleted}
            onChange={(e) => setFormData({ ...formData, tasksCompleted: e.target.value })}
            placeholder="List the tasks you completed"
            data-testid="input-tasks-completed"
          />
        </div>

        <div>
          <Label>Work Output / Deliverables</Label>
          <Textarea
            value={formData.workOutput}
            onChange={(e) => setFormData({ ...formData, workOutput: e.target.value })}
            placeholder="e.g., smart contract deployed, React UI built, API completed"
            data-testid="input-work-output"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>GitHub Repository Link</Label>
            <Input
              value={formData.githubRepoLink}
              onChange={(e) => setFormData({ ...formData, githubRepoLink: e.target.value })}
              placeholder="https://github.com/..."
              data-testid="input-github-link"
            />
          </div>
          <div>
            <Label>Deployed URL / Demo Link</Label>
            <Input
              value={formData.deployedUrl}
              onChange={(e) => setFormData({ ...formData, deployedUrl: e.target.value })}
              placeholder="https://..."
              data-testid="input-deployed-url"
            />
          </div>
        </div>

        <div>
          <Label>Task Completion Status</Label>
          <Select
            value={formData.taskCompletionStatus}
            onValueChange={(v) => setFormData({ ...formData, taskCompletionStatus: v })}
          >
            <SelectTrigger data-testid="select-completion-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-completed">All tasks completed</SelectItem>
              <SelectItem value="mostly-completed">Mostly completed (75%+)</SelectItem>
              <SelectItem value="partially-completed">Partially completed (50-75%)</SelectItem>
              <SelectItem value="in-progress">Still in progress (less than 50%)</SelectItem>
              <SelectItem value="blocked">Blocked / Need help</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Self-Rating for This Week (1-5)</Label>
            <Select
              value={String(formData.selfRating)}
              onValueChange={(v) => setFormData({ ...formData, selfRating: parseInt(v) })}
            >
              <SelectTrigger data-testid="select-self-rating">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Needs Improvement</SelectItem>
                <SelectItem value="2">2 - Below Average</SelectItem>
                <SelectItem value="3">3 - Average</SelectItem>
                <SelectItem value="4">4 - Good</SelectItem>
                <SelectItem value="5">5 - Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Time Spent on Tasks (Approx.)</Label>
            <Input
              value={formData.timeSpent}
              onChange={(e) => setFormData({ ...formData, timeSpent: e.target.value })}
              placeholder="e.g., 20 hours, 4 hours/day"
              data-testid="input-time-spent"
            />
          </div>
        </div>

        <div>
          <Label>Challenges / Issues Faced</Label>
          <Textarea
            value={formData.challengesFaced}
            onChange={(e) => setFormData({ ...formData, challengesFaced: e.target.value })}
            placeholder="What challenges did you encounter?"
            data-testid="input-challenges"
          />
        </div>

        <div>
          <Label>How Did You Try to Solve Them?</Label>
          <Textarea
            value={formData.solutionsAttempted}
            onChange={(e) => setFormData({ ...formData, solutionsAttempted: e.target.value })}
            placeholder="What solutions did you try?"
            data-testid="input-solutions"
          />
        </div>

        <div>
          <Label>Key Learnings This Week</Label>
          <Textarea
            value={formData.keyLearnings}
            onChange={(e) => setFormData({ ...formData, keyLearnings: e.target.value })}
            placeholder="What were your key takeaways?"
            data-testid="input-key-learnings"
          />
        </div>
      </div>
    </ScrollArea>
  );

  const thisWeekUpdates = updates.filter(u => u.weekNumber === getWeekNumber(new Date()) && u.year === new Date().getFullYear());

  const filteredUpdates = updates.filter((u) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.programCourseName.toLowerCase().includes(q) ||
      u.reportingPeriod.toLowerCase().includes(q) ||
      (u.taskCompletionStatus || "").toLowerCase().includes(q) ||
      String(u.weekNumber).includes(q)
    );
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredUpdates.length / UPDATES_PER_PAGE);
  const paginatedUpdates = filteredUpdates.slice(
    (currentPage - 1) * UPDATES_PER_PAGE,
    currentPage * UPDATES_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{updates.length}</div>
            <p className="text-sm text-muted-foreground">Total Updates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{thisWeekUpdates.length}</div>
            <p className="text-sm text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {updates.length > 0 
                ? Math.round(updates.reduce((sum, u) => sum + (u.selfRating || 0), 0) / updates.length * 10) / 10
                : "-"
              }
            </div>
            <p className="text-sm text-muted-foreground">Avg Self-Rating</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle>My Weekly Updates</CardTitle>
          <Button onClick={openCreateDialog} data-testid="button-new-update">
            <Plus className="h-4 w-4 mr-2" />
            Submit Weekly Update
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by week, period, status..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-updates"
              />
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Reporting Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Self-Rating</TableHead>
                  <TableHead>Mentor Feedback</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUpdates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {searchQuery ? "No updates match your search" : "No weekly updates submitted yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUpdates.map((update) => (
                    <TableRow key={update.id}>
                      <TableCell>Week {update.weekNumber}, {update.year}</TableCell>
                      <TableCell>{update.reportingPeriod}</TableCell>
                      <TableCell>
                        <Badge variant={update.taskCompletionStatus === "all-completed" ? "default" : "secondary"}>
                          {update.taskCompletionStatus || "Not specified"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          {update.selfRating || "-"}/5
                        </div>
                      </TableCell>
                      <TableCell>
                        {update.performanceScore ? (
                          <Badge variant="outline">{update.performanceScore}/5</Badge>
                        ) : (
                          <span className="text-muted-foreground">Pending</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUpdate(update);
                              setShowViewDialog(true);
                            }}
                            data-testid={`button-view-${update.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(update)}
                            data-testid={`button-edit-${update.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this update?")) {
                                deleteMutation.mutate(update.id);
                              }
                            }}
                            data-testid={`button-delete-${update.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredUpdates.length > UPDATES_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4">
              <p className="text-sm text-muted-foreground" data-testid="text-updates-page-info">
                Showing {(currentPage - 1) * UPDATES_PER_PAGE + 1}-{Math.min(currentPage * UPDATES_PER_PAGE, filteredUpdates.length)} of {filteredUpdates.length} updates
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  data-testid="button-updates-prev"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      size="sm"
                      variant={page === currentPage ? "default" : "outline"}
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(page)}
                      data-testid={`button-updates-page-${page}`}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  data-testid="button-updates-next"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Weekly Update</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-submit-update">
              {createMutation.isPending ? "Submitting..." : "Submit Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Weekly Update</DialogTitle>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-save-update">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Weekly Update Details</DialogTitle>
          </DialogHeader>
          {selectedUpdate && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{selectedUpdate.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedUpdate.email}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Program / Course</Label>
                  <p className="font-medium">{selectedUpdate.programCourseName}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Week</Label>
                    <p className="font-medium">Week {selectedUpdate.weekNumber}, {selectedUpdate.year}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Reporting Period</Label>
                    <p className="font-medium">{selectedUpdate.reportingPeriod}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Learning Topics Covered</Label>
                  <p>{selectedUpdate.learningTopics || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tasks Completed</Label>
                  <p>{selectedUpdate.tasksCompleted || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Work Output / Deliverables</Label>
                  <p>{selectedUpdate.workOutput || "-"}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">GitHub Link</Label>
                    {selectedUpdate.githubRepoLink ? (
                      <a href={selectedUpdate.githubRepoLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Repository
                      </a>
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Deployed URL</Label>
                    {selectedUpdate.deployedUrl ? (
                      <a href={selectedUpdate.deployedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Demo
                      </a>
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Task Completion Status</Label>
                    <p className="font-medium">{selectedUpdate.taskCompletionStatus || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Self-Rating</Label>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{selectedUpdate.selfRating || "-"}/5</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Time Spent</Label>
                  <p>{selectedUpdate.timeSpent || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Challenges Faced</Label>
                  <p>{selectedUpdate.challengesFaced || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Solutions Attempted</Label>
                  <p>{selectedUpdate.solutionsAttempted || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Key Learnings</Label>
                  <p>{selectedUpdate.keyLearnings || "-"}</p>
                </div>
                {(selectedUpdate.performanceScore || selectedUpdate.mentorFeedback) && (
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Mentor Feedback</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Performance Score</Label>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-green-500 fill-green-500" />
                          <span className="font-medium">{selectedUpdate.performanceScore || "-"}/5</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Feedback</Label>
                        <p>{selectedUpdate.mentorFeedback || "No feedback yet"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
