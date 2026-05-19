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
import { Badge } from "@/components/ui/badge";
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
import { Plus, Edit, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Intern, WeeklyUpdate } from "@shared/schema";

/* ================= NORMALIZER ================= */
type WeeklyUpdate = {
  id: string;
  intern_id: string;
  full_name: string;
  email: string;
  program_course_name: string;
  week_number: number;
  year: number;
  reporting_period: string;
  learning_topics: string;
  tasks_completed: string;
  deployed_url: string;
  github_repo_link: string;
  task_completion_status: string;
  self_rating: number;
  time_spent: number;
  challenges_faced: string;
  solutions_attempted: string;
  key_learnings: string;
  performance_score: number;
  mentor_feedback: string;
};

const normalizeUpdate = (u: any): WeeklyUpdate => ({
  id: u.id,

  intern_id: u.intern_id ?? u.internId,

  full_name: u.full_name ?? u.fullName ?? "",
  email: u.email ?? "",
  program_course_name: u.program_course_name ?? u.programCourseName ?? "",

  week_number: u.week_number ?? u.weekNumber,
  year: u.year,

  reporting_period: u.reporting_period ?? u.reportingPeriod ?? "",

  learning_topics: u.learning_topics ?? u.learningTopics ?? "",
  tasks_completed: u.tasks_completed ?? u.tasksCompleted ?? "",
  work_output: u.work_output ?? u.workOutput ?? "",

  challenges_faced: u.challenges_faced ?? u.challengesFaced ?? "",
  solutions_attempted: u.solutions_attempted ?? u.solutionsAttempted ?? "",
  key_learnings: u.key_learnings ?? u.keyLearnings ?? "",

  github_repo_link: u.github_repo_link ?? u.githubRepoLink ?? "",
  deployed_url: u.deployed_url ?? u.deployedUrl ?? "",

  task_completion_status:
    u.task_completion_status ??
    u.taskCompletionStatus ??
    "Pending",

  self_rating: u.self_rating ?? u.selfRating ?? 0,
  time_spent: Number(u.time_spent ?? u.timeSpent ?? 0),
  performance_score: u.performance_score ?? u.performanceScore ?? 0,

  mentor_feedback: u.mentor_feedback ?? u.mentorFeedback ?? "",
});


/* ================= COMPONENT ================= */

