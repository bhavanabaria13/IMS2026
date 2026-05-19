import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Trash2, Eye, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ---------------- TYPES ---------------- */

interface ContactMessage {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied";
  createdAt: string;
}

/* ---------------- API ---------------- */

const fetchContactMessages = async (): Promise<ContactMessage[]> => {
  const res = await fetch("/api/admin/contact-messages", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch contact messages");
  return res.json();
};

/* ---------------- COMPONENT ---------------- */

export default function ContactMessages() {
  const { toast } = useToast();

  const [selectedMessage, setSelectedMessage] =
    useState<ContactMessage | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  /* ---------- PAGINATION ---------- */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  /* ---------- FETCH ---------- */

  const {
    data: messages = [],
    isLoading,
    isError,
  } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/contact-messages"],
    queryFn: fetchContactMessages,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [messages.length]);

  /* ---------- MUTATIONS ---------- */

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: ContactMessage["status"];
    }) => {
      const res = await fetch(
        `/api/admin/contact-messages/${id}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/contact-messages"],
      });
      toast({ title: "Status updated successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete message");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/contact-messages"],
      });
      toast({ title: "Message deleted successfully" });
    },
  });

  /* ---------- HELPERS ---------- */

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setShowDialog(true);

    if (message.status === "unread") {
      updateStatusMutation.mutate({
        id: message.id,
        status: "read",
      });
    }
  };

  const getStatusBadge = (status: ContactMessage["status"]) => {
    switch (status) {
      case "unread":
        return <Badge variant="destructive">Unread</Badge>;
      case "read":
        return <Badge variant="secondary">Read</Badge>;
      case "replied":
        return <Badge>Replied</Badge>;
    }
  };

  /* ---------- PAGINATION LOGIC ---------- */

  const totalPages = Math.ceil(messages.length / itemsPerPage);

  const paginatedMessages = messages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ---------------- UI ---------------- */

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Messages ({messages.length})
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading contact messages...
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-destructive">
              Failed to load contact messages
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No contact messages yet
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="font-medium">
                        {message.firstName} {message.lastName}
                      </TableCell>
                      <TableCell>{message.email}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {message.subject}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(message.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(message.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleViewMessage(message)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {message.status !== "replied" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: message.id,
                                  status: "replied",
                                })
                              }
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (
                                confirm(
                                  "Are you sure you want to delete this message?"
                                )
                              ) {
                                deleteMutation.mutate(message.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* PAGINATION */}
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
                      onClick={() =>
                        setCurrentPage((p) => p - 1)
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((p) => p + 1)
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* VIEW MESSAGE DIALOG */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Message</DialogTitle>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">From</p>
                <p className="font-medium">
                  {selectedMessage.firstName}{" "}
                  {selectedMessage.lastName}
                </p>
                <p className="text-sm">
                  {selectedMessage.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Subject
                </p>
                <p className="font-medium">
                  {selectedMessage.subject}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Message
                </p>
                <p className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {selectedMessage.message}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Received
                </p>
                <p>
                  {new Date(
                    selectedMessage.createdAt
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
