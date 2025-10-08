import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { X, Camera, Image as ImageIcon } from "lucide-react";
import { z } from "zod";
import { scheduleCommitmentNotifications } from "@/utils/notifications";

interface CommitmentFormProps {
  selectedDate: Date;
  onClose: () => void;
}

const commitmentSchema = z.object({
  title: z.string().trim().min(1, "Commitment cannot be empty").max(200, "Commitment too long"),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time"),
});

const CommitmentForm = ({ selectedDate, onClose }: CommitmentFormProps) => {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = commitmentSchema.safeParse({ title, time });
    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let imageUrl: string | null = null;

      // Upload image if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('commitment-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('commitment-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      const { error } = await supabase.from("commitments").insert({
        user_id: user.id,
        title: validation.data.title,
        commitment_date: format(selectedDate, "yyyy-MM-dd"),
        commitment_time: validation.data.time,
        image_url: imageUrl,
      });

      if (error) throw error;

      // Trigger AI priority analysis in background
      setTimeout(async () => {
        try {
          const { data: newCommitment } = await supabase
            .from('commitments')
            .select('id')
            .eq('user_id', user.id)
            .eq('title', validation.data.title)
            .eq('commitment_date', format(selectedDate, "yyyy-MM-dd"))
            .single();

          if (newCommitment) {
            await supabase.functions.invoke('analyze-priority', {
              body: {
                commitmentId: newCommitment.id,
                title: validation.data.title,
                commitmentDate: format(selectedDate, "yyyy-MM-dd"),
                commitmentTime: validation.data.time
              }
            });
          }
        } catch (err) {
          console.error('Priority analysis error:', err);
        }
      }, 0);

      // Schedule notifications if permissions are granted
      if ("Notification" in window) {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }
        
        if (Notification.permission === "granted") {
          const commitmentDateTime = new Date(selectedDate);
          const [hours, minutes] = validation.data.time.split(':');
          commitmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
          scheduleCommitmentNotifications(validation.data.title, commitmentDateTime);
        }
      }

      toast({
        title: "Commitment Created! 🎯",
        description: "You've got this! AI is analyzing priority...",
      });

      setTitle("");
      setTime("09:00");
      setImageFile(null);
      setImagePreview(null);
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create commitment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-6 bg-muted/50 rounded-lg border-2 border-primary/20 animate-slide-up">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Make a Commitment</h3>
        <Button type="button" variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">What do you commit to?</Label>
          <Input
            id="title"
            placeholder="e.g., Morning workout, Review project docs..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">By what time?</Label>
          <Input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Add Photo (Optional)</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1"
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Choose Image
            </Button>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageSelect}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          
          {imagePreview && (
            <div className="relative mt-2">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-32 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={handleRemoveImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <Button type="submit" variant="hero" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create Commitment"}
        </Button>
      </div>
    </form>
  );
};

export default CommitmentForm;
