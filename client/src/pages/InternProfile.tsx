import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import InternProfile from "@/components/intern/InternProfile";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function InternProfilePage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: profile, isLoading, error } = useQuery<any>({
    queryKey: ["/api/intern/profile"],
    retry: false,
    refetchOnMount: true,
    queryFn: async () => {
      const response = await fetch("/api/intern/profile", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (error) {
      const errorMessage = (error as any).message || "";
      console.error("Profile page error:", errorMessage, error);

      if (errorMessage.includes("Unauthorized") || errorMessage.includes("401") || errorMessage.includes("Profile not found")) {
        toast({
          title: "Authentication required",
          description: "Please login to view your profile",
          variant: "destructive"
        });
        setLocation("/intern/login");
      }
    }
  }, [error, setLocation, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load profile</p>
          <Button onClick={() => setLocation("/intern/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/intern/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <InternProfile />
      </main>
    </div>
  );
}