import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CommitmentList } from "@/components/CommitmentList";
import { AddCommitmentDialog } from "@/components/AddCommitmentDialog";
import { MoodTracker } from "@/components/MoodTracker";
import { AIRecommendations } from "@/components/AIRecommendations";
import { LogOut, Sparkles, Plus, Bell } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/hooks/useNotifications";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const navigate = useNavigate();
  const { permission, requestPermission, setupNotifications } = useNotifications(user?.id || "");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user && permission === "granted") {
      setupNotifications();
    }
  }, [user, permission]);

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    if (result === "granted") {
      toast.success("Notifications enabled! You'll receive reminders for your commitments.");
      setupNotifications();
    } else {
      toast.error("Notification permission denied");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your commitments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-primary">commit-keeper</span>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Commitments</h1>
          <p className="text-muted-foreground">
            Track your progress and stay accountable to your goals
          </p>
        </div>

        {permission !== "granted" && (
          <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Enable Smart Reminders</h3>
                  <p className="text-sm text-muted-foreground">Get notified before your commitments</p>
                </div>
              </div>
              <Button onClick={handleEnableNotifications} size="sm">
                Enable Notifications
              </Button>
            </div>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <Card className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Ready to commit?</h3>
                <p className="text-sm text-muted-foreground">Add a new commitment to track</p>
              </div>
              <Button onClick={() => setShowAddDialog(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Add Commitment
              </Button>
            </Card>

            <CommitmentList userId={user?.id || ""} />
          </div>

          <aside className="space-y-6">
            <MoodTracker userId={user?.id || ""} />
            <AIRecommendations userId={user?.id || ""} />
          </aside>
        </div>
      </main>

      <AddCommitmentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        userId={user?.id || ""}
      />
    </div>
  );
};

export default Dashboard;
