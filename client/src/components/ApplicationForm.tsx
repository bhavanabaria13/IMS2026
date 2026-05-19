import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { X, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const applicationSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number is too long"),
  workExperience: z
    .string()
    .max(1000, "Work experience description is too long")
    .optional(),
  education: z
    .string()
    .min(2, "Please enter your education details")
    .max(200, "Education details are too long"),
  city: z
    .string()
    .min(2, "Please enter your country")
    .max(50, "country name is too long"),
  github: z
    .string()
    .url("Please enter a valid GitHub URL (e.g., https://github.com/username)")
    .optional()
    .or(z.literal("")),
  linkedin: z
    .string()
    .url(
      "Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)",
    )
    .optional()
    .or(z.literal("")),
  skills: z.string().min(2, "Please enter your skills"),
  projects: z.string().max(2000, "Projects description is too long").optional(),
  qualificationPath: z.enum(["course_first", "entrance_test"], {
    required_error:
      "Please select how you would like to qualify for the internship",
  }),
  //categoryId: z.string().min(1, "Please select a training category").optional().or(z.literal("")),
  categoryId: z.string().min(1, "Please select a training category"),
  subcategoryId: z.string().optional().or(z.literal("")),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface ApplicationFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ApplicationForm({
  open,
  onClose,
  onSuccess,
}: ApplicationFormProps) {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: subcategories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories", selectedCategoryId, "subcategories"],
    queryFn: async () => {
      if (!selectedCategoryId) return [];
      const res = await fetch(
        `/api/categories/${selectedCategoryId}/subcategories`,
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedCategoryId,
  });

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      workExperience: "",
      education: "",
      city: "",
      github: "",
      linkedin: "",
      skills: "",
      projects: "",
      qualificationPath: undefined as any,
      categoryId: "",
      subcategoryId: "",
    },
  });

  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFile(file);
    }
  };

  const onSubmit = async (data: ApplicationFormData) => {
    // Validate CV file
    if (!cvFile) {
      toast({
        title: "CV Required",
        description:
          "Please upload your CV/Resume to continue with your application.",
        variant: "destructive",
      });
      return;
    }

    // Validate CV file size (5MB)
    if (cvFile.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description:
          "CV file size must be less than 5MB. Please upload a smaller file.",
        variant: "destructive",
      });
      return;
    }

    // Validate CV file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(cvFile.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, DOC, or DOCX file for your CV.",
        variant: "destructive",
      });
      return;
    }

    // Validate skills
   

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      formData.append("education", data.education);
      formData.append("city", data.city);
      formData.append("skills", data.skills);
      formData.append("qualificationPath", data.qualificationPath);

      if (data.workExperience)
        formData.append("workExperience", data.workExperience);
      if (data.github) formData.append("github", data.github);
      if (data.linkedin) formData.append("linkedin", data.linkedin);
      if (data.projects) formData.append("projects", data.projects);
      if (data.categoryId) formData.append("categoryId", data.categoryId);
      if (data.subcategoryId)
        formData.append("subcategoryId", data.subcategoryId);
      if (cvFile) formData.append("cv", cvFile);

      const response = await fetch("/api/interns", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch (e) {
          error = { message: "Server error occurred. Please try again later." };
        }

        // Handle specific error cases with user-friendly messages
        if (response.status === 400) {
          if (
            error.message?.toLowerCase().includes("email") &&
            error.message?.toLowerCase().includes("exists")
          ) {
            toast({
              title: "Email Already Used",
              description:
                "An application with this email already exists. Please use a different email address.",
              variant: "destructive",
            });
          } else if (error.message?.toLowerCase().includes("validation")) {
            toast({
              title: "Form Validation Failed",
              description:
                error.message ||
                "Please check all fields and ensure they are filled correctly.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Application Error",
              description:
                error.message ||
                "There was an issue with your application. Please check your information and try again.",
              variant: "destructive",
            });
          }
        } else if (response.status === 413) {
          toast({
            title: "File Size Too Large",
            description:
              "Your CV file exceeds the 5MB limit. Please upload a smaller file.",
            variant: "destructive",
          });
        } else if (response.status === 500) {
          toast({
            title: "Server Error",
            description:
              "We're experiencing technical difficulties. Please try again in a few moments.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Submission Failed",
            description:
              error.message ||
              "Unable to submit your application. Please try again.",
            variant: "destructive",
          });
        }

        return;
      }

      setIsSuccess(true);
      onSuccess?.();

      toast({
        title: "Application Submitted Successfully!",
        description:
          "We've received your application and will review it shortly.",
      });
    } catch (error) {
      console.error("Application submission error:", error);
      if (!(error instanceof Error)) {
        toast({
          title: "Submission Failed",
          description: "Unable to submit your application. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    form.reset();
    setCvFile(null);
    setSelectedCategoryId("");
    onClose();
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="
      w-[92%]
      sm:w-full
      max-w-sm
      sm:max-w-md
      md:max-w-lg
      mx-auto
      rounded-xl
      p-4 sm:p-6
      max-h-[90vh]
      overflow-y-auto
    "
        >
          <div className="text-center py-4 sm:py-6">
            {/* ICON */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </div>

            {/* TITLE */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              Thank You!
            </h2>

            {/* SUCCESS TEXT */}
            <h2 className="text-2xl font-semibold text-green-700 mb-3">
              🎉 Application Submitted Successfully!
            </h2>

            <p className="text-gray-600 mb-5">
              Thank you for applying to the internship program. Your application
              has been received.
            </p>

            <div
              className="bg-white border rounded-lg p-4 mb-5 text-left"
              style={{ color: "#000" }}
            >
              <p className="font-semibold mb-2">🔐 Login to the Intern Panel</p>
              <p>
                <strong>User Email:</strong> The email ID you used during
                registration
              </p>
              <p>
                <strong>Password:</strong> 123456
              </p>
            </div>

            <p className="mb-4 text-gray-600">
              Please log in to the Intern Panel to access further instructions
              and updates.
            </p>

            {/* DISCORD BUTTON */}
            <a
              href="https://discord.gg/RQWRmpQeUW"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-blue-600 text-white text-sm sm:text-base px-4 py-2.5 rounded-lg hover:bg-blue-700 transition"
            >
              👥 Join Discord Group
            </a>

            {/* FOOTER TEXT */}
            <p className="text-xs sm:text-sm text-gray-500 mt-4">
              Facing login issues? Contact support team.
            </p>

            {/* RETURN BUTTON */}
            <Button
              onClick={handleClose}
              className="w-full mt-3 text-sm sm:text-base py-2.5 bg-gradient-to-r from-purple-500 to-blue-600"
            >
              Return Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle
            className="text-2xl font-bold"
            style={{ fontFamily: "Space Grotesk, sans-serif" }}
          >
            Internship Application
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1 234 567 8900"
                        {...field}
                        data-testid="input-phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <FormControl>
                      <Input
                        
                        {...field}
                        data-testid="input-city"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="education"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Education *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="B.S. Computer Science, MIT (2024)"
                      {...field}
                      data-testid="input-education"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Category *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCategoryId(value);
                        form.setValue("subcategoryId", "");
                      }}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories
                          .filter((c: any) => c.isActive !== false)
                          .map((cat: any) => (
                            <SelectItem
                              key={cat.id}
                              value={cat.id}
                              data-testid={`option-category-${cat.id}`}
                            >
                              {cat.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subcategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      disabled={
                        !selectedCategoryId || subcategories.length === 0
                      }
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-subcategory">
                          <SelectValue
                            placeholder={
                              selectedCategoryId
                                ? "Select a subcategory"
                                : "Select category first"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subcategories
                          .filter((s: any) => s.isActive !== false)
                          .map((sub: any) => (
                            <SelectItem
                              key={sub.id}
                              value={sub.id}
                              data-testid={`option-subcategory-${sub.id}`}
                            >
                              {sub.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="qualificationPath"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>
                    How would you like to qualify for the internship? *
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                      className="flex flex-col space-y-3"
                      data-testid="radio-qualification-path"
                    >
                      <label className="flex items-center space-x-3 rounded-lg border border-border p-4 cursor-pointer hover:border-purple-500/50 transition-colors has-[data-state=checked]:border-purple-500 has-[data-state=checked]:bg-purple-500/5">
                        <RadioGroupItem
                          value="course_first"
                          data-testid="radio-course-first"
                        />
                        <span className="text-sm font-medium leading-snug">
                          Complete the Course Program first, then join the
                          Internship
                        </span>
                      </label>
                      <label className="flex items-center space-x-3 rounded-lg border border-border p-4 cursor-pointer hover:border-purple-500/50 transition-colors has-[data-state=checked]:border-purple-500 has-[data-state=checked]:bg-purple-500/5">
                        <RadioGroupItem
                          value="entrance_test"
                          data-testid="radio-entrance-test"
                        />
                        <span className="text-sm font-medium leading-snug">
                          Pass the Entrance Test, then join the Internship
                        </span>
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Experience</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Briefly describe your relevant work experience..."
                      className="min-h-[80px]"
                      {...field}
                      data-testid="input-work-experience"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="github"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Profile</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://github.com/username"
                        {...field}
                        data-testid="input-github"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://linkedin.com/in/username"
                        {...field}
                        data-testid="input-linkedin"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

           <FormField
  control={form.control}
  name="skills"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Skills *</FormLabel>
      <FormControl>
        <Input
          placeholder="e.g. HTML, CSS, JavaScript, React"
          {...field}
          data-testid="input-skills"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
            <FormField
              control={form.control}
              name="projects"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notable Projects</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your notable projects, especially blockchain-related ones..."
                      className="min-h-[80px]"
                      {...field}
                      data-testid="input-projects"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label>CV / Resume *</Label>
              <div
                className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  cvFile
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : "border-border hover:border-purple-500"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="cv-upload"
                  data-testid="input-cv"
                />
                <label htmlFor="cv-upload" className="cursor-pointer">
                  {cvFile ? (
                    <div className="flex items-center justify-center gap-2 text-foreground">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium">{cvFile.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({(cvFile.size / 1024).toFixed(0)} KB)
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setCvFile(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <span className="font-medium">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-sm">PDF, DOC, DOCX (Max 5MB)</span>
                      <span className="text-xs text-red-500 mt-1">
                        * Required field
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
              disabled={isSubmitting || !cvFile }
              data-testid="button-submit-application"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Application...
                </>
              ) : !cvFile ? (
                "Upload CV to Continue"
              ) : (
                "Submit Application"
              )}
            </Button>
            {!cvFile && (
              <p className="text-sm text-red-500 text-center -mt-2">
                Please upload your CV/Resume to submit your application
              </p>
            )}
            
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
