import { pgTable, text, timestamp, uuid, integer, boolean, varchar, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const internCategories = pgTable("intern_categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InternCategory = typeof internCategories.$inferSelect;
export type InsertInternCategory = typeof internCategories.$inferInsert;

export const internCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const courseTopics = pgTable("course_topics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: uuid("category_id").notNull().references(() => internCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CourseTopic = typeof courseTopics.$inferSelect;
export type InsertCourseTopic = typeof courseTopics.$inferInsert;

export const courseTopicSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1, "Topic name is required"),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const internSubcategories = pgTable("intern_subcategories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: uuid("category_id").notNull().references(() => internCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InternSubcategory = typeof internSubcategories.$inferSelect;
export type InsertInternSubcategory = typeof internSubcategories.$inferInsert;

export const internSubcategorySchema = z.object({
  categoryId: z.string().uuid("Valid category is required"),
  name: z.string().min(1, "Subcategory name is required"),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const exams = pgTable("exams", {
  id: uuid("id").defaultRandom().primaryKey(),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),

  durationMinutes: integer("duration_minutes").notNull(),
  totalMarks: integer("total_marks").notNull(),

  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),

  isPublished: boolean("is_published").default(false),
  internCategoryId: uuid("intern_category_id").references(() => internCategories.id, { onDelete: "set null" }),

  createdAt: timestamp("created_at").defaultNow(),
});


export const interns = pgTable("interns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  workExperience: text("work_experience"),
  education: text("education").notNull(),
  city: text("city").notNull(),
  github: text("github"),
  linkedin: text("linkedin"),
  skills: text("skills").notNull(),
  projects: text("projects"),
  qualificationPath: text("qualification_path").notNull(),
  internshipStatus: text("internship_status").default("pending").notNull(),
  courseProgress: integer("course_progress").default(0).notNull(),
  daoMembershipApplied: boolean("dao_membership_applied").default(false),
  daoPosition: text("dao_position"),
  daoWorkAvailability: text("dao_work_availability"),
  daoExpertise: text("dao_expertise"),
  daoAppliedAt: timestamp("dao_applied_at"),
  daoStatus: text("dao_status").default("pending"),
  termsAccepted: boolean("terms_accepted").default(false),
  termsAcceptedAt: timestamp("terms_accepted_at"),
  categoryId: uuid("category_id"),
  subcategoryId: uuid("subcategory_id"),
  cvFilename: text("cv_filename"),
  cvOriginalName: text("cv_original_name"),
  profileImage: text("profile_image"),
  walletAddress: text("wallet_address"),
  appliedDate: timestamp("applied_date").defaultNow(),
});

export const insertInternSchema = createInsertSchema(interns);
export const selectInternSchema = createSelectSchema(interns);

export type Intern = typeof interns.$inferSelect;
export type InsertIntern = typeof interns.$inferInsert;

export const internSchema = createInsertSchema(interns).omit({
  id: true,
  appliedDate: true,
});

export const internActions = pgTable("intern_actions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  internId: uuid("intern_id").notNull().references(() => interns.id, { onDelete: "cascade" }),
  actionType: text("action_type").notNull(),
  note: text("note").notNull(),
  adminUsername: text("admin_username").notNull(),
  emailSent: boolean("email_sent").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InternAction = typeof internActions.$inferSelect;
export type InsertInternAction = typeof internActions.$inferInsert;

export const internActionRequestSchema = z.object({
  actionType: z.enum(["warning", "rejection"]),
  note: z.string().trim().min(1, "Note is required").max(2000, "Note is too long"),
});

export const insertInternActionSchema = createInsertSchema(internActions)
  .omit({
    id: true,
    createdAt: true,
    emailSent: true,
  })
  .extend({
    actionType: z.enum(["warning", "rejection"]),
    note: z.string().trim().min(1, "Note is required").max(2000),
  });

export const adminSchema = pgTable("admin", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const weeklyUpdatesSchema = pgTable("weekly_updates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  internId: uuid("intern_id").notNull().references(() => interns.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  programCourseName: text("program_course_name").notNull(),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  reportingPeriod: text("reporting_period").notNull(),
  learningTopics: text("learning_topics"),
  tasksCompleted: text("tasks_completed"),
  workOutput: text("work_output"),
  githubRepoLink: text("github_repo_link"),
  deployedUrl: text("deployed_url"),
  taskCompletionStatus: text("task_completion_status"),
  selfRating: integer("self_rating"),
  timeSpent: text("time_spent"),
  challengesFaced: text("challenges_faced"),
  solutionsAttempted: text("solutions_attempted"),
  keyLearnings: text("key_learnings"),
  performanceScore: integer("performance_score"),
  mentorFeedback: text("mentor_feedback"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type WeeklyUpdate = typeof weeklyUpdatesSchema.$inferSelect;
export type InsertWeeklyUpdate = typeof weeklyUpdatesSchema.$inferInsert;

export const weeklyUpdateSchema = z.object({
  internId: z.string(),
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  programCourseName: z.string().min(1, "Program/Course name is required"),
  weekNumber: z.number().min(1).max(53),
  year: z.number().min(2000),
  reportingPeriod: z.string().min(1, "Reporting period is required"),
  learningTopics: z.string().optional(),
  tasksCompleted: z.string().optional(),
  workOutput: z.string().optional(),
  githubRepoLink: z.string().optional(),
  deployedUrl: z.string().optional(),
  taskCompletionStatus: z.string().optional(),
  selfRating: z.number().min(1).max(5).optional(),
  timeSpent: z.string().optional(),
  challengesFaced: z.string().optional(),
  solutionsAttempted: z.string().optional(),
  keyLearnings: z.string().optional(),
  performanceScore: z.number().min(1).max(5).optional(),
  mentorFeedback: z.string().optional(),
});


export const internUsers = pgTable("intern_users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  internId: uuid("intern_id").notNull().references(() => interns.id, { onDelete: "cascade" }).unique(),
  password: text("password").notNull(),
  isApproved: integer("is_approved").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InternUser = typeof internUsers.$inferSelect;
export type InsertInternUser = typeof internUsers.$inferInsert;

// Projects - admin or DAO intern managed
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  status: text("status").notNull().default("in-progress"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  repositoryUrl: text("repository_url"),
  deployedUrl: text("deployed_url"),
  createdByInternId: uuid("created_by_intern_id").references(() => interns.id, { onDelete: "set null" }),
  internCategoryId: uuid("intern_category_id").references(() => internCategories.id, { onDelete: "set null" }),
  subcategoryId: uuid("subcategory_id").references(() => internSubcategories.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  internCategoryId: z.string().uuid().optional().or(z.literal("")),
  subcategoryId: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(["in-progress", "completed", "on-hold"]).default("in-progress"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  repositoryUrl: z.string().optional(),
  deployedUrl: z.string().optional(),
});

// Tasks - can be linked to projects and assigned to interns
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: uuid("assigned_to").references(() => interns.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  courseModuleId: uuid("course_module_id").references(() => courseModules.id, { onDelete: "set null" }),
  internshipProjectTaskId: uuid("internship_project_task_id"),
  subProjectTaskId: uuid("sub_project_task_id"),
  internCategoryId: uuid("intern_category_id").references(() => internCategories.id, { onDelete: "set null" }),
  subcategoryId: uuid("subcategory_id").references(() => internSubcategories.id, { onDelete: "set null" }),
  status: text("status").notNull().default("pending"),
  priority: text("priority").default("medium"),
  type: text("type"),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  createdBy: text("created_by").notNull(),
  createdByIntern: uuid("created_by_intern").references(() => interns.id, { onDelete: "set null" }),
  submittedNotes: text("submitted_notes"),
  submittedGithubLink: text("submitted_github_link"),
  submittedAt: timestamp("submitted_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  projectId: z.string().optional(),
  status: z.enum(["pending", "running", "completed", "cancelled"]).default("pending"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

// Time logs for tasks and general work
export const timeLogs = pgTable("time_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  internId: uuid("intern_id").notNull().references(() => interns.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
  logType: text("log_type").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type TimeLog = typeof timeLogs.$inferSelect;
export type InsertTimeLog = typeof timeLogs.$inferInsert;

export const timeLogSchema = z.object({
  internId: z.string(),
  taskId: z.string().optional(),
  logType: z.enum(["task", "login", "break"]),
  startTime: z.string(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  internId: uuid("intern_id").notNull().references(() => interns.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: integer("read").default(0).notNull(),
  relatedTaskId: uuid("related_task_id").references(() => tasks.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Contact Messages
export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").default("unread").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

export const contactMessageSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// Intern login schema
export const internLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginData = z.infer<typeof adminLoginSchema>;

export const courseModules = pgTable("course_modules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  weekNumber: integer("week_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  orderIndex: integer("order_index").notNull(),
  internCategoryId: uuid("intern_category_id").references(() => internCategories.id, { onDelete: "set null" }),
  subcategoryId: uuid("subcategory_id").references(() => internSubcategories.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = typeof courseModules.$inferInsert;

export const courseProgress = pgTable("course_progress", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  internId: uuid("intern_id").notNull().references(() => interns.id, { onDelete: "cascade" }),
  moduleId: uuid("module_id").notNull().references(() => courseModules.id, { onDelete: "cascade" }),
  completed: boolean("completed").default(false).notNull(),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CourseProgress = typeof courseProgress.$inferSelect;
export type InsertCourseProgress = typeof courseProgress.$inferInsert;

export const certificates = pgTable("certificates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  internId: uuid("intern_id").notNull().references(() => interns.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  certificateNumber: text("certificate_number"),
  internName: text("intern_name"),
  programStartDate: text("program_start_date"),
  programEndDate: text("program_end_date"),
  issuedAt: timestamp("issued_at").defaultNow(),
  downloadUrl: text("download_url"),
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

export const demoProjects = pgTable("demo_projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  repositoryUrl: text("repository_url"),
  websiteUrl: text("website_url"),
  internCategoryId: uuid("intern_category_id").references(() => internCategories.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DemoProject = typeof demoProjects.$inferSelect;
export type InsertDemoProject = typeof demoProjects.$inferInsert;

export const internDemoProjects = pgTable("intern_demo_projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  internId: uuid("intern_id").notNull().references(() => interns.id, { onDelete: "cascade" }),
  demoProjectId: uuid("demo_project_id").notNull().references(() => demoProjects.id, { onDelete: "cascade" }),
  status: text("status").default("in-progress").notNull(),
  submissionNotes: text("submission_notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InternDemoProject = typeof internDemoProjects.$inferSelect;
export type InsertInternDemoProject = typeof internDemoProjects.$inferInsert;

export const internshipProjectTasks = pgTable("internship_project_tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  internId: uuid("intern_id").notNull().references(() => interns.id, { onDelete: "cascade" }),
  internDemoProjectId: uuid("intern_demo_project_id").notNull().references(() => internDemoProjects.id, { onDelete: "cascade" }),
  phaseNumber: integer("phase_number").notNull(),
  phaseName: text("phase_name").notNull(),
  subtaskName: text("subtask_name").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
});

export type InternshipProjectTask = typeof internshipProjectTasks.$inferSelect;
export type InsertInternshipProjectTask = typeof internshipProjectTasks.$inferInsert;

export const subProjects = pgTable("sub_projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  repositoryUrl: text("repository_url"),
  websiteUrl: text("website_url"),
  internCategoryId: uuid("intern_category_id").references(() => internCategories.id, { onDelete: "set null" }),
  subcategoryId: uuid("subcategory_id").references(() => internSubcategories.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SubProject = typeof subProjects.$inferSelect;
export type InsertSubProject = typeof subProjects.$inferInsert;

export const insertSubProjectSchema = createInsertSchema(subProjects).omit({ id: true, createdAt: true });

export const internSubProjects = pgTable("intern_sub_projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  internId: uuid("intern_id").notNull().references(() => interns.id, { onDelete: "cascade" }),
  subProjectId: uuid("sub_project_id").notNull().references(() => subProjects.id, { onDelete: "cascade" }),
  status: text("status").default("in-progress").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InternSubProject = typeof internSubProjects.$inferSelect;
export type InsertInternSubProject = typeof internSubProjects.$inferInsert;

export const subProjectTasks = pgTable("sub_project_tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  internId: uuid("intern_id").notNull().references(() => interns.id, { onDelete: "cascade" }),
  internSubProjectId: uuid("intern_sub_project_id").notNull().references(() => internSubProjects.id, { onDelete: "cascade" }),
  phaseNumber: integer("phase_number").notNull(),
  phaseName: text("phase_name").notNull(),
  subtaskName: text("subtask_name").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  started: boolean("started").default(false).notNull(),
  startedAt: timestamp("started_at"),
  submitComment: text("submit_comment"),
});

export type SubProjectTask = typeof subProjectTasks.$inferSelect;
export type InsertSubProjectTask = typeof subProjectTasks.$inferInsert;

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  categoryId: uuid("category_id").references(() => internCategories.id, { onDelete: "set null" }),
  subcategoryId: uuid("subcategory_id").references(() => internSubcategories.id, { onDelete: "set null" }),
  videoType: text("video_type").notNull().default("training"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const daoApplications = pgTable("dao_applications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  education: text("education").notNull(),
  position: text("position").notNull(),
  workAvailability: text("work_availability").notNull(),
  expertise: text("expertise").notNull(),
  resume: text("resume"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type DaoApplication = typeof daoApplications.$inferSelect;
export type InsertDaoApplication = typeof daoApplications.$inferInsert;

export const insertDaoApplicationSchema = createInsertSchema(daoApplications).omit({ id: true, createdAt: true, status: true });

export const socialFollows = pgTable("social_follows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  internId: uuid("intern_id").notNull().references(() => interns.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  followedAt: timestamp("followed_at").defaultNow(),
}, (table) => ({
  uniqueInternPlatform: unique().on(table.internId, table.platform),
}));

export type SocialFollow = typeof socialFollows.$inferSelect;
export type InsertSocialFollow = typeof socialFollows.$inferInsert;

export const SOCIAL_PLATFORMS = ["twitter", "telegram", "youtube", "github", "facebook"] as const;
export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];

export const VIDEO_TYPES = ["training", "internship", "dao"] as const;
export type VideoType = typeof VIDEO_TYPES[number];

export const insertVideoSchema = createInsertSchema(videos).omit({ id: true, createdAt: true }).extend({
  videoType: z.enum(VIDEO_TYPES).default("training"),
});
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

// Intern <-> Admin Messages
export const internMessages = pgTable("intern_messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  internId: uuid("intern_id").notNull().references(() => interns.id, { onDelete: "cascade" }),
  senderType: text("sender_type").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  adminUsername: text("admin_username"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InternMessage = typeof internMessages.$inferSelect;
export type InsertInternMessage = typeof internMessages.$inferInsert;

export const internMessageCreateSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject is too long"),
  message: z.string().trim().min(1, "Message is required").max(5000, "Message is too long"),
});

export const adminMessageReplySchema = internMessageCreateSchema;
