import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Clock, SkipForward, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Commitment {
  id: string;
  title: string;
  commitment_time: string;
  commitment_date: string;
  completed: boolean;
  image_url?: string | null;
}

interface CommitmentItemProps {
  commitment: Commitment;
  onUpdate: () => void;
}

const CommitmentItem = ({ commitment, onUpdate }: CommitmentItemProps) => {
  const [loading, setLoading] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<any>(null);
  const { toast } = useToast();

  const handleToggle = async () => {
    setLoading(true);
    try {
      const newCompleted = !commitment.completed;
      
      const { error } = await supabase
        .from("commitments")
        .update({ completed: newCompleted })
        .eq("id", commitment.id);

      if (error) throw error;

      if (newCompleted) {
        // Show celebration toast
        toast({
          title: "🎉 Amazing Work!",
          description: "You completed your commitment! Keep going!",
          className: "bg-success text-success-foreground animate-celebrate",
        });
      }

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update commitment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('auto-reschedule', {
        body: { commitmentId: commitment.id },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      if (error) throw error;

      setRescheduleData(data);
      setShowReschedule(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get reschedule suggestion",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptReschedule = async () => {
    if (!rescheduleData) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("commitments")
        .update({
          commitment_date: rescheduleData.suggested_date,
          commitment_time: rescheduleData.suggested_time
        })
        .eq("id", commitment.id);

      if (error) throw error;

      toast({
        title: "Rescheduled! 📅",
        description: "Your commitment has been moved to a better time.",
      });

      setShowReschedule(false);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("commitments")
        .delete()
        .eq("id", commitment.id);

      if (error) throw error;

      toast({
        title: "Commitment deleted",
        description: "The commitment has been removed.",
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete commitment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "flex items-start gap-3 p-4 bg-card rounded-lg border transition-all hover:shadow-soft",
          commitment.completed && "opacity-60"
        )}
      >
        <Checkbox
          checked={commitment.completed}
          onCheckedChange={handleToggle}
          disabled={loading}
          className="mt-1"
        />
        
        <div className="flex-1 min-w-0">
          {commitment.image_url && (
            <img 
              src={commitment.image_url} 
              alt={commitment.title}
              className="w-full h-24 object-cover rounded-md mb-2"
            />
          )}
          <p className={cn(
            "text-sm font-medium break-words",
            commitment.completed && "line-through text-muted-foreground"
          )}>
            {commitment.title}
          </p>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{commitment.commitment_time}</span>
          </div>
        </div>

        <div className="flex gap-1">
          {!commitment.completed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              disabled={loading}
              className="text-primary hover:text-primary hover:bg-primary/10"
              title="Skip and reschedule"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={loading}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Dialog open={showReschedule} onOpenChange={setShowReschedule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Reschedule Suggestion 🤖</DialogTitle>
            <DialogDescription>
              Based on your patterns and schedule
            </DialogDescription>
          </DialogHeader>

          {rescheduleData && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Suggested Time:</p>
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  <span>{rescheduleData.suggested_date} at {rescheduleData.suggested_time}</span>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm font-medium mb-2">Why this time?</p>
                <p className="text-sm text-muted-foreground">
                  {rescheduleData.reasoning}
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleAcceptReschedule}
                  disabled={loading}
                  variant="hero"
                  className="flex-1"
                >
                  Accept Suggestion
                </Button>
                <Button 
                  onClick={() => setShowReschedule(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Keep Original
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CommitmentItem;
