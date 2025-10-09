-- Create table for meal photo logs
CREATE TABLE public.meal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  photo_url text NOT NULL,
  meal_name text,
  total_calories integer,
  total_protein numeric,
  total_carbs numeric,
  total_fat numeric,
  food_items jsonb,
  ai_analysis text,
  created_at timestamptz NOT NULL DEFAULT now(),
  meal_time timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

-- Block anonymous access
CREATE POLICY "Block anonymous access to meal logs"
ON public.meal_logs
FOR ALL
USING (false);

-- Users can view only their own meal logs
CREATE POLICY "Users can view only their own meal logs"
ON public.meal_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert only their own meal logs
CREATE POLICY "Users can insert only their own meal logs"
ON public.meal_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update only their own meal logs
CREATE POLICY "Users can update only their own meal logs"
ON public.meal_logs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own meal logs
CREATE POLICY "Users can delete only their own meal logs"
ON public.meal_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Create storage bucket for meal photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for meal photos
CREATE POLICY "Users can view their own meal photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'meal-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can upload their own meal photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meal-photos'
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own meal photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'meal-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);