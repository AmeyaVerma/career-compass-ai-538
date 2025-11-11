import { useNavigate } from "react-router-dom";
import { ResumeUpload } from "@/components/ResumeUpload";
import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Upload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleUploadComplete = () => {
    toast({
      title: "Success!",
      description: "Your resume has been analyzed successfully! Generate a roadmap to see your learning path.",
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-foreground">CareerAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Upload Your Resume
            </h1>
            <p className="text-xl text-muted-foreground">
              Let our AI analyze your skills and create a personalized learning roadmap
            </p>
          </div>

          <ResumeUpload onUploadComplete={handleUploadComplete} />

          <div className="mt-8 p-6 bg-card border border-border rounded-lg">
            <h3 className="font-semibold text-foreground mb-3">What happens next?</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>Your resume is securely uploaded and stored</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>AI extracts and categorizes all your skills</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>Skills are analyzed for proficiency levels</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">4.</span>
                <span>You can generate personalized learning roadmaps</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
