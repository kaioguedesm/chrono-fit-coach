-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('personal', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Personal trainers can view all roles"
  ON public.user_roles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'personal'));

-- Add approval fields to workout_plans
ALTER TABLE public.workout_plans
ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN rejection_reason TEXT;

-- Update existing workout_plans to be approved (backward compatibility)
UPDATE public.workout_plans
SET approval_status = 'approved'
WHERE created_by = 'user';

-- Create index for better performance
CREATE INDEX idx_workout_plans_approval ON public.workout_plans(approval_status, user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id, role);

-- Update RLS policies for workout_plans to include approval logic
DROP POLICY IF EXISTS "Users can view only their own workout plans" ON public.workout_plans;

CREATE POLICY "Users can view their approved workout plans"
  ON public.workout_plans
  FOR SELECT
  USING (
    auth.uid() = user_id 
    AND (
      approval_status = 'approved' 
      OR public.has_role(auth.uid(), 'personal')
    )
  );

CREATE POLICY "Personal trainers can view all workout plans"
  ON public.workout_plans
  FOR SELECT
  USING (public.has_role(auth.uid(), 'personal'));

-- Personal trainers can update approval status
CREATE POLICY "Personal trainers can approve workouts"
  ON public.workout_plans
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'personal'))
  WITH CHECK (public.has_role(auth.uid(), 'personal'));