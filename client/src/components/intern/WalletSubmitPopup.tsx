import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, CheckCircle, Loader2, Copy, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import metamaskLogo from "@assets/image_1775284318076.png";

interface WalletSubmitPopupProps {
  internshipStatus: string;
}

export default function WalletSubmitPopup({ internshipStatus }: WalletSubmitPopupProps) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: walletData, isLoading } = useQuery<{ walletAddress: string | null }>({
    queryKey: ["/api/intern/wallet"],
    queryFn: async () => {
      const res = await fetch("/api/intern/wallet", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: internshipStatus === "internship" || internshipStatus === "completed",
  });

  useEffect(() => {
    if (!isLoading && walletData && !walletData.walletAddress && (internshipStatus === "internship" || internshipStatus === "completed")) {
      const timer = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [walletData, isLoading, internshipStatus]);

  const submitMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      const res = await fetch("/api/intern/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/wallet"] });
      toast({ title: "Wallet Saved!", description: "Your MetaMask wallet address has been submitted successfully." });
      setOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!address.trim()) return;
    if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      toast({ title: "Invalid Address", description: "Please enter a valid Ethereum wallet address (0x...)", variant: "destructive" });
      return;
    }
    submitMutation.mutate(address.trim());
  };

  const handleCopy = () => {
    if (walletData?.walletAddress) {
      navigator.clipboard.writeText(walletData.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (internshipStatus !== "internship" && internshipStatus !== "completed") return null;

  if (walletData?.walletAddress) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg border-purple-500/30 bg-gradient-to-b from-background to-background/95">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto">
            <img src={metamaskLogo} alt="MetaMask" className="w-full max-w-sm mx-auto rounded-lg" data-testid="img-metamask" />
          </div>
          <DialogTitle className="text-xl font-bold" data-testid="title-wallet-popup">
            Submit your wallet address to receive your{" "}
            <span className="text-orange-400">internship stipend</span> in SCAI tokens.
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <p className="font-semibold text-foreground">
              Please send only your <span className="text-blue-400">MetaMask wallet address</span>
            </p>
            <p className="text-xs text-muted-foreground italic">(no private keys or seed phrases)</p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="0x3A7eF3bD4886C4E219d9A7c164cE2131b1244dF3"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pl-10 font-mono text-sm bg-muted/50 border-border/50"
                data-testid="input-wallet-address"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-500/90">
              Make sure you enter the correct wallet address. This address will be used to send your SCAI token stipend.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!address.trim() || submitMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
            data-testid="button-submit-wallet"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                Submit Wallet Address
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="w-full text-muted-foreground"
            data-testid="button-skip-wallet"
          >
            I'll do this later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
