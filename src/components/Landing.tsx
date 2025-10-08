import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          commit-keeper
        </h1>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>Your Daily Commitment Companion</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-tight">
            Make Every Day Count
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Track your commitments, stay accountable, and celebrate your wins. 
            Transform your intentions into achievements, one commitment at a time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              variant="hero" 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="text-lg"
            >
              Get Started Free
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mt-32 grid md:grid-cols-3 gap-8">
          <div className="bg-card p-8 rounded-2xl shadow-soft hover:shadow-glow transition-all border border-border">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Calendar View</h3>
            <p className="text-muted-foreground">
              Visualize your commitments with an intuitive calendar interface. Plan up to 20 commitments per day.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-soft hover:shadow-glow transition-all border border-border">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Reminders</h3>
            <p className="text-muted-foreground">
              Never miss a commitment with timely notifications. Get reminded 1 hour before, 30 minutes before, and at the exact time.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-soft hover:shadow-glow transition-all border border-border">
            <div className="w-12 h-12 bg-gradient-success rounded-xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-success-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Celebrate Progress</h3>
            <p className="text-muted-foreground">
              Check off completed commitments and receive encouraging feedback. Every win matters!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
