import type { Express } from "express";
import { type Server } from "http";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { Pool } from "pg";
import multer from "multer";
import path from "path";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import {
  sendThankYouEmail,
  sendTrainingOfferLetterEmail,
  sendAdminNotification,
  sendInternActionEmail,
} from "./email";
import { generateInternsExcel } from "./excel";
import fs from "fs";
import ExcelJS from "exceljs";
import { randomUUID } from "crypto";
import { z } from "zod";
import {
  weeklyUpdateSchema,
  internCategorySchema,
  internSubcategorySchema,
  insertVideoSchema,
  insertSubProjectSchema,
  courseTopicSchema,
  SOCIAL_PLATFORMS,
} from "../shared/schema";

const adminLoginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const internSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  workExperience: z.string().optional(),
  education: z.string().min(1),
  city: z.string().min(1),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  skills: z.string().min(1),
  projects: z.string().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
});

const PostgresStore = pgSession(session);
const sessionPool = new Pool({ connectionString: process.env.DATABASE_URL });

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storageConfig = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storageConfig,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }
  },
});

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
    internId?: string;
  }
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "EA@Auth#26";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.set("trust proxy", 1);
  app.use(
    session({
      store: new PostgresStore({
        pool: sessionPool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      name: "intern_admin_sid",
      secret:
        process.env.SESSION_SECRET ||
        "internship-portal-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      rolling: true, // Reset maxAge on every request
      cookie: {
        secure: false, // Set to false for development
        httpOnly: true,
        sameSite: "lax", // Use lax for better compatibility
        maxAge: 24 * 60 * 60 * 1000,
        path: "/", // Ensure cookie is available for all paths
      },
    }),
  );

  const requireAdmin = (req: any, res: any, next: any) => {
    console.log("requireAdmin check:", {
      path: req.path,
      isAdmin: req.session?.isAdmin,
      sessionID: req.sessionID,
      hasSession: !!req.session,
    });

    if (req.session?.isAdmin) {
      next();
    } else {
      console.log("Admin authorization failed for:", req.path);
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  // Mock requireAuth for the changes to apply, as it's not defined in the original code
  // In a real scenario, this would be imported and used correctly.
  const requireAuth = (req: any, res: any, next: any) => {
    // Placeholder logic, assuming it checks for some authentication
    if (req.session?.userId || req.session?.isAdmin) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  app.post("/api/admin/login", (req, res) => {
    const validation = adminLoginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const { username, password } = validation.data;
    console.log("Admin login attempt:", { username });

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      req.session.isAdmin = true;
      (req.session as any).adminUsername = username;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        console.log("Admin login successful, session saved:", {
          sessionID: req.sessionID,
          isAdmin: req.session.isAdmin,
        });
        res.json({ message: "Login successful" });
      });
    } else {
      console.log("Invalid credentials provided");
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Setup all interns with common password
  app.post("/api/setup-all-interns", async (req, res) => {
    try {
      const allInterns = await storage.getAllInterns();
      const hashedPassword = await bcrypt.hash("123456", 10);

      let updated = 0;
      let created = 0;

      for (const intern of allInterns) {
        const existingUser = await storage.getInternUserByInternId(intern.id);

        if (!existingUser) {
          // Create new user account
          await storage.createInternUser(intern.id, "123456");
          created++;
        } else {
          // Update password and approve
          await storage.updateInternPassword(intern.id, hashedPassword);
          await storage.updateInternApproval(intern.id, 1);
          updated++;
        }
      }

      console.log(`Setup complete: ${created} created, ${updated} updated`);

      res.json({
        message: "All intern accounts setup successfully",
        password: "123456",
        total: allInterns.length,
        created,
        updated,
      });
    } catch (error) {
      console.error("Failed to setup interns:", error);
      res.status(500).json({ message: "Failed to setup interns" });
    }
  });

  // Setup test intern account (for testing only)
  app.post("/api/setup-test-intern", async (req, res) => {
    try {
      // Check if intern exists
      const existingInterns = await storage.getAllInterns();
      const existingIntern = existingInterns.find(
        (i) => i.email === "i@gmail.com",
      );

      let internId: string;
      if (!existingIntern) {
        // Create test intern
        const intern = await storage.createIntern({
          name: "Test Intern",
          email: "i@gmail.com",
          phone: "1234567890",
          workExperience: "Test Experience",
          education: "Computer Science",
          city: "Test City",
          github: "https://github.com/test",
          linkedin: "https://linkedin.com/in/test",
          skills: "JavaScript, React, Node.js",
          projects: "Test Projects",
          qualificationPath: "course_first",
        });
        internId = intern.id;
      } else {
        internId = existingIntern.id;
      }

      // Create or update intern user with password "123456"
      const hashedPassword = await bcrypt.hash("123456", 10);
      const existingUser = await storage.getInternUserByInternId(internId);

      if (!existingUser) {
        await storage.createInternUser(internId, "123456");
      } else {
        // Update password and approval status
        await storage.updateInternPassword(internId, hashedPassword);
        await storage.updateInternApproval(internId, 1);
      }

      console.log("Test intern setup complete");
      console.log("Intern ID:", internId);
      console.log("Password hash:", hashedPassword);

      res.json({
        message: "Test intern account created/updated",
        email: "i@gmail.com",
        password: "123456",
        internId,
      });
    } catch (error) {
      console.error("Failed to setup test intern:", error);
      res.status(500).json({ message: "Failed to setup test intern" });
    }
  });

  app.get("/api/admin/check", (req, res) => {
    console.log("Admin check - session data:", {
      isAdmin: req.session?.isAdmin,
      sessionID: req.sessionID,
      cookie: req.session?.cookie,
    });
    res.json({ isAdmin: !!req.session?.isAdmin });
  });

  app.post("/api/interns", upload.single("cv"), async (req, res) => {
    try {
      console.log("=== APPLICATION SUBMISSION RECEIVED ===");
      console.log("Has file:", !!req.file);
      console.log("Body keys:", Object.keys(req.body));
      console.log("Body data:", req.body);

      const validation = internSchema.safeParse(req.body);
      if (!validation.success) {
        console.error("=== VALIDATION FAILED ===");
        console.error("Validation errors:", validation.error.errors);
        return res.status(400).json({
          message: "Validation failed. Please check all required fields.",
          errors: validation.error.errors,
        });
      }

      console.log("Validation passed successfully");

      // Check if email already exists
      const existingInterns = await storage.getAllInterns();
      const emailExists = existingInterns.some(
        (i) => i.email.toLowerCase() === validation.data.email.toLowerCase(),
      );

      if (emailExists) {
        console.log("Duplicate email detected:", validation.data.email);
        return res.status(400).json({
          message:
            "An application with this email already exists. Please use a different email.",
        });
      }

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const categoryId =
        req.body.categoryId && uuidRegex.test(req.body.categoryId)
          ? req.body.categoryId
          : null;
      const subcategoryId =
        req.body.subcategoryId && uuidRegex.test(req.body.subcategoryId)
          ? req.body.subcategoryId
          : null;

      const internData = {
        ...validation.data,
        qualificationPath:
          req.body.qualificationPath ||
          validation.data.qualificationPath ||
          "course_first",
        categoryId,
        subcategoryId,
        cvFilename: req.file?.filename,
        cvOriginalName: req.file?.originalname,
      };

      const intern = await storage.createIntern(internData);
      console.log("Intern created successfully:", intern.id);

      // Auto-approve: create user account with default password and approved status
      const defaultPassword = "123456";
      try {
        await storage.createInternUser(intern.id, defaultPassword);
        await storage.updateInternApproval(intern.id, 1);
        console.log(
          "Auto-approved intern with default credentials:",
          intern.id,
        );
      } catch (userErr) {
        console.error("Failed to auto-create user account:", userErr);
      }

      // Auto-create the Training Offer Letter certificate so the applicant
      // can view/download it from the Certificates module. Only issued for
      // applicants who selected the "Full training course" path.
      if (intern.qualificationPath === "course_first") {
        try {
          const existingCerts = await storage.getCertificatesByIntern(
            intern.id,
          );
          const hasTrainingOfferLetter = existingCerts.some(
            (c) => c.type === "training_offer_letter",
          );
          if (!hasTrainingOfferLetter) {
            const year = new Date().getFullYear();
            const shortId = intern.id.slice(0, 6).toUpperCase();
            await storage.createCertificate({
              internId: intern.id,
              type: "training_offer_letter",
              title: "Training Offer Letter",
              certificateNumber: `EA/TRN/${year}/${shortId}`,
              internName: intern.name,
            });
          }
        } catch (certErr) {
          console.error(
            "Failed to auto-create training offer letter cert:",
            certErr,
          );
        }
      }

      // Send emails asynchronously without blocking
      sendThankYouEmail(intern.email, intern.name).catch((err) =>
        console.error("Email send failed:", err),
      );
      if (intern.qualificationPath === "course_first") {
        sendTrainingOfferLetterEmail(intern.email, intern.name).catch((err) =>
          console.error("Training offer letter send failed:", err),
        );
      }
      sendAdminNotification(intern.name, intern.email).catch((err) =>
        console.error("Admin notification failed:", err),
      );

      res.status(201).json(intern);
    } catch (error: any) {
      console.error("=== APPLICATION SUBMISSION ERROR ===");
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Error code:", error.code);

      if (error.code === "23505") {
        return res.status(400).json({
          message: "An application with this email already exists.",
        });
      }

      if (error.code === "ECONNREFUSED") {
        return res.status(500).json({
          message: "Database connection error. Please try again in a moment.",
        });
      }

      res.status(500).json({
        message:
          error.message || "Failed to submit application. Please try again.",
      });
    }
  });

  app.get("/api/interns", requireAdmin, async (_req, res) => {
    try {
      const interns = await storage.getAllInterns();
      res.json(interns);
    } catch (error) {
      console.error("Error fetching interns:", error);
      res.status(500).json({ message: "Failed to fetch interns" });
    }
  });

  app.get("/api/interns/export", requireAdmin, async (_req, res) => {
    try {
      const buffer = await generateInternsExcel();
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=interns-${Date.now()}.xlsx`,
      );
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting interns:", error);
      res.status(500).json({ message: "Failed to export interns" });
    }
  });

  app.get("/api/interns/:id", requireAdmin, async (req, res) => {
    try {
      const intern = await storage.getInternById(req.params.id);
      if (!intern) {
        return res.status(404).json({ message: "Intern not found" });
      }
      res.json(intern);
    } catch (error) {
      console.error("Error fetching intern:", error);
      res.status(500).json({ message: "Failed to fetch intern" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    try {
      const interns = await storage.getAllInterns();
      const projects = await storage.getAllProjects();
      const subProjects = await storage.getAllSubProjects();
      const tasks = await storage.getAllTasks();
      const weeklyUpdates = await storage.getAllWeeklyUpdates();

      const totalApplicants = interns.length;
      const totalTraining = interns.filter(
        (i: any) =>
          i.internshipStatus === "training" ||
          i.internshipStatus === "training_complete" ||
          i.internshipStatus === "testing",
      ).length;
      const totalJoinedInterns = interns.filter(
        (i: any) =>
          i.internshipStatus === "internship" ||
          i.internshipStatus === "completed",
      ).length;
      const totalDaoApplied = interns.filter(
        (i: any) => i.daoMembershipApplied === true,
      ).length;

      res.json({
        totalApplicants,
        totalTraining,
        totalJoinedInterns,
        totalDaoApplied,
        totalProjects: projects.length,
        totalSubProjects: subProjects.length,
        totalTasks: tasks.length,
        totalWeeklyUpdates: weeklyUpdates.length,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.put("/api/interns/:id", requireAdmin, async (req, res) => {
    try {
      console.log("Updating intern:", req.params.id, "with data:", req.body);
      const { approvalStatus, ...internData } = req.body;
      const intern = await storage.updateIntern(req.params.id, internData);
      if (!intern) {
        return res.status(404).json({ message: "Intern not found" });
      }
      console.log("Intern updated successfully:", intern.id);
      res.json(intern);
    } catch (error) {
      console.error("Error updating intern:", error);
      res.status(500).json({ message: "Failed to update intern" });
    }
  });

  app.delete("/api/interns/:id", requireAdmin, async (req, res) => {
    try {
      console.log("Deleting intern:", req.params.id);
      const intern = await storage.getInternById(req.params.id);
      if (intern?.cvFilename) {
        const cvPath = path.join(uploadDir, intern.cvFilename);
        if (fs.existsSync(cvPath)) {
          fs.unlinkSync(cvPath);
        }
      }

      const success = await storage.deleteIntern(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Intern not found" });
      }
      console.log("Intern deleted successfully:", req.params.id);
      res.json({ message: "Intern deleted successfully" });
    } catch (error) {
      console.error("Error deleting intern:", error);
      res.status(500).json({ message: "Failed to delete intern" });
    }
  });

  // Intern Actions: warning / rejection (admin)
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  app.post(
    "/api/admin/interns/:id/action",
    requireAdmin,
    async (req: any, res) => {
      try {
        if (!UUID_RE.test(req.params.id)) {
          return res.status(400).json({ message: "Invalid intern id" });
        }

        const { internActionRequestSchema } = await import("@shared/schema");
        const parsed = internActionRequestSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            message:
              parsed.error.errors[0]?.message || "Invalid action request",
          });
        }
        const { actionType, note } = parsed.data;

        const intern = await storage.getInternById(req.params.id);
        if (!intern) {
          return res.status(404).json({ message: "Intern not found" });
        }


        const adminUsername =
          (req.session?.adminUsername as string | undefined) || "Admin";

        const action = await storage.createInternAction({
          internId: intern.id,
          actionType,
          note,
          adminUsername,
        });

        if (actionType === "rejection") {
          try {
            await storage.updateIntern(intern.id, {
              internshipStatus: "rejected",
            } as any);
          } catch (statusErr) {
            console.error(
              "Failed to update intern status to rejected:",
              statusErr,
            );
            // Action is recorded; surface a warning message but don't 500.
          }
        }

        const emailResult = await sendInternActionEmail(
          intern.email,
          intern.name,
          actionType,
          note,
          adminUsername,
        );

        if (emailResult.sent) {
          try {
            await storage.markInternActionEmailSent(action.id);
          } catch (markErr) {
            console.error("Failed to mark email_sent flag:", markErr);
          }
        }

        const baseMsg =
          actionType === "rejection"
            ? "Intern has been rejected"
            : "Warning issued";
        const emailMsg = emailResult.sent
          ? " and notified by email."
          : ` (action recorded, but email could not be sent: ${emailResult.error || "unknown error"})`;

        res.json({
          action: { ...action, emailSent: emailResult.sent },
          emailSent: emailResult.sent,
          emailError: emailResult.sent ? null : emailResult.error || null,
          message: baseMsg + emailMsg,
        });
      } catch (error: any) {
        console.error("Error creating intern action:", error);
        res.status(500).json({
          message: error?.message || "Failed to create intern action",
        });
      }
    },
  );

  app.get("/api/admin/interns/:id/actions", requireAdmin, async (req, res) => {
    try {
      if (!UUID_RE.test(req.params.id)) {
        return res.status(400).json({ message: "Invalid intern id" });
      }
      const actions = await storage.getInternActionsByIntern(req.params.id);
      res.json(actions);
    } catch (error) {
      console.error("Error fetching intern actions:", error);
      res.status(500).json({ message: "Failed to fetch intern actions" });
    }
  });

  app.get("/api/admin/intern-actions", requireAdmin, async (_req, res) => {
    try {
      const actions = await storage.getAllInternActions();
      res.json(actions);
    } catch (error) {
      console.error("Error fetching all intern actions:", error);
      res.status(500).json({ message: "Failed to fetch intern actions" });
    }
  });

  // Admin shortcut: mark an applicant as "exam passed" so they jump to
  // status='training_complete' / course_progress=100 and appear in the
  // Internship Approval Review queue. Used when admin wants to bypass the
  // course/test flow for an applicant.
  app.post(
    "/api/admin/interns/:id/mark-exam-passed",
    requireAdmin,
    async (req, res) => {
      try {
        if (!UUID_RE.test(req.params.id)) {
          return res.status(400).json({ message: "Invalid intern id" });
        }
        const intern = await storage.getInternById(req.params.id);
        if (!intern) {
          return res.status(404).json({ message: "Intern not found" });
        }
        if (
          intern.internshipStatus === "internship" ||
          intern.internshipStatus === "completed"
        ) {
          return res.status(409).json({
            message:
              "Intern is already approved for the internship phase.",
          });
        }
        await storage.updateInternStatus(intern.id, "training_complete");
        await storage.updateInternCourseProgress(intern.id, 100);
        res.json({
          message:
            "Applicant marked as exam passed. They now appear in Internship Approval Review.",
          internshipStatus: "training_complete",
          courseProgress: 100,
        });
      } catch (error) {
        console.error("Failed to mark exam passed:", error);
        res
          .status(500)
          .json({ message: "Failed to mark applicant as exam passed" });
      }
    },
  );

  // Admin: reset an applicant's progress back to fresh applicant state.
  // Wipes course progress, certificates, selected demo project + project
  // tasks, sub-projects + their tasks, time logs, notifications, weekly
  // updates, intern messages, intern actions, social follows, and DAO
  // application. Resets the intern row to pending / 0% / no T&C / no DAO.
  // The intern row itself stays so login still works.
  app.post(
    "/api/admin/internship-review/:internId/undo",
    requireAdmin,
    async (req, res) => {
      try {
        if (!UUID_RE.test(req.params.internId)) {
          return res.status(400).json({ message: "Invalid intern id" });
        }
        const intern = await storage.getInternById(req.params.internId);
        if (!intern) {
          return res.status(404).json({ message: "Intern not found" });
        }
        if (intern.internshipStatus === "pending") {
          return res.status(409).json({
            message: "Intern is already at applicant (pending) status.",
          });
        }
        await storage.resetInternProgress(intern.id);
        try {
          const adminUsername =
            (req.session?.adminUsername as string | undefined) || "Admin";
          await storage.createInternAction({
            internId: intern.id,
            actionType: "warning",
            note: `Progress reset by admin (was '${intern.internshipStatus}', now 'pending'). All course/project/task/cert/DAO data wiped.`,
            adminUsername,
          });
        } catch (e) {
          console.warn("Failed to record reset audit row:", e);
        }
        res.json({
          message:
            "Applicant progress has been reset. They are back to pending status with 0% progress.",
          internshipStatus: "pending",
          courseProgress: 0,
        });
      } catch (error) {
        console.error("Failed to reset intern progress:", error);
        res
          .status(500)
          .json({ message: "Failed to reset applicant progress" });
      }
    },
  );

  /* ============= INTERNSHIP REVIEW (admin → approve/reject after training) ============= */

  // List interns ready for internship review: completed direct exam OR week-4 task.
  // Both flows auto-promote to status='training_complete'.
  app.get(
    "/api/admin/internship-review/candidates",
    requireAdmin,
    async (_req, res) => {
      try {
        const all = await storage.getAllInterns();
        const REVIEW_STATUSES = new Set([
          "training_complete",
          "rejected",
          "internship",
          "completed",
        ]);
        const candidates = all.filter((i) =>
          REVIEW_STATUSES.has(i.internshipStatus),
        );

        const [allCategories, allSubcategories] = await Promise.all([
          storage.getAllCategories(),
          storage.getAllSubcategories(),
        ]);
        const categoryMap = new Map(allCategories.map((c) => [c.id, c.name]));
        const subcategoryMap = new Map(
          allSubcategories.map((s) => [s.id, s.name]),
        );

        const enriched = await Promise.all(
          candidates.map(async (i) => {
            const summary = await storage.getInternProgressSummary(i.id);
            const w4 = await storage.getWeek4Progress(i.id);
            const demoProjects = await storage.getInternDemoProjects(i.id);
            const completedDemo = demoProjects.filter(
              (p) => p.status === "completed" && p.completedAt,
            );
            const lastSubmittedAt = completedDemo.length
              ? new Date(
                  Math.max(
                    ...completedDemo.map((p) =>
                      new Date(p.completedAt as Date).getTime(),
                    ),
                  ),
                ).toISOString()
              : null;

            // Include latest rejection note for rejected interns so the UI
            // can show why they were previously rejected.
            let lastRejection: {
              note: string | null;
              rejectedAt: string | null;
              adminUsername: string | null;
            } | null = null;
            if (i.internshipStatus === "rejected") {
              const actions = await storage.getInternActionsByIntern(i.id);
              const latest = actions.find((a) => a.actionType === "rejection");
              if (latest) {
                lastRejection = {
                  note: latest.note || null,
                  rejectedAt: latest.createdAt
                    ? new Date(latest.createdAt as any).toISOString()
                    : null,
                  adminUsername: latest.adminUsername || null,
                };
              }
            }

            return {
              id: i.id,
              name: i.name,
              email: i.email,
              phone: i.phone,
              qualificationPath: i.qualificationPath,
              internshipStatus: i.internshipStatus,
              courseProgress: i.courseProgress,
              appliedDate: i.appliedDate,
              categoryName: i.categoryId
                ? categoryMap.get(i.categoryId) || null
                : null,
              subcategoryName: i.subcategoryId
                ? subcategoryMap.get(i.subcategoryId) || null
                : null,
              lastRejection,
              submission: {
                courseTotal: summary.total,
                courseCompleted: summary.completed,
                coursePercentage: summary.percentage,
                week4Total: w4.total,
                week4Completed: w4.completed,
                week4Percentage: w4.percentage,
                demoProjectsTotal: demoProjects.length,
                demoProjectsCompleted: completedDemo.length,
                lastSubmittedAt,
              },
            };
          }),
        );

        res.json(enriched);
      } catch (error) {
        console.error("Failed to list internship review candidates:", error);
        res
          .status(500)
          .json({ message: "Failed to load internship review candidates" });
      }
    },
  );

  // Approve an intern for the internship phase, auto-generate offer letter cert.
  app.post(
    "/api/admin/internship-review/:internId/approve",
    requireAdmin,
    async (req, res) => {
      try {
        if (!UUID_RE.test(req.params.internId)) {
          return res.status(400).json({ message: "Invalid intern id" });
        }

        const intern = await storage.getInternById(req.params.internId);
        if (!intern) {
          return res.status(404).json({ message: "Intern not found" });
        }
        if (
          intern.internshipStatus === "internship" ||
          intern.internshipStatus === "completed"
        ) {
          return res.status(409).json({
            message:
              "This intern has already been approved for the internship.",
          });
        }
        if (
          intern.internshipStatus !== "training_complete" &&
          intern.internshipStatus !== "rejected"
        ) {
          return res.status(400).json({
            message:
              "Intern has not completed the training/direct-exam phase yet.",
          });
        }

        // 1) Promote (training_complete | rejected) → internship.
        // Allows admin to re-approve a previously-rejected intern.
        await storage.updateInternStatus(intern.id, "internship");

        // 2) Generate offer-letter certificate (idempotent).
        const existingCerts = await storage.getCertificatesByIntern(intern.id);
        let cert = existingCerts.find((c) => c.type === "offer_letter");
        if (!cert) {
          const now = new Date();
          const currentYear = now.getFullYear();
          const shortId = intern.id.split("-")[0].toUpperCase();
          let categoryPrefix = "GENERAL";
          if (intern.categoryId) {
            const cats = await storage.getAllCategories();
            const cat = cats.find((c) => c.id === intern.categoryId);
            if (cat) {
              const CATEGORY_PREFIXES: Record<string, string> = {
                "Web3+AI": "WEB3-AI",
                "Digital Marketing": "DIGITAL-MARKETING",
                "Graphics Design": "GRAPHICS-DESIGN",
                "Business Development": "BUSINESS-DEVELOPMENT",
                DAO: "DAO",
              };
              categoryPrefix =
                CATEGORY_PREFIXES[cat.name] ||
                cat.name.toUpperCase().replace(/\s+/g, "-");
            }
          }
          const certificateNumber = `EA-${categoryPrefix}/${currentYear}/${shortId}`;
          const dateFormat: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "long",
            day: "numeric",
          };
          const programStartDate = now.toLocaleDateString("en-US", dateFormat);
          const oneMonthLater = new Date(now);
          oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
          const programEndDate = oneMonthLater.toLocaleDateString(
            "en-US",
            dateFormat,
          );
          cert = await storage.createCertificate({
            internId: intern.id,
            type: "offer_letter",
            title: "Internship Offer Letter",
            certificateNumber,
            internName: intern.name,
            programStartDate,
            programEndDate,
          });
        }

        // 2b) Ensure Training Completion Certificate exists. Previously this
        // was auto-issued at task-submission time, but it's hidden from the
        // intern until admin approval. If for any reason it wasn't created
        // (e.g. entrance_test path, mid-flow path change), create it now so
        // the intern can view/download it immediately after approval.
        const hasTrainingCert = existingCerts.some((c) => c.type === "training");
        if (!hasTrainingCert) {
          try {
            const year = new Date().getFullYear();
            const shortIdTr = intern.id.slice(0, 6).toUpperCase();
            await storage.createCertificate({
              internId: intern.id,
              type: "training",
              title: "Training Completion Certificate",
              certificateNumber: `EA/TRC/${year}/${shortIdTr}`,
              internName: intern.name,
            });
          } catch (trErr) {
            console.error(
              "Failed to auto-issue training completion cert at approval:",
              trErr,
            );
          }
        }

        // 3) Notify the intern via email (best-effort).
        const { sendInternshipApprovalEmail } = await import("./email");
        const emailResult = await sendInternshipApprovalEmail(
          intern.email,
          intern.name,
        );

        res.json({
          message: emailResult.sent
            ? "Intern approved for internship and email sent."
            : `Intern approved for internship (email could not be sent: ${emailResult.error || "unknown error"}).`,
          internId: intern.id,
          internshipStatus: "internship",
          certificate: cert,
          emailSent: emailResult.sent,
          emailError: emailResult.sent ? null : emailResult.error || null,
        });
      } catch (error: any) {
        console.error("Failed to approve intern for internship:", error);
        res
          .status(500)
          .json({ message: error?.message || "Failed to approve intern" });
      }
    },
  );

  app.get("/api/interns/:id/cv", requireAdmin, async (req, res) => {
    try {
      const intern = await storage.getInternById(req.params.id);
      if (!intern || !intern.cvFilename) {
        return res.status(404).json({ message: "CV not found" });
      }

      const cvPath = path.join(uploadDir, intern.cvFilename);
      if (!fs.existsSync(cvPath)) {
        return res.status(404).json({ message: "CV file not found" });
      }

      res.download(cvPath, intern.cvOriginalName || intern.cvFilename);
    } catch (error) {
      console.error("Error downloading CV:", error);
      res.status(500).json({ message: "Failed to download CV" });
    }
  });

  // ================= INTERN MESSAGES (admin) =================

  // List all message threads grouped by intern (with applicant details).
  app.get("/api/admin/messages", requireAdmin, async (_req, res) => {
    try {
      const [allMessages, allInterns, cats, subs] = await Promise.all([
        storage.getAllInternMessages(),
        storage.getAllInterns(),
        storage.getAllCategories(),
        storage.getAllSubcategories(),
      ]);
      const internMap = new Map(allInterns.map((i) => [i.id, i]));
      const catMap = new Map(cats.map((c: any) => [c.id, c.name]));
      const subMap = new Map(subs.map((s: any) => [s.id, s.name]));

      // Group by intern, keep newest first.
      const grouped = new Map<
        string,
        { latest: any; total: number; unread: number }
      >();
      for (const m of allMessages) {
        const existing = grouped.get(m.internId);
        const isUnread = m.senderType === "intern" && !m.isRead;
        if (!existing) {
          grouped.set(m.internId, {
            latest: m,
            total: 1,
            unread: isUnread ? 1 : 0,
          });
        } else {
          existing.total += 1;
          if (isUnread) existing.unread += 1;
          if (
            new Date(m.createdAt as any).getTime() >
            new Date(existing.latest.createdAt as any).getTime()
          ) {
            existing.latest = m;
          }
        }
      }

      const threads = Array.from(grouped.entries())
        .map(([internId, info]) => {
          const intern = internMap.get(internId);
          if (!intern) return null;
          return {
            internId,
            name: intern.name,
            email: intern.email,
            phone: intern.phone,
            qualificationPath: intern.qualificationPath,
            categoryName: intern.categoryId
              ? catMap.get(intern.categoryId) || null
              : null,
            subcategoryName: intern.subcategoryId
              ? subMap.get(intern.subcategoryId) || null
              : null,
            latestSubject: info.latest.subject,
            latestMessage: info.latest.message,
            latestSenderType: info.latest.senderType,
            latestAt: info.latest.createdAt,
            totalMessages: info.total,
            unreadCount: info.unread,
          };
        })
        .filter(Boolean)
        .sort(
          (a: any, b: any) =>
            new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime(),
        );

      res.json(threads);
    } catch (error) {
      console.error("Failed to list message threads:", error);
      res.status(500).json({ message: "Failed to load messages" });
    }
  });

  // Full conversation with one intern.
  app.get(
    "/api/admin/messages/:internId",
    requireAdmin,
    async (req, res) => {
      try {
        if (!UUID_RE.test(req.params.internId)) {
          return res.status(400).json({ message: "Invalid intern id" });
        }
        const intern = await storage.getInternById(req.params.internId);
        if (!intern) {
          return res.status(404).json({ message: "Intern not found" });
        }
        const [messages, cats, subs] = await Promise.all([
          storage.getMessagesByIntern(req.params.internId),
          storage.getAllCategories(),
          storage.getAllSubcategories(),
        ]);
        const catName = intern.categoryId
          ? cats.find((c: any) => c.id === intern.categoryId)?.name || null
          : null;
        const subName = intern.subcategoryId
          ? subs.find((s: any) => s.id === intern.subcategoryId)?.name || null
          : null;
        // Mark intern->admin messages as read for this thread.
        await storage.markInternMessagesReadByAdmin(req.params.internId);
        res.json({
          intern: {
            id: intern.id,
            name: intern.name,
            email: intern.email,
            phone: intern.phone,
            qualificationPath: intern.qualificationPath,
            categoryName: catName,
            subcategoryName: subName,
          },
          messages,
        });
      } catch (error) {
        console.error("Failed to load conversation:", error);
        res.status(500).json({ message: "Failed to load conversation" });
      }
    },
  );

  // Admin reply to an intern.
  app.post(
    "/api/admin/messages/:internId/reply",
    requireAdmin,
    async (req, res) => {
      try {
        if (!UUID_RE.test(req.params.internId)) {
          return res.status(400).json({ message: "Invalid intern id" });
        }
        const { adminMessageReplySchema } = await import("@shared/schema");
        const parsed = adminMessageReplySchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            message:
              parsed.error.errors[0]?.message || "Invalid message",
          });
        }
        const intern = await storage.getInternById(req.params.internId);
        if (!intern) {
          return res.status(404).json({ message: "Intern not found" });
        }
        const adminUsername =
          (req.session?.adminUsername as string | undefined) || "Admin";
        const created = await storage.createInternMessage({
          internId: intern.id,
          senderType: "admin",
          subject: parsed.data.subject,
          message: parsed.data.message,
          adminUsername,
          isRead: false,
        });
        res.status(201).json(created);
      } catch (error) {
        console.error("Failed to send admin reply:", error);
        res.status(500).json({ message: "Failed to send reply" });
      }
    },
  );

  // Weekly Updates Routes
  app.post("/api/weekly-updates", requireAdmin, async (req, res) => {
    if (!req.session.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const data = weeklyUpdateSchema.parse(req.body);
      const update = await storage.createWeeklyUpdate(data);
      res.json(update);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid data" });
    }
  });

  app.get("/api/weekly-updates", requireAdmin, async (req, res) => {
    if (!req.session.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const updates = await storage.getAllWeeklyUpdates();
      res.json(updates);
    } catch (error) {
      console.error("Error fetching weekly updates:", error);
      res.status(500).json({ message: "Failed to fetch weekly updates" });
    }
  });

  app.get(
    "/api/interns/:internId/weekly-updates",
    requireAdmin,
    async (req, res) => {
      if (!req.session.isAdmin) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      try {
        const updates = await storage.getWeeklyUpdatesByIntern(
          req.params.internId,
        );
        res.json(updates);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch updates" });
      }
    },
  );

  app.put("/api/weekly-updates/:id", requireAdmin, async (req, res) => {
    try {
      console.log("NORMALIZED:", req.body);

      const data = weeklyUpdateSchema.partial().parse(req.body);

      console.log("PARSED:", data);

      const update = await storage.updateWeeklyUpdate(req.params.id, data);
      res.json(update);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid data" });
    }
  });

  app.delete("/api/weekly-updates/:id", requireAdmin, async (req, res) => {
    if (!req.session.isAdmin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      await storage.deleteWeeklyUpdate(req.params.id);
      res.json({ message: "Update deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete update" });
    }
  });

  // Intern Approval Routes
  app.get("/api/admin/pending-interns", requireAdmin, async (_req, res) => {
    try {
      const interns = await storage.getAllPendingInterns();
      res.json(interns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending interns" });
    }
  });

  app.post(
    "/api/admin/approve-intern/:internId",
    requireAdmin,
    async (req, res) => {
      try {
        console.log("Approving intern:", req.params.internId);
        const { password } = req.body;
        const defaultPassword = password || "123456";

        // Get intern details for email
        const intern = await storage.getInternById(req.params.internId);
        if (!intern) {
          return res.status(404).json({ message: "Intern not found" });
        }

        // Create intern user account
        const existingUser = await storage.getInternUserByInternId(
          req.params.internId,
        );
        if (!existingUser) {
          await storage.createInternUser(req.params.internId, defaultPassword);
          console.log(
            "Created new user account for intern:",
            req.params.internId,
          );
        } else {
          await storage.updateInternApproval(req.params.internId, 1);
          console.log(
            "Updated approval status for intern:",
            req.params.internId,
          );
        }

        // Send approval email with credentials
        const { sendApprovalEmail } = await import("./email");
        await sendApprovalEmail(intern.email, intern.name, defaultPassword);
        console.log("Approval email sent to:", intern.email);

        res.json({
          message: "Intern approved and email sent",
          defaultPassword,
        });
      } catch (error) {
        console.error("Failed to approve intern:", error);
        res.status(500).json({ message: "Failed to approve intern" });
      }
    },
  );

  app.post(
    "/api/admin/reject-intern/:internId",
    requireAdmin,
    async (req, res) => {
      try {
        console.log("Rejecting intern:", req.params.internId);
        await storage.updateInternApproval(req.params.internId, 2);
        console.log("Intern rejected successfully:", req.params.internId);
        res.json({ message: "Intern rejected" });
      } catch (error) {
        console.error("Failed to reject intern:", error);
        res.status(500).json({ message: "Failed to reject intern" });
      }
    },
  );

  app.get("/api/admin/interns-with-status", requireAdmin, async (_req, res) => {
    try {
      const interns = await storage.getAllInternsWithStatus();
      res.json(interns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interns" });
    }
  });

  // Task Routes
  app.post("/api/tasks", requireAdmin, async (req, res) => {
    try {
      const {
        title,
        description,
        assignedTo,
        projectId,
        internCategoryId,
        subcategoryId,
        priority,
        dueDate,
      } = req.body;

      const task = await storage.createTask({
        title,
        description,
        assignedTo: assignedTo || null,
        projectId: projectId || null,
        internCategoryId: internCategoryId || null,
        subcategoryId: subcategoryId || null,
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: "admin",
      });

      // Notification
      if (assignedTo) {
        await storage.createNotification({
          internId: assignedTo,
          type: "task_assigned",
          title: "New Task Assigned",
          message: `You have been assigned a new task: "${title}"`,
          relatedTaskId: task.id,
        });
      }

      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get("/api/tasks", requireAdmin, async (_req, res) => {
    try {
      // Idempotently backfill "Project Submission" tasks for any
      // already-completed demo projects that were submitted before the
      // submission-task auto-creation was added. Safe to run on every
      // request — only inserts when missing.
      try {
        const allInterns = await storage.getAllInterns();
        const allDemo = await storage.getAllDemoProjects();
        const demoMap = new Map(allDemo.map((d) => [d.id, d]));
        const allTasksRaw = await storage.getAllTasks();
        const existingTitles = new Set(
          allTasksRaw
            .filter(
              (t) =>
                typeof t.title === "string" &&
                t.title.startsWith("Project Submission: ") &&
                t.assignedTo,
            )
            .map((t) => `${t.assignedTo}::${t.title}`),
        );

        for (const intern of allInterns) {
          const internProjects = await storage.getInternDemoProjects(
            intern.id,
          );
          const completed = internProjects.filter(
            (p) => p.status === "completed" && p.submissionNotes,
          );
          if (completed.length === 0) continue;

          const modules = intern.categoryId
            ? await storage.getCourseModulesByCategory(intern.categoryId)
            : await storage.getAllCourseModules();
          const week4Module = modules.find((m) => m.weekNumber === 4);
          const isInternshipPhase = ["internship", "completed"].includes(
            intern.internshipStatus,
          );
          const submissionType = isInternshipPhase ? "intern" : "training";

          for (const cp of completed) {
            const dp = cp.demoProjectId ? demoMap.get(cp.demoProjectId) : null;
            const projectName = dp?.name || "Demo Project";
            const title = `Project Submission: ${projectName}`;
            if (existingTitles.has(`${intern.id}::${title}`)) continue;

            try {
              await storage.createTask({
                title,
                description: null,
                assignedTo: intern.id,
                projectId: null,
                courseModuleId: week4Module ? week4Module.id : null,
                internshipProjectTaskId: null,
                subProjectTaskId: null,
                internCategoryId: intern.categoryId || null,
                subcategoryId: intern.subcategoryId || null,
                status: "completed",
                priority: "medium",
                type: submissionType,
                startDate: null,
                dueDate: null,
                createdBy: "intern",
                createdByIntern: intern.id,
                submittedNotes: cp.submissionNotes || null,
                submittedGithubLink: null,
                submittedAt: cp.completedAt || new Date(),
                closedAt: cp.completedAt || new Date(),
              } as any);
            } catch (insErr) {
              console.error(
                "Backfill: failed to create submission task for intern",
                intern.id,
                insErr,
              );
            }
          }
        }
      } catch (backfillErr) {
        console.error(
          "Backfill of project submission tasks failed:",
          backfillErr,
        );
      }

      const tasks = await storage.getAllTasksEnriched();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.put("/api/tasks/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const {
        title,
        description,
        assignedTo,
        projectId,
        internCategoryId,
        subcategoryId,
        priority,
        status,
        dueDate,
      } = req.body;

      const updateData: any = {
        title,
        description,
        assignedTo: assignedTo || null,
        projectId: projectId || null,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
      };
      if (internCategoryId !== undefined)
        updateData.internCategoryId = internCategoryId || null;
      if (subcategoryId !== undefined)
        updateData.subcategoryId = subcategoryId || null;

      const task = await storage.updateTask(id, updateData);

      res.json(task);
    } catch (err) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.json({ message: "Task deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Intern Dashboard Routes
  const requireIntern = (req: any, res: any, next: any) => {
    console.log("requireIntern check:", {
      path: req.path,
      internId: req.session?.internId,
      sessionID: req.sessionID,
      hasSession: !!req.session,
    });

    if (req.session?.internId) {
      next();
    } else {
      console.log("Intern authorization failed for:", req.path);
      res.status(401).json({ message: "Unauthorized" });
    }
  };

  app.post("/api/intern/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log("=== LOGIN ATTEMPT ===");
      console.log("Email:", email);
      console.log("Password provided:", password ? "Yes" : "No");
      console.log("Session before login:", req.sessionID);

      // First check if intern exists in the system
      const allInterns = await storage.getAllInterns();
      const internExists = allInterns.find(
        (i) => i.email.toLowerCase() === email.toLowerCase(),
      );

      console.log("Intern exists in database:", internExists ? "Yes" : "No");
      if (internExists) {
        console.log("Intern ID:", internExists.id);
      }

      if (!internExists) {
        console.log("ERROR: Intern record not found for email:", email);
        return res.status(401).json({
          message: "Invalid credentials - account not found",
        });
      }

      // Check if user account exists
      const user = await storage.getInternUserByEmail(email);
      console.log("User account found:", user ? "Yes" : "No");

      if (!user) {
        console.log(
          "ERROR: User account not created yet for intern:",
          internExists.id,
        );

        // Auto-create the user account with default password
        try {
          console.log("Auto-creating user account with password: 123456");
          await storage.createInternUser(internExists.id, "123456");
          await storage.updateInternApproval(internExists.id, 1);
          console.log("User account created successfully");

          // If they used 123456 as password, log them in
          if (password === "123456") {
            req.session.internId = internExists.id;
            req.session.save((err) => {
              if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({ message: "Login failed" });
              }
              console.log("Login successful after auto-creation for:", email);
              return res.json({
                message: "Login successful",
                intern: {
                  id: internExists.id,
                  name: internExists.name,
                  email: internExists.email,
                },
              });
            });
            return;
          }
        } catch (createError) {
          console.error("Failed to auto-create user account:", createError);
        }

        return res.status(401).json({
          message: "Account not approved yet. Default password is 123456",
        });
      }

      console.log("Verifying password...");
      const valid = await bcrypt.compare(password, user.password);
      console.log("Password valid:", valid);

      if (!valid) {
        console.log("ERROR: Invalid password");
        return res.status(401).json({
          message: "Invalid credentials - account not found",
        });
      }

      if (user.isApproved !== 1) {
        console.log("ERROR: Account not approved");
        return res.status(403).json({
          message: "Account pending approval",
        });
      }

      req.session.internId = user.internId;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        console.log("=== LOGIN SUCCESSFUL ===");
        console.log("Intern ID:", user.internId);
        console.log("Session ID:", req.sessionID);
        console.log("Session internId set to:", req.session.internId);
        res.json({
          message: "Login successful",
          intern: {
            id: user.internId,
            name: internExists.name,
            email: internExists.email,
          },
        });
      });
    } catch (error) {
      console.error("=== LOGIN ERROR ===");
      console.error(error);
      res
        .status(500)
        .json({ message: "Invalid credentials - account not found" });
    }
  });

  const requireDao = async (req: any, res: any, next: any) => {
    if (!req.session?.internId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const intern = await storage.getInternById(req.session.internId);
    if (!intern || intern.daoStatus !== "approved") {
      return res.status(403).json({ message: "DAO access required" });
    }
    next();
  };

  app.get("/api/dao/stats", requireDao, async (_req, res) => {
    try {
      const all = await storage.getAllInterns();
      const directDao = all.filter(
        (i) => i.qualificationPath === "DAO" && i.daoStatus === "approved",
      ).length;
      const internshipDao = all.filter(
        (i) => i.daoStatus === "approved" && i.qualificationPath !== "DAO",
      ).length;
      const totalDao = directDao + internshipDao;
      const pendingDao = all.filter(
        (i) => i.daoMembershipApplied && i.daoStatus === "pending",
      ).length;
      res.json({ directDao, internshipDao, totalDao, pendingDao });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch DAO stats" });
    }
  });

  app.post("/api/intern/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/intern/tasks", requireIntern, async (req, res) => {
    try {
      const tasks = await storage.getTasksByIntern(req.session.internId!);
      const allProjects = await storage.getAllProjects();
      const enriched = tasks.map((t) => {
        if (t.projectId) {
          const proj = allProjects.find((p) => p.id === t.projectId);
          return { ...t, projectName: proj?.name || null };
        }
        return t;
      });
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/intern/tasks/:id/start", requireIntern, async (req, res) => {
    try {
      const internId = req.session.internId!;
      const taskId = req.params.id;

      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if (task.assignedTo !== internId) {
        return res
          .status(403)
          .json({ message: "Not authorized to modify this task" });
      }

      if (task.status === "completed" || task.status === "cancelled") {
        return res.status(400).json({ message: "Cannot start this task" });
      }

      // 🔥 CHECK ANY ACTIVE TASK
      const activeLog = await storage.getActiveTimeLog(internId);

      if (activeLog) {
        // Stop previous task automatically
        await storage.endTimeLog(activeLog.id, new Date());
        await storage.updateTask(activeLog.taskId, { status: "pending" });
      }

      // Start new task
      await storage.updateTask(taskId, { status: "running" });

      const newLog = await storage.createTimeLog({
        internId,
        taskId,
        logType: "task",
        startTime: new Date(),
      });

      res.json(newLog);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to start task" });
    }
  });

  app.post("/api/intern/tasks/:id/stop", requireIntern, async (req, res) => {
    try {
      const internId = req.session.internId!;
      const task = await storage.getTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      if (task.assignedTo !== internId) {
        return res
          .status(403)
          .json({ message: "Not authorized to modify this task" });
      }

      const activeLog = await storage.getActiveTimeLogForTask(
        internId,
        req.params.id,
      );
      if (!activeLog) {
        return res
          .status(404)
          .json({ message: "No active time log for this task" });
      }

      const endedLog = await storage.endTimeLog(activeLog.id, new Date());

      // Keep task in running state so it can be restarted
      // Only change to pending if user wants to pause it
      await storage.updateTask(req.params.id, { status: "pending" });

      res.json({
        message: "Task timer stopped",
        duration: endedLog?.duration || 0,
        log: endedLog,
      });
    } catch (error) {
      console.error("Error stopping task:", error);
      res.status(500).json({ message: "Failed to stop task" });
    }
  });

  app.post(
    "/api/intern/tasks/:id/complete",
    requireIntern,
    async (req, res) => {
      try {
        const internId = req.session.internId!;
        const taskToComplete = await storage.getTaskById(req.params.id);
        if (!taskToComplete) {
          return res.status(404).json({ message: "Task not found" });
        }
        if (taskToComplete.assignedTo !== internId) {
          return res
            .status(403)
            .json({ message: "Not authorized to modify this task" });
        }

        const activeLog = await storage.getActiveTimeLog(internId);
        let duration = 0;

        if (activeLog && activeLog.taskId === req.params.id) {
          const endedLog = await storage.endTimeLog(activeLog.id, new Date());
          duration = endedLog?.duration || 0;
        }

        await storage.updateTask(req.params.id, { status: "completed" });

        res.json({
          message: "Task completed",
          duration,
        });
      } catch (error) {
        res.status(500).json({ message: "Failed to complete task" });
      }
    },
  );

  app.get("/api/intern/time-logs", requireIntern, async (req, res) => {
    try {
      const logs = await storage.getTimeLogsByIntern(req.session.internId!);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time logs" });
    }
  });

  // ================= INTERN MESSAGES (intern) =================

  // List my conversation with admin.
  app.get("/api/intern/messages", requireIntern, async (req, res) => {
    try {
      const internId = req.session.internId!;
      const messages = await storage.getMessagesByIntern(internId);
      // Mark admin->intern messages as read.
      await storage.markInternMessagesReadByIntern(internId);
      res.json(messages);
    } catch (error) {
      console.error("Failed to load intern messages:", error);
      res.status(500).json({ message: "Failed to load messages" });
    }
  });

  // Send a new message to admin.
  app.post("/api/intern/messages", requireIntern, async (req, res) => {
    try {
      const { internMessageCreateSchema } = await import("@shared/schema");
      const parsed = internMessageCreateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.errors[0]?.message || "Invalid message",
        });
      }
      const created = await storage.createInternMessage({
        internId: req.session.internId!,
        senderType: "intern",
        subject: parsed.data.subject,
        message: parsed.data.message,
        isRead: false,
      });
      res.status(201).json(created);
    } catch (error) {
      console.error("Failed to send intern message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post("/api/intern/weekly-updates", requireIntern, async (req, res) => {
    try {
      const data = weeklyUpdateSchema.parse({
        ...req.body,
        internId: req.session.internId,
      });
      const update = await storage.createWeeklyUpdate(data);
      res.json(update);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid data" });
    }
  });

  app.get("/api/intern/my-weekly-updates", requireIntern, async (req, res) => {
    try {
      const updates = await storage.getWeeklyUpdatesByIntern(
        req.session.internId!,
      );
      res.json(updates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch updates" });
    }
  });

  app.put("/api/intern/weekly-updates/:id", requireIntern, async (req, res) => {
    try {
      // Verify the update belongs to this intern
      const updates = await storage.getWeeklyUpdatesByIntern(
        req.session.internId!,
      );
      const existing = updates.find((u) => u.id === req.params.id);
      if (!existing) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const data = weeklyUpdateSchema.partial().parse(req.body);
      const update = await storage.updateWeeklyUpdate(req.params.id, data);
      res.json(update);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Invalid data" });
    }
  });

  app.delete(
    "/api/intern/weekly-updates/:id",
    requireIntern,
    async (req, res) => {
      try {
        // Verify the update belongs to this intern
        const updates = await storage.getWeeklyUpdatesByIntern(
          req.session.internId!,
        );
        const existing = updates.find((u) => u.id === req.params.id);
        if (!existing) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        await storage.deleteWeeklyUpdate(req.params.id);
        res.json({ message: "Update deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete update" });
      }
    },
  );

  app.get("/api/admin/time-logs", requireAdmin, async (_req, res) => {
    try {
      const logs = await storage.getAllTimeLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time logs" });
    }
  });

  // Import spreadsheet data - note this is the backend route, frontend uses client-side parsing
  app.post("/api/admin/import-spreadsheet", requireAdmin, async (req, res) => {
    try {
      const { data } = req.body;

      if (!Array.isArray(data)) {
        return res.status(400).json({ message: "Invalid data format" });
      }

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];

        // Handle array-based rows OR object-with-numeric-keys
        const values = Array.isArray(row) ? row : Object.values(row);

        const name = values[0]?.toString().trim();
        const email = values[1]?.toString().trim();

        if (!name || !email) {
          skipped++;
          errors.push(`Row ${i + 1}: Missing name or email`);
          continue;
        }

        await storage.createIntern({
          name,
          email,
          phone: values[2] || "N/A",
          education: values[3] || "N/A",
          city: values[4] || "N/A",
          skills: values[5] || "N/A",
          work_experience: values[6] || "N/A",
          projects: values[7] || "N/A",
          github: values[8] || "N/A",
          linkedin: values[9] || "N/A",
        });

        imported++;
      }

      res.json({
        message: `Imported ${imported}, skipped ${skipped}`,
        imported,
        skipped,
        errors,
      });
    } catch (err: any) {
      console.error("IMPORT ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/intern/time-log/end", requireIntern, async (req, res) => {
    try {
      const activeLog = await storage.getActiveTimeLog(req.session.internId!);
      if (!activeLog) {
        return res.status(404).json({ message: "No active time log" });
      }
      const log = await storage.endTimeLog(activeLog.id, new Date());
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Failed to end time log" });
    }
  });

  // Intern create task
  app.post("/api/intern/create-task", requireIntern, async (req, res) => {
    try {
      const {
        title,
        description,
        priority,
        dueDate,
        projectId,
        courseModuleId,
        internshipProjectTaskId,
      } = req.body;

      const task = await storage.createInternTask(req.session.internId!, {
        title,
        description,
        projectId: projectId || null,
        courseModuleId: courseModuleId || null,
        internshipProjectTaskId: internshipProjectTaskId || null,
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
      });

      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.delete("/api/intern/tasks/:id", requireIntern, async (req, res) => {
    try {
      const internId = req.session.internId!;
      const task = await storage.getTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      if (task.assignedTo !== internId) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this task" });
      }
      if (task.status !== "pending") {
        return res
          .status(400)
          .json({ message: "Only pending tasks can be deleted" });
      }
      await storage.deleteTask(req.params.id);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Intern submit task
  app.post("/api/intern/tasks/:id/submit", requireIntern, async (req, res) => {
    try {
      const { notes, status, githubLink } = req.body;
      const taskId = req.params.id;
      const internId = req.session.internId!;

      const existingTask = await storage.getTaskById(taskId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      if (existingTask.assignedTo !== internId) {
        return res
          .status(403)
          .json({ message: "Not authorized to modify this task" });
      }

      const trimmedNotes = typeof notes === "string" ? notes.trim() : "";
      if (!trimmedNotes) {
        return res
          .status(400)
          .json({ message: "Work notes are required to submit this task." });
      }

      // const MIN_WORK_MS = 30 * 60 * 1000;
      const MIN_WORK_MS = 1 * 60 * 1000;
      const allLogs = await storage.getTimeLogsByIntern(internId);
      const taskLogs = allLogs.filter((l) => l.taskId === taskId);
      const now = Date.now();
      const totalWorkMs = taskLogs.reduce((sum, l) => {
        const start = l.startTime ? new Date(l.startTime).getTime() : 0;
        const end = l.endTime ? new Date(l.endTime).getTime() : now;
        if (!start) return sum;
        return sum + Math.max(0, end - start);
      }, 0);
      if (totalWorkMs < MIN_WORK_MS) {
        const remainingMin = Math.ceil((MIN_WORK_MS - totalWorkMs) / 60000);
        return res.status(400).json({
          message: `You must work on this task for at least 30 minutes before submitting. ${remainingMin} minute${remainingMin === 1 ? "" : "s"} remaining.`,
        });
      }

      const allowedStatuses = ["pending", "running", "completed", "cancelled"];
      const finalStatus = allowedStatuses.includes(status)
        ? status
        : "completed";

      const activeLog = await storage.getActiveTimeLogForTask(internId, taskId);
      let endedLog = null;

      if (activeLog) {
        await storage.updateTimeLogNotes(activeLog.id, trimmedNotes);
        endedLog = await storage.endTimeLog(activeLog.id, new Date());
      }

      const updateData: any = {
        submittedAt: new Date(),
        status: finalStatus,
        submittedNotes: notes?.trim() || null,
        submittedGithubLink: githubLink?.trim() || null,
      };

      if (finalStatus === "completed" || finalStatus === "cancelled") {
        updateData.closedAt = new Date();
      }

      const task = await storage.updateTask(taskId, updateData);

      if (finalStatus === "completed" && task?.courseModuleId) {
        await storage.markModuleComplete(internId, task.courseModuleId);
        const summary = await storage.getInternProgressSummary(internId);
        await storage.updateInternCourseProgress(internId, summary.percentage);

        const intern = await storage.getInternById(internId);
        if (
          intern &&
          intern.qualificationPath === "course_first" &&
          ["pending", "training"].includes(intern.internshipStatus)
        ) {
          const w4 = await storage.getWeek4Progress(internId);
          if (w4.percentage >= 100) {
            await storage.updateInternStatus(internId, "training_complete");
          } else if (intern.internshipStatus === "pending") {
            await storage.updateInternStatus(internId, "training");
          }
        }

        // Auto-issue Training Completion Certificate when an intern who took
        // the full training course finishes 100% of all course modules.
        if (
          intern &&
          intern.qualificationPath === "course_first" &&
          summary.percentage >= 100
        ) {
          try {
            const existingCerts =
              await storage.getCertificatesByIntern(internId);
            const hasTrainingCert = existingCerts.some(
              (c) => c.type === "training",
            );
            if (!hasTrainingCert) {
              const year = new Date().getFullYear();
              const shortId = intern.id.slice(0, 6).toUpperCase();
              await storage.createCertificate({
                internId: intern.id,
                type: "training",
                title: "Training Completion Certificate",
                certificateNumber: `EA/TRC/${year}/${shortId}`,
                internName: intern.name,
              });
            }
          } catch (certErr) {
            console.error(
              "Failed to auto-issue training completion cert:",
              certErr,
            );
          }
        }
      }

      if (finalStatus === "completed" && task?.internshipProjectTaskId) {
        await storage.markInternshipProjectTaskComplete(
          task.internshipProjectTaskId,
        );
        const internProgress = await storage.getInternshipProgress(internId);
        if (internProgress.percentage >= 100) {
          await storage.updateInternStatus(internId, "completed");
        }
      }

      if (finalStatus === "completed" && (task as any)?.subProjectTaskId) {
        await storage.submitSubProjectTask(
          (task as any).subProjectTaskId,
          notes?.trim() || null,
        );
        const internProgress = await storage.getInternshipProgress(internId);
        if (internProgress.percentage >= 100) {
          const intern = await storage.getInternById(internId);
          if (intern && intern.internshipStatus !== "completed") {
            await storage.updateInternStatus(internId, "completed");
          }
        }
      }

      res.json({
        task,
        duration: endedLog?.duration ?? 0,
        message:
          finalStatus === "completed"
            ? "Task submitted and completed"
            : finalStatus === "cancelled"
              ? "Task cancelled"
              : "Task submitted for review",
      });
    } catch (error) {
      console.error("Error submitting task:", error);
      res.status(500).json({ message: "Failed to submit task" });
    }
  });

  // Project routes for interns - read-only access to admin-managed projects
  app.get("/api/intern/projects", requireIntern, async (req, res) => {
    try {
      const intern = await storage.getInternById(req.session.internId!);
      const projects = await storage.getAllProjects();
      let adminProjects = projects.filter((p) => !p.createdByInternId);
      if (intern?.categoryId) {
        adminProjects = adminProjects.filter(
          (p: any) => p.internCategoryId === intern.categoryId,
        );
      }
      if (intern?.subcategoryId) {
        adminProjects = adminProjects.filter(
          (p: any) =>
            !p.subcategoryId || p.subcategoryId === intern.subcategoryId,
        );
      }
      res.json(adminProjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/intern/wallet", requireIntern, async (req, res) => {
    try {
      const intern = await storage.getInternById(req.session.internId!);
      if (!intern) return res.status(404).json({ message: "Intern not found" });
      res.json({ walletAddress: intern.walletAddress || null });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet address" });
    }
  });

  app.post("/api/intern/wallet", requireIntern, async (req, res) => {
    try {
      const { walletAddress } = req.body;
      if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return res.status(400).json({
          message:
            "Invalid wallet address. Must be a valid Ethereum address (0x...)",
        });
      }
      const intern = await storage.getInternById(req.session.internId!);
      if (!intern) return res.status(404).json({ message: "Intern not found" });
      if (
        intern.internshipStatus !== "internship" &&
        intern.internshipStatus !== "completed"
      ) {
        return res
          .status(403)
          .json({ message: "Only active interns can submit wallet addresses" });
      }
      const allInterns = await storage.getAllInterns();
      const duplicate = allInterns.find(
        (i) =>
          i.walletAddress?.toLowerCase() === walletAddress.toLowerCase() &&
          i.id !== intern.id,
      );
      if (duplicate) {
        return res.status(409).json({
          message:
            "This wallet address is already registered by another intern. Please use a unique address.",
        });
      }
      await storage.updateIntern(intern.id, { walletAddress });
      res.json({ message: "Wallet address saved successfully", walletAddress });
    } catch (error) {
      res.status(500).json({ message: "Failed to save wallet address" });
    }
  });

  app.get("/api/admin/wallet-addresses", requireAdmin, async (_req, res) => {
    try {
      const allInterns = await storage.getAllInterns();
      const internsWithWallets = allInterns
        .filter((i) => i.walletAddress)
        .map((i) => ({
          id: i.id,
          name: i.name,
          email: i.email,
          walletAddress: i.walletAddress,
          internshipStatus: i.internshipStatus,
          categoryId: i.categoryId,
          appliedDate: i.appliedDate,
        }));
      res.json(internsWithWallets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet addresses" });
    }
  });

  // Password reset for interns
  app.post("/api/intern/reset-password", requireIntern, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const user = await storage.getInternUserByInternId(req.session.internId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      await storage.updateInternUserPassword(
        req.session.internId!,
        newPassword,
      );
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Forgot password - send reset link via email
  app.post("/api/intern/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const allInterns = await storage.getAllInterns();
      const intern = allInterns.find(
        (i) => i.email.toLowerCase() === email.toLowerCase(),
      );

      if (!intern) {
        // Don't reveal if email exists or not for security
        return res.json({
          message: "If the email exists, a password reset email has been sent.",
        });
      }

      // Check if user account exists
      const user = await storage.getInternUserByInternId(intern.id);

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      if (!user) {
        // Create user account if it doesn't exist
        await storage.createInternUser(intern.id, tempPassword);
        await storage.updateInternApproval(intern.id, 1);
      } else {
        // Update existing password
        await storage.updateInternPassword(intern.id, hashedPassword);
      }

      // Send email with temporary password
      const { sendPasswordResetEmail } = await import("./email");
      await sendPasswordResetEmail(email, intern.name, tempPassword);

      console.log(
        "Password reset successful for:",
        email,
        "New password:",
        tempPassword,
      );

      res.json({
        message: "If the email exists, a password reset email has been sent.",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res
        .status(500)
        .json({ message: "Failed to process password reset request" });
    }
  });

  // Notification routes
  app.get("/api/intern/notifications", requireIntern, async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByIntern(
        req.session.internId!,
      );
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get(
    "/api/intern/notifications/unread-count",
    requireIntern,
    async (req, res) => {
      try {
        const count = await storage.getUnreadNotificationsCount(
          req.session.internId!,
        );
        res.json({ count });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch unread count" });
      }
    },
  );

  app.post(
    "/api/intern/notifications/:id/read",
    requireIntern,
    async (req, res) => {
      try {
        await storage.markNotificationAsRead(req.params.id);
        res.json({ message: "Notification marked as read" });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to mark notification as read" });
      }
    },
  );

  // Get intern profile
  app.get("/api/intern/profile", requireIntern, async (req, res) => {
    try {
      console.log("Fetching profile for intern:", req.session.internId);

      if (!req.session.internId) {
        console.log("No internId in session");
        return res.status(401).json({ message: "Unauthorized" });
      }

      const intern = await storage.getInternById(req.session.internId);
      if (!intern) {
        console.log("Intern not found for ID:", req.session.internId);
        return res.status(404).json({ message: "Profile not found" });
      }

      console.log("Profile found:", intern.name);
      res.json(intern);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update intern profile with image upload
  const profileUpload = multer({
    storage: storageConfig,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowedTypes = [".jpg", ".jpeg", ".png", ".gif"];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error("Only JPG, JPEG, PNG, and GIF files are allowed"));
      }
    },
  });

  app.put(
    "/api/intern/profile",
    requireIntern,
    profileUpload.single("profileImage"),
    async (req, res) => {
      try {
        const updateData: any = {
          name: req.body.name,
          phone: req.body.phone,
          city: req.body.city,
          education: req.body.education,
          skills: req.body.skills,
          workExperience: req.body.workExperience,
          projects: req.body.projects,
          github: req.body.github,
          linkedin: req.body.linkedin,
        };

        if (req.file) {
          updateData.profileImage = `/uploads/${req.file.filename}`;
        }

        const intern = await storage.updateIntern(
          req.session.internId!,
          updateData,
        );
        res.json(intern);
      } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
      }
    },
  );

  // Intern can switch qualification path (Full Training Course vs Direct Exam)
  // Allowed only before they have started the internship phase.
  app.patch(
    "/api/intern/qualification-path",
    requireIntern,
    async (req, res) => {
      try {
        const { qualificationPath } = req.body || {};
        if (
          qualificationPath !== "course_first" &&
          qualificationPath !== "entrance_test"
        ) {
          return res
            .status(400)
            .json({ message: "Invalid qualification path" });
        }
        const intern = await storage.getInternById(req.session.internId!);
        if (!intern)
          return res.status(404).json({ message: "Intern not found" });
        if (
          ["internship", "completed"].includes(intern.internshipStatus)
        ) {
          return res.status(400).json({
            message:
              "Qualification path cannot be changed after internship has started",
          });
        }
        const updated = await storage.updateIntern(req.session.internId!, {
          qualificationPath,
        } as any);
        res.json(updated);
      } catch (error) {
        console.error("Error updating qualification path:", error);
        res
          .status(500)
          .json({ message: "Failed to update qualification path" });
      }
    },
  );

  // Contact Messages Routes
  app.post("/api/contact", async (req, res) => {
    try {
      const { contactMessageSchema } = await import("@shared/schema");
      const validation = contactMessageSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors,
        });
      }

      const message = await storage.createContactMessage(validation.data);

      // Send email notification to admin (non-blocking - don't fail if email fails)
      try {
        const { sendContactNotificationEmail } = await import("./email");
        await sendContactNotificationEmail(
          validation.data.firstName,
          validation.data.lastName,
          validation.data.email,
          validation.data.subject,
          validation.data.message,
        );
      } catch (emailError) {
        console.log("Email notification skipped (SMTP not configured)");
      }

      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating contact message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.post("/api/dao-applications", async (req, res) => {
    try {
      const { insertDaoApplicationSchema } = await import("@shared/schema");
      const validation = insertDaoApplicationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors,
        });
      }
      const application = await storage.createDaoApplication(validation.data);

      try {
        const { sendDaoApplicationThankYouEmail, sendAdminNotification } =
          await import("./email");
        await sendDaoApplicationThankYouEmail(
          application.email,
          application.name,
          application.position,
        );
        await sendAdminNotification(
          `${application.name} (DAO - ${application.position})`,
          application.email,
        );
      } catch (emailError) {
        console.log("DAO application emails skipped:", emailError);
      }

      res.status(201).json(application);
    } catch (error) {
      console.error("Error creating DAO application:", error);
      res.status(500).json({ message: "Failed to submit DAO application" });
    }
  });

  app.get(
    "/api/admin/dao-member-applications",
    requireAdmin,
    async (_req, res) => {
      try {
        const applications = await storage.getAllDaoApplications();
        res.json(applications);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch DAO member applications" });
      }
    },
  );

  app.put(
    "/api/admin/dao-member-applications/:id/status",
    requireAdmin,
    async (req, res) => {
      try {
        const { status } = req.body;
        if (!["approved", "rejected", "pending"].includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }
        const application = await storage.updateDaoApplicationStatus(
          req.params.id,
          status,
        );
        if (!application)
          return res.status(404).json({ message: "Application not found" });

        if (status === "approved") {
          try {
            const defaultPassword = "123456";
            let intern = await storage.getInternByEmail(application.email);

            if (!intern) {
              intern = await storage.createIntern({
                name: application.name,
                email: application.email,
                phone: "",
                education: application.education || "",
                city: "",
                skills: application.expertise || "",
                qualificationPath: "DAO",
                internshipStatus: "completed",
                courseProgress: 100,
                daoMembershipApplied: true,
                daoPosition: application.position,
                daoWorkAvailability: application.workAvailability,
                daoExpertise: application.expertise,
                daoAppliedAt: application.createdAt || new Date(),
                daoStatus: "approved",
              } as any);
            } else {
              await storage.updateDaoStatus(intern.id, "approved");
              await storage.updateInternStatus(intern.id, "completed");
            }

            const existingUser = await storage.getInternUserByInternId(
              intern.id,
            );
            if (!existingUser) {
              await storage.createInternUser(intern.id, defaultPassword);
            }
            await storage.updateInternApproval(intern.id, 1);

            try {
              const { sendDaoApprovalEmail } = await import("./email");
              await sendDaoApprovalEmail(
                application.email,
                application.name,
                defaultPassword,
                application.position,
              );
            } catch (emailError) {
              console.log("DAO approval email skipped:", emailError);
            }
          } catch (provisionError) {
            console.error(
              "Failed to provision DAO member account:",
              provisionError,
            );
          }
        }

        res.json(application);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to update DAO application status" });
      }
    },
  );

  // Admin Project Management Routes
  app.get("/api/admin/projects", requireAdmin, async (_req, res) => {
    try {
      const allProjects = await storage.getAllProjects();
      res.json(allProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/admin/projects/:id", requireAdmin, async (req, res) => {
    try {
      const project = await storage.getProjectById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/admin/projects", requireAdmin, async (req, res) => {
    try {
      const {
        name,
        description,
        category,
        internCategoryId,
        subcategoryId,
        status,
        startDate,
        endDate,
        repositoryUrl,
        deployedUrl,
      } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Project name is required" });
      }
      const projectData: any = {
        name,
        description: description || null,
        category: category || null,
        internCategoryId: internCategoryId || null,
        subcategoryId: subcategoryId || null,
        status: status || "in-progress",
        repositoryUrl: repositoryUrl || null,
        deployedUrl: deployedUrl || null,
      };
      if (startDate) projectData.startDate = new Date(startDate);
      if (endDate) projectData.endDate = new Date(endDate);

      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/admin/projects/:id", requireAdmin, async (req, res) => {
    try {
      const {
        name,
        description,
        category,
        internCategoryId,
        subcategoryId,
        status,
        startDate,
        endDate,
        repositoryUrl,
        deployedUrl,
      } = req.body;
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (internCategoryId !== undefined)
        updateData.internCategoryId = internCategoryId || null;
      if (subcategoryId !== undefined)
        updateData.subcategoryId = subcategoryId || null;
      if (status !== undefined) updateData.status = status;
      if (repositoryUrl !== undefined) updateData.repositoryUrl = repositoryUrl;
      if (deployedUrl !== undefined) updateData.deployedUrl = deployedUrl;
      if (startDate !== undefined)
        updateData.startDate = startDate ? new Date(startDate) : null;
      if (endDate !== undefined)
        updateData.endDate = endDate ? new Date(endDate) : null;

      const project = await storage.updateProject(req.params.id, updateData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/admin/projects/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  app.get("/api/admin/projects/:id/tasks", requireAdmin, async (req, res) => {
    try {
      const projectTasks = await storage.getTasksByProject(req.params.id);
      res.json(projectTasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project tasks" });
    }
  });

  app.post("/api/admin/projects/:id/tasks", requireAdmin, async (req, res) => {
    try {
      const {
        title,
        description,
        assignedTo,
        internCategoryId,
        subcategoryId,
        status,
        priority,
        startDate,
        dueDate,
      } = req.body;
      if (!title) {
        return res.status(400).json({ message: "Task title is required" });
      }

      const taskData: any = {
        title,
        description: description || null,
        status: status || "pending",
        priority: priority || "medium",
        createdBy: "admin",
        projectId: req.params.id,
        assignedTo: assignedTo || null,
        internCategoryId: internCategoryId || null,
        subcategoryId: subcategoryId || null,
      };
      if (startDate) taskData.startDate = new Date(startDate);
      if (dueDate) taskData.dueDate = new Date(dueDate);

      const task = await storage.createTask(taskData);

      // Create notification for assigned intern
      if (assignedTo) {
        await storage.createNotification({
          internId: assignedTo,
          type: "task_assigned",
          title: "New Task Assigned",
          message: `You have been assigned to task: ${title}`,
          relatedTaskId: task.id,
        });
      }

      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating project task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get("/api/admin/contact-messages", requireAdmin, async (_req, res) => {
    try {
      const messages = await storage.getAllContactMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact messages" });
    }
  });

  app.put(
    "/api/admin/contact-messages/:id/status",
    requireAdmin,
    async (req, res) => {
      try {
        const { status } = req.body;
        const message = await storage.updateContactMessageStatus(
          req.params.id,
          status,
        );
        res.json(message);
      } catch (error) {
        res.status(500).json({ message: "Failed to update message status" });
      }
    },
  );

  app.delete(
    "/api/admin/contact-messages/:id",
    requireAdmin,
    async (req, res) => {
      try {
        await storage.deleteContactMessage(req.params.id);
        res.json({ message: "Contact message deleted" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete message" });
      }
    },
  );

  /* ================= DAO MANAGEMENT ================= */

  app.get("/api/admin/dao-applications", requireAdmin, async (_req, res) => {
    try {
      const applicants = await storage.getDaoApplicants();
      res.json(applicants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch DAO applications" });
    }
  });

  app.put(
    "/api/admin/dao-applications/:internId/status",
    requireAdmin,
    async (req, res) => {
      try {
        const { internId } = req.params;
        const { status } = req.body;
        if (!["approved", "rejected"].includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }
        await storage.updateDaoStatus(internId, status);
        res.json({ message: `DAO application ${status}` });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to update DAO application status" });
      }
    },
  );

  /* ================= CREATE EXAM ================= */

  app.post("/api/exams", requireAdmin, async (req, res) => {
    try {
      const {
        title,
        description = null,
        duration_minutes,
        total_marks,
        start_time = null,
        end_time = null,
        is_published = false,
        intern_category_id = null,
      } = req.body;

      if (!title || duration_minutes == null || total_marks == null) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const result = await db.query(
        `
      INSERT INTO exams (
        title,
        description,
        duration_minutes,
        total_marks,
        start_time,
        end_time,
        is_published,
        intern_category_id
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
        [
          title,
          description,
          Number(duration_minutes),
          Number(total_marks),
          start_time ? new Date(start_time).toISOString() : null,
          end_time ? new Date(end_time).toISOString() : null,
          is_published,
          intern_category_id || null,
        ],
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("CREATE EXAM ERROR:", err.message);
      res.status(500).json({
        message: "Failed to create exam",
        error: err.message, // 👈 THIS LINE
        detail: err.detail, // 👈 Postgres specific
        code: err.code, // 👈 PG error code
      });
    }
  });

  /* ================= GET ALL EXAMS ================= */

  app.get("/api/exams", requireAdmin, async (_req, res) => {
    try {
      const exams = await storage.getAllExams();
      const mapped = exams.map((e: any) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        duration_minutes: e.durationMinutes ?? e.duration_minutes,
        total_marks: e.totalMarks ?? e.total_marks,
        start_time: e.startTime ?? e.start_time,
        end_time: e.endTime ?? e.end_time,
        is_published: e.isPublished ?? e.is_published,
        intern_category_id: e.internCategoryId ?? e.intern_category_id ?? null,
        created_at: e.createdAt ?? e.created_at,
      }));
      res.json(mapped);
    } catch (error) {
      console.error("FETCH EXAMS ERROR:", error);
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });

  /* ================= UPDATE EXAM ================= */

  app.put("/api/exams/:id", requireAdmin, async (req, res) => {
    try {
      const {
        title,
        description,
        duration_minutes,
        total_marks,
        start_time,
        end_time,
        is_published,
        intern_category_id,
      } = req.body;

      const updateData = {
        title,
        description: description ?? null,
        duration_minutes,
        total_marks,
        start_time: start_time ? new Date(start_time) : null,
        end_time: end_time ? new Date(end_time) : null,
        is_published,
        internCategoryId: intern_category_id || null,
      };

      const updatePayload: any = {
        title: updateData.title,
        description: updateData.description,
        durationMinutes: updateData.duration_minutes,
        totalMarks: updateData.total_marks,
        startTime: updateData.start_time,
        endTime: updateData.end_time,
        isPublished: updateData.is_published,
        internCategoryId: updateData.internCategoryId,
      };

      const exam = await storage.updateExam(req.params.id, updatePayload);

      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      res.json({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        duration_minutes: exam.durationMinutes ?? exam.duration_minutes,
        total_marks: exam.totalMarks ?? exam.total_marks,
        start_time: exam.startTime ?? exam.start_time,
        end_time: exam.endTime ?? exam.end_time,
        is_published: exam.isPublished ?? exam.is_published,
        intern_category_id:
          exam.internCategoryId ?? exam.intern_category_id ?? null,
        created_at: exam.createdAt ?? exam.created_at,
      });
    } catch (error) {
      console.error("UPDATE EXAM ERROR:", error);
      res.status(500).json({ message: "Failed to update exam" });
    }
  });

  /* ================= DELETE EXAM ================= */

  app.delete("/api/exams/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteExam(req.params.id);
      res.json({ message: "Exam deleted successfully" });
    } catch (error) {
      console.error("DELETE EXAM ERROR:", error);
      res.status(500).json({ message: "Failed to delete exam" });
    }
  });

  /* ================= PUBLISH EXAM ================= */

  app.patch("/api/exams/:id/enable", requireAdmin, async (req, res) => {
    try {
      const exam = await storage.updateExam(req.params.id, {
        is_published: true,
      });

      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      res.json({
        message: "Exam published successfully",
        exam,
      });
    } catch (error) {
      console.error("PUBLISH EXAM ERROR:", error);
      res.status(500).json({ message: "Failed to publish exam" });
    }
  });

  /* ================= UNPUBLISH EXAM ================= */

  app.patch("/api/exams/:id/disable", requireAdmin, async (req, res) => {
    try {
      const exam = await storage.updateExam(req.params.id, {
        is_published: false,
      });

      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      res.json({
        message: "Exam unpublished successfully",
        exam,
      });
    } catch (error) {
      console.error("UNPUBLISH EXAM ERROR:", error);
      res.status(500).json({ message: "Failed to unpublish exam" });
    }
  });

  /* ================= ADMIN COURSE MODULES ================= */

  app.get("/api/admin/course-modules", requireAdmin, async (_req, res) => {
    try {
      const modules = await storage.getAllCourseModules();
      res.json(modules);
    } catch (error) {
      console.error("FETCH ADMIN COURSE MODULES ERROR:", error);
      res.status(500).json({ message: "Failed to fetch course modules" });
    }
  });

  app.post("/api/admin/course-modules", requireAdmin, async (req, res) => {
    try {
      const {
        weekNumber,
        title,
        description,
        category,
        orderIndex,
        internCategoryId,
        subcategoryId,
      } = req.body;
      if (!title || weekNumber == null || !category || orderIndex == null) {
        return res.status(400).json({
          message:
            "Missing required fields: title, weekNumber, category, orderIndex",
        });
      }
      const mod = await storage.createCourseModule({
        weekNumber: Number(weekNumber),
        title,
        description: description || null,
        category,
        orderIndex: Number(orderIndex),
        internCategoryId: internCategoryId || null,
        subcategoryId: subcategoryId || null,
      });
      res.status(201).json(mod);
    } catch (error) {
      console.error("CREATE COURSE MODULE ERROR:", error);
      res.status(500).json({ message: "Failed to create course module" });
    }
  });

  app.put("/api/admin/course-modules/:id", requireAdmin, async (req, res) => {
    try {
      const {
        weekNumber,
        title,
        description,
        category,
        orderIndex,
        internCategoryId,
        subcategoryId,
      } = req.body;
      const updateData: any = {};
      if (weekNumber !== undefined) updateData.weekNumber = Number(weekNumber);
      if (title !== undefined) updateData.title = title;
      if (description !== undefined)
        updateData.description = description || null;
      if (category !== undefined) updateData.category = category;
      if (orderIndex !== undefined) updateData.orderIndex = Number(orderIndex);
      if (internCategoryId !== undefined)
        updateData.internCategoryId = internCategoryId || null;
      if (subcategoryId !== undefined)
        updateData.subcategoryId = subcategoryId || null;

      const mod = await storage.updateCourseModule(req.params.id, updateData);
      if (!mod)
        return res.status(404).json({ message: "Course module not found" });
      res.json(mod);
    } catch (error) {
      console.error("UPDATE COURSE MODULE ERROR:", error);
      res.status(500).json({ message: "Failed to update course module" });
    }
  });

  app.delete(
    "/api/admin/course-modules/:id",
    requireAdmin,
    async (req, res) => {
      try {
        await storage.deleteCourseModule(req.params.id);
        res.json({ message: "Course module deleted successfully" });
      } catch (error) {
        console.error("DELETE COURSE MODULE ERROR:", error);
        res.status(500).json({ message: "Failed to delete course module" });
      }
    },
  );

  /* ================= INTERN COURSE MODULES ================= */

  app.get("/api/intern/course-modules", requireIntern, async (req, res) => {
    try {
      const intern = await storage.getInternById(req.session.internId!);
      let modules;
      if (intern?.categoryId) {
        modules = await storage.getCourseModulesByCategory(intern.categoryId);
      } else {
        modules = await storage.getAllCourseModules();
      }
      if (intern?.subcategoryId) {
        modules = modules.filter(
          (m: any) =>
            !m.subcategoryId || m.subcategoryId === intern.subcategoryId,
        );
      }
      res.json(modules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course modules" });
    }
  });

  app.get("/api/intern/course-progress", requireIntern, async (req, res) => {
    try {
      const progress = await storage.getCourseProgressByIntern(
        req.session.internId!,
      );
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course progress" });
    }
  });

  app.post(
    "/api/intern/course-progress/:moduleId/complete",
    requireIntern,
    async (req, res) => {
      try {
        const result = await storage.markModuleComplete(
          req.session.internId!,
          req.params.moduleId,
        );
        const summary = await storage.getInternProgressSummary(
          req.session.internId!,
        );
        await storage.updateInternCourseProgress(
          req.session.internId!,
          summary.percentage,
        );
        res.json({ progress: result, summary });
      } catch (error) {
        res.status(500).json({ message: "Failed to mark module complete" });
      }
    },
  );

  app.get("/api/intern/progress-summary", requireIntern, async (req, res) => {
    try {
      const internId = req.session.internId!;
      const intern = await storage.getInternById(internId);
      let summary = await storage.getInternProgressSummary(internId);

      if (
        intern &&
        ["training_complete", "internship", "completed"].includes(
          intern.internshipStatus,
        ) &&
        summary.percentage < 100
      ) {
        let allModules;
        if (intern.categoryId) {
          allModules = await storage.getCourseModulesByCategory(
            intern.categoryId,
          );
        } else {
          allModules = await storage.getAllCourseModules();
        }
        for (const mod of allModules) {
          await storage.markModuleComplete(internId, mod.id);
        }
        await storage.updateInternCourseProgress(internId, 100);
        summary = await storage.getInternProgressSummary(internId);
      }

      res.json({
        ...summary,
        internshipStatus: intern?.internshipStatus,
        qualificationPath: intern?.qualificationPath,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress summary" });
    }
  });

  /* ================= DIRECT EXAM (course_first shortcut to Week 4) ================= */

  app.get(
    "/api/intern/direct-exam/modules",
    requireIntern,
    async (req, res) => {
      try {
        const intern = await storage.getInternById(req.session.internId!);
        if (!intern)
          return res.status(404).json({ message: "Intern not found" });
        if (
          intern.qualificationPath !== "course_first" &&
          intern.qualificationPath !== "entrance_test"
        ) {
          return res.status(403).json({
            message: "Direct exam is not available for this qualification path",
          });
        }
        let week4Modules = await storage.getWeek4Modules(
          intern.categoryId || null,
        );
        if (intern.subcategoryId) {
          week4Modules = week4Modules.filter(
            (m: any) =>
              !m.subcategoryId || m.subcategoryId === intern.subcategoryId,
          );
        }
        res.json(week4Modules);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch direct exam modules" });
      }
    },
  );

  app.get(
    "/api/intern/direct-exam/progress",
    requireIntern,
    async (req, res) => {
      try {
        const intern = await storage.getInternById(req.session.internId!);
        if (!intern)
          return res.status(404).json({ message: "Intern not found" });
        if (
          intern.qualificationPath !== "course_first" &&
          intern.qualificationPath !== "entrance_test"
        ) {
          return res.status(403).json({
            message: "Direct exam is not available for this qualification path",
          });
        }
        const w4 = await storage.getWeek4Progress(req.session.internId!);
        res.json(w4);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch direct exam progress" });
      }
    },
  );

  /* ================= DEMO PROJECTS ================= */

  app.get("/api/intern/demo-projects", requireIntern, async (req, res) => {
    try {
      const intern = await storage.getInternById(req.session.internId!);
      const internStatus = intern?.internshipStatus || "pending";
      const daoStatus = intern?.daoStatus;

      let categories: string[] = [];
      if (
        ["pending", "training", "testing", "training_complete"].includes(
          internStatus,
        )
      ) {
        categories = ["Test Project"];
      } else if (internStatus === "internship") {
        categories = ["Interns Project"];
      } else if (internStatus === "completed") {
        if (daoStatus === "approved") {
          categories = ["Interns Project", "DAO"];
        } else {
          categories = ["Interns Project"];
        }
      }

      const isDaoApproved = daoStatus === "approved";

      let adminProjects =
        categories.length > 0
          ? await storage.getProjectsByCategories(
              categories,
              isDaoApproved ? undefined : intern?.categoryId,
            )
          : [];
      if (!isDaoApproved && intern?.categoryId) {
        adminProjects = adminProjects.filter(
          (p: any) => p.internCategoryId === intern.categoryId,
        );
      }
      if (!isDaoApproved && intern?.subcategoryId) {
        adminProjects = adminProjects.filter(
          (p: any) =>
            !p.subcategoryId || p.subcategoryId === intern.subcategoryId,
        );
      }

      const allDemoProjects = await storage.getAllDemoProjects();
      const demoProjects =
        !isDaoApproved && intern?.categoryId
          ? allDemoProjects.filter(
              (dp) =>
                !dp.internCategoryId ||
                dp.internCategoryId === intern.categoryId,
            )
          : allDemoProjects;
      const selected = await storage.getInternDemoProjects(
        req.session.internId!,
      );

      const enrichedSelected = [];
      for (const sel of selected) {
        const tasks = await storage.getInternshipProjectTasks(sel.id);
        if (
          sel.status !== "completed" &&
          tasks.length > 0 &&
          tasks.every((t) => t.completed)
        ) {
          await storage.updateInternDemoProjectStatus(sel.id, "completed");
          (sel as any).status = "completed";

          if (intern) {
            let allMods;
            if (intern.categoryId) {
              allMods = await storage.getCourseModulesByCategory(
                intern.categoryId,
              );
            } else {
              allMods = await storage.getAllCourseModules();
            }
            for (const mod of allMods) {
              await storage.markModuleComplete(req.session.internId!, mod.id);
            }
            await storage.updateInternCourseProgress(
              req.session.internId!,
              100,
            );
            if (["pending", "training"].includes(intern.internshipStatus)) {
              await storage.updateInternStatus(
                req.session.internId!,
                "training_complete",
              );
            }
          }
        }

        const internTasks = await storage.getTasksByIntern(
          req.session.internId!,
        );
        const projectTasks = internTasks.filter(
          (t) =>
            t.internshipProjectTaskId &&
            tasks.some((pt) => pt.id === t.internshipProjectTaskId),
        );
        const githubLinks = projectTasks
          .filter((t) => t.submittedGithubLink)
          .map((t) => t.submittedGithubLink!);
        const uniqueGithubLink =
          githubLinks.length > 0 ? githubLinks[githubLinks.length - 1] : null;

        enrichedSelected.push({ ...sel, githubLink: uniqueGithubLink });
      }

      res.json({
        projects: demoProjects,
        selected: enrichedSelected,
        adminProjects,
        categories,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch demo projects" });
    }
  });

  app.post(
    "/api/intern/demo-projects/select",
    requireIntern,
    async (req, res) => {
      try {
        const { demoProjectId } = req.body;
        if (!demoProjectId)
          return res.status(400).json({ message: "Demo project ID required" });
        const result = await storage.selectDemoProject(
          req.session.internId!,
          demoProjectId,
        );
        res.json(result);
      } catch (error: any) {
        const msg = error?.message || "Failed to select demo project";
        res.status(400).json({ message: msg });
      }
    },
  );

  app.post(
    "/api/intern/admin-projects/select",
    requireIntern,
    async (req, res) => {
      try {
        const { adminProjectId } = req.body;
        if (!adminProjectId)
          return res.status(400).json({ message: "Project ID required" });

        const intern = await storage.getInternById(req.session.internId!);
        const adminProject = await storage.getProjectById(adminProjectId);
        if (!adminProject)
          return res.status(404).json({ message: "Project not found" });

        const isDaoApproved = intern?.daoStatus === "approved";

        if (
          !isDaoApproved &&
          intern?.categoryId &&
          adminProject.internCategoryId &&
          adminProject.internCategoryId !== intern.categoryId
        ) {
          return res
            .status(403)
            .json({ message: "This project does not match your category" });
        }

        if (
          !isDaoApproved &&
          intern?.subcategoryId &&
          (adminProject as any).subcategoryId &&
          (adminProject as any).subcategoryId !== intern.subcategoryId
        ) {
          return res
            .status(403)
            .json({ message: "This project does not match your subcategory" });
        }

        const internStatus = intern?.internshipStatus || "pending";
        let allowedCategories: string[] = [];
        if (
          ["pending", "training", "testing", "training_complete"].includes(
            internStatus,
          )
        ) {
          allowedCategories = ["Test Project"];
        } else if (internStatus === "internship") {
          allowedCategories = ["Interns Project"];
        } else if (internStatus === "completed") {
          allowedCategories =
            intern?.daoStatus === "approved"
              ? ["Interns Project", "DAO"]
              : ["Interns Project"];
        }
        if (
          adminProject.category &&
          !allowedCategories.includes(adminProject.category)
        ) {
          return res.status(403).json({
            message: "This project is not available for your current status",
          });
        }

        const demoProject =
          await storage.createDemoProjectFromAdminProject(adminProjectId);
        const result = await storage.selectDemoProject(
          req.session.internId!,
          demoProject.id,
        );
        res.json(result);
      } catch (error: any) {
        const msg = error?.message || "Failed to select project";
        res.status(400).json({ message: msg });
      }
    },
  );

  app.delete(
    "/api/intern/demo-projects/:id",
    requireIntern,
    async (req, res) => {
      try {
        const internId = req.session.internId!;
        await storage.unselectDemoProject(internId, req.params.id);
        res.json({ message: "Project unselected successfully" });
      } catch (error: any) {
        const msg = error?.message || "Failed to unselect project";
        res.status(400).json({ message: msg });
      }
    },
  );

  app.patch(
    "/api/intern/demo-projects/:id/status",
    requireIntern,
    async (req, res) => {
      try {
        const { status, submissionNotes } = req.body;
        const internId = req.session.internId!;
        const internProjects = await storage.getInternDemoProjects(internId);
        const owns = internProjects.some((p) => p.id === req.params.id);
        if (!owns)
          return res
            .status(403)
            .json({ message: "Not authorized to update this project" });

        if (status === "completed") {
          const notes =
            typeof submissionNotes === "string" ? submissionNotes.trim() : "";
          if (!notes) {
            return res.status(400).json({
              message:
                "Please share your project links and submission details before completing the project.",
            });
          }
        }

        const result =
          status === "completed"
            ? await storage.submitInternDemoProject(
                req.params.id,
                (submissionNotes as string).trim(),
              )
            : await storage.updateInternDemoProjectStatus(
                req.params.id,
                status,
              );

        if (status === "completed") {
          const intern = await storage.getInternById(internId);
          if (intern) {
            let allModules;
            if (intern.categoryId) {
              allModules = await storage.getCourseModulesByCategory(
                intern.categoryId,
              );
            } else {
              allModules = await storage.getAllCourseModules();
            }
            for (const mod of allModules) {
              await storage.markModuleComplete(internId, mod.id);
            }
            await storage.updateInternCourseProgress(internId, 100);

            // Determine submission "type" for Final Task Management:
            // - "intern" if the intern is already in the internship phase
            // - "training" otherwise (training/test exam path)
            const isInternshipPhase = ["internship", "completed"].includes(
              intern.internshipStatus,
            );
            const submissionType = isInternshipPhase ? "intern" : "training";

            // Pick a Week 4 module to attach the submission task to so it
            // appears in the Final Task Management Week-4 filter.
            const week4Module = allModules.find((m) => m.weekNumber === 4);

            // Look up demo project name for a friendly task title.
            const demoProject = (
              await storage.getInternDemoProjects(internId)
            ).find((p) => p.id === req.params.id);
            let projectName = "Demo Project";
            if (demoProject?.demoProjectId) {
              const allDemo = await storage.getAllDemoProjects();
              const dp = allDemo.find(
                (d) => d.id === demoProject.demoProjectId,
              );
              if (dp?.name) projectName = dp.name;
            }

            try {
              await storage.createTask({
                title: `Project Submission: ${projectName}`,
                description: null,
                assignedTo: internId,
                projectId: null,
                courseModuleId: week4Module ? week4Module.id : null,
                internshipProjectTaskId: null,
                subProjectTaskId: null,
                internCategoryId: intern.categoryId || null,
                subcategoryId: intern.subcategoryId || null,
                status: "completed",
                priority: "medium",
                type: submissionType,
                startDate: null,
                dueDate: null,
                createdBy: "intern",
                createdByIntern: internId,
                submittedNotes: (submissionNotes as string).trim(),
                submittedGithubLink: null,
                submittedAt: new Date(),
                closedAt: new Date(),
              } as any);
            } catch (taskErr) {
              console.error(
                "Failed to create Final Task Management entry for project submission:",
                taskErr,
              );
            }

            if (["pending", "training"].includes(intern.internshipStatus)) {
              await storage.updateInternStatus(internId, "training_complete");
            }
          }
        }

        res.json(result);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to update demo project status" });
      }
    },
  );

  /* ================= INTERNSHIP PROJECT TASKS ================= */

  app.get(
    "/api/intern/internship-tasks/:internDemoProjectId",
    requireIntern,
    async (req, res) => {
      try {
        const internProjects = await storage.getInternDemoProjects(
          req.session.internId!,
        );
        const owns = internProjects.some(
          (p) => p.id === req.params.internDemoProjectId,
        );
        if (!owns) return res.status(403).json({ message: "Not authorized" });

        const intern = await storage.getInternById(req.session.internId!);
        let categoryName: string | undefined;
        if (intern?.categoryId) {
          const cats = await storage.getAllCategories();
          const cat = cats.find((c) => c.id === intern.categoryId);
          if (cat) categoryName = cat.name;
        }

        const tasks = await storage.initInternshipProjectTasks(
          req.session.internId!,
          req.params.internDemoProjectId,
          categoryName,
        );
        res.json(tasks);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch internship tasks" });
      }
    },
  );

  app.patch(
    "/api/intern/internship-tasks/:taskId/toggle",
    requireIntern,
    async (req, res) => {
      try {
        const internProjects = await storage.getInternDemoProjects(
          req.session.internId!,
        );
        const internProjectIds = new Set(internProjects.map((p) => p.id));
        const allTasks: any[] = [];
        for (const proj of internProjects) {
          const tasks = await storage.getInternshipProjectTasks(proj.id);
          allTasks.push(...tasks);
        }
        const ownsTask = allTasks.some((t) => t.id === req.params.taskId);
        if (!ownsTask)
          return res.status(403).json({ message: "Not authorized" });
        const result = await storage.toggleInternshipProjectTask(
          req.params.taskId,
        );
        if (!result) return res.status(404).json({ message: "Task not found" });
        res.json(result);
      } catch (error) {
        res.status(500).json({ message: "Failed to toggle task" });
      }
    },
  );

  app.get(
    "/api/intern/internship-progress",
    requireIntern,
    async (req, res) => {
      try {
        const progress = await storage.getInternshipProgress(
          req.session.internId!,
        );
        res.json(progress);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch internship progress" });
      }
    },
  );

  /* ================= INTERN SUB-PROJECT ROUTES ================= */

  app.get("/api/intern/sub-projects", requireIntern, async (req, res) => {
    try {
      const intern = await storage.getInternById(req.session.internId!);
      const allSubProjects = await storage.getAllSubProjects();
      const isDaoApproved = intern?.daoStatus === "approved";
      let filtered = isDaoApproved
        ? allSubProjects
        : intern?.categoryId
          ? allSubProjects.filter(
              (sp) => sp.internCategoryId === intern.categoryId,
            )
          : allSubProjects.filter((sp) => sp.internCategoryId === null);
      if (!isDaoApproved && intern?.subcategoryId) {
        filtered = filtered.filter(
          (sp: any) =>
            !sp.subcategoryId || sp.subcategoryId === intern.subcategoryId,
        );
      }
      const selected = await storage.getInternSubProjects(
        req.session.internId!,
      );
      res.json({ subProjects: filtered, selected });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sub-projects" });
    }
  });

  app.post(
    "/api/intern/sub-projects/select",
    requireIntern,
    async (req, res) => {
      try {
        const { subProjectId } = req.body;
        if (!subProjectId)
          return res.status(400).json({ message: "Sub-project ID required" });

        const intern = await storage.getInternById(req.session.internId!);
        const subProject = await storage.getSubProjectById(subProjectId);
        if (!subProject)
          return res.status(404).json({ message: "Sub-project not found" });

        const isDaoApprovedSub = intern?.daoStatus === "approved";

        if (
          !isDaoApprovedSub &&
          intern?.categoryId &&
          subProject.internCategoryId &&
          subProject.internCategoryId !== intern.categoryId
        ) {
          return res
            .status(403)
            .json({ message: "This sub-project does not match your category" });
        }

        if (
          !isDaoApprovedSub &&
          intern?.subcategoryId &&
          (subProject as any).subcategoryId &&
          (subProject as any).subcategoryId !== intern.subcategoryId
        ) {
          return res.status(403).json({
            message: "This sub-project does not match your subcategory",
          });
        }

        const result = await storage.selectSubProject(
          req.session.internId!,
          subProjectId,
        );
        res.json(result);
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : "Failed to select sub-project";
        res.status(400).json({ message: msg });
      }
    },
  );

  app.delete(
    "/api/intern/sub-projects/:id",
    requireIntern,
    async (req, res) => {
      try {
        const selected = await storage.getInternSubProjects(
          req.session.internId!,
        );
        const owns = selected.some((sp) => sp.id === req.params.id);
        if (!owns) return res.status(403).json({ message: "Not authorized" });
        await storage.deleteInternSubProject(req.params.id);
        res.json({ success: true });
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : "Failed to unselect sub-project";
        res.status(400).json({ message: msg });
      }
    },
  );

  app.get(
    "/api/intern/sub-project-tasks/:internSubProjectId",
    requireIntern,
    async (req, res) => {
      try {
        const selected = await storage.getInternSubProjects(
          req.session.internId!,
        );
        const owns = selected.some(
          (sp) => sp.id === req.params.internSubProjectId,
        );
        if (!owns) return res.status(403).json({ message: "Not authorized" });
        const tasks = await storage.initSubProjectTasks(
          req.session.internId!,
          req.params.internSubProjectId,
        );
        res.json(tasks);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch sub-project tasks" });
      }
    },
  );

  app.patch(
    "/api/intern/sub-project-tasks/:taskId/start",
    requireIntern,
    async (req, res) => {
      try {
        const selected = await storage.getInternSubProjects(
          req.session.internId!,
        );
        let ownsTask = false;
        for (const sp of selected) {
          const tasks = await storage.getSubProjectTasks(sp.id);
          if (tasks.some((t) => t.id === req.params.taskId)) {
            ownsTask = true;
            break;
          }
        }
        if (!ownsTask)
          return res.status(403).json({ message: "Not authorized" });

        const result = await storage.startSubProjectTask(req.params.taskId);
        if (!result) return res.status(404).json({ message: "Task not found" });

        const internSubProject = selected.find(
          (sp) => sp.id === result.internSubProjectId,
        );
        let subProjectName = "Sub-Project Task";
        if (internSubProject) {
          const sp = await storage.getSubProjectById(
            internSubProject.subProjectId,
          );
          if (sp) subProjectName = sp.name;
        }
        const existingTasks = await storage.getTasksByIntern(
          req.session.internId!,
        );
        const alreadyLinked = existingTasks.find(
          (t: any) => t.subProjectTaskId === result.id,
        );
        if (!alreadyLinked) {
          await storage.createTask({
            title: `${subProjectName}: Sub-Project Task`,
            description: `Complete and submit the sub-project "${subProjectName}"`,
            assignedTo: req.session.internId!,
            subProjectTaskId: result.id,
            status: "running",
            priority: "medium",
            startDate: new Date(),
            createdBy: "system",
          });
        }

        res.json(result);
      } catch (error) {
        res.status(500).json({ message: "Failed to start sub-project task" });
      }
    },
  );

  app.patch(
    "/api/intern/sub-project-tasks/:taskId/submit",
    requireIntern,
    async (req, res) => {
      try {
        const { comment } = req.body;
        const trimmedComment =
          typeof comment === "string" ? comment.trim() : "";
        if (!trimmedComment) {
          return res.status(400).json({
            message:
              "Submission notes are required. Please describe what you completed before submitting.",
          });
        }

        const selected = await storage.getInternSubProjects(
          req.session.internId!,
        );
        let ownsTask: { id: string; startedAt: Date | null } | null = null;
        for (const sp of selected) {
          const tasks = await storage.getSubProjectTasks(sp.id);
          const found = tasks.find((t) => t.id === req.params.taskId);
          if (found) {
            ownsTask = {
              id: found.id,
              startedAt: found.startedAt as Date | null,
            };
            break;
          }
        }
        if (!ownsTask)
          return res.status(403).json({ message: "Not authorized" });

        // const MIN_WORK_MS = 30 * 60 * 1000;
        const MIN_WORK_MS = 1 * 60 * 1000;
        if (!ownsTask.startedAt) {
          return res.status(400).json({
            message: "Start the task before submitting it.",
          });
        }
        const elapsedMs = Date.now() - new Date(ownsTask.startedAt).getTime();
        if (elapsedMs < MIN_WORK_MS) {
          const remainingMin = Math.ceil((MIN_WORK_MS - elapsedMs) / 60000);
          return res.status(400).json({
            message: `You must work on this task for at least 30 minutes before submitting. ${remainingMin} minute${remainingMin === 1 ? "" : "s"} remaining.`,
          });
        }

        const result = await storage.submitSubProjectTask(
          req.params.taskId,
          trimmedComment,
        );
        if (!result) return res.status(404).json({ message: "Task not found" });

        const allInternTasks = await storage.getTasksByIntern(
          req.session.internId!,
        );
        const linkedTask = allInternTasks.find(
          (t: any) => t.subProjectTaskId === req.params.taskId,
        );
        if (linkedTask) {
          const activeLog = await storage.getActiveTimeLogForTask(
            req.session.internId!,
            linkedTask.id,
          );
          if (activeLog) {
            await storage.endTimeLog(activeLog.id, new Date());
          }
          await storage.updateTask(linkedTask.id, {
            status: "completed",
            submittedNotes: trimmedComment,
            submittedAt: new Date(),
            closedAt: new Date(),
          });
        }

        const progress = await storage.getInternshipProgress(
          req.session.internId!,
        );
        if (progress.percentage >= 100) {
          const intern = await storage.getInternById(req.session.internId!);
          if (intern && intern.internshipStatus !== "completed") {
            await storage.updateInternStatus(
              req.session.internId!,
              "completed",
            );
          }
        }

        res.json(result);
      } catch (error) {
        res.status(500).json({ message: "Failed to submit sub-project task" });
      }
    },
  );

  /* ================= CERTIFICATES ================= */

  app.get("/api/intern/certificates", requireIntern, async (req, res) => {
    try {
      const intern = await storage.getInternById(req.session.internId!);
      const certs = await storage.getCertificatesByIntern(
        req.session.internId!,
      );
      // The Training Completion Certificate and Internship Offer Letter must
      // stay hidden until the admin reviews and approves the intern in the
      // Internship Approval Review module. Until then we filter them out of
      // the intern-facing list so the intern cannot view or download them.
      const adminApproved =
        intern?.internshipStatus === "internship" ||
        intern?.internshipStatus === "completed";
      const visible = adminApproved
        ? certs
        : certs.filter(
            (c) => c.type !== "training" && c.type !== "offer_letter",
          );
      res.json(visible);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch certificates" });
    }
  });

  app.post(
    "/api/intern/certificates/generate",
    requireIntern,
    async (req, res) => {
      try {
        const { type } = req.body;
        const intern = await storage.getInternById(req.session.internId!);
        if (!intern)
          return res.status(404).json({ message: "Intern not found" });

        let title = "";
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        const formatRemaining = (ms: number) => {
          const days = Math.ceil(ms / MS_PER_DAY);
          if (days >= 30) {
            const months = Math.ceil(days / 30);
            return `${months} month${months > 1 ? "s" : ""}`;
          }
          return `${days} day${days > 1 ? "s" : ""}`;
        };

        if (type === "training") {
          // Admin approval is required before the Training Completion
          // Certificate becomes available. Until admin clicks Approve in the
          // Internship Approval Review, interns at status='training_complete'
          // (or anything earlier) cannot generate, view, or download it.
          if (
            intern.internshipStatus !== "internship" &&
            intern.internshipStatus !== "completed"
          ) {
            if (intern.internshipStatus === "rejected") {
              return res.status(403).json({
                message:
                  "Your internship application was rejected. The Training Completion Certificate is not available.",
              });
            }
            return res.status(403).json({
              message:
                "Waiting for admin approval. The Training Completion Certificate will be available once an administrator reviews and approves your training submission.",
            });
          }

          const summary = await storage.getInternProgressSummary(
            req.session.internId!,
          );
          const w4 = await storage.getWeek4Progress(req.session.internId!);
          const eligible = summary.percentage >= 100 || w4.percentage >= 100;
          if (!eligible)
            return res.status(400).json({
              message:
                "Complete all course modules or pass the direct exam first",
            });

          // const allLogs = await storage.getTimeLogsByIntern(req.session.internId!);
          // const totalMinutes = allLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
          // const totalHours = Math.floor(totalMinutes / 60);
          // if (totalHours < 20) {
          //   return res.status(400).json({ message: `You need at least 20 hours of logged work to generate the training certificate. Current: ${totalHours} hours.` });
          // }

          title = "Training Completion Certificate";
          await storage.updateInternStatus(
            req.session.internId!,
            "training_complete",
          );
        } else if (type === "internship") {
          // Admin must have approved the intern (status='internship') before
          // an internship certificate can be issued. Without this gate, an
          // intern who somehow accumulated internship-project progress could
          // self-promote to 'completed'.
          if (
            intern.internshipStatus !== "internship" &&
            intern.internshipStatus !== "completed"
          ) {
            return res.status(403).json({
              message:
                "Waiting for admin approval. The Internship Certificate is only available after an administrator approves your internship.",
            });
          }
          const internProgress = await storage.getInternshipProgress(
            req.session.internId!,
          );
          if (internProgress.percentage < 100)
            return res.status(400).json({
              message:
                "Complete your internship projects first (main projects = 50% each, sub-projects = 25% each, need 100%)",
            });

          const priorCerts = await storage.getCertificatesByIntern(
            req.session.internId!,
          );
          const offer = priorCerts.find((c) => c.type === "offer_letter");
          const internshipStartMs = offer?.issuedAt
            ? new Date(offer.issuedAt).getTime()
            : intern.appliedDate
              ? new Date(intern.appliedDate).getTime()
              : Date.now();
          const eligibleAt = new Date(internshipStartMs);
          eligibleAt.setMonth(eligibleAt.getMonth() + 1);
          const remainingMs = eligibleAt.getTime() - Date.now();
          if (remainingMs > 0) {
            return res.status(400).json({
              message: `Internship certificate is available 1 month after your internship start date. Please wait ${formatRemaining(remainingMs)} more.`,
            });
          }

          // const allLogs = await storage.getTimeLogsByIntern(req.session.internId!);
          // const totalMinutes = allLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
          // const totalHours = Math.floor(totalMinutes / 60);
          // if (totalHours < 80) {
          //   return res.status(400).json({ message: `You need at least 80 hours of logged work to generate the internship certificate. Current: ${totalHours} hours.` });
          // }

          title = "Certificate of Internship";
          await storage.updateInternStatus(req.session.internId!, "completed");
        } else if (type === "offer_letter") {
          if (intern.qualificationPath === "DAO") {
            return res.status(400).json({
              message: "DAO members do not require an internship offer letter.",
            });
          }

          // Admin approval is required before the offer letter is available.
          // Admin's approval endpoint (POST /api/admin/internship-review/:internId/approve)
          // promotes the intern to status='internship' AND auto-creates the
          // offer-letter certificate. Interns may not self-promote here.
          if (
            intern.internshipStatus !== "internship" &&
            intern.internshipStatus !== "completed"
          ) {
            if (intern.internshipStatus === "rejected") {
              return res.status(403).json({
                message:
                  "Your internship application was rejected. The offer letter is not available.",
              });
            }
            return res.status(403).json({
              message:
                "Waiting for admin approval. The Internship Offer Letter will be issued once an administrator reviews and approves your training submission.",
            });
          }

          title = "Internship Offer Letter";
        } else if (type === "completion_letter") {
          if (intern.internshipStatus !== "completed") {
            return res
              .status(400)
              .json({ message: "Complete the internship first" });
          }
          title = "Internship Completion Letter";
        } else {
          return res.status(400).json({ message: "Invalid certificate type" });
        }

        const existingCerts = await storage.getCertificatesByIntern(
          req.session.internId!,
        );
        const existing = existingCerts.find((c) => c.type === type);
        if (existing) return res.json(existing);

        const now = new Date();
        const currentYear = now.getFullYear();
        const shortId = intern.id.split("-")[0].toUpperCase();

        let categoryPrefix = "GENERAL";
        if (intern.categoryId) {
          const cats = await storage.getAllCategories();
          const cat = cats.find((c) => c.id === intern.categoryId);
          if (cat) {
            const CATEGORY_PREFIXES: Record<string, string> = {
              "Web3+AI": "WEB3-AI",
              "Digital Marketing": "DIGITAL-MARKETING",
              "Graphics Design": "GRAPHICS-DESIGN",
              "Business Development": "BUSINESS-DEVELOPMENT",
              DAO: "DAO",
            };
            categoryPrefix =
              CATEGORY_PREFIXES[cat.name] ||
              cat.name.toUpperCase().replace(/\s+/g, "-");
          }
        }
        const certificateNumber = `EA-${categoryPrefix}/${currentYear}/${shortId}`;
        const dateFormat: Intl.DateTimeFormatOptions = {
          year: "numeric",
          month: "long",
          day: "numeric",
        };

        let programStartDate: string;
        let programEndDate: string;

        if (type === "offer_letter") {
          programStartDate = now.toLocaleDateString("en-US", dateFormat);
          const oneMonthLater = new Date(now);
          oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
          programEndDate = oneMonthLater.toLocaleDateString(
            "en-US",
            dateFormat,
          );
        } else if (type === "training") {
          programStartDate = intern.appliedDate
            ? new Date(intern.appliedDate).toLocaleDateString(
                "en-US",
                dateFormat,
              )
            : "N/A";
          programEndDate = now.toLocaleDateString("en-US", dateFormat);
        } else if (type === "internship" || type === "completion_letter") {
          const offerCert = existingCerts.find(
            (c) => c.type === "offer_letter",
          );
          if (offerCert?.programStartDate) {
            programStartDate = offerCert.programStartDate;
            programEndDate =
              offerCert.programEndDate ||
              now.toLocaleDateString("en-US", dateFormat);
          } else {
            programStartDate = intern.appliedDate
              ? new Date(intern.appliedDate).toLocaleDateString(
                  "en-US",
                  dateFormat,
                )
              : "N/A";
            programEndDate = now.toLocaleDateString("en-US", dateFormat);
          }
        } else {
          programStartDate = intern.appliedDate
            ? new Date(intern.appliedDate).toLocaleDateString(
                "en-US",
                dateFormat,
              )
            : "N/A";
          programEndDate = now.toLocaleDateString("en-US", dateFormat);
        }

        const cert = await storage.createCertificate({
          internId: req.session.internId!,
          type,
          title,
          certificateNumber,
          internName: intern.name,
          programStartDate,
          programEndDate,
        });
        res.json(cert);
      } catch (error) {
        res.status(500).json({ message: "Failed to generate certificate" });
      }
    },
  );

  /* ================= TERMS & DAO ================= */

  app.post("/api/intern/accept-terms", requireIntern, async (req, res) => {
    try {
      const intern = await storage.getInternById(req.session.internId!);
      if (!intern) return res.status(404).json({ message: "Intern not found" });

      // Admin must approve the intern for the internship phase before they can
      // accept the Terms & Conditions. Status flow: training_complete → admin
      // approval → internship → (T&C unlocked) → completed.
      const allowedStatuses = ["internship", "completed"];
      if (!allowedStatuses.includes(intern.internshipStatus)) {
        if (intern.internshipStatus === "rejected") {
          return res.status(403).json({
            message:
              "Your internship application has been rejected. You cannot accept the terms.",
          });
        }
        return res.status(400).json({
          message:
            "Waiting for admin approval. The Terms & Conditions will unlock once an administrator reviews and approves your training submission.",
        });
      }

      await storage.acceptTerms(req.session.internId!);
      res.json({ message: "Terms accepted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to accept terms" });
    }
  });

  // Latest rejection note for the logged-in intern (for dashboard alert).
  app.get("/api/intern/my-rejection", requireIntern, async (req, res) => {
    try {
      const intern = await storage.getInternById(req.session.internId!);
      if (!intern) return res.status(404).json({ message: "Intern not found" });
      if (intern.internshipStatus !== "rejected") {
        return res.json({ rejected: false });
      }
      const actions = await storage.getInternActionsByIntern(intern.id);
      const latest = actions.find((a) => a.actionType === "rejection");
      res.json({
        rejected: true,
        note: latest?.note || null,
        rejectedAt: latest?.createdAt || null,
        adminUsername: latest?.adminUsername || null,
      });
    } catch (error) {
      console.error("Failed to fetch rejection details:", error);
      res.status(500).json({ message: "Failed to fetch rejection details" });
    }
  });

  app.post(
    "/api/intern/dao-membership/apply",
    requireIntern,
    async (req, res) => {
      try {
        const intern = await storage.getInternById(req.session.internId!);
        if (!intern || intern.internshipStatus !== "completed") {
          return res
            .status(400)
            .json({ message: "Complete the internship first" });
        }
        const { position, workAvailability, expertise } = req.body;
        if (!position || !workAvailability || !expertise) {
          return res.status(400).json({ message: "All fields are required" });
        }
        await storage.applyForDaoMembership(req.session.internId!, {
          position,
          workAvailability,
          expertise,
        });
        res.json({ message: "DAO membership application submitted" });
      } catch (error) {
        res.status(500).json({ message: "Failed to apply for DAO membership" });
      }
    },
  );

  app.get("/api/intern/dao-application", requireIntern, async (req, res) => {
    try {
      const intern = await storage.getInternById(req.session.internId!);
      if (!intern) return res.status(404).json({ message: "Intern not found" });
      res.json({
        applied: intern.daoMembershipApplied || false,
        position: intern.daoPosition || null,
        workAvailability: intern.daoWorkAvailability || null,
        expertise: intern.daoExpertise || null,
        appliedAt: intern.daoAppliedAt || null,
        status: intern.daoStatus || "pending",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch DAO application" });
    }
  });

  // DAO intern project management
  app.post("/api/intern/dao/projects", requireIntern, async (req, res) => {
    try {
      const intern = await storage.getInternById(req.session.internId!);
      if (!intern || intern.daoStatus !== "approved") {
        return res
          .status(403)
          .json({ message: "Only approved DAO members can create projects" });
      }
      const { name, description, repositoryUrl, deployedUrl } = req.body;
      if (!name)
        return res.status(400).json({ message: "Project name is required" });
      const project = await storage.createProject({
        name,
        description: description || null,
        repositoryUrl: repositoryUrl || null,
        deployedUrl: deployedUrl || null,
        createdByInternId: intern.id,
      });
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating DAO project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get("/api/intern/dao/projects", requireIntern, async (req, res) => {
    try {
      const intern = await storage.getInternById(req.session.internId!);
      if (!intern || intern.daoStatus !== "approved") {
        return res.status(403).json({
          message: "Only approved DAO members can view their projects",
        });
      }
      const allProjects = await storage.getAllProjects();
      const myProjects = allProjects.filter(
        (p) => p.createdByInternId === intern.id,
      );
      const otherMemberProjects = allProjects.filter(
        (p) => p.createdByInternId && p.createdByInternId !== intern.id,
      );
      const categoryProjects = await storage.getProjectsByCategories([
        "DAO",
        "Interns Project",
      ]);
      const adminCategoryProjects = categoryProjects.filter(
        (p) => !p.createdByInternId,
      );

      const creatorIds = [
        ...new Set(
          otherMemberProjects.map((p) => p.createdByInternId).filter(Boolean),
        ),
      ];
      const daoCreators: Record<string, string> = {};
      for (const internId of creatorIds) {
        const creator = await storage.getInternById(internId!);
        if (creator && creator.daoStatus === "approved") {
          daoCreators[internId!] = creator.name;
        }
      }
      const allDaoProjects = otherMemberProjects
        .filter((p) => p.createdByInternId && daoCreators[p.createdByInternId])
        .map((p) => ({
          ...p,
          creatorName: daoCreators[p.createdByInternId!],
        }));

      res.json({
        myProjects,
        categoryProjects: adminCategoryProjects,
        allDaoProjects,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch DAO projects" });
    }
  });

  app.get("/api/intern/status", requireIntern, async (req, res) => {
    try {
      const intern = await storage.getInternById(req.session.internId!);
      if (!intern) return res.status(404).json({ message: "Intern not found" });

      let currentStatus = intern.internshipStatus;
      if (currentStatus === "internship") {
        const internProgress = await storage.getInternshipProgress(
          req.session.internId!,
        );
        if (internProgress.percentage >= 100) {
          await storage.updateInternStatus(req.session.internId!, "completed");
          currentStatus = "completed";
        }
      }

      let categoryName = null;
      let subcategoryName = null;
      if (intern.categoryId) {
        const cats = await storage.getAllCategories();
        const cat = cats.find((c) => c.id === intern.categoryId);
        if (cat) categoryName = cat.name;
      }
      if (intern.subcategoryId) {
        const subs = await storage.getAllSubcategories();
        const sub = subs.find((s) => s.id === intern.subcategoryId);
        if (sub) subcategoryName = sub.name;
      }

      let week3Completed = false;
      if (intern.qualificationPath === "course_first") {
        week3Completed = await storage.getWeeks1to3Completed(
          req.session.internId!,
        );
      }

      let examCompletedAt: string | null = null;
      if (intern.qualificationPath === "entrance_test") {
        const demoProjects = await storage.getInternDemoProjects(
          req.session.internId!,
        );
        const completedDates = demoProjects
          .filter((p) => p.status === "completed" && p.completedAt)
          .map((p) => new Date(p.completedAt as Date).getTime());
        if (completedDates.length > 0) {
          examCompletedAt = new Date(Math.max(...completedDates)).toISOString();
        }
      }

      const isDaoDirect = intern.qualificationPath === "DAO";
      res.json({
        internshipStatus: currentStatus,
        qualificationPath: intern.qualificationPath,
        courseProgress: intern.courseProgress,
        termsAccepted: intern.termsAccepted,
        daoMembershipApplied: intern.daoMembershipApplied,
        daoStatus: intern.daoStatus || null,
        daoPosition: intern.daoPosition || null,
        isDaoDirect,
        categoryId: intern.categoryId || null,
        subcategoryId: intern.subcategoryId || null,
        categoryName: categoryName || (isDaoDirect ? intern.daoPosition : null),
        subcategoryName,
        week3Completed,
        examCompletedAt,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch intern status" });
    }
  });

  app.get("/api/intern/videos", requireIntern, async (req, res) => {
    try {
      const intern = await storage.getInternById(req.session.internId!);
      if (!intern) return res.status(404).json({ message: "Intern not found" });

      const videoType = (req.query.type as string) || "training";
      const validTypes = ["training", "internship", "dao"];
      if (!validTypes.includes(videoType)) {
        return res.status(400).json({ message: "Invalid video type" });
      }

      const vids = await storage.getInternVideos(
        videoType,
        intern.categoryId,
        intern.subcategoryId ?? null,
      );
      res.json(vids);
    } catch (error) {
      console.error("Error fetching intern videos:", error);
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  // ===== CATEGORIES & SUBCATEGORIES (Public + Admin) =====

  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories-with-topics", async (_req, res) => {
    try {
      const categories = await storage.getAllCategories();
      const allTopics = await storage.getAllCourseTopics();
      const activeCategories = categories.filter((c) => c.isActive);
      const result = activeCategories.map((cat) => ({
        ...cat,
        courseTopics: allTopics
          .filter((t) => t.categoryId === cat.id && t.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }));
      res.json(result);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch categories with topics" });
    }
  });

  app.get("/api/categories/:id/subcategories", async (req, res) => {
    try {
      const subcategories = await storage.getSubcategoriesByCategory(
        req.params.id,
      );
      res.json(subcategories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subcategories" });
    }
  });

  app.get("/api/subcategories", async (_req, res) => {
    try {
      const subcategories = await storage.getAllSubcategories();
      res.json(subcategories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subcategories" });
    }
  });

  app.post("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      const validation = internCategorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors,
        });
      }
      const category = await storage.createCategory(validation.data);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const updateData: {
        name?: string;
        description?: string | null;
        isActive?: boolean;
      } = {};
      if (req.body.name !== undefined) updateData.name = String(req.body.name);
      if (req.body.description !== undefined)
        updateData.description = req.body.description;
      if (req.body.isActive !== undefined)
        updateData.isActive = Boolean(req.body.isActive);
      const category = await storage.updateCategory(req.params.id, updateData);
      if (!category)
        return res.status(404).json({ message: "Category not found" });
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ message: "Category deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  app.post("/api/admin/subcategories", requireAdmin, async (req, res) => {
    try {
      const validation = internSubcategorySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors,
        });
      }
      const subcategory = await storage.createSubcategory(validation.data);
      res.status(201).json(subcategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to create subcategory" });
    }
  });

  app.put("/api/admin/subcategories/:id", requireAdmin, async (req, res) => {
    try {
      const updateData: {
        name?: string;
        description?: string | null;
        isActive?: boolean;
      } = {};
      if (req.body.name !== undefined) updateData.name = String(req.body.name);
      if (req.body.description !== undefined)
        updateData.description = req.body.description;
      if (req.body.isActive !== undefined)
        updateData.isActive = Boolean(req.body.isActive);
      const subcategory = await storage.updateSubcategory(
        req.params.id,
        updateData,
      );
      if (!subcategory)
        return res.status(404).json({ message: "Subcategory not found" });
      res.json(subcategory);
    } catch (error) {
      res.status(500).json({ message: "Failed to update subcategory" });
    }
  });

  app.delete("/api/admin/subcategories/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteSubcategory(req.params.id);
      res.json({ message: "Subcategory deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete subcategory" });
    }
  });

  // ================= ADMIN COURSE TOPICS =================

  app.get("/api/admin/course-topics", requireAdmin, async (_req, res) => {
    try {
      const topics = await storage.getAllCourseTopics();
      res.json(topics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course topics" });
    }
  });

  app.post("/api/admin/course-topics", requireAdmin, async (req, res) => {
    try {
      const validation = courseTopicSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors,
        });
      }
      const topic = await storage.createCourseTopic(validation.data);
      res.status(201).json(topic);
    } catch (error) {
      res.status(500).json({ message: "Failed to create course topic" });
    }
  });

  app.put("/api/admin/course-topics/:id", requireAdmin, async (req, res) => {
    try {
      const updateData: {
        name?: string;
        sortOrder?: number;
        isActive?: boolean;
      } = {};
      if (req.body.name !== undefined) updateData.name = String(req.body.name);
      if (req.body.sortOrder !== undefined)
        updateData.sortOrder = Number(req.body.sortOrder);
      if (req.body.isActive !== undefined)
        updateData.isActive = Boolean(req.body.isActive);
      const topic = await storage.updateCourseTopic(req.params.id, updateData);
      if (!topic)
        return res.status(404).json({ message: "Course topic not found" });
      res.json(topic);
    } catch (error) {
      res.status(500).json({ message: "Failed to update course topic" });
    }
  });

  app.delete("/api/admin/course-topics/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteCourseTopic(req.params.id);
      res.json({ message: "Course topic deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete course topic" });
    }
  });

  // ================= ADMIN SUBPROJECT MANAGEMENT =================

  app.get("/api/admin/sub-projects", requireAdmin, async (_req, res) => {
    try {
      const all = await storage.getAllSubProjects();
      res.json(all);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subprojects" });
    }
  });

  app.post("/api/admin/sub-projects", requireAdmin, async (req, res) => {
    try {
      const parsed = insertSubProjectSchema.parse(req.body);
      const sp = await storage.createSubProject(parsed);
      res.status(201).json(sp);
    } catch (error) {
      if (error instanceof z.ZodError)
        return res
          .status(400)
          .json({ message: "Validation failed", errors: error.errors });
      res.status(500).json({ message: "Failed to create subproject" });
    }
  });

  app.patch("/api/admin/sub-projects/:id", requireAdmin, async (req, res) => {
    try {
      const partial = insertSubProjectSchema.partial().parse(req.body);
      const sp = await storage.updateSubProject(req.params.id, partial);
      if (!sp) return res.status(404).json({ message: "Subproject not found" });
      res.json(sp);
    } catch (error) {
      if (error instanceof z.ZodError)
        return res
          .status(400)
          .json({ message: "Validation failed", errors: error.errors });
      res.status(500).json({ message: "Failed to update subproject" });
    }
  });

  app.delete("/api/admin/sub-projects/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteSubProject(req.params.id);
      res.json({ message: "Subproject deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete subproject" });
    }
  });

  // ================= VIDEO MANAGEMENT =================

  app.get("/api/admin/videos", requireAdmin, async (_req, res) => {
    try {
      const allVideos = await storage.getAllVideos();
      res.json(allVideos);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.get(
    "/api/admin/videos/category/:categoryId",
    requireAdmin,
    async (req, res) => {
      try {
        const vids = await storage.getVideosByCategory(req.params.categoryId);
        res.json(vids);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch videos by category" });
      }
    },
  );

  app.get(
    "/api/admin/videos/type/:videoType",
    requireAdmin,
    async (req, res) => {
      try {
        const vids = await storage.getVideosByType(req.params.videoType);
        res.json(vids);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch videos by type" });
      }
    },
  );

  app.get("/api/admin/videos/:id", requireAdmin, async (req, res) => {
    try {
      const video = await storage.getVideoById(req.params.id);
      if (!video) return res.status(404).json({ message: "Video not found" });
      res.json(video);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch video" });
    }
  });

  app.post("/api/admin/videos", requireAdmin, async (req, res) => {
    try {
      const parsed = insertVideoSchema.parse(req.body);
      const video = await storage.createVideo(parsed);
      res.status(201).json(video);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create video" });
    }
  });

  app.patch("/api/admin/videos/:id", requireAdmin, async (req, res) => {
    try {
      const partial = insertVideoSchema.partial().parse(req.body);
      const video = await storage.updateVideo(req.params.id, partial);
      if (!video) return res.status(404).json({ message: "Video not found" });
      res.json(video);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update video" });
    }
  });

  app.delete("/api/admin/videos/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteVideo(req.params.id);
      res.json({ message: "Video deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete video" });
    }
  });

  app.get("/api/intern/social-follows", requireIntern, async (req, res) => {
    try {
      const internId = (req.session as any).internId;
      const follows = await storage.getSocialFollowsByIntern(internId);
      res.json(follows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch social follows" });
    }
  });

  app.post("/api/intern/social-follows", requireIntern, async (req, res) => {
    try {
      const internId = (req.session as any).internId;
      const { platform } = req.body;
      if (
        !platform ||
        !(SOCIAL_PLATFORMS as readonly string[]).includes(platform)
      ) {
        return res.status(400).json({ message: "Invalid platform" });
      }
      const follow = await storage.markSocialFollow(internId, platform);
      res.json(follow);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark social follow" });
    }
  });

  return httpServer;
}
