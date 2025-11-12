import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, LogOut, BookOpen, Clock, ExternalLink, Loader2, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface Resource {
  title: string;
  url: string;
  type: "course" | "documentation" | "tutorial" | "book" | "video" | "project";
}

interface RoadmapStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  estimated_hours: number;
  resources: Resource[];
  is_completed: boolean;
}

interface Roadmap {
  id: string;
  title: string;
  description: string;
  target_role: string;
  duration_weeks: number;
  steps: RoadmapStep[];
}

const Roadmap = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        fetchRoadmap(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchRoadmap = async (userId: string) => {
    try {
      const { data: roadmapData, error } = await supabase
        .from("roadmaps")
        .select(`
          *,
          roadmap_steps (*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching roadmap:", error);
        setLoading(false);
        return;
      }

      if (roadmapData) {
        const formattedRoadmap: Roadmap = {
          ...roadmapData,
          steps: (roadmapData.roadmap_steps || [])
            .sort((a: any, b: any) => a.step_number - b.step_number)
            .map((step: any) => ({
              ...step,
              is_completed: false,
            })),
        };
        setRoadmap(formattedRoadmap);
        setLoading(false);
      } else {
        // No roadmap exists, generate one automatically
        setLoading(false);
        await generateRoadmap();
      }
    } catch (err) {
      console.error("Error in fetchRoadmap:", err);
      setLoading(false);
    }
  };

  const generateRoadmap = async () => {
    if (!user || generating) return;

    setGenerating(true);
    
    try {
      // Fetch user's skills
      const { data: skills, error: skillsError } = await supabase
        .from("skills")
        .select("*")
        .eq("user_id", user.id);

      if (skillsError) throw skillsError;

      if (!skills || skills.length === 0) {
        toast({
          title: "No Skills Found",
          description: "Please upload a resume first to extract your skills.",
          variant: "destructive",
        });
        navigate("/upload");
        return;
      }

      // Call the edge function to generate roadmap
      const { data, error } = await supabase.functions.invoke("generate-roadmap", {
        body: {
          skills,
          targetRole: "Software Engineer", // You can make this dynamic
          currentLevel: "Intermediate",
        },
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your personalized learning roadmap has been generated with courses from Coursera and Udemy.",
      });

      // Refresh the roadmap - fetch without auto-generating
      const { data: roadmapData } = await supabase
        .from("roadmaps")
        .select(`
          *,
          roadmap_steps (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (roadmapData) {
        const formattedRoadmap: Roadmap = {
          ...roadmapData,
          steps: (roadmapData.roadmap_steps || [])
            .sort((a: any, b: any) => a.step_number - b.step_number)
            .map((step: any) => ({
              ...step,
              is_completed: false,
            })),
        };
        setRoadmap(formattedRoadmap);
      }
    } catch (error: any) {
      console.error("Error generating roadmap:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate roadmap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
    navigate("/");
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "course":
        return "🎓";
      case "documentation":
        return "📚";
      case "tutorial":
        return "📝";
      case "book":
        return "📖";
      case "video":
        return "🎥";
      case "project":
        return "🚀";
      default:
        return "📌";
    }
  };

  if (loading || generating) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-xl font-semibold text-foreground mb-2">
            {generating ? "Generating Your Personalized Roadmap..." : "Loading..."}
          </p>
          <p className="text-muted-foreground">
            {generating ? "Finding the best courses from Coursera and Udemy for you" : "Please wait"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <Brain className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-foreground">CareerAI</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Your Learning Roadmap
              </h1>
              <p className="text-xl text-muted-foreground">
                Personalized path to achieve your career goals
              </p>
            </div>
            <Button
              onClick={generateRoadmap}
              disabled={generating}
              className="bg-gradient-primary hover:opacity-90 transition-smooth"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Generate Roadmap
                </>
              )}
            </Button>
          </div>

          {!roadmap ? (
            <Card className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Generating Your Roadmap
              </h2>
              <p className="text-muted-foreground mb-6">
                Please wait while we create a personalized learning path based on your skills...
              </p>
              <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Roadmap Header */}
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      {roadmap.title}
                    </h2>
                    <p className="text-muted-foreground">{roadmap.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {roadmap.duration_weeks} weeks
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span>Target Role: {roadmap.target_role}</span>
                </div>
              </Card>

              {/* Roadmap Steps */}
              {roadmap.steps.map((step, index) => (
                <Card key={step.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      {step.step_number}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {step.description}
                      </p>
                      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{step.estimated_hours} hours</span>
                      </div>

                      {/* Resources */}
                      {step.resources && step.resources.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-foreground mb-2">
                            Recommended Resources:
                          </h4>
                          {step.resources.map((resource, resIndex) => (
                            <a
                              key={resIndex}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent transition-smooth group"
                            >
                              <span className="text-2xl">
                                {getResourceIcon(resource.type)}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-smooth">
                                  {resource.title}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {resource.type}
                                </p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-smooth" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;
