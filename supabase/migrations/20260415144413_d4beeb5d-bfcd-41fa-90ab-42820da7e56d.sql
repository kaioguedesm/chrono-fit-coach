
-- Daily check-ins table
CREATE TABLE public.daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_done BOOLEAN DEFAULT false,
  diet_followed TEXT DEFAULT 'no' CHECK (diet_followed IN ('yes', 'partial', 'no')),
  water_ml INTEGER DEFAULT 0,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 5),
  pain_level INTEGER DEFAULT 0 CHECK (pain_level BETWEEN 0 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, check_date)
);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkins" ON public.daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON public.daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkins" ON public.daily_checkins FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own checkins" ON public.daily_checkins FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Block anon daily_checkins" ON public.daily_checkins FOR ALL TO anon USING (false);

-- Weekly missions table
CREATE TABLE public.weekly_missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  mission_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value INTEGER NOT NULL DEFAULT 1,
  current_value INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  reward_badge TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start, mission_type)
);

ALTER TABLE public.weekly_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own missions" ON public.weekly_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own missions" ON public.weekly_missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own missions" ON public.weekly_missions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own missions" ON public.weekly_missions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Block anon weekly_missions" ON public.weekly_missions FOR ALL TO anon USING (false);

-- User levels table
CREATE TABLE public.user_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_level TEXT NOT NULL DEFAULT 'iniciante' CHECK (current_level IN ('iniciante', 'intermediario', 'avancado', 'elite')),
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_checkin_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own level" ON public.user_levels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own level" ON public.user_levels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own level" ON public.user_levels FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Block anon user_levels" ON public.user_levels FOR ALL TO anon USING (false);

CREATE TRIGGER update_user_levels_updated_at
  BEFORE UPDATE ON public.user_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_daily_checkins_user_date ON public.daily_checkins(user_id, check_date DESC);
CREATE INDEX idx_weekly_missions_user_week ON public.weekly_missions(user_id, week_start DESC);
