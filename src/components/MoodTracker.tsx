import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Smile, Meh, Frown, Battery, BatteryMedium, BatteryLow } from "lucide-react";

interface MoodTrackerProps {
  userId: string;
}

export const MoodTracker = ({ userId }: MoodTrackerProps) => {
  const [mood, setMood] = useState<string>("");
  const [energyLevel, setEnergyLevel] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastMood, setLastMood] = useState<any>(null);

  useEffect(() => {
    fetchLastMood();
  }, [userId]);

  const fetchLastMood = async () => {
    const { data } = await supabase
      .from("mood_logs")
      .select("*")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setLastMood(data);
    }
  };

  const handleSubmit = async () => {
    if (!mood || !energyLevel) {
      toast.error("Please select both mood and energy level");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("mood_logs").insert({
      user_id: userId,
      mood,
      energy_level: energyLevel,
      notes: notes || null,
    });

    if (error) {
      toast.error("Failed to log mood");
    } else {
      toast.success("Mood logged successfully! 🌟");
      setMood("");
      setEnergyLevel("");
      setNotes("");
      fetchLastMood();
    }
    setLoading(false);
  };

  const moodOptions = [
    { value: "happy", label: "Happy", icon: Smile, color: "text-green-500" },
    { value: "neutral", label: "Neutral", icon: Meh, color: "text-yellow-500" },
    { value: "stressed", label: "Stressed", icon: Frown, color: "text-red-500" },
  ];

  const energyOptions = [
    { value: "high", label: "High", icon: Battery, color: "text-green-500" },
    { value: "medium", label: "Medium", icon: BatteryMedium, color: "text-yellow-500" },
    { value: "low", label: "Low", icon: BatteryLow, color: "text-red-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>How are you feeling?</Label>
          <div className="grid grid-cols-3 gap-2">
            {moodOptions.map(({ value, label, icon: Icon, color }) => (
              <Button
                key={value}
                variant={mood === value ? "default" : "outline"}
                className="flex flex-col h-auto py-4"
                onClick={() => setMood(value)}
              >
                <Icon className={`h-6 w-6 mb-2 ${mood === value ? "" : color}`} />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Energy Level</Label>
          <div className="grid grid-cols-3 gap-2">
            {energyOptions.map(({ value, label, icon: Icon, color }) => (
              <Button
                key={value}
                variant={energyLevel === value ? "default" : "outline"}
                className="flex flex-col h-auto py-4"
                onClick={() => setEnergyLevel(value)}
              >
                <Icon className={`h-6 w-6 mb-2 ${energyLevel === value ? "" : color}`} />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How are you feeling today?"
            rows={3}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "Logging..." : "Log Mood"}
        </Button>

        {lastMood && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Last logged mood:</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="capitalize font-medium">{lastMood.mood}</span>
              <span>•</span>
              <span className="capitalize">{lastMood.energy_level} energy</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
