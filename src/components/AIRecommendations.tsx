import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight } from "lucide-react";

interface AIRecommendationsProps {
  recommendations: {
    recommended_order?: string[];
    reasoning?: string;
  } | null;
  onApply: () => void;
}

const AIRecommendations = ({ recommendations, onApply }: AIRecommendationsProps) => {
  const [applied, setApplied] = useState(false);

  if (!recommendations || !recommendations.recommended_order) {
    return null;
  }

  const handleApply = () => {
    setApplied(true);
    onApply();
  };

  return (
    <Card className="p-6 shadow-soft border-2 border-primary/20 bg-primary/5 animate-slide-up">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center animate-pulse-glow">
          <Lightbulb className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">AI Recommendations</h3>
          <p className="text-sm text-muted-foreground">
            Based on your mood and energy
          </p>
        </div>
      </div>

      {recommendations.reasoning && (
        <p className="text-sm mb-4 p-3 bg-background/50 rounded-lg">
          {recommendations.reasoning}
        </p>
      )}

      <div className="space-y-2 mb-4">
        <p className="text-sm font-medium">Suggested Order:</p>
        {recommendations.recommended_order.map((task, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-background rounded-lg">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {index + 1}
            </span>
            <span className="text-sm flex-1">{task}</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        ))}
      </div>

      <Button 
        onClick={handleApply}
        disabled={applied}
        variant="hero"
        className="w-full"
      >
        {applied ? 'Applied!' : 'Apply This Order'}
      </Button>
    </Card>
  );
};

export default AIRecommendations;
