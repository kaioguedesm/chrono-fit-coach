
-- Table for user transformation projects
CREATE TABLE public.transformation_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  duration_days INTEGER NOT NULL CHECK (duration_days IN (30, 45, 60, 90)),
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  current_streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for daily check-ins
CREATE TABLE public.transformation_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.transformation_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  day_number INTEGER NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, day_number)
);

-- RLS for transformation_projects
ALTER TABLE public.transformation_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
  ON public.transformation_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON public.transformation_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.transformation_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.transformation_projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS for transformation_checkins
ALTER TABLE public.transformation_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checkins"
  ON public.transformation_checkins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkins"
  ON public.transformation_checkins FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checkins"
  ON public.transformation_checkins FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Block anonymous
CREATE POLICY "Block anon transformation_projects"
  ON public.transformation_projects FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Block anon transformation_checkins"
  ON public.transformation_checkins FOR ALL
  TO anon
  USING (false);
