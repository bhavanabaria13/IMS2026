import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ExternalLink,
  Check,
  Trophy,
  Loader2,
} from "lucide-react";
import { SiX, SiTelegram, SiYoutube, SiGithub, SiFacebook } from "react-icons/si";

interface SocialFollow {
  id: string;
  internId: string;
  platform: string;
  followedAt: string;
}

const SOCIAL_LINKS = [
  {
    platform: "twitter",
    label: "Twitter/X",
    icon: SiX,
    color: "#000000",
    bgColor: "rgba(0,0,0,0.8)",
    badgeColor: "#1d9bf0",
    title: "Follow @Ether_Authority on Twitter/X",
    description: "Follow the official EtherAuthority Twitter/X account to stay updated on the latest news and announcements.",
    url: "https://x.com/Ether_Authority",
    buttonText: "Yes, I Have Followed",
  },
  {
    platform: "telegram",
    label: "Telegram",
    icon: SiTelegram,
    color: "#26A5E4",
    bgColor: "rgba(38,165,228,0.1)",
    badgeColor: "#26A5E4",
    title: "Join the EtherAuthority Telegram Group",
    description: "Join the official EtherAuthority Telegram community group to connect with other members.",
    url: "https://t.me/EtherAuthority",
    buttonText: "Yes, I Have Joined",
  },
  {
    platform: "youtube",
    label: "YouTube",
    icon: SiYoutube,
    color: "#FF0000",
    bgColor: "rgba(255,0,0,0.1)",
    badgeColor: "#FF0000",
    title: "Subscribe to EtherAuthority on YouTube",
    description: "Subscribe to the official EtherAuthority YouTube channel for tutorials, demos, and blockchain content.",
    url: "https://www.youtube.com/channel/UCOW2MNIhdrUsE_etsh9UpIQ",
    buttonText: "Yes, I Have Subscribed",
  },
  {
    platform: "github",
    label: "GitHub",
    icon: SiGithub,
    color: "#ffffff",
    bgColor: "rgba(255,255,255,0.08)",
    badgeColor: "#6e40c9",
    title: "Follow EtherAuthority on GitHub",
    description: "Follow the official EtherAuthority GitHub organization to explore open-source blockchain projects.",
    url: "https://github.com/EtherAuthority",
    buttonText: "Yes, I Have Followed",
  },
  {
    platform: "facebook",
    label: "Facebook",
    icon: SiFacebook,
    color: "#1877F2",
    bgColor: "rgba(24,119,242,0.1)",
    badgeColor: "#1877F2",
    title: "Like the EtherAuthority Facebook Page",
    description: "Like and follow the official EtherAuthority Facebook page to support the community.",
    url: "https://www.facebook.com/EtherAuthority",
    buttonText: "Yes, I Have Liked",
  },
];

export default function InternSocialModule() {
  const { toast } = useToast();
  const [confirmingPlatform, setConfirmingPlatform] = useState<string | null>(null);

  const { data: follows = [], isLoading } = useQuery<SocialFollow[]>({
    queryKey: ["/api/intern/social-follows"],
  });

  const followMutation = useMutation({
    mutationFn: async (platform: string) => {
      const res = await apiRequest("/api/intern/social-follows", {
        method: "POST",
        body: JSON.stringify({ platform }),
        headers: { "Content-Type": "application/json" },
      });
      return res.json();
    },
    onSuccess: (_data, platform) => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/social-follows"] });
      setConfirmingPlatform(null);
      const link = SOCIAL_LINKS.find((l) => l.platform === platform);
      toast({
        title: "Confirmed!",
        description: `You've confirmed following EtherAuthority on ${link?.label || platform}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to confirm follow. Please try again.",
        variant: "destructive",
      });
    },
  });

  const followedPlatforms = new Set(follows.map((f) => f.platform));
  const completedCount = followedPlatforms.size;
  const totalCount = SOCIAL_LINKS.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleConfirmFollow = (platform: string) => {
    setConfirmingPlatform(platform);
    followMutation.mutate(platform);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-border/50 bg-card/80 backdrop-blur" data-testid="social-progress-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold text-foreground">Your Progress</span>
            </div>
            <span className="text-sm font-bold text-foreground" data-testid="text-social-progress">
              {completedCount} / {totalCount} tasks completed
            </span>
          </div>
          <Progress value={progressPercent} className="h-2.5 mb-3" />
          <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-2.5 text-center">
            <p className="text-sm text-muted-foreground">
              {completedCount === totalCount
                ? "All social tasks completed — great job!"
                : "Follow EtherAuthority on all platforms to complete your social tasks!"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {SOCIAL_LINKS.map((link) => {
          const isFollowed = followedPlatforms.has(link.platform);
          const Icon = link.icon;
          const isConfirming = confirmingPlatform === link.platform && followMutation.isPending;

          return (
            <Card
              key={link.platform}
              className={`border-border/50 transition-all duration-200 ${isFollowed ? "opacity-75" : ""}`}
              data-testid={`social-card-${link.platform}`}
            >
              <CardContent className="p-0">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: link.bgColor, border: `1px solid ${link.badgeColor}30` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: link.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                          style={{ background: `${link.badgeColor}20`, color: link.badgeColor }}
                        >
                          {link.label}
                        </span>
                      </div>

                      <h3 className="font-semibold text-foreground mb-1" data-testid={`text-social-title-${link.platform}`}>
                        {link.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-4 flex items-center justify-between">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                    style={{ color: link.badgeColor }}
                    data-testid={`link-social-${link.platform}`}
                  >
                    Go to {link.label} <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {isFollowed ? (
                    <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium" data-testid={`badge-followed-${link.platform}`}>
                      <Check className="w-4 h-4" />
                      Completed
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-full px-5 text-white"
                      style={{ background: `linear-gradient(135deg, ${link.badgeColor}, ${link.badgeColor}cc)` }}
                      onClick={() => handleConfirmFollow(link.platform)}
                      disabled={isConfirming}
                      data-testid={`button-follow-${link.platform}`}
                    >
                      {isConfirming ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      ) : (
                        <Check className="w-4 h-4 mr-1.5" />
                      )}
                      {link.buttonText}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
