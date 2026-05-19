import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Send, MessageSquare, ShieldCheck, User } from "lucide-react";

interface InternMessage {
  id: string;
  internId: string;
  senderType: "intern" | "admin";
  subject: string;
  message: string;
  adminUsername: string | null;
  isRead: boolean;
  createdAt: string;
}

const formSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required")
    .max(200, "Subject is too long"),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(5000, "Message is too long"),
});

type FormValues = z.infer<typeof formSchema>;

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
};

export default function InternMessagesModule() {
  const { toast } = useToast();

  const { data: messages = [], isLoading } = useQuery<InternMessage[]>({
    queryKey: ["/api/intern/messages"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { subject: "", message: "" },
  });

  const sendMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return await apiRequest("/api/intern/messages", {
        method: "POST",
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "The admin team will get back to you soon.",
      });
      form.reset({ subject: "", message: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/messages"] });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to send",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const ordered = [...messages].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send a message to admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => sendMutation.mutate(v))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title (Subject)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Short subject for your message"
                        data-testid="input-message-subject"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Message)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={5}
                        placeholder="Write your message to the admin team..."
                        data-testid="input-message-body"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={sendMutation.isPending}
                  data-testid="button-send-message"
                >
                  {sendMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : ordered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No messages yet. Send your first message above.
            </p>
          ) : (
            <div className="space-y-3">
              {ordered.map((m) => {
                const isAdmin = m.senderType === "admin";
                return (
                  <div
                    key={m.id}
                    data-testid={`row-message-${m.id}`}
                    className={`rounded-lg border p-4 ${
                      isAdmin
                        ? "bg-blue-500/5 border-blue-500/30"
                        : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <Badge className="bg-blue-500/15 text-blue-300 border border-blue-500/30">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Admin {m.adminUsername ? `· ${m.adminUsername}` : ""}
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <User className="h-3 w-3 mr-1" />
                            You
                          </Badge>
                        )}
                        <span className="font-medium text-sm">{m.subject}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(m.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {m.message}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
