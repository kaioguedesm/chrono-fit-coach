-- Create table for workout sharing
CREATE TABLE public.workout_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_plan_id uuid NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL,
  share_token text NOT NULL UNIQUE,
  title text,
  description text,
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  view_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_shares ENABLE ROW LEVEL SECURITY;

-- Public can view active shares
CREATE POLICY "Anyone can view active workout shares"
ON public.workout_shares
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Users can create shares for their own workouts
CREATE POLICY "Users can create shares for their workouts"
ON public.workout_shares
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workout_plans
    WHERE workout_plans.id = workout_plan_id
    AND workout_plans.user_id = auth.uid()
  )
);

-- Users can manage their own shares
CREATE POLICY "Users can update their own shares"
ON public.workout_shares
FOR UPDATE
USING (shared_by = auth.uid())
WITH CHECK (shared_by = auth.uid());

-- Users can delete their own shares
CREATE POLICY "Users can delete their own shares"
ON public.workout_shares
FOR DELETE
USING (shared_by = auth.uid());

-- Create index for faster token lookups
CREATE INDEX idx_workout_shares_token ON workout_shares(share_token);

-- Create function to generate unique share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  token text := '';
  i integer;
BEGIN
  FOR i IN 1..12 LOOP
    token := token || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN token;
END;
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_workout_shares_updated_at
BEFORE UPDATE ON public.workout_shares
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();