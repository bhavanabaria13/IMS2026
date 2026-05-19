import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Calendar, TrendingUp, Eye, ExternalLink, FileText, CalendarClock } from "lucide-react";
import type { TimeLog } from "@shared/schema";

/* ================= COMPONENT ================= */

interface TimeTrackerProps {
  categoryFilter?: "all" | "interns" | "training" | "dao";
}

export default function TimeTracker({ categoryFilter = "all" }: TimeTrackerProps) {
  const [selectedLog, setSelectedLog] = useState<TimeLog | null>(null);
  const [search, setSearch] = useState("");

  /* ---------- PAGINATION ---------- */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  /* ================= FETCH ================= */

  const { data: timeLogs = [], isLoading } = useQuery<TimeLog[]>({
    queryKey: ["admin-time-logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/time-logs", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch time logs");
      return res.json();
    },
  });

  const { data: interns = [] } = useQuery<any[]>({
    queryKey: ["interns"],
    queryFn: async () => {
      const res = await fetch("/api/interns", { credentials: "include" });
      return res.json();
    },
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await fetch("/api/tasks", { credentials: "include" });
      return res.json();
    },
  });

  /* ================= HELPERS ================= */

  const getInternName = (internId: string) =>
    interns.find((i) => i.id === internId)?.name || "Unknown";

  const getTaskName = (taskId: string | null) =>
    tasks.find((t) => t.id === taskId)?.title || "-";

  const getTask = (taskId: string | null) =>
    taskId ? tasks.find((t) => t.id === taskId) : undefined;

  const parseSubmittedLinks = (raw: string | null | undefined) => {
    if (!raw) return [] as { safe: string | null; raw: string }[];
    return raw
      .split(/[\s,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((value) => {
        try {
          const parsed = new URL(value);
          if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return { safe: parsed.toString(), raw: value };
          }
        } catch {
          /* fallthrough */
        }
        return { safe: null, raw: value };
      });
  };

  const calculateDuration = (
    start: string | Date,
    end: string | Date | null,
  ) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diff = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const isZeroDuration = (log: TimeLog) => {
    if (log.duration !== null && log.duration !== undefined) {
      return log.duration <= 0;
    }
    if (log.endTime) {
      return (
        new Date(log.endTime).getTime() -
          new Date(log.startTime).getTime() <=
        0
      );
    }
    return false;
  };

  const getLogTaskType = (log: TimeLog) => {
    if (!log.taskId) return "other";
    const task = tasks.find((t: any) => t.id === log.taskId);
    if (!task) return "other";
    if (task.courseModuleId) return "training";
    if (task.internshipProjectTaskId) return "internship";
    if (task.isDaoTask) return "dao";
    return "dao";
  };

  /* ================= FILTER ================= */

  const isDaoIntern = (id: any) => {
    const intern: any = interns.find((i: any) => i.id === id);
    return intern?.daoStatus === "approved";
  };

  const categoryFilteredLogs = categoryFilter === "all"
    ? timeLogs
    : categoryFilter === "training"
    ? timeLogs.filter(l => getLogTaskType(l) === "training" && !isDaoIntern(l.internId))
    : categoryFilter === "interns"
    ? timeLogs.filter(l => getLogTaskType(l) === "internship" && !isDaoIntern(l.internId))
    : timeLogs.filter(l => getLogTaskType(l) === "dao" || isDaoIntern(l.internId));

  const filteredLogs = categoryFilteredLogs
    .filter((log) => !isZeroDuration(log))
    .filter((log) => {
      const q = search.toLowerCase();
      return (
        getInternName(log.internId).toLowerCase().includes(q) ||
        getTaskName(log.taskId).toLowerCase().includes(q) ||
        log.logType.toLowerCase().includes(q) ||
        (log.notes ?? "").toLowerCase().includes(q) ||
        (log.endTime ? "completed" : "active").includes(q)
      );
    });

  /* ================= PAGINATION LOGIC ================= */

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ================= STATS ================= */

  const statsLogs = categoryFilteredLogs;

  const totalHours = statsLogs.reduce((sum, log) => {
    if (log.duration) return sum + log.duration / 60;
    if (!log.endTime) {
      const diff =
        new Date().getTime() - new Date(log.startTime).getTime();
      return sum + diff / (1000 * 60 * 60);
    }
    return sum;
  }, 0);

  const todayLogs = statsLogs.filter(
    (log) =>
      new Date(log.startTime).toDateString() === new Date().toDateString()
  );

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Loading time logs...
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="space-y-6">

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Clock} label="Total Hours" value={`${totalHours.toFixed(1)}h`} />
        <StatCard icon={Calendar} label="Today’s Logs" value={todayLogs.length} />
        <StatCard icon={TrendingUp} label="Total Logs" value={statsLogs.length} />
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Time Logs</CardTitle>
        </CardHeader>
        <CardContent>

          <Input
            placeholder="Search by intern, task, type, status, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Intern</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No matching time logs
                    </TableCell>
                  </TableRow>
                )}

                {paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{getInternName(log.internId)}</TableCell>
                    <TableCell>{getTaskName(log.taskId)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.logType}</Badge>
                    </TableCell>
                    <TableCell>{new Date(log.startTime).toLocaleString()}</TableCell>
                    <TableCell>
                      {log.endTime ? new Date(log.endTime).toLocaleString() : "In Progress"}
                    </TableCell>
                    <TableCell>
                      {log.duration
                        ? `${Math.floor(log.duration / 60)}h ${log.duration % 60}m`
                        : calculateDuration(log.startTime, log.endTime)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.endTime ? "default" : "secondary"}>
                        {log.endTime ? "Completed" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setSelectedLog(log)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION UI */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VIEW DIALOG */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Time Log Details</DialogTitle>
          </DialogHeader>

          {selectedLog && (() => {
            const relatedTask: any = getTask(selectedLog.taskId);
            const links = parseSubmittedLinks(relatedTask?.submittedGithubLink);
            const taskTotalMinutes = timeLogs
              .filter((l) => l.taskId === selectedLog.taskId)
              .reduce((sum, l) => {
                if (l.duration) return sum + l.duration;
                if (l.endTime) {
                  return (
                    sum +
                    Math.floor(
                      (new Date(l.endTime).getTime() -
                        new Date(l.startTime).getTime()) /
                        (1000 * 60),
                    )
                  );
                }
                return sum;
              }, 0);
            const taskTotalDisplay = taskTotalMinutes > 0
              ? `${Math.floor(taskTotalMinutes / 60)}h ${taskTotalMinutes % 60}m`
              : "0m";

            return (
              <div className="space-y-5">
                {/* This time log session */}
                <div className="rounded-lg border p-4 space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    This time log session
                  </h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Intern:</span>{" "}
                      <span className="font-medium" data-testid="text-view-log-intern">
                        {getInternName(selectedLog.internId)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Task:</span>{" "}
                      <span className="font-medium" data-testid="text-view-log-task">
                        {getTaskName(selectedLog.taskId)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>{" "}
                      <Badge variant="outline">{selectedLog.logType}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <Badge variant={selectedLog.endTime ? "default" : "secondary"}>
                        {selectedLog.endTime ? "Completed" : "Active"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Start:</span>{" "}
                      <span className="font-medium">
                        {new Date(selectedLog.startTime).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">End:</span>{" "}
                      <span className="font-medium">
                        {selectedLog.endTime
                          ? new Date(selectedLog.endTime).toLocaleString()
                          : "In Progress"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Duration:</span>{" "}
                      <span className="font-medium" data-testid="text-view-log-duration">
                        {selectedLog.duration
                          ? `${Math.floor(selectedLog.duration / 60)}h ${selectedLog.duration % 60}m`
                          : calculateDuration(selectedLog.startTime, selectedLog.endTime)}
                      </span>
                    </div>
                  </div>
                  {selectedLog.notes && (
                    <div className="pt-2">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        Session note / commit
                      </div>
                      <p
                        className="whitespace-pre-wrap text-sm rounded-md bg-muted/40 p-3"
                        data-testid="text-view-log-notes"
                      >
                        {selectedLog.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Task submission info */}
                {relatedTask ? (
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Task submission
                      </h3>
                      {relatedTask.submittedAt ? (
                        <Badge className="bg-green-500/10 text-green-500">
                          Submitted
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not yet submitted</Badge>
                      )}
                    </div>

                    <div className="text-sm space-y-3">
                      <div className="flex items-start gap-2">
                        <CalendarClock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <div className="text-muted-foreground text-xs uppercase tracking-wide">
                            Submitted at
                          </div>
                          <div
                            className="font-medium"
                            data-testid="text-view-log-task-submitted-at"
                          >
                            {relatedTask.submittedAt
                              ? new Date(relatedTask.submittedAt).toLocaleString()
                              : "—"}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                          Document / Submission links
                        </div>
                        {links.length > 0 ? (
                          <ul className="space-y-1" data-testid="list-view-log-task-links">
                            {links.map((link, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                {link.safe ? (
                                  <a
                                    href={link.safe}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline break-all text-sm"
                                    data-testid={`link-view-log-task-submission-${idx}`}
                                  >
                                    {link.raw}
                                  </a>
                                ) : (
                                  <span
                                    className="text-muted-foreground break-all text-sm italic"
                                    title="Link not opened: only http/https URLs are allowed"
                                    data-testid={`text-view-log-task-submission-unsafe-${idx}`}
                                  >
                                    {link.raw}{" "}
                                    <span className="text-xs">(unsupported link)</span>
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-muted-foreground text-sm">
                            No links submitted
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                          Task notes from intern
                        </div>
                        {relatedTask.submittedNotes ? (
                          <p
                            className="whitespace-pre-wrap text-sm rounded-md bg-muted/40 p-3"
                            data-testid="text-view-log-task-notes"
                          >
                            {relatedTask.submittedNotes}
                          </p>
                        ) : (
                          <div className="text-muted-foreground text-sm">
                            No notes provided
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                        <span className="text-sm flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          Total task perform time
                        </span>
                        <Badge
                          variant="outline"
                          className="text-base"
                          data-testid="badge-view-log-task-total-time"
                        >
                          {taskTotalDisplay}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    This time log isn't linked to a specific task.
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================= STAT CARD ================= */

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <Card>
      <CardContent className="pt-6 flex gap-4 items-center">
        <Icon className="h-6 w-6 text-primary" />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
