import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from "pdfjs-dist";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Skill {
  skill_name: string;
  category: string;
  proficiency_level: string;
}

interface ResumeUploadProps {
  onUploadComplete?: () => void;
}

export const ResumeUpload = ({ onUploadComplete }: ResumeUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<Skill[]>([]);
  const [uploadComplete, setUploadComplete] = useState(false);
  const { toast } = useToast();

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      setProgress(10);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      setProgress(20);

      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("resumes")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setProgress(40);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("resumes").getPublicUrl(fileName);

      setProgress(50);

      // Insert resume record
      const { data: resumeData, error: insertError } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: publicUrl,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setProgress(60);
      setUploading(false);
      setAnalyzing(true);

      // Extract text from PDF
      toast({
        title: "Extracting text from resume...",
        description: "This may take a moment.",
      });

      const resumeText = await extractTextFromPDF(file);
      setProgress(70);

      // Call analyze-resume edge function
      const { data: analysisData, error: analysisError } =
        await supabase.functions.invoke("analyze-resume", {
          body: {
            resumeText,
            resumeId: resumeData.id,
          },
        });

      if (analysisError) throw analysisError;

      setProgress(100);
      setExtractedSkills(analysisData.skills || []);
      setUploadComplete(true);
      setAnalyzing(false);

      toast({
        title: "Resume analyzed successfully!",
        description: `Extracted ${analysisData.count} skills from your resume.`,
      });

      onUploadComplete?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload and analyze resume",
        variant: "destructive",
      });
      setUploading(false);
      setAnalyzing(false);
      setProgress(0);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setUploadComplete(false);
      setExtractedSkills([]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setProgress(0);
    setUploadComplete(false);
    setExtractedSkills([]);
  };

  const handleStartUpload = () => {
    if (selectedFile) {
      handleUpload(selectedFile);
    }
  };

  const topSkills = extractedSkills.slice(0, 5);

  return (
    <div className="space-y-6">
      <Card className="p-8">
        {!selectedFile ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {isDragActive
                ? "Drop your resume here"
                : "Upload your resume"}
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop your resume, or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              PDF format, max 10MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium text-foreground">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {!uploading && !analyzing && !uploadComplete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {(uploading || analyzing) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {uploading ? "Uploading..." : "Analyzing with AI..."}
                  </span>
                  <span className="text-foreground font-medium">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {uploadComplete && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">
                    Resume analyzed successfully!
                  </span>
                </div>

                {topSkills.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">
                      Top 5 Skills Detected:
                    </h4>
                    <div className="grid gap-3">
                      {topSkills.map((skill, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-background border border-border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {skill.skill_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {skill.category}
                            </p>
                          </div>
                          <Badge
                            variant={
                              skill.proficiency_level === "Expert"
                                ? "default"
                                : skill.proficiency_level === "Advanced"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {skill.proficiency_level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!uploading && !analyzing && !uploadComplete && (
              <Button
                onClick={handleStartUpload}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                Analyze Resume
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
