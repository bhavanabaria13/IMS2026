import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  CheckCircle,
  XCircle,
  PlayCircle,
  FolderKanban,
  BookOpen,
  GraduationCap,
  Award,
  Video,
  Rocket,
  FileText,
  Users,
  ArrowRight,
  Trophy,
  ClipboardList,
  Layers,
  Zap,
} from "lucide-react";
import CategoryInfoCard from "./CategoryInfoCard";
import { formatDistanceToNow } from "date-fns";
import type {
  Task,
  Project,
  TimeLog,
  Video as VideoRecord,
} from "@shared/schema";

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {}
  return url;
}

interface InternDashboardOverviewProps {
  tasks: Task[];
  projects: Project[];
}

export default function InternDashboardOverview({
  tasks,
  projects,
}: InternDashboardOverviewProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const switchPathMutation = useMutation({
    mutationFn: async (qualificationPath: "course_first" | "entrance_test") => {
      const res = await apiRequest("/api/intern/qualification-path", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qualificationPath }),
      });
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/intern/status"] });
      await queryClient.invalidateQueries({
        queryKey: ["/api/intern/progress-summary"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["/api/intern/course-modules"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["/api/intern/course-progress"],
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/intern/tasks"] });
    },
    onError: (err: any) => {
      toast({
        title: "Could not switch path",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const goWithPath = async (
    target: "course_first" | "entrance_test",
    path: string,
  ) => {
    if (qualPath !== target) {
      try {
        await switchPathMutation.mutateAsync(target);
      } catch {
        return;
      }
    }
    setLocation(path);
  };

  const { data: timeLogs = [] } = useQuery<TimeLog[]>({
    queryKey: ["/api/intern/time-logs"],
    queryFn: async () => {
      const res = await fetch("/api/intern/time-logs", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch time logs");
      return res.json();
    },
  });

  const { data: internStatus } = useQuery<any>({
    queryKey: ["/api/intern/status"],
    queryFn: async () => {
      const res = await fetch("/api/intern/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
  });

  const { data: progressSummary } = useQuery<any>({
    queryKey: ["/api/intern/progress-summary"],
    queryFn: async () => {
      const res = await fetch("/api/intern/progress-summary", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
  });

  const runningTasks = tasks.filter((t) => t.status === "running");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const cancelledTasks = tasks.filter((t) => t.status === "cancelled");
  const pendingTasks = tasks.filter((t) => t.status === "pending");

  const totalTimeMinutes = timeLogs.reduce((acc, log) => {
    if (log.duration) return acc + log.duration;
    if (!log.endTime) {
      return (
        acc +
        Math.floor(
          (new Date().getTime() - new Date(log.startTime).getTime()) / 60000,
        )
      );
    }
    return acc;
  }, 0);
  const totalHours = Math.floor(totalTimeMinutes / 60);
  const totalMins = totalTimeMinutes % 60;

  const todayLogs = timeLogs.filter((log) => {
    const logDate = new Date(log.startTime);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  });
  const todayMinutes = todayLogs.reduce((acc, log) => {
    if (log.duration) return acc + log.duration;
    if (!log.endTime)
      return (
        acc +
        Math.floor(
          (new Date().getTime() - new Date(log.startTime).getTime()) / 60000,
        )
      );
    return acc;
  }, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekLogs = timeLogs.filter(
    (log) => new Date(log.startTime) >= weekStart,
  );
  const weekMinutes = weekLogs.reduce((acc, log) => {
    if (log.duration) return acc + log.duration;
    if (!log.endTime)
      return (
        acc +
        Math.floor(
          (new Date().getTime() - new Date(log.startTime).getTime()) / 60000,
        )
      );
    return acc;
  }, 0);

  const qualPath = internStatus?.qualificationPath;
  const status = internStatus?.internshipStatus;
  const progressPercent = progressSummary?.percentage ?? 0;

  const videoType =
    status === "internship" || status === "completed"
      ? "internship"
      : "training";
  const { data: categoryVideos = [] } = useQuery<VideoRecord[]>({
    queryKey: ["/api/intern/videos", videoType],
    queryFn: async () => {
      const res = await fetch(`/api/intern/videos?type=${videoType}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch videos");
      return res.json();
    },
    enabled: !!internStatus,
  });

  const statusLabels: Record<string, string> = {
    pending: "Getting Started",
    training: "In Training",
    testing: "Testing Phase",
    training_complete: "Training Complete",
    internship: "Active Internship",
    completed: "Internship Completed",
  };

  const pathLabels: Record<string, string> = {
    course_first: "Training Course Path",
    entrance_test: "Entrance Test Path",
    DAO: "DAO Member",
  };

  const daoApproved = internStatus?.daoStatus === "approved";

  const getFlowSteps = () => {
    const base =
      qualPath === "course_first"
        ? [
            {
              key: "training",
              label: "Training / Direct Exam",
              icon: BookOpen,
            },
            { key: "training_complete", label: "Certificate", icon: Award },
            { key: "terms", label: "Terms & Conditions", icon: FileText },
            { key: "internship", label: "Internship", icon: Rocket },
            { key: "completed", label: "Completed", icon: Trophy },
          ]
        : [
            { key: "testing", label: "Test / Project", icon: FileText },
            { key: "terms", label: "Terms & Conditions", icon: FileText },
            { key: "internship", label: "Internship", icon: Rocket },
            { key: "completed", label: "Completed", icon: Trophy },
          ];
    if (daoApproved) {
      base.push({ key: "dao_joined", label: "DAO Joined", icon: Users });
    }
    return base;
  };

  const flowSteps = getFlowSteps();
  const stepOrder = flowSteps.map((s) => s.key);
  const currentStepIdx = daoApproved
    ? stepOrder.indexOf("dao_joined")
    : stepOrder.indexOf(status || "training");

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return "No Project";
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "Unknown Project";
  };

  const getTaskTimeSpent = (taskId: string) => {
    const taskTimeLogs = timeLogs.filter((log) => log.taskId === taskId);
    let totalMin = 0;
    taskTimeLogs.forEach((log) => {
      if (log.duration) totalMin += log.duration;
      else if (!log.endTime)
        totalMin += Math.floor(
          (new Date().getTime() - new Date(log.startTime).getTime()) / 60000,
        );
    });
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    return totalMin > 0 ? `${hours}h ${mins}m` : "0m";
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      medium:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    return <Badge className={colors[priority] || ""}>{priority}</Badge>;
  };

  return (
    <div className="space-y-6">
      {internStatus && (
        <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3
                    className="text-lg font-semibold"
                    data-testid="text-internship-status"
                  >
                    {statusLabels[status] || status}
                  </h3>
                  <p
                    className="text-sm text-muted-foreground"
                    data-testid="text-qualification-path"
                  >
                    {pathLabels[qualPath] || qualPath}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {flowSteps.map((step, idx) => {
                const StepIcon = step.icon;
                const isDone =
                  status === "completed" ? true : idx < currentStepIdx;
                const isActive =
                  !isDone &&
                  (idx === currentStepIdx ||
                    (currentStepIdx === -1 && idx === 0));
                return (
                  <div
                    key={step.key}
                    className="flex items-center gap-2 flex-shrink-0"
                  >
                    <div
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                          : isDone
                            ? "bg-green-500/10 text-green-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                      <span className="whitespace-nowrap">{step.label}</span>
                    </div>
                    {idx < flowSteps.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {progressSummary && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">
                    {progressSummary.completed} / {progressSummary.total}{" "}
                    modules completed
                  </span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}

            {status === "internship" && (
              <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <Rocket className="h-6 w-6 text-blue-400" />
                  <div className="flex-1">
                    <p className="font-semibold text-blue-300">
                      Active Internship
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Work on projects, create tasks, track your progress. After
                      1 month, generate your internship certificate.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation("/intern/tasks")}
                      data-testid="button-go-tasks-internship"
                    >
                      <ClipboardList className="h-4 w-4 mr-1" /> Tasks
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation("/intern/certificates")}
                      data-testid="button-go-certs-internship"
                    >
                      <Award className="h-4 w-4 mr-1" /> Certificates
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {status === "completed" && !internStatus?.daoMembershipApplied && (
              <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-yellow-400" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-400">
                      Internship Completed!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You are now eligible to apply for DAO membership.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setLocation("/intern/dao-membership")}
                    data-testid="button-apply-dao"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Apply for DAO
                  </Button>
                </div>
              </div>
            )}

            {internStatus?.daoMembershipApplied && daoApproved && (
              <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <p className="text-sm text-green-400 font-medium">
                    DAO Member — Welcome to the EtherAuthority DAO community!
                  </p>
                </div>
              </div>
            )}

            {internStatus?.daoMembershipApplied && !daoApproved && (
              <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-400" />
                  <p className="text-sm text-blue-400 font-medium">
                    DAO Membership Application Submitted
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {internStatus?.categoryName && (
        <CategoryInfoCard
          categoryName={internStatus.categoryName}
          subcategoryName={internStatus.subcategoryName}
          categoryId={internStatus.categoryId}
        />
      )}

      {qualPath === "course_first" &&
        (status === "pending" || status === "training") && (
          <Card className="border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Video className="h-5 w-5 text-blue-400" />
                <h3 className="font-semibold">Training Videos</h3>
                <Badge variant="secondary" className="ml-auto">
                  <a
                    href="https://docs.google.com/document/d/1jobiopM_7XFRgRx304_WYjsP6o03OnDWmhvxH4CTaTY/edit?usp=sharing"
                    target="_blank"
                  >
                    {" "}
                    Training Topics and Learning Materials
                  </a>
                </Badge>
              </div>
              {categoryVideos.length > 0 ? (
                <div className="space-y-4 mb-4">
                  {categoryVideos.map((vid) => {
                    const embedSrc = getEmbedUrl(vid.videoUrl);
                    return (
                      <div key={vid.id} data-testid={`video-item-${vid.id}`}>
                        <p className="text-sm font-medium mb-1">{vid.title}</p>
                        {vid.description && (
                          <p className="text-xs text-muted-foreground mb-2">
                            {vid.description}
                          </p>
                        )}
                        <div className="w-full aspect-video rounded-md overflow-hidden border border-border">
                          <iframe
                            src={embedSrc || vid.videoUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={vid.title}
                            data-testid={`video-embed-${vid.id}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="w-full aspect-video bg-muted/50 rounded-md flex items-center justify-center border border-dashed border-muted-foreground/30 mb-4"
                  data-testid="video-placeholder"
                >
                  <div className="text-center space-y-2">
                    <Video className="h-12 w-12 mx-auto text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      No training videos available yet
                    </p>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => goWithPath("course_first", "/intern/training")}
                  disabled={switchPathMutation.isPending}
                  data-testid="button-start-training"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  {progressPercent > 0
                    ? "Continue Training Course"
                    : "Start Training Course"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    goWithPath("entrance_test", "/intern/direct-exam")
                  }
                  disabled={switchPathMutation.isPending}
                  data-testid="button-direct-exam"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Direct Exam (Skip to Week 4)
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {qualPath === "entrance_test" &&
        (status === "pending" || status === "testing") && (
          <>
            <Card className="border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Video className="h-5 w-5 text-blue-400" />
                  <h3 className="font-semibold">
                    {internStatus?.categoryName
                      ? `${internStatus.categoryName} — Training Videos`
                      : "Training Videos"}
                  </h3>
                  <Badge variant="secondary" className="ml-auto">
                    {categoryVideos.length} video
                    {categoryVideos.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                {categoryVideos.length > 0 ? (
                  <div className="space-y-4 mb-4">
                    {categoryVideos.map((vid) => {
                      const embedSrc = getEmbedUrl(vid.videoUrl);
                      return (
                        <div key={vid.id} data-testid={`video-item-${vid.id}`}>
                          <p className="text-sm font-medium mb-1">
                            {vid.title}
                          </p>
                          {vid.description && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {vid.description}
                            </p>
                          )}
                          <div className="w-full aspect-video rounded-md overflow-hidden border border-border">
                            <iframe
                              src={embedSrc || vid.videoUrl}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={vid.title}
                              data-testid={`video-embed-${vid.id}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="w-full aspect-video bg-muted/50 rounded-md flex items-center justify-center border border-dashed border-muted-foreground/30 mb-4"
                    data-testid="video-placeholder"
                  >
                    <div className="text-center space-y-2">
                      <Video className="h-12 w-12 mx-auto text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        No training videos available yet
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() =>
                      goWithPath("course_first", "/intern/training")
                    }
                    disabled={switchPathMutation.isPending}
                    data-testid="button-full-training-course"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {progressPercent > 0
                      ? "Continue Full Training Course"
                      : "Start Full Training Course"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      goWithPath("entrance_test", "/intern/direct-exam")
                    }
                    disabled={switchPathMutation.isPending}
                    data-testid="button-direct-exam-entrance"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Direct Exam (Skip to Week 4)
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <h3 className="font-semibold">Get Started</h3>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Choose between taking an entrance test or selecting a demo
                  project to work on.
                </p>
                <Button
                  onClick={() => setLocation("/intern/test-path")}
                  data-testid="button-start-test-path"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Go to Test & Projects
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="relative border border-blue-500/30 bg-gradient-to-br from-blue-900/40 to-slate-900/40 shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
              {/* Top highlight line */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-400 via-purple-400 to-transparent rounded-t-xl" />

              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <h3 className="font-semibold text-white">
                    Get Free SCAI Tokens 🚀
                  </h3>
                </div>

                <p className="text-blue-100/80 text-sm mb-4 leading-relaxed">
                  As part of your Web3 internship, you will be building DApps
                  and deploying smart contracts on the SCAI Mainnet. To perform
                  transactions and deployments, you will need SCAI tokens.
                  <br />
                  <br />
                  You can claim free tokens daily using the official faucet.
                  Enter your MetaMask wallet address and receive
                  <strong className="text-blue-300">
                    {" "}
                    0.1 SCAI tokens daily
                  </strong>
                  .
                  <br />
                  <br />
                  ⚠️ Only use your public wallet address. Never share your
                  private key or seed phrase.
                </p>

                <Button
                  onClick={() =>
                    window.open("https://faucet.securechain.ai/", "_blank")
                  }
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Open Faucet
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </>
        )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <PlayCircle className="h-6 w-6 text-blue-400" />
              <p
                className="text-2xl font-bold"
                data-testid="text-running-count"
              >
                {runningTasks.length}
              </p>
              <p className="text-xs text-muted-foreground">Running</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <CheckCircle className="h-6 w-6 text-green-400" />
              <p
                className="text-2xl font-bold"
                data-testid="text-completed-count"
              >
                {completedTasks.length}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <XCircle className="h-6 w-6 text-red-400" />
              <p
                className="text-2xl font-bold"
                data-testid="text-cancelled-count"
              >
                {cancelledTasks.length}
              </p>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <Clock className="h-6 w-6 text-orange-400" />
              <p className="text-2xl font-bold" data-testid="text-today-hours">
                {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m
              </p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <Clock className="h-6 w-6 text-purple-400" />
              <p className="text-2xl font-bold" data-testid="text-week-hours">
                {Math.floor(weekMinutes / 60)}h {weekMinutes % 60}m
              </p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <Clock className="h-6 w-6 text-teal-400" />
              <p className="text-2xl font-bold" data-testid="text-total-hours">
                {totalHours}h {totalMins}m
              </p>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-blue-500" />
            Latest Running Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {runningTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No running tasks</p>
                <p className="text-sm">Start a task to see it here</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Title</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Time Spent</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runningTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getProjectName(task.projectId)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(task.priority || "medium")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {getTaskTimeSpent(task.id)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.createdAt
                          ? formatDistanceToNow(new Date(task.createdAt), {
                              addSuffix: true,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {task.dueDate ? (
                          <div className="flex items-center gap-1">
                            <span>
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                            {new Date(task.dueDate) < new Date() && (
                              <Badge variant="destructive" className="text-xs">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            No due date
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
