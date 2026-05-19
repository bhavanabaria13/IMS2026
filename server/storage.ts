import { db } from "./db";
import {
  interns,
  type Intern,
  type InsertIntern,
  weeklyUpdatesSchema,
  type WeeklyUpdate,
  type InsertWeeklyUpdate,
  internUsers,
  type InternUser,
  type InsertInternUser,
  tasks,
  type Task,
  type InsertTask,
  timeLogs,
  type TimeLog,
  type InsertTimeLog,
  projects,
  type Project,
  type InsertProject,
  // (resetInternProgress wipes intern-created projects too)
  notifications,
  contactMessages,
  exams,
  courseModules,
  type CourseModule,
  type InsertCourseModule,
  courseProgress,
  type CourseProgress,
  certificates,
  type Certificate,
  demoProjects,
  type DemoProject,
  internDemoProjects,
  type InternDemoProject,
  internshipProjectTasks,
  type InternshipProjectTask,
  internCategories,
  type InternCategory,
  internSubcategories,
  type InternSubcategory,
  videos,
  type Video,
  type InsertVideo,
  subProjects,
  type SubProject,
  type InsertSubProject,
  internSubProjects,
  type InternSubProject,
  subProjectTasks,
  type SubProjectTask,
  courseTopics,
  type CourseTopic,
  type InsertCourseTopic,
  daoApplications,
  type DaoApplication,
  type InsertDaoApplication,
  socialFollows,
  type SocialFollow,
  internActions,
  type InternAction,
  type InsertInternAction,
  internMessages,
  type InternMessage,
  type InsertInternMessage,
} from "@shared/schema";
import { eq, desc, and, gte, lte, isNull, inArray, or, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export interface IStorage {
  createIntern(data: Omit<InsertIntern, "id" | "appliedDate">): Promise<Intern>;
  getAllInterns(): Promise<Intern[]>;
  getInternById(id: string): Promise<Intern | null>;
  getInternByEmail(email: string): Promise<Intern | null>;
  deleteIntern(id: string): Promise<boolean>;

  // Weekly Updates
  createWeeklyUpdate(data: Omit<InsertWeeklyUpdate, 'id'>): Promise<WeeklyUpdate>;
  getWeeklyUpdatesByIntern(internId: string): Promise<WeeklyUpdate[]>;
  getAllWeeklyUpdates(): Promise<WeeklyUpdate[]>;
  getWeeklyUpdate(id: string): Promise<WeeklyUpdate | null>;
  updateWeeklyUpdate(id: string, data: Partial<InsertWeeklyUpdate>): Promise<WeeklyUpdate | null>;
  deleteWeeklyUpdate(id: string): Promise<void>;
  getWeeklyUpdatesByWeek(weekNumber: number, year: number): Promise<WeeklyUpdate[]>;

  // Intern Users
  createInternUser(internId: string, password: string): Promise<InternUser>;
  getInternUserByInternId(internId: string): Promise<InternUser | null>;
  getInternUserByEmail(email: string): Promise<(InternUser & Intern) | null>;
  updateInternApproval(internId: string, isApproved: number): Promise<void>;
  updateInternPassword(internId: string, hashedPassword: string): Promise<void>;
  getAllPendingInterns(): Promise<Intern[]>;
  getAllInternsWithStatus(): Promise<any[]>;
  updateIntern(id: string, data: Partial<InsertIntern>): Promise<Intern | null>;

  // Intern Actions (warnings / rejections)
  createInternAction(data: Omit<InsertInternAction, "id" | "createdAt" | "emailSent"> & { emailSent?: boolean }): Promise<InternAction>;
  getInternActionsByIntern(internId: string): Promise<InternAction[]>;
  getAllInternActions(): Promise<InternAction[]>;
  markInternActionEmailSent(id: string): Promise<void>;

  // Tasks
  createTask(data: Omit<InsertTask, "id">): Promise<Task>;
  createInternTask(internId: string, taskData: any): Promise<Task>;
  updateTaskStatus(taskId: string, status: string, extraFields?: any): Promise<Task | undefined>;
  getAllTasks(): Promise<Task[]>;
  getTasksByIntern(internId: string): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | null>;
  updateTask(id: string, data: Partial<InsertTask>): Promise<Task | null>;
  deleteTask(id: string): Promise<void>;

  // Time Logs
  createTimeLog(data: Omit<InsertTimeLog, "id">): Promise<TimeLog>;
  getTimeLogsByIntern(internId: string): Promise<TimeLog[]>;
  getAllTimeLogs(): Promise<TimeLog[]>;
  getActiveTimeLog(internId: string): Promise<TimeLog | null>;
  endTimeLog(id: string, endTime: Date): Promise<TimeLog | null>;
  getTimeLogsByDateRange(internId: string, startDate: Date, endDate: Date): Promise<TimeLog[]>;

  // Projects (admin-managed)
  createProject(projectData: Partial<InsertProject>): Promise<Project>;
  getAllProjects(): Promise<Project[]>;
  getProjectsByCategories(categories: string[], internCategoryId?: string | null): Promise<Project[]>;
  getProjectById(id: string): Promise<Project | null>;
  updateProject(id: string, projectData: Partial<InsertProject>): Promise<Project | null>;
  deleteProject(id: string): Promise<boolean>;
  getTasksByProject(projectId: string): Promise<Task[]>;

  // Password Reset
  updateInternUserPassword(internId: string, newPassword: string): Promise<void>;

  // Notifications
  createNotification(data: { internId: string; type: string; title: string; message: string; relatedTaskId?: string }): Promise<any>;
  getNotificationsByIntern(internId: string): Promise<any[]>;
  markNotificationAsRead(id: string): Promise<void>;
  getUnreadNotificationsCount(internId: string): Promise<number>;

  // Time Log helpers
  getActiveTimeLogForTask(internId: string, taskId: string): Promise<TimeLog | null>;
  updateTimeLogNotes(logId: string, notes: string): Promise<void>;

  // Contact Messages
  createContactMessage(data: any): Promise<any>;
  getAllContactMessages(): Promise<any[]>;
  updateContactMessageStatus(id: string, status: string): Promise<any>;
  deleteContactMessage(id: string): Promise<void>;
  
  // Exams
  createExam(data: any): Promise<any>;
  getAllExams(): Promise<any[]>;
  getExamById(id: string): Promise<any | null>;
  updateExam(id: string, data: any): Promise<any | null>;
  deleteExam(id: string): Promise<void>;

  // Course Modules
  getAllCourseModules(): Promise<CourseModule[]>;
  getCourseModulesByCategory(categoryId: string): Promise<CourseModule[]>;
  createCourseModule(data: InsertCourseModule): Promise<CourseModule>;
  updateCourseModule(id: string, data: Partial<InsertCourseModule>): Promise<CourseModule | null>;
  deleteCourseModule(id: string): Promise<void>;
  getCourseProgressByIntern(internId: string): Promise<CourseProgress[]>;
  markModuleComplete(internId: string, moduleId: string): Promise<CourseProgress>;
  getInternProgressSummary(internId: string): Promise<{ total: number; completed: number; percentage: number }>;
  getWeek4Progress(internId: string): Promise<{ total: number; completed: number; percentage: number }>;
  getWeeks1to3Completed(internId: string): Promise<boolean>;
  getWeek4Modules(categoryId: string | null): Promise<CourseModule[]>;

  // Certificates
  createCertificate(data: { internId: string; type: string; title: string; certificateNumber?: string; internName?: string; programStartDate?: string; programEndDate?: string }): Promise<Certificate>;
  getCertificatesByIntern(internId: string): Promise<Certificate[]>;

  // Demo Projects
  getAllDemoProjects(): Promise<DemoProject[]>;
  selectDemoProject(internId: string, demoProjectId: string): Promise<InternDemoProject>;
  unselectDemoProject(internId: string, internDemoProjectId: string): Promise<void>;
  getInternDemoProjects(internId: string): Promise<InternDemoProject[]>;
  updateInternDemoProjectStatus(id: string, status: string): Promise<InternDemoProject | null>;
  submitInternDemoProject(id: string, submissionNotes: string): Promise<InternDemoProject | null>;

  // Internship Project Tasks
  getInternshipProjectTasks(internDemoProjectId: string): Promise<InternshipProjectTask[]>;
  initInternshipProjectTasks(internId: string, internDemoProjectId: string, categoryName?: string): Promise<InternshipProjectTask[]>;
  toggleInternshipProjectTask(taskId: string): Promise<InternshipProjectTask | null>;
  getInternshipProgress(internId: string): Promise<{ totalProjects: number; completedProjects: number; totalSubProjects: number; completedSubProjects: number; percentage: number }>;

  // Intern Status Updates
  updateInternStatus(internId: string, status: string): Promise<void>;
  updateInternCourseProgress(internId: string, progress: number): Promise<void>;
  applyForDaoMembership(internId: string, data?: { position: string; workAvailability: string; expertise: string }): Promise<void>;
  getDaoApplicants(): Promise<any[]>;
  updateDaoStatus(internId: string, status: string): Promise<void>;
  acceptTerms(internId: string): Promise<void>;
  resetInternProgress(internId: string): Promise<void>;

  // Categories & Subcategories
  getAllCategories(): Promise<any[]>;
  getCategoryById(id: string): Promise<any | null>;
  createCategory(data: { name: string; description?: string; isActive?: boolean }): Promise<any>;
  updateCategory(id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<any | null>;
  deleteCategory(id: string): Promise<void>;
  getAllSubcategories(): Promise<any[]>;
  getSubcategoriesByCategory(categoryId: string): Promise<any[]>;
  createSubcategory(data: { categoryId: string; name: string; description?: string; isActive?: boolean }): Promise<any>;
  updateSubcategory(id: string, data: { name?: string; description?: string; isActive?: boolean; categoryId?: string }): Promise<any | null>;
  deleteSubcategory(id: string): Promise<void>;

  // Sub Projects
  getAllSubProjects(): Promise<SubProject[]>;
  getSubProjectById(id: string): Promise<SubProject | null>;
  createSubProject(data: InsertSubProject): Promise<SubProject>;
  updateSubProject(id: string, data: Partial<InsertSubProject>): Promise<SubProject | null>;
  deleteSubProject(id: string): Promise<void>;
  getInternSubProjects(internId: string): Promise<InternSubProject[]>;
  selectSubProject(internId: string, subProjectId: string): Promise<InternSubProject>;
  deleteInternSubProject(id: string): Promise<void>;
  updateInternSubProjectStatus(id: string, status: string): Promise<InternSubProject | null>;
  getSubProjectTasks(internSubProjectId: string): Promise<SubProjectTask[]>;
  initSubProjectTasks(internId: string, internSubProjectId: string): Promise<SubProjectTask[]>;
  toggleSubProjectTask(taskId: string): Promise<SubProjectTask | null>;
  markSubProjectTaskComplete(taskId: string): Promise<SubProjectTask | null>;
  startSubProjectTask(taskId: string): Promise<SubProjectTask | null>;
  submitSubProjectTask(taskId: string, comment: string | null): Promise<SubProjectTask | null>;

  // Course Topics
  getCourseTopicsByCategory(categoryId: string): Promise<CourseTopic[]>;
  getAllCourseTopics(): Promise<CourseTopic[]>;
  createCourseTopic(data: InsertCourseTopic): Promise<CourseTopic>;
  updateCourseTopic(id: string, data: Partial<InsertCourseTopic>): Promise<CourseTopic | null>;
  deleteCourseTopic(id: string): Promise<void>;

  // DAO Applications
  createDaoApplication(data: Omit<InsertDaoApplication, "id" | "createdAt" | "status">): Promise<DaoApplication>;
  getAllDaoApplications(): Promise<DaoApplication[]>;
  getDaoApplicationById(id: string): Promise<DaoApplication | null>;
  updateDaoApplicationStatus(id: string, status: string): Promise<DaoApplication | null>;

  // Videos
  getAllVideos(): Promise<Video[]>;
  getVideoById(id: string): Promise<Video | null>;
  getVideosByCategory(categoryId: string): Promise<Video[]>;
  getVideosByType(videoType: string): Promise<Video[]>;
  getInternVideos(videoType: string, categoryId: string | null): Promise<Video[]>;
  createVideo(data: InsertVideo): Promise<Video>;
  updateVideo(id: string, data: Partial<InsertVideo>): Promise<Video | null>;
  deleteVideo(id: string): Promise<void>;

  // Social Follows
  getSocialFollowsByIntern(internId: string): Promise<SocialFollow[]>;
  markSocialFollow(internId: string, platform: string): Promise<SocialFollow>;

  // Intern Messages
  createInternMessage(data: Omit<InsertInternMessage, "id" | "createdAt" | "isRead"> & { isRead?: boolean }): Promise<InternMessage>;
  getMessagesByIntern(internId: string): Promise<InternMessage[]>;
  getAllInternMessages(): Promise<InternMessage[]>;
  markInternMessagesReadByAdmin(internId: string): Promise<void>;
  markInternMessagesReadByIntern(internId: string): Promise<void>;
}

class PostgresStorage implements IStorage {
        /* ================= EXAMS ================= */

async getAllExams(): Promise<any[]> {
  try {
    return await db
      .select()
      .from(exams)
      .orderBy(desc(exams.createdAt));
  } catch (err) {
    console.error("STORAGE getAllExams ERROR:", err);
    throw err;
  }
}

async updateExam(id: string, data: any): Promise<any | null> {
  try {
    const [updated] = await db
      .update(exams)
      .set(data)
      .where(eq(exams.id, id))
      .returning();

    return updated || null;
  } catch (err) {
    console.error("STORAGE updateExam ERROR:", err);
    throw err;
  }
}

async deleteExam(id: string): Promise<void> {
  try {
    await db.delete(exams).where(eq(exams.id, id));
  } catch (err) {
    console.error("STORAGE deleteExam ERROR:", err);
    throw err;
  }
}

  async createIntern(data: Omit<InsertIntern, "id" | "appliedDate">): Promise<Intern> {
    
        try {
         const query = db.insert(interns).values(data).returning();

const { sql, params } = query.toSQL();
console.log("SQL:", sql);
console.log("PARAMS:", params);

const [createdIntern] = await query;
return createdIntern;

        } catch (e) {
          console.error("DB INSERT ERROR:", e);
          throw e;
        }
  }

  async getAllInterns(): Promise<Intern[]> {
    return await db.select().from(interns).orderBy(desc(interns.appliedDate));
  }

  async getInternById(id: string): Promise<Intern | null> {
    const [intern] = await db.select().from(interns).where(eq(interns.id, id));
    return intern || null;
  }

  async getInternByEmail(email: string): Promise<Intern | null> {
    const [intern] = await db.select().from(interns).where(eq(interns.email, email));
    return intern || null;
  }

  async deleteIntern(id: string): Promise<boolean> {
    // Delete intern user account first
    await db.delete(internUsers).where(eq(internUsers.internId, id));
    // Then delete intern
    const result = await db.delete(interns).where(eq(interns.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Weekly Updates
  async createWeeklyUpdate(data: Omit<InsertWeeklyUpdate, 'id'>): Promise<WeeklyUpdate> {
    const id = crypto.randomUUID();
    const [update] = await db.insert(weeklyUpdatesSchema).values({ id, ...data }).returning();
    return update;
  }

  async getWeeklyUpdatesByIntern(internId: string): Promise<WeeklyUpdate[]> {
    return await db
      .select()
      .from(weeklyUpdatesSchema)
      .where(eq(weeklyUpdatesSchema.internId, internId))
      .orderBy(desc(weeklyUpdatesSchema.year), desc(weeklyUpdatesSchema.weekNumber));
  }

  async getAllWeeklyUpdates(): Promise<WeeklyUpdate[]> {
    return await db
      .select()
      .from(weeklyUpdatesSchema)
      .orderBy(desc(weeklyUpdatesSchema.year), desc(weeklyUpdatesSchema.weekNumber));
  }

  async getWeeklyUpdate(id: string): Promise<WeeklyUpdate | null> {
    const [update] = await db
      .select()
      .from(weeklyUpdatesSchema)
      .where(eq(weeklyUpdatesSchema.id, id));
    return update || null;
  }

  async updateWeeklyUpdate(id: string, data: Partial<InsertWeeklyUpdate>): Promise<WeeklyUpdate | null> {
    const [update] = await db
      .update(weeklyUpdatesSchema)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(weeklyUpdatesSchema.id, id))
      .returning();
    return update || null;
  }


  async deleteWeeklyUpdate(id: string): Promise<void> {
    await db.delete(weeklyUpdatesSchema).where(eq(weeklyUpdatesSchema.id, id));
  }

  async getWeeklyUpdatesByWeek(weekNumber: number, year: number): Promise<WeeklyUpdate[]> {
    return await db
      .select()
      .from(weeklyUpdatesSchema)
      .where(
        and(
          eq(weeklyUpdatesSchema.weekNumber, weekNumber),
          eq(weeklyUpdatesSchema.year, year)
        )
      );
  }

  async hasWeeklyUpdate(internId: string, weekNumber: number, year: number): Promise<boolean> {
    const updates = await db
      .select()
      .from(weeklyUpdatesSchema)
      .where(
        and(
          eq(weeklyUpdatesSchema.internId, internId),
          eq(weeklyUpdatesSchema.weekNumber, weekNumber),
          eq(weeklyUpdatesSchema.year, year)
        )
      );
    return updates.length > 0;
  }

  /*async getActiveTimeLogForTask(internId: string, taskId: string): Promise<TimeLog | null> {
    const [log] = await db
      .select()
      .from(timeLogs)
      .where(
        and(
          eq(timeLogs.internId, internId),
          eq(timeLogs.taskId, taskId),
          isNull(timeLogs.endTime)
        )
      )
      .orderBy(desc(timeLogs.startTime))
      .limit(1);
    return log || null;
  }*/
  async getActiveTimeLogForTask(
  internId: string,
  taskId: string
): Promise<TimeLog | null> {
  const [log] = await db
    .select()
    .from(timeLogs)
    .where(
      and(
        eq(timeLogs.internId, internId),
        eq(timeLogs.taskId, taskId),
        isNull(timeLogs.endTime) // MUST be NULL for active log
      )
    )
    .orderBy(desc(timeLogs.startTime)) // latest first (safety)
    .limit(1);

  return log ?? null;
}


  async updateTimeLogNotes(logId: string, notes: string): Promise<void> {
    await db
      .update(timeLogs)
      .set({ notes })
      .where(eq(timeLogs.id, logId));
  }

  // Intern Users
  async createInternUser(internId: string, password: string): Promise<InternUser> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db.insert(internUsers).values({ internId, password: hashedPassword }).returning();
    return user;
  }

  async getInternUserByInternId(internId: string): Promise<InternUser | null> {
    const [user] = await db.select().from(internUsers).where(eq(internUsers.internId, internId));
    return user || null;
  }

  async getInternUserByEmail(email: string): Promise<(InternUser & Intern) | null> {
    const result = await db
      .select()
      .from(internUsers)
      .innerJoin(interns, eq(internUsers.internId, interns.id))
      .where(eq(interns.email, email));

    if (result.length === 0) return null;
    return { ...result[0].intern_users, ...result[0].interns };
  }

  async updateInternApproval(internId: string, isApproved: number): Promise<void> {
    await db.update(internUsers).set({ isApproved }).where(eq(internUsers.internId, internId));
  }

  async updateInternPassword(internId: string, hashedPassword: string): Promise<void> {
    await db.update(internUsers).set({ password: hashedPassword }).where(eq(internUsers.internId, internId));
  }

  async getAllPendingInterns(): Promise<Intern[]> {
    const result = await db
      .select()
      .from(interns)
      .leftJoin(internUsers, eq(interns.id, internUsers.internId))
      .where(eq(internUsers.isApproved, 0));
    return result.map(r => r.interns);
  }

  async getAllInternsWithStatus(): Promise<any[]> {
    const result = await db
      .select({
        id: interns.id,
        name: interns.name,
        email: interns.email,
        phone: interns.phone,
        workExperience: interns.workExperience,
        education: interns.education,
        city: interns.city,
        github: interns.github,
        linkedin: interns.linkedin,
        skills: interns.skills,
        projects: interns.projects,
        cvFilename: interns.cvFilename,
        cvOriginalName: interns.cvOriginalName,
        profileImage: interns.profileImage,
        appliedDate: interns.appliedDate,
        categoryId: interns.categoryId,
        subcategoryId: interns.subcategoryId,
        qualificationPath: interns.qualificationPath,
        internshipStatus: interns.internshipStatus,
        approvalStatus: internUsers.isApproved,
      })
      .from(interns)
      .leftJoin(internUsers, eq(interns.id, internUsers.internId))
      .orderBy(desc(interns.appliedDate));

    // Set approvalStatus to 0 (pending) for interns without user accounts
    return result.map(intern => ({
      ...intern,
      approvalStatus: intern.approvalStatus ?? 0
    }));
  }

  async updateIntern(id: string, data: Partial<InsertIntern>): Promise<Intern | null> {
    const [updated] = await db.update(interns).set(data).where(eq(interns.id, id)).returning();
    return updated || null;
  }

  // Intern Actions (warnings / rejections)
  async createInternAction(
    data: Omit<InsertInternAction, "id" | "createdAt" | "emailSent"> & { emailSent?: boolean },
  ): Promise<InternAction> {
    const [created] = await db
      .insert(internActions)
      .values({
        internId: data.internId,
        actionType: data.actionType,
        note: data.note,
        adminUsername: data.adminUsername,
        emailSent: data.emailSent ?? false,
      })
      .returning();
    return created;
  }

  async getInternActionsByIntern(internId: string): Promise<InternAction[]> {
    return db
      .select()
      .from(internActions)
      .where(eq(internActions.internId, internId))
      .orderBy(desc(internActions.createdAt));
  }

  async getAllInternActions(): Promise<InternAction[]> {
    return db.select().from(internActions).orderBy(desc(internActions.createdAt));
  }

  async markInternActionEmailSent(id: string): Promise<void> {
    await db
      .update(internActions)
      .set({ emailSent: true })
      .where(eq(internActions.id, id));
  }

  // Tasks
  async createTask(data: Omit<InsertTask, "id">): Promise<Task> {
    try {
      const id = randomUUID();
      const now = new Date();
      await db.insert(tasks).values({ id, ...data, createdAt: now, updatedAt: now }).returning();
      return this.getTaskById(id) as Promise<Task>;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }

  async createInternTask(internId: string, taskData: any): Promise<Task> {
    const taskId = randomUUID();
    const now = new Date();

    const task = await db.insert(tasks).values({
      id: taskId,
      title: taskData.title,
      description: taskData.description || null,
      status: "pending",
      priority: taskData.priority || "medium",
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      startDate: taskData.startDate ? new Date(taskData.startDate) : null,
      createdBy: "intern",
      createdByIntern: internId,
      assignedTo: internId,
      projectId: taskData.projectId || null,
      courseModuleId: taskData.courseModuleId || null,
      internshipProjectTaskId: taskData.internshipProjectTaskId || null,
      createdAt: now,
      updatedAt: now,
    }).returning();

    return task[0];
  }

  async updateTaskStatus(taskId: string, status: string, extraFields?: any): Promise<Task | undefined> {
    const updateData: any = { status, updatedAt: new Date() };

    if (status === "completed" && !extraFields?.closedAt) {
      updateData.closedAt = new Date();
    }

    if (extraFields?.submittedAt) {
      updateData.submittedAt = extraFields.submittedAt;
    }

    const [updated] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning();
    return updated;
  }

  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getAllTasksEnriched(): Promise<(Task & { resolvedProjectName: string | null; isDaoTask: boolean })[]> {
    const allTasks = await this.getAllTasks();
    return Promise.all(allTasks.map(async (task) => {
      let resolvedProjectName: string | null = null;
      let isDaoTask = false;
      if (task.projectId) {
        const proj = await db.select({ name: projects.name, createdByInternId: projects.createdByInternId }).from(projects).where(eq(projects.id, task.projectId));
        if (proj.length) {
          resolvedProjectName = proj[0].name;
          isDaoTask = !!proj[0].createdByInternId;
        }
      } else if (task.internshipProjectTaskId) {
        const result = await db
          .select({ name: demoProjects.name })
          .from(internshipProjectTasks)
          .innerJoin(internDemoProjects, eq(internshipProjectTasks.internDemoProjectId, internDemoProjects.id))
          .innerJoin(demoProjects, eq(internDemoProjects.demoProjectId, demoProjects.id))
          .where(eq(internshipProjectTasks.id, task.internshipProjectTaskId));
        if (result.length) resolvedProjectName = result[0].name;
      } else if (task.courseModuleId) {
        const mod = await db.select({ title: courseModules.title }).from(courseModules).where(eq(courseModules.id, task.courseModuleId));
        if (mod.length) resolvedProjectName = mod[0].title;
      }
      return { ...task, resolvedProjectName, isDaoTask };
    }));
  }

  async getTasksByIntern(internId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.assignedTo, internId)).orderBy(desc(tasks.createdAt));
  }

  async getTaskById(id: string): Promise<Task | null> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || null;
  }

  async updateTask(id: string, data: Partial<InsertTask>): Promise<Task | null> {
    try {
      const [updated] = await db.update(tasks).set({ ...data, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
      return updated || null;
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Time Logs
  async createTimeLog(data: Omit<InsertTimeLog, "id">): Promise<TimeLog> {
    const [log] = await db.insert(timeLogs).values(data).returning();
    return log;
  }

  async getTimeLogsByIntern(internId: string): Promise<TimeLog[]> {
    return await db.select().from(timeLogs).where(eq(timeLogs.internId, internId)).orderBy(desc(timeLogs.startTime));
  }

  async getAllTimeLogs(): Promise<TimeLog[]> {
    return await db.select().from(timeLogs).orderBy(desc(timeLogs.startTime));
  }

  async getActiveTimeLog(internId: string): Promise<TimeLog | null> {
    const [log] = await db
      .select()
      .from(timeLogs)
      .where(and(eq(timeLogs.internId, internId), isNull(timeLogs.endTime)))
      .orderBy(desc(timeLogs.startTime));
    return log || null;
  }

  async endTimeLog(id: string, endTime: Date): Promise<TimeLog | null> {
    const [log] = await db.select().from(timeLogs).where(eq(timeLogs.id, id));
    if (!log || log.endTime) return null;

    const duration = Math.floor((endTime.getTime() - new Date(log.startTime).getTime()) / 60000);
    const [updated] = await db.update(timeLogs).set({ endTime, duration }).where(eq(timeLogs.id, id)).returning();
    return updated || null;
  }

  async getTimeLogsByDateRange(internId: string, startDate: Date, endDate: Date): Promise<TimeLog[]> {
    return await db
      .select()
      .from(timeLogs)
      .where(
        and(
          eq(timeLogs.internId, internId),
          gte(timeLogs.startTime, startDate),
          lte(timeLogs.startTime, endDate)
        )
      )
      .orderBy(desc(timeLogs.startTime));
  }

  // Projects (admin-managed)
  async createProject(projectData: Partial<InsertProject>): Promise<Project> {
    const [newProject] = await db.insert(projects).values({
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newProject;
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProjectsByCategories(categories: string[], internCategoryId?: string | null): Promise<Project[]> {
    if (categories.length === 0) return [];
    const conditions = [inArray(projects.category, categories)];
    if (internCategoryId) {
      conditions.push(
        or(
          eq(projects.internCategoryId, internCategoryId),
          isNull(projects.internCategoryId)
        )!
      );
    }
    return await db.select().from(projects)
      .where(and(...conditions))
      .orderBy(desc(projects.createdAt));
  }

  async getProjectById(id: string): Promise<Project | null> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || null;
  }

  async updateProject(id: string, projectData: Partial<InsertProject>): Promise<Project | null> {
    const [updated] = await db
      .update(projects)
      .set({ ...projectData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated || null;
  }

  async deleteProject(id: string): Promise<boolean> {
    // First unlink tasks from this project
    await db.update(tasks).set({ projectId: null }).where(eq(tasks.projectId, id));
    // Then delete the project
    await db.delete(projects).where(eq(projects.id, id));
    return true;
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(desc(tasks.createdAt));
  }

  // Password reset
  async updateInternUserPassword(internId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(internUsers)
      .set({ password: hashedPassword })
      .where(eq(internUsers.internId, internId));
  }

  // Notifications
  async createNotification(data: { internId: string; type: string; title: string; message: string; relatedTaskId?: string }): Promise<any> {
    const [notification] = await db
      .insert(notifications)
      .values({
        id: randomUUID(),
        ...data,
        read: 0,
        createdAt: new Date(),
      })
      .returning();
    return notification;
  }

  async getNotificationsByIntern(internId: string): Promise<any[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.internId, internId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: 1 })
      .where(eq(notifications.id, id));
  }

  async getUnreadNotificationsCount(internId: string): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.internId, internId),
          eq(notifications.read, 0)
        )
      );
    return result.length;
  }

  // Contact Messages
  async createContactMessage(data: any) {
    const [message] = await db.insert(contactMessages).values({
      id: crypto.randomUUID(),
      ...data,
    }).returning();
    return message;
  }

  async getAllContactMessages() {
  //  return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
         return db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt));
  }

  async updateContactMessageStatus(id: string, status: string) {
    const [message] = await db.update(contactMessages)
      .set({ status })
      .where(eq(contactMessages.id, id))
      .returning();
    return message;
  }

  async deleteContactMessage(id: string) {
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
  }

  async getAllCourseModules(): Promise<CourseModule[]> {
    return db.select().from(courseModules).orderBy(courseModules.weekNumber, courseModules.orderIndex);
  }

  async getCourseModulesByCategory(categoryId: string): Promise<CourseModule[]> {
    return db.select().from(courseModules)
      .where(or(eq(courseModules.internCategoryId, categoryId), isNull(courseModules.internCategoryId)))
      .orderBy(courseModules.weekNumber, courseModules.orderIndex);
  }

  async createCourseModule(data: InsertCourseModule): Promise<CourseModule> {
    const [created] = await db.insert(courseModules).values(data).returning();
    return created;
  }

  async updateCourseModule(id: string, data: Partial<InsertCourseModule>): Promise<CourseModule | null> {
    const [updated] = await db.update(courseModules).set(data).where(eq(courseModules.id, id)).returning();
    return updated || null;
  }

  async deleteCourseModule(id: string): Promise<void> {
    await db.delete(courseProgress).where(eq(courseProgress.moduleId, id));
    await db.delete(courseModules).where(eq(courseModules.id, id));
  }

  async getCourseProgressByIntern(internId: string): Promise<CourseProgress[]> {
    return db.select().from(courseProgress).where(eq(courseProgress.internId, internId));
  }

  async markModuleComplete(internId: string, moduleId: string): Promise<CourseProgress> {
    const existing = await db.select().from(courseProgress)
      .where(and(eq(courseProgress.internId, internId), eq(courseProgress.moduleId, moduleId)));
    if (existing.length > 0) {
      const [updated] = await db.update(courseProgress)
        .set({ completed: true, submittedAt: new Date() })
        .where(eq(courseProgress.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(courseProgress).values({
      internId,
      moduleId,
      completed: true,
      submittedAt: new Date(),
    }).returning();
    return created;
  }

  async getWeek4Modules(categoryId: string | null): Promise<CourseModule[]> {
    if (categoryId) {
      return db.select().from(courseModules)
        .where(and(eq(courseModules.weekNumber, 4), or(eq(courseModules.internCategoryId, categoryId), isNull(courseModules.internCategoryId))))
        .orderBy(courseModules.orderIndex);
    }
    return db.select().from(courseModules)
      .where(eq(courseModules.weekNumber, 4))
      .orderBy(courseModules.orderIndex);
  }

  async getWeek4Progress(internId: string): Promise<{ total: number; completed: number; percentage: number }> {
    const intern = await this.getInternById(internId);
    let week4Modules;
    if (intern?.categoryId) {
      week4Modules = await db.select().from(courseModules)
        .where(and(eq(courseModules.weekNumber, 4), or(eq(courseModules.internCategoryId, intern.categoryId), isNull(courseModules.internCategoryId))));
    } else {
      week4Modules = await db.select().from(courseModules).where(eq(courseModules.weekNumber, 4));
    }
    const allProgress = await db.select().from(courseProgress)
      .where(and(eq(courseProgress.internId, internId), eq(courseProgress.completed, true)));
    const moduleIds = new Set(week4Modules.map(m => m.id));
    const completedModules = allProgress.filter(p => moduleIds.has(p.moduleId));
    const total = week4Modules.length;
    const completed = completedModules.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }

  async getWeeks1to3Completed(internId: string): Promise<boolean> {
    const intern = await this.getInternById(internId);
    let w1to3Modules;
    if (intern?.categoryId) {
      w1to3Modules = await db.select().from(courseModules)
        .where(and(
          inArray(courseModules.weekNumber, [1, 2, 3]),
          or(eq(courseModules.internCategoryId, intern.categoryId), isNull(courseModules.internCategoryId))
        ));
    } else {
      w1to3Modules = await db.select().from(courseModules)
        .where(inArray(courseModules.weekNumber, [1, 2, 3]));
    }
    if (w1to3Modules.length === 0) return false;
    const allProgress = await db.select().from(courseProgress)
      .where(and(eq(courseProgress.internId, internId), eq(courseProgress.completed, true)));
    const completedIds = new Set(allProgress.map(p => p.moduleId));
    return w1to3Modules.every(m => completedIds.has(m.id));
  }

  async getInternProgressSummary(internId: string): Promise<{ total: number; completed: number; percentage: number }> {
    const intern = await this.getInternById(internId);
    const isEntranceTest = intern?.qualificationPath === "entrance_test";

    let allModules;
    if (isEntranceTest) {
      if (intern?.categoryId) {
        allModules = await db.select().from(courseModules)
          .where(and(eq(courseModules.weekNumber, 4), or(eq(courseModules.internCategoryId, intern.categoryId), isNull(courseModules.internCategoryId))));
      } else {
        allModules = await db.select().from(courseModules).where(eq(courseModules.weekNumber, 4));
      }
    } else {
      if (intern?.categoryId) {
        allModules = await this.getCourseModulesByCategory(intern.categoryId);
      } else {
        allModules = await db.select().from(courseModules);
      }
    }

    if (intern?.subcategoryId) {
      allModules = allModules.filter(
        (m: any) => !m.subcategoryId || m.subcategoryId === intern.subcategoryId,
      );
    }

    const allProgress = await db.select().from(courseProgress)
      .where(and(eq(courseProgress.internId, internId), eq(courseProgress.completed, true)));

    const moduleIds = new Set(allModules.map(m => m.id));
    const completedModules = allProgress.filter(p => moduleIds.has(p.moduleId));

    const total = allModules.length;
    const completed = completedModules.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }

  async createCertificate(data: { internId: string; type: string; title: string; certificateNumber?: string; internName?: string; programStartDate?: string; programEndDate?: string }): Promise<Certificate> {
    const [cert] = await db.insert(certificates).values(data).returning();
    return cert;
  }

  async getCertificatesByIntern(internId: string): Promise<Certificate[]> {
    return db.select().from(certificates).where(eq(certificates.internId, internId));
  }

  async getAllDemoProjects(): Promise<DemoProject[]> {
    return db.select().from(demoProjects);
  }

  async createDemoProjectFromAdminProject(adminProjectId: string): Promise<DemoProject> {
    const adminProject = await this.getProjectById(adminProjectId);
    if (!adminProject) throw new Error("Admin project not found");
    const existing = await db.select().from(demoProjects).where(eq(demoProjects.name, adminProject.name));
    if (existing.length > 0) return existing[0];
    const [created] = await db.insert(demoProjects).values({
      name: adminProject.name,
      description: adminProject.description,
      category: "admin",
      repositoryUrl: adminProject.repositoryUrl,
      websiteUrl: adminProject.deployedUrl,
      internCategoryId: adminProject.internCategoryId,
    }).returning();
    return created;
  }

  async selectDemoProject(internId: string, demoProjectId: string): Promise<InternDemoProject> {
    const existing = await this.getInternDemoProjects(internId);
    const activeProjects = existing.filter(p => p.status !== "completed");
    if (activeProjects.length >= 1) throw new Error("You can only have 1 active project at a time. Please complete your current project first.");
    if (existing.some(p => p.demoProjectId === demoProjectId)) throw new Error("Project already selected");
    const [selected] = await db.insert(internDemoProjects).values({
      internId,
      demoProjectId,
      status: "in-progress",
    }).returning();
    return selected;
  }

  async unselectDemoProject(internId: string, internDemoProjectId: string): Promise<void> {
    const existing = await this.getInternDemoProjects(internId);
    const project = existing.find(p => p.id === internDemoProjectId);
    if (!project) throw new Error("Project not found");
    if (project.status === "completed") throw new Error("Cannot unselect a completed project");
    const projectTaskIds = await db.select({ id: internshipProjectTasks.id })
      .from(internshipProjectTasks)
      .where(eq(internshipProjectTasks.internDemoProjectId, internDemoProjectId));
    if (projectTaskIds.length > 0) {
      const taskIdList = projectTaskIds.map(t => t.id);
      await db.delete(tasks).where(
        and(eq(tasks.assignedTo, internId), inArray(tasks.internshipProjectTaskId, taskIdList))
      );
    }
    await db.delete(internshipProjectTasks).where(eq(internshipProjectTasks.internDemoProjectId, internDemoProjectId));
    await db.delete(internDemoProjects).where(
      and(eq(internDemoProjects.id, internDemoProjectId), eq(internDemoProjects.internId, internId))
    );
  }

  async getInternDemoProjects(internId: string): Promise<InternDemoProject[]> {
    return db.select().from(internDemoProjects).where(eq(internDemoProjects.internId, internId));
  }

  async updateInternDemoProjectStatus(id: string, status: string): Promise<InternDemoProject | null> {
    const [updated] = await db.update(internDemoProjects)
      .set({ status, completedAt: status === "completed" ? new Date() : null })
      .where(eq(internDemoProjects.id, id))
      .returning();
    return updated || null;
  }

  async submitInternDemoProject(id: string, submissionNotes: string): Promise<InternDemoProject | null> {
    const [updated] = await db.update(internDemoProjects)
      .set({ status: "completed", completedAt: new Date(), submissionNotes })
      .where(eq(internDemoProjects.id, id))
      .returning();
    return updated || null;
  }

  async updateInternStatus(internId: string, status: string): Promise<void> {
    await db.update(interns).set({ internshipStatus: status }).where(eq(interns.id, internId));
  }

  async updateInternCourseProgress(internId: string, progress: number): Promise<void> {
    await db.update(interns).set({ courseProgress: progress }).where(eq(interns.id, internId));
  }

  async applyForDaoMembership(internId: string, data?: { position: string; workAvailability: string; expertise: string }): Promise<void> {
    await db.update(interns).set({
      daoMembershipApplied: true,
      ...(data ? {
        daoPosition: data.position,
        daoWorkAvailability: data.workAvailability,
        daoExpertise: data.expertise,
        daoAppliedAt: new Date(),
      } : {}),
    }).where(eq(interns.id, internId));
  }

  async getDaoApplicants(): Promise<any[]> {
    return db.select({
      id: interns.id,
      name: interns.name,
      email: interns.email,
      daoPosition: interns.daoPosition,
      daoWorkAvailability: interns.daoWorkAvailability,
      daoExpertise: interns.daoExpertise,
      daoAppliedAt: interns.daoAppliedAt,
      daoStatus: interns.daoStatus,
      internshipStatus: interns.internshipStatus,
    }).from(interns).where(eq(interns.daoMembershipApplied, true)).orderBy(interns.daoAppliedAt);
  }

  async updateDaoStatus(internId: string, status: string): Promise<void> {
    await db.update(interns).set({ daoStatus: status }).where(eq(interns.id, internId));
  }

  async acceptTerms(internId: string): Promise<void> {
    await db.update(interns).set({ termsAccepted: true, termsAcceptedAt: new Date() }).where(eq(interns.id, internId));
  }

  async resetInternProgress(internId: string): Promise<void> {
    const intern = await this.getInternById(internId);
    await db.transaction(async (tx) => {
      // Child rows that depend on intern-owned demo/sub projects must be
      // deleted before their parents to avoid FK violations.
      await tx.delete(internshipProjectTasks).where(eq(internshipProjectTasks.internId, internId));
      await tx.delete(internDemoProjects).where(eq(internDemoProjects.internId, internId));
      await tx.delete(subProjectTasks).where(eq(subProjectTasks.internId, internId));
      await tx.delete(internSubProjects).where(eq(internSubProjects.internId, internId));
      await tx.delete(courseProgress).where(eq(courseProgress.internId, internId));
      await tx.delete(certificates).where(eq(certificates.internId, internId));
      await tx.delete(timeLogs).where(eq(timeLogs.internId, internId));
      await tx.delete(notifications).where(eq(notifications.internId, internId));
      await tx.delete(weeklyUpdatesSchema).where(eq(weeklyUpdatesSchema.internId, internId));
      await tx.delete(internMessages).where(eq(internMessages.internId, internId));
      await tx.delete(internActions).where(eq(internActions.internId, internId));
      await tx.delete(socialFollows).where(eq(socialFollows.internId, internId));
      // Wipe tasks both assigned to AND created by this intern.
      await tx.delete(tasks).where(
        or(eq(tasks.assignedTo, internId), eq(tasks.createdByIntern, internId)),
      );
      // Wipe DAO-created projects authored by this intern.
      await tx.delete(projects).where(eq(projects.createdByInternId, internId));
      if (intern?.email) {
        await tx.delete(daoApplications).where(eq(daoApplications.email, intern.email));
      }
      await tx.update(interns).set({
        internshipStatus: "pending",
        courseProgress: 0,
        termsAccepted: false,
        termsAcceptedAt: null,
        daoMembershipApplied: false,
        daoStatus: "pending",
        daoPosition: null,
        daoWorkAvailability: null,
        daoExpertise: null,
        daoAppliedAt: null,
        walletAddress: null,
      }).where(eq(interns.id, internId));
    });
  }

  async getInternshipProjectTasks(internDemoProjectId: string): Promise<InternshipProjectTask[]> {
    return db.select().from(internshipProjectTasks).where(eq(internshipProjectTasks.internDemoProjectId, internDemoProjectId)).orderBy(internshipProjectTasks.phaseNumber);
  }

  async initInternshipProjectTasks(internId: string, internDemoProjectId: string, categoryName?: string): Promise<InternshipProjectTask[]> {
    const existing = await this.getInternshipProjectTasks(internDemoProjectId);
    if (existing.length > 0) return existing;

    const COMMON_PHASES: { number: number; name: string; subtasks: string[] }[] = [
      { number: 1, name: "Project Selection", subtasks: ["Select project from available campaign/repository list"] },
      { number: 2, name: "Production & Execution", subtasks: ["Implement core requirements", "Conduct quality/compliance checks", "Review against project brief"] },
      { number: 3, name: "Refinement & Revisions", subtasks: ["Optimize performance/messaging", "Fix issues or address feedback"] },
      { number: 4, name: "Staging & Final Review", subtasks: ["Prepare for final delivery", "Internal testing or proofreading"] },
      { number: 5, name: "Project Finalization", subtasks: ["Finalize assets or codebase", "Generate project documentation/report"] },
      { number: 6, name: "Live Launch", subtasks: ["Public release or campaign activation"] },
      { number: 7, name: "Final Submission", subtasks: ["Submit completion proof for verification"] },
    ];

    void categoryName;
    const phases = COMMON_PHASES;

    const rows: any[] = [];
    for (const phase of phases) {
      for (const subtask of phase.subtasks) {
        const [inserted] = await db.insert(internshipProjectTasks).values({
          internId,
          internDemoProjectId,
          phaseNumber: phase.number,
          phaseName: phase.name,
          subtaskName: subtask,
        }).returning();
        rows.push(inserted);
      }
    }
    return rows;
  }

  async markInternshipProjectTaskComplete(taskId: string): Promise<InternshipProjectTask | null> {
    const [updated] = await db.update(internshipProjectTasks)
      .set({ completed: true, completedAt: new Date() })
      .where(eq(internshipProjectTasks.id, taskId))
      .returning();
    if (updated) {
      const allTasks = await this.getInternshipProjectTasks(updated.internDemoProjectId);
      if (allTasks.length > 0 && allTasks.every(t => t.completed)) {
        await this.updateInternDemoProjectStatus(updated.internDemoProjectId, "completed");
      }
    }
    return updated || null;
  }

  async toggleInternshipProjectTask(taskId: string): Promise<InternshipProjectTask | null> {
    const [task] = await db.select().from(internshipProjectTasks).where(eq(internshipProjectTasks.id, taskId));
    if (!task) return null;
    const newCompleted = !task.completed;
    const [updated] = await db.update(internshipProjectTasks)
      .set({ completed: newCompleted, completedAt: newCompleted ? new Date() : null })
      .where(eq(internshipProjectTasks.id, taskId))
      .returning();
    return updated;
  }

  async getInternshipProgress(internId: string): Promise<{ totalProjects: number; completedProjects: number; totalSubProjects: number; completedSubProjects: number; percentage: number }> {
    const selected = await this.getInternDemoProjects(internId);
    let completedProjects = 0;
    for (const proj of selected) {
      const tasks = await this.getInternshipProjectTasks(proj.id);
      if (tasks.length > 0 && tasks.every(t => t.completed)) {
        completedProjects++;
      }
    }

    const selectedSubs = await this.getInternSubProjects(internId);
    let completedSubProjects = 0;
    for (const sp of selectedSubs) {
      const tasks = await this.getSubProjectTasks(sp.id);
      if (tasks.length > 0 && tasks.every(t => t.completed)) {
        completedSubProjects++;
      }
    }

   // const mainContribution = Math.min(completedProjects * 50, 50);
   // const subContribution = Math.min(completedSubProjects * 25, 50);
   // const percentage = Math.min(100, mainContribution + subContribution);

    // Web3+AI category: 1 main project = 100%. Sub-projects do not apply.
    const intern = await this.getInternById(internId);
    let isWeb3 = false;
    if (intern?.categoryId) {
      const cat = await this.getCategoryById(intern.categoryId);
      if (cat?.name === "Web3+AI") isWeb3 = true;
    }
    const percentage = isWeb3
      ? (completedProjects >= 1 ? 100 : 0)
      : Math.min(100, (completedProjects * 50) + (completedSubProjects * 25));
    return {
      totalProjects: selected.length,
      completedProjects,
      totalSubProjects: selectedSubs.length,
      completedSubProjects,
      percentage,
    };
  }

  async getAllCategories(): Promise<InternCategory[]> {
    return await db.select().from(internCategories).orderBy(internCategories.name);
  }

  async getCategoryById(id: string): Promise<InternCategory | null> {
    const [cat] = await db.select().from(internCategories).where(eq(internCategories.id, id));
    return cat || null;
  }

  async createCategory(data: { name: string; description?: string; isActive?: boolean }): Promise<InternCategory> {
    const [cat] = await db.insert(internCategories).values(data).returning();
    return cat;
  }

  async updateCategory(id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<InternCategory | null> {
    const [cat] = await db.update(internCategories).set(data).where(eq(internCategories.id, id)).returning();
    return cat || null;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(internCategories).where(eq(internCategories.id, id));
  }

  async getAllSubcategories(): Promise<InternSubcategory[]> {
    return await db.select().from(internSubcategories).orderBy(internSubcategories.name);
  }

  async getSubcategoriesByCategory(categoryId: string): Promise<InternSubcategory[]> {
    return await db.select().from(internSubcategories).where(eq(internSubcategories.categoryId, categoryId)).orderBy(internSubcategories.name);
  }

  async createSubcategory(data: { categoryId: string; name: string; description?: string; isActive?: boolean }): Promise<InternSubcategory> {
    const [sub] = await db.insert(internSubcategories).values(data).returning();
    return sub;
  }

  async updateSubcategory(id: string, data: { name?: string; description?: string; isActive?: boolean; categoryId?: string }): Promise<InternSubcategory | null> {
    const [sub] = await db.update(internSubcategories).set(data).where(eq(internSubcategories.id, id)).returning();
    return sub || null;
  }

  async deleteSubcategory(id: string): Promise<void> {
    await db.delete(internSubcategories).where(eq(internSubcategories.id, id));
  }

  // ================= SUB PROJECTS =================

  async getAllSubProjects(): Promise<SubProject[]> {
    return db.select().from(subProjects).orderBy(desc(subProjects.createdAt));
  }

  async getSubProjectById(id: string): Promise<SubProject | null> {
    const [sp] = await db.select().from(subProjects).where(eq(subProjects.id, id));
    return sp || null;
  }

  async createSubProject(data: InsertSubProject): Promise<SubProject> {
    const [sp] = await db.insert(subProjects).values(data).returning();
    return sp;
  }

  async updateSubProject(id: string, data: Partial<InsertSubProject>): Promise<SubProject | null> {
    const [sp] = await db.update(subProjects).set(data).where(eq(subProjects.id, id)).returning();
    return sp || null;
  }

  async deleteSubProject(id: string): Promise<void> {
    await db.delete(subProjects).where(eq(subProjects.id, id));
  }

  async getInternSubProjects(internId: string): Promise<InternSubProject[]> {
    return db.select().from(internSubProjects).where(eq(internSubProjects.internId, internId));
  }

  async selectSubProject(internId: string, subProjectId: string): Promise<InternSubProject> {
    const existing = await this.getInternSubProjects(internId);
    if (existing.some(p => p.subProjectId === subProjectId)) throw new Error("Subproject already selected");
    const [selected] = await db.insert(internSubProjects).values({
      internId,
      subProjectId,
      status: "in-progress",
    }).returning();
    return selected;
  }

  async deleteInternSubProject(id: string): Promise<void> {
    await db.delete(subProjectTasks).where(eq(subProjectTasks.internSubProjectId, id));
    await db.delete(internSubProjects).where(eq(internSubProjects.id, id));
  }

  async updateInternSubProjectStatus(id: string, status: string): Promise<InternSubProject | null> {
    const [updated] = await db.update(internSubProjects)
      .set({ status, completedAt: status === "completed" ? new Date() : null })
      .where(eq(internSubProjects.id, id))
      .returning();
    return updated || null;
  }

  async getSubProjectTasks(internSubProjectId: string): Promise<SubProjectTask[]> {
    return db.select().from(subProjectTasks).where(eq(subProjectTasks.internSubProjectId, internSubProjectId)).orderBy(subProjectTasks.phaseNumber);
  }

  async initSubProjectTasks(internId: string, internSubProjectId: string): Promise<SubProjectTask[]> {
    const existing = await this.getSubProjectTasks(internSubProjectId);
    if (existing.length > 0) return existing;

    const [inserted] = await db.insert(subProjectTasks).values({
      internId,
      internSubProjectId,
      phaseNumber: 1,
      phaseName: "Complete Sub-Project",
      subtaskName: "Complete and submit this sub-project",
    }).returning();
    return [inserted];
  }

  async markSubProjectTaskComplete(taskId: string): Promise<SubProjectTask | null> {
    const [updated] = await db.update(subProjectTasks)
      .set({ completed: true, completedAt: new Date() })
      .where(eq(subProjectTasks.id, taskId))
      .returning();
    if (updated) {
      const allTasks = await this.getSubProjectTasks(updated.internSubProjectId);
      if (allTasks.length > 0 && allTasks.every(t => t.completed)) {
        await this.updateInternSubProjectStatus(updated.internSubProjectId, "completed");
      }
    }
    return updated || null;
  }

  async toggleSubProjectTask(taskId: string): Promise<SubProjectTask | null> {
    const [task] = await db.select().from(subProjectTasks).where(eq(subProjectTasks.id, taskId));
    if (!task) return null;
    const newCompleted = !task.completed;
    const [updated] = await db.update(subProjectTasks)
      .set({ completed: newCompleted, completedAt: newCompleted ? new Date() : null })
      .where(eq(subProjectTasks.id, taskId))
      .returning();
    return updated;
  }

  async startSubProjectTask(taskId: string): Promise<SubProjectTask | null> {
    const [task] = await db.select().from(subProjectTasks).where(eq(subProjectTasks.id, taskId));
    if (!task || task.started || task.completed) return null;
    const [updated] = await db.update(subProjectTasks)
      .set({ started: true, startedAt: new Date() })
      .where(eq(subProjectTasks.id, taskId))
      .returning();
    return updated || null;
  }

  async submitSubProjectTask(taskId: string, comment: string | null): Promise<SubProjectTask | null> {
    const [task] = await db.select().from(subProjectTasks).where(eq(subProjectTasks.id, taskId));
    if (!task || !task.started || task.completed) return null;
    const trimmed = comment?.trim() || null;
    const [updated] = await db.update(subProjectTasks)
      .set({ completed: true, completedAt: new Date(), submitComment: trimmed })
      .where(eq(subProjectTasks.id, taskId))
      .returning();
    if (updated) {
      const allTasks = await this.getSubProjectTasks(updated.internSubProjectId);
      if (allTasks.length > 0 && allTasks.every(t => t.completed)) {
        await this.updateInternSubProjectStatus(updated.internSubProjectId, "completed");
      }
    }
    return updated || null;
  }

  async getCourseTopicsByCategory(categoryId: string): Promise<CourseTopic[]> {
    return db.select().from(courseTopics)
      .where(and(eq(courseTopics.categoryId, categoryId), eq(courseTopics.isActive, true)))
      .orderBy(courseTopics.sortOrder);
  }

  async getAllCourseTopics(): Promise<CourseTopic[]> {
    return db.select().from(courseTopics).orderBy(courseTopics.sortOrder);
  }

  async createCourseTopic(data: InsertCourseTopic): Promise<CourseTopic> {
    const [topic] = await db.insert(courseTopics).values(data).returning();
    return topic;
  }

  async updateCourseTopic(id: string, data: Partial<InsertCourseTopic>): Promise<CourseTopic | null> {
    const [updated] = await db.update(courseTopics).set(data).where(eq(courseTopics.id, id)).returning();
    return updated || null;
  }

  async deleteCourseTopic(id: string): Promise<void> {
    await db.delete(courseTopics).where(eq(courseTopics.id, id));
  }

  async createDaoApplication(data: Omit<InsertDaoApplication, "id" | "createdAt" | "status">): Promise<DaoApplication> {
    const [app] = await db.insert(daoApplications).values(data).returning();
    return app;
  }

  async getAllDaoApplications(): Promise<DaoApplication[]> {
    return db.select().from(daoApplications).orderBy(desc(daoApplications.createdAt));
  }

  async getDaoApplicationById(id: string): Promise<DaoApplication | null> {
    const [app] = await db.select().from(daoApplications).where(eq(daoApplications.id, id));
    return app || null;
  }

  async updateDaoApplicationStatus(id: string, status: string): Promise<DaoApplication | null> {
    const [app] = await db.update(daoApplications).set({ status }).where(eq(daoApplications.id, id)).returning();
    return app || null;
  }

  async getAllVideos(): Promise<Video[]> {
    return db.select().from(videos).orderBy(desc(videos.createdAt));
  }

  async getVideoById(id: string): Promise<Video | null> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video || null;
  }

  async getVideosByCategory(categoryId: string): Promise<Video[]> {
    return db.select().from(videos).where(eq(videos.categoryId, categoryId)).orderBy(desc(videos.createdAt));
  }

  async getVideosByType(videoType: string): Promise<Video[]> {
    return db.select().from(videos).where(eq(videos.videoType, videoType)).orderBy(desc(videos.createdAt));
  }

  async getInternVideos(
    videoType: string,
    categoryId: string | null,
    subcategoryId: string | null = null,
  ): Promise<Video[]> {
    const conditions = [
      eq(videos.videoType, videoType),
      eq(videos.isActive, true),
    ];
    if (categoryId) {
      conditions.push(
        or(
          eq(videos.categoryId, categoryId),
          isNull(videos.categoryId),
        )! as any,
      );
    } else {
      conditions.push(isNull(videos.categoryId));
    }
    if (subcategoryId) {
      conditions.push(
        or(
          eq(videos.subcategoryId, subcategoryId),
          isNull(videos.subcategoryId),
        )! as any,
      );
    }
    return db
      .select()
      .from(videos)
      .where(and(...conditions))
      .orderBy(desc(videos.createdAt));
  }

  async createVideo(data: InsertVideo): Promise<Video> {
    const [video] = await db.insert(videos).values(data).returning();
    return video;
  }

  async updateVideo(id: string, data: Partial<InsertVideo>): Promise<Video | null> {
    const [video] = await db.update(videos).set(data).where(eq(videos.id, id)).returning();
    return video || null;
  }

  async deleteVideo(id: string): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
  }

  async getSocialFollowsByIntern(internId: string): Promise<SocialFollow[]> {
    return await db.select().from(socialFollows).where(eq(socialFollows.internId, internId));
  }

  async markSocialFollow(internId: string, platform: string): Promise<SocialFollow> {
    const [follow] = await db.insert(socialFollows)
      .values({ internId, platform })
      .onConflictDoNothing()
      .returning();
    if (follow) return follow;
    const [existing] = await db.select().from(socialFollows)
      .where(and(eq(socialFollows.internId, internId), eq(socialFollows.platform, platform)));
    return existing;
  }

  /* ================= INTERN MESSAGES ================= */

  async createInternMessage(
    data: Omit<InsertInternMessage, "id" | "createdAt" | "isRead"> & { isRead?: boolean },
  ): Promise<InternMessage> {
    const [row] = await db
      .insert(internMessages)
      .values({
        internId: data.internId,
        senderType: data.senderType,
        subject: data.subject,
        message: data.message,
        adminUsername: data.adminUsername ?? null,
        isRead: data.isRead ?? false,
      })
      .returning();
    return row;
  }

  async getMessagesByIntern(internId: string): Promise<InternMessage[]> {
    return await db
      .select()
      .from(internMessages)
      .where(eq(internMessages.internId, internId))
      .orderBy(internMessages.createdAt);
  }

  async getAllInternMessages(): Promise<InternMessage[]> {
    return await db
      .select()
      .from(internMessages)
      .orderBy(desc(internMessages.createdAt));
  }

  async markInternMessagesReadByAdmin(internId: string): Promise<void> {
    await db
      .update(internMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(internMessages.internId, internId),
          eq(internMessages.senderType, "intern"),
          eq(internMessages.isRead, false),
        ),
      );
  }

  async markInternMessagesReadByIntern(internId: string): Promise<void> {
    await db
      .update(internMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(internMessages.internId, internId),
          eq(internMessages.senderType, "admin"),
          eq(internMessages.isRead, false),
        ),
      );
  }
}


export const storage = new PostgresStorage();

async function migrateInternshipPhaseNames() {
  const PHASES: { number: number; name: string; subtasks: string[] }[] = [
    { number: 1, name: "Project Selection", subtasks: ["Select project from available campaign/repository list"] },
    { number: 2, name: "Production & Execution", subtasks: ["Implement core requirements", "Conduct quality/compliance checks", "Review against project brief"] },
    { number: 3, name: "Refinement & Revisions", subtasks: ["Optimize performance/messaging", "Fix issues or address feedback"] },
    { number: 4, name: "Staging & Final Review", subtasks: ["Prepare for final delivery", "Internal testing or proofreading"] },
    { number: 5, name: "Project Finalization", subtasks: ["Finalize assets or codebase", "Generate project documentation/report"] },
    { number: 6, name: "Live Launch", subtasks: ["Public release or campaign activation"] },
    { number: 7, name: "Final Submission", subtasks: ["Submit completion proof for verification"] },
  ];

  for (const phase of PHASES) {
    await db
      .update(internshipProjectTasks)
      .set({ phaseName: phase.name })
      .where(
        and(
          eq(internshipProjectTasks.phaseNumber, phase.number),
          ne(internshipProjectTasks.phaseName, phase.name),
        ),
      );
  }

  const projectIds = await db
    .selectDistinct({ id: internshipProjectTasks.internDemoProjectId })
    .from(internshipProjectTasks);

  for (const { id: projectId } of projectIds) {
    for (const phase of PHASES) {
      const rows = await db
        .select()
        .from(internshipProjectTasks)
        .where(
          and(
            eq(internshipProjectTasks.internDemoProjectId, projectId),
            eq(internshipProjectTasks.phaseNumber, phase.number),
          ),
        )
        .orderBy(internshipProjectTasks.createdAt);

      if (rows.length !== phase.subtasks.length) continue;

      for (let i = 0; i < rows.length; i++) {
        const expected = phase.subtasks[i];
        if (rows[i].subtaskName !== expected) {
          await db
            .update(internshipProjectTasks)
            .set({ subtaskName: expected })
            .where(eq(internshipProjectTasks.id, rows[i].id));
        }
      }
    }
  }
}

export async function seedAllData() {
  await migrateInternshipPhaseNames();

  const CAT_WEB3 = "f90cf240-9aa2-4c48-813f-b9b6a1ff4ddd";
  const CAT_GFX  = "6bd07b38-ca78-46b0-87fd-1030326a029f";
  const CAT_BIZ  = "98e7d6e1-6a62-4fb1-8ad1-1a20b86883f4";
  const CAT_DAO  = "ff79379f-f1d5-4139-9a27-dbf88c0cada2";
  const CAT_DM   = "8844070f-fcec-4b6e-906c-5d84f1c05f63";

  const existingCats = await db.select().from(internCategories);
  if (existingCats.length === 0) {
    await db.insert(internCategories).values([
      { id: CAT_WEB3, name: "Web3+AI", description: "Blockchain, Smart Contracts, DApps & Web3 Security", isActive: true },
      { id: CAT_GFX, name: "Graphics Design", description: "UI/UX Design, Graphic Design & Visual Media", isActive: true },
      { id: CAT_BIZ, name: "Business Development", description: "Business Strategy, Sales, Marketing & Growth", isActive: true },
      { id: CAT_DAO, name: "DAO", description: "DAO", isActive: true },
      { id: CAT_DM, name: "Digital Marketing", description: "Digital Marketing", isActive: true },
    ]);
    console.log("Seeded 5 intern categories");
  }

  const existingSubs = await db.select().from(internSubcategories);
  if (existingSubs.length === 0) {
    await db.insert(internSubcategories).values([
      { id: "010f41e0-db0e-4306-b73a-1e1ca995c4cd", categoryId: CAT_WEB3, name: "Smart Contract Development", description: "Solidity smart contract development", isActive: true },
      { id: "f043b1fb-f58b-4520-ad9c-47c745b01604", categoryId: CAT_WEB3, name: "DApp Development", description: "Decentralized application development", isActive: true },
      { id: "7cdbb517-362f-4671-8cc7-5fca2fb9597e", categoryId: CAT_WEB3, name: "Blockchain Security", description: "Security analysis and penetration testing", isActive: true },
      { id: "0da25267-44ec-46e6-9da3-75689592b75e", categoryId: CAT_WEB3, name: "DeFi Protocols", description: "Decentralized finance protocol development", isActive: true },
      { id: "57031376-79d9-433e-b844-8b4103bbdd6f", categoryId: CAT_WEB3, name: "Audit Finding", description: "Smart contract audit and vulnerability detection", isActive: true },
      { id: "1c22003a-6c3e-4088-b39d-7533a17c185d", categoryId: CAT_GFX, name: "UI Design", description: "User interface design and prototyping", isActive: true },
      { id: "580c0f6a-2e85-4632-bb8f-d7afbf32e25a", categoryId: CAT_GFX, name: "UX Research", description: "User experience research and testing", isActive: true },
      { id: "2c79fd02-cfe0-43cf-8851-dae230985334", categoryId: CAT_GFX, name: "Brand Design", description: "Logo, branding and visual identity", isActive: true },
      { id: "5b0b7b56-53d6-4d49-b491-99093d9db941", categoryId: CAT_GFX, name: "Motion Graphics", description: "Animation and motion design", isActive: true },
      { id: "98c4b40b-2326-4c38-b9aa-97892ae3d87a", categoryId: CAT_BIZ, name: "Growth Strategy", description: "Business growth and scaling strategies", isActive: true },
      { id: "5e52556b-5154-403c-8279-bd67ec1cf174", categoryId: CAT_BIZ, name: "Digital Marketing", description: "SEO, PPC, and social media marketing", isActive: true },
      { id: "46b1b4e3-be30-48fb-9abd-adf15ffb9160", categoryId: CAT_BIZ, name: "Search & Outreach", description: "Lead generation and client outreach", isActive: true },
      { id: "8d489648-a647-4095-8236-92f4c5235737", categoryId: CAT_BIZ, name: "Community Management", description: "Web3 community building and engagement", isActive: true },
    ]);
    console.log("Seeded 13 intern subcategories");
  }

  const existingModules = await db.select().from(courseModules);
  const hasUncategorized = existingModules.length > 0 && existingModules.every(m => !m.internCategoryId);
  if (hasUncategorized) {
    await db.delete(courseModules);
    console.log(`Deleted ${existingModules.length} legacy course modules without category IDs`);
  }
  if (existingModules.length === 0 || hasUncategorized) {
    const web3Modules = [
      { weekNumber: 1, title: "Development Environment Setup", description: "Install Node.js, npm/yarn, VS Code, and wallets (MetaMask, Trust Wallet, Coinmask, TokenPocket, OKX Wallet, Coinbase Wallet)", category: "setup", orderIndex: 1, internCategoryId: CAT_WEB3 },
      { weekNumber: 1, title: "HelloWorld Smart Contract", description: "Deploy HelloWorld contract on Sepolia using Remix IDE", category: "smart-contracts", orderIndex: 2, internCategoryId: CAT_WEB3 },
      { weekNumber: 1, title: "Counter Smart Contract", description: "Deploy Counter contract on Sepolia", category: "smart-contracts", orderIndex: 3, internCategoryId: CAT_WEB3 },
      { weekNumber: 1, title: "Simple Storage Contract", description: "Deploy Simple Storage contract on Sepolia", category: "smart-contracts", orderIndex: 4, internCategoryId: CAT_WEB3 },
      { weekNumber: 1, title: "Ownable Pattern Contract", description: "Deploy Ownable pattern contract on Sepolia", category: "smart-contracts", orderIndex: 5, internCategoryId: CAT_WEB3 },
      { weekNumber: 1, title: "Ether Transfer Smart Contract", description: "Deploy Ether Transfer contract on Sepolia", category: "smart-contracts", orderIndex: 6, internCategoryId: CAT_WEB3 },
      { weekNumber: 1, title: "Ethereum Account & Ownership Example", description: "Deploy Account & Ownership contract on Sepolia", category: "smart-contracts", orderIndex: 7, internCategoryId: CAT_WEB3 },
      { weekNumber: 1, title: "Student Registration Contract", description: "Deploy Student Registration contract on Sepolia", category: "smart-contracts", orderIndex: 8, internCategoryId: CAT_WEB3 },
      { weekNumber: 1, title: "Simple Voting Contract", description: "Deploy Simple Voting contract on Sepolia", category: "smart-contracts", orderIndex: 9, internCategoryId: CAT_WEB3 },
      { weekNumber: 1, title: "Store & Update Internship Task Status", description: "Deploy task status tracking contract on Sepolia", category: "smart-contracts", orderIndex: 10, internCategoryId: CAT_WEB3 },
      { weekNumber: 1, title: "Counter App (React)", description: "Build a Counter App using React", category: "react-basics", orderIndex: 11, internCategoryId: CAT_WEB3 },
      { weekNumber: 1, title: "Input Form App (React)", description: "Build an Input Form App using React", category: "react-basics", orderIndex: 12, internCategoryId: CAT_WEB3 },
      { weekNumber: 1, title: "Todo List App (React)", description: "Build a Todo List App using React", category: "react-basics", orderIndex: 13, internCategoryId: CAT_WEB3 },
      { weekNumber: 1, title: "Simple API Fetch Example (React)", description: "Build a Simple API Fetch example using React", category: "react-basics", orderIndex: 14, internCategoryId: CAT_WEB3 },
      { weekNumber: 1, title: "Component Reuse Example (React)", description: "Build a Component Reuse example using React", category: "react-basics", orderIndex: 15, internCategoryId: CAT_WEB3 },
      { weekNumber: 1, title: "AI Concept Documentation", description: "Document AI concepts and basics", category: "ai-basics", orderIndex: 16, internCategoryId: CAT_WEB3 },
      { weekNumber: 2, title: "Intern Reward Token (ERC20)", description: "Deploy ERC20 Intern Reward Token smart contract", category: "erc20", orderIndex: 1, internCategoryId: CAT_WEB3 },
      { weekNumber: 2, title: "Task Completion Token (ERC20)", description: "Deploy ERC20 Task Completion Token smart contract", category: "erc20", orderIndex: 2, internCategoryId: CAT_WEB3 },
      { weekNumber: 2, title: "Attendance Token (ERC20)", description: "Deploy ERC20 Attendance Token smart contract", category: "erc20", orderIndex: 3, internCategoryId: CAT_WEB3 },
      { weekNumber: 2, title: "Internship Certificate NFT (ERC721)", description: "Deploy ERC721 Internship Certificate NFT contract", category: "erc721", orderIndex: 4, internCategoryId: CAT_WEB3 },
      { weekNumber: 2, title: "Course Completion NFT (ERC721)", description: "Deploy ERC721 Course Completion NFT contract", category: "erc721", orderIndex: 5, internCategoryId: CAT_WEB3 },
      { weekNumber: 2, title: "Achievement Badge NFT (ERC721)", description: "Deploy ERC721 Achievement Badge NFT contract", category: "erc721", orderIndex: 6, internCategoryId: CAT_WEB3 },
      { weekNumber: 2, title: "NFT Minting Contract", description: "Create and deploy NFT minting contract", category: "erc721", orderIndex: 7, internCategoryId: CAT_WEB3 },
      { weekNumber: 2, title: "Intern Registration API", description: "Build Intern Registration REST API with Node.js & Express", category: "backend", orderIndex: 8, internCategoryId: CAT_WEB3 },
      { weekNumber: 2, title: "Task Submission API", description: "Build Task Submission REST API with Node.js & Express", category: "backend", orderIndex: 9, internCategoryId: CAT_WEB3 },
      { weekNumber: 2, title: "Token Minting API", description: "Build Token Minting REST API with Node.js & Express", category: "backend", orderIndex: 10, internCategoryId: CAT_WEB3 },
      { weekNumber: 2, title: "Intern Profile Database", description: "Set up MongoDB Intern Profile Database", category: "database", orderIndex: 11, internCategoryId: CAT_WEB3 },
      { weekNumber: 2, title: "Task Tracking Database", description: "Set up MongoDB Task Tracking Database", category: "database", orderIndex: 12, internCategoryId: CAT_WEB3 },
      { weekNumber: 2, title: "NFT Record Database", description: "Set up MongoDB NFT Record Database", category: "database", orderIndex: 13, internCategoryId: CAT_WEB3 },
      { weekNumber: 2, title: "Web3 DApp (React + Backend)", description: "Connect React frontend to backend - build one of: Internship Reward DApp, NFT Certificate Issuer DApp, or Intern Management Web3 App", category: "fullstack", orderIndex: 14, internCategoryId: CAT_WEB3 },
      { weekNumber: 3, title: "Staking Smart Contract", description: "Develop a staking smart contract", category: "defi", orderIndex: 1, internCategoryId: CAT_WEB3 },
      { weekNumber: 3, title: "Full-Stack Blockchain Integration", description: "Integrate frontend, backend & blockchain into a working DApp", category: "integration", orderIndex: 2, internCategoryId: CAT_WEB3 },
      { weekNumber: 3, title: "Security Issue Analysis", description: "Analyze and document security vulnerabilities in smart contracts", category: "security", orderIndex: 3, internCategoryId: CAT_WEB3 },
      { weekNumber: 3, title: "ML Mini-Experiment", description: "Conduct a machine learning mini-experiment", category: "ai", orderIndex: 4, internCategoryId: CAT_WEB3 },
      { weekNumber: 3, title: "Staking DApp Deliverable", description: "Complete and deploy the Staking DApp", category: "deliverable", orderIndex: 5, internCategoryId: CAT_WEB3 },
      { weekNumber: 3, title: "Security Report Deliverable", description: "Write and submit the security analysis report", category: "deliverable", orderIndex: 6, internCategoryId: CAT_WEB3 },
      { weekNumber: 4, title: "Final Project Selection", description: "Choose one final project: NFT Marketplace, DeFi Staking Platform, Token Vesting System, Mini DEX, or DAO Governance Platform", category: "research-design", orderIndex: 1, internCategoryId: CAT_WEB3 },
      { weekNumber: 4, title: "Project Requirements & Use Cases", description: "Understand the project requirements and use cases. Study similar existing protocols (NFT marketplaces, staking platforms, etc.)", category: "research-design", orderIndex: 2, internCategoryId: CAT_WEB3 },
      { weekNumber: 4, title: "System Architecture Design", description: "Design system architecture and smart contract logic. Prepare technical documentation and workflow diagrams", category: "research-design", orderIndex: 3, internCategoryId: CAT_WEB3 },
      { weekNumber: 4, title: "Smart Contract Development", description: "Write and implement smart contracts for the selected final project", category: "development", orderIndex: 4, internCategoryId: CAT_WEB3 },
      { weekNumber: 4, title: "Frontend Integration (React + Web3)", description: "Integrate frontend using React / Web3.js / Ethers.js with the smart contracts", category: "development", orderIndex: 5, internCategoryId: CAT_WEB3 },
      { weekNumber: 4, title: "Wallet Connection Integration", description: "Connect wallet functionality (MetaMask, WalletConnect, Coinbase Wallet) to the DApp", category: "development", orderIndex: 6, internCategoryId: CAT_WEB3 },
      { weekNumber: 4, title: "Blockchain Network & API Integration", description: "Integrate blockchain network and APIs for full DApp functionality", category: "development", orderIndex: 7, internCategoryId: CAT_WEB3 },
      { weekNumber: 4, title: "Smart Contract Unit Testing", description: "Perform unit testing of smart contracts using Hardhat / Foundry", category: "testing", orderIndex: 8, internCategoryId: CAT_WEB3 },
      { weekNumber: 4, title: "Security & Edge-Case Testing", description: "Conduct security checks and edge-case testing on smart contracts", category: "testing", orderIndex: 9, internCategoryId: CAT_WEB3 },
      { weekNumber: 4, title: "Gas Optimization & Performance", description: "Optimize gas usage and improve performance. Fix bugs and validate functionality", category: "testing", orderIndex: 10, internCategoryId: CAT_WEB3 },
      { weekNumber: 4, title: "Testnet/Mainnet Deployment", description: "Deploy smart contracts to testnet or mainnet. Verify contracts on blockchain explorer", category: "deployment", orderIndex: 11, internCategoryId: CAT_WEB3 },
      { weekNumber: 4, title: "GitHub Publication & Contract Details", description: "Publish project code on GitHub with deployed contract address, full integration steps and project details", category: "deployment", orderIndex: 12, internCategoryId: CAT_WEB3 },
      { weekNumber: 4, title: "Documentation & Demo Video", description: "Submit final documentation and demo video. Publish DApp on Vercel (https://vercel.com/)", category: "deployment", orderIndex: 13, internCategoryId: CAT_WEB3 },
    ];

    const dmModules = [
      { weekNumber: 1, title: "Introduction to Digital Marketing", description: "Understand the core concepts, channels, and strategies of digital marketing", category: "foundations", orderIndex: 1, internCategoryId: CAT_DM },
      { weekNumber: 1, title: "SEO (Search Engine Optimization)", description: "Learn the fundamentals of SEO including how search engines work, ranking factors, and organic traffic growth", category: "seo", orderIndex: 2, internCategoryId: CAT_DM },
      { weekNumber: 1, title: "SEM (Search Engine Marketing)", description: "Understand paid search advertising, Google Ads basics, and the difference between SEO and SEM", category: "sem", orderIndex: 3, internCategoryId: CAT_DM },
      { weekNumber: 1, title: "Content Marketing", description: "Learn content marketing strategies, content types, storytelling, and how to create valuable content for audiences", category: "content", orderIndex: 4, internCategoryId: CAT_DM },
      { weekNumber: 1, title: "Social Media Marketing", description: "Explore social media platforms, organic vs paid social strategies, and building an online presence", category: "social-media", orderIndex: 5, internCategoryId: CAT_DM },
      { weekNumber: 1, title: "Basics of Branding", description: "Understand brand identity, positioning, messaging, and visual branding fundamentals", category: "branding", orderIndex: 6, internCategoryId: CAT_DM },
      { weekNumber: 1, title: "Research 5 Competitors", description: "Research 5 competitors analyzing their website and social media presence, strengths, and weaknesses", category: "task", orderIndex: 7, internCategoryId: CAT_DM },
      { weekNumber: 1, title: "Create 3 Social Media Posts", description: "Create 3 social media posts using Canva with engaging visuals and captions", category: "task", orderIndex: 8, internCategoryId: CAT_DM },
      { weekNumber: 1, title: "Write 1 SEO-Friendly Blog", description: "Write 1 SEO-friendly blog post with proper keyword placement, meta description, and formatting", category: "task", orderIndex: 9, internCategoryId: CAT_DM },
      { weekNumber: 1, title: "Identify 20 Keywords", description: "Perform basic keyword research and identify 20 relevant keywords for a chosen niche or product", category: "task", orderIndex: 10, internCategoryId: CAT_DM },
      { weekNumber: 1, title: "Optimize LinkedIn Profile", description: "Optimize your LinkedIn profile with professional headline, summary, skills, and relevant content", category: "task", orderIndex: 11, internCategoryId: CAT_DM },
      { weekNumber: 2, title: "On-Page SEO", description: "Master on-page SEO techniques including meta tags, keyword optimization, header tags, and internal linking", category: "seo", orderIndex: 1, internCategoryId: CAT_DM },
      { weekNumber: 2, title: "Off-Page SEO", description: "Learn off-page SEO strategies including backlink building, guest posting, and domain authority improvement", category: "seo", orderIndex: 2, internCategoryId: CAT_DM },
      { weekNumber: 2, title: "Keyword Research Techniques", description: "Advanced keyword research using tools like Google Keyword Planner, Ubersuggest, and Ahrefs", category: "seo", orderIndex: 3, internCategoryId: CAT_DM },
      { weekNumber: 2, title: "Technical SEO", description: "Understand technical SEO including site speed optimization, mobile responsiveness, crawlability, and Core Web Vitals", category: "seo", orderIndex: 4, internCategoryId: CAT_DM },
      { weekNumber: 2, title: "Blog Optimization", description: "Learn to optimize existing blog content for better search rankings, readability, and user engagement", category: "content", orderIndex: 5, internCategoryId: CAT_DM },
      { weekNumber: 2, title: "Perform Keyword Research (20-30 Keywords)", description: "Conduct comprehensive keyword research and compile a list of 20-30 targeted keywords with search volume and difficulty", category: "task", orderIndex: 6, internCategoryId: CAT_DM },
      { weekNumber: 2, title: "Optimize 1 Blog (SEO-Based)", description: "Take an existing blog post and fully optimize it for SEO with keywords, meta tags, and internal links", category: "task", orderIndex: 7, internCategoryId: CAT_DM },
      { weekNumber: 2, title: "Create 5 Backlinks", description: "Build 5 backlinks through directory submissions, social sharing, and outreach strategies", category: "task", orderIndex: 8, internCategoryId: CAT_DM },
      { weekNumber: 2, title: "Audit Website (SEO + Speed Test)", description: "Perform a complete website audit covering SEO health, page speed, mobile optimization, and technical issues", category: "task", orderIndex: 9, internCategoryId: CAT_DM },
      { weekNumber: 2, title: "Write 2 SEO Blogs", description: "Write 2 fully SEO-optimized blog posts with proper keyword targeting, formatting, and calls-to-action", category: "task", orderIndex: 10, internCategoryId: CAT_DM },
      { weekNumber: 3, title: "Social Media Strategy (Instagram, LinkedIn)", description: "Develop platform-specific social media strategies for Instagram and LinkedIn with engagement tactics", category: "social-media", orderIndex: 1, internCategoryId: CAT_DM },
      { weekNumber: 3, title: "Paid Ads (Facebook/Instagram Ads Basics)", description: "Learn the fundamentals of Facebook and Instagram advertising including campaign setup, targeting, and budgeting", category: "paid-ads", orderIndex: 2, internCategoryId: CAT_DM },
      { weekNumber: 3, title: "Target Audience & Customer Persona", description: "Define target audiences and create detailed customer personas for effective marketing campaigns", category: "strategy", orderIndex: 3, internCategoryId: CAT_DM },
      { weekNumber: 3, title: "Branding & Content Planning", description: "Develop brand guidelines and create structured content plans aligned with brand identity", category: "branding", orderIndex: 4, internCategoryId: CAT_DM },
      { weekNumber: 3, title: "Ad Copywriting", description: "Master ad copywriting techniques for compelling headlines, descriptions, and calls-to-action", category: "content", orderIndex: 5, internCategoryId: CAT_DM },
      { weekNumber: 3, title: "Create 5 Social Media Posts + 2 Reel Ideas", description: "Design 5 social media posts and conceptualize 2 reel/short video ideas with scripts and storyboards", category: "task", orderIndex: 6, internCategoryId: CAT_DM },
      { weekNumber: 3, title: "Design 1 Ad Campaign (Demo)", description: "Create a complete demo ad campaign with target audience, budget allocation, ad creatives, and placement strategy", category: "task", orderIndex: 7, internCategoryId: CAT_DM },
      { weekNumber: 3, title: "Write Ad Copy (Headline + Description)", description: "Write professional ad copy including compelling headlines and descriptions for multiple ad formats", category: "task", orderIndex: 8, internCategoryId: CAT_DM },
      { weekNumber: 3, title: "Create 7-Day Content Calendar", description: "Build a detailed 7-day content calendar with daily posts, platform assignments, and content themes", category: "task", orderIndex: 9, internCategoryId: CAT_DM },
      { weekNumber: 3, title: "Analyze Competitor Ads", description: "Analyze competitor ad campaigns across platforms, noting targeting strategies, creatives, and messaging", category: "task", orderIndex: 10, internCategoryId: CAT_DM },
      { weekNumber: 4, title: "Performance Marketing (ROI-Based Ads)", description: "Learn performance marketing principles including ROI measurement, cost-per-acquisition, and data-driven ad optimization", category: "advanced", orderIndex: 1, internCategoryId: CAT_DM },
      { weekNumber: 4, title: "Marketing Analytics", description: "Master marketing analytics using Google Analytics, social media insights, and campaign performance metrics", category: "analytics", orderIndex: 2, internCategoryId: CAT_DM },
      { weekNumber: 4, title: "Conversion Tracking", description: "Implement conversion tracking with pixels, UTM parameters, and attribution models across marketing channels", category: "analytics", orderIndex: 3, internCategoryId: CAT_DM },
      { weekNumber: 4, title: "Email Marketing & Automation", description: "Learn email marketing strategies, list building, campaign design, and marketing automation workflows", category: "email", orderIndex: 4, internCategoryId: CAT_DM },
      { weekNumber: 4, title: "Select 1 Product/Service", description: "Choose 1 product or service as the subject for your final marketing strategy project", category: "final-project", orderIndex: 5, internCategoryId: CAT_DM },
      { weekNumber: 4, title: "Create Full Marketing Strategy", description: "Develop a complete marketing strategy including SEO plan, social media plan, ad campaign idea, and lead generation strategy", category: "final-project", orderIndex: 6, internCategoryId: CAT_DM },
      { weekNumber: 4, title: "Present Final Pitch", description: "Prepare and present a final pitch showcasing the complete marketing strategy with projected outcomes and KPIs", category: "final-project", orderIndex: 7, internCategoryId: CAT_DM },
    ];

    const gfxModules = [
      { weekNumber: 1, title: "Introduction to Graphic Design", description: "Understand the fundamentals of graphic design, its history, applications, and career paths", category: "foundations", orderIndex: 1, internCategoryId: CAT_GFX },
      { weekNumber: 1, title: "Design Principles (Color, Typography, Layout)", description: "Learn core design principles including color theory, typography hierarchy, and effective layout composition", category: "foundations", orderIndex: 2, internCategoryId: CAT_GFX },
      { weekNumber: 1, title: "Branding Basics", description: "Understand branding fundamentals including brand identity, visual language, and brand consistency", category: "branding", orderIndex: 3, internCategoryId: CAT_GFX },
      { weekNumber: 1, title: "Canva & Photoshop Basics", description: "Get hands-on with Canva and Adobe Photoshop basics including workspace navigation, tools, and essential workflows", category: "tools", orderIndex: 4, internCategoryId: CAT_GFX },
      { weekNumber: 1, title: "Create 3 Social Media Posts", description: "Design 3 visually appealing social media posts applying learned design principles and tools", category: "task", orderIndex: 5, internCategoryId: CAT_GFX },
      { weekNumber: 1, title: "Design 1 Typography Poster", description: "Create 1 typography poster showcasing font pairing, hierarchy, and creative text layout", category: "task", orderIndex: 6, internCategoryId: CAT_GFX },
      { weekNumber: 1, title: "Create 3 Color Palettes", description: "Design 3 unique color palettes for different moods/brands using color theory principles", category: "task", orderIndex: 7, internCategoryId: CAT_GFX },
      { weekNumber: 1, title: "Recreate 1 Existing Design", description: "Pick an existing professional design and recreate it to practice tool proficiency and design accuracy", category: "task", orderIndex: 8, internCategoryId: CAT_GFX },
      { weekNumber: 2, title: "Social Media Design Strategy", description: "Learn platform-specific design requirements, visual storytelling, and creating scroll-stopping content", category: "social-media", orderIndex: 1, internCategoryId: CAT_GFX },
      { weekNumber: 2, title: "Branding Consistency", description: "Understand how to maintain visual consistency across all brand touchpoints and marketing materials", category: "branding", orderIndex: 2, internCategoryId: CAT_GFX },
      { weekNumber: 2, title: "Ad Creatives (Instagram/Facebook)", description: "Learn to design effective ad creatives for Instagram and Facebook with proper sizing, CTAs, and visual hierarchy", category: "ad-design", orderIndex: 3, internCategoryId: CAT_GFX },
      { weekNumber: 2, title: "Content Layout & Grid System", description: "Master grid-based layouts and content structuring for clean, organized, and professional designs", category: "foundations", orderIndex: 4, internCategoryId: CAT_GFX },
      { weekNumber: 2, title: "Create 5 Instagram Posts (Brand-Based)", description: "Design 5 brand-consistent Instagram posts following a cohesive visual theme and style guide", category: "task", orderIndex: 5, internCategoryId: CAT_GFX },
      { weekNumber: 2, title: "Design 2 Ad Creatives", description: "Create 2 professional ad creatives for Instagram/Facebook with compelling visuals and copy placement", category: "task", orderIndex: 6, internCategoryId: CAT_GFX },
      { weekNumber: 2, title: "Create 1 Carousel Post", description: "Design 1 multi-slide carousel post with consistent styling, flow, and engaging content layout", category: "task", orderIndex: 7, internCategoryId: CAT_GFX },
      { weekNumber: 2, title: "Design Story Templates", description: "Create a set of reusable Instagram/social media story templates with consistent brand styling", category: "task", orderIndex: 8, internCategoryId: CAT_GFX },
      { weekNumber: 3, title: "UI Design Basics (Figma)", description: "Learn Figma fundamentals including components, auto-layout, prototyping, and UI design principles", category: "ui-design", orderIndex: 1, internCategoryId: CAT_GFX },
      { weekNumber: 3, title: "Wireframing", description: "Understand wireframing concepts, low-fidelity vs high-fidelity wireframes, and user flow mapping", category: "ui-design", orderIndex: 2, internCategoryId: CAT_GFX },
      { weekNumber: 3, title: "Logo Design", description: "Learn logo design principles, types of logos, sketching concepts, and creating professional logo marks", category: "branding", orderIndex: 3, internCategoryId: CAT_GFX },
      { weekNumber: 3, title: "Advanced Photoshop/Illustrator", description: "Master advanced techniques in Photoshop and Illustrator including photo manipulation, vector graphics, and effects", category: "tools", orderIndex: 4, internCategoryId: CAT_GFX },
      { weekNumber: 3, title: "Design 1 Logo", description: "Create 1 professional logo design with variations (full, icon-only, monochrome) for a brand", category: "task", orderIndex: 5, internCategoryId: CAT_GFX },
      { weekNumber: 3, title: "Create 1 UI Screen (Website/App)", description: "Design 1 complete UI screen for a website or mobile app using Figma with proper spacing and components", category: "task", orderIndex: 6, internCategoryId: CAT_GFX },
      { weekNumber: 3, title: "Create Wireframe Layout", description: "Build a wireframe layout for a website or app showing page structure, navigation, and content placement", category: "task", orderIndex: 7, internCategoryId: CAT_GFX },
      { weekNumber: 3, title: "Perform Image Editing", description: "Complete image editing tasks including retouching, compositing, color correction, and creative manipulation", category: "task", orderIndex: 8, internCategoryId: CAT_GFX },
      { weekNumber: 4, title: "Portfolio Creation", description: "Learn how to build a professional design portfolio showcasing best work with proper case study format", category: "portfolio", orderIndex: 1, internCategoryId: CAT_GFX },
      { weekNumber: 4, title: "Case Study Design", description: "Understand how to document design projects as case studies with problem, process, and solution structure", category: "portfolio", orderIndex: 2, internCategoryId: CAT_GFX },
      { weekNumber: 4, title: "Client Brief Understanding", description: "Learn to interpret client briefs, ask the right questions, and translate requirements into design solutions", category: "professional", orderIndex: 3, internCategoryId: CAT_GFX },
      { weekNumber: 4, title: "Presentation Skills", description: "Master design presentation techniques including storytelling, rationale explanation, and handling feedback", category: "professional", orderIndex: 4, internCategoryId: CAT_GFX },
      { weekNumber: 4, title: "Work on 1 Real/Dummy Client Project", description: "Take on a real or simulated client project from brief to final delivery, applying all learned skills", category: "final-project", orderIndex: 5, internCategoryId: CAT_GFX },
      { weekNumber: 4, title: "Create Complete Brand Kit", description: "Design a complete brand kit including logo, color palette, typography, brand guidelines, and asset templates", category: "final-project", orderIndex: 6, internCategoryId: CAT_GFX },
      { weekNumber: 4, title: "Build Portfolio (PDF / Behance / Website)", description: "Build and publish your design portfolio on PDF, Behance, or a personal portfolio website", category: "final-project", orderIndex: 7, internCategoryId: CAT_GFX },
      { weekNumber: 4, title: "Present Final Project", description: "Prepare and deliver a final presentation showcasing the complete client project, brand kit, and portfolio", category: "final-project", orderIndex: 8, internCategoryId: CAT_GFX },
    ];

    const allModules = [...web3Modules, ...dmModules, ...gfxModules];
    await db.insert(courseModules).values(allModules);
    console.log(`Seeded ${allModules.length} course modules (Web3+AI: ${web3Modules.length}, Digital Marketing: ${dmModules.length}, Graphics Design: ${gfxModules.length})`);
  }

  const existingDemo = await db.select().from(demoProjects);
  if (existingDemo.length > 0) {
    const urlMap: Record<string, { repositoryUrl: string; websiteUrl: string }> = {
      "NFT Marketplace": { repositoryUrl: "https://github.com/SecureChainAI/NFT-Marketplace", websiteUrl: "https://nft-marketplace-demo.vercel.app" },
      "DeFi Staking Platform": { repositoryUrl: "https://github.com/SecureChainAI/DeFi-Staking-Platform", websiteUrl: "https://defi-staking-demo.vercel.app" },
      "Token Vesting System": { repositoryUrl: "https://github.com/SecureChainAI/Token-Vesting-System", websiteUrl: "https://token-vesting-demo.vercel.app" },
      "Mini Decentralized Exchange (DEX)": { repositoryUrl: "https://github.com/SecureChainAI/Mini-DEX", websiteUrl: "https://mini-dex-demo.vercel.app" },
      "DAO Governance Platform": { repositoryUrl: "https://github.com/SecureChainAI/DAO-Governance", websiteUrl: "https://dao-governance-demo.vercel.app" },
    };
    for (const demo of existingDemo) {
      const urls = urlMap[demo.name];
      if (urls && (!demo.repositoryUrl || !demo.websiteUrl)) {
        await db.update(demoProjects).set(urls).where(eq(demoProjects.id, demo.id));
      }
    }
  }
  if (existingDemo.length === 0) {
    const demoData = [
      { name: "NFT Marketplace", description: "Build a decentralized NFT marketplace where users can mint, buy, sell, and trade NFTs with smart contract integration", category: "web3", repositoryUrl: "https://github.com/SecureChainAI/NFT-Marketplace", websiteUrl: "https://nft-marketplace-demo.vercel.app" },
      { name: "DeFi Staking Platform", description: "Create a DeFi staking platform that allows users to stake tokens and earn rewards through smart contracts", category: "defi", repositoryUrl: "https://github.com/SecureChainAI/DeFi-Staking-Platform", websiteUrl: "https://defi-staking-demo.vercel.app" },
      { name: "Token Vesting System", description: "Develop a token vesting system with time-locked releases, cliff periods, and customizable vesting schedules", category: "defi", repositoryUrl: "https://github.com/SecureChainAI/Token-Vesting-System", websiteUrl: "https://token-vesting-demo.vercel.app" },
      { name: "Mini Decentralized Exchange (DEX)", description: "Build a minimal decentralized exchange with liquidity pools, token swaps, and price discovery mechanisms", category: "defi", repositoryUrl: "https://github.com/SecureChainAI/Mini-DEX", websiteUrl: "https://mini-dex-demo.vercel.app" },
      { name: "DAO Governance Platform", description: "Create a DAO governance platform with proposal creation, voting mechanisms, and treasury management", category: "dao", repositoryUrl: "https://github.com/SecureChainAI/DAO-Governance", websiteUrl: "https://dao-governance-demo.vercel.app" },
    ];
    await db.insert(demoProjects).values(demoData);
    console.log("Seeded 5 demo projects");
  }

  const existingProjects = await db.select().from(projects);
  if (existingProjects.length === 0) {
    const projectData = [
      { name: "Memory-NFT-Game", description: "A 12-card memory matching game built on the Ethereum Sepolia testnet and deployable as a Telegram Mini App. Match shape pairs to mint real ERC-1155 NFTs to your wallet and earn $MEMORY tokens — all on-chain, tamper-proof, and completely free to play using testnet ETH.", status: "in-progress", repositoryUrl: "https://github.com/SecureChainAI/Memory-NFT-Game", deployedUrl: "https://github.com/SecureChainAI/Memory-NFT-Game" },
      { name: "Time-Locked-Chest-Game", description: "Node.js v18 or higher\nMetaMask wallet with Sepolia ETH\nSepolia RPC URL (from Alchemy or Infura)\nEtherscan API key", status: "in-progress", repositoryUrl: "https://github.com/SecureChainAI/Time-Locked-Chest-Game", deployedUrl: "https://github.com/SecureChainAI/Time-Locked-Chest-Game" },
      { name: "Rock-Paper-Scissors-Game", description: "Staking system for the SCAI network", status: "in-progress", repositoryUrl: "https://github.com/SecureChainAI/Staking", deployedUrl: "https://github.com/SecureChainAI/Staking" },
      { name: "Flip-Coin", description: "Flip-Coin", status: "in-progress" },
    ];
    await db.insert(projects).values(projectData);
    console.log("Seeded 4 projects");
  }
}
