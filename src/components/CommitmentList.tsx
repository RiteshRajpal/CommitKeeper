import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import CommitmentItem from "./CommitmentItem";
import { Loader2 } from "lucide-react";

interface Commitment {
  id: string;
  title: string;
  commitment_time: string;
  commitment_date: string;
  completed: boolean;
  image_url?: string | null;
}

interface CommitmentListProps {
  selectedDate: Date;
  userId: string;
}

const CommitmentList = ({ selectedDate, userId }: CommitmentListProps) => {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommitments();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('commitments_changes')
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
  }, [selectedDate, userId]);

  const fetchCommitments = async () => {
    try {
      const { data, error } = await supabase
        .from("commitments")
        .select("id, title, commitment_time, commitment_date, completed, image_url")
        .eq("user_id", userId)
        .eq("commitment_date", format(selectedDate, "yyyy-MM-dd"))
        .order("commitment_time", { ascending: true });

      if (error) throw error;

      setCommitments(data || []);
    } catch (error) {
      console.error("Error fetching commitments:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (commitments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No commitments for this day yet.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Click "Make Commitment" to get started! 💪
        </p>
      </div>
    );
  }

  const completedCount = commitments.filter(c => c.completed).length;
  const totalCount = commitments.length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <p className="text-sm text-muted-foreground">
          {completedCount} of {totalCount} completed
        </p>
        <p className="text-xs text-muted-foreground">
          {20 - totalCount} slots remaining
        </p>
      </div>

      <div className="space-y-3">
        {commitments.map((commitment) => (
          <CommitmentItem
            key={commitment.id}
            commitment={commitment}
            onUpdate={fetchCommitments}
          />
        ))}
      </div>
    </div>
  );
};

export default CommitmentList;
