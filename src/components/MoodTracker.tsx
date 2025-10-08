import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Smile, Zap, Meh, Cloud, Frown, AlertCircle } from "lucide-react";

interface MoodTrackerProps {
  onMoodSubmit: (mood: string, energy: number) => void;
}

const moods = [
  { value: 'happy', label: 'Happy', icon: Smile, color: 'text-success' },
  { value: 'energized', label: 'Energized', icon: Zap, color: 'text-secondary' },
  { value: 'neutral', label: 'Neutral', icon: Meh, color: 'text-muted-foreground' },
  { value: 'tired', label: 'Tired', icon: Cloud, color: 'text-muted-foreground' },
  { value: 'stressed', label: 'Stressed', icon: Frown, color: 'text-destructive' },
  { value: 'overwhelmed', label: 'Overwhelmed', icon: AlertCircle, color: 'text-destructive' },
];

const MoodTracker = ({ onMoodSubmit }: MoodTrackerProps) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState([3]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase.functions.invoke('suggest-by-mood', {
        body: {
          mood: selectedMood,
          energyLevel: energyLevel[0]
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        }
      });

      if (error) throw error;

      onMoodSubmit(selectedMood, energyLevel[0]);

      toast({
        title: "Mood logged! 🎯",
        description: "Getting personalized recommendations...",
      });
    } catch (error: any) {
      console.error('Error logging mood:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to log mood",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 shadow-soft animate-slide-up">
      <h3 className="text-lg font-semibold mb-4">How are you feeling?</h3>
      
      <div className="grid grid-cols-3 gap-3 mb-6">
        {moods.map((mood) => {
          const Icon = mood.icon;
          return (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                selectedMood === mood.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card'
              }`}
            >
              <Icon className={`w-6 h-6 mx-auto mb-2 ${mood.color}`} />
              <p className="text-xs font-medium">{mood.label}</p>
            </button>
          );
        })}
      </div>

      <div className="space-y-2 mb-6">
        <Label>Energy Level: {energyLevel[0]}/5</Label>
        <Slider
          value={energyLevel}
          onValueChange={setEnergyLevel}
          min={1}
          max={5}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={!selectedMood || loading}
        variant="hero"
        className="w-full"
      >
        {loading ? 'Getting Recommendations...' : 'Get Smart Suggestions'}
      </Button>
    </Card>
  );
};

export default MoodTracker;
