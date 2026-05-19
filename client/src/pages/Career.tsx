import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, LinkIcon } from "lucide-react";

const DAO_POSITIONS = [
  "Influencer Promoters",
  "Business Development Executives",
  "Software Developers",
  "NFT Development",
  "Game Development",
  "Telegram Bot Development",
  "AI Development",
  "Service Providers",
  "Service Consumers",
  "Content Creators",
  "Investors",
  "Brand Marvels",
  "Brand Ambassadors",
];

const POSITION_OPTIONS = [
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
];

function StarField() {
  const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    delay: Math.random() * 4,
    duration: Math.random() * 3 + 2,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: 0.3 + Math.random() * 0.5,
            animation: `twinkle ${star.duration}s ${star.delay}s infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}

export default function Career() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    education: "",
    position: "",
    workAvailability: "",
    expertise: "",
    resume: "",
  });
  const [showVideo, setShowVideo] = useState(false); // ✅ HERE

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/dao-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description:
          "Your DAO application has been submitted successfully. We'll review it and get back to you.",
      });
      setShowApplicationForm(false);
      setFormData({
        name: "",
        email: "",
        education: "",
        position: "",
        workAvailability: "",
        expertise: "",
        resume: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.name ||
      !formData.email ||
      !formData.education ||
      !formData.position ||
      !formData.workAvailability ||
      !formData.expertise
    ) {
      toast({
        title: "Required Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate(formData);
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #0a0a1a 0%, #0d0b2e 25%, #130f3d 50%, #0d0b2e 75%, #0a0a1a 100%)",
      }}
    >
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.3); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 15px rgba(139, 92, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.1); }
          50% { box-shadow: 0 0 25px rgba(139, 92, 246, 0.5), 0 0 50px rgba(59, 130, 246, 0.2); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .position-tile {
          position: relative;
          overflow: hidden;
        }
        .position-tile::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, rgba(139,92,246,0.4), rgba(59,130,246,0.2), rgba(139,92,246,0.4));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }
        .position-tile:hover::before {
          background: linear-gradient(135deg, rgba(139,92,246,0.8), rgba(59,130,246,0.5), rgba(168,85,247,0.8));
        }
        .position-tile:hover {
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.2), 0 0 40px rgba(59, 130, 246, 0.1);
        }
        .orbital-dot {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: radial-gradient(circle, #a78bfa, #60a5fa);
          box-shadow: 0 0 8px rgba(167, 139, 250, 0.8), 0 0 16px rgba(96, 165, 250, 0.4);
        }
      `}</style>

      <StarField />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-blue-600/6 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-600/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-10 w-72 h-72 bg-blue-500/6 rounded-full blur-3xl" />
      </div>

      <Header
        onApplyClick={() => setLocation("/career")}
        onAdminClick={() => setLocation("/admin/login")}
        onInternClick={() => setLocation("/intern/login")}
        onContactClick={() => setLocation("/contact")}
        onCareerClick={() => setLocation("/career")}
      />

      <main className="relative">
        <div
          className="max-w-2xl mx-auto px-4 pt-16 pb-20"
          style={{ marginTop: "22px" }}
        >
          <h1
            className="text-5xl md:text-6xl font-bold text-center mb-12"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
            data-testid="text-career-title"
          >
            <span className="text-white">Apply to Join </span>
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              DAO
            </span>
          </h1>

          <div
            className="relative w-56 h-56 mx-auto mb-12"
            data-testid="dao-visual"
            style={{ animation: "float 4s ease-in-out infinite" }}
          >
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 blur-3xl"
              style={{ animation: "glow-pulse 3s ease-in-out infinite" }}
            />

            <div
              className="absolute inset-0 rounded-full"
              style={{ animation: "spin-slow 20s linear infinite" }}
            >
              <div className="absolute inset-2 rounded-full border border-purple-500/30" />
              <div
                className="orbital-dot"
                style={{
                  top: "2px",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              />
              <div
                className="orbital-dot"
                style={{
                  bottom: "2px",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              />
            </div>

            <div
              className="absolute inset-0 rounded-full"
              style={{ animation: "spin-reverse 15s linear infinite" }}
            >
              <div className="absolute inset-6 rounded-full border border-blue-400/20" />
              <div
                className="orbital-dot"
                style={{
                  top: "24px",
                  right: "10px",
                  width: "5px",
                  height: "5px",
                }}
              />
              <div
                className="orbital-dot"
                style={{
                  bottom: "24px",
                  left: "10px",
                  width: "5px",
                  height: "5px",
                }}
              />
            </div>

            <div
              className="absolute inset-0 rounded-full"
              style={{ animation: "spin-slow 25s linear infinite" }}
            >
              <div className="absolute inset-10 rounded-full border border-indigo-400/15" />
              <div
                className="orbital-dot"
                style={{
                  top: "44px",
                  left: "8px",
                  width: "4px",
                  height: "4px",
                }}
              />
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center shadow-2xl"
                style={{
                  boxShadow:
                    "0 0 40px rgba(139, 92, 246, 0.4), 0 0 80px rgba(59, 130, 246, 0.2)",
                }}
              >
                <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                    <line x1="12" y1="22.08" x2="12" y2="12" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
              <span className="text-base font-bold tracking-[0.3em] bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                DAO
              </span>
            </div>
          </div>

          <div className="text-center mb-14">
            <p
              className="text-lg md:text-xl text-gray-300 leading-relaxed"
              data-testid="text-dao-description"
            >
              Join our Decentralized Autonomous Organization.
              <br />
              Contribute and earn with SCAI tokens + revenue share
              <br />
              from the projects you help build.
            </p>
          </div>

          <div
            className="grid grid-cols-3 gap-3 mb-14"
            data-testid="grid-positions"
          >
            {DAO_POSITIONS.map((position, index) => {
              const isLastRow =
                index >=
                DAO_POSITIONS.length -
                  (DAO_POSITIONS.length % 3 === 0
                    ? 3
                    : DAO_POSITIONS.length % 3);
              const lastRowCount = DAO_POSITIONS.length % 3 || 3;
              const isInLastIncompleteRow = isLastRow && lastRowCount < 3;

              return (
                <div
                  key={position}
                  className={`position-tile rounded-xl bg-white/[0.03] px-4 py-3.5 text-center transition-all duration-300 cursor-default hover:bg-white/[0.06] ${
                    isInLastIncompleteRow &&
                    index === DAO_POSITIONS.length - lastRowCount
                      ? "col-start-1"
                      : ""
                  }`}
                  style={
                    isInLastIncompleteRow && lastRowCount === 1
                      ? { gridColumn: "2" }
                      : undefined
                  }
                  data-testid={`position-${position.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <span className="text-sm font-medium text-gray-200">
                    {position}
                  </span>
                </div>
              );
            })}
          </div>

<div className="text-center mb-6 flex flex-col sm:flex-row justify-center items-center gap-4">         
		<Button
  variant="outline"
  className="w-full sm:w-auto text-sm sm:text-lg px-6 sm:px-12 py-4 sm:py-7 rounded-full font-semibold transition-all duration-300"
  onClick={() => setShowVideo(true)}
>
  Watch Video
</Button>

<Button
  className="w-full sm:w-auto text-sm sm:text-lg px-6 sm:px-12 py-4 sm:py-7 rounded-full font-semibold transition-all duration-300 hover:scale-105"
  style={{
    background:
      "linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%)",
  }}
  onClick={() => setShowApplicationForm(true)}
>
  Apply Now
</Button>
          </div>

          <div className="text-center space-y-1.5 mb-8">
            <p className="text-sm text-gray-400">
              Full-time positions with schedule flexibility
            </p>
            <p className="text-sm text-gray-400">
              Accountability and remuneration based on work within the DAO.
            </p>
          </div>
        </div>
      </main>

      <Footer onCareerClick={() => setLocation("/")} />

      <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-[#0d0b2e] border-purple-500/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-purple-400" />
              DAO Application Form
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-gray-200">
                Name <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter your full name"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                required
                data-testid="input-dao-name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="Enter your email address"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                required
                data-testid="input-dao-email"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">
                Education <span className="text-red-400">*</span>
              </Label>
              <Input
                value={formData.education}
                onChange={(e) =>
                  setFormData({ ...formData, education: e.target.value })
                }
                placeholder="Your highest education qualification"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                required
                data-testid="input-dao-education"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-gray-200">
                Position Applying For <span className="text-red-400">*</span>
              </Label>
              <p className="text-xs text-gray-400">
                Select the position that best matches your skills and interests.
              </p>
              <RadioGroup
                value={formData.position}
                onValueChange={(val) =>
                  setFormData({ ...formData, position: val })
                }
                className="space-y-2"
                data-testid="radio-dao-position"
              >
                {POSITION_OPTIONS.map((pos) => (
                  <div
                    key={pos}
                    className="flex items-center space-x-3 rounded-lg bg-white/[0.03] border border-white/10 px-4 py-3 hover:bg-white/[0.06] transition-colors"
                  >
                    <RadioGroupItem
                      value={pos}
                      id={`pos-${pos}`}
                      className="border-gray-500 text-purple-400"
                    />
                    <Label
                      htmlFor={`pos-${pos}`}
                      className="text-sm text-gray-200 cursor-pointer flex-1"
                    >
                      {pos}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-gray-200">
                Work Availability <span className="text-red-400">*</span>
              </Label>
              <RadioGroup
                value={formData.workAvailability}
                onValueChange={(val) =>
                  setFormData({ ...formData, workAvailability: val })
                }
                className="space-y-2"
                data-testid="radio-dao-availability"
              >
                <div className="flex items-center space-x-3 rounded-lg bg-white/[0.03] border border-white/10 px-4 py-3 hover:bg-white/[0.06] transition-colors">
                  <RadioGroupItem
                    value="Full-Time Position (Preferred)"
                    id="avail-ft"
                    className="border-gray-500 text-purple-400"
                  />
                  <Label
                    htmlFor="avail-ft"
                    className="text-sm text-gray-200 cursor-pointer flex-1"
                  >
                    Full-Time Position (Preferred)
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg bg-white/[0.03] border border-white/10 px-4 py-3 hover:bg-white/[0.06] transition-colors">
                  <RadioGroupItem
                    value="Flexible Schedule (Can adjust based on availability)"
                    id="avail-flex"
                    className="border-gray-500 text-purple-400"
                  />
                  <Label
                    htmlFor="avail-flex"
                    className="text-sm text-gray-200 cursor-pointer flex-1"
                  >
                    Flexible Schedule (Can adjust based on availability)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">
                Area of Expertise / Skills{" "}
                <span className="text-red-400">*</span>
              </Label>
              <p className="text-xs text-gray-400">
                Briefly describe your experience or skills related to the
                selected position.
              </p>
              <Textarea
                value={formData.expertise}
                onChange={(e) =>
                  setFormData({ ...formData, expertise: e.target.value })
                }
                placeholder="Describe your relevant skills and experience..."
                rows={4}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
                required
                data-testid="textarea-dao-expertise"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-200">
                Resume{" "}
                <span className="text-gray-500">(paste link or text)</span>
              </Label>
              <Textarea
                value={formData.resume}
                onChange={(e) =>
                  setFormData({ ...formData, resume: e.target.value })
                }
                placeholder="Paste your resume link (Google Drive, LinkedIn) or key highlights..."
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
                data-testid="textarea-dao-resume"
              />
            </div>

            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full py-6 text-base font-semibold rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, #7c3aed 0%, #3b82f6 50%, #06b6d4 100%)",
              }}
              data-testid="button-submit-dao-application"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ✅ Video Dialog (FIXED POSITION) */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
       <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-[#0d0b2e] border-purple-500/20 text-white">
          <DialogHeader>
            <DialogTitle>Project Overview</DialogTitle>
          </DialogHeader>

         <div className="w-full aspect-video">
			  <iframe
				className="w-full h-full rounded-lg"
				src="https://www.youtube.com/embed/Y1vDgtMz7cg"
				title="DAO Video"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowFullScreen
			  />
			</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
