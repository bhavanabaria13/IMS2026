import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileText, Check, Download, Shield, ArrowRight, Award, Rocket, Lock, AlertCircle } from "lucide-react";

interface InternStatus {
  internshipStatus: string;
  qualificationPath: string;
  courseProgress: number;
  termsAccepted: boolean;
  daoMembershipApplied: boolean;
  examCompletedAt?: string | null;
}

const REVIEW_WAIT_DAYS = 3;
const REVIEW_WAIT_MS = REVIEW_WAIT_DAYS * 24 * 60 * 60 * 1000;

interface Certificate {
  id: string;
  type: string;
  title: string;
}

export default function InternTermsModule() {
  const [, setLocation] = useLocation();
  const [accepted, setAccepted] = useState(false);
  const { toast } = useToast();

  const { data: status, isLoading } = useQuery<InternStatus>({
    queryKey: ["/api/intern/status"],
    queryFn: async () => {
      const res = await fetch("/api/intern/status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
  });

  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ["/api/intern/certificates"],
    queryFn: async () => {
      const res = await fetch("/api/intern/certificates", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch certificates");
      return res.json();
    },
  });

  const hasTrainingCert = certificates.some(c => c.type === "training");
  // Admin must explicitly approve an intern for the internship phase before the
  // T&C button unlocks. Status flow: training_complete (waiting for admin
  // review) → admin Approve → internship → T&C button enabled.
  const adminApprovedStatuses = ["internship", "completed"];
  const baseQualified = status
    ? adminApprovedStatuses.includes(status.internshipStatus)
    : false;
  const isRejected = status?.internshipStatus === "rejected";
  const trainingDone = status
    ? (status.internshipStatus === "training_complete" ||
        adminApprovedStatuses.includes(status.internshipStatus) ||
        (status.courseProgress >= 100 && hasTrainingCert))
    : false;
  const waitingForAdminApproval =
    !!status &&
    !isRejected &&
    !baseQualified &&
    trainingDone;

  const isEntranceTest = status?.qualificationPath === "entrance_test";
  const examCompletedAtMs = status?.examCompletedAt
    ? new Date(status.examCompletedAt).getTime()
    : null;
  const reviewUnlockMs = examCompletedAtMs
    ? examCompletedAtMs + REVIEW_WAIT_MS
    : null;
  const now = Date.now();
  const waitingForReview =
    isEntranceTest &&
    baseQualified &&
    reviewUnlockMs !== null &&
    now < reviewUnlockMs;
  const daysRemaining = reviewUnlockMs
    ? Math.max(0, Math.ceil((reviewUnlockMs - now) / (24 * 60 * 60 * 1000)))
    : 0;
  const isQualified = baseQualified && !waitingForReview;

  const acceptTermsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/intern/accept-terms", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to accept terms");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/status"] });
      toast({ title: "Terms Accepted", description: "You have successfully accepted the terms and conditions." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to accept terms. Please try again.", variant: "destructive" });
    },
  });

  const generateOfferLetterMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/intern/certificates/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "offer_letter" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to generate offer letter");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/certificates"] });
      toast({ title: "Offer Letter Generated", description: "Your internship offer letter has been generated." });
    },
    onError: (error: Error) => {
      toast({ title: "Cannot generate offer letter yet", description: error.message || "Failed to generate offer letter. Please try again.", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="terms-loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const termsAlreadyAccepted = status?.termsAccepted === true;

  const sections = [
    {
      number: 1,
      title: "Introduction",
      content: "Welcome to the EtherAuthority Internship Program. This program is designed to provide aspiring blockchain developers and Web3 enthusiasts with hands-on experience in real-world decentralized application development, smart contract engineering, and blockchain infrastructure.",
    },
    {
      number: 2,
      title: "Duration",
      content: "The internship period is 1 month (4 weeks) from the date of acceptance. During this period, interns are expected to actively participate in assigned tasks, projects, and learning modules as outlined by their mentors.",
    },
    {
      number: 3,
      title: "Responsibilities",
      content: "Interns are expected to maintain a professional work ethic, complete assigned tasks within deadlines, attend scheduled meetings, submit weekly progress reports, and communicate proactively with their mentors. A minimum commitment of 20-30 hours per week is expected.",
    },
    {
      number: 4,
      title: "Compensation",
      content: "Interns will receive a stipend of 5,000 SCAI tokens upon successful completion of the internship. Additionally, outstanding performers may receive performance-based rewards and bonuses based on the quality of their contributions and project outcomes.",
    },
    {
      number: 5,
      title: "Remote Work",
      content: "All work under this internship program is conducted remotely. Interns are responsible for maintaining a stable internet connection, appropriate development environment, and professional communication channels for collaboration.",
    },
    {
      number: 6,
      title: "Intellectual Property",
      content: "All work, code, designs, documentation, and any other deliverables produced during the internship period shall remain the intellectual property of EtherAuthority. Interns agree to assign all rights, title, and interest in such work to the company.",
    },
    {
      number: 7,
      title: "Confidentiality",
      content: "Interns must maintain strict confidentiality regarding all company projects, proprietary information, client data, internal processes, and trade secrets. This NDA obligation extends beyond the internship period indefinitely.",
    },
    {
      number: 8,
      title: "Certificate",
      content: "Upon successful completion of the internship program and all assigned tasks, interns will receive an official Internship Completion Certificate from EtherAuthority, recognizing their contributions and skills developed during the program.",
    },
    {
      number: 9,
      title: "DAO Opportunity",
      content: "After successfully completing the internship, interns will have the option to apply for membership in the EtherAuthority DAO (Decentralized Autonomous Organization). DAO members gain access to governance participation, project funding opportunities, and continued collaboration with the team.",
    },
  ];

  return (
    <div className="space-y-6" data-testid="terms-module">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 flex-wrap">
            <Shield className="h-6 w-6 text-primary" />
            <span>Internship Terms & Conditions</span>
            {termsAlreadyAccepted && (
              <span className="ml-auto flex items-center gap-2 text-sm font-normal text-green-500" data-testid="terms-accepted-badge">
                <Check className="h-5 w-5" />
                Accepted
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-sm">
            Please read the following terms and conditions carefully before accepting. By accepting, you agree to abide by all the terms outlined below throughout your internship at EtherAuthority.
          </p>

          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.number} className="space-y-1" data-testid={`terms-section-${section.number}`}>
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="flex-shrink-0 w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    {section.number}
                  </span>
                  {section.title}
                </h3>
                <p className="text-sm text-muted-foreground pl-9">{section.content}</p>
              </div>
            ))}
          </div>

          {!termsAlreadyAccepted ? (
            <div className="border-t pt-6 space-y-4">
              {isRejected && (
                <div className="flex items-center gap-3 p-4 rounded-md bg-red-500/10 border border-red-500/30" data-testid="terms-rejected-notice">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-red-400">Internship application rejected</p>
                    <p className="text-muted-foreground mt-1">
                      An administrator has rejected your internship application. The Terms &amp; Conditions cannot be accepted. See your dashboard for the reason provided by the admin.
                    </p>
                  </div>
                </div>
              )}
              {waitingForAdminApproval && (
                <div className="flex items-center gap-3 p-4 rounded-md bg-yellow-500/10 border border-yellow-500/20" data-testid="terms-waiting-admin-notice">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-500">Waiting for admin approval</p>
                    <p className="text-muted-foreground mt-1">
                      Your {isEntranceTest ? "entrance test" : "training week-4 task"} submission has been received. The Terms &amp; Conditions submit button will unlock once an administrator reviews and approves your submission.
                    </p>
                  </div>
                </div>
              )}
              {!isQualified && !waitingForReview && !waitingForAdminApproval && !isRejected && (
                <div className="flex items-center gap-3 p-4 rounded-md bg-yellow-500/10 border border-yellow-500/20" data-testid="terms-locked-notice">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-500">Complete your {isEntranceTest ? "entrance test" : "training course"} first</p>
                    <p className="text-muted-foreground mt-1">
                      You need to complete your {isEntranceTest ? "entrance test" : "training program (100% progress)"} and download your certificate before you can accept the terms and proceed to the internship.
                    </p>
                  </div>
                </div>
              )}
              {waitingForReview && (
                <div className="flex items-start gap-3 p-4 rounded-md bg-blue-500/10 border border-blue-500/20" data-testid="terms-review-wait-notice">
                  <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm space-y-1">
                    <p className="font-medium text-blue-400">
                      Test exam completed — admin review in progress
                    </p>
                    <p className="text-muted-foreground">
                      The admin will review your submitted task after your internship starts.
                    </p>
                    <p className="text-muted-foreground">
                      You can join the internship after a {REVIEW_WAIT_DAYS}-day waiting period.
                      {" "}
                      {daysRemaining > 0
                        ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`
                        : "Available soon"}
                      {reviewUnlockMs && (
                        <> (unlocks on {new Date(reviewUnlockMs).toLocaleDateString()}).</>
                      )}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="accept-terms"
                  checked={accepted}
                  onCheckedChange={(checked) => setAccepted(checked === true)}
                  disabled={!isQualified}
                  data-testid="checkbox-accept-terms"
                />
                <label htmlFor="accept-terms" className={`text-sm leading-relaxed ${isQualified ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
                  I have read and agree to the Terms & Conditions of the EtherAuthority Internship Program.
                </label>
              </div>
              <Button
                onClick={() => acceptTermsMutation.mutate()}
                disabled={!isQualified || !accepted || acceptTermsMutation.isPending}
                data-testid="button-accept-terms"
              >
                {!isQualified ? <Lock className="h-4 w-4 mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                {acceptTermsMutation.isPending ? "Accepting..." : "Accept & Continue"}
              </Button>
            </div>
          ) : (
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-md bg-green-500/10 border border-green-500/20" data-testid="terms-accepted-confirmation">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-green-500 font-medium">
                  You have accepted the terms and conditions.
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => generateOfferLetterMutation.mutate()}
                  disabled={generateOfferLetterMutation.isPending}
                  data-testid="button-generate-offer-letter"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {generateOfferLetterMutation.isPending ? "Generating..." : "Generate Internship Offer Letter"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/intern/certificates")}
                  data-testid="button-view-certs-from-terms"
                >
                  <Award className="h-4 w-4 mr-2" />
                  View Certificates
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/intern/projects")}
                  data-testid="button-start-internship"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Go to Projects
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                After generating your offer letter, you can start your 1-month internship by working on projects, creating tasks, and tracking your progress.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
