import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { User, Mail, Phone, MapPin, Github, Linkedin, Camera, Save, Loader2 } from "lucide-react";

export default function InternProfile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: profile, isLoading, error, refetch } = useQuery<any>({
    queryKey: ["/api/intern/profile"],
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
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
      console.error("Profile fetch error:", errorMessage);
      
      if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
        toast({
          title: "Session expired",
          description: "Please login again",
          variant: "destructive"
        });
        setLocation("/intern/login");
      }
    }
  }, [error, setLocation, toast]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    education: "",
    workExperience: "",
    skills: "",
    projects: "",
    github: "",
    linkedin: "",
  });

  // Update form when profile data changes
  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        city: profile.city || "",
        education: profile.education || "",
        workExperience: profile.workExperience || "",
        skills: profile.skills || "",
        projects: profile.projects || "",
        github: profile.github || "",
        linkedin: profile.linkedin || "",
      });
      if (profile.profileImage) {
        setProfileImage(profile.profileImage);
      }
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/api/intern/profile", {
        method: "PUT",
        body: data,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/intern/profile"] });
      toast({ title: "✅ Profile updated successfully" });
      setIsEditing(false);
      setImageFile(null);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update profile", 
        variant: "destructive" 
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ 
          title: "Error", 
          description: "Image size must be less than 2MB", 
          variant: "destructive" 
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });
    
    if (imageFile) {
      formDataToSend.append("profileImage", imageFile);
    }
    
    updateProfileMutation.mutate(formDataToSend);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load profile</p>
          <Button onClick={() => setLocation("/intern/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">No profile data available</div>
      </div>
    );
  }

  const initials = formData.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>My Profile</span>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                <User className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profileImage || undefined} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold">{formData.name}</h3>
                <p className="text-sm text-muted-foreground">{formData.email}</p>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Country</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                  />
                </div>
              </div>
            </div>

            {/* Education & Experience */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Education & Experience</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="workExperience">Work Experience</Label>
                  <Textarea
                    id="workExperience"
                    value={formData.workExperience}
                    onChange={(e) => setFormData({ ...formData, workExperience: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Skills & Projects */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Skills & Projects</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="skills">Skills</Label>
                  <Textarea
                    id="skills"
                    value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                    placeholder="e.g., JavaScript, React, Node.js"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="projects">Projects</Label>
                  <Textarea
                    id="projects"
                    value={formData.projects}
                    onChange={(e) => setFormData({ ...formData, projects: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Social Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="github">GitHub</Label>
                  <Input
                    id="github"
                    value={formData.github}
                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setImageFile(null);
                    if (profile) {
                      setFormData({
                        name: profile.name || "",
                        email: profile.email || "",
                        phone: profile.phone || "",
                        city: profile.city || "",
                        education: profile.education || "",
                        workExperience: profile.workExperience || "",
                        skills: profile.skills || "",
                        projects: profile.projects || "",
                        github: profile.github || "",
                        linkedin: profile.linkedin || "",
                      });
                      setProfileImage(profile.profileImage || null);
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
