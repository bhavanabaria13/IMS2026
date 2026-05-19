import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Layers,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Circle,
} from "lucide-react";
import type { CourseModule, CourseProgress } from "@shared/schema";

const COURSE_DOC_URL =
  "https://docs.google.com/document/d/1jobiopM_7XFRgRx304_WYjsP6o03OnDWmhvxH4CTaTY/edit?usp=sharing";

interface CategoryInfoCardProps {
  categoryName: string;
  subcategoryName?: string | null;
  categoryId?: string | null;
}

export default function CategoryInfoCard({
  categoryName,
  subcategoryName,
  categoryId,
}: CategoryInfoCardProps) {
  const [showCourseList, setShowCourseList] = useState(false);

  const { data: modules = [] } = useQuery<CourseModule[]>({
    queryKey: ["/api/intern/course-modules"],
    queryFn: async () => {
      const res = await fetch("/api/intern/course-modules", {
        credentials: "include",
      });
      if (!res.ok) return [];
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    },
    enabled: showCourseList,
  });

  const { data: progress = [] } = useQuery<CourseProgress[]>({
    queryKey: ["/api/intern/course-progress"],
    queryFn: async () => {
      const res = await fetch("/api/intern/course-progress", {
        credentials: "include",
      });
      if (!res.ok) return [];
      const text = await res.text();
      return text ? JSON.parse(text) : [];
    },
    enabled: showCourseList,
  });

  const completedModuleIds = new Set(
    progress.filter((p) => p.completed).map((p) => p.courseModuleId),
  );

  const groupedByWeek = modules.reduce<Record<number, CourseModule[]>>(
    (acc, mod) => {
      if (!acc[mod.weekNumber]) acc[mod.weekNumber] = [];
      acc[mod.weekNumber].push(mod);
      return acc;
    },
    {},
  );

  const allWeeks = [1, 2, 3, 4];
  const totalModules = modules.length;
  const totalCompleted = modules.filter((m) =>
    completedModuleIds.has(m.id),
  ).length;

  return (
    <>
      <Card className="border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-indigo-900/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <Layers className="h-5 w-5 text-purple-400" />
            <h3 className="font-semibold">Your Category</h3>
            <Badge
              variant="secondary"
              className="ml-auto"
              data-testid="badge-intern-category"
            >
              {categoryName}
            </Badge>
            {subcategoryName && (
              <Badge variant="outline" data-testid="badge-intern-subcategory">
                {subcategoryName}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Your training content, videos, and projects are tailored to your
            selected category.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowCourseList(true)}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-course-list"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Course List (Details)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(COURSE_DOC_URL, "_blank")}
              data-testid="button-course-document"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Course Document (Read More)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCourseList} onOpenChange={setShowCourseList}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-400" />
              {categoryName} — Course Modules
            </DialogTitle>
            <p className="text-xs text-muted-foreground pt-1">
              {totalCompleted} / {totalModules} modules completed
            </p>
          </DialogHeader>

          {modules.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">
              No course modules available for your category yet.
            </p>
          ) : (
            <Tabs defaultValue="week-1" className="w-full">
              <TabsList className="w-full grid grid-cols-4 mb-4">
                {allWeeks.map((week) => {
                  const weekModules = groupedByWeek[week] || [];
                  const weekCompleted = weekModules.filter((m) =>
                    completedModuleIds.has(m.id),
                  ).length;
                  const hasModules = weekModules.length > 0;
                  return (
                    <TabsTrigger
                      key={week}
                      value={`week-${week}`}
                      className="text-xs sm:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                      data-testid={`tab-week-${week}`}
                    >
                      <span className="flex flex-col items-center gap-0.5">
                        <span>Week {week}</span>
                        {hasModules && (
                          <span className="text-[10px] opacity-70">
                            {weekCompleted}/{weekModules.length}
                          </span>
                        )}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {allWeeks.map((week) => {
                const weekModules = (groupedByWeek[week] || []).sort(
                  (a, b) => a.orderIndex - b.orderIndex,
                );
                return (
                  <TabsContent
                    key={week}
                    value={`week-${week}`}
                  >
                    <ScrollArea className="h-[50vh] pr-4">
                      {weekModules.length === 0 ? (
                        <p className="text-muted-foreground text-sm py-8 text-center">
                          No modules for Week {week} yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {weekModules.map((mod) => {
                            const isCompleted = completedModuleIds.has(mod.id);
                            return (
                              <div
                                key={mod.id}
                                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                  isCompleted
                                    ? "border-green-500/30 bg-green-500/5"
                                    : "border-border bg-muted/30"
                                }`}
                                data-testid={`course-module-${mod.id}`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm font-medium ${isCompleted ? "text-green-300" : ""}`}
                                  >
                                    {mod.title}
                                  </p>
                                  {mod.description && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {mod.description}
                                    </p>
                                  )}
                                  <Badge
                                    variant="secondary"
                                    className="mt-1.5 text-[10px]"
                                  >
                                    {mod.category}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
