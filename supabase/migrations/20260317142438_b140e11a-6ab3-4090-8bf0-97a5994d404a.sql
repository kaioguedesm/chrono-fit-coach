-- Add free_access column to profiles table
ALTER TABLE public.profiles ADD COLUMN free_access boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.free_access IS 'When true, user bypasses subscription paywall';