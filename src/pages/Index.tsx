import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Brain, Target, TrendingUp, Upload, BookOpen, Award } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold text-foreground">CareerAI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-gradient-primary hover:opacity-90 transition-smooth">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            Your AI-Powered
            <span className="block text-primary">Career Growth Partner</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your resume, get instant skill insights, and receive personalized learning roadmaps 
            powered by advanced AI technology.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-smooth text-lg px-8">
                Start Your Journey
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Everything You Need to Advance Your Career
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful AI-driven features designed to accelerate your professional growth
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8 hover:shadow-lg transition-smooth border-2">
            <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
              <Upload className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Smart Resume Analysis</h3>
            <p className="text-muted-foreground leading-relaxed">
              Upload your resume and let our AI extract and analyze your skills, experience, and career trajectory instantly.
            </p>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-smooth border-2">
            <div className="w-14 h-14 bg-gradient-success rounded-xl flex items-center justify-center mb-6">
              <Target className="w-7 h-7 text-success-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Personalized Roadmaps</h3>
            <p className="text-muted-foreground leading-relaxed">
              Get AI-generated learning paths tailored to your current skills and career goals with actionable steps.
            </p>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-smooth border-2">
            <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
              <BookOpen className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Course Recommendations</h3>
            <p className="text-muted-foreground leading-relaxed">
              Discover relevant courses and resources matched to your skill gaps and career aspirations.
            </p>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-smooth border-2">
            <div className="w-14 h-14 bg-gradient-success rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-7 h-7 text-success-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Progress Tracking</h3>
            <p className="text-muted-foreground leading-relaxed">
              Visualize your learning journey with interactive dashboards and track your skill development over time.
            </p>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-smooth border-2">
            <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-6">
              <Brain className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">AI-Powered Insights</h3>
            <p className="text-muted-foreground leading-relaxed">
              Leverage cutting-edge NLP and machine learning to understand market trends and skill demands.
            </p>
          </Card>

          <Card className="p-8 hover:shadow-lg transition-smooth border-2">
            <div className="w-14 h-14 bg-gradient-success rounded-xl flex items-center justify-center mb-6">
              <Award className="w-7 h-7 text-success-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Career Milestones</h3>
            <p className="text-muted-foreground leading-relaxed">
              Celebrate achievements and stay motivated with milestone tracking and skill certifications.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="bg-gradient-primary p-12 text-center">
          <h2 className="text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who are accelerating their growth with AI-powered guidance.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-lg px-8 shadow-xl">
              Get Started Free
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t">
        <div className="text-center text-muted-foreground">
          <p>© 2025 CareerAI. Empowering careers with AI technology.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
