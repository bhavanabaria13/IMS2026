import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Search, CheckCircle2, XCircle, Clock, Users, Eye, FileText,
} from "lucide-react";

interface DAOApplicant {
  id: string;
  name: string;
  email: string;
  daoPosition: string | null;
  daoWorkAvailability: string | null;
  daoExpertise: string | null;
  daoAppliedAt: string | null;
  daoStatus: string | null;
  internshipStatus: string;
}

interface DAOMemberApplication {
  id: string;
  name: string;
  email: string;
  education: string;
  position: string;
  workAvailability: string;
  expertise: string;
  resume: string | null;
  status: string;
  createdAt: string;
}

export default function DAOManagement() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [selectedApplicant, setSelectedApplicant] = useState<DAOApplicant | null>(null);
  const [selectedMember, setSelectedMember] = useState<DAOMemberApplication | null>(null);
  const [activeTab, setActiveTab] = useState("members");

  const { data: applicants = [], isLoading } = useQuery<DAOApplicant[]>({
    queryKey: ["/api/admin/dao-applications"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dao-applications", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const { data: memberApplications = [], isLoading: membersLoading } = useQuery<DAOMemberApplication[]>({
    queryKey: ["/api/admin/dao-member-applications"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dao-member-applications", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ internId, status }: { internId: string; status: string }) => {
      const res = await fetch(`/api/admin/dao-applications/${internId}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dao-applications"] });
      toast({
        title: variables.status === "approved" ? "Application Approved" : "Application Rejected",
        description: `DAO membership application has been ${variables.status}.`,
      });
      setSelectedApplicant(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update application status.", variant: "destructive" });
    },
  });

  const memberStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/dao-member-applications/${id}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dao-member-applications"] });
      toast({
        title: variables.status === "approved" ? "Application Approved" : "Application Rejected",
        description: `DAO member application has been ${variables.status}.`,
      });
      setSelectedMember(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update application status.", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/30" data-testid="badge-approved">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-400 border-red-500/30" data-testid="badge-rejected">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30" data-testid="badge-pending">Pending</Badge>;
    }
  };

  const filtered = applicants.filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || 
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.daoPosition || "").toLowerCase().includes(q);
    const matchesFilter = filter === "all" || (a.daoStatus || "pending") === filter;
    return matchesSearch && matchesFilter;
  });

  const filteredMembers = memberApplications.filter((a) => {
    const q = memberSearch.toLowerCase();
    const matchesSearch = !q || 
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.position.toLowerCase().includes(q);
    const matchesFilter = memberFilter === "all" || a.status === memberFilter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = applicants.filter(a => !a.daoStatus || a.daoStatus === "pending").length;
  const approvedCount = applicants.filter(a => a.daoStatus === "approved").length;
  const memberPendingCount = memberApplications.filter(a => a.status === "pending").length;
  const memberApprovedCount = memberApplications.filter(a => a.status === "approved").length;

  if (isLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dao-management">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold">{memberApplications.length}</p>
                <p className="text-xs text-muted-foreground">DAO Member Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold">{memberPendingCount + pendingCount}</p>
                <p className="text-xs text-muted-foreground">Total Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold">{memberApprovedCount + approvedCount}</p>
                <p className="text-xs text-muted-foreground">Total Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold">{applicants.length}</p>
                <p className="text-xs text-muted-foreground">Intern DAO Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members" data-testid="tab-dao-members">
            DAO Members ({memberApplications.length})
          </TabsTrigger>
          <TabsTrigger value="intern-dao" data-testid="tab-intern-dao">
            Intern DAO ({applicants.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-lg">DAO Member Applications</CardTitle>
                {memberFilter !== "all" && (
                  <Button variant="ghost" size="sm" onClick={() => setMemberFilter("all")} data-testid="button-clear-member-filter">
                    Clear filter: {memberFilter}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or position..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-dao-members"
                  />
                </div>
                <div className="flex gap-1">
                  {["all", "pending", "approved", "rejected"].map((f) => (
                    <Button
                      key={f}
                      variant={memberFilter === f ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMemberFilter(f)}
                      data-testid={`button-filter-member-${f}`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No DAO member applications found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Education</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Availability</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((app) => (
                        <TableRow key={app.id} data-testid={`dao-member-row-${app.id}`}>
                          <TableCell className="font-medium">{app.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{app.email}</TableCell>
                          <TableCell className="text-sm">{app.education}</TableCell>
                          <TableCell className="text-sm">{app.position}</TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate">{app.workAvailability}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(app.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedMember(app)}
                                data-testid={`button-view-member-${app.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {app.status === "pending" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                    onClick={() => memberStatusMutation.mutate({ id: app.id, status: "approved" })}
                                    disabled={memberStatusMutation.isPending}
                                    data-testid={`button-approve-member-${app.id}`}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                    onClick={() => memberStatusMutation.mutate({ id: app.id, status: "rejected" })}
                                    disabled={memberStatusMutation.isPending}
                                    data-testid={`button-reject-member-${app.id}`}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intern-dao" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-lg">Intern DAO Applications</CardTitle>
                {filter !== "all" && (
                  <Button variant="ghost" size="sm" onClick={() => setFilter("all")} data-testid="button-clear-filter">
                    Clear filter: {filter}
                  </Button>
                )}
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or position..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-dao"
                />
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No DAO applications found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Availability</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((applicant) => (
                        <TableRow key={applicant.id} data-testid={`dao-row-${applicant.id}`}>
                          <TableCell className="font-medium">{applicant.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{applicant.email}</TableCell>
                          <TableCell className="text-sm">{applicant.daoPosition || "-"}</TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">{applicant.daoWorkAvailability || "-"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {applicant.daoAppliedAt
                              ? new Date(applicant.daoAppliedAt).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>{getStatusBadge(applicant.daoStatus)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedApplicant(applicant)}
                                data-testid={`button-view-dao-${applicant.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(!applicant.daoStatus || applicant.daoStatus === "pending") && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                    onClick={() => statusMutation.mutate({ internId: applicant.id, status: "approved" })}
                                    disabled={statusMutation.isPending}
                                    data-testid={`button-approve-dao-${applicant.id}`}
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                    onClick={() => statusMutation.mutate({ internId: applicant.id, status: "rejected" })}
                                    disabled={statusMutation.isPending}
                                    data-testid={`button-reject-dao-${applicant.id}`}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedApplicant} onOpenChange={() => setSelectedApplicant(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>DAO Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplicant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Name</Label>
                  <p className="font-medium">{selectedApplicant.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  <p className="font-medium text-sm">{selectedApplicant.email}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Position Applying For</Label>
                <p className="font-medium mt-1">{selectedApplicant.daoPosition || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Work Availability</Label>
                <p className="font-medium mt-1">{selectedApplicant.daoWorkAvailability || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Area of Expertise / Skills</Label>
                <p className="font-medium mt-1 whitespace-pre-wrap">{selectedApplicant.daoExpertise || "-"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Applied On</Label>
                  <p className="font-medium mt-1">
                    {selectedApplicant.daoAppliedAt
                      ? new Date(selectedApplicant.daoAppliedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Current Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedApplicant.daoStatus)}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedApplicant && (!selectedApplicant.daoStatus || selectedApplicant.daoStatus === "pending") && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                  onClick={() => statusMutation.mutate({ internId: selectedApplicant.id, status: "rejected" })}
                  disabled={statusMutation.isPending}
                  data-testid="button-reject-dialog"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => statusMutation.mutate({ internId: selectedApplicant.id, status: "approved" })}
                  disabled={statusMutation.isPending}
                  data-testid="button-approve-dialog"
                >
                  {statusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Approve
                </Button>
              </div>
            )}
            {selectedApplicant && selectedApplicant.daoStatus && selectedApplicant.daoStatus !== "pending" && (
              <Button variant="outline" onClick={() => setSelectedApplicant(null)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>DAO Member Application Details</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Name</Label>
                  <p className="font-medium">{selectedMember.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  <p className="font-medium text-sm">{selectedMember.email}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Education</Label>
                <p className="font-medium mt-1">{selectedMember.education}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Position Applying For</Label>
                <p className="font-medium mt-1">{selectedMember.position}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Work Availability</Label>
                <p className="font-medium mt-1">{selectedMember.workAvailability}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Area of Expertise / Skills</Label>
                <p className="font-medium mt-1 whitespace-pre-wrap">{selectedMember.expertise}</p>
              </div>
              {selectedMember.resume && (
                <div>
                  <Label className="text-muted-foreground text-sm">Resume</Label>
                  <p className="font-medium mt-1 whitespace-pre-wrap text-sm">{selectedMember.resume}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Applied On</Label>
                  <p className="font-medium mt-1">
                    {selectedMember.createdAt
                      ? new Date(selectedMember.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Current Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedMember.status)}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedMember && selectedMember.status === "pending" && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                  onClick={() => memberStatusMutation.mutate({ id: selectedMember.id, status: "rejected" })}
                  disabled={memberStatusMutation.isPending}
                  data-testid="button-reject-member-dialog"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => memberStatusMutation.mutate({ id: selectedMember.id, status: "approved" })}
                  disabled={memberStatusMutation.isPending}
                  data-testid="button-approve-member-dialog"
                >
                  {memberStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Approve
                </Button>
              </div>
            )}
            {selectedMember && selectedMember.status !== "pending" && (
              <Button variant="outline" onClick={() => setSelectedMember(null)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
