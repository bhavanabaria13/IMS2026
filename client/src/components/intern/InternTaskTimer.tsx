
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Play, Pause } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function InternTaskTimer() {
  const { toast } = useToast();
  const [elapsedTime, setElapsedTime] = useState(0);

  const { data: timeLogs = [] } = useQuery<any[]>({
    queryKey: ["/api/intern/time-logs"],
    refetchInterval: 5000,
  });

  const activeLog = timeLogs.find(log => !log.endTime);

  const startTimerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/intern/time-logs/start", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to start timer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/time-logs"] });
      toast({ title: "Timer started" });
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: async (logId: string) => {
      const res = await fetch(`/api/intern/time-logs/${logId}/stop`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to stop timer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/time-logs"] });
      toast({ title: "Timer stopped" });
    },
  });

  useEffect(() => {
    if (activeLog) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - new Date(activeLog.startTime).getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [activeLog]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-mono font-medium min-w-[70px]">
        {formatTime(elapsedTime)}
      </span>
      {activeLog ? (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => stopTimerMutation.mutate(activeLog.id)}
        >
          <Pause className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => startTimerMutation.mutate()}
        >
          <Play className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
