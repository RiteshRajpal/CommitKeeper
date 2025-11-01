import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle, Bell, Brain, Calendar } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-background via-secondary/30 to-background">
        {/* Header */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-primary">commit-keeper</span>
            </div>
            <Link to="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
          </nav>
        </header>

        {/* Hero Content */}
        <div className="container mx-auto px-4 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 text-primary mb-8">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Your Daily Commitment Companion</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Make Every Day Count
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed">
            Track your commitments, stay accountable, and celebrate your wins. Transform your intentions into achievements, one commitment at a time.
          </p>

          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-6 shadow-medium hover:shadow-lg transition-all">
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-lg text-muted-foreground">Everything you need to stay committed</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Calendar className="h-8 w-8 text-primary" />}
            title="Smart Scheduling"
            description="Set dates and times for your commitments with easy-to-use date and time pickers"
          />
          <FeatureCard
            icon={<Bell className="h-8 w-8 text-primary" />}
            title="Smart Reminders"
            description="Get notified at 1hr, 30min, 5min, and 1min before your commitment time"
          />
          <FeatureCard
            icon={<Brain className="h-8 w-8 text-primary" />}
            title="AI-Powered Insights"
            description="Mood-based task scheduling and intelligent auto-rescheduling based on your patterns"
          />
          <FeatureCard
            icon={<CheckCircle className="h-8 w-8 text-primary" />}
            title="Track Progress"
            description="Mark commitments as complete and celebrate your achievements"
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Commitments?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who are making every day count with commit-keeper
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Your Journey
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 commit-keeper. Make every day count.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="p-6 rounded-lg bg-card border hover:shadow-medium transition-all">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Index;
