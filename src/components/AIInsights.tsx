import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Brain, TrendingUp, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIInsightsProps {
  userId: string;
}

const AIInsights = ({ userId }: AIInsightsProps) => {
  const [patterns, setPatterns] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyzePatterns = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('analyze-behavior', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      if (error) throw error;

      if (data.patterns) {
        setPatterns(data.patterns);
        toast({
          title: "Patterns Analyzed! 🧠",
          description: "Your behavior insights have been updated.",
        });
      } else {
        toast({
          title: "Keep Going!",
          description: data.message || "Complete more commitments to see patterns.",
        });
      }
    } catch (error: any) {
      console.error('Error analyzing patterns:', error);
      toast({
        title: "Analysis Error",
        description: error.message || "Failed to analyze patterns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch existing patterns on mount
    const fetchPatterns = async () => {
      const { data } = await supabase
        .from('commitment_patterns')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data) {
        setPatterns(data);
      }
    };

    fetchPatterns();
  }, [userId]);

  return (
    <Card className="p-6 shadow-soft">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Insights</h3>
        </div>
        <Button 
          onClick={analyzePatterns} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Analyze'
          )}
        </Button>
      </div>

      {patterns ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-success mt-0.5" />
            <div>
              <p className="text-sm font-medium">Completion Rate</p>
              <p className="text-2xl font-bold text-success">
                {(patterns.average_completion_rate * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium">Typical Completion Time</p>
              <p className="text-lg font-semibold">
                {patterns.typical_completion_hour}:00
              </p>
              <p className="text-xs text-muted-foreground">
                AI will optimize reminders for this time
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Preferred Days</p>
            <div className="flex flex-wrap gap-2">
              {patterns.preferred_days?.map((day: string) => (
                <Badge key={day} variant="secondary" className="capitalize">
                  {day}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">
            No patterns yet. Complete some commitments first!
          </p>
        </div>
      )}
    </Card>
  );
};

export default AIInsights;
