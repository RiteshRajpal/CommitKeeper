-- Create storage bucket for commitment images
INSERT INTO storage.buckets (id, name, public)
VALUES ('commitment-images', 'commitment-images', true)
ON CONFLICT (id) DO NOTHING;

-- Add image_url column to commitments table
ALTER TABLE commitments 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Storage policies for commitment images
CREATE POLICY "Users can view commitment images"
ON storage.objects FOR SELECT
USING (bucket_id = 'commitment-images');

CREATE POLICY "Users can upload their own commitment images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'commitment-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own commitment images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'commitment-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);