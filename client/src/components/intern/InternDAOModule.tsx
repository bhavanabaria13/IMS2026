import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Users, Rocket, Shield, Clock } from "lucide-react";

const DAO_POSITIONS = [
  "Influencer Promoter",
  "Business Development Executive",
  "Software Developer",
  "NFT Development",
  "Game Development",
  "Telegram Bot Development",
  "AI Development",
  "Service Provider",
  "Service Consumer",
  "Content Creator",
  "Investor",
  "Brand Marvel",
  "Brand Ambassador",
] as const;

const WORK_AVAILABILITY = [
  "Full-Time Position (Preferred)",
  "Flexible Schedule (Can adjust based on availability)",
] as const;

interface DAOApplication {
  applied: boolean;
  position: string | null;
  workAvailability: string | null;
  expertise: string | null;
  appliedAt: string | null;
  status: string;
}

export default function InternDAOModule() {
  const { toast } = useToast();
  const [position, setPosition] = useState("");
  const [workAvailability, setWorkAvailability] = useState("");
  const [expertise, setExpertise] = useState("");

  const { data: application, isLoading } = useQuery<DAOApplication>({
    queryKey: ["/api/intern/dao-application"],
    queryFn: async () => {
      const res = await fetch("/api/intern/dao-application", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch DAO application");
      return res.json();
    },
  });

  const { data: internStatus } = useQuery<any>({
    queryKey: ["/api/intern/status"],
    queryFn: async () => {
      const res = await fetch("/api/intern/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/intern/dao-membership/apply", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position, workAvailability, expertise }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to submit application");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/dao-application"] });
      queryClient.invalidateQueries({ queryKey: ["/api/intern/status"] });
      toast({ title: "Application Submitted!", description: "Your DAO membership application has been submitted successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!position || !workAvailability || !expertise.trim()) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isCompleted = internStatus?.internshipStatus === "completed";

  if (application?.applied && application.position && application.workAvailability && application.expertise) {
    const daoStatus = application.status || "pending";
    const statusConfig = daoStatus === "approved"
      ? { icon: CheckCircle2, cardClass: "border-green-500/30 bg-green-500/5", iconClass: "text-green-500", titleClass: "text-green-400", title: "DAO Membership Approved!", desc: "Congratulations! Your DAO membership application has been approved. Welcome to the EtherAuthority DAO community!" }
      : daoStatus === "rejected"
      ? { icon: Shield, cardClass: "border-red-500/30 bg-red-500/5", iconClass: "text-red-500", titleClass: "text-red-400", title: "DAO Application Not Approved", desc: "Unfortunately, your DAO membership application was not approved at this time. Please contact the admin for more details." }
      : { icon: Clock, cardClass: "border-yellow-500/30 bg-yellow-500/5", iconClass: "text-yellow-500", titleClass: "text-yellow-400", title: "DAO Application Under Review", desc: "Your application has been received and is under review. You will be notified once it is processed." };
    const StatusIcon = statusConfig.icon;

    return (
      <div className="space-y-6 max-w-3xl mx-auto" data-testid="dao-applied-view">
        <Card className={statusConfig.cardClass}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <StatusIcon className={`h-8 w-8 flex-shrink-0 mt-1 ${statusConfig.iconClass}`} />
              <div className="space-y-2">
                <h2 className={`text-xl font-semibold ${statusConfig.titleClass}`}>{statusConfig.title}</h2>
                <p className="text-muted-foreground">{statusConfig.desc}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Application Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-sm">Position Applied For</Label>
              <p className="font-medium mt-1">{application.position}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Work Availability</Label>
              <p className="font-medium mt-1">{application.workAvailability}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Area of Expertise / Skills</Label>
              <p className="font-medium mt-1 whitespace-pre-wrap">{application.expertise}</p>
            </div>
            {application.appliedAt && (
              <div>
                <Label className="text-muted-foreground text-sm">Submitted On</Label>
                <p className="font-medium mt-1">{new Date(application.appliedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isCompleted) {
    return (
      <div className="max-w-3xl mx-auto" data-testid="dao-not-eligible">
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-8 w-8 text-yellow-500 flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-yellow-400">Not Yet Eligible</h2>
                <p className="text-muted-foreground">You need to complete your internship before applying for DAO membership. Finish all your internship projects to unlock this feature.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto" data-testid="dao-application-form">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Users className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">What is a DAO?</h2>
              <p className="text-muted-foreground leading-relaxed">
                A DAO is a blockchain-based community where members collaborate to build, manage, and grow decentralized projects. Anyone who joins a position in the DAO is expected to fulfill their assigned responsibilities and contribute actively to the ecosystem.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            DAO Application Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Position Applying For <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">Select the position that best matches your skills and interests.</p>
              <RadioGroup value={position} onValueChange={setPosition} className="grid gap-2" data-testid="radio-position">
                {DAO_POSITIONS.map((pos) => (
                  <div key={pos} className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                    <RadioGroupItem value={pos} id={`pos-${pos}`} />
                    <Label htmlFor={`pos-${pos}`} className="flex-1 cursor-pointer font-normal">{pos}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Work Availability <span className="text-red-500">*</span>
              </Label>
              <RadioGroup value={workAvailability} onValueChange={setWorkAvailability} className="grid gap-2" data-testid="radio-availability">
                {WORK_AVAILABILITY.map((avail) => (
                  <div key={avail} className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                    <RadioGroupItem value={avail} id={`avail-${avail}`} />
                    <Label htmlFor={`avail-${avail}`} className="flex-1 cursor-pointer font-normal">{avail}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label htmlFor="expertise" className="text-base font-semibold">
                Area of Expertise / Skills <span className="text-red-500">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">Briefly describe your experience or skills related to the selected position.</p>
              <Textarea
                id="expertise"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                placeholder="e.g., 3 years of Solidity development, experience with DeFi protocols, smart contract auditing..."
                rows={4}
                className="resize-none"
                data-testid="input-expertise"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitMutation.isPending || !position || !workAvailability || !expertise.trim()}
              data-testid="button-submit-dao"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
