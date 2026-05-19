import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Search,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Mail,
  Calendar,
  ClipboardCheck,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

interface ReviewCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  qualificationPath: string;
  internshipStatus: string;
  courseProgress: number;
  appliedDate: string | null;
  categoryName: string | null;
  subcategoryName: string | null;
  lastRejection: {
    note: string | null;
    rejectedAt: string | null;
    adminUsername: string | null;
  } | null;
  submission: {
    courseTotal: number;
    courseCompleted: number;
    coursePercentage: number;
    week4Total: number;
    week4Completed: number;
    week4Percentage: number;
    demoProjectsTotal: number;
    demoProjectsCompleted: number;
    lastSubmittedAt: string | null;
  };
}

const statusBadge = (status: string) => {
  switch (status) {
    case "training_complete":
      return (
        <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30">
          Pending review
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-red-500/15 text-red-300 border border-red-500/30">
          Required Corrections Pending
        </Badge>
      );
    case "internship":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
          Approved
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-blue-500/15 text-blue-300 border border-blue-500/30">
          Completed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const formatDate = (d: string | Date | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(d);
  }
};

const pathLabel = (p: string) =>
  p === "course_first"
    ? "Direct Exam (Week 4)"
    : p === "entrance_test"
      ? "Entrance Test Project"
      : p;

export default function InternshipReviewModule() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ReviewCandidate | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const { data: candidates = [], isLoading } = useQuery<ReviewCandidate[]>({
    queryKey: ["/api/admin/internship-review/candidates"],
    queryFn: async () => {
      const res = await fetch(
        "/api/admin/internship-review/candidates",
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to load candidates");
      return res.json();
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q),
    );
  }, [candidates, search]);

  const approveMutation = useMutation({
    mutationFn: async (internId: string) => {
      const res = await fetch(
        `/api/admin/internship-review/${internId}/approve`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await res.json().catch(() => ({}) as any);
      if (!res.ok)
        throw new Error(data?.message || `Request failed (${res.status})`);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Approved for internship",
        description: data?.message || "Offer letter generated.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/internship-review/candidates"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/interns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setSelected(null);
    },
    onError: (err: any) => {
      toast({
        title: "Approval failed",
        description: err?.message || "Could not approve this intern.",
        variant: "destructive",
      });
    },
  });

  const undoMutation = useMutation({
    mutationFn: async (internId: string) => {
      const res = await fetch(
        `/api/admin/internship-review/${internId}/undo`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await res.json().catch(() => ({}) as any);
      if (!res.ok)
        throw new Error(data?.message || `Request failed (${res.status})`);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Applicant reset",
        description: data?.message || "Progress has been wiped.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/internship-review/candidates"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/interns"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/interns-with-status"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setSelected(null);
    },
    onError: (err: any) => {
      toast({
        title: "Reset failed",
        description: err?.message || "Could not reset this applicant.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (payload: { internId: string; note: string }) => {
      const res = await fetch(
        `/api/admin/interns/${payload.internId}/action`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType: "rejection",
            note: payload.note,
          }),
        },
      );
      const data = await res.json().catch(() => ({}) as any);
      if (!res.ok)
        throw new Error(data?.message || `Request failed (${res.status})`);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Task Rejected – Corrections Required",
        description:
          data?.message || "Correction note saved and email notification sent.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/internship-review/candidates"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/interns"] });
      setRejectOpen(false);
      setRejectNote("");
      setSelected(null);
    },
    onError: (err: any) => {
      toast({
        title: "Rejection failed",
        description: err?.message || "Could not reject this intern.",
        variant: "destructive",
      });
    },
  });

  const submitReject = () => {
    const trimmed = rejectNote.trim();
    if (trimmed.length === 0) {
      toast({
        title: "Reason required",
        description:
          "Please describe why you are rejecting this intern before submitting.",
        variant: "destructive",
      });
      return;
    }
    if (!selected) return;
    rejectMutation.mutate({ internId: selected.id, note: trimmed });
  };

  // -------- Detail view --------
  if (selected) {
    const s = selected.submission;
    const isApproved =
      selected.internshipStatus === "internship" ||
      selected.internshipStatus === "completed";
    const isRejected = selected.internshipStatus === "rejected";
    return (
      <div className="space-y-6" data-testid="internship-review-detail">
        <Button
          variant="ghost"
          onClick={() => setSelected(null)}
          data-testid="button-back-to-review-list"
        >
          ← Back to candidates
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <CardTitle
                  className="text-xl flex items-center gap-2"
                  data-testid="text-review-intern-name"
                >
                  <GraduationCap className="h-5 w-5 text-primary" />
                  {selected.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span data-testid="text-review-intern-email">
                    {selected.email}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Applied: {formatDate(selected.appliedDate)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant="outline"
                  className="bg-cyan-500/20 text-cyan-300"
                  data-testid="badge-review-path"
                >
                  {pathLabel(selected.qualificationPath)}
                </Badge>
                <span data-testid="badge-review-status">
                  {statusBadge(selected.internshipStatus)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="p-4 rounded-md border bg-muted/30"
                data-testid="stat-course-progress"
              >
                <div className="text-xs text-muted-foreground uppercase">
                  Course progress
                </div>
                <div className="text-2xl font-semibold mt-1">
                  {s.coursePercentage}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {s.courseCompleted} / {s.courseTotal} modules
                </div>
              </div>
              <div
                className="p-4 rounded-md border bg-muted/30"
                data-testid="stat-week4-progress"
              >
                <div className="text-xs text-muted-foreground uppercase">
                  Week 4 (direct exam)
                </div>
                <div className="text-2xl font-semibold mt-1">
                  {s.week4Percentage}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {s.week4Completed} / {s.week4Total} modules
                </div>
              </div>
              <div
                className="p-4 rounded-md border bg-muted/30"
                data-testid="stat-demo-projects"
              >
                <div className="text-xs text-muted-foreground uppercase">
                  Test project tasks
                </div>
                <div className="text-2xl font-semibold mt-1">
                  {s.demoProjectsCompleted} / {s.demoProjectsTotal}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Last submission: {formatDate(s.lastSubmittedAt)}
                </div>
              </div>
            </div>

            {isRejected && selected.lastRejection && (
              <div
                className="rounded-md bg-red-500/10 border border-red-500/30 text-sm p-3 space-y-1"
                data-testid="box-previous-rejection"
              >
                <div className="font-medium text-red-300 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Previous Correction Request
                  {selected.lastRejection.rejectedAt && (
                    <span className="text-xs text-muted-foreground font-normal">
                      · {formatDate(selected.lastRejection.rejectedAt)}
                    </span>
                  )}
                  {selected.lastRejection.adminUsername && (
                    <span className="text-xs text-muted-foreground font-normal">
                      · by {selected.lastRejection.adminUsername}
                    </span>
                  )}
                </div>
                {selected.lastRejection.note && (
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {selected.lastRejection.note}
                  </p>
                )}
              </div>
            )}

            {isApproved && (
              <div
                className="rounded-md bg-emerald-500/10 border border-emerald-500/30 text-sm p-3 flex gap-2 items-start"
                data-testid="box-already-approved"
              >
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                <div>
                  This intern is already approved for the internship — the
                  offer letter has been issued and Terms &amp; Conditions are
                  unlocked.
                </div>
              </div>
            )}

            {!isApproved && (
              <div className="rounded-md bg-blue-500/10 border border-blue-500/30 text-sm p-3 flex gap-2 items-start">
                <ClipboardCheck className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />
                <div>
                  {isRejected ? (
                    <>
                      Approving this intern will <strong>reverse the
                      rejection</strong>, move them to the
                      <strong> internship</strong> phase, auto-generate their
                      <strong> Internship Offer Letter</strong> certificate,
                      and unlock the <strong>Terms &amp; Conditions</strong>
                      submit button on their dashboard.
                    </>
                  ) : (
                    <>
                      Approving this intern will move them to the
                      <strong> internship</strong> phase, auto-generate their
                      <strong> Internship Offer Letter</strong> certificate,
                      and unlock the <strong>Terms &amp; Conditions</strong>
                      submit button on their dashboard.
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {!isApproved && (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white justify-start h-auto py-4"
                  onClick={() => approveMutation.mutate(selected.id)}
                  disabled={approveMutation.isPending}
                  data-testid="button-approve-internship"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="h-5 w-5 mr-3 flex-shrink-0 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 mr-3 flex-shrink-0" />
                  )}
                  <div className="text-left">
                    <div className="font-semibold">
                      {isRejected
                        ? "Approve anyway (override rejection)"
                        : "Approve for internship"}
                    </div>
                    <div className="text-xs opacity-90 font-normal">
                      Generate offer letter &amp; unlock T&amp;C
                    </div>
                  </div>
                </Button>
              )}

              <Button
                variant="outline"
                className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 justify-start h-auto py-4"
                onClick={() => {
                  setRejectNote("");
                  setRejectOpen(true);
                }}
                disabled={rejectMutation.isPending}
                data-testid="button-open-reject-dialog"
              >
                <XCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-semibold">
                    {isRejected
                      ? "Update Rejection – Resubmit Corrections"
                      : "Task Rejected – Please Update and Resubmit"}
                  </div>
                  <div className="text-xs opacity-80 font-normal">
                    Required corrections pending — reason sent to intern by
                    email &amp; shown on their dashboard
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent data-testid="dialog-reject-intern">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-400" />
                Task Rejected – Required Corrections Pending
              </DialogTitle>
              <DialogDescription>
                Describe the corrections required for {selected.name}. The note
                will be stored, emailed to the intern and displayed at the top
                of their dashboard.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="reject-note">Required corrections</Label>
              <Textarea
                id="reject-note"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="e.g. Submitted code does not meet the project requirements; please re-attempt the test after revising the missing pieces."
                rows={6}
                maxLength={2000}
                data-testid="textarea-reject-reason"
              />
              <div className="text-xs text-muted-foreground">
                {rejectNote.length}/2000 characters
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectOpen(false)}
                disabled={rejectMutation.isPending}
                data-testid="button-cancel-reject"
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={submitReject}
                disabled={rejectMutation.isPending}
                data-testid="button-submit-reject"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                {rejectMutation.isPending ? "Submitting..." : "Submit & Notify Intern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // -------- List view --------
  return (
    <div className="space-y-6" data-testid="internship-review-module">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Internship Approval Review
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Interns who completed the direct exam (Week 4) or the training
            week-4 task. Review their submission, then approve or reject.
            Previously rejected interns are also listed and can be re-approved.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone"
              className="pl-9"
              data-testid="input-search-review"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground"
              data-testid="text-no-review-candidates"
            >
              <AlertCircle className="h-8 w-8 mb-2 opacity-60" />
              <p className="text-sm">
                No interns to review yet.
              </p>
              <p className="text-xs mt-1">
                Interns appear here once they finish the direct exam (Week 4
                modules) or the training week-4 task. Approved and rejected
                interns are also listed here.
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Intern</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subcategory</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submission</TableHead>
                    <TableHead>Last submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const isApproved =
                      c.internshipStatus === "internship" ||
                      c.internshipStatus === "completed";
                    const isRejected = c.internshipStatus === "rejected";
                    return (
                      <TableRow
                        key={c.id}
                        data-testid={`row-review-${c.id}`}
                      >
                        <TableCell>
                          <div
                            className="font-medium"
                            data-testid={`text-review-name-${c.id}`}
                          >
                            {c.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {c.email}
                          </div>
                        </TableCell>
                        <TableCell
                          className="text-xs"
                          data-testid={`text-category-${c.id}`}
                        >
                          {c.categoryName || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell
                          className="text-xs"
                          data-testid={`text-subcategory-${c.id}`}
                        >
                          {c.subcategoryName || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-cyan-500/20 text-cyan-300"
                          >
                            {pathLabel(c.qualificationPath)}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`badge-status-${c.id}`}>
                          {statusBadge(c.internshipStatus)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {c.qualificationPath === "course_first" ? (
                            <>
                              Course {c.submission.coursePercentage}% · Week 4{" "}
                              {c.submission.week4Percentage}%
                            </>
                          ) : (
                            <>
                              Test tasks {c.submission.demoProjectsCompleted}/
                              {c.submission.demoProjectsTotal}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatDate(c.submission.lastSubmittedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {isRejected && (
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  approveMutation.mutate(c.id);
                                }}
                                disabled={approveMutation.isPending}
                                data-testid={`button-quick-approve-${c.id}`}
                              >
                                {approveMutation.isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                )}
                                Approve
                              </Button>
                            )}
                            {c.internshipStatus !== "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-500 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    window.confirm(
                                      `Reset ${c.name} to applicant (pending) status?\n\nThis will WIPE all course progress, certificates, selected projects, sub-projects, time logs, weekly updates, notifications, messages, social follows, and DAO application for this intern. The intern's login will still work.\n\nThis cannot be undone.`,
                                    )
                                  ) {
                                    undoMutation.mutate(c.id);
                                  }
                                }}
                                disabled={undoMutation.isPending}
                                data-testid={`button-undo-${c.id}`}
                              >
                                {undoMutation.isPending ? (
                                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                )}
                                Undo
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelected(c)}
                              data-testid={`button-review-${c.id}`}
                            >
                              {isApproved ? "View" : "Review"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
