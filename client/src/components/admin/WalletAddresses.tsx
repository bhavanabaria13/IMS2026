import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, Search, Copy, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface WalletIntern {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  internshipStatus: string;
  categoryId: string | null;
  appliedDate: string;
}

export default function WalletAddresses() {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: walletInterns = [], isLoading } = useQuery<WalletIntern[]>({
    queryKey: ["/api/admin/wallet-addresses"],
    queryFn: async () => {
      const res = await fetch("/api/admin/wallet-addresses", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "—";
    const cat = categories.find((c: any) => c.id === categoryId);
    return cat?.name || "—";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "internship":
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">Active Intern</Badge>;
      case "completed":
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/30">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCopy = (address: string, id: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    toast({ title: "Copied!", description: "Wallet address copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = walletInterns.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.email.toLowerCase().includes(search.toLowerCase()) ||
    i.walletAddress.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-total-wallets">{walletInterns.length}</p>
                <p className="text-xs text-muted-foreground">Total Wallets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-active-wallets">
                  {walletInterns.filter(i => i.internshipStatus === "internship").length}
                </p>
                <p className="text-xs text-muted-foreground">Active Interns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-completed-wallets">
                  {walletInterns.filter(i => i.internshipStatus === "completed").length}
                </p>
                <p className="text-xs text-muted-foreground">Completed Interns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-purple-400" />
            Intern Wallet Addresses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              data-testid="input-search-wallets"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8" data-testid="text-no-wallets">
              {walletInterns.length === 0 ? "No wallet addresses submitted yet" : "No matching results"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((intern, idx) => (
                  <TableRow key={intern.id} data-testid={`row-wallet-${intern.id}`}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{intern.name}</TableCell>
                    <TableCell className="text-muted-foreground">{intern.email}</TableCell>
                    <TableCell>{getCategoryName(intern.categoryId)}</TableCell>
                    <TableCell>{getStatusBadge(intern.internshipStatus)}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono" data-testid={`text-wallet-${intern.id}`}>
                        {intern.walletAddress.slice(0, 6)}...{intern.walletAddress.slice(-4)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleCopy(intern.walletAddress, intern.id)}
                        data-testid={`button-copy-wallet-${intern.id}`}
                      >
                        {copiedId === intern.id ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
