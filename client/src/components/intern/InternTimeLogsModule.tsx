import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock, Calendar, TrendingUp, Search, Eye } from "lucide-react";
import type { TimeLog } from "@shared/schema";

/* ------------------ PAGINATION CONFIG ------------------ */
const ITEMS_PER_PAGE = 5;

export default function InternTimeTracker() {
  /* ----------------------- STATE ----------------------- */
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<TimeLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  /* ----------------------- QUERIES ---------------------- */
  const { data: timeLogs = [], isLoading } = useQuery<TimeLog[]>({
    queryKey: ["intern-time-logs"],
    queryFn: async () => {
      const res = await fetch("/api/intern/time-logs", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch time logs");
      return res.json();
    },
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["intern-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/intern/tasks", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  /* ----------------------- HELPERS ---------------------- */
  const getTaskName = (taskId: string | null) => {
    if (!taskId) return "-";
    const task = tasks.find((t) => t.id === taskId);
    return task?.title || "Unknown Task";
  };

  const calculateDuration = (start: string, end: string | null) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const diff = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  /* ------------------- DERIVED DATA --------------------- */
  const filteredLogs = timeLogs.filter((log) => {
    const taskName = getTaskName(log.taskId).toLowerCase();
    const type = log.logType?.toLowerCase() || "";
    const status = log.endTime ? "completed" : "active";
    const query = search.toLowerCase();

    return (
      taskName.includes(query) ||
      type.includes(query) ||
      status.includes(query)
    );
  });

  /* ------------------- PAGINATION ---------------------- */
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  /* ------------------- STATS ---------------------------- */
  const totalHours = timeLogs.reduce((sum, log) => {
    if (log.duration) return sum + log.duration / 60;
    if (!log.endTime) {
      const diff =
        new Date().getTime() - new Date(log.startTime).getTime();
      return sum + diff / (1000 * 60 * 60);
    }
    return sum;
  }, 0);

  const todayLogs = timeLogs.filter(
    (log) =>
      new Date(log.startTime).toDateString() ===
      new Date().toDateString()
  );

  /* ----------------------- LOADING ---------------------- */
  if (isLoading) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Loading time logs...
      </div>
    );
  }

  /* ------------------------ UI -------------------------- */
  return (
    <div className="space-y-6">
      {/* ------------------- STATS ------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-6 flex gap-4 items-center">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
              <p className="text-sm text-muted-foreground">Total Hours</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex gap-4 items-center">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayLogs.length}</p>
              <p className="text-sm text-muted-foreground">Today’s Logs</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex gap-4 items-center">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{timeLogs.length}</p>
              <p className="text-sm text-muted-foreground">Total Logs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------------ TABLE ------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>My Time Logs</CardTitle>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search task, type, or status..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No time logs found
                    </TableCell>
                  </TableRow>
                )}

                {paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {getTaskName(log.taskId)}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">{log.logType}</Badge>
                    </TableCell>

                    <TableCell>
                      {new Date(log.startTime).toLocaleString()}
                    </TableCell>

                    <TableCell>
                      {log.endTime
                        ? new Date(log.endTime).toLocaleString()
                        : "Running"}
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredLogs.length > ITEMS_PER_PAGE && (
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

          {/* View Modal */}
          <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Task Details</DialogTitle>
              </DialogHeader>

              {selectedLog && (
                <div className="space-y-3 text-sm">
                  <p><b>Task:</b> {getTaskName(selectedLog.taskId)}</p>
                  <p><b>Type:</b> {selectedLog.logType}</p>
                  <p><b>Start:</b> {new Date(selectedLog.startTime).toLocaleString()}</p>
                  <p><b>End:</b> {selectedLog.endTime ? new Date(selectedLog.endTime).toLocaleString() : "Running"}</p>
                  <p><b>Duration:</b> {selectedLog.duration
                    ? `${Math.floor(selectedLog.duration / 60)}h ${selectedLog.duration % 60}m`
                    : calculateDuration(selectedLog.startTime, selectedLog.endTime)}</p>
                  <p className="text-muted-foreground">
                    {selectedLog.notes || "No notes added"}
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