export default function WeeklyUpdates() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<WeeklyUpdate | null>(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewUpdate, setViewUpdate] = useState<WeeklyUpdate | null>(null);

 const [formData, setFormData] = useState({
  internId: "",
  weekNumber: new Date().getWeek(),
  year: new Date().getFullYear(),

  learningTopics: "",
  challengesFaced: "",
  solutionsAttempted: "",
  keyLearnings: "",

  githubRepoLink: "",
  deployedUrl: "",

  hoursWorked: 0,
  performanceRating: 3,
  selfRating: 3,

  tasksCompleted: "",
  feedback: "",
});


  /* ================= FETCH ================= */

  const { data: interns = [] } = useQuery<Intern[]>({
    queryKey: ["/api/interns"],
    queryFn: async () => {
      const res = await fetch("/api/interns", { credentials: "include" });
      return res.json();
    },
  });

  const { data: updates = [] } = useQuery<WeeklyUpdate[]>({
    queryKey: ["/api/weekly-updates"],
    queryFn: async () => {
      const res = await fetch("/api/weekly-updates", { credentials: "include" });
      const data = await res.json();
      return data.map(normalizeUpdate);
    },
  });

  /* ================= HELPERS ================= */

  const getInternName = (id?: string) =>
    interns.find((i) => i.id === id || i.user_id === id)?.name || "Unknown";

  const filteredUpdates = updates.filter((u) => {
    const q = search.toLowerCase();
    return (
      getInternName(u.intern_id).toLowerCase().includes(q) ||
      String(u.week_number).includes(q) ||
      (u.tasks_completed ?? "").toLowerCase().includes(q) ||
      (u.mentor_feedback ?? "").toLowerCase().includes(q)
    );
  });

  /* ================= MUTATIONS ================= */

  const createMutation = useMutation({
    mutationFn: async (payload: any) =>
      fetch("/api/weekly-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-updates"] });
      toast({ title: "Weekly update created" });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: any) =>
      fetch(`/api/weekly-updates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-updates"] });
      toast({ title: "Weekly update updated" });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      fetch(`/api/weekly-updates/${id}`, {
        method: "DELETE",
        credentials: "include",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-updates"] });
      toast({ title: "Weekly update deleted" });
    },
  });

  /* ================= HANDLERS ================= */

  const resetForm = () => {
    setDialogOpen(false);
    setEditingUpdate(null);
  };

  const handleEdit = (u: WeeklyUpdate) => {
  setEditingUpdate(u);
  setFormData({
    internId: u.intern_id,
    weekNumber: u.week_number,
    year: u.year,

    learningTopics: u.learning_topics ?? "",
    tasksCompleted: u.tasks_completed ?? "",
    challengesFaced: u.challenges_faced ?? "",
    solutionsAttempted: u.solutions_attempted ?? "",
    keyLearnings: u.key_learnings ?? "",

    githubRepoLink: u.github_repo_link ?? "",
    deployedUrl: u.deployed_url ?? "",

    hoursWorked: Number(u.time_spent ?? 0),
    performanceRating: u.performance_score ?? 3,
    selfRating: u.self_rating ?? 3,

    feedback: u.mentor_feedback ?? "",
  });
  setDialogOpen(true);
};


  const handleView = (u: WeeklyUpdate) => {
    setViewUpdate(u);
    setViewOpen(true);
  };

const Info = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-muted-foreground">{label}</p>
    <p className="font-medium break-words">{value}</p>
  </div>
);

const Section = ({ title, children }: any) => (
  <div className="rounded-lg border p-4 space-y-3">
    <h3 className="font-semibold text-base">{title}</h3>
    {children}
  </div>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-muted-foreground">{label}</p>
    <p className="text-lg font-semibold">{value}</p>
  </div>
);

const LinkItem = ({ label, href }: { label: string; href?: string }) =>
  href ? (
    <a
      href={href}
      target="_blank"
      className="block text-blue-600 underline"
    >
      {label}
    </a>
  ) : (
    <p className="text-muted-foreground">{label}: —</p>
  );

  const handleSubmit = () => {
  const payload = {
  intern_id: formData.internId,
  week_number: formData.weekNumber,
  year: formData.year,

  learning_topics: formData.learningTopics,
  tasks_completed: formData.tasksCompleted,

  challenges_faced: formData.challengesFaced,
  solutions_attempted: formData.solutionsAttempted,
  key_learnings: formData.keyLearnings,

  github_repo_link: formData.githubRepoLink,
  deployed_url: formData.deployedUrl,

  time_spent: String(formData.hoursWorked),
  performance_score: formData.performanceRating,
  self_rating: formData.selfRating,

  mentor_feedback: formData.feedback,
  task_completion_status: formData.tasksCompleted ? "Completed" : "Pending",
};



    editingUpdate
      ? updateMutation.mutate({ id: editingUpdate.id, payload })
      : createMutation.mutate(payload);
  };

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <CardTitle>Weekly Updates</CardTitle>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Update
          </Button>
        </CardHeader>

        <CardContent>
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intern</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredUpdates.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{getInternName(u.intern_id)}</TableCell>
                  <TableCell>{u.week_number}</TableCell>
                  <TableCell>{u.tasks_completed}</TableCell>
                  <TableCell>
                    <Badge>{u.task_completion_status}</Badge>
                  </TableCell>
                  <TableCell>{u.time_spent}h</TableCell>
                  <TableCell>{u.performance_score}/5</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => handleView(u)}>
                      👁️
                    </Button>
                 
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => deleteMutation.mutate(u.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* VIEW DIALOG */}
 <Dialog open={!!viewUpdate} onOpenChange={() => setViewUpdate(null)}>
  <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
    <DialogHeader className="shrink-0">
      <DialogTitle className="text-xl font-semibold">
        Weekly Update Details
      </DialogTitle>
    </DialogHeader>

    {viewUpdate && (
      <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-sm">

        {/* Intern Info */}
        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
          <Info label="Intern" value={viewUpdate.full_name} />
          <Info label="Email" value={viewUpdate.email} />
          <Info label="Program" value={viewUpdate.program_course_name} />
          <Info label="Week / Year" value={`Week ${viewUpdate.week_number}, ${viewUpdate.year}`} />
          <Info label="Reporting Period" value={viewUpdate.reporting_period} />
          <Info
            label="Status"
            value={
              <Badge
                variant={
                  viewUpdate.task_completion_status === "Completed"
                    ? "default"
                    : "secondary"
                }
              >
                {viewUpdate.task_completion_status}
              </Badge>
            }
          />
        </div>

        {/* Work Details */}
        <Section title="Work Summary">
          <Info label="Learning Topics" value={viewUpdate.learning_topics} />
          <Info label="Tasks Completed" value={viewUpdate.tasks_completed} />
          <Info label="Challenges" value={viewUpdate.challenges_faced || "—"} />
          <Info label="Solutions" value={viewUpdate.solutions_attempted || "—"} />
          <Info label="Key Learnings" value={viewUpdate.key_learnings || "—"} />
        </Section>

        {/* Evaluation */}
        <div className="grid grid-cols-3 gap-4 rounded-lg border p-4 text-center">
          <Metric label="Hours Worked" value={`${viewUpdate.time_spent} h`} />
          <Metric label="Performance Score" value={`${viewUpdate.performance_score}/5`} />
          <Metric label="Self Rating" value={`${viewUpdate.self_rating}/5`} />
        </div>

        {/* Links */}
        <Section title="Project Links">
          <LinkItem label="GitHub Repository" href={viewUpdate.github_repo_link} />
          <LinkItem label="Deployed URL" href={viewUpdate.deployed_url} />
        </Section>

        {/* Mentor Feedback */}
        <Section title="Mentor Feedback">
          <p className="text-muted-foreground">
            {viewUpdate.mentor_feedback || "No feedback provided yet."}
          </p>
        </Section>
      </div>
    )}
  </DialogContent>
</Dialog>

      {/* ADD / EDIT */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUpdate ? "Edit Weekly Update" : "Add Weekly Update"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Select
              value={formData.internId}
              onValueChange={(v) => setFormData({ ...formData, internId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select intern" />
              </SelectTrigger>
              <SelectContent>
                {interns.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Tasks completed"
              value={formData.tasksCompleted}
              onChange={(e) =>
                setFormData({ ...formData, tasksCompleted: e.target.value })
              }
            />

            <Textarea
              placeholder="Mentor feedback"
              value={formData.feedback}
              onChange={(e) =>
                setFormData({ ...formData, feedback: e.target.value })
              }
            />
          </div>

          <DialogFooter>
            <Button onClick={handleSubmit}>
              {editingUpdate ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================= WEEK HELPER ================= */

declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function () {
  const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};
