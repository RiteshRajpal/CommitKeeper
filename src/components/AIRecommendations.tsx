import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2, Calendar, Clock, Lightbulb } from "lucide-react";
import { format } from "date-fns";

interface AIRecommendationsProps {
  userId: string;
}

interface Recommendation {
  commitmentId: string;
  commitmentTitle: string;
  currentSchedule: string;
  suggestedDate: string;
  suggestedTime: string;
  reason: string;
  shouldReschedule: boolean;
}

export const AIRecommendations = ({ userId }: AIRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState<string>("");
  const [currentEnergy, setCurrentEnergy] = useState<string>("");

  useEffect(() => {
    fetchCurrentMood();
  }, [userId]);

  const fetchCurrentMood = async () => {
    const { data } = await supabase
      .from("mood_logs")
      .select("*")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setCurrentMood(data.mood);
      setCurrentEnergy(data.energy_level);
    }
  };

  const getAIRecommendations = async () => {
    if (!currentMood || !currentEnergy) {
      toast.error("Please log your mood first to get AI recommendations");
      return;
    }

    setLoading(true);
    try {
      // Get all pending commitments
      const { data: commitments } = await supabase
        .from("commitments")
        .select("*")
        .eq("user_id", userId)
        .eq("completed", false)
        .order("due_date", { ascending: true });

      if (!commitments || commitments.length === 0) {
        toast.info("No pending commitments to analyze");
        setLoading(false);
        return;
      }

      // Get AI analysis for all commitments
      const { data, error } = await supabase.functions.invoke("ai-reschedule", {
        body: {
          mode: "bulk",
          commitments: commitments.map(c => ({
            id: c.id,
            title: c.title,
            due_date: c.due_date,
            due_time: c.due_time,
            priority: c.priority,
            category: c.category,
          })),
          mood: currentMood,
          energyLevel: currentEnergy,
          userId,
        },
      });

      if (error) throw error;

      let suggestions = data.recommendations;
      
      // Handle if still wrapped in string
      if (typeof suggestions === 'string') {
        try {
          suggestions = JSON.parse(suggestions);
        } catch (e) {
          console.error('Failed to parse recommendations:', e);
          toast.error("Failed to parse AI recommendations");
          setLoading(false);
          return;
        }
      }

      const validSuggestions = Array.isArray(suggestions) ? suggestions : [];
      setRecommendations(validSuggestions);
      
      const rescheduleCount = validSuggestions.filter(r => r.shouldReschedule).length;
      if (rescheduleCount > 0) {
        toast.success(`Found ${rescheduleCount} scheduling suggestions!`);
      } else {
        toast.success("Your schedule looks optimal for your current state!");
      }
    } catch (error) {
      console.error("AI error:", error);
      toast.error("Failed to get AI recommendations");
    } finally {
      setLoading(false);
    }
  };

  const applyRecommendation = async (rec: Recommendation) => {
    try {
      const { error } = await supabase
        .from("commitments")
        .update({
          due_date: rec.suggestedDate,
          due_time: rec.suggestedTime,
        })
        .eq("id", rec.commitmentId);

      if (error) throw error;

      toast.success("Commitment rescheduled!");
      setRecommendations(prev => prev.filter(r => r.commitmentId !== rec.commitmentId));
    } catch (error) {
      toast.error("Failed to reschedule");
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">AI Scheduling Assistant</h3>
      </div>

      {currentMood && currentEnergy && (
        <div className="mb-4 p-3 bg-background/50 rounded-lg border">
          <p className="text-sm">
            <span className="font-medium">Current State:</span> Feeling {currentMood} with {currentEnergy} energy
          </p>
        </div>
      )}

      <Button
        onClick={getAIRecommendations}
        disabled={loading}
        className="w-full mb-4"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Analyzing Tasks...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            Get AI Recommendations
          </>
        )}
      </Button>

      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Personalized Suggestions
          </h4>
          {recommendations.map((rec) => (
            <Card
              key={rec.commitmentId}
              className="p-4 bg-background border-primary/20"
            >
              <div className="space-y-3">
                <div>
                  <h5 className="font-semibold text-sm">{rec.commitmentTitle}</h5>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently: {format(new Date(rec.currentSchedule), "MMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>

                {rec.shouldReschedule && (
                  <>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-primary">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(rec.suggestedDate), "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        <Clock className="h-4 w-4" />
                        <span>{rec.suggestedTime}</span>
                      </div>
                    </div>

                    <p className="text-xs bg-primary/5 p-2 rounded border border-primary/20">
                      {rec.reason}
                    </p>

                    <Button
                      onClick={() => applyRecommendation(rec)}
                      size="sm"
                      className="w-full"
                    >
                      Apply Suggestion
                    </Button>
                  </>
                )}

                {!rec.shouldReschedule && (
                  <p className="text-xs text-muted-foreground">
                    ✓ Current timing looks optimal for your current state
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};
