
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, User, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function InternApproval() {
  const { data: interns = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/interns-with-status"],
  });

  const safeInterns = Array.isArray(interns) ? interns : [];
  const approvedInterns = safeInterns.filter(i => i.approvalStatus === 1);
  const totalInterns = safeInterns.length;

  return (
    <div className="space-y-6">
      <Alert className="border-blue-500/30 bg-blue-500/5">
        <Info className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-300">
          All applicants are now auto-approved when they apply for the course program or internship. No manual approval is required.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                <User className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-applicants">{totalInterns}</p>
                <p className="text-sm text-muted-foreground">Total Applicants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-600/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-approved-count">{approvedInterns.length}</p>
                <p className="text-sm text-muted-foreground">Auto-Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intern Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Education</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeInterns.map((intern) => (
                  <TableRow key={intern.id} data-testid={`row-intern-${intern.id}`}>
                    <TableCell className="font-medium">{intern.name}</TableCell>
                    <TableCell>{intern.email}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{intern.education}</TableCell>
                    <TableCell>{intern.city}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500/10 text-green-500">
                        Auto-Approved
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
