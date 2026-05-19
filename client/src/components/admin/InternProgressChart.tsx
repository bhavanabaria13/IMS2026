import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, BarChart3 } from "lucide-react";

export default function InternProgressChart() {
  const { data: interns = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/interns-with-status"],
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: timeLogs = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/time-logs"],
  });

  const activeInterns = interns.filter(i => i.approvalStatus === 1);

  // Calculate stats for each intern
  const internStats = activeInterns.map(intern => {
    const internTasks = tasks.filter(t => t.assignedTo === intern.id);
    const completedTasks = internTasks.filter(t => t.status === "completed").length;
    const totalTasks = internTasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate total working hours
    const internTimeLogs = timeLogs.filter(log => log.internId === intern.id);
    let totalMinutes = 0;
    internTimeLogs.forEach(log => {
      if (log.duration) {
        totalMinutes += log.duration;
      } else if (!log.endTime) {
        // Active log
        const elapsed = Math.floor((new Date().getTime() - new Date(log.startTime).getTime()) / 60000);
        totalMinutes += elapsed;
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return {
      intern,
      completedTasks,
      totalTasks,
      completionRate,
      workingHours: `${hours}h ${minutes}m`,
      totalMinutes,
    };
  });

  // Sort by working hours (descending)
  internStats.sort((a, b) => b.totalMinutes - a.totalMinutes);

  return (
    <Card className="border-border/50 mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Intern Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {internStats.length > 0 ? (
            internStats.map(({ intern, completedTasks, totalTasks, completionRate, workingHours }) => (
              <div key={intern.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{intern.name}</h4>
                    <p className="text-sm text-muted-foreground">{intern.email}</p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{workingHours}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{completedTasks}/{totalTasks}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Task Completion</span>
                    <span className="font-semibold">{completionRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No active interns with tasks yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}