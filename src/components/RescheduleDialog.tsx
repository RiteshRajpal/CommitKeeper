import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commitment: {
    id: string;
    title: string;
    due_date: string;
    due_time: string;
  };
  userId: string;
}

export const RescheduleDialog = ({ open, onOpenChange, commitment, userId }: RescheduleDialogProps) => {
  const [newDate, setNewDate] = useState<Date>(new Date(commitment.due_date));
  const [newTime, setNewTime] = useState(commitment.due_time);
  const [aiSuggestion, setAiSuggestion] = useState<string>("");
  const [loadingAI, setLoadingAI] = useState(false);

  const getAIRecommendation = async () => {
    setLoadingAI(true);
    try {
      // Get current mood
      const { data: moodData } = await supabase
        .from("mood_logs")
        .select("*")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(1)
        .single();

      const { data, error } = await supabase.functions.invoke("ai-reschedule", {
        body: {
          commitmentId: commitment.id,
          mood: moodData?.mood || "neutral",
          energyLevel: moodData?.energy_level || "medium",
          userId,
        },
      });

      if (error) throw error;

      const suggestion = typeof data.suggestion === 'string' 
        ? JSON.parse(data.suggestion) 
        : data.suggestion;

      setAiSuggestion(suggestion.suggestion || "");
      
      if (suggestion.recommendedTime) {
        setNewTime(suggestion.recommendedTime);
        toast.success("AI recommendation ready!");
      }
    } catch (error) {
      console.error("AI error:", error);
      toast.error("Failed to get AI recommendation");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleReschedule = async () => {
    try {
      const { error } = await supabase
        .from("commitments")
        .update({
          due_date: format(newDate, "yyyy-MM-dd"),
          due_time: newTime,
        })
        .eq("id", commitment.id);

      if (error) throw error;

      toast.success("Commitment rescheduled successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to reschedule commitment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reschedule: {commitment.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={getAIRecommendation}
              disabled={loadingAI}
              className="w-full bg-gradient-to-r from-primary to-primary/80"
            >
              {loadingAI ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Getting AI Recommendation...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Get AI Recommendation
                </>
              )}
            </Button>

            {aiSuggestion && (
              <div className="w-full p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-foreground">{aiSuggestion}</p>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium mb-2 block">New Date</label>
              <Calendar
                mode="single"
                selected={newDate}
                onSelect={(date) => date && setNewDate(date)}
                className="rounded-md border"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">New Time</label>
              <TimePicker
                value={newTime}
                onChange={setNewTime}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleReschedule}>
              Reschedule Commitment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
