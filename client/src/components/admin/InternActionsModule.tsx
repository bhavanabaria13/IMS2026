import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Mail,
  ArrowLeft,
  Clock,
  History,
} from "lucide-react";
import type { Intern, InternAction } from "@shared/schema";

type ActionType = "warning" | "rejection";

export default function InternActionsModule() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedIntern, setSelectedIntern] = useState<Intern | null>(null);
  const [dialogAction, setDialogAction] = useState<ActionType | null>(null);
  const [note, setNote] = useState("");

  const { data: allInterns = [], isLoading } = useQuery<Intern[]>({
    queryKey: ["/api/interns"],
    queryFn: async () => {
      const res = await fetch("/api/interns", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch interns");
      return res.json();
    },
  });

  const eligibleInterns = useMemo(() => {
    return allInterns.filter((i) =>
      ["training", "training_complete", "internship", "completed"].includes(
        i.internshipStatus,
      ),
    );
  }, [allInterns]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return eligibleInterns;
    return eligibleInterns.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.email.toLowerCase().includes(q) ||
        (i.phone || "").toLowerCase().includes(q),
    );
  }, [eligibleInterns, search]);

  const { data: actions = [], isLoading: actionsLoading } = useQuery<
    InternAction[]
  >({
    queryKey: ["/api/admin/interns", selectedIntern?.id, "actions"],
    queryFn: async () => {
      if (!selectedIntern) return [];
      const res = await fetch(
        `/api/admin/interns/${selectedIntern.id}/actions`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch action history");
      return res.json();
    },
    enabled: !!selectedIntern,
  });

  const actionMutation = useMutation({
    mutationFn: async (payload: { actionType: ActionType; note: string }) => {
      if (!selectedIntern) throw new Error("No intern selected");
      const res = await fetch(
        `/api/admin/interns/${selectedIntern.id}/action`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}) as any);
      if (!res.ok) {
        throw new Error(data?.message || `Request failed (${res.status})`);
      }
      return data;
    },
    onSuccess: (data) => {
      const wasRejection = dialogAction === "rejection";
      toast({
        title: wasRejection ? "Intern rejected" : "Task Message",
        description:
          data.message ||
          (data.emailSent
            ? "Email notification sent successfully."
            : data.emailError
              ? `Recorded, but email failed: ${data.emailError}`
              : "Action recorded."),
        variant: data.emailSent ? "default" : "destructive",
      });
      // Reflect the new rejected state in the local detail view immediately.
      if (wasRejection && selectedIntern) {
        setSelectedIntern({
          ...selectedIntern,
          internshipStatus: "rejected",
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/interns", selectedIntern?.id, "actions"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/interns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setDialogAction(null);
      setNote("");
    },
    onError: (err: any) => {
      toast({
        title: "Action failed",
        description: err?.message || "Could not complete this action.",
        variant: "destructive",
      });
    },
  });

  const openDialog = (type: ActionType) => {
    setDialogAction(type);
    setNote("");
  };

  const handleSubmit = () => {
    const trimmed = note.trim();
    if (trimmed.length === 0) {
      toast({
        title: "Note required",
        description: "Please describe the reason before submitting.",
        variant: "destructive",
      });
      return;
    }
    actionMutation.mutate({ actionType: dialogAction!, note: trimmed });
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      pending: { label: "Pending", cls: "bg-slate-500/20 text-slate-300" },
      training: { label: "Training", cls: "bg-blue-500/20 text-blue-300" },
      training_complete: {
        label: "Training Done",
        cls: "bg-cyan-500/20 text-cyan-300",
      },
      internship: {
        label: "Internship",
        cls: "bg-emerald-500/20 text-emerald-300",
      },
      completed: { label: "Completed", cls: "bg-green-500/20 text-green-300" },
      rejected: { label: "Rejected", cls: "bg-red-500/20 text-red-300" },
    };
    const s = map[status] || { label: status, cls: "bg-slate-500/20" };
    return (
      <Badge
        variant="outline"
        className={s.cls}
        data-testid={`badge-status-${status}`}
      >
        {s.label}
      </Badge>
    );
  };

  const formatDate = (d: string | Date) => {
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

  // ---------- Detail view ----------
  if (selectedIntern) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button
            variant="ghost"
            onClick={() => setSelectedIntern(null)}
            data-testid="button-back-to-list"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to interns
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <CardTitle
                  className="text-xl"
                  data-testid="text-selected-intern-name"
                >
                  {selectedIntern.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span data-testid="text-selected-intern-email">
                    {selectedIntern.email}
                  </span>
                </p>
              </div>
              {statusBadge(selectedIntern.internshipStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 justify-start h-auto py-4"
                onClick={() => openDialog("warning")}
                disabled={selectedIntern.internshipStatus === "rejected"}
                data-testid="button-issue-warning"
              >
                <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-semibold">Activity Feed</div>
                  <div className="text-xs opacity-80 font-normal">
                    Send a formal email with a note
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 justify-start h-auto py-4"
                onClick={() => openDialog("rejection")}
                disabled={selectedIntern.internshipStatus === "rejected"}
                data-testid="button-reject-intern"
              >
                <XCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-semibold">Reject Intern</div>
                  <div className="text-xs opacity-80 font-normal">
                    Discontinue from internship and email the intern
                  </div>
                </div>
              </Button>
            </div>

            {selectedIntern.internshipStatus === "rejected" && (
              <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-sm text-red-300 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                This intern has already been rejected from the program.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" /> Action History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {actionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : actions.length === 0 ? (
              <p
                className="text-sm text-muted-foreground py-4 text-center"
                data-testid="text-no-actions"
              >
                No Task Message or rejections recorded for this intern.
              </p>
            ) : (
              <div className="space-y-3">
                {actions.map((a) => (
                  <div
                    key={a.id}
                    className={`p-4 rounded-lg border ${
                      a.actionType === "rejection"
                        ? "bg-red-500/5 border-red-500/30"
                        : "bg-amber-500/5 border-amber-500/30"
                    }`}
                    data-testid={`row-action-${a.id}`}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {a.actionType === "rejection" ? (
                          <XCircle className="h-4 w-4 text-red-400" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                        )}
                        <span
                          className={`font-semibold text-sm ${
                            a.actionType === "rejection"
                              ? "text-red-300"
                              : "text-amber-300"
                          }`}
                          data-testid={`text-action-type-${a.id}`}
                        >
                          {a.actionType === "rejection"
                            ? "Rejection"
                            : "Warning"}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            a.emailSent
                              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-xs"
                              : "bg-slate-500/10 text-slate-300 border-slate-500/30 text-xs"
                          }
                          data-testid={`badge-email-status-${a.id}`}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          {a.emailSent ? "Email sent" : "Email not sent"}
                        </Badge>
                      </div>
                      <span
                        className="text-xs text-muted-foreground flex items-center gap-1"
                        data-testid={`text-action-date-${a.id}`}
                      >
                        <Clock className="h-3 w-3" />
                        {formatDate(a.createdAt)}
                      </span>
                    </div>
                    <p
                      className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap"
                      data-testid={`text-action-note-${a.id}`}
                    >
                      {a.note}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Issued by{" "}
                      <span
                        className="font-medium text-foreground/80"
                        data-testid={`text-action-issuer-${a.id}`}
                      >
                        {a.adminUsername}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={dialogAction !== null}
          onOpenChange={(open) => {
            if (!open && !actionMutation.isPending) {
              setDialogAction(null);
              setNote("");
            }
          }}
        >
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {dialogAction === "rejection" ? (
                  <>
                    <XCircle className="h-5 w-5 text-red-400" /> Reject Intern
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-400" /> 
                    Activity Feed
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {dialogAction === "rejection" ? (
                  <>
                    This will mark <strong>{selectedIntern.name}</strong> as{" "}
                    <span className="text-red-400 font-semibold">rejected</span>{" "}
                    and email them the note below. This action cannot be undone
                    from this page.
                  </>
                ) : (
                  <>
                    Send a formal Message email to{" "}
                    <strong>{selectedIntern.name}</strong> with the note below.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <Label htmlFor="action-note">
                Note <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="action-note"
                placeholder={
                  dialogAction === "rejection"
                    ? "Explain the reason for rejection..."
                    : "Describe the what the intern must correct..."
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={6}
                maxLength={2000}
                disabled={actionMutation.isPending}
                data-testid="input-action-note"
              />
              <p className="text-xs text-muted-foreground">
                {note.length}/2000 characters. This note will be included in the
                email.
              </p>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setDialogAction(null);
                  setNote("");
                }}
                disabled={actionMutation.isPending}
                data-testid="button-cancel-action"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={actionMutation.isPending || note.trim().length === 0}
                className={
                  dialogAction === "rejection"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                }
                data-testid="button-confirm-action"
              >
                {actionMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {dialogAction === "rejection"
                  ? "Reject & Send Email"
                  : " Task Message & Send Email"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ---------- List view ----------
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            Reject / Task Message Interns
          </CardTitle>
          <p className="text-sm text-muted-foreground">
             formal Task Message or reject interns from the program. The
            intern is notified by email immediately.
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-interns"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p
              className="text-center text-sm text-muted-foreground py-12"
              data-testid="text-no-interns"
            >
              No interns found.
            </p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Email
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((intern) => (
                    <TableRow
                      key={intern.id}
                      data-testid={`row-intern-${intern.id}`}
                    >
                      <TableCell className="font-medium">
                        {intern.name}
                        <div className="sm:hidden text-xs text-muted-foreground mt-0.5">
                          {intern.email}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {intern.email}
                      </TableCell>
                      <TableCell>
                        {statusBadge(intern.internshipStatus)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedIntern(intern)}
                          data-testid={`button-manage-${intern.id}`}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
