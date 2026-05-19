import ExcelJS from "exceljs";
import { storage } from "./storage";

export async function generateInternsExcel(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EtherAuthority Internship Portal";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Interns");

  worksheet.columns = [
    { header: "Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Education", key: "education", width: 35 },
    { header: "City", key: "city", width: 15 },
    { header: "Work Experience", key: "workExperience", width: 40 },
    { header: "Skills", key: "skills", width: 30 },
    { header: "Projects", key: "projects", width: 40 },
    { header: "GitHub", key: "github", width: 30 },
    { header: "LinkedIn", key: "linkedin", width: 30 },
    { header: "Applied Date", key: "appliedDate", width: 15 },
    { header: "CV Filename", key: "cvOriginalName", width: 25 },
  ];

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF8B5CF6" },
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  const interns = await storage.getAllInterns();

  interns.forEach((intern) => {
    worksheet.addRow({
      name: intern.name,
      email: intern.email,
      phone: intern.phone,
      education: intern.education,
      city: intern.city,
      workExperience: intern.workExperience || "",
      skills: intern.skills || "",
      projects: intern.projects || "",
      github: intern.github || "",
      linkedin: intern.linkedin || "",
      appliedDate: new Date(intern.appliedDate).toLocaleDateString(),
      cvOriginalName: intern.cvOriginalName || "",
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
