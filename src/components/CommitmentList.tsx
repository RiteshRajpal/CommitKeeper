import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Trash2, CalendarClock, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { RescheduleDialog } from "./RescheduleDialog";
import { ImageUpload } from "./ImageUpload";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Commitment {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  due_time: string;
  completed: boolean;
  priority: string;
  category: string | null;
  image_url: string | null;
}

export const CommitmentList = ({ userId }: { userId: string }) => {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleCommitment, setRescheduleCommitment] = useState<Commitment | null>(null);
  const [expandedImageUpload, setExpandedImageUpload] = useState<string | null>(null);

  useEffect(() => {
    fetchCommitments();

    const channel = supabase
      .channel('commitments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'commitments',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchCommitments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchCommitments = async () => {
    const { data, error } = await supabase
      .from("commitments")
      .select("*")
      .eq("user_id", userId)
      .order("due_date", { ascending: true })
      .order("due_time", { ascending: true });

    if (error) {
      toast.error("Failed to load commitments");
    } else {
      setCommitments(data || []);
    }
    setLoading(false);
  };

  const handleComplete = async (id: string) => {
    const { error } = await supabase
      .from("commitments")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast.error("Failed to mark as completed");
    } else {
      toast.success("Commitment completed! 🎉 Add a proof image if you'd like!");
      setExpandedImageUpload(id);
    }
  };

  const handleImageUpload = (commitmentId: string, imageUrl: string) => {
    setCommitments(prev => 
      prev.map(c => c.id === commitmentId ? { ...c, image_url: imageUrl } : c)
    );
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("commitments")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete commitment");
    } else {
      toast.success("Commitment deleted");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading commitments...</div>;
  }

  if (commitments.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No commitments yet</h3>
        <p className="text-muted-foreground">
          Add your first commitment to get started on your journey!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {commitments.map((commitment) => (
        <Card
          key={commitment.id}
          className={`p-6 transition-all ${
            commitment.completed ? "opacity-60 bg-muted/50" : "hover:shadow-medium"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className={`text-lg font-semibold ${commitment.completed ? "line-through" : ""}`}>
                  {commitment.title}
                </h3>
                <Badge variant={commitment.priority === "high" ? "destructive" : "secondary"}>
                  {commitment.priority}
                </Badge>
                {commitment.category && (
                  <Badge variant="outline">{commitment.category}</Badge>
                )}
              </div>
              {commitment.description && (
                <p className="text-muted-foreground mb-3">{commitment.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>📅 {format(new Date(commitment.due_date), "MMM dd, yyyy")}</span>
                <span>🕐 {commitment.due_time}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {!commitment.completed && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRescheduleCommitment(commitment)}
                  >
                    <CalendarClock className="h-4 w-4 mr-1" />
                    Reschedule
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleComplete(commitment.id)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                </>
              )}
              {commitment.completed && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Completed</Badge>
                  {commitment.image_url && (
                    <Badge variant="outline" className="gap-1">
                      <ImageIcon className="h-3 w-3" />
                      Has proof
                    </Badge>
                  )}
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(commitment.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image upload section for completed commitments */}
          {commitment.completed && (
            <Collapsible
              open={expandedImageUpload === commitment.id}
              onOpenChange={(open) => setExpandedImageUpload(open ? commitment.id : null)}
              className="mt-4"
            >
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  {commitment.image_url ? 'View/Update Proof' : 'Add Proof Image'}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <ImageUpload
                  commitmentId={commitment.id}
                  currentImageUrl={commitment.image_url}
                  onUploadComplete={(url) => handleImageUpload(commitment.id, url)}
                />
              </CollapsibleContent>
            </Collapsible>
          )}
        </Card>
      ))}

      {rescheduleCommitment && (
        <RescheduleDialog
          open={!!rescheduleCommitment}
          onOpenChange={(open) => !open && setRescheduleCommitment(null)}
          commitment={rescheduleCommitment}
          userId={userId}
        />
      )}
    </div>
  );
};
