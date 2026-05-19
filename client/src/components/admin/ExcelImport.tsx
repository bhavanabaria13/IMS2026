import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import * as XLSX from 'xlsx';

export default function ExcelImport() {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to import",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Read the file
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          if (!data) throw new Error("Failed to read file");

          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Map Excel columns to intern data format
          const internsData = jsonData.map((row: any) => ({
            fullName: row.Name || row.name || row["Full Name"] || "",
            email: row.Email || row.email || "",
            phone: row.Phone || row.phone || row["Phone Number"] || "N/A",
            program: row.Education || row.education || row.Program || row.program || "N/A",
            city: row.City || row.city || "N/A",
            learningTopics: row.Skills || row.skills || row["Learning Topics"] || "",
            tasksCompleted: row["Work Experience"] || row.workExperience || row["Tasks Completed"] || "",
            workOutput: row.Projects || row.projects || row["Work Output"] || "",
            githubLink: row.GitHub || row.github || row.Github || "",
            linkedin: row.LinkedIn || row.linkedin || row.Linkedin || "",
          }));

          // Send to backend
          const response = await fetch("/api/admin/import-spreadsheet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: internsData }),
          });

          if (!response.ok) {
            // Attempt to get error message from response body
            let errorMsg = "Import failed";
            try {
              const errorData = await response.json();
              errorMsg = errorData.message || "Import failed";
            } catch (e) {
              // Ignore if response is not JSON or empty
            }
            throw new Error(errorMsg);
          }

          const result = await response.json();

          toast({
            title: "Import Completed",
            description: `Successfully imported ${result.imported} interns. Skipped ${result.skipped} duplicates.`,
          });

          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          setFileName("");

          // Refresh intern list
          queryClient.invalidateQueries({ queryKey: ["/api/interns"] });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/interns-with-status"] });
        } catch (error) {
          console.error("Import error:", error);
          toast({
            title: "Import Failed",
            description: error instanceof Error ? error.message : "Failed to process Excel file",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast({
          title: "File Read Error",
          description: "Failed to read the Excel file",
          variant: "destructive",
        });
        setIsUploading(false);
      };

      // Read as binary string for xlsx library compatibility
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: "An error occurred while importing",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import Interns from Excel
        </CardTitle>
        <CardDescription>
          Upload an Excel file (.xlsx, .xls) to bulk import intern records.
          Required columns: Name, Email. Optional: Phone, Education, City, Skills, Work Experience, Projects, GitHub, LinkedIn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="flex-1"
          />
          <Button
            onClick={handleImport}
            disabled={isUploading || !fileName}
            className="bg-gradient-to-r from-purple-500 to-blue-600"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </>
            )}
          </Button>
        </div>

        {fileName && (
          <p className="text-sm text-muted-foreground">
            Selected file: <span className="font-medium">{fileName}</span>
          </p>
        )}

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-semibold mb-2 text-sm">Excel Format Guidelines:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• First row should contain column headers</li>
            <li>• Name and Email columns are required</li>
            <li>• Duplicate emails will be skipped</li>
            <li>• All imported interns will be auto-approved with password "123456"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}