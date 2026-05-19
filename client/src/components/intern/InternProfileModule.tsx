import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Camera,
  Save,
  Loader2,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

export default function InternProfile() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  /* ===========================
     ALL HOOKS AT TOP (FIXED)
  ============================ */

  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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
        profileImage:"",
  });

  /* ===========================
     FETCH PROFILE
  ============================ */

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/intern/profile"],
    retry: true,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await fetch("/api/intern/profile", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId) return null;
    const cat = categories.find((c: any) => c.id === categoryId);
    return cat?.name || null;
  };

  /* ===========================
     AUTH ERROR HANDLING
  ============================ */

  useEffect(() => {
    if (error) {
      toast({
        title: "Session expired",
        description: "Please login again",
        variant: "destructive",
      });
      setLocation("/intern/login");
    }
  }, [error, toast, setLocation]);

  /* ===========================
     SET FORM DATA
  ============================ */

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
      profileImage: profile.profileImage || "",
    });

console.log("PROFILE IMAGE:", profile.profileImage);
    setProfileImage(profile.profileImage || null);
  }
}, [profile]);

  /* ==console.log("PROFILE IMAGE:", profile.profileImage);=========================
     UPDATE PROFILE
  ============================ */

  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/intern/profile", {
        method: "PUT",
        body: data,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/intern/profile"],
      });
      toast({ title: "✅ Profile updated" });
      setIsEditing(false);
      setImageFile(null);
    },
    onError: () => {
      toast({
        title: "Update failed",
        variant: "destructive",
      });
    },
  });

  /* ===========================
     PASSWORD RESET
  ============================ */

  const passwordResetMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const res = await fetch("/api/intern/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password updated successfully" });
      setShowPasswordReset(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handlePasswordReset = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    passwordResetMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  /* ===========================
     IMAGE UPLOAD
  ============================ */

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Image must be under 2MB",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setProfileImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append("profileImage", imageFile);
    updateProfileMutation.mutate(fd);
  };

  /* ===========================
     CONDITIONAL RENDER
  ============================ */

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const initials = formData.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /* ===========================
     JSX
  ============================ */

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* PROFILE CARD */}
      <Card>
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
  <AvatarImage
    src={
      profileImage
        ? profileImage.startsWith("http")
          ? profileImage
          : `http://127.0.0.1:5000${profileImage}`
        : undefined
    }
  />
  <AvatarFallback className="text-2xl">
    {initials}
  </AvatarFallback>
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
                {(getCategoryName(profile?.categoryId) || profile?.daoPosition) && (
                  <Badge variant="outline" className="mt-2">
                    {getCategoryName(profile?.categoryId) || profile?.daoPosition}
                  </Badge>
                )}
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
                  <Label>Category</Label>
                  <Input
                    value={getCategoryName(profile?.categoryId) || profile?.daoPosition || "Not Assigned"}
                    disabled
                    className="bg-muted"
                    data-testid="text-intern-category"
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
                        profileImage: profile.profileImage || "",
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
      </Card>

      {/* SECURITY */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setShowPasswordReset(true)}
          >
            <Lock className="mr-2 h-4 w-4" />
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* PASSWORD DIALOG */}
      <Dialog
        open={showPasswordReset}
        onOpenChange={setShowPasswordReset}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Input
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Current Password"
              className="pr-10"
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="button-toggle-current-password"
              aria-label={showCurrentPassword ? "Hide password" : "Show password"}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              type={showNewPassword ? "text" : "password"}
              placeholder="New Password"
              className="pr-10"
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="button-toggle-new-password"
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="pr-10"
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="button-toggle-confirm-password"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordReset(false)}
            >
              Cancel
            </Button>
            <Button onClick={handlePasswordReset}>
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
