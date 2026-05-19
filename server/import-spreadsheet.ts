
import { db } from "./db";
import { interns as internsSchema } from "@shared/schema";

// Data from the spreadsheet
const spreadsheetData = [
  {
    timestamp: "12/15/2024 10:30:45",
    fullName: "John Doe",
    email: "john.doe@example.com",
    program: "Computer Science",
    weekNumber: 1,
    reportingPeriod: "Dec 15 - Dec 19, 2024",
    learningTopics: "React, TypeScript, Node.js",
    tasksCompleted: "Built user authentication system",
    workOutput: "Auth API with JWT tokens",
    githubLink: "https://github.com/johndoe/auth-system",
    deployedUrl: "https://auth-demo.example.com",
    completionStatus: "Completed",
    selfRating: 4,
    timeSpent: "20 hours",
    challenges: "CORS issues with API",
    solutions: "Configured proper headers and middleware",
    keyLearnings: "Learned about JWT security best practices",
    performanceScore: 85,
    mentorFeedback: "Good work on authentication"
  }
  // Add more entries as needed from your spreadsheet
];

async function importData() {
  try {
    console.log("Starting data import...");
    
    for (const data of spreadsheetData) {
      // Check if intern already exists
      const existing = await db.select()
        .from(internsSchema)
        .where(eq(internsSchema.email, data.email));
      
      if (existing.length === 0) {
        // Create new intern
        await db.insert(internsSchema).values({
          name: data.fullName,
          email: data.email,
          phone: "N/A", // Not in spreadsheet
          education: data.program,
          city: "N/A", // Not in spreadsheet
          skills: data.learningTopics,
          workExperience: data.tasksCompleted,
          projects: data.workOutput,
          github: data.githubLink || "",
          linkedin: "",
          cvFilename: "",
          cvOriginalName: ""
        });
        console.log(`Imported: ${data.fullName}`);
      } else {
        console.log(`Skipped (already exists): ${data.fullName}`);
      }
    }
    
    console.log("Data import completed!");
  } catch (error) {
    console.error("Import failed:", error);
  }
}

importData();
