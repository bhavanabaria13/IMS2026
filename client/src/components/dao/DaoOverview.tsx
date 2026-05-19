import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  Sparkles,
  FolderKanban,
  ClipboardList,
  Clock,
  ArrowRight,
  Video as VideoIcon,
} from "lucide-react";
import type { Video as VideoRecord } from "@shared/schema";

interface DaoStats {
  directDao: number;
  internshipDao: number;
  totalDao: number;
  pendingDao: number;
}

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

export default function DaoOverview() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery<DaoStats>({
    queryKey: ["/api/dao/stats"],
    queryFn: async () => {
      const res = await fetch("/api/dao/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch DAO stats");
      return res.json();
    },
  });

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/intern/profile"],
    queryFn: async () => {
      const res = await fetch("/api/intern/profile", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
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

  const { data: daoVideos = [] } = useQuery<VideoRecord[]>({
    queryKey: ["/api/intern/videos", "dao"],
    queryFn: async () => {
      const res = await fetch("/api/intern/videos?type=dao", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch DAO videos");
      return res.json();
    },
  });

  return (
    <div className="space-y-6" data-testid="dao-overview">
      <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3
                className="text-lg font-semibold"
                data-testid="text-welcome"
              >
                Welcome, {profile?.name || "DAO Member"}
              </h3>
              <p className="text-sm text-muted-foreground">
                EtherAuthority DAO Panel
              </p>
            </div>
            {profile?.daoPosition && (
              <Badge variant="outline" data-testid="badge-position">
                {profile.daoPosition}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-direct-dao">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" />
              Direct DAO Joiners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-direct-dao">
              {isLoading ? "..." : (stats?.directDao ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Members who applied via Career page
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-internship-dao">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-blue-400" />
              From Internship
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="text-3xl font-bold"
              data-testid="stat-internship-dao"
            >
              {isLoading ? "..." : (stats?.internshipDao ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Interns who joined DAO after completion
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-dao">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-400" />
              Total DAO Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" data-testid="stat-total-dao">
              {isLoading ? "..." : (stats?.totalDao ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All approved DAO members
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-purple-500/20" data-testid="card-dao-videos">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <VideoIcon className="h-5 w-5 text-purple-400" />
            {internStatus?.categoryName
              ? `${internStatus.categoryName} — DAO Videos`
              : "DAO Videos"}
            <Badge variant="secondary" className="ml-auto">
              {daoVideos.length} video{daoVideos.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {daoVideos.length > 0 ? (
            <div className="space-y-4">
              {daoVideos.map((vid) => {
                const embedSrc = getEmbedUrl(vid.videoUrl);
                return (
                  <div key={vid.id} data-testid={`dao-video-item-${vid.id}`}>
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
                        data-testid={`dao-video-embed-${vid.id}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="w-full aspect-video bg-muted/50 rounded-md flex items-center justify-center border border-dashed border-muted-foreground/30"
              data-testid="dao-video-placeholder"
            >
              <div className="text-center space-y-2">
                <VideoIcon className="h-12 w-12 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No DAO videos available yet
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="justify-between h-auto py-4"
            onClick={() => setLocation("/dao/projects")}
            data-testid="button-go-projects"
          >
            <div className="flex items-center gap-3">
              <FolderKanban className="h-5 w-5 text-purple-400" />
              <div className="text-left">
                <div className="font-medium">Projects</div>
                <div className="text-xs text-muted-foreground">
                  Browse and select projects
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="justify-between h-auto py-4"
            onClick={() => setLocation("/dao/tasks")}
            data-testid="button-go-tasks"
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-blue-400" />
              <div className="text-left">
                <div className="font-medium">Tasks</div>
                <div className="text-xs text-muted-foreground">
                  Manage your tasks
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="justify-between h-auto py-4"
            onClick={() => setLocation("/dao/time-logs")}
            data-testid="button-go-timelogs"
          >
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-green-400" />
              <div className="text-left">
                <div className="font-medium">Time Logs</div>
                <div className="text-xs text-muted-foreground">
                  Track your work hours
                </div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
