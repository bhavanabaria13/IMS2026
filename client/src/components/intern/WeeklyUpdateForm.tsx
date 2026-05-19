
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const weeklyUpdateFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  programCourseName: z.string().min(1, "Program/Course name is required"),
  weekNumber: z.number().min(1).max(53),
  year: z.number().min(2000),
  reportingPeriod: z.string().min(1, "Reporting period is required"),
  learningTopics: z.string().optional(),
  tasksCompleted: z.string().optional(),
  workOutput: z.string().optional(),
  githubRepoLink: z.string().optional(),
  deployedUrl: z.string().optional(),
  taskCompletionStatus: z.string().optional(),
  selfRating: z.string().transform(val => parseInt(val)),
  timeSpent: z.string().optional(),
  challengesFaced: z.string().optional(),
  solutionsAttempted: z.string().optional(),
  keyLearnings: z.string().optional(),
});

type WeeklyUpdateFormData = z.infer<typeof weeklyUpdateFormSchema>;

interface WeeklyUpdateFormProps {
  onSubmitSuccess: () => void;
}

export default function WeeklyUpdateForm({ onSubmitSuccess }: WeeklyUpdateFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const currentWeek = new Date().getWeek();
  const currentYear = new Date().getFullYear();

  const form = useForm<WeeklyUpdateFormData>({
    resolver: zodResolver(weeklyUpdateFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      programCourseName: "",
      weekNumber: currentWeek,
      year: currentYear,
      reportingPeriod: "",
      learningTopics: "",
      tasksCompleted: "",
      workOutput: "",
      githubRepoLink: "",
      deployedUrl: "",
      taskCompletionStatus: "in-progress",
      selfRating: "3",
      timeSpent: "",
      challengesFaced: "",
      solutionsAttempted: "",
      keyLearnings: "",
    },
  });

  const onSubmit = async (data: WeeklyUpdateFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/intern/weekly-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit update");
      }

      toast({
        title: "Success!",
        description: "Weekly update submitted successfully",
      });
      
      onSubmitSuccess();
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-600/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">Weekly Update Form</CardTitle>
                <p className="text-sm text-muted-foreground">Please complete your weekly update to access your dashboard</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="programCourseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program / Course Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Web Development Internship" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="weekNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Week Number *</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="53" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year *</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reportingPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reporting Period *</FormLabel>
                        <FormControl>
                          <Input placeholder="15 Dec – 19 Dec 2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="learningTopics"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Learning Topics Covered</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe the topics you learned this week..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tasksCompleted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What Tasks Did You Complete This Week?</FormLabel>
                      <FormControl>
                        <Textarea placeholder="List the tasks you completed..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workOutput"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work Output / Deliverables</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., smart contract deployed, React UI built, API completed..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="githubRepoLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub Repository Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://github.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deployedUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deployed URL / Demo Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="taskCompletionStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Completion Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="selfRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Self-Rating (1-5)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 - Needs Improvement</SelectItem>
                            <SelectItem value="2">2 - Below Average</SelectItem>
                            <SelectItem value="3">3 - Average</SelectItem>
                            <SelectItem value="4">4 - Good</SelectItem>
                            <SelectItem value="5">5 - Excellent</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeSpent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Spent (Approx.)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 40 hours" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="challengesFaced"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Challenges / Issues Faced</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe any challenges you encountered..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="solutionsAttempted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How Did You Try to Solve Them?</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Explain your problem-solving approach..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="keyLearnings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Learnings This Week</FormLabel>
                      <FormControl>
                        <Textarea placeholder="What were your main takeaways?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Weekly Update"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function () {
  const d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};
