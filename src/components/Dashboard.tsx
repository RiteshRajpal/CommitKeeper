import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { LogOut, Plus, Sparkles, Bell } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import CommitmentForm from "./CommitmentForm";
import CommitmentList from "./CommitmentList";
import MoodTracker from "./MoodTracker";
import AIInsights from "./AIInsights";
import AIRecommendations from "./AIRecommendations";
import { requestNotificationPermission, scheduleAllTodayCommitments } from "@/utils/notifications";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showForm, setShowForm] = useState(false);
  const [showMoodTracker, setShowMoodTracker] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate('/auth');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Check notification permission status
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    // Schedule notifications for all upcoming commitments
    if (session && notificationsEnabled) {
      const today = format(new Date(), "yyyy-MM-dd");
      supabase
        .from("commitments")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("commitment_date", today)
        .then(({ data }) => {
          if (data) {
            scheduleAllTodayCommitments(data);
          }
        });
    }
  }, [session, notificationsEnabled]);

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationsEnabled(true);
      toast({
        title: "Notifications Enabled! 🔔",
        description: "You'll receive reminders for your commitments.",
      });
    } else {
      toast({
        title: "Permission Denied",
        description: "Please enable notifications in your browser settings.",
        variant: "destructive",
      });
    }
  };

  const handleMoodSubmit = async (mood: string, energy: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('suggest-by-mood', {
        body: { mood, energyLevel: energy },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      if (error) throw error;

      setRecommendations(data);
      setShowMoodTracker(false);
    } catch (error: any) {
      console.error('Error getting recommendations:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get recommendations",
        variant: "destructive",
      });
    }
  };

  const handleApplyRecommendations = () => {
    toast({
      title: "Recommendations Applied! ✨",
      description: "Tasks are now prioritized based on your mood.",
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "Come back soon to track your commitments!",
    });
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">commit-keeper</h1>
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!notificationsEnabled && (
              <Button variant="outline" onClick={handleEnableNotifications}>
                <Bell className="w-4 h-4 mr-2" />
                Enable Reminders
              </Button>
            )}
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[350px_1fr] gap-6">
          {/* Left Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 shadow-soft">
              <h2 className="text-lg font-semibold mb-4">Select Date</h2>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border-0"
              />
            </Card>

            <Button 
              onClick={() => setShowMoodTracker(!showMoodTracker)}
              variant="outline"
              className="w-full"
            >
              {showMoodTracker ? 'Hide Mood Tracker' : 'Track My Mood'}
            </Button>

            {showMoodTracker && (
              <MoodTracker onMoodSubmit={handleMoodSubmit} />
            )}

            <AIInsights userId={session.user.id} />
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {recommendations && (
              <AIRecommendations 
                recommendations={recommendations}
                onApply={handleApplyRecommendations}
              />
            )}

            <Card className="p-6 shadow-soft">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">
                    {format(selectedDate, "MMMM d, yyyy")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedDate, "EEEE")}
                  </p>
                </div>
                <Button 
                  variant="hero" 
                  onClick={() => setShowForm(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Make Commitment
                </Button>
              </div>

              {showForm && (
                <CommitmentForm 
                  selectedDate={selectedDate}
                  onClose={() => setShowForm(false)}
                />
              )}

              <CommitmentList 
                selectedDate={selectedDate}
                userId={session.user.id}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
